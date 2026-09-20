# NIRIKSHA — Smart IoT Mesh Telemetry & Hazard Monitoring System

An offline-first, laboratory-grade IoT telemetry, mesh sensor network, and real-time hazard monitoring platform. Built for air-gapped field deployments with painlessMesh microcontrollers, resilient PySerial COM ingestion, PostgreSQL time-series batch buffering, FastAPI WebSockets, and a React + Vite dashboard.

---

## 📚 Technical Documentation Hub

Exhaustive, human-crafted engineering specifications with D2 architecture diagrams are available in the [docs/](file:///d:/proj/SIH/docs/README.md) directory:

- **[01. System Architecture](file:///d:/proj/SIH/docs/01_SYSTEM_ARCHITECTURE.md)**: End-to-end topology, data lifecycles, and fault isolation.
- **[02. Hardware & Mesh Network](file:///d:/proj/SIH/docs/02_HARDWARE_AND_MESH.md)**: Microcontroller pinouts, painlessMesh RF, and sensor calibrations.
- **[03. Ingestion & Protocols](file:///d:/proj/SIH/docs/03_INGESTION_AND_PROTOCOLS.md)**: PySerial worker, aiomqtt client, zero-mock directive, and unified schema.
- **[04. Analytics & Algorithms](file:///d:/proj/SIH/docs/04_ANALYTICS_AND_ALGORITHMS.md)**: 1D Kalman filter, EWMA, CUSUM drift detection, and hazard fusion scoring.
- **[05. Database & Storage](file:///d:/proj/SIH/docs/05_DATABASE_AND_STORAGE.md)**: PostgreSQL schemas, indexing strategies, and asyncpg batch buffering.
- **[06. Frontend & Dashboard](file:///d:/proj/SIH/docs/06_FRONTEND_AND_DASHBOARD.md)**: React 19 architecture, 60fps RAF throttling, sliding window buffer, and Web Audio siren.
- **[07. AI Diagnostics Engine](file:///d:/proj/SIH/docs/07_AI_DIAGNOSTICS_ENGINE.md)**: Deterministic heuristic safety rules, Ollama local LLM, and dynamic telemetry injection.
- **[08. Operations & Runbook](file:///d:/proj/SIH/docs/08_OPERATIONS_AND_RUNBOOK.md)**: PowerShell CLI (`manage.ps1`), configuration, port maps, and disaster recovery.

---

## 🚀 Quick Setup & Run Guide

Follow these steps to get the entire system up and running in under 2 minutes.

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- **PostgreSQL 14+** (running locally or accessible via network)
- **PowerShell 5.1+** (Windows standard)

---

# 2. Configure Environment
Copy `.env.example` in `backend/` to `backend/.env` and update your PostgreSQL & MQTT credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=iot_dashboard
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=10

BATCH_FLUSH_INTERVAL_MS=300
BATCH_BUFFER_MAX_SIZE=50

SERVER_HOST=127.0.0.1
SERVER_PORT=8000

# Physical Serial Gateway
SERIAL_PORT=
SERIAL_BAUD=115200

# Industrial MQTT Broker Ingestion
MQTT_ENABLED=true
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_TOPIC=niriksha/poles/+/telemetry
MQTT_CLIENT_ID=niriksha_backend_ingestor
```

---

### 3. Install Dependencies & Initialize DB

```powershell
# 1. Install Backend Dependencies (FastAPI, PySerial, aiomqtt, asyncpg)
pip install -r backend/requirements.txt

# 2. Initialize PostgreSQL Schema & Tables
python backend/init_postgres.py

# 3. Install Frontend Dependencies
cd frontend
npm install
cd ..
```

---

### 4. Run the Project

You can start backend and frontend together using the built-in management script:

```powershell
# Option A: Start both services in the background
.\manage.ps1 start

# Option B: Run in interactive debug mode with live unified log streaming
.\manage.ps1 debug
```

> **Direct / Manual Launch (Alternative):**
> - **Backend:** `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000`
> - **Frontend:** `cd frontend && npm run dev`

---

### 5. Access the Platform

- **Web Dashboard:** [http://localhost:5173](http://localhost:5173)
- **FastAPI API & Health:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🕹️ CLI Management Commands (`manage.ps1`)

| Command | Action |
| :--- | :--- |
| `.\manage.ps1 start` | Starts backend (port 8000) and frontend (port 5173) with Serial & MQTT ingestion |
| `.\manage.ps1 debug` | Runs unified debug stream in active console with `[BACKEND]` and `[FRONTEND]` tags |
| `.\manage.ps1 stop` | Gracefully terminates background processes |
| `.\manage.ps1 restart` | Restarts backend and frontend services |
| `.\manage.ps1 status` | Checks process status and port listeners |
| `.\manage.ps1 logs` | Tails live backend log file (`Get-Content logs/backend.log -Wait`) |
| `.\manage.ps1 help` | Displays available management commands |

---

## 🌟 Key Highlights & Capabilities

- **Strict Offline / Air-Gapped Operation:** Zero external CDNs or cloud dependencies. Offline typography (`@fontsource/inter`) and iconography (`lucide-react`) bundled statically.
- **Strict File Size Directive (< 200 Lines):** 100% of codebase files adhere to the Single Responsibility Principle and remain under 200 lines.
- **Dual Real-World Ingestion Protocols:** Ingests live telemetry from field poles via physical Serial COM and industrial MQTT broker topics (`niriksha/poles/+/telemetry`). Zero synthetic mock simulation.
- **Advanced Algorithmic Signal Processing:**
  - **1D Linear Kalman Filter:** Real-time process noise rejection on noisy analog ADC sensors and ultrasonic water depth.
  - **Streaming EWMA & CUSUM Anomaly Detection:** Continuous dynamic baseline estimation, Z-score surge flagging, and insidious subtle drift detection.
  - **Multi-Sensor Composite Hazard Fusion:** Dynamic Electrocution Risk Index (voltage + water depth), Fire & Thermal Combustion Index (temperature + CO + combustible gas), and structural tilt debounce filtering.
- **High-Throughput PostgreSQL Buffer:** Decoupled in-memory batch ring (`asyncpg` connection pooling) flushing records every 250–300ms without saturating the asyncio event loop.
- **Interactive Spatial Map & Mesh Topology:** Declarative SVG spatial schematic displaying top-down node pins, RF wireless mesh connections, and transceiver coverage radii.
- **Auditing & Reporting Engine:** Statistical sensor distribution (Min / Avg / Max) and compliance logs with instant CSV exports and print/PDF formatting.
- **Deep PostgreSQL Historical Explorer:** Queryable historical time-series logs with pagination, orientation filters, and raw JSON inspection.
- **AI Telemetry Diagnostic Engine:** Conversational AI assistant with full live sensor awareness, available both as a full view and as a global corner drawer with active sensor ribbons.

---

## 📂 Repository Structure

```
SIH/
├── .agents/
│   └── rules/                          # System & code standard rules
│       └── code_standards.md           # <200 lines limit, zero mock, and algorithm rules
├── backend/                            # Python FastAPI backend service
│   ├── app/
│   │   ├── core/config.py              # Environment configuration & typed settings
│   │   ├── db/                         # Modular asyncpg persistence layer
│   │   │   ├── connection.py           # Pool lifecycle & credentials re-auth
│   │   │   ├── schema.py               # Table creation & column migrations
│   │   │   ├── buffer.py               # Memory batch buffer & flusher
│   │   │   ├── telemetry_repo.py       # Time-series queries & stats aggregation
│   │   │   └── alerts_repo.py          # Persistent incident tracking & resolution
│   │   ├── protocols/                  # Real-world telemetry protocols
│   │   │   ├── normalizer.py           # Unified sensor schema transformation
│   │   │   ├── serial_manager.py       # Crash-resilient PySerial listener
│   │   │   └── mqtt_manager.py         # Asynchronous aiomqtt client
│   │   ├── analytics/                  # Algorithmic telemetry signal processing
│   │   │   ├── kalman.py               # 1D discrete-time linear Kalman filter
│   │   │   ├── anomaly.py              # Streaming EWMA and CUSUM drift detector
│   │   │   └── fusion_engine.py        # Multi-sensor hazard risk scoring
│   │   ├── ai/                         # AI assistant & domain heuristics
│   │   │   ├── diagnostics.py          # Deterministic domain rule heuristics
│   │   │   └── ollama.py               # Ollama LLM integration & audit logging
│   │   ├── routers/                    # Modular API endpoints (< 100 lines each)
│   │   ├── connection_manager.py       # Thread-safe WebSocket connection registry
│   │   └── schemas.py                  # Pydantic request/response validation schemas
│   ├── database.py                     # Clean backward-compatibility facade
│   ├── serial_manager.py               # Clean backward-compatibility facade
│   ├── main.py                         # Application entry point & lifespan manager
│   └── requirements.txt                # Python backend dependencies
├── frontend/                           # React 19 + Vite + TypeScript application
│   ├── src/
│   │   ├── components/                 # UI components
│   │   │   ├── charts/                 # Recharts sliding-window metric charts
│   │   │   ├── map/                    # Modular map subcomponents (Legend, Header, Canvas, Details)
│   │   │   ├── views/                  # Multi-view pages (Dashboard, Map, History, Reports, AI, Fleet, Alerts, Settings)
│   │   │   ├── AiAssistantDrawer.tsx   # Global right-corner AI sensor assistant overlay
│   │   │   ├── PoleSelectDropdown.tsx  # Scalable search dropdown for large pole fleets
│   │   │   ├── PoleNav.tsx             # Multi-pole selector tabs & dropdown
│   │   │   ├── Sidebar.tsx             # Collapsible primary navigation
│   │   │   ├── Header.tsx              # Application header, AI button & alerts dropdown
│   │   │   └── VoltageEmergencyModal.tsx # Fullscreen modal for water electrification leak
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useEmergencyAudio.ts    # Web Audio API emergency siren generator
│   │   │   ├── useHazardDetection.ts   # Multi-pole hazard rule evaluator
│   │   │   └── useWebSocketTelemetry.ts# Low-latency WebSocket client with auto-reconnect
│   │   ├── types/                      # TypeScript definitions (TelemetryPacket, PoleId, etc.)
│   │   ├── App.tsx                     # Top-level state and layout
│   │   └── main.tsx                    # Entry point with offline @fontsource/inter
│   ├── package.json                    # Node dependencies and scripts
│   └── vite.config.ts                  # Vite bundler configuration
├── docs/                               # Comprehensive technical documentation suite
│   ├── README.md                       # Technical documentation index & navigation hub
│   ├── 01_SYSTEM_ARCHITECTURE.md       # High-level architecture, D2 pipeline, data lifecycle
│   ├── 02_HARDWARE_AND_MESH.md         # Microcontroller schematics, painlessMesh, calibrations
│   ├── 03_INGESTION_AND_PROTOCOLS.md   # Serial UART & MQTT dual ingestion, normalizer
│   ├── 04_ANALYTICS_AND_ALGORITHMS.md  # Kalman filtering, EWMA, CUSUM, composite hazard fusion
│   ├── 05_DATABASE_AND_STORAGE.md      # PostgreSQL time-series schema, asyncpg batch buffering
│   ├── 06_FRONTEND_AND_DASHBOARD.md    # React 19 architecture, 60fps rendering, audio siren
│   ├── 07_AI_DIAGNOSTICS_ENGINE.md     # Offline AI reasoning, deterministic heuristics, Ollama
│   └── 08_OPERATIONS_AND_RUNBOOK.md    # Management script (manage.ps1), deployment, runbooks
├── lastlocal/                          # Microcontroller C++ sketches (Read-Only)
│   ├── mk_pole1_mesh_lastlocal_done/   # Pole 1: Ultrasonic, ZMPT, Tilt, Gas
│   ├── mk_pole2_mesh_lastlocal_done/   # Pole 2: PZEM-004T, Tilt, Gas
│   └── mk_pole3_mesh_lastlocal_done/   # Pole 3: Root Gateway Hub
├── logs/                               # Runtime logs directory (backend.log, frontend.log)
├── manage.ps1                          # Unified PowerShell service management CLI
├── ARCHITECTURE.md                     # High-level architectural overview with D2 diagrams
└── AGENTS.md                           # Strict system rules & operational directives

---

## 📡 Sensor Specifications & Unified Data Model

| Metric | Field | Unit | Physical Provider | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| **AC Voltage** | `voltage` | V | ZMPT101B (Pole 1) / PZEM-004T (Pole 2) | Electrification leak detection & grid voltage |
| **Current** | `current_ma` | mA | PZEM-004T (Pole 2) | Line current load monitoring |
| **Active Power** | `power` | W | PZEM-004T (Pole 2) | Power consumption tracking |
| **Energy** | `energy` | kWh | PZEM-004T (Pole 2) | Cumulative energy accounting |
| **Frequency** | `frequency` | Hz | PZEM-004T (Pole 2) | Grid frequency stability |
| **Power Factor**| `pf` | - | PZEM-004T (Pole 2) | Power factor efficiency |
| **Water Depth** | `water_depth` | cm | HC-SR04 Ultrasonic (Pole 1) | Urban flooding & submersion depth |
| **Upright Tilt**| `is_upright` | bool| SW-520D Ball Tilt Switch (All Poles) | Pole collapse & structural displacement |
| **Temperature** | `temperature` | °C | DHT11 / Onboard | Thermal hazard & ambient monitoring |
| **Humidity** | `humidity` | % | DHT11 / Onboard | Ambient humidity & storm monitoring |
| **Carbon Monoxide**| `mq7` | ppm | MQ-7 Sensor | Toxic gas & smoldering wire detection |
| **Air Quality** | `mq135` | ppm | MQ-135 Sensor | Broad pollutant / NH3 / NOx detection |
| **Hydrogen Sulfide**| `mq136` | ppm | MQ-136 Sensor | Sewer gas / H2S leak detection |
| **Combustible Gas**| `mq2` | ppm | MQ-2 Sensor | Smoke, LPG, and flammable gas detection |

> **Note on Missing Sensors:** When a node does not physically carry a sensor, its status is explicitly marked `"NOT_CONNECTED"` and its numerical value is `null`, ensuring the frontend displays a neutral `"Not Connected"` state rather than misleading zeros.

---

## 🛡️ Hazard Thresholds & Emergency Logic

1. **Water Electrification Leak:** `voltage > 5.0V` detected across water immersion probes. Triggers critical modal, hazard banner, and 880Hz acoustic emergency siren.
2. **Urban Flood Accumulation:** `water_depth > 100.0cm`. Triggers high-priority flood warning banner.
3. **Structural Pole Collapse:** `is_upright == false`. Triggers structural failure alert.
4. **Thermal Hazard:** `temperature > 45.0°C`. Triggers high-temperature warning.
5. **Excess Humidity:** `humidity > 85.0%`. Triggers moisture hazard warning.
6. **Toxic / Combustible Gas:** `mq7 > 50ppm`, `mq135 > 100ppm`, `mq136 > 30ppm`, or `mq2 > 200ppm`. Triggers gas hazard alert.
7. **Node Heartbeat Loss:** Pole packets delayed > 7 seconds mark the pole as `OFFLINE`.
