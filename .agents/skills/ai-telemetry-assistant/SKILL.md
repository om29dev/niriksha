---
name: ai-telemetry-assistant
description: >-
  Guidelines and specifications for the offline AI Telemetry Assistant in NIRIKSHA.
  Covers offline diagnostic reasoning, rule-engine hazard heuristics, WebSocket/database context
  ingestion, prompt engineering for industrial IoT, and conversational drawer architecture.
---

# AI Telemetry Assistant Skill

This skill documents the engineering guidelines, heuristics, and integration patterns for the offline **NIRIKSHA AI Assistant** and diagnostic reasoning engine.

---

## 🏛️ System Role & Capabilities

1. **Air-Gapped Operation Standard:**
   - The AI Assistant operates completely offline without external cloud API dependencies.
   - Core inference uses domain-specific heuristic engines (`backend/app/routers/ai_assistant.py`) and live PostgreSQL telemetry lookups.
   - It supports optional plug-and-play local LLM inference engines (e.g., Ollama or local endpoint) configured in Settings.

2. **Full Sensor Visibility:**
   The AI Assistant has real-time awareness of all 10 unified sensor dimensions:
   - **Water Electrification Potential:** Water probe voltage (>5.0V trigger).
   - **Structural Inversion:** SW-520D tilt switch (`is_upright: false`).
   - **Flood Inundation:** HC-SR04 ultrasonic water depth (>100cm flood line).
   - **Power Grid Load:** PZEM-004T active voltage (V), current (mA), and power (W).
   - **Ambient Environment:** DHT11 temperature (°C) and humidity (%).
   - **Gas Array:** MQ-7 (CO), MQ-135 (Air Quality), MQ-136 (H₂S), MQ-2 (Combustible Gas).

---

## ⚡ Architecture & Endpoints

### 1. Backend REST Endpoint (`/api/ai/chat`)
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "message": "Check if any poles have tilted",
    "history": [{"role": "user", "content": "..."}],
    "active_pole": 1
  }
  ```
- **Response Body:**
  ```json
  {
    "reply": "### 📐 Structural Pole Orientation Status\n...",
    "context_summary": {
      "active_poles": [1, 2, 3],
      "unresolved_alerts_count": 0,
      "evaluated_at": 1726058000.0
    },
    "timestamp": 1726058000.0
  }
  ```

### 2. Frontend Dual Integration
1. **Dedicated View (`activeView === 'ai'`):**
   - Implemented in `AiAssistantView.tsx`.
   - Full conversational interface with suggested quick prompts, synchronized health ribbons, and markdown rendering.
2. **Global Corner Drawer (`AiAssistantDrawer.tsx`):**
   - Triggered via the **AI Assistant** button in `Header.tsx` (top-right corner).
   - Accessible from *any view* (Dashboard, Live Map, Fleet, Compare, History, Reports, Settings).
   - Features a **Live Sensor Telemetry Ribbon** inspecting real-time metrics for any pole and providing a direct "Go to Pole" shortcut.

---

## 🛠️ Heuristic & Diagnostic Rules

- **Electrocution Hazard:** When voltage > 5.0V on Pole 1 water probe, declare immediate lethal risk and verify lockout relay.
- **Structural Tilt:** When `is_upright === false`, report pole down, trigger structural inspection, and locate geographic coordinates.
- **Flood Warning:** When water depth > 100cm, report street inundation and water height trend.
- **Gas Safety Thresholds:**
  - MQ-7 (Carbon Monoxide): > 50 ppm
  - MQ-135 (Air Quality / NH₃): > 150 ppm
  - MQ-136 (Hydrogen Sulfide Sewer Gas): > 15 ppm
  - MQ-2 (Combustible Gas & Smoke): > 300 ppm
