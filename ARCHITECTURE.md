# Engineering Architecture Reference: NIRIKSHA IoT Platform

NIRIKSHA is an offline-first, laboratory-grade smart IoT mesh telemetry and municipal hazard monitoring platform. This document serves as the high-level technical architecture reference for systems engineers, outlining the end-to-end data pipeline, dual-protocol telemetry ingestion, algorithmic signal processing, asynchronous database buffering, and frontend rendering pipeline.

For detailed subsystem documentation, refer to the [Technical Documentation Hub](file:///d:/proj/SIH/docs/README.md).

---

## 1. System Topology & Layered Pipeline

```d2
direction: right

edge: Field Sensor Nodes (2.4 GHz RF Mesh) {
  style.fill: "#f8fafc"
  style.stroke: "#94a3b8"

  p1: Pole 1: Flood & Submersion {
    shape: rectangle
    style.fill: "#f0fdf4"
    style.stroke: "#16a34a"
    sensors: "ZMPT101B (Voltage)\nHC-SR04 (Ultrasonic Depth)\nSW-520D (Tilt Switch)\nMQ Gas Array"
    rate: "Transmit: 2300ms"
  }

  p2: Pole 2: Grid & Current {
    shape: rectangle
    style.fill: "#eff6ff"
    style.stroke: "#2563eb"
    sensors: "PZEM-004T (V, I, W, kWh, PF)\nSW-520D (Tilt Switch)\nMQ Gas Array"
    rate: "Transmit: 2500ms"
  }

  p3: Pole 3: Root Gateway Hub Node {
    shape: rectangle
    style.fill: "#fef3c7"
    style.stroke: "#d97706"
    role: "painlessMesh Root Sink\nSerial UART Bridge (115200)"
  }

  p1 -> p3: "painlessMesh 2.4GHz RF" {
    style.stroke: "#16a34a"
    style.stroke-dash: 3
  }
  p2 -> p3: "painlessMesh 2.4GHz RF" {
    style.stroke: "#2563eb"
    style.stroke-dash: 3
  }
}

ingest: Dual Ingestion Protocols {
  style.fill: "#ffffff"
  style.stroke: "#64748b"

  pyserial: PySerial Ingestion Worker (serial_manager.py) {
    shape: step
    style.fill: "#fef3c7"
    style.stroke: "#d97706"
    desc: "Dedicated daemon thread with exponential reconnect backoff"
  }

  mqtt: Async MQTT Ingestor (mqtt_manager.py) {
    shape: step
    style.fill: "#eff6ff"
    style.stroke: "#2563eb"
    desc: "aiomqtt client on TCP 1883"
  }

  edge.p3 -> pyserial: "USB UART (COM Port)" {
    style.stroke: "#d97706"
    style.stroke-width: 2
  }
}

norm: Unified Normalizer (normalizer.py) {
  shape: class
  style.fill: "#e0e7ff"
  style.stroke: "#4f46e5"
  desc: "Maps payload to Unified Schema\nInactive sensors -> NOT_CONNECTED / null"
}

ingest.pyserial -> norm: "Raw text lines"
ingest.mqtt -> norm: "Decoded JSON"

analytics: Algorithmic Signal Processing Pipeline {
  style.fill: "#f8fafc"
  style.stroke: "#64748b"

  kalman: 1D Linear Kalman Filter (kalman.py) {
    shape: step
    style.fill: "#ede9fe"
    style.stroke: "#7c3aed"
    desc: "Tuned Q/R noise rejection on ADC & Ultrasonic sensors"
  }

  anomaly: Statistical Anomaly Bank (anomaly.py) {
    shape: step
    style.fill: "#ede9fe"
    style.stroke: "#7c3aed"
    desc: "Streaming EWMA mean/variance & CUSUM drift detection"
  }

  fusion: Multi-Sensor Hazard Fusion (fusion_engine.py) {
    shape: step
    style.fill: "#fee2e2"
    style.stroke: "#ef4444"
    desc: "Electrocution Risk Index & Fire Combustion Index"
  }

  norm -> kalman: "Normalized floats"
  kalman -> anomaly: "Filtered values"
  anomaly -> fusion: "Drift flags + clean values"
}

fanout: Decoupled Fan-Out Architecture {
  style.fill: "#ffffff"
  style.stroke: "#cbd5e1"

  buffer: Decoupled In-Memory Batch Buffer (buffer.py) {
    shape: queue
    style.fill: "#fef9c3"
    style.stroke: "#ca8a04"
    desc: "Flushed every 250-300ms or 50 items"
  }

  ws_hub: WebSocket Connection Manager (connection_manager.py) {
    shape: step
    style.fill: "#dbeafe"
    style.stroke: "#2563eb"
    desc: "Thread-safe asyncio broadcast registry"
  }

  analytics.fusion -> buffer: "Enriched record"
  analytics.fusion -> ws_hub: "Live broadcast"
}

storage: PostgreSQL Time-Series Database {
  shape: cylinder
  style.fill: "#dcfce7"
  style.stroke: "#16a34a"
  desc: "Indexed telemetry & alerts tables via asyncpg pool"
}

client: React 19 + Vite Dashboard (Air-Gapped) {
  shape: rectangle
  style.fill: "#ffffff"
  style.stroke: "#2563eb"
  style.stroke-width: 2
  features: "Sliding window state (50-100 pts)\nrequestAnimationFrame (60 FPS)\nProcedural Web Audio API Siren\nLaboratory light aesthetic (bg-slate-50)"
}

fanout.buffer -> storage: "Multi-row executemany batch" {
  style.stroke: "#16a34a"
  style.stroke-width: 2
}
fanout.ws_hub -> client: "WebSocket /ws/telemetry" {
  style.stroke: "#2563eb"
  style.stroke-width: 2
}
```

---

## 2. Layered Modular Architecture & < 200 Lines Constraint

In accordance with strict production guidelines, every module in `backend/` and `frontend/` is designed with single responsibility and strictly contains fewer than 200 lines of code.

```
SIH/
├── backend/app/
│   ├── core/
│   │   ├── config.py              # Strongly typed settings from .env (44 lines)
│   │   └── __init__.py
│   ├── db/
│   │   ├── connection.py          # asyncpg pool lifecycle & re-auth (114 lines)
│   │   ├── schema.py              # DDL schema migrations & performance indexes (87 lines)
│   │   ├── buffer.py              # Memory batch buffer & flusher (78 lines)
│   │   ├── telemetry_repo.py      # Telemetry history, stats, and queries (188 lines)
│   │   ├── alerts_repo.py         # Incident persistence, resolution, dedup (169 lines)
│   │   └── __init__.py
│   ├── protocols/
│   │   ├── normalizer.py          # Unified sensor schema transformation (77 lines)
│   │   ├── serial_manager.py      # Crash-resilient PySerial listener (116 lines)
│   │   ├── mqtt_manager.py        # Asynchronous aiomqtt subscriber & publisher (122 lines)
│   │   └── __init__.py
│   ├── analytics/
│   │   ├── kalman.py              # 1D discrete-time linear Kalman filter (59 lines)
│   │   ├── anomaly.py             # Streaming EWMA and CUSUM drift detection (71 lines)
│   │   ├── fusion_engine.py       # Electrocution Risk & Fire Index scoring (154 lines)
│   │   └── __init__.py
│   ├── ai/
│   │   ├── schemas.py             # Pydantic models for chat & Ollama (16 lines)
│   │   ├── diagnostics.py         # Deterministic domain rule heuristics (118 lines)
│   │   ├── ollama.py              # Ollama LLM integration & Markdown audit (85 lines)
│   │   └── __init__.py
│   ├── routers/
│   │   ├── ports.py               # Serial COM listing & baud setup (26 lines)
│   │   ├── mqtt.py                # MQTT client status & configuration (26 lines)
│   │   ├── telemetry.py           # Recent, historical, stats, and CSV export (134 lines)
│   │   ├── alerts.py              # Incident query and resolution endpoints (65 lines)
│   │   ├── websockets.py          # Real-time WebSocket streaming (23 lines)
│   │   ├── ai_assistant.py        # Assistant chat endpoint (85 lines)
│   │   └── __init__.py
│   ├── connection_manager.py      # Thread-safe WebSocket connection registry (39 lines)
│   └── schemas.py                 # Common schemas (16 lines)
├── backend/database.py            # Backward-compatibility facade (46 lines)
├── backend/serial_manager.py      # Backward-compatibility facade (7 lines)
├── backend/mock_simulator.py      # Deprecation stub enforcing zero-mock directive (11 lines)
└── backend/main.py                # Application entrypoint & lifespan (108 lines)
```

---

## 3. Algorithmic Telemetry Processing Pipeline

```d2
direction: down

signal_in: Raw Transducer Value z_k {
  shape: document
  style.fill: "#f8fafc"
}

kalman_stage: 1D Discrete-Time Linear Kalman Filter {
  style.fill: "#ede9fe"
  style.stroke: "#7c3aed"

  pred: "1. Predict: x_hat_k|k-1 = x_hat_k-1|k-1, P_k|k-1 = P_k-1 + Q"
  gain: "2. Gain: K_k = P_k|k-1 / (P_k|k-1 + R)"
  update: "3. Update: x_hat_k|k = x_hat_k|k-1 + K_k*(z_k - x_hat_k|k-1)"
  cov: "4. Covariance: P_k|k = (1 - K_k)*P_k|k-1"
}

signal_in -> kalman_stage.pred: "Noisy ADC / Echo sample"

anomaly_stage: Streaming Anomaly & Drift Engine {
  style.fill: "#ede9fe"
  style.stroke: "#7c3aed"

  ewma: "EWMA Baseline: mu_k = mu_k-1 + alpha*(x_k - mu_k-1)"
  zscore: "Surge Test: |z_k| = |x_k - mu_k| / sigma_k > 3.0"
  cusum: "CUSUM Drift: S_k^+ = max(0, S_k-1^+ + e_k - k)"
}

kalman_stage.update -> anomaly_stage.ewma: "Noise-Suppressed x_hat"

fusion_stage: Multi-Sensor Composite Hazard Fusion {
  style.fill: "#fee2e2"
  style.stroke: "#ef4444"

  elec: "Electrocution Risk Index: min(100, V_score * Depth_factor)"
  fire: "Fire Combustion Index: min(100, Thermal + CO + Combustible)"
  tilt: "Tilt Debounce: 2 consecutive displaced samples required"
}

anomaly_stage.zscore -> fusion_stage.elec: "Conditioned metric stream"

alert_out: Dispatched Alert & DB Row {
  shape: document
  style.fill: "#dcfce7"
  style.stroke: "#16a34a"
}

fusion_stage -> alert_out: "Enriched Telemetry"
```

### Mathematical Formulations & Tuning:
- **Ultrasonic Depth**: $Q = 0.05, R = 2.0$ (absorbs surface waves while tracking flood level).
- **Gas ADC Array**: $Q = 0.01, R = 0.8$ (smooths sensor heating cycle spikes).
- **Electrical Potential**: $Q = 0.1, R = 0.2$ (fast response to lethal voltage leakage).
- **Electrocution Risk Index ($0 - 100\%$)**: Fuses voltage potential with water depth ($S_{\text{volt}} \times \text{Multiplier}_{\text{depth}}$).
- **Fire & Thermal Combustion Index ($0 - 100\%$)**: Fuses thermal gradient with carbon monoxide (MQ-7) and flammable hydrocarbons (MQ-2).

---

## 4. Ingestion & Storage Decoupling Architecture

To guarantee the backend handles bursts without locking the asyncio loop:
1. **Serial Background Thread**: Dedicated thread reads UART non-blockingly, catching `SerialException` and reconnecting with fixed 2-second backoff.
2. **aiomqtt Ingestion Task**: Concurrent async coroutine subscribing to `niriksha/poles/+/telemetry`.
3. **Decoupled Batch Buffer**: Packets append to an in-memory queue. Flushes occur every 250–300 ms or upon reaching 50 records via `asyncpg.Connection.executemany`.
4. **WebSocket Fan-Out**: Thread-safe async registry broadcasts packets to connected browser tabs without blocking database transactions.

---

## 5. Comprehensive Documentation Matrix

For complete technical specifications, consult the dedicated documentation chapters:

- **[01. System Architecture](file:///d:/proj/SIH/docs/01_SYSTEM_ARCHITECTURE.md)**: End-to-end topology, fault boundaries, and data lifecycles.
- **[02. Hardware & Mesh Network](file:///d:/proj/SIH/docs/02_HARDWARE_AND_MESH.md)**: Microcontroller pinout tables, painlessMesh RF cadence, and sensor calibration math.
- **[03. Ingestion & Protocols](file:///d:/proj/SIH/docs/03_INGESTION_AND_PROTOCOLS.md)**: PySerial thread, aiomqtt client, zero-mock directive, and unified schema normalizer.
- **[04. Analytics & Algorithms](file:///d:/proj/SIH/docs/04_ANALYTICS_AND_ALGORITHMS.md)**: 1D Kalman filter state equations, EWMA, CUSUM drift detection, and hazard fusion scoring.
- **[05. Database & Storage](file:///d:/proj/SIH/docs/05_DATABASE_AND_STORAGE.md)**: PostgreSQL DDL schemas, indexing strategies, and asyncpg batch buffering.
- **[06. Frontend & Dashboard](file:///d:/proj/SIH/docs/06_FRONTEND_AND_DASHBOARD.md)**: React 19 architecture, 60fps RAF throttling, sliding window buffer, and procedural Web Audio sirens.
- **[07. AI Diagnostics Engine](file:///d:/proj/SIH/docs/07_AI_DIAGNOSTICS_ENGINE.md)**: Deterministic heuristic safety rules, Ollama local LLM runtime, and dynamic telemetry injection.
- **[08. Operations & Runbook](file:///d:/proj/SIH/docs/08_OPERATIONS_AND_RUNBOOK.md)**: PowerShell CLI (`manage.ps1`), port mappings, configuration, and troubleshooting runbooks.
