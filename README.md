# NIRIKSHA - Distributed IoT Environmental & Hazard Monitoring Network

<p align="left"><a href="https://www.espressif.com/"><img src="https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32" /></a> <a href="https://mqtt.org/"><img src="https://img.shields.io/badge/MQTT-660099?style=for-the-badge&logo=eclipse-mosquitto&logoColor=white" alt="MQTT" /></a> <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /></a> <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a> <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a> <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a> <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a> <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a> <a href="https://www.timescale.com/"><img src="https://img.shields.io/badge/TimescaleDB-FDB515?style=for-the-badge&logo=timescale&logoColor=black" alt="TimescaleDB" /></a> <a href="https://ollama.ai/"><img src="https://img.shields.io/badge/Ollama_AI-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama AI" /></a></p>


> 🚀 **Live Interactive Demo:** [Niriksha - AI-Powered Environmental & Infrastructure Hazard Monitoring System](https://om29dev.github.io/niriksha/)  
> 📖 **API Documentation:** [NIRIKSHA API Documentation](https://om29dev.github.io/niriksha/docs/)

---

## 📌 Overview

**NIRIKSHA** is an offline-capable, distributed IoT environmental monitoring and early warning system. Built for harsh field conditions and air-gapped municipal command centers, NIRIKSHA collects telemetry across utility poles and monitoring stations via a self-healing 2.4 GHz wireless radio mesh (`painlessMesh`).

The system detects critical environmental and structural risks in real time:
- **Urban Flooding & Water Accumulation:** Ultrasonic depth detection for rising street and river levels.
- **Water Electrification & Submerged Leakage:** Correlates AC voltage potential with standing water to identify life-threatening shock hazards.
- **Fire & Thermal Combustion:** Fuses thermal rates of rise with carbon monoxide (MQ-7) and flammable gases (MQ-2) to detect smoldering outbreaks.
- **Toxic Sewer & Industrial Gas Buildup:** Detects carbon monoxide, hydrogen sulfide ($H_2S$), and chemical fumes.
- **Structural Tilt & Pole Collapse:** Differentiates brief vehicular vibrations from permanent structural failure.
- **Grid Power Quality & Surges:** Monitors voltage, current, active power, energy, and power factor.

The platform requires no cellular connectivity or external cloud services, operating seamlessly during power blackouts and extreme storms.

---

## 📸 System Showcase & Visual Walkthrough

| **Real-Time Sensor Dashboard** | **Active Threat Banner & Status** |
| :---: | :---: |
| [![Dashboard Overview](docs/screenshots/dashboard_overview.png)](docs/screenshots/dashboard_overview.png)<br/>*Live sensor dials, upright orientation, and topology snapshot* | [![Threat Banner](docs/screenshots/dashboard_hazard_banner.png)](docs/screenshots/dashboard_hazard_banner.png)<br/>*Instant hardware warning banner with direct pole navigation* |

| **Water Electrification Hazard SOS** | **Extreme Thermal Outbreak SOS** |
| :---: | :---: |
| [![Water Electrification Alert](docs/screenshots/alert_electrocution_modal_cutout.png)](docs/screenshots/alert_electrocution_modal_cutout.png)<br/>*Critical lockout on voltage potential leakage in flood water* | [![Thermal Fire Alert](docs/screenshots/alert_fire_modal_cutout.png)](docs/screenshots/alert_fire_modal_cutout.png)<br/>*Audible procedural siren & blaze warning over 60°C* |

| **Geospatial Vector Mesh Topology** | **Fleet Node Architecture & Inventory** |
| :---: | :---: |
| [![Vector Topology Map](docs/screenshots/interactive_map_view.png)](docs/screenshots/interactive_map_view.png)<br/>*Vector map with live RF latency metrics and hazard radii* | [![Fleet Nodes](docs/screenshots/fleet_node_inventory.png)](docs/screenshots/fleet_node_inventory.png)<br/>*Multi-node inventory, sensor health, and mesh IDs* |

| **Multi-Node Differential Matrix** | **Dual-Node Time-Series Comparison** |
| :---: | :---: |
| [![Telemetry Matrix](docs/screenshots/comparative_analytics_matrix.png)](docs/screenshots/comparative_analytics_matrix.png)<br/>*Instantaneous channel differential ($\Delta$) analysis* | [![Comparison Curves](docs/screenshots/comparative_analytics_curves.png)](docs/screenshots/comparative_analytics_curves.png)<br/>*Synchronized multi-channel trend lines* |

| **Incident Management & Resolution** | **Historical Telemetry Log Explorer** |
| :---: | :---: |
| [![Incident Management](docs/screenshots/incident_management_overview.png)](docs/screenshots/incident_management_overview.png)<br/>*PostgreSQL safety log with operator resolution actions* | [![Telemetry History](docs/screenshots/telemetry_history_view.png)](docs/screenshots/telemetry_history_view.png)<br/>*Air-gapped database query explorer and raw JSON inspector* |

| **Compliance Audit & Aggregation** | **Offline Local AI Diagnostic Assistant** |
| :---: | :---: |
| [![Compliance Reports](docs/screenshots/compliance_audit_summary.png)](docs/screenshots/compliance_audit_summary.png)<br/>*Statistical Min/Avg/Max distribution and PDF/CSV export* | [![AI Assistant](docs/screenshots/ai_diagnostic_assistant.png)](docs/screenshots/ai_diagnostic_assistant.png)<br/>*Self-hosted Ollama LLM diagnostic reasoning console* |

| **System & Hardware Settings** | **Sliding-Window Telemetry Curves** |
| :---: | :---: |
| [![Hardware Settings](docs/screenshots/system_settings_config.png)](docs/screenshots/system_settings_config.png)<br/>*UART COM port controls, MQTT bridge, and threshold sliders* | [![Sensor Curves](docs/screenshots/dashboard_sensor_charts.png)](docs/screenshots/dashboard_sensor_charts.png)<br/>*Smooth real-time Recharts curves throttled via rAF* |

---

## 🏛️ System Architecture

The NIRIKSHA architecture spans physical microcontrollers in the field, dual hardware ingestion protocols, an algorithmic signal processing pipeline, and an air-gapped web dashboard.

```
                      [ Field Sensor Nodes ]
     Pole 1 (Flood & Voltage)       Pole 2 (Grid & Gas)
               \                             /
                \                           /
                 v                         v
          [ Pole 3: Root Gateway Hub Node (ESP32) ]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ USB Serial UART ]              [ MQTT Broker (1883) ]
     (pyserial worker)                 (aiomqtt client)
            └────────────────┬────────────────┘
                             │
                             ▼
              [ FastAPI Telemetry Ingestion ]
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  1D Kalman Filter   EWMA / CUSUM Anomaly   Hazard Fusion Engine
   (Noise Removal)    (Baseline & Drift)    (Risk Index Scoring)
         └───────────────────┬───────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ PostgreSQL 14+ ]              [ WebSocket Stream ]
   (asyncpg buffer)                (Broadcaster 60 FPS)
                                              │
                                              ▼
                                   [ React 19 Dashboard ]
                                   (Air-Gapped, Light Theme)
```

### Core Subsystems

1. **Hardware & Radio Mesh (`firmware/`):**
   - Node 1 (Flood & Voltage): HC-SR04 ultrasonic distance, ZMPT101B AC voltage probe, SW-520D tilt switch, MQ gas array.
   - Node 2 (Grid & Gas): PZEM-004T AC energy meter (V, I, W, kWh, PF), SW-520D tilt switch, MQ gas array.
   - Node 3 (Root Gateway): painlessMesh root coordinator, aggregates frames and outputs normalized serial lines to the host machine.

2. **Dual-Protocol Ingestion Layer (`backend/app/protocols/`):**
   - **Serial Manager:** Dedicated daemon thread reading UART lines (`MESH_JSON:{...}`) with automatic reconnection and exponential backoff.
   - **MQTT Manager:** Non-blocking async subscriber (`aiomqtt`) listening to topics like `niriksha/poles/+/telemetry`.

3. **Algorithmic Analytics Pipeline (`backend/app/analytics/`):**
   - **1D Kalman Filtering:** Minimizes mean squared error on analog signals, eliminating ripples on water probes and ADC noise.
   - **Streaming Anomaly Detection:** Calculates dynamic baselines using EWMA variance and tracks persistent drift using two-sided CUSUM.
   - **Multi-Sensor Hazard Fusion:** Computes the composite Electrocution Risk Index ($0-100\%$), Fire & Combustion Index, and applies a multi-frame debounce on tilt switches.

4. **Persistence & Database Buffering (`backend/app/db/`):**
   - Decoupled in-memory batch ring buffer collecting telemetry records.
   - Flushes to PostgreSQL every 250-300 ms or upon reaching 50 records in batched multi-row transactions via an `asyncpg` connection pool.

5. **Local AI Diagnostic Assistant (`backend/app/ai/`):**
   - Tier 1: Deterministic safety heuristics providing instant, reliable hazard verification.
   - Tier 2: Local LLM runtime powered by Ollama (`qwen2.5:0.5b` or `llama3.2:1b`) with dynamic real-time telemetry prompt injection.

6. **Web Operations Dashboard (`frontend/`):**
   - React 19 + Vite + TypeScript interface styled with clean slate laboratory aesthetics.
   - Sliding window memory management (50-100 data points) and `requestAnimationFrame` throttling for stable 24/7 operation.
   - Procedural dual-tone emergency siren synthesizer using the Web Audio API.

---

## ⚡ Quick Start & Installation

Follow these steps to set up and run the entire platform locally on Windows or Linux.

### Prerequisites

| Requirement | Minimum Version | Note |
| :--- | :--- | :--- |
| **Python** | 3.10+ | Required for backend services |
| **Node.js** | 18.0+ | Required for the React dashboard |
| **PostgreSQL** | 14.0+ | Time-series telemetry and alert storage |
| **PowerShell** | 5.1+ / 7+ | For running the service manager (`manage.ps1`) |
| **Ollama** *(Optional)* | Latest | For local offline AI assistant features |

---

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/SIH.git
cd SIH
```

---

### Step 2: Database Setup

1. Make sure PostgreSQL is running on your machine (default port `5432`).
2. Create the target database (e.g. `iot_dashboard`):
   ```sql
   CREATE DATABASE iot_dashboard;
   ```
3. Initialize the database schema and indexes:
   ```powershell
   python backend/init_postgres.py
   ```

---

### Step 3: Configure Environment Variables

The backend ships with pre-configured settings in `backend/.env`. You can adjust credentials as needed:

```env
# backend/.env

# PostgreSQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=iot_dashboard
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=10

# Ingestion Batch Flush Settings
BATCH_FLUSH_INTERVAL_MS=300
BATCH_BUFFER_MAX_SIZE=50

# Server Configuration
SERVER_HOST=127.0.0.1
SERVER_PORT=8000

# Physical Serial COM (Leave blank for auto-scan or specify e.g. COM3)
SERIAL_PORT=
SERIAL_BAUD=115200

# Industrial MQTT Broker Configuration
MQTT_ENABLED=true
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_TOPIC=niriksha/poles/+/telemetry

# Local Ollama AI Settings
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:0.5b
```

---

### Step 4: Install Dependencies

```powershell
# 1. Install Backend Dependencies
pip install -r backend/requirements.txt

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..
```

---

### Step 5: Run the Platform

#### Method A: Using the Management CLI (Recommended)

NIRIKSHA includes a unified PowerShell management script `manage.ps1` to orchestrate background processes:

```powershell
# Start all services (Backend, Frontend, and Ollama)
.\manage.ps1 start

# Check service health and port statuses
.\manage.ps1 status

# Stream live backend log output
.\manage.ps1 logs

# Stop all running services
.\manage.ps1 stop
```

#### Method B: Starting Services Manually

If you prefer running services in separate terminal windows:

```powershell
# Terminal 1: Backend API
cd backend
python main.py

# Terminal 2: Frontend Dashboard
cd frontend
npm run dev
```

---

## 🌐 Application Access Points

Once services are running, access the interfaces:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Operations Dashboard** | [http://localhost:5173](http://localhost:5173) | Primary operator control center |
| **Backend REST API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Health and telemetry endpoints |
| **Interactive API Docs (Local)** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Swagger UI for local REST endpoints |
| **Published API Docs (Online)** | [NIRIKSHA API Documentation](https://om29dev.github.io/niriksha/docs/) | Hosted static OpenAPI reference |
| **WebSocket Stream** | `ws://127.0.0.1:8000/ws/telemetry` | Real-time sensor stream |

---

## 🧪 Testing & Verification

The backend analytics, signal filters, and hazard rules are thoroughly verified with unit and integration tests:

```powershell
# Run the automated test suite
python -m pytest backend/tests/ -v
```

Test coverage includes:
- **Kalman Filter:** Initialization, noise attenuation, convergence, and channel isolation.
- **Anomaly Detection:** EWMA dynamic baseline tracking, Z-score surge flagging, and CUSUM drift accumulation.
- **Hazard Fusion:** Electrocution Risk Index calculations, Fire Combustion Index, and tilt debounce confirmation.
- **Packet Normalizer:** Schema mapping, missing sensor fallback (`NOT_CONNECTED`), and raw ADC scaling.
- **API Endpoints:** REST routes and WebSocket health checks.

---

## 📂 Project Structure

```
SIH/
├── backend/                       # Python FastAPI backend service
│   ├── app/
│   │   ├── ai/                    # Offline AI heuristics & Ollama client
│   │   ├── analytics/             # Kalman filter, EWMA/CUSUM, hazard fusion
│   │   ├── core/                  # Configuration & settings (.env loader)
│   │   ├── db/                    # asyncpg connection pool, schema, batch buffer
│   │   ├── protocols/             # PySerial worker, MQTT subscriber, normalizer
│   │   └── routers/               # Telemetry, alerts, ports, websockets, AI
│   ├── tests/                     # Automated unit and integration test suite
│   ├── init_postgres.py           # Database table initialization script
│   ├── main.py                    # Server entrypoint and lifespan manager
│   └── requirements.txt           # Python dependencies
│
├── frontend/                      # React 19 + TypeScript + Vite web dashboard
│   ├── src/
│   │   ├── components/            # Modular views, charts, maps, modals, AI drawer
│   │   ├── hooks/                 # WebSocket hook, alerts hook, Web Audio siren hook
│   │   ├── constants/             # Pole catalog, danger thresholds
│   │   ├── types/                 # Shared TypeScript interfaces
│   │   ├── App.tsx                # Main view router and layout
│   │   └── main.tsx               # Client entry point
│   ├── package.json               # Node packages and scripts
│   └── vite.config.ts             # Vite build configuration
│
├── firmware/                      # Microcontroller C++ sketches (ESP32)
│   ├── pole1_sensor_node/         # Pole 1 firmware: Ultrasonic, ZMPT101B, Tilt, Gas
│   ├── pole2_sensor_node/         # Pole 2 firmware: PZEM-004T, Tilt, Gas
│   ├── pole3_gateway_hub/         # Pole 3 firmware: Root Hub Gateway & UART Serial
│   └── README.md                  # Embedded hardware and flashing documentation
│
├── docs/                          # Comprehensive technical documentation chapters
│   ├── 01_SYSTEM_ARCHITECTURE.md  # High-level architecture, D2 pipeline, data flow
│   ├── 02_HARDWARE_AND_MESH.md    # Pinouts, painlessMesh RF protocol, calibration
│   ├── 03_INGESTION_AND_PROTOCOLS.md # PySerial thread, MQTT client, normalizer
│   ├── 04_ANALYTICS_AND_ALGORITHMS.md # Kalman filter state math, EWMA, CUSUM, fusion
│   ├── 05_DATABASE_AND_STORAGE.md # PostgreSQL schema, indexing, batch buffering
│   ├── 06_FRONTEND_AND_DASHBOARD.md # React 19 architecture, 60fps rendering, audio siren
│   ├── 07_AI_DIAGNOSTICS_ENGINE.md # Deterministic rules, Ollama integration
│   ├── 08_OPERATIONS_AND_RUNBOOK.md # PowerShell CLI, runbooks, troubleshooting
│   ├── 09_MODULAR_COMPONENTS.md   # Modular component reference & design principles
│   └── README.md                  # Documentation index & technical matrix
│
├── logs/                          # Runtime logs generated by services
├── manage.ps1                     # Unified PowerShell service management CLI
└── ARCHITECTURE.md                # System topology and D2 data flow diagrams
```

---

## 📖 Subsystem Documentation

For deep technical details, circuit schematics, mathematical equations, and operational procedures, refer to the documentation chapters:

- **[System Architecture](file:///d:/proj/SIH/docs/01_SYSTEM_ARCHITECTURE.md)**: End-to-end topology, fault boundaries, and concurrency model.
- **[Hardware & Radio Mesh](file:///d:/proj/SIH/docs/02_HARDWARE_AND_MESH.md)**: ESP32 pin assignments, painlessMesh protocol, transmission cadence, and sensor calibration.
- **[Ingestion & Protocols](file:///d:/proj/SIH/docs/03_INGESTION_AND_PROTOCOLS.md)**: Serial UART worker, MQTT subscriber, packet normalizer, and error recovery.
- **[Analytics & Algorithms](file:///d:/proj/SIH/docs/04_ANALYTICS_AND_ALGORITHMS.md)**: 1D Kalman filter formulas, streaming EWMA/CUSUM anomaly detection, and composite risk scoring.
- **[Database & Storage](file:///d:/proj/SIH/docs/05_DATABASE_AND_STORAGE.md)**: PostgreSQL table schemas, indexes, asyncpg pooling, and memory batch buffering.
- **[Frontend Architecture](file:///d:/proj/SIH/docs/06_FRONTEND_AND_DASHBOARD.md)**: React 19 dashboard, sliding-window buffer, and procedural Web Audio sirens.
- **[Offline AI Diagnostics](file:///d:/proj/SIH/docs/07_AI_DIAGNOSTICS_ENGINE.md)**: Deterministic heuristic safety matrix and local Ollama model integration.
- **[Operations & Runbook](file:///d:/proj/SIH/docs/08_OPERATIONS_AND_RUNBOOK.md)**: Management CLI commands, environment options, port allocations, and troubleshooting.
- **[Modular Components](file:///d:/proj/SIH/docs/09_MODULAR_COMPONENTS.md)**: Frontend subcomponents, backend packages, and single-responsibility layout.
- **[Full Documentation Hub](file:///d:/proj/SIH/docs/README.md)**: Master documentation index.
- **[NIRIKSHA API Documentation](https://om29dev.github.io/niriksha/docs/)**: Interactive OpenAPI / Swagger documentation hosted on GitHub Pages.
