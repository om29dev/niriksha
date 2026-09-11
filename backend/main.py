import os
import sys
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is always on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from database import init_db, close_db, buffer_insert_telemetry, batch_flush_worker, record_alert_if_new
from serial_manager import SerialManager
from app.connection_manager import ws_manager
from app.routers import create_ports_router, create_telemetry_router, create_ws_router, create_alerts_router, create_ai_assistant_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("main")


async def evaluate_and_record_alerts(packet: Dict[str, Any]):
    """Evaluates telemetry packet against hazard thresholds and records persistent alerts into PostgreSQL."""
    try:
        pole_id = int(packet.get("pole_id", 1))
        
        # 1. High Voltage Surge (> 5.0V)
        volt = packet.get("voltage")
        if volt is not None and volt > 5.0:
            new_alert = await record_alert_if_new(
                pole_id=pole_id,
                alert_type="voltage_surge",
                severity="critical",
                title=f"High Voltage Surge ({volt:.1f}V)",
                description=f"Water probe measured electrification potential exceeding 5.0V safety margin.",
                trigger_value=float(volt),
                unit="V"
            )
            if new_alert:
                await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})

        # 2. Structural Pole Collapse / Tilt
        is_upright = packet.get("is_upright")
        if is_upright is False:
            new_alert = await record_alert_if_new(
                pole_id=pole_id,
                alert_type="tilt_collapse",
                severity="critical",
                title="Structural Tilt / Pole Collapse Detected",
                description="Hardware gyro/tilt sensor reported horizontal or inverted state.",
                trigger_value=0.0,
                unit=""
            )
            if new_alert:
                await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})

        # 3. Flood Submersion Hazard (> 100cm)
        water_depth = packet.get("water_depth")
        if water_depth is not None and water_depth > 100.0:
            new_alert = await record_alert_if_new(
                pole_id=pole_id,
                alert_type="flood_submersion",
                severity="warning",
                title=f"Water Submersion Flood Level ({water_depth:.1f}cm)",
                description="Submersion depth surpassed the critical 100cm safety line.",
                trigger_value=float(water_depth),
                unit="cm"
            )
            if new_alert:
                await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})

        # 4. Temperature Hazard: Thermal Warning (> 45°C) or Extreme Fire Outbreak (> 60°C)
        temp = packet.get("temperature")
        if temp is not None:
            if temp >= 60.0:
                new_alert = await record_alert_if_new(
                    pole_id=pole_id,
                    alert_type="fire_emergency",
                    severity="critical",
                    title=f"Extreme Fire / Thermal Emergency ({temp:.1f}°C)",
                    description="Severe blaze temperature spike detected. Immediate fire department dispatch required.",
                    trigger_value=float(temp),
                    unit="°C"
                )
                if new_alert:
                    await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})
            elif temp > 45.0:
                new_alert = await record_alert_if_new(
                    pole_id=pole_id,
                    alert_type="high_temperature",
                    severity="warning",
                    title=f"Excessive Heat Hazard ({temp:.1f}°C)",
                    description="Ambient temperature breached the 45.0°C thermal threshold.",
                    trigger_value=float(temp),
                    unit="°C"
                )
                if new_alert:
                    await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})

        # 5. Humidity Hazard (> 85%)
        hum = packet.get("humidity")
        if hum is not None and hum > 85.0:
            new_alert = await record_alert_if_new(
                pole_id=pole_id,
                alert_type="high_humidity",
                severity="info",
                title=f"High Relative Humidity ({hum:.1f}%)",
                description="Condensation and corrosion warning for internal electronics.",
                trigger_value=float(hum),
                unit="%"
            )
            if new_alert:
                await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})

        # 6. Gas: MQ-7 Carbon Monoxide (> 50 ppm)
        mq7 = packet.get("mq7")
        if mq7 is not None and mq7 > 50.0:
            new_alert = await record_alert_if_new(
                pole_id=pole_id,
                alert_type="gas_mq7",
                severity="critical",
                title=f"Toxic CO Gas Leak ({mq7:.1f} ppm)",
                description="Dangerous carbon monoxide gas spike detected.",
                trigger_value=float(mq7),
                unit="ppm"
            )
            if new_alert:
                await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})

        # 7. Gas: MQ-135 Air Quality / Ammonia (> 150 ppm)
        mq135 = packet.get("mq135")
        if mq135 is not None and mq135 > 150.0:
            new_alert = await record_alert_if_new(
                pole_id=pole_id,
                alert_type="gas_mq135",
                severity="warning",
                title=f"Air Quality Deterioration ({mq135:.1f} ppm)",
                description="Elevated particulate/chemical atmosphere reading.",
                trigger_value=float(mq135),
                unit="ppm"
            )
            if new_alert:
                await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})

        # 8. Gas: MQ-136 Hydrogen Sulfide (> 15 ppm)
        mq136 = packet.get("mq136")
        if mq136 is not None and mq136 > 15.0:
            new_alert = await record_alert_if_new(
                pole_id=pole_id,
                alert_type="gas_mq136",
                severity="warning",
                title=f"Toxic H2S Sewer Gas Breach ({mq136:.1f} ppm)",
                description="Hydrogen sulfide gas threshold exceeded.",
                trigger_value=float(mq136),
                unit="ppm"
            )
            if new_alert:
                await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})

        # 9. Gas: MQ-2 Combustible Gas (> 300 ppm)
        mq2 = packet.get("mq2")
        if mq2 is not None and mq2 > 300.0:
            new_alert = await record_alert_if_new(
                pole_id=pole_id,
                alert_type="gas_mq2",
                severity="warning",
                title=f"Combustible Gas Leak ({mq2:.1f} ppm)",
                description="Elevated LPG / Methane / smoke levels detected.",
                trigger_value=float(mq2),
                unit="ppm"
            )
            if new_alert:
                await ws_manager.broadcast({"type": "NEW_ALERT", "alert": new_alert})

    except Exception as e:
        logger.error(f"Error evaluating alerts: {e}")


async def broadcast_packet(packet: Dict[str, Any]):
    """Decoupled ingestion: buffers to PostgreSQL connection pool & broadcasts over WebSocket."""
    # 1. Non-blocking PostgreSQL buffer append
    try:
        await buffer_insert_telemetry(packet)
    except Exception as e:
        logger.error(f"Failed to buffer telemetry: {e}")

    # 2. Check for hazard threshold conditions and persist alerts
    await evaluate_and_record_alerts(packet)

    # 3. WebSocket Push to local UI clients
    await ws_manager.broadcast(packet)


serial_mgr = SerialManager(broadcast_callback=broadcast_packet, use_simulation=True)
ingestion_task: asyncio.Task = None
flush_task: asyncio.Task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ingestion_task, flush_task
    logger.info("Initializing PostgreSQL connection pool & tables...")
    await init_db()
    
    logger.info("Starting background batch flusher & serial ingestion...")
    flush_task = asyncio.create_task(batch_flush_worker())
    ingestion_task = asyncio.create_task(serial_mgr.run_loop())
    yield
    logger.info("Shutting down serial ingestion, flusher, and database pool...")
    serial_mgr.stop()
    if ingestion_task:
        ingestion_task.cancel()
    if flush_task:
        flush_task.cancel()
    await close_db()


app = FastAPI(title="Offline IoT Dashboard Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(create_ports_router(serial_mgr))
app.include_router(create_telemetry_router(serial_mgr))
app.include_router(create_alerts_router())
app.include_router(create_ws_router(serial_mgr))
app.include_router(create_ai_assistant_router())


if __name__ == "__main__":
    import uvicorn
    server_host = os.getenv("SERVER_HOST", "127.0.0.1")
    server_port = int(os.getenv("SERVER_PORT", "8000"))
    uvicorn.run("main:app", host=server_host, port=server_port, reload=False)
