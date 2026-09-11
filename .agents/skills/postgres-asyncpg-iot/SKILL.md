---
name: postgres-asyncpg-iot
description: >-
  High-throughput PostgreSQL database schema, asyncpg connection pooling,
  in-memory multi-row batch buffering, and query optimization for IoT time-series telemetry.
---

# PostgreSQL & asyncpg IoT Ingestion Skill

This skill documents high-throughput time-series data storage, connection pooling, and batch ingestion patterns using PostgreSQL and Python's `asyncpg`.

---

## 💾 Core Architecture & Database Best Practices

### 1. High-Throughput Decoupled Ingestion
- **Anti-Pattern:** Inserting records row-by-row on incoming network/serial packets (`INSERT INTO ... VALUES (...)`). At high frequencies, this causes lock contention, connection saturation, and asyncio event loop lag.
- **Pattern:** Decoupled buffer & batch transactions:
  - Keep an in-memory batch buffer in Python (`self._batch_buffer: list[tuple] = []`).
  - Flush either when buffer reaches threshold (e.g. 50–100 items) or every interval (250–300ms).
  - Use `asyncpg` multi-row operations:
    ```python
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.executemany(
                """
                INSERT INTO telemetry (timestamp, sensor_id, temperature, humidity, pressure, voltage)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                batch_records
            )
    ```

### 2. asyncpg Connection Pool Management
- Always maintain a single, long-lived `asyncpg.Pool` initialized during application startup and cleanly closed on shutdown.
- Configure conservative pool sizing for telemetry workloads:
  ```python
  pool = await asyncpg.create_pool(
      user=DB_USER,
      password=DB_PASSWORD,
      database=DB_NAME,
      host=DB_HOST,
      port=DB_PORT,
      min_size=2,
      max_size=10,
      command_timeout=10,
  )
  ```

### 3. Schema & Indexing Recommendations for Time-Series
- Define primary timestamp indexes for temporal queries and retention pruning:
  ```sql
  CREATE TABLE IF NOT EXISTS telemetry (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      device_id VARCHAR(64) NOT NULL,
      temperature DOUBLE PRECISION,
      humidity DOUBLE PRECISION,
      pressure DOUBLE PRECISION,
      voltage DOUBLE PRECISION,
      raw_payload JSONB
  );

  CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON telemetry (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry (device_id, created_at DESC);
  ```

### 4. Configuration & Environment Variables
- Never hardcode credentials.
- Load via `.env` using `python-dotenv`:
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=postgres
  DB_PASSWORD=postgres
  DB_NAME=iot_dashboard
  DB_POOL_MIN=2
  DB_POOL_MAX=10
  DB_BATCH_SIZE=50
  DB_FLUSH_INTERVAL_MS=300
  ```

---

## 🛠️ Verification & Maintenance Commands

- **Run database initialization / table migration script:**
  ```powershell
  python backend/init_postgres.py
  ```
- **Verify table rows and latest readings:**
  ```powershell
  python -c "import asyncio, asyncpg; asyncio.run((lambda: asyncpg.connect('postgresql://postgres:postgres@localhost:5432/iot_dashboard').then(lambda c: c.fetchval('SELECT COUNT(*) FROM telemetry')))())"
  ```
