# NIRIKSHA Web Dashboard

Offline-capable, laboratory-grade municipal control dashboard for the NIRIKSHA environmental intelligence and multi-hazard monitoring network.

---

## 🎨 Technology Stack & Architecture

- **Framework:** React 19 + TypeScript 5
- **Bundler:** Vite 6 with high-efficiency Rollup tree-shaking
- **Styling:** TailwindCSS v4 + Vanilla CSS tokens (Strict light-themed laboratory aesthetic: `bg-slate-50`, card containers `bg-white border border-slate-200 shadow-sm`, corporate cobalt blue `#2563eb`)
- **Offline Fonts:** `@fontsource/inter` (air-gapped, zero external Google Fonts or CDN requests)
- **Icons:** `lucide-react` (locally bundled SVG icons)
- **Visualization:** `recharts` with sliding-window buffers
- **Audio Synthesizer:** Procedural Web Audio API oscillator synthesis (real-time dual-frequency wailing emergency sirens without external MP3 files)

---

## 📂 Source Code Structure

The client enforces modular file architecture where every view is decomposed into specialized, reusable subcomponents:

```
frontend/src/
├── assets/                         # Local static graphics and branding
├── components/
│   ├── ai/                         # Offline AI Diagnostics Subcomponents
│   │   ├── AiChatSidebar.tsx       # Conversation history, session switching & rename/delete modals
│   │   ├── AiChatWindow.tsx        # Message rendering with offline Markdown & timestamp formatting
│   │   └── AiPromptInput.tsx       # Chat input textarea, keyboard listeners & quick prompt chips
│   │
│   ├── alerts/                     # Incident Tracking & Alert Center
│   │   ├── AlertsStatusHeader.tsx  # Unresolved incident count & audio siren toggle
│   │   ├── AlertsKpiStrip.tsx      # 4-card metric strip (Critical, Warning, Live, Resolved)
│   │   ├── LiveIncidentsCard.tsx   # Active unacknowledged hazard breaches
│   │   ├── AlertsFilterBar.tsx     # Full-text search, Pole selector, severity & page size
│   │   ├── AlertsTable.tsx         # Multi-select row selection, status badges & resolve actions
│   │   └── AlertsPagination.tsx    # Page navigation controls & PostgreSQL compliance notice
│   │
│   ├── charts/                     # Real-Time Telemetry Plotting
│   │   ├── CompareChartCard.tsx    # Multi-node overlay chart
│   │   ├── TelemetryChart.tsx      # Single metric sliding-window line/area chart
│   │   └── TelemetryChartsGrid.tsx # Responsive grid of telemetry sensor charts
│   │
│   ├── compare/                    # Multi-Node Comparative Analytics
│   │   ├── CompareControlsBar.tsx  # Multi-pole selector and metric toggles
│   │   ├── CompareMatrixTable.tsx  # Cross-node side-by-side metric comparison matrix
│   │   └── CompareNodeSummaryCard.tsx # Summary statistics per compared node
│   │
│   ├── dashboard/                  # Primary Control Center Widgets
│   │   ├── AddCardModal.tsx        # Dynamic metric tile addition modal
│   │   ├── CustomizableDashboard.tsx # Drag-and-drop / customizable card layout
│   │   ├── DashboardControlsBar.tsx # Layout presets, card toggles & reset actions
│   │   ├── DashboardMapCard.tsx    # Compact embedded vector map preview
│   │   ├── DashboardMetricTile.tsx # Real-time sensor gauge card with status pill
│   │   └── RealtimeIncidentsBanner.tsx # Dynamic animated alert banner on critical hazard
│   │
│   ├── fleet/                      # Mesh Fleet & Station Overview
│   │   ├── FleetFilterBar.tsx      # Filter by health status, pole type, or query
│   │   └── FleetNodeCard.tsx       # Comprehensive status card for each monitored pole
│   │
│   ├── history/                    # Historical Telemetry Explorer
│   │   ├── HistoryFilterBar.tsx    # Time range selector, pole filter & search
│   │   ├── HistoryPacketModal.tsx  # Deep inspection modal for a single telemetry frame
│   │   ├── HistoryPagination.tsx   # High-efficiency page controls
│   │   └── HistoryTable.tsx        # Tabular sensor records with status indicators
│   │
│   ├── map/                        # Geospatial Vector Schematic
│   │   ├── LiveMapLegend.tsx       # Sensor condition legend and node icon keys
│   │   ├── MapFilterControls.tsx   # Interactive layer visibility toggles
│   │   ├── PoleInspectionModal.tsx # Full diagnostic telemetry dialog for selected node
│   │   └── VectorSchematicCanvas.tsx # Lightweight vector canvas schematic
│   │
│   ├── modals/                     # Critical Life-Safety Emergency Modals
│   │   ├── FireEmergencyModal.tsx  # Full-screen thermal/gas alarm intercept modal
│   │   └── VoltageEmergencyModal.tsx # Full-screen water electrification hazard modal
│   │
│   ├── reports/                    # Compliance Audit & Report Generation
│   │   ├── AuditChartsSection.tsx  # Historical trend charts for printed reports
│   │   ├── ReportExecutiveSummary.tsx # High-level audit summary and incident totals
│   │   ├── ReportGasAuditCard.tsx  # Air quality and gas threshold breach summaries
│   │   ├── ReportNodeStatsTable.tsx # Per-pole uptime and packet statistics table
│   │   └── ReportsFilterBar.tsx    # Date range selector and CSV/PDF export controls
│   │
│   ├── settings/                   # System Configuration Cards (Uniform 1x1 Grid)
│   │   ├── DatabaseMaintenanceCard.tsx # PostgreSQL health check, host/port, audit wipe
│   │   ├── GasThresholdCard.tsx    # MQ-2, MQ-7, MQ-135, MQ-136 alarm thresholds
│   │   ├── OllamaConfigCard.tsx    # Local Ollama endpoint host & model tag input
│   │   ├── TelemetrySourceCard.tsx # UART COM port, baud rate & MQTT broker configuration
│   │   └── VoltageFloodThresholdCard.tsx # AC voltage threshold & ultrasonic flood clearance
│   │
│   ├── views/                      # Primary Application View Orchestrators
│   │   ├── AiAssistantView.tsx     # Conversational offline AI diagnostics center
│   │   ├── AlertsHistoryView.tsx   # Centralized incident audit and resolution view
│   │   ├── CompareDashboardView.tsx # Multi-node cross-comparison interface
│   │   ├── FleetNodesView.tsx      # Comprehensive fleet status overview
│   │   ├── HistoryView.tsx         # Deep historical telemetry table view
│   │   ├── LiveMapView.tsx         # Full-screen geospatial vector schematic
│   │   ├── ReportsView.tsx         # Municipal compliance report generator
│   │   └── SettingsView.tsx        # System configuration and hardware settings
│   │
│   ├── AiAssistantDrawer.tsx       # Global slide-over AI diagnostics drawer
│   ├── ConfigBar.tsx               # Status bar displaying active COM port / MQTT state
│   ├── HazardBanners.tsx           # Floating hazard warning banners
│   ├── Header.tsx                  # Top header, live status, audio toggle & drawer trigger
│   ├── MarkdownContent.tsx         # Secure offline Markdown renderer for AI messages
│   ├── MetricCard.tsx              # Reusable metric display card
│   ├── MetricCardsGrid.tsx         # Responsive metric card layout container
│   ├── PoleNav.tsx                 # Compact pole navigation tabs
│   ├── PoleSelectDropdown.tsx      # Searchable dropdown supporting unlimited fleet growth
│   └── Sidebar.tsx                 # Primary navigation sidebar
│
├── constants/
│   ├── gasThresholds.ts            # Canonical threshold constants for MQ sensor array
│   └── polesCatalog.ts             # Default pole coordinates, hardware specs & labels
│
├── context/                        # Global state providers
├── hooks/
│   ├── useAlerts.ts                # Client-side hazard evaluation and alert state
│   ├── useEmergencyAudio.ts        # Web Audio API emergency siren synthesizer
│   ├── useHazardDetection.ts       # Cross-sensor composite hazard detection logic
│   └── useWebSocketTelemetry.ts    # High-throughput WebSocket subscriber with auto-reconnect
│
├── types/
│   └── telemetry.ts                # TypeScript interfaces for packets, alerts, and nodes
│
├── App.tsx                         # Root component, routing, and global modal mounting
├── main.tsx                        # Application mount point with offline font imports
├── index.css                       # Global CSS tokens, reset rules, and laboratory palette
└── App.css                         # Layout and animation styles
```

---

## ⚡ Performance Directives

1. **Sliding Window Buffers:** All real-time telemetry series enforce a sliding window buffer of maximum **50 to 100 data points**. Older frames are dropped to prevent memory leaks during 24/7 continuous operation.
2. **`requestAnimationFrame` Render Throttling:** Incoming high-frequency WebSocket frames are batched and scheduled through `requestAnimationFrame`, preventing UI frame stutter and eliminating canvas lag.
3. **Procedural Audio Synthesis:** Emergency warning alarms use the browser's native `AudioContext` to synthesize dual-tone wailing sirens (`800Hz` – `1200Hz`) dynamically, ensuring zero external MP3 dependencies.

---

## 🛠️ Build & Development Commands

```powershell
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run TypeScript typecheck and build production bundle
npm run build

# Preview production build locally
npm run preview
```
