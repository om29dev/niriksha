"""
API Router for PostgreSQL Telemetry Queries and Database Wipes.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import PlainTextResponse
from database import (
    get_recent_telemetry,
    clear_telemetry,
    clear_all_alerts,
    get_db_config,
    reconnect_db,
    get_telemetry_history,
    get_telemetry_stats
)
from app.connection_manager import ws_manager

class DatabaseConfigRequest(BaseModel):
    host: str
    port: int = 5432
    user: str
    password: str
    database: str

def create_telemetry_router(serial_mgr):
    router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

    @router.get("/db-config")
    async def fetch_db_config():
        """Returns current active database connection configuration."""
        return get_db_config()

    @router.post("/db-config")
    async def update_db_config(req: DatabaseConfigRequest):
        """Tests credentials, reconnects pool, and updates backend .env."""
        try:
            result = await reconnect_db(
                host=req.host,
                port=req.port,
                user=req.user,
                password=req.password,
                database=req.database
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.post("/reset")
    async def reset_telemetry():
        """Wipes PostgreSQL telemetry data, alerts, and clears memory buffers."""
        await clear_telemetry()
        await clear_all_alerts()
        serial_mgr.seq = 1
        # Broadcast reset event over active websockets
        await ws_manager.broadcast({"type": "TELEMETRY_RESET"})
        return {"status": "success", "message": "Telemetry and alerts database tables reset successfully."}

    @router.get("/recent")
    async def get_recent(
        limit: int = 200,
        pole_id: Optional[int] = None,
        since_timestamp: Optional[float] = None
    ):
        data = await get_recent_telemetry(limit=limit, pole_id=pole_id, since_timestamp=since_timestamp)
        return {"data": data}

    @router.get("/history")
    async def get_history(
        limit: int = 50,
        offset: int = 0,
        pole_id: Optional[int] = None,
        since_timestamp: Optional[float] = None,
        until_timestamp: Optional[float] = None,
        is_upright: Optional[bool] = None
    ):
        """Returns paginated historical records from PostgreSQL with total count."""
        result = await get_telemetry_history(
            limit=limit,
            offset=offset,
            pole_id=pole_id,
            since_timestamp=since_timestamp,
            until_timestamp=until_timestamp,
            is_upright=is_upright
        )
        return result

    @router.get("/stats")
    async def get_stats(
        since_timestamp: Optional[float] = None,
        until_timestamp: Optional[float] = None,
        pole_id: Optional[int] = None
    ):
        """Returns aggregated telemetry stats (min, max, avg) for generating audit reports."""
        result = await get_telemetry_stats(
            since_timestamp=since_timestamp,
            until_timestamp=until_timestamp,
            pole_id=pole_id
        )
        return result

    @router.get("/export")
    async def export_telemetry_csv(
        pole_id: Optional[int] = None,
        since_timestamp: Optional[float] = None,
        limit: int = 1000
    ):
        """Generates downloadable CSV export of telemetry records."""
        records = await get_recent_telemetry(limit=limit, pole_id=pole_id, since_timestamp=since_timestamp)
        
        headers = [
            "timestamp", "created_at", "pole_id", "seq", "is_upright",
            "voltage_v", "current_ma", "power_w", "water_depth_cm",
            "temperature_c", "humidity_pct", "mq7_ppm", "mq135_ppm", "mq136_ppm", "mq2_ppm"
        ]
        
        lines = [",".join(headers)]
        for r in records:
            lines.append(",".join([
                str(r.get("timestamp") or ""),
                str(r.get("created_at") or ""),
                str(r.get("pole_id") or ""),
                str(r.get("seq") or ""),
                str(r.get("is_upright") if r.get("is_upright") is not None else ""),
                str(r.get("voltage") if r.get("voltage") is not None else ""),
                str(r.get("current_ma") if r.get("current_ma") is not None else ""),
                str(r.get("power") if r.get("power") is not None else ""),
                str(r.get("water_depth") if r.get("water_depth") is not None else ""),
                str(r.get("temperature") if r.get("temperature") is not None else ""),
                str(r.get("humidity") if r.get("humidity") is not None else ""),
                str(r.get("mq7") if r.get("mq7") is not None else ""),
                str(r.get("mq135") if r.get("mq135") is not None else ""),
                str(r.get("mq136") if r.get("mq136") is not None else ""),
                str(r.get("mq2") if r.get("mq2") is not None else "")
            ]))
            
        csv_content = "\n".join(lines)
        return PlainTextResponse(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=telemetry_export.csv"}
        )

    return router
