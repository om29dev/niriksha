# Offline Light-Themed IoT Dashboard Project Rules

## Core Operational Directives

1. **Strict Offline Operation (Air-Gapped Standard)**
   - Never reference external CDNs (Google Fonts, unpkg, cdnjs, cloudflare, etc.) in `index.html` or CSS.
   - All fonts MUST be imported through NPM `@fontsource/*` packages and bundled into static production CSS.
   - All icons MUST be bundled locally via `lucide-react`.

2. **Aesthetic & Theme Guidelines**
   - Strictly light-themed laboratory/industrial aesthetic.
   - Backgrounds: `bg-slate-50`, card containers: `bg-white border border-slate-200 shadow-sm`.
   - Typography: Clean slate hierarchy (`text-slate-900`, `text-slate-700`, `text-slate-500`).
   - Primary Accent: Corporate Cobalt Blue (`#2563eb` / Tailwind `blue-600`).
   - Chart Lines: High-contrast cobalt blue `#2563eb`, grid lines in soft slate `#e2e8f0`.

3. **Database & Environment Standards (PostgreSQL + asyncpg)**
   - All database credentials, host, port, and batch flushing tuning MUST be loaded from `.env` via `python-dotenv`.
   - Telemetry ingestion must enforce decoupled in-memory batch buffers flushed in multi-row transactions (`executemany` or binary `copy`) every 250-300ms.
   - Manage database connectivity through a long-lived `asyncpg.Pool` created in the FastAPI lifecycle.

4. **Serial Communication & Fault Tolerance**
   - The PySerial background ingestion worker must handle `serial.SerialException` gracefully.
   - Never allow a disconnected or unseated USB cable to crash the FastAPI backend.
   - Provide an automatic reconnection retry loop with exponential or fixed backoff (1-2s).
   - Provide a built-in virtual/mock fallback mode so developers can test without requiring physical hardware.

5. **Client Performance & Memory Protection**
   - Real-time data arrays in React state must enforce a sliding window buffer (maximum 50 to 100 data points per series).
   - Use `requestAnimationFrame` to throttle canvas/SVG rendering from raw high-frequency WebSocket packet rates to eliminate canvas/SVG lag during continuous 24/7 uptime.

6. **Multi-Node Mesh Telemetry & Unified Sensor Schema**
   - Microcontroller `.ino` sketches in `lastlocal/` are read-only and must never be altered directly by agents unless explicitly directed.
   - All poles (Pole 1, Pole 2, Pole 3) transmit into the Root Hub (Pole 3) and are parsed into a **unified sensor schema**.
   - Every telemetry packet emitted over WebSockets and saved to PostgreSQL provides the complete sensor suite (`temperature`, `humidity`, `water_depth`, `is_upright`, `voltage`, `current_ma`, `power`, `energy`, `frequency`, `pf`).
   - If a pole does not physically carry or activate a specific sensor (e.g. DHT11 on Pole 1 & 2, or PZEM/Ultrasonic on Pole 3), its status in `sensors` MUST be explicitly set to `"NOT_CONNECTED"` and its numerical value to `null`/`None`.
   - The React frontend must visually display `"Not Connected"` for inactive sensors instead of displaying misleading `0` values.

7. **Skill Consultation & Adherence (Mandatory)**
   - Always check the available skills (`.agents/skills/` and registered skills) before planning, implementing, or modifying features.
   - If a task touches an area covered by a skill (e.g., `fastapi-iot-backend`, `postgres-asyncpg-iot`, `pyserial-iot-telemetry`, `react-iot-dashboard`, `offline-iot-dashboard`, `ai-telemetry-assistant`, `spatial-map-reporting`), you MUST inspect and consult the relevant `SKILL.md` before executing changes.

8. **Modular File Architecture & Scalability Standard**
   - Favor clean, focused, modular files under 100 lines wherever feasible.
   - Sub-components (legends, modals, inspection cards, selectors) should be organized in designated directories (`components/map/`, `components/dashboard/`, `constants/`, etc.).
   - Multi-node selectors must always utilize scalable search dropdowns (`PoleSelectDropdown`) to support arbitrary fleet growth beyond 3 poles.

