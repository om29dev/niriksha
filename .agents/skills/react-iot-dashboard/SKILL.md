---
name: react-iot-dashboard
description: >-
  Design guidelines, component patterns, performance optimizations, and offline rules
  for building high-performance React + Vite IoT dashboards with WebSockets, Recharts,
  and laboratory-grade light aesthetics.
---

# React + Vite IoT Dashboard Skill

This skill details component architecture, state management, real-time data throttling, and air-gapped styling for the React frontend.

---

## 🎨 Design & Aesthetic Standard

### 1. Laboratory Light Aesthetic
- **Color Scheme:**
  - Background: `bg-slate-50` (`#f8fafc`).
  - Card & Surfaces: `bg-white border border-slate-200 shadow-sm rounded-lg`.
  - Typography: Dark slate hierarchy (`text-slate-900` headings, `text-slate-700` body, `text-slate-500` captions/labels).
  - Primary Accent: High-contrast Cobalt Blue (`#2563eb` / Tailwind `blue-600`).
  - Status Indicators: Emerald green (`#10b981`) for connected/normal, Amber (`#f59e0b`) for warning, Crimson (`#ef4444`) for error/disconnected.

### 2. Air-Gapped / Strict Offline Compliance
- **Zero External CDN Dependencies:**
  - No `<link>` tags pointing to Google Fonts, unpkg, cdnjs, or unpkg in `index.html`.
  - Fonts must be imported locally via `@fontsource/inter` inside `src/main.tsx` or `src/index.css`.
  - Icons must be bundled locally via `lucide-react`.

---

## ⚡ Real-Time Performance & Memory Safety

### 1. Sliding Window State Management
- Never let incoming telemetry arrays grow unbounded.
- Maintain a bounded buffer (50 to 100 data points per metric series):
  ```tsx
  setHistory((prev) => {
    const updated = [...prev, newPoint];
    return updated.length > 100 ? updated.slice(updated.length - 100) : updated;
  });
  ```

### 2. Throttling High-Frequency Streams
- Microcontrollers streaming at 100Hz+ can overwhelm React's virtual DOM reconciliation and SVG chart rendering.
- Buffer incoming WebSocket messages in a mutable ref (`useRef`) and throttle UI state flushes using `requestAnimationFrame` or a controlled 60fps/16ms tick.

### 3. Resilient WebSocket Hook Pattern
- Reconnection loop: If the WebSocket disconnects, wait 2-3s and automatically reconnect.
- Expose connection status (`CONNECTING`, `OPEN`, `CLOSING`, `CLOSED`) to visual badges.
- Handle malformed JSON safely without throwing uncaught component errors.

### 4. Unified Multi-Pole Ingestion & Inactive Sensors
- Handle unified sensor packets across nodes (`Pole 1`, `Pole 2`, `Pole 3`).
- Track latest readings per node to avoid state clobbering when nodes stream asynchronously.
- Always check sensor `status === "NOT_CONNECTED"`: render a discrete "Not Connected" pill/badge with neutral typography rather than confusing `0` values.

---

## 🛠️ Common Frontend Commands

- **Run frontend development server:**
  ```powershell
  cd frontend
  npm run dev
  ```
- **Typecheck & Production Build:**
  ```powershell
  cd frontend
  npm run build
  ```
- **Run Oxlint:**
  ```powershell
  cd frontend
  npm run lint
  ```
