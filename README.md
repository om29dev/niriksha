# NIRIKSHA — Smart IoT Mesh Telemetry & Hazard Monitoring System

An offline-first, laboratory-grade IoT telemetry, mesh sensor network, and real-time hazard monitoring platform. Built for air-gapped field deployments with painlessMesh microcontrollers, resilient PySerial COM ingestion, PostgreSQL time-series batch buffering, FastAPI WebSockets, and a React + Vite dashboard.

---

## 🌟 Key Highlights & Capabilities

- **Strict Offline / Air-Gapped Operation:** Zero external CDNs or cloud dependencies. Offline typography (`@fontsource/inter`) and iconography (`lucide-react`) bundled statically.
- **Microcontroller Mesh Telemetry:** Ingests staggered painlessMesh multi-node telemetry from field poles via a designated root gateway hub (`mk_pole3_mesh_lastlocal_done`).
- **Unified Sensor Schema:** Handles multi-node heterogeneity (PZEM electrical meters, ZMPT AC voltage probes, HC-SR04 ultrasonic water depth, SW-520D tilt switches, DHT11 environmental, and MQ-series gas sensors) with clean `NOT_CONNECTED` states.
- **Zero-Crash Serial Fault Tolerance:** Asynchronous background PySerial worker with automatic reconnection, buffer flushing, and built-in synthetic simulation fallback.
- **High-Throughput PostgreSQL Buffer:** Decoupled in-memory batch ring (`asyncpg` connection pooling) flushing 50+ records every 250–300ms without saturating the asyncio event loop.
- **Interactive Spatial Map & Mesh Topology:** Declarative SVG spatial schematic displaying top-down node pins, RF wireless mesh connections, and transceiver coverage radii.
- **Auditing & Reporting Engine:** Statistical sensor distribution (Min / Avg / Max) and compliance logs with instant CSV exports and print/PDF formatting.
- **Deep PostgreSQL Historical Explorer:** Queryable historical time-series logs with pagination, orientation filters, and raw JSON inspection.
- **AI Telemetry Diagnostic Engine:** Conversational AI assistant with full live sensor awareness, available both as a full view and as a global corner drawer with active sensor ribbons.
- **Scalable Fleet Search & Dropdown:** Ready for fleet expansion with searchable dropdown selectors supporting any number of poles.

---

## 📂 Repository Structure

```
SIH/
├── .agents/
│   └── skills/                         # Antigravity operational & development skills
│       ├── offline-iot-dashboard/      # Core air-gapped system design guidelines
│       ├── fastapi-iot-backend/        # FastAPI, WebSocket & lifespan patterns
│       ├── postgres-asyncpg-iot/       # asyncpg connection pool & batching guidelines
│       ├── pyserial-iot-telemetry/     # COM port resilience, parsing & mock simulator
│       ├── react-iot-dashboard/        # React, Recharts, sliding window & light theme
│       ├── mesh-sensor-telemetry/      # painlessMesh microcontroller protocols & schema
│       ├── ai-telemetry-assistant/     # Offline AI reasoning, heuristics & drawer specs
│       ├── spatial-map-reporting/      # Vector map topology, search dropdowns & audit reports
│       └── system-management-ops/      # PowerShell manage.ps1 scripts & operational ops
├── backend/                            # Python FastAPI backend service
│   ├── app/
│   │   ├── routers/                    # Modular API & WebSocket routers
│   │   │   ├── ports.py                # COM port listing & simulation toggling
│   │   │   ├── telemetry.py            # Historical time-series queries & CSV export
│   │   │   ├── alerts.py               # Persistent alert management
│   │   │   ├── ai_assistant.py         # Offline AI reasoning & chat diagnostics
│   │   │   └── websockets.py           # Real-time WebSocket broadcasting endpoint
│   │   ├── connection_manager.py       # Active WebSocket connection manager
│   │   └── schemas.py                  # Pydantic request/response validation schemas
│   ├── .env                            # Active environment variables
│   ├── .env.example                    # Template environment configuration
│   ├── database.py                     # PostgreSQL connection pool & batch buffer
│   ├── init_postgres.py                # Database initialization script
│   ├── main.py                         # FastAPI lifespan application entry point
│   ├── mock_simulator.py               # Realistic multi-pole synthetic waveform generator
│   ├── requirements.txt                # Python backend dependencies
│   └── serial_manager.py               # Resilient PySerial manager & auto-reconnection
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
├── lastlocal/                          # Microcontroller C++ sketches (Read-Only)
│   ├── mk_pole1_mesh_lastlocal_done/   # Pole 1: Ultrasonic, ZMPT, Tilt, Gas
│   ├── mk_pole2_mesh_lastlocal_done/   # Pole 2: PZEM-004T, Tilt, Gas
│   └── mk_pole3_mesh_lastlocal_done/   # Pole 3: Root Gateway Hub
├── logs/                               # Runtime logs directory (backend.log, frontend.log)
├── manage.ps1                          # Unified PowerShell service management CLI
└── AGENTS.md                           # Strict system rules & operational directives
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- **PostgreSQL 14+** (running locally or accessible via network)
- **PowerShell 5.1+** (Windows standard)

### 2. Configure Environment
Copy `.env.example` to `backend/.env` and update credentials:
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
```

### 3. Initialize Database
Initialize the schema and indexes:
```powershell
python backend/init_postgres.py
```

### 4. Install Dependencies
```powershell
# Install Backend Dependencies
pip install -r backend/requirements.txt

# Install Frontend Dependencies
cd frontend
npm install
cd ..
```

### 5. Launch Services
Use the unified management CLI to run both services:
```powershell
# Background service execution
.\manage.ps1 start

# Or launch with combined real-time colored log streaming in current window
.\manage.ps1 debug
```

- **Frontend UI:** [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🕹️ CLI Management Commands (`manage.ps1`)

| Command | Action |
| :--- | :--- |
| `.\manage.ps1 start` | Starts backend (port 8000) and frontend (port 5173) in background jobs |
| `.\manage.ps1 debug` | Runs unified debug stream in active console with `[BACKEND]` and `[FRONTEND]` tags |
| `.\manage.ps1 stop` | Gracefully terminates both background processes |
| `.\manage.ps1 restart` | Restarts backend and frontend services |
| `.\manage.ps1 status` | Checks process status and port listeners |
| `.\manage.ps1 logs` | Tails live backend log file (`Get-Content logs/backend.log -Wait`) |
| `.\manage.ps1 help` | Displays available management commands |

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
