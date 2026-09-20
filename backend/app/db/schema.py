import logging
import asyncpg

logger = logging.getLogger("db.schema")


async def create_tables_and_indexes(conn: asyncpg.Connection):
    """Executes schema DDL, columns migration, and high-performance indexes."""
    # 1. Telemetry time-series table
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
            mq7 DOUBLE PRECISION,
            mq135 DOUBLE PRECISION,
            mq136 DOUBLE PRECISION,
            mq2 DOUBLE PRECISION,
            sensors_json JSONB,
            status VARCHAR(32) DEFAULT 'NORMAL',
            source VARCHAR(64),
            raw_payload TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 2. Add any missing columns for backwards compatibility
    columns_to_check = [
        ("pole_id", "INT DEFAULT 1"),
        ("mesh_node_id", "BIGINT"),
        ("water_depth", "DOUBLE PRECISION"),
        ("is_upright", "BOOLEAN"),
        ("power", "DOUBLE PRECISION"),
        ("energy", "DOUBLE PRECISION"),
        ("frequency", "DOUBLE PRECISION"),
        ("pf", "DOUBLE PRECISION"),
        ("sensors_json", "JSONB"),
        ("mq7", "DOUBLE PRECISION"),
        ("mq135", "DOUBLE PRECISION"),
        ("mq136", "DOUBLE PRECISION"),
        ("mq2", "DOUBLE PRECISION"),
    ]
    for col_name, col_type in columns_to_check:
        await conn.execute(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='telemetry' AND column_name='{col_name}'
                ) THEN
                    ALTER TABLE telemetry ADD COLUMN {col_name} {col_type};
                END IF;
            END $$;
        """)

    # 3. Persistent alerts table
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

    # 4. Performance indexes for range and filtering queries
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp DESC);")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_seq ON telemetry(seq DESC);")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_pole_time ON telemetry(pole_id, timestamp DESC);")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status_time ON alerts(status, triggered_at DESC);")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_pole_time ON alerts(pole_id, triggered_at DESC);")
    logger.info("Database schema migrations and performance indexes verified.")
