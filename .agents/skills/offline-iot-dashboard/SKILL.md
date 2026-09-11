---
name: offline-iot-dashboard
description: >-
  Guide and reference for designing, building, and operating offline, laboratory-grade,
  light-themed IoT dashboards using FastAPI, WebSockets, PySerial, PostgreSQL (asyncpg connection pool
  with memory batch buffering), environment variables (.env), and React + Vite (Tailwind CSS, offline fonts,
  sliding-window charts). Use when working on offline hardware monitoring, COM port listeners, or air-gapped IoT telemetry interfaces.
---

# Offline Light-Themed IoT Dashboard Skill

This skill documents the end-to-end architecture, conventions, and operational patterns for building an ultra-reliable, high-throughput, air-gapped IoT telemetry dashboard backed by **PostgreSQL** and **FastAPI**.

---

## 🏛️ Architecture & Principles

### 1. Database Ingestion Strategy: PostgreSQL + asyncpg (Golden Rule)
- **Decoupled Memory Ingestion:** In high-frequency telemetry (50Hz–200Hz+), writing every single row synchronously blocks the event loop and saturates connection pools. 
  - Push incoming serial packets into an in-memory buffer (`_batch_buffer`).
  - Flush the buffer in bulk using `asyncpg` multi-row batch inserts (`executemany` or binary `copy_records_to_table`) when it hits a threshold (e.g., 50 records) or an interval (e.g., every 250–300ms).
- **Long-Lived Connection Pooling:** 
  - Manage a single `asyncpg.Pool` instance inside FastAPI's `lifespan` context.
  - Tune pool size using `min_size` (e.g., 2) and `max_size` (e.g., 10) to eliminate TCP/SSL handshake churn.
- **Strict Environment Configuration:**
  - Store all credentials and settings in a root `.env` file (`python-dotenv`), with a version-controlled `.env.example`.
  - Default credentials:
    ```env
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=postgres
    DB_NAME=iot_dashboard
    ```

### 2. Physical Serial (COM) Resilience
- **Crash-Resistant Auto-Reconnect:** Serial ports can be physically disconnected or reset. The background task must catch `serial.SerialException`, log the state, pause with a backoff (1-2s), and repeatedly re-scan and attempt re-connection without terminating the FastAPI server.
- **Buffer Management:** Clear the input buffer (`flushInput()`) on reconnection to discard partial/corrupted packets.
- **Simulator / Demo Mode:** Always provide an internal synthetic telemetry generator so development, UI review, and unit testing can proceed without a physical microcontroller attached.

### 3. Client-Side Sliding Window & Air-Gapped Rendering
- **Air-Gapped Assets:**
  - Zero external CDN links in `index.html` or CSS.
  - Fonts bundled statically via `@fontsource/inter`.
  - Icons bundled statically via `lucide-react`.
- **Canvas & Memory Protection:**
  - Keep a sliding window buffer of maximum 50–100 data points per metric series (`slice(-50)`).
  - Decouple WebSocket message ingestion from React rendering using `requestAnimationFrame` to prevent SVG reconciliation bottlenecks over 24/7 uptime.

### 4. Laboratory-Grade Light Theme Design System
- **Backgrounds:** Clean neutral `bg-slate-50` (`#f8fafc`), container cards with `bg-white border border-slate-200 shadow-sm rounded-lg`.
- **Accents:** Corporate cobalt blue (`#2563eb`), high-contrast chart curves, and slate typography (`text-slate-900` headings, `text-slate-500` labels).

---

## 🛠️ Verification & Diagnostic Workflow

1. **Verify Database:**
   - Run `python backend/init_postgres.py` to ensure `iot_dashboard` exists and is accessible via `asyncpg`.
2. **Verify Dual Services:**
   - Launch services via PowerShell: `.\manage.ps1 start`.
   - Query recent records: `curl http://127.0.0.1:8000/api/telemetry/recent`.
   - Inspect WebSocket stream: `ws://127.0.0.1:8000/ws`.
3. **Verify Offline Frontend Build:**
   - Run `npm run build` in `frontend/` to confirm clean static compilation.
