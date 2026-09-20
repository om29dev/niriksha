import json
import asyncio
import logging
from typing import List, Dict, Any
from app.core.config import settings

logger = logging.getLogger("db.buffer")

_batch_buffer: List[Dict[str, Any]] = []
_batch_lock = asyncio.Lock()


async def buffer_insert_telemetry(packet: Dict[str, Any]):
    """Decoupled high-speed ingestion: pushes packet into in-memory queue."""
    async with _batch_lock:
        _batch_buffer.append(packet)
        if len(_batch_buffer) >= settings.BATCH_MAX_SIZE:
            await flush_buffer_now()


async def flush_buffer_now():
    """Flushes buffered packets into PostgreSQL using a single multi-row transaction."""
    global _batch_buffer
    from app.db.connection import get_pool

    pool = get_pool()
    if not _batch_buffer or not pool:
        return

    to_insert = _batch_buffer[:]
    _batch_buffer = []

    records = [
        (
            p.get("seq", 0),
            float(p.get("timestamp", 0.0)),
            int(p.get("pole_id", 1)),
            p.get("mesh_node_id"),
            p.get("temperature"),
            p.get("pressure"),
            p.get("humidity"),
            p.get("water_depth"),
            p.get("is_upright"),
            p.get("voltage"),
            p.get("current_ma"),
            p.get("power"),
            p.get("energy"),
            p.get("frequency"),
            p.get("pf"),
            p.get("mq7"),
            p.get("mq135"),
            p.get("mq136"),
            p.get("mq2"),
            json.dumps(p.get("sensors", {})) if "sensors" in p else None,
            p.get("status", "NORMAL"),
            p.get("source", "SERIAL"),
            str(p)
        )
        for p in to_insert
    ]

    try:
        async with pool.acquire() as conn:
            await conn.executemany("""
                INSERT INTO telemetry (
                    seq, timestamp, pole_id, mesh_node_id, temperature, pressure, humidity,
                    water_depth, is_upright, voltage, current_ma, power, energy, frequency, pf,
                    mq7, mq135, mq136, mq2, sensors_json, status, source, raw_payload
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            """, records)
    except Exception as e:
        logger.error(f"Failed to batch insert {len(records)} telemetry records: {e}")


async def batch_flush_worker():
    """Background worker periodically flushing any uncommitted records."""
    logger.info(f"Telemetry batch flusher running every {settings.BATCH_INTERVAL_SEC}s")
    while True:
        try:
            await asyncio.sleep(settings.BATCH_INTERVAL_SEC)
            async with _batch_lock:
                await flush_buffer_now()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in batch flush worker: {e}")


def clear_buffer():
    """Clears in-memory buffer on system reset."""
    global _batch_buffer
    _batch_buffer = []
