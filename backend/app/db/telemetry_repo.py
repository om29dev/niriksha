import json
import logging
from typing import List, Dict, Any, Optional
from app.db.connection import get_pool
from app.db.buffer import clear_buffer

logger = logging.getLogger("db.telemetry_repo")


async def get_recent_telemetry(
    limit: int = 200,
    pole_id: Optional[int] = None,
    since_timestamp: Optional[float] = None
) -> List[Dict[str, Any]]:
    """Fetches latest telemetry rows ordered chronologically for frontend hydration."""
    pool = get_pool()
    if not pool:
        return []

    try:
        async with pool.acquire() as conn:
            query = """
                SELECT seq, timestamp, pole_id, mesh_node_id, temperature, pressure, humidity,
                       water_depth, is_upright, voltage, current_ma, power, energy, frequency, pf,
                       mq7, mq135, mq136, mq2, sensors_json, status, source, created_at
                FROM telemetry
            """
            conditions, args, idx = [], [], 1
            if pole_id is not None:
                conditions.append(f"pole_id = ${idx}")
                args.append(pole_id)
                idx += 1
            if since_timestamp is not None:
                conditions.append(f"timestamp >= ${idx}")
                args.append(since_timestamp)
                idx += 1

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += f" ORDER BY id DESC LIMIT ${idx}"
            args.append(limit)

            rows = await conn.fetch(query, *args)
            result = []
            for r in reversed(rows):
                item = dict(r)
                if item.get("sensors_json"):
                    try:
                        raw = item["sensors_json"]
                        item["sensors"] = json.loads(raw) if isinstance(raw, str) else raw
                    except Exception:
                        pass
                result.append(item)
            return result
    except Exception as e:
        logger.error(f"Error querying recent telemetry: {e}")
        return []


async def get_telemetry_history(
    limit: int = 100,
    offset: int = 0,
    pole_id: Optional[int] = None,
    since_timestamp: Optional[float] = None,
    until_timestamp: Optional[float] = None,
    is_upright: Optional[bool] = None
) -> Dict[str, Any]:
    """Fetches paginated telemetry with total count for historical exploration."""
    pool = get_pool()
    if not pool:
        return {"data": [], "total": 0, "limit": limit, "offset": offset}

    try:
        async with pool.acquire() as conn:
            conditions, args, idx = [], [], 1
            if pole_id is not None:
                conditions.append(f"pole_id = ${idx}")
                args.append(pole_id)
                idx += 1
            if since_timestamp is not None:
                conditions.append(f"timestamp >= ${idx}")
                args.append(since_timestamp)
                idx += 1
            if until_timestamp is not None:
                conditions.append(f"timestamp <= ${idx}")
                args.append(until_timestamp)
                idx += 1
            if is_upright is not None:
                conditions.append(f"is_upright = ${idx}")
                args.append(is_upright)
                idx += 1

            where = f" WHERE {' AND '.join(conditions)}" if conditions else ""
            total = await conn.fetchval(f"SELECT COUNT(*) FROM telemetry{where}", *args)

            query = f"""
                SELECT seq, timestamp, pole_id, mesh_node_id, temperature, pressure, humidity,
                       water_depth, is_upright, voltage, current_ma, power, energy, frequency, pf,
                       mq7, mq135, mq136, mq2, sensors_json, status, source, created_at
                FROM telemetry
                {where}
                ORDER BY timestamp DESC
                LIMIT ${idx} OFFSET ${idx + 1}
            """
            rows = await conn.fetch(query, *(args + [limit, offset]))
            items = []
            for r in rows:
                row_dict = dict(r)
                if row_dict.get("created_at"):
                    row_dict["created_at"] = row_dict["created_at"].isoformat()
                if row_dict.get("sensors_json"):
                    try:
                        raw = row_dict["sensors_json"]
                        row_dict["sensors"] = json.loads(raw) if isinstance(raw, str) else raw
                    except Exception:
                        pass
                items.append(row_dict)

            return {"data": items, "total": total, "limit": limit, "offset": offset}
    except Exception as e:
        logger.error(f"Error querying telemetry history: {e}")
        return {"data": [], "total": 0, "limit": limit, "offset": offset}


async def get_telemetry_stats(
    since_timestamp: Optional[float] = None,
    until_timestamp: Optional[float] = None,
    pole_id: Optional[int] = None
) -> Dict[str, Any]:
    """Aggregates min, max, avg statistics for audit reports."""
    pool = get_pool()
    if not pool:
        return {"poles": {}, "sample_count": 0}

    try:
        async with pool.acquire() as conn:
            conditions, args, idx = [], [], 1
            if pole_id is not None:
                conditions.append(f"pole_id = ${idx}")
                args.append(pole_id)
                idx += 1
            if since_timestamp is not None:
                conditions.append(f"timestamp >= ${idx}")
                args.append(since_timestamp)
                idx += 1
            if until_timestamp is not None:
                conditions.append(f"timestamp <= ${idx}")
                args.append(until_timestamp)
                idx += 1

            where = f" WHERE {' AND '.join(conditions)}" if conditions else ""
            query = f"""
                SELECT 
                    pole_id, COUNT(*) as sample_count,
                    MIN(temperature) as min_temp, MAX(temperature) as max_temp, AVG(temperature) as avg_temp,
                    MIN(humidity) as min_humidity, MAX(humidity) as max_humidity, AVG(humidity) as avg_humidity,
                    MIN(water_depth) as min_depth, MAX(water_depth) as max_depth, AVG(water_depth) as avg_depth,
                    MIN(voltage) as min_voltage, MAX(voltage) as max_voltage, AVG(voltage) as avg_voltage,
                    MIN(current_ma) as min_current, MAX(current_ma) as max_current, AVG(current_ma) as avg_current,
                    MIN(power) as min_power, MAX(power) as max_power, AVG(power) as avg_power,
                    MIN(mq7) as min_mq7, MAX(mq7) as max_mq7, AVG(mq7) as avg_mq7,
                    MIN(mq135) as min_mq135, MAX(mq135) as max_mq135, AVG(mq135) as avg_mq135,
                    MIN(mq136) as min_mq136, MAX(mq136) as max_mq136, AVG(mq136) as avg_mq136,
                    MIN(mq2) as min_mq2, MAX(mq2) as max_mq2, AVG(mq2) as avg_mq2,
                    SUM(CASE WHEN is_upright = false THEN 1 ELSE 0 END) as tilt_incident_count
                FROM telemetry
                {where}
                GROUP BY pole_id ORDER BY pole_id ASC
            """
            rows = await conn.fetch(query, *args)
            poles, total_samples = {}, 0
            for r in rows:
                p_id = r["pole_id"]
                s_count = r["sample_count"]
                total_samples += s_count
                poles[p_id] = {
                    "sample_count": s_count,
                    "tilt_incidents": r["tilt_incident_count"],
                    "temperature": {"min": r["min_temp"], "max": r["max_temp"], "avg": round(r["avg_temp"], 2) if r["avg_temp"] is not None else None},
                    "humidity": {"min": r["min_humidity"], "max": r["max_humidity"], "avg": round(r["avg_humidity"], 2) if r["avg_humidity"] is not None else None},
                    "water_depth": {"min": r["min_depth"], "max": r["max_depth"], "avg": round(r["avg_depth"], 2) if r["avg_depth"] is not None else None},
                    "voltage": {"min": r["min_voltage"], "max": r["max_voltage"], "avg": round(r["avg_voltage"], 2) if r["avg_voltage"] is not None else None},
                    "current_ma": {"min": r["min_current"], "max": r["max_current"], "avg": round(r["avg_current"], 2) if r["avg_current"] is not None else None},
                    "power": {"min": r["min_power"], "max": r["max_power"], "avg": round(r["avg_power"], 2) if r["avg_power"] is not None else None},
                    "mq7": {"min": r["min_mq7"], "max": r["max_mq7"], "avg": round(r["avg_mq7"], 2) if r["avg_mq7"] is not None else None},
                    "mq135": {"min": r["min_mq135"], "max": r["max_mq135"], "avg": round(r["avg_mq135"], 2) if r["avg_mq135"] is not None else None},
                    "mq136": {"min": r["min_mq136"], "max": r["max_mq136"], "avg": round(r["avg_mq136"], 2) if r["avg_mq136"] is not None else None},
                    "mq2": {"min": r["min_mq2"], "max": r["max_mq2"], "avg": round(r["avg_mq2"], 2) if r["avg_mq2"] is not None else None},
                }
            return {"poles": poles, "sample_count": total_samples}
    except Exception as e:
        logger.error(f"Error querying telemetry stats: {e}")
        return {"poles": {}, "sample_count": 0}


async def clear_telemetry():
    """Truncates telemetry table and flushes memory buffers."""
    clear_buffer()
    pool = get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute("TRUNCATE TABLE telemetry;")
                logger.info("Telemetry records truncated.")
        except Exception as e:
            logger.error(f"Failed to truncate telemetry: {e}")
