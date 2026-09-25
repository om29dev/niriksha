# NIRIKSHA Technical Documentation Hub

Welcome to the technical documentation repository for **NIRIKSHA**, a distributed, edge-assisted environmental intelligence and multi-hazard monitoring platform.

This documentation suite details the end-to-end telemetry and hazard detection pipeline: from ESP32 mesh sensor nodes deployed in the field, through dual-protocol hardware ingestion (UART/MQTT) and mathematical signal conditioning in Python/FastAPI, to asynchronous PostgreSQL batch persistence and real-time React visualization.

---

## 📚 Documentation Index

The documentation is organized into focused, modular technical chapters:

| Document | Focus Areas | Key Topics |
| :--- | :--- | :--- |
| [01. System Architecture](file:///d:/proj/SIH/docs/01_SYSTEM_ARCHITECTURE.md) | End-to-End System Design | Topology, D2 Data Flow, Layered Concurrency, Zero-Mock Policy, Network Boundaries |
| [02. Hardware & Mesh Network](file:///d:/proj/SIH/docs/02_HARDWARE_AND_MESH.md) | Microcontrollers & Radio | ESP32 Pinouts, painlessMesh RF Protocol, Staggered Cadence, Sensor Calibrations (ZMPT101B, PZEM-004T, HC-SR04, MQ Array) |
| [03. Ingestion & Protocols](file:///d:/proj/SIH/docs/03_INGESTION_AND_PROTOCOLS.md) | Gateway Ingestion Engine | PySerial Thread Worker, aiomqtt Async Client, Auto-Reconnect Loops, Packet Normalizer, Unified Schema |
| [04. Analytics & Algorithms](file:///d:/proj/SIH/docs/04_ANALYTICS_AND_ALGORITHMS.md) | Signal Processing & Hazard Math | 1D Discrete-Time Kalman Filter, Streaming EWMA & CUSUM Anomaly Detection, Electrocution Risk Index, Fire & Combustion Index |
| [05. Database & Storage](file:///d:/proj/SIH/docs/05_DATABASE_AND_STORAGE.md) | Persistence & Batching | PostgreSQL Schema, Performance Indexes, asyncpg Connection Pool, In-Memory Multi-Row Batch Ring Buffer |
| [06. Frontend & Dashboard](file:///d:/proj/SIH/docs/06_FRONTEND_AND_DASHBOARD.md) | Client Architecture | React 19 + TypeScript, 60 FPS Throttling via requestAnimationFrame, Sliding Window State, Web Audio Siren Synthesis, Air-Gap Styling |
| [07. AI Diagnostics Engine](file:///d:/proj/SIH/docs/07_AI_DIAGNOSTICS_ENGINE.md) | Offline Machine Reasoning | Deterministic Heuristic Safety Engine, Local Ollama LLM Runtime, Dynamic Telemetry Injection, System Prompts |
| [08. Operations & Runbook](file:///d:/proj/SIH/docs/08_OPERATIONS_AND_RUNBOOK.md) | System Management & Ops | PowerShell CLI (`manage.ps1`), Environment Configurations, Port Allocations, Startup/Debug Workflows, Troubleshooting |
| [09. Modular Architecture](file:///d:/proj/SIH/docs/09_MODULAR_COMPONENTS.md) | Component Hierarchy & Guidelines | Subcomponents by Domain, Single Responsibility (<200 Lines), Clean Air-Gap Patterns |

---

## 🏗️ Standardized Repository Layout

The codebase enforces strict separation of concerns and single-responsibility modules. The workspace layout is organized as follows:

```
SIH/
├── .agents/                            # Local agent rules, guidelines, and domain skills
│   ├── rules/                          # System & code standards (air-gap, styling, line limits)
│   └── skills/                         # Operational skills (FastAPI, PySerial, asyncpg, React, etc.)
│
├── backend/                            # Python 3.10+ asynchronous backend service
│   ├── app/                            # Application package root
│   │   ├── core/                       # Core configuration and environment settings
│   │   │   └── config.py               # Pydantic BaseSettings loading from .env (< 50 lines)
│   │   ├── db/                         # PostgreSQL persistence & buffering layer
│   │   │   ├── connection.py           # asyncpg Pool lifecycle, reconnection, health check
│   │   │   ├── schema.py               # Table DDL, idempotent column migrations, B-tree indexes
│   │   │   ├── buffer.py               # Decoupled in-memory batch ring buffer & flusher
│   │   │   ├── telemetry_repo.py       # Time-series telemetry queries, statistics & CSV export
│   │   │   └── alerts_repo.py          # Persistent incident tracking, deduplication & resolution
│   │   ├── protocols/                  # Physical & network telemetry protocol interfaces
│   │   │   ├── normalizer.py           # Multi-node raw payload mapping to unified sensor schema
│   │   │   ├── serial_manager.py       # PySerial background thread with exponential backoff
│   │   │   └── mqtt_manager.py         # Asynchronous aiomqtt subscriber & publisher
│   │   ├── analytics/                  # Algorithmic telemetry signal processing
│   │   │   ├── kalman.py               # 1D linear discrete-time Kalman filter for ADC/ultrasonic
│   │   │   ├── anomaly.py              # Streaming EWMA dynamic baseline and CUSUM drift detector
│   │   │   └── fusion_engine.py        # Composite hazard scoring (Electrocution, Fire, Tilt)
│   │   ├── ai/                         # Offline AI reasoning & diagnostics
│   │   │   ├── schemas.py              # Pydantic schemas for assistant sessions and prompts
│   │   │   ├── diagnostics.py          # Fast deterministic domain heuristics (0ms latency)
│   │   │   └── ollama.py               # Local Ollama HTTP client with dynamic prompt injection
│   │   ├── routers/                    # Modular FastAPI REST & WebSocket routers
│   │   │   ├── telemetry.py            # Historical time-series queries and CSV export
│   │   │   ├── alerts.py               # Incident query, acknowledge, and resolve endpoints
│   │   │   ├── ports.py                # Serial COM port auto-discovery and baud configuration
│   │   │   ├── mqtt.py                 # MQTT client status and broker connection diagnostics
│   │   │   ├── websockets.py           # Real-time WebSocket telemetry broadcast endpoint
│   │   │   └── ai_assistant.py         # Conversational assistant and session management
│   │   ├── prompts/                    # Domain-specific prompt templates
│   │   │   └── ollama_system_prompt.md # Industrial telemetry prompt with dynamic slot injection
│   │   ├── connection_manager.py       # Thread-safe WebSocket connection registry & broadcaster
│   │   └── schemas.py                  # Shared Pydantic data schemas
│   ├── tests/                          # Automated pytest verification suite
│   ├── data/                           # AI conversation history and data logs
│   ├── main.py                         # Application entry point & FastAPI lifespan manager
│   ├── init_postgres.py                # Standalone database initialization script
│   ├── clean_db.py                     # Standalone maintenance / wipe script
│   ├── requirements.txt                # Pinned Python package dependencies
│   └── README.md                       # Backend architectural guide
│
├── frontend/                           # React 19 + Vite + TypeScript web dashboard
│   ├── src/                            # Source root
│   │   ├── components/                 # Modular UI components
│   │   │   ├── ai/                     # AI assistant drawer subcomponents (Sidebar, Window, Input)
│   │   │   ├── alerts/                 # Alerts center subcomponents (KPIs, Filters, Table, Modals)
│   │   │   ├── charts/                 # Real-time sliding window Recharts line/area charts
│   │   │   ├── compare/                # Multi-node comparative analytics subcomponents
│   │   │   ├── dashboard/              # Primary dashboard widgets & metric gauges
│   │   │   ├── fleet/                  # Fleet overview, node status chips, connectivity health
│   │   │   ├── history/                # Deep time-series table explorer & pagination controls
│   │   │   ├── map/                    # Spatial vector schematic canvas, node pins, coverage circles
│   │   │   ├── modals/                 # Critical emergency modals (Voltage shock, evacuation)
│   │   │   ├── reports/                # Compliance audit report generator & print formatters
│   │   │   ├── settings/               # System configuration cards (Serial, MQTT, Ollama, DB)
│   │   │   ├── views/                  # Primary orchestrator views (Dashboard, Map, Alerts, etc.)
│   │   │   ├── AiAssistantDrawer.tsx   # Global slide-over AI diagnostics drawer
│   │   │   ├── Header.tsx              # Application header bar, status indicators, audio mute
│   │   │   ├── Sidebar.tsx             # Collapsible primary navigation sidebar
│   │   │   ├── PoleSelectDropdown.tsx  # Searchable dropdown supporting arbitrary node scale
│   │   │   └── MarkdownContent.tsx     # Offline Markdown renderer for AI diagnostic reports
│   │   ├── constants/                  # Canonical system constants (poles, thresholds, defaults)
│   │   ├── hooks/                      # Custom React state and event hooks
│   │   │   ├── useWebSocketTelemetry.ts# Low-latency WebSocket subscriber with auto-reconnect
│   │   │   ├── useAlerts.ts            # Live client-side hazard evaluation and persistence hook
│   │   │   ├── useEmergencyAudio.ts    # Procedural Web Audio API emergency siren synthesizer
│   │   │   └── useHazardDetection.ts   # Multi-sensor hazard rule matcher
│   │   ├── types/                      # TypeScript interface and type declarations
│   │   ├── App.tsx                     # Root state container, tab switching, and modal mounting
│   │   ├── main.tsx                    # React DOM entry point with offline @fontsource/inter font
│   │   ├── index.css                   # Laboratory-grade light theme variables and reset rules
│   │   └── App.css                     # Component layout styling
│   ├── package.json                    # Node dependencies and build scripts
│   ├── vite.config.ts                  # Vite bundler configuration
│   └── README.md                       # Frontend architectural guide
│
├── firmware/                           # Microcontroller C++ sketches (Read-Only Reference)
│   ├── pole1_sensor_node/              # Pole 1 firmware: Ultrasonic, ZMPT101B, Tilt, MQ array
│   ├── pole2_sensor_node/              # Pole 2 firmware: PZEM-004T, Tilt, MQ array
│   ├── pole3_gateway_hub/              # Pole 3 firmware: Root Gateway Hub & Serial Transmit
│   └── README.md                       # Embedded hardware and flashing documentation
│
├── docs/                               # Comprehensive technical documentation suite
│   ├── README.md                       # This index & navigation matrix
│   ├── 01_SYSTEM_ARCHITECTURE.md       # High-level architecture, D2 pipeline, data lifecycle
│   ├── 02_HARDWARE_AND_MESH.md         # Microcontroller schematics, painlessMesh, sensor calibration
│   ├── 03_INGESTION_AND_PROTOCOLS.md   # Serial UART & MQTT dual ingestion, normalizer
│   ├── 04_ANALYTICS_AND_ALGORITHMS.md  # Kalman filtering, EWMA, CUSUM, composite hazard fusion
│   ├── 05_DATABASE_AND_STORAGE.md      # PostgreSQL time-series schema, asyncpg batch buffering
│   ├── 06_FRONTEND_AND_DASHBOARD.md    # React 19 architecture, 60fps rendering, audio siren
│   ├── 07_AI_DIAGNOSTICS_ENGINE.md     # Offline AI reasoning, deterministic heuristics, Ollama
│   ├── 08_OPERATIONS_AND_RUNBOOK.md    # Management script (`manage.ps1`), deployment, troubleshooting
│   └── 09_MODULAR_COMPONENTS.md        # Modular component reference & design principles
│
├── logs/                               # Runtime log files (backend.log, frontend.log)
├── manage.ps1                          # Unified PowerShell orchestration CLI for all services
├── ARCHITECTURE.md                     # High-level architectural overview with D2 diagrams
└── README.md                           # Quickstart guide, installation, and run instructions
```

---

## 🎯 Engineering Tenets

1. **Strict Offline Air-Gap Compliance**: No asset, script, font, icon, or model weight is ever fetched from external CDNs or cloud endpoints. Everything is bundled locally.
2. **Deterministic Reliability over Synthetic Mocks**: The system never runs fake random data generators in production. Telemetry arrives from physical microcontrollers over Serial COM or industrial MQTT brokers.
3. **Decoupled Asynchronous Throughput**: Incoming high-frequency telemetry never writes directly to the disk on the network thread. It passes through an algorithmic processing pipeline, enters an in-memory batch ring buffer, and flushes to PostgreSQL every 250–300ms in batched multi-row transactions.
4. **Client Render Stability**: The client enforces a sliding window buffer of 50–100 data points per metric and uses `requestAnimationFrame` to decouple WebSocket packet arrival from UI paint cycles, ensuring zero-lag 24/7 continuous operation.
