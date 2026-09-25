# NIRIKSHA Backend Engine

High-performance, asynchronous Python backend service powering real-time hardware telemetry ingestion, signal conditioning, multi-hazard risk fusion, PostgreSQL persistence, and WebSocket broadcasting.

---

## 🏗️ Architecture & Package Layout

The backend follows clean, modular design where every module adheres to the Single Responsibility Principle:

```
backend/
├── app/
│   ├── core/
│   │   └── config.py               # Pydantic BaseSettings environment parsing (.env)
│   ├── db/
│   │   ├── connection.py           # asyncpg Pool lifecycle, reconnection & health
│   │   ├── schema.py               # PostgreSQL DDL, idempotent column migration & B-tree indexes
│   │   ├── buffer.py               # Decoupled in-memory batch ring buffer (250-300ms flush)
│   │   ├── telemetry_repo.py       # Time-series querying, aggregate statistics & CSV exports
│   │   └── alerts_repo.py          # Persistent alert logging, deduplication & multi-row resolution
│   ├── protocols/
│   │   ├── normalizer.py           # Multi-node payload mapping to unified sensor schema
│   │   ├── serial_manager.py       # Dedicated PySerial daemon thread with auto-reconnect
│   │   └── mqtt_manager.py         # Asynchronous aiomqtt MQTT client subscriber & publisher
│   ├── analytics/
│   │   ├── kalman.py               # 1D discrete-time linear Kalman filter for analog & ultrasonic
│   │   ├── anomaly.py              # Streaming EWMA baseline, Z-score surge & CUSUM drift detection
│   │   └── fusion_engine.py        # Composite hazard scoring (Electrocution, Fire, Tilt debouncing)
│   ├── ai/
│   │   ├── schemas.py              # Pydantic schemas for assistant conversations and responses
│   │   ├── diagnostics.py          # Fast deterministic domain heuristics (0ms fallback)
│   │   └── ollama.py               # Local Ollama HTTP client with dynamic prompt slot injection
│   ├── routers/
│   │   ├── telemetry.py            # Historical queries, node summaries, and CSV streaming
│   │   ├── alerts.py               # Incident query, multi-select resolve, and audit cleanup
│   │   ├── ports.py                # Serial COM port auto-discovery and baud configuration
│   │   ├── mqtt.py                 # MQTT client status and broker diagnostics
│   │   ├── websockets.py           # Real-time WebSocket telemetry broadcast endpoint
│   │   └── ai_assistant.py         # Conversational assistant and session management
│   ├── prompts/
│   │   └── ollama_system_prompt.md # Industrial telemetry prompt with dynamic slot injection
│   ├── connection_manager.py       # Thread-safe WebSocket connection registry & broadcaster
│   └── schemas.py                  # Shared Pydantic data models
│
├── tests/                          # Automated pytest verification test suite
│   ├── test_kalman.py              # Kalman convergence and noise rejection tests
│   ├── test_anomaly.py             # EWMA baseline and CUSUM drift tests
│   ├── test_fusion_engine.py       # Hazard risk indexing and tilt debouncer tests
│   ├── test_mesh_protocol.py       # Multi-pole payload normalization tests
│   └── test_api_endpoints.py       # FastAPI HTTP and WebSocket route tests
│
├── data/
│   └── ai_logs/                    # Local JSON/Markdown diagnostic logs
├── main.py                         # Application entrypoint & FastAPI lifespan context
├── init_postgres.py                # Standalone database table & index creation script
├── clean_db.py                     # Database wipe / maintenance script
├── requirements.txt                # Pinned production Python dependencies
└── README.md                       # This documentation guide
```

---

## ⚡ Telemetry Processing Pipeline

Every telemetry packet follows a strictly decoupled asynchronous path:

```
[ ESP32 Mesh Gateway ] (UART Serial @ 115200) OR [ MQTT Broker ] (TCP 1883)
                     │
                     ▼
          [ protocols/normalizer.py ]
          - Normalizes payload into Unified Sensor Schema
          - Marks inactive sensors as "NOT_CONNECTED" / val: null
                     │
                     ▼
          [ analytics/ Pipeline ]
          - kalman.py: 1D noise filtering on water depth & gas ADC
          - anomaly.py: Streaming EWMA Z-score spike & CUSUM drift detection
          - fusion_engine.py: Composite Electrocution, Fire & Tilt hazard indexing
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
[ db/buffer.py Ring Buffer ]  [ connection_manager.py ]
- Multi-row in-memory queue    - Broadcasts to all connected WebSocket clients
- Flushed every 250-300ms      - Throttled to prevent client frame drops
- Direct to asyncpg Pool
```

---

## 🚀 Running & Developing

### Environment Setup
Ensure your `.env` file exists in `backend/.env` (or configure via root `manage.ps1`):
```ini
DB_HOST=localhost
DB_PORT=5432
DB_NAME=niriksha_db
DB_USER=postgres
DB_PASSWORD=your_password
SERIAL_PORT=COM3
SERIAL_BAUD=115200
MQTT_BROKER=localhost
MQTT_PORT=1883
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
```

### Initialize Database Schema
```powershell
python backend/init_postgres.py
```

### Run Server Locally
```powershell
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Or use the root orchestration CLI:
```powershell
.\manage.ps1 start backend
```

### Run Test Suite
```powershell
python -m pytest backend/tests
```
