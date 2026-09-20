import os
import sys
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.db import (
    init_db,
    close_db,
    buffer_insert_telemetry,
    batch_flush_worker,
    record_alert_if_new,
)
from app.protocols import SerialManager, MqttManager
from app.analytics import PoleKalmanBank, AnomalyDetectorBank, MultiSensorFusionEngine
from app.connection_manager import ws_manager
from app.routers import (
    create_ports_router,
    create_mqtt_router,
    create_telemetry_router,
    create_alerts_router,
    create_ws_router,
    create_ai_assistant_router,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("main")

# Analytics engines
kalman_bank = PoleKalmanBank()
anomaly_bank = AnomalyDetectorBank()
fusion_engine = MultiSensorFusionEngine()


async def ingest_packet(packet: Dict[str, Any]):
    """Decoupled ingestion pipeline: Kalman filtering -> Anomaly detection -> Hazard fusion -> DB & WS."""
    try:
        pole_id = int(packet.get("pole_id", 1))

        # 1. Kalman signal smoothing for analog sensors
        packet["water_depth"] = kalman_bank.filter_value(pole_id, "water_depth", packet.get("water_depth"))
        packet["temperature"] = kalman_bank.filter_value(pole_id, "temperature", packet.get("temperature"))
        packet["voltage"] = kalman_bank.filter_value(pole_id, "voltage", packet.get("voltage"))

        # 2. Streaming statistical anomaly evaluation (EWMA & CUSUM)
        v_diag = anomaly_bank.analyze_sensor(pole_id, "voltage", packet.get("voltage"))
        if v_diag["is_anomaly"]:
            packet["voltage_anomaly"] = v_diag

        # 3. Multi-sensor hazard fusion (Electrocution Risk, Fire Index, Tilt debounce)
        hazards = fusion_engine.evaluate_hazards(packet)
        for h in hazards:
            new_alert = await record_alert_if_new(
                pole_id=h["pole_id"],
                alert_type=h["alert_type"],
                severity=h["severity"],
                title=h["title"],
                description=h["description"],
                trigger_value=h.get("trigger_value"),
                unit=h.get("unit", "")
            )
            if new_alert:
                await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})
                await mqtt_mgr.publish_alert(new_alert)

        # 4. Asynchronous database buffering and WebSocket broadcast
        await buffer_insert_telemetry(packet)
        await ws_manager.broadcast(packet)

    except Exception as e:
        logger.error(f"Error processing telemetry packet: {e}")


# Protocol managers
serial_mgr = SerialManager(broadcast_callback=ingest_packet)
mqtt_mgr = MqttManager(broadcast_callback=ingest_packet)

flush_task: asyncio.Task = None
serial_task: asyncio.Task = None
mqtt_task: asyncio.Task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global flush_task, serial_task, mqtt_task
    logger.info("Initializing PostgreSQL pool and tables...")
    await init_db()

    logger.info("Starting background flusher, serial ingestion, and MQTT client...")
    flush_task = asyncio.create_task(batch_flush_worker())
    serial_task = asyncio.create_task(serial_mgr.run_loop())
    mqtt_task = asyncio.create_task(mqtt_mgr.run_loop())

    yield

    logger.info("Gracefully shutting down services...")
    serial_mgr.stop()
    mqtt_mgr.stop()
    for t in (serial_task, mqtt_task, flush_task):
        if t:
            t.cancel()
    await close_db()


app = FastAPI(title="NIRIKSHA Industrial IoT Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(create_ports_router(serial_mgr))
app.include_router(create_mqtt_router(mqtt_mgr))
app.include_router(create_telemetry_router(serial_mgr))
app.include_router(create_alerts_router())
app.include_router(create_ws_router(serial_mgr, mqtt_mgr))
app.include_router(create_ai_assistant_router())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.SERVER_HOST, port=settings.SERVER_PORT, reload=False)
