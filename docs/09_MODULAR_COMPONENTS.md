# 09. Modular Architecture & Component Reference

NIRIKSHA enforces strict modularity, clean component hierarchy, and single-responsibility principles across both the React frontend and FastAPI backend. No code file exceeds 200 lines, ensuring clean maintainability and fault isolation.

---

## 🏗️ 1. Frontend Component Hierarchy

The frontend is built with **React 19 + TypeScript + Vite**. All monolithic views are decomposed into focused, reusable subcomponents organized by functional domain:

```
frontend/src/components/
├── ai/                              # Conversational Offline AI Diagnostics
│   ├── AiChatSidebar.tsx            # Session switcher, rename/delete modals, and session search
│   ├── AiChatWindow.tsx             # Message transcript renderer with offline Markdown & timestamps
│   └── AiPromptInput.tsx            # Auto-resizing prompt input, keyboard listeners & suggestion chips
│
├── alerts/                          # Centralized Incident Management & Audit
│   ├── AlertsStatusHeader.tsx       # Unresolved counter, auto-refresh badge & Web Audio siren switch
│   ├── AlertsKpiStrip.tsx           # 4-card metric strip (Critical, Warning, Live Breaches, Resolved)
│   ├── LiveIncidentsCard.tsx        # Active live hazard breaches with pulse animation
│   ├── AlertsFilterBar.tsx          # Pole filter, severity filter, text search & page size controls
│   ├── AlertsTable.tsx              # Multi-select row selection, status chips & individual resolve
│   └── AlertsPagination.tsx         # Page navigation controls & PostgreSQL audit compliance badge
│
├── charts/                          # High-Performance Sensor Visualization
│   ├── CompareChartCard.tsx         # Multi-node overlay chart with series toggles
│   ├── TelemetryChart.tsx           # Single-sensor sliding window chart (50-100 data points)
│   └── TelemetryChartsGrid.tsx      # Responsive CSS grid of live telemetry charts
│
├── compare/                         # Multi-Station Comparative Analytics
│   ├── CompareControlsBar.tsx       # Station multi-selector and metric comparison toggles
│   ├── CompareMatrixTable.tsx       # Side-by-side tabular cross-station sensor comparison
│   └── CompareNodeSummaryCard.tsx   # Per-station health and telemetry summary card
│
├── dashboard/                       # Operational Command Center
│   ├── AddCardModal.tsx             # Modal dialog for pinning additional metrics
│   ├── CustomizableDashboard.tsx    # Drag-and-drop customizable layout container
│   ├── DashboardControlsBar.tsx     # Layout presets, card toggles & layout reset buttons
│   ├── DashboardMapCard.tsx         # Embedded geospatial vector map mini-card
│   ├── DashboardMetricTile.tsx      # Live telemetry dial card with threshold status pill
│   └── RealtimeIncidentsBanner.tsx  # Dynamic animated hazard banner across the top
│
├── fleet/                           # Mesh Network Fleet & Station Management
│   ├── FleetFilterBar.tsx           # Fleet search, connectivity status, and role filter
│   └── FleetNodeCard.tsx            # Full station diagnostic card with radio RSSI & active sensors
│
├── history/                         # Time-Series Telemetry Table Explorer
│   ├── HistoryFilterBar.tsx         # Date range selector, pole filter & search input
│   ├── HistoryPacketModal.tsx       # Modal showing full raw and normalized JSON payload
│   ├── HistoryPagination.tsx        # Page controls with range indicator
│   └── HistoryTable.tsx             # Paginated tabular records with sensor badges
│
├── map/                             # Geospatial Vector Schematic
│   ├── LiveMapLegend.tsx            # Sensor condition legend and pole marker symbols
│   ├── MapFilterControls.tsx        # Layer visibility switches (nodes, RF links, danger rings)
│   ├── PoleInspectionModal.tsx      # Detailed pop-up inspection card for selected pole
│   └── VectorSchematicCanvas.tsx    # High-performance vector canvas schematic
│
├── modals/                          # Life-Safety Critical Warning Intercepts
│   ├── FireEmergencyModal.tsx       # Full-screen thermal/gas outbreak alarm intercept modal
│   └── VoltageEmergencyModal.tsx    # Full-screen water electrification hazard alarm modal
│
├── reports/                         # Municipal Telemetry & Audit Reports
│   ├── AuditChartsSection.tsx       # Trend charts embedded into compliance reports
│   ├── ReportExecutiveSummary.tsx   # High-level summary of total packets, uptime & breaches
│   ├── ReportGasAuditCard.tsx       # Summary of toxic gas and air quality threshold breaches
│   ├── ReportNodeStatsTable.tsx     # Station uptime, packet counts & error rate table
│   └── ReportsFilterBar.tsx         # Report date range selection, CSV download & print controls
│
├── settings/                        # Configuration Cards (Uniform 1x1 CSS Grid)
│   ├── DatabaseMaintenanceCard.tsx  # PostgreSQL connection info, schema verify & audit cleanup
│   ├── GasThresholdCard.tsx         # MQ-2, MQ-7, MQ-135, MQ-136 warning and alarm thresholds
│   ├── OllamaConfigCard.tsx         # Host URL, model tag text input, and connectivity test
│   ├── TelemetrySourceCard.tsx      # PySerial COM port, baud rate & MQTT broker configuration
│   └── VoltageFloodThresholdCard.tsx# Voltage danger limit & ultrasonic flood threshold tuning
│
├── views/                           # High-Level Orchestrator Views
│   ├── AiAssistantView.tsx          # Full-page conversational AI diagnostics interface
│   ├── AlertsHistoryView.tsx        # Incident audit and resolution center
│   ├── CompareDashboardView.tsx     # Multi-station comparative analysis view
│   ├── FleetNodesView.tsx           # Comprehensive fleet status overview
│   ├── HistoryView.tsx              # Deep historical telemetry table explorer
│   ├── LiveMapView.tsx              # Full-screen geospatial vector map
│   ├── ReportsView.tsx              # Telemetry audit reporting and export view
│   └── SettingsView.tsx             # System parameters and hardware configuration
│
├── AiAssistantDrawer.tsx            # Global slide-over drawer accessible from any view
├── ConfigBar.tsx                    # Active ingestion protocol and connection indicator
├── HazardBanners.tsx                # Floating contextual alert banners
├── Header.tsx                       # Navigation bar, connection badge, audio mute & drawer button
├── MarkdownContent.tsx              # Offline Markdown renderer for AI messages
├── MetricCard.tsx                   # Atomic metric display card
├── MetricCardsGrid.tsx              # Responsive grid container for metric cards
├── PoleNav.tsx                      # Quick pole switcher tabs
├── PoleSelectDropdown.tsx           # Scalable search dropdown supporting arbitrary fleet size
└── Sidebar.tsx                      # Collapsible left navigation drawer
```

---

## ⚙️ 2. Backend Modular Architecture

The backend is built with **FastAPI**, **asyncpg**, and **PySerial**, providing non-blocking ingestion and asynchronous WebSocket broadcasting.

```
backend/
├── app/
│   ├── core/                        # Core Configuration
│   │   └── config.py                # Pydantic BaseSettings loading from .env (< 50 lines)
│   │
│   ├── db/                          # PostgreSQL Persistence & Asyncpg Pool
│   │   ├── connection.py            # asyncpg Pool lifecycle, auto-reconnection, health check
│   │   ├── schema.py                # Table DDL, idempotent column migrations & B-tree indexes
│   │   ├── buffer.py                # In-memory batch ring buffer flushed every 250-300ms
│   │   ├── telemetry_repo.py        # Time-series telemetry queries, statistics & CSV export
│   │   └── alerts_repo.py           # Persistent incident tracking, deduplication & multi-resolve
│   │
│   ├── protocols/                   # Physical & Network Ingestion Protocols
│   │   ├── normalizer.py            # Multi-node payload mapping to unified sensor schema
│   │   ├── serial_manager.py        # Dedicated PySerial daemon thread with exponential backoff
│   │   └── mqtt_manager.py          # Asynchronous aiomqtt MQTT client subscriber & publisher
│   │
│   ├── analytics/                   # Algorithmic Telemetry Processing
│   │   ├── kalman.py                # 1D linear discrete-time Kalman filter for ADC/ultrasonic
│   │   ├── anomaly.py               # Streaming EWMA dynamic baseline & CUSUM drift detector
│   │   └── fusion_engine.py         # Multi-sensor composite hazard scoring (Electrocution, Fire, Tilt)
│   │
│   ├── ai/                          # Offline AI Reasoning & Diagnostics
│   │   ├── schemas.py               # Pydantic schemas for assistant sessions and prompts
│   │   ├── diagnostics.py           # Fast deterministic domain heuristics (0ms fallback)
│   │   └── ollama.py                # Local Ollama HTTP client with dynamic prompt slot injection
│   │
│   ├── routers/                     # Modular FastAPI REST & WebSocket Endpoints
│   │   ├── telemetry.py             # Historical time-series queries and CSV export
│   │   ├── alerts.py                # Incident query, multi-select resolve, and audit cleanup
│   │   ├── ports.py                 # Serial COM port auto-discovery and baud configuration
│   │   ├── mqtt.py                  # MQTT client status and broker diagnostics
│   │   ├── websockets.py            # Real-time WebSocket telemetry broadcast endpoint
│   │   └── ai_assistant.py          # Conversational assistant and session management
│   │
│   ├── prompts/                     # System Prompts for Local LLM
│   │   └── ollama_system_prompt.md  # Industrial telemetry prompt with dynamic slot injection
│   │
│   ├── connection_manager.py        # Thread-safe WebSocket connection registry & broadcaster
│   └── schemas.py                   # Shared Pydantic data schemas
│
├── tests/                           # Automated Verification Suite (pytest)
│   ├── test_kalman.py               # Kalman filter convergence and noise rejection tests
│   ├── test_anomaly.py              # EWMA baseline and CUSUM drift detection tests
│   ├── test_fusion_engine.py        # Multi-sensor hazard fusion and tilt debouncer tests
│   ├── test_mesh_protocol.py        # Multi-pole payload normalization tests
│   └── test_api_endpoints.py        # FastAPI HTTP routes and WebSocket tests
│
├── data/                            # Persistent Runtime Logs & Data
│   └── ai_logs/                     # Session history logs
│
├── main.py                          # Application entry point & FastAPI lifespan manager
├── init_postgres.py                 # Standalone database initialization script
├── clean_db.py                      # Database wipe / maintenance script
├── requirements.txt                 # Pinned Python package dependencies
└── README.md                        # Backend documentation guide
```

---

## 📡 3. Embedded Firmware Architecture

Microcontroller sketches deployed across field utility poles:

```
firmware/
├── pole1_sensor_node/
│   └── pole1_sensor_node.ino        # Pole 1: Submersion & Flood Monitoring Node (HC-SR04, ZMPT101B, Tilt, MQ)
├── pole2_sensor_node/
│   └── pole2_sensor_node.ino        # Pole 2: Electrical Grid & Energy Metering Node (PZEM-004T, Tilt, MQ)
├── pole3_gateway_hub/
│   └── pole3_gateway_hub.ino        # Pole 3: painlessMesh Root Gateway Sink & Serial UART Bridge
└── README.md                        # Firmware documentation guide
```

---

## 🛡️ 4. Engineering Principles & Guidelines

### Rule 1: Strict Modularity (< 200 Lines)
- No code file (Python, TypeScript, or JSX) shall exceed 200 lines.
- When adding new cards, filters, or inspection elements, create a dedicated component in `components/<domain>/` and export props with clean TypeScript interfaces.

### Rule 2: Strict Air-Gapped Operation
- Never import external CDN resources (`unpkg`, `cdnjs`, Google Fonts).
- All fonts are bundled locally using `@fontsource/inter`.
- All icons are imported locally from `lucide-react`.

### Rule 3: Uniform 1x1 Settings Grid
- The Settings view uses:
  ```css
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  ```
- Thresholds are split between `VoltageFloodThresholdCard` and `GasThresholdCard` to avoid vertical card stretching.
- Model tags in `OllamaConfigCard` accept custom pulled model names via text input matching the `ollama pull <tag>` format.

### Rule 4: Decoupled High-Throughput Buffering
- Telemetry never executes individual synchronous `INSERT` queries on the serial or MQTT thread.
- In-memory ring buffer queues records and flushes to PostgreSQL every 250-300ms using `executemany` or binary copy.
