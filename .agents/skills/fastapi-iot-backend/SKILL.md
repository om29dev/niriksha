---
name: fastapi-iot-backend
description: >-
  Expert guidelines and best practices for developing, operating, and extending
  the FastAPI backend for IoT telemetry, WebSockets, PySerial integration,
  and high-throughput PostgreSQL/asyncpg buffering.
---

# FastAPI IoT Telemetry Backend Skill

This skill provides design patterns, architecture guidelines, and workflows for building and maintaining the FastAPI backend layer in an offline IoT telemetry environment.

---

## 🏗️ Core Architecture & Patterns

### 1. Application Lifecycle (`lifespan`)
- Always utilize FastAPI's modern `lifespan(app: FastAPI)` async context manager in `backend/main.py`.
- **Startup:**
  - Initialize the `Database` singleton and call `await db.init_pool()`.
  - Instantiate and start background workers:
    - Serial communication worker task (`serial_manager.start_reading()`).
    - Periodic database buffer flush task (`db.start_periodic_flush()`).
- **Shutdown:**
  - Signal serial reading loop to terminate cleanly (`serial_manager.stop()`).
  - Flush any remaining in-memory telemetry records to PostgreSQL (`await db.flush_buffer()`).
  - Close the `asyncpg.Pool` cleanly (`await db.close()`).

### 2. High-Throughput PostgreSQL & asyncpg Ingestion
- **Never perform per-packet synchronous SQL inserts.** Telemetry streams can reach 50-200Hz.
- Use decoupled in-memory batch buffers:
  ```python
  # Push into buffer without blocking the serial / WebSocket loop
  db.add_telemetry_packet(data)
  ```
- Periodically flush using multi-row batch execution (`executemany` or binary `copy_records_to_table`) every 250-300ms or when the buffer hits batch capacity (e.g., 50-100 items).
- Maintain an `asyncpg.Pool` with tuned `min_size` (e.g. 2) and `max_size` (e.g. 10).
- Load all database credentials from `.env` via `python-dotenv`.

### 3. PySerial Fault Tolerance & Background Processing
- PySerial calls are blocking I/O: run reading loops either in an `asyncio.to_thread` executor or inside a non-blocking asyncio task structure.
- **Auto-Reconnection Loop:**
  - Catch `serial.SerialException` and `OSError` without terminating the FastAPI server.
  - Log warning, wait with a backoff (1-2 seconds), re-scan available ports, and attempt reconnect.
  - Call `flushInput()` upon port opening to clear truncated or corrupted frames.
- **Built-in Mock/Simulator Mode:**
  - When no physical COM port is present or configured, automatically fall back to or allow toggling a synthetic telemetry generator to facilitate development, UI testing, and CI.

### 4. WebSocket Broadcasting
- Maintain an active connection manager:
  ```python
  class ConnectionManager:
      def __init__(self):
          self.active_connections: list[WebSocket] = []
  ```
- Safely broadcast telemetry payloads to all connected WebSocket clients with `asyncio.gather(..., return_exceptions=True)`.
- Prune dead/disconnected client sockets immediately to prevent memory leaks.

### 5. Multi-Pole Normalization & Unified Sensor Schema
- Normalizes diverse node packets (e.g. Ultrasonic + ZMPT on Pole 1, PZEM full-suite on Pole 2, DHT11 Gateway on Pole 3) into a single standard schema.
- Sensors not present on a node are tagged with `status: "NOT_CONNECTED"` and numerical values as `null`.
- Seamlessly strips `MESH_JSON:` header emitted by root gateways before JSON deserialization.

---

## 📋 Common Development Commands

- **Run backend independently (with hot reload):**
  ```powershell
  python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **Initialize Database Schema:**
  ```powershell
  python backend/init_postgres.py
  ```
- **Inspect API Documentation:**
  - Swagger UI: `http://127.0.0.1:8000/docs`
  - ReDoc: `http://127.0.0.1:8000/redoc`
- **Inspect Logs:**
  ```powershell
  Get-Content .\logs\backend.log -Tail 50 -Wait
  ```
