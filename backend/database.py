import os
import json
import asyncio
import logging
from typing import List, Dict, Any, Optional
import asyncpg
from dotenv import load_dotenv

# Load environment configuration
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger("database")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_NAME = os.getenv("DB_NAME", "iot_dashboard")
MIN_POOL_SIZE = int(os.getenv("DB_MIN_POOL_SIZE", "2"))
MAX_POOL_SIZE = int(os.getenv("DB_MAX_POOL_SIZE", "10"))

BATCH_FLUSH_INTERVAL = float(os.getenv("BATCH_FLUSH_INTERVAL_MS", "300")) / 1000.0
BATCH_BUFFER_MAX = int(os.getenv("BATCH_BUFFER_MAX_SIZE", "50"))

pool: Optional[asyncpg.Pool] = None

# In-memory batch buffer for high-frequency decoupled writes
_batch_buffer: List[Dict[str, Any]] = []
_batch_lock = asyncio.Lock()


def get_db_config() -> Dict[str, Any]:
    """Returns current database connection configuration (excluding raw password for security)."""
    return {
        "host": DB_HOST,
        "port": DB_PORT,
        "user": DB_USER,
        "database": DB_NAME,
        "min_pool_size": MIN_POOL_SIZE,
        "max_pool_size": MAX_POOL_SIZE,
        "connected": pool is not None and not pool._closed if pool else False
    }


async def reconnect_db(host: str, port: int, user: str, password: str, database: str) -> Dict[str, Any]:
    """Tests connection with new credentials, persists to .env, and switches pool if valid."""
    global pool, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    
    # 1. Test test-connection first before tearing down existing pool
    test_conn = None
    try:
        test_conn = await asyncpg.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            timeout=5.0
        )
        await test_conn.execute("SELECT 1;")
    except Exception as e:
        if test_conn:
            await test_conn.close()
        raise RuntimeError(f"Connection test failed: {e}")
    finally:
        if test_conn:
            await test_conn.close()

    # 2. Close existing pool safely
    if pool:
        try:
            await _flush_buffer_now()
            await pool.close()
        except Exception as e:
            logger.warning(f"Error closing old pool: {e}")

    # 3. Update global in-memory vars
    DB_HOST = host
    DB_PORT = port
    DB_USER = user
    DB_PASSWORD = password
    DB_NAME = database

    # 4. Create new pool
    pool = await asyncpg.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        min_size=MIN_POOL_SIZE,
        max_size=MAX_POOL_SIZE,
        command_timeout=60
    )

    # 5. Persist to backend/.env file
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    try:
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            keys_to_update = {
                "DB_HOST": host,
                "DB_PORT": str(port),
                "DB_USER": user,
                "DB_PASSWORD": password,
                "DB_NAME": database
            }
            updated = set()
            for line in lines:
                matched = False
                for k, v in keys_to_update.items():
                    if line.startswith(f"{k}="):
                        new_lines.append(f"{k}={v}\n")
                        updated.add(k)
                        matched = True
                        break
                if not matched:
                    new_lines.append(line)
            for k, v in keys_to_update.items():
                if k not in updated:
                    new_lines.append(f"{k}={v}\n")
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
    except Exception as env_err:
        logger.warning(f"Failed to persist credentials to .env: {env_err}")

    return {"status": "success", "message": f"Connected to PostgreSQL [{user}@{host}:{port}/{database}]"}


async def init_db():
    """Initializes asyncpg connection pool and ensures schema/indexes are created."""
    global pool
    logger.info(f"Connecting to PostgreSQL [{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}]...")
    
    pool = await asyncpg.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        min_size=MIN_POOL_SIZE,
        max_size=MAX_POOL_SIZE,
        command_timeout=60
    )

    async with pool.acquire() as conn:
        # Create high-throughput multi-pole telemetry table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS telemetry (
                id BIGSERIAL PRIMARY KEY,
                seq BIGINT,
                timestamp DOUBLE PRECISION,
                pole_id INT DEFAULT 1,
                mesh_node_id BIGINT,
                temperature DOUBLE PRECISION,
                pressure DOUBLE PRECISION,
                humidity DOUBLE PRECISION,
                water_depth DOUBLE PRECISION,
                is_upright BOOLEAN,
                voltage DOUBLE PRECISION,
                current_ma DOUBLE PRECISION,
                power DOUBLE PRECISION,
                energy DOUBLE PRECISION,
                frequency DOUBLE PRECISION,
                pf DOUBLE PRECISION,
                sensors_json JSONB,
                status VARCHAR(32) DEFAULT 'NORMAL',
                source VARCHAR(64),
                raw_payload TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Alter table if existing schema lacks columns (backward-compatible migration)
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='pole_id') THEN
                    ALTER TABLE telemetry ADD COLUMN pole_id INT DEFAULT 1;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='mesh_node_id') THEN
                    ALTER TABLE telemetry ADD COLUMN mesh_node_id BIGINT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='water_depth') THEN
                    ALTER TABLE telemetry ADD COLUMN water_depth DOUBLE PRECISION;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='is_upright') THEN
                    ALTER TABLE telemetry ADD COLUMN is_upright BOOLEAN;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='power') THEN
                    ALTER TABLE telemetry ADD COLUMN power DOUBLE PRECISION;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='energy') THEN
                    ALTER TABLE telemetry ADD COLUMN energy DOUBLE PRECISION;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='frequency') THEN
                    ALTER TABLE telemetry ADD COLUMN frequency DOUBLE PRECISION;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='pf') THEN
                    ALTER TABLE telemetry ADD COLUMN pf DOUBLE PRECISION;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='sensors_json') THEN
                    ALTER TABLE telemetry ADD COLUMN sensors_json JSONB;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='mq7') THEN
                    ALTER TABLE telemetry ADD COLUMN mq7 DOUBLE PRECISION;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='mq135') THEN
                    ALTER TABLE telemetry ADD COLUMN mq135 DOUBLE PRECISION;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='mq136') THEN
                    ALTER TABLE telemetry ADD COLUMN mq136 DOUBLE PRECISION;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telemetry' AND column_name='mq2') THEN
                    ALTER TABLE telemetry ADD COLUMN mq2 DOUBLE PRECISION;
                END IF;
            END $$;
        """)
        
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id BIGSERIAL PRIMARY KEY,
                pole_id INT NOT NULL,
                alert_type VARCHAR(64) NOT NULL,
                severity VARCHAR(32) NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                trigger_value DOUBLE PRECISION,
                unit VARCHAR(16),
                status VARCHAR(32) DEFAULT 'UNRESOLVED',
                triggered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMPTZ,
                resolved_by VARCHAR(64)
            );
        """)
        
        # Performance indexes for range queries and streaming
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp DESC);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_seq ON telemetry(seq DESC);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_pole_time ON telemetry(pole_id, timestamp DESC);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status_time ON alerts(status, triggered_at DESC);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_pole_time ON alerts(pole_id, triggered_at DESC);")
        logger.info("PostgreSQL connection pool & multi-pole schema initialized successfully.")


async def close_db():
    """Gracefully close the PostgreSQL connection pool."""
    global pool
    await _flush_buffer_now()
    if pool:
        await pool.close()
        logger.info("PostgreSQL connection pool closed.")


async def buffer_insert_telemetry(packet: Dict[str, Any]):
    """Decoupled memory ingestion: pushes incoming serial telemetry into the batch buffer."""
    async with _batch_lock:
        _batch_buffer.append(packet)
        if len(_batch_buffer) >= BATCH_BUFFER_MAX:
            await _flush_buffer_now()


async def _flush_buffer_now():
    """Executes a high-efficiency multi-row batch insert via asyncpg."""
    global _batch_buffer, pool
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
            await conn.executemany(
                """
                INSERT INTO telemetry (
                    seq, timestamp, pole_id, mesh_node_id, temperature, pressure, humidity,
                    water_depth, is_upright, voltage, current_ma, power, energy, frequency, pf,
                    mq7, mq135, mq136, mq2, sensors_json, status, source, raw_payload
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                """,
                records
            )
    except Exception as e:
        logger.error(f"PostgreSQL batch insert error: {e}")


async def batch_flush_worker():
    """Background worker periodically flushing any pending packets in memory."""
    while True:
        await asyncio.sleep(BATCH_FLUSH_INTERVAL)
        async with _batch_lock:
            await _flush_buffer_now()


async def get_recent_telemetry(limit: int = 200, pole_id: Optional[int] = None, since_timestamp: Optional[float] = None) -> List[Dict[str, Any]]:
    """Fetches latest telemetry rows for frontend hydration, optionally filtered by pole_id and since_timestamp."""
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
            conditions = []
            args = []
            arg_idx = 1

            if pole_id is not None:
                conditions.append(f"pole_id = ${arg_idx}")
                args.append(pole_id)
                arg_idx += 1

            if since_timestamp is not None:
                conditions.append(f"timestamp >= ${arg_idx}")
                args.append(since_timestamp)
                arg_idx += 1

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += f" ORDER BY id DESC LIMIT ${arg_idx}"
            args.append(limit)

            rows = await conn.fetch(query, *args)
            # Return chronologically
            res = []
            for r in reversed(rows):
                row_dict = dict(r)
                if row_dict.get("sensors_json"):
                    try:
                        row_dict["sensors"] = json.loads(row_dict["sensors_json"]) if isinstance(row_dict["sensors_json"], str) else row_dict["sensors_json"]
                    except Exception:
                        pass
                res.append(row_dict)
            return res
    except Exception as e:
        logger.error(f"Failed to query recent telemetry: {e}")
        return []


async def get_telemetry_history(
    limit: int = 100,
    offset: int = 0,
    pole_id: Optional[int] = None,
    since_timestamp: Optional[float] = None,
    until_timestamp: Optional[float] = None,
    is_upright: Optional[bool] = None
) -> Dict[str, Any]:
    """Fetches paginated telemetry with total count for deep historical exploration."""
    if not pool:
        return {"data": [], "total": 0, "limit": limit, "offset": offset}
    try:
        async with pool.acquire() as conn:
            conditions = []
            args = []
            arg_idx = 1

            if pole_id is not None:
                conditions.append(f"pole_id = ${arg_idx}")
                args.append(pole_id)
                arg_idx += 1

            if since_timestamp is not None:
                conditions.append(f"timestamp >= ${arg_idx}")
                args.append(since_timestamp)
                arg_idx += 1

            if until_timestamp is not None:
                conditions.append(f"timestamp <= ${arg_idx}")
                args.append(until_timestamp)
                arg_idx += 1

            if is_upright is not None:
                conditions.append(f"is_upright = ${arg_idx}")
                args.append(is_upright)
                arg_idx += 1

            where_clause = f" WHERE {' AND '.join(conditions)}" if conditions else ""

            # Count total matching
            count_query = f"SELECT COUNT(*) FROM telemetry{where_clause}"
            total = await conn.fetchval(count_query, *args)

            # Fetch rows
            query = f"""
                SELECT seq, timestamp, pole_id, mesh_node_id, temperature, pressure, humidity,
                       water_depth, is_upright, voltage, current_ma, power, energy, frequency, pf,
                       mq7, mq135, mq136, mq2, sensors_json, status, source, created_at
                FROM telemetry
                {where_clause}
                ORDER BY timestamp DESC
                LIMIT ${arg_idx} OFFSET ${arg_idx + 1}
            """
            args_with_pagination = args + [limit, offset]
            rows = await conn.fetch(query, *args_with_pagination)

            res = []
            for r in rows:
                row_dict = dict(r)
                if row_dict.get("created_at"):
                    row_dict["created_at"] = row_dict["created_at"].isoformat()
                if row_dict.get("sensors_json"):
                    try:
                        row_dict["sensors"] = json.loads(row_dict["sensors_json"]) if isinstance(row_dict["sensors_json"], str) else row_dict["sensors_json"]
                    except Exception:
                        pass
                res.append(row_dict)

            return {"data": res, "total": total, "limit": limit, "offset": offset}
    except Exception as e:
        logger.error(f"Failed to query telemetry history: {e}")
        return {"data": [], "total": 0, "limit": limit, "offset": offset}


async def get_telemetry_stats(
    since_timestamp: Optional[float] = None,
    until_timestamp: Optional[float] = None,
    pole_id: Optional[int] = None
) -> Dict[str, Any]:
    """Aggregates sensor statistics (min, max, avg, count) for generating audit reports."""
    if not pool:
        return {"poles": {}, "sample_count": 0}
    try:
        async with pool.acquire() as conn:
            conditions = []
            args = []
            arg_idx = 1

            if pole_id is not None:
                conditions.append(f"pole_id = ${arg_idx}")
                args.append(pole_id)
                arg_idx += 1

            if since_timestamp is not None:
                conditions.append(f"timestamp >= ${arg_idx}")
                args.append(since_timestamp)
                arg_idx += 1

            if until_timestamp is not None:
                conditions.append(f"timestamp <= ${arg_idx}")
                args.append(until_timestamp)
                arg_idx += 1

            where_clause = f" WHERE {' AND '.join(conditions)}" if conditions else ""

            query = f"""
                SELECT 
                    pole_id,
                    COUNT(*) as sample_count,
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
                {where_clause}
                GROUP BY pole_id
                ORDER BY pole_id ASC
            """

            rows = await conn.fetch(query, *args)
            stats_by_pole = {}
            total_samples = 0

            for r in rows:
                p_id = r["pole_id"]
                s_count = r["sample_count"]
                total_samples += s_count
                stats_by_pole[p_id] = {
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

            return {"poles": stats_by_pole, "sample_count": total_samples}
    except Exception as e:
        logger.error(f"Failed to query telemetry stats: {e}")
        return {"poles": {}, "sample_count": 0}


async def clear_telemetry():
    """Clears all historical records in PostgreSQL and resets the in-memory batch buffer."""
    global _batch_buffer, pool
    async with _batch_lock:
        _batch_buffer = []
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute("TRUNCATE TABLE telemetry;")
                logger.info("Telemetry database table truncated and memory buffer cleared.")
        except Exception as e:
            logger.error(f"Failed to clear telemetry table: {e}")


# =========================================================================
# Persistent Alerts Engine
# =========================================================================

async def record_alert_if_new(
    pole_id: int,
    alert_type: str,
    severity: str,
    title: str,
    description: str,
    trigger_value: Optional[float] = None,
    unit: str = ""
) -> Optional[Dict[str, Any]]:
    """
    Inserts a new UNRESOLVED alert into PostgreSQL only if there is not already
    an UNRESOLVED alert of the same alert_type on this pole_id.
    Returns the alert dict if newly inserted, or None if already active.
    """
    if not pool:
        return None
    try:
        async with pool.acquire() as conn:
            existing = await conn.fetchrow("""
                SELECT id FROM alerts
                WHERE pole_id = $1 AND alert_type = $2 AND status = 'UNRESOLVED'
                LIMIT 1
            """, pole_id, alert_type)

            if existing:
                return None

            row = await conn.fetchrow("""
                INSERT INTO alerts (
                    pole_id, alert_type, severity, title, description,
                    trigger_value, unit, status, triggered_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'UNRESOLVED', CURRENT_TIMESTAMP)
                RETURNING id, pole_id, alert_type, severity, title, description,
                          trigger_value, unit, status, triggered_at, resolved_at, resolved_by
            """, pole_id, alert_type, severity, title, description, trigger_value, unit)

            alert_dict = dict(row)
            if alert_dict.get("triggered_at"):
                alert_dict["triggered_at"] = alert_dict["triggered_at"].isoformat()
            if alert_dict.get("resolved_at"):
                alert_dict["resolved_at"] = alert_dict["resolved_at"].isoformat()

            logger.info(f"[Alerts] New UNRESOLVED alert recorded: Pole {pole_id} - {alert_type} ({title})")
            return alert_dict
    except Exception as e:
        logger.error(f"Failed to record alert: {e}")
        return None


async def get_alerts(
    status: Optional[str] = None,
    pole_id: Optional[int] = None,
    severity: Optional[str] = None,
    limit: int = 200
) -> List[Dict[str, Any]]:
    """Queries alerts from PostgreSQL with optional filtering."""
    if not pool:
        return []
    try:
        async with pool.acquire() as conn:
            query = """
                SELECT id, pole_id, alert_type, severity, title, description,
                       trigger_value, unit, status, triggered_at, resolved_at, resolved_by
                FROM alerts
            """
            conditions = []
            args = []
            arg_idx = 1

            if status and status.upper() != 'ALL':
                conditions.append(f"status = ${arg_idx}")
                args.append(status.upper())
                arg_idx += 1

            if pole_id is not None:
                conditions.append(f"pole_id = ${arg_idx}")
                args.append(pole_id)
                arg_idx += 1

            if severity and severity.lower() != 'all':
                conditions.append(f"severity = ${arg_idx}")
                args.append(severity.lower())
                arg_idx += 1

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += f" ORDER BY triggered_at DESC LIMIT ${arg_idx}"
            args.append(limit)

            rows = await conn.fetch(query, *args)
            res = []
            for r in rows:
                item = dict(r)
                if item.get("triggered_at"):
                    item["triggered_at"] = item["triggered_at"].isoformat()
                if item.get("resolved_at"):
                    item["resolved_at"] = item["resolved_at"].isoformat()
                res.append(item)
            return res
    except Exception as e:
        logger.error(f"Failed to fetch alerts: {e}")
        return []


async def resolve_alert(alert_id: int, resolved_by: str = "Operator") -> Optional[Dict[str, Any]]:
    """Marks an alert as RESOLVED."""
    if not pool:
        return None
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                UPDATE alerts
                SET status = 'RESOLVED',
                    resolved_at = CURRENT_TIMESTAMP,
                    resolved_by = $1
                WHERE id = $2
                RETURNING id, pole_id, alert_type, severity, title, description,
                          trigger_value, unit, status, triggered_at, resolved_at, resolved_by
            """, resolved_by, alert_id)
            if not row:
                return None
            item = dict(row)
            if item.get("triggered_at"):
                item["triggered_at"] = item["triggered_at"].isoformat()
            if item.get("resolved_at"):
                item["resolved_at"] = item["resolved_at"].isoformat()
            return item
    except Exception as e:
        logger.error(f"Failed to resolve alert {alert_id}: {e}")
        return None


async def resolve_multiple_alerts(alert_ids: List[int], resolved_by: str = "Operator") -> List[Dict[str, Any]]:
    """Marks a list of alert IDs as RESOLVED in PostgreSQL."""
    if not pool or not alert_ids:
        return []
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                UPDATE alerts
                SET status = 'RESOLVED',
                    resolved_at = CURRENT_TIMESTAMP,
                    resolved_by = $1
                WHERE id = ANY($2::bigint[]) AND status = 'UNRESOLVED'
                RETURNING id, pole_id, alert_type, severity, title, description,
                          trigger_value, unit, status, triggered_at, resolved_at, resolved_by
            """, resolved_by, alert_ids)
            res = []
            for row in rows:
                item = dict(row)
                if item.get("triggered_at"):
                    item["triggered_at"] = item["triggered_at"].isoformat()
                if item.get("resolved_at"):
                    item["resolved_at"] = item["resolved_at"].isoformat()
                res.append(item)
            return res
    except Exception as e:
        logger.error(f"Failed to resolve multiple alerts: {e}")
        return []


async def resolve_all_alerts(pole_id: Optional[int] = None, resolved_by: str = "Operator") -> int:
    """Resolves all currently unresolved alerts."""
    if not pool:
        return 0
    try:
        async with pool.acquire() as conn:
            query = """
                UPDATE alerts
                SET status = 'RESOLVED',
                    resolved_at = CURRENT_TIMESTAMP,
                    resolved_by = $1
                WHERE status = 'UNRESOLVED'
            """
            args = [resolved_by]
            if pole_id is not None:
                query += " AND pole_id = $2"
                args.append(pole_id)
            result = await conn.execute(query, *args)
            # result string format like "UPDATE 3"
            parts = result.split()
            count = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
            return count
    except Exception as e:
        logger.error(f"Failed to resolve all alerts: {e}")
        return 0



async def clear_all_alerts():
    """Wipes the alerts table (used when doing a full system data reset)."""
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute("TRUNCATE TABLE alerts;")
                logger.info("Alerts database table truncated.")
        except Exception as e:
            logger.error(f"Failed to clear alerts table: {e}")

