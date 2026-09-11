# NIRIKSHA Architecture & Modular Component Reference

This guide documents the modular file architecture, component hierarchy, and backend layout of NIRIKSHA. All components adhere strictly to project Rule #8 (modular files under 100–250 lines) and strict air-gapped laboratory styling rules.

---

## 🏗️ 1. Frontend Modular Architecture

The frontend is built with **React 18 + Vite + TypeScript**. High-complexity monolithic views have been decomposed into focused subcomponents categorized by domain.

### 📂 Directory Layout

```
frontend/src/
├── components/
│   ├── ai/                          # Offline AI Assistant Subcomponents
│   │   ├── AiChatSidebar.tsx        # Session management, rename/delete modals, search filter
│   │   ├── AiChatWindow.tsx         # Message history rendering, MarkdownContent, auto-scroll
│   │   └── AiPromptInput.tsx        # Chat prompt input, keyboard listeners, quick prompt chips
│   │
│   ├── alerts/                      # Alerts History & Incident Subcomponents
│   │   ├── AlertsStatusHeader.tsx   # Unresolved status counter, siren mute/arm audio toggle
│   │   ├── AlertsKpiStrip.tsx       # 4-card metric strip (Critical, Warning, Live, Resolved)
│   │   ├── LiveIncidentsCard.tsx    # Active sensor breaches (voltage, gyro tilt, flood, gas)
│   │   ├── AlertsFilterBar.tsx      # Search input, Pole dropdown filter, severity & page size
│   │   ├── AlertsTable.tsx          # Paginated table, multi-select checkboxes, individual resolve
│   │   └── AlertsPagination.tsx     # Page controls, range counters, PostgreSQL compliance note
│   │
│   ├── settings/                    # System Settings Subcomponents (Uniform 1x1 Cards)
│   │   ├── TelemetrySourceCard.tsx  # UART serial COM port, baud rate, MQTT broker configuration
│   │   ├── VoltageFloodThresholdCard.tsx # Voltage danger trigger & ultrasonic flood clearance
│   │   ├── GasThresholdCard.tsx     # MQ-7 (CO), MQ-135 (Air Quality), MQ-136 (H2S), MQ-2 (LPG)
│   │   ├── OllamaConfigCard.tsx     # Direct text input for model tags (`ollama pull` style) & host
│   │   └── DatabaseMaintenanceCard.tsx # Host/port/user, schema check, and audit wipe
│   │
│   ├── map/                         # Spatial Map & SVG Schematic Subcomponents
│   │   ├── LiveMapLegend.tsx        # Sensor status legend and pole marker key
│   │   ├── MapFilterControls.tsx    # Node selector and view filter toggles
│   │   ├── PoleInspectionModal.tsx  # Detailed inspection dialog for selected pole
│   │   └── VectorSchematicCanvas.tsx # Lightweight vector canvas schematic
│   │
│   ├── views/                       # Top-Level Orchestrator Views
│   │   ├── LiveMapView.tsx          # Real-time physical geospatial schematic orchestrator
│   │   ├── AlertsHistoryView.tsx    # Alert incident center and PostgreSQL audit view (~240 lines)
│   │   ├── AiAssistantView.tsx      # Multi-session offline AI reasoning interface (~230 lines)
│   │   ├── SettingsView.tsx         # Uniform grid settings view (~230 lines)
│   │   └── AuditReportsView.tsx     # PostgreSQL telemetry audit query & export view
│   │
│   ├── AiAssistantDrawer.tsx        # Global slide-over AI assistant drawer
│   ├── AlertsCenterCard.tsx         # Dashboard quick alerts card
│   ├── LiveTelemetryView.tsx        # High-frequency WebSocket sensor telemetry dashboard
│   ├── MarkdownContent.tsx          # Offline Markdown renderer for AI messages
│   ├── NavigationBar.tsx            # Top header, tab switcher, audio mute and drawer button
│   └── PoleSelectDropdown.tsx       # Scalable search dropdown supporting arbitrary fleet size
│
├── constants/
│   ├── gasThresholds.ts             # Default PPM thresholds for MQ-2, MQ-7, MQ-135, MQ-136
│   └── polesCatalog.ts              # Canonical pole coordinates and hardware descriptions
│
├── hooks/
│   ├── useAlerts.ts                 # Real-time rule-engine evaluation and alert persistence
│   ├── useAudioAlarm.ts             # Synthesized offline Web Audio API siren (no external MP3s)
│   ├── usePostgresAlerts.ts         # PostgreSQL fetch, pagination, and status resolution hooks
│   └── useWebSocketTelemetry.ts     # Resilient WebSocket connection with automatic reconnect
│
└── types/
    └── telemetry.ts                 # Unified sensor packet schema (DHT11, Gyro, PZEM, MQ array)
```

---

## ⚙️ 2. Backend Modular Architecture

The backend is built with **FastAPI**, **asyncpg**, and **PySerial**, providing non-blocking ingestion and asynchronous WebSocket broadcasting.

```
backend/
├── app/
│   ├── main.py                      # FastAPI lifespan, router mounting, CORS configuration
│   ├── config.py                    # Environment variable parsing from `.env`
│   ├── database.py                  # asyncpg.Pool management & batch insert queue
│   │
│   ├── routers/
│   │   ├── telemetry.py             # WebSocket `/ws/telemetry` & historical REST queries
│   │   ├── alerts.py                # REST endpoints for PostgreSQL alert audit & resolution
│   │   ├── reports.py               # Time-series CSV/JSON report generators
│   │   ├── ai_assistant.py          # Ollama local LLM chat endpoint & config persistence
│   │   └── system.py                # Hardware COM port scanning & service health checks
│   │
│   ├── services/
│   │   ├── serial_worker.py         # PySerial background thread with reconnection backoff
│   │   ├── virtual_hardware.py      # Synthetic telemetry generator for testing without USB
│   │   └── ollama_client.py         # Asynchronous HTTP client communicating with Ollama
│   │
│   └── prompts/
│       └── ollama_system_prompt.md  # Industrial domain prompt with dynamic telemetry injection
│
├── init_postgres.py                 # Idempotent database schema & index initializer
└── requirements.txt                 # Pinned Python package dependencies
```

---

## 🛡️ 3. Development Guidelines & Patterns

### Rule 1: Strict Modularity (< 250 Lines)
- Never allow a view or component to grow into a monolithic >500 line file.
- When adding new cards, filters, or inspection elements, create a dedicated component in `components/<domain>/` and export props with clean TypeScript interfaces.

### Rule 2: Air-Gapped Operation
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
