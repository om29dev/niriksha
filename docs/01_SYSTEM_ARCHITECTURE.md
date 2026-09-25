# 01. System Architecture & Topology

NIRIKSHA is an offline-capable, distributed environmental intelligence and hazard monitoring platform. The system is engineered to provide continuous situational awareness across disaster-prone areas, urban corridors, and industrial zones where public cloud or cellular networks may be disrupted during extreme weather events.

---

## 1. High-Level System Architecture

The following D2 diagram illustrates the complete end-to-end data pipeline: from physical sensor instrumentation on urban utility poles to real-time browser rendering and local database persistence.

```d2
direction: right

edge_mesh: Field Mesh Network (ESP-NOW 2.4GHz) {
  style.fill: "#f8fafc"
  style.stroke: "#cbd5e1"
  style.stroke-width: 2

  pole1: Pole 1: Flood & Submersion {
    shape: rectangle
    style.fill: "#f0fdf4"
    style.stroke: "#22c55e"
    zmpt: "ZMPT101B (Voltage Leak)"
    hcsr04: "HC-SR04 (Ultrasonic Depth)"
    sw520d_1: "SW-520D (Structural Tilt)"
    mq_p1: "MQ Gas Array"
  }

  pole2: Pole 2: Power Grid & Metering {
    shape: rectangle
    style.fill: "#eff6ff"
    style.stroke: "#3b82f6"
    pzem: "PZEM-004T (V, I, W, kWh, PF)"
    sw520d_2: "SW-520D (Structural Tilt)"
    mq_p2: "MQ Gas Array"
  }

  pole3: Pole 3: Root Gateway Hub Node {
    shape: rectangle
    style.fill: "#fef3c7"
    style.stroke: "#f59e0b"
    sink: "painlessMesh Root Sink"
    serial_tx: "Serial UART Bridge (115200)"
  }

  pole1 -> pole3.sink: "painlessMesh RF (2300ms)" {
    style.stroke: "#22c55e"
    style.stroke-dash: 3
  }
  pole2 -> pole3.sink: "painlessMesh RF (2500ms)" {
    style.stroke: "#3b82f6"
    style.stroke-dash: 3
  }
}

gateway_layer: Ingestion Layer (FastAPI Backend) {
  style.fill: "#ffffff"
  style.stroke: "#94a3b8"
  style.stroke-width: 2

  serial_worker: PySerial Background Worker {
    shape: step
    style.fill: "#f1f5f9"
    style.stroke: "#475569"
    desc: "Dedicated daemon thread with exponential reconnect backoff"
  }

  mqtt_worker: Async MQTT Ingestor (aiomqtt) {
    shape: step
    style.fill: "#f1f5f9"
    style.stroke: "#475569"
    desc: "Subscribes to niriksha/poles/+/telemetry (1883)"
  }

  normalizer: Packet Normalizer {
    shape: class
    style.fill: "#e0e7ff"
    style.stroke: "#4f46e5"
    desc: "Converts payloads to Unified Sensor Schema"
  }

  serial_worker -> normalizer: "Raw MESH_JSON frames"
  mqtt_worker -> normalizer: "Async JSON payloads"
}

edge_mesh.pole3.serial_tx -> gateway_layer.serial_worker: "USB Serial UART (COM Port)" {
  style.stroke: "#d97706"
  style.stroke-width: 2
}

analytics_layer: Algorithmic Signal Processing Pipeline {
  style.fill: "#f8fafc"
  style.stroke: "#64748b"

  kalman: 1D Kalman Filter Bank {
    shape: step
    style.fill: "#ede9fe"
    style.stroke: "#7c3aed"
    desc: "Noise rejection on ADC & Ultrasonic signals"
  }

  anomaly: Statistical Anomaly Bank {
    shape: step
    style.fill: "#ede9fe"
    style.stroke: "#7c3aed"
    desc: "Streaming EWMA baseline, Z-Score surge, CUSUM drift"
  }

  fusion: Multi-Sensor Hazard Fusion Engine {
    shape: step
    style.fill: "#fee2e2"
    style.stroke: "#ef4444"
    desc: "Electrocution Risk Index, Fire Combustion Index, Tilt Debounce"
  }

  gateway_layer.normalizer -> kalman: "Normalized float stream"
  kalman -> anomaly: "Filtered values"
  anomaly -> fusion: "Drift flags + clean values"
}

distribution_layer: Decoupled Fan-Out Architecture {
  style.fill: "#ffffff"
  style.stroke: "#cbd5e1"

  db_buffer: In-Memory Batch Buffer {
    shape: queue
    style.fill: "#fef9c3"
    style.stroke: "#ca8a04"
    desc: "Ring buffer flushed every 250-300ms or 50 records"
  }

  ws_manager: Real-Time Connection Manager {
    shape: step
    style.fill: "#dbeafe"
    style.stroke: "#2563eb"
    desc: "Thread-safe asyncio WebSocket broadcaster"
  }

  ai_engine: Offline AI Diagnostics {
    shape: step
    style.fill: "#ccfbf1"
    style.stroke: "#0d9488"
    desc: "Deterministic heuristics + Ollama local LLM"
  }

  analytics_layer.fusion -> db_buffer: "Enriched packet"
  analytics_layer.fusion -> ws_manager: "Broadcast payload"
  analytics_layer.fusion -> ai_engine: "Context snapshot"
}

persistence_layer: High-Throughput Storage {
  style.fill: "#f8fafc"
  style.stroke: "#94a3b8"

  postgres: PostgreSQL 14+ Time-Series DB {
    shape: cylinder
    style.fill: "#dcfce7"
    style.stroke: "#16a34a"
    desc: "Indexed tables: telemetry & alerts via asyncpg pool"
  }

  distribution_layer.db_buffer -> postgres: "Multi-row executemany transactions" {
    style.stroke: "#16a34a"
    style.stroke-width: 2
  }
}

client_layer: React 19 + Vite Dashboard (Air-Gapped) {
  style.fill: "#ffffff"
  style.stroke: "#3b82f6"
  style.stroke-width: 2

  sliding_buffer: Sliding Window State {
    shape: queue
    style.fill: "#f1f5f9"
    desc: "Max 50-100 data points per metric series"
  }

  raf_throttle: requestAnimationFrame Throttler {
    shape: step
    style.fill: "#eff6ff"
    desc: "Locks canvas/SVG redraws to 60 FPS"
  }

  ui_views: UI Views & Components {
    shape: rectangle
    style.fill: "#f8fafc"
    desc: "Live Telemetry, Spatial Map, Alerts, Reports, AI Drawer"
  }

  distribution_layer.ws_manager -> client_layer.sliding_buffer: "WebSocket /ws/telemetry" {
    style.stroke: "#2563eb"
    style.stroke-width: 2
  }
  sliding_buffer -> raf_throttle: "Raw packet queue"
  raf_throttle -> ui_views: "Synchronized state dispatch"
}
```

---

## 2. Core Architectural Design Principles

### 2.1 Strict Air-Gap Isolation
Municipal command centers and utility substations frequently operate in classified or severed network environments. The NIRIKSHA architecture prohibits any outbound network requests:
- **Zero CDN Dependencies**: No runtime links to `unpkg.com`, `cdnjs.cloudflare.com`, or Google Fonts.
- **Local Typography & Icons**: Typography is bundled at build time via `@fontsource/inter` and icons are statically compiled SVG components from `lucide-react`.
- **Local Procedural Audio**: Acoustic sirens and warning tones do not rely on remote MP3/WAV assets; they are synthesized procedurally in the browser via the Web Audio API (`AudioContext` oscillators).
- **Offline Machine Reasoning**: Sensor diagnosis and natural language auditing run entirely on-premises using local Ollama LLM instances or rule-based deterministic heuristic engines.

### 2.2 Dual Ingestion Concurrency
Telemetry ingestion must never halt when a physical cable is unplugged or when network routing flips. NIRIKSHA deploys two concurrent, independent ingestion protocols:
1. **PySerial Gateway**: Communicates over a physical USB/UART connection with the Pole 3 Root Hub. A dedicated background thread continuously reads lines, handles framing, and implements exponential backoff reconnection if the serial port disconnects.
2. **Industrial MQTT Broker**: An asynchronous `aiomqtt` client connects to a local or edge broker (e.g., Mosquitto on port 1883) and subscribes to `niriksha/poles/+/telemetry`. This enables distributed field gateways to publish over cellular or Ethernet backhauls directly into the backend.

### 2.3 Decoupled In-Memory Batch Buffering
In high-frequency IoT environments, executing a single SQL `INSERT` statement per arriving telemetry packet introduces severe transaction overhead, lock contention, and asyncio event-loop starvation.
- **Buffer Mechanism**: Incoming telemetry packets pass through analytics and enter an in-memory queue (`app/db/buffer.py`).
- **Flushing Heuristics**: The buffer automatically flushes to PostgreSQL when either:
  1. The buffer reaches `BATCH_BUFFER_MAX_SIZE` (default: 50 records), or
  2. The elapsed time exceeds `BATCH_FLUSH_INTERVAL_MS` (default: 300 ms).
- **Execution**: Flushes use `asyncpg.Connection.executemany` within a single short-lived transaction, achieving throughput exceeding 5,000 packets/second while keeping pool acquisition times under 2 milliseconds.

### 2.4 Browser Rendering Performance (Sliding Window & RAF)
Continuous, 24/7 telemetry monitoring dashboards often suffer from memory leaks and browser tab crashes caused by unbounded DOM node creation or excessive SVG redraws. NIRIKSHA solves this through two deterministic mechanisms:
1. **Sliding Window Buffer**: The frontend state retains a fixed sliding window of historical points (typically 50–100 samples per metric). As new packets arrive, older entries are sliced off, capping memory footprint at constant space $O(1)$.
2. **`requestAnimationFrame` Throttling**: When telemetry arrives at 20–50 Hz from multiple nodes, the frontend does not trigger React state updates for every single packet. Instead, packets are enqueued in a lightweight reference buffer, and a `requestAnimationFrame` loop flushes updates to state at the monitor's native refresh rate (60 Hz), eliminating frame drop and UI freeze.

---

## 3. Data Flow & Lifecycle Matrix

The table below traces a telemetry metric from physical transducer conversion to operator view:

| Stage | Subsystem | File Reference | Latency | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **1. Transduction** | Microcontroller Hardware | `firmware/pole1_sensor_node/` | < 1 ms | Analog sensor sampling (ADC 12-bit) and timer interrupts. |
| **2. Mesh Routing** | painlessMesh 2.4GHz RF | `firmware/pole1_sensor_node/` | 15–40 ms | ESP-NOW wireless mesh routing with staggered transmission. |
| **3. Hub Serializing**| ESP32 Gateway Node | `firmware/pole3_gateway_hub/` | 2 ms | Root sink JSON encapsulation and UART TX (`MESH_JSON:`). |
| **4. Host Ingestion** | PySerial / aiomqtt | `app/protocols/` | 1–5 ms | Non-blocking line reading, frame stripping, payload decoding. |
| **5. Normalization** | Schema Normalizer | `app/protocols/normalizer.py`| < 0.5 ms | Schema alignment, inactive sensor `NOT_CONNECTED` flagging. |
| **6. Signal Filtering**| 1D Kalman Filter | `app/analytics/kalman.py` | < 0.2 ms | Process noise rejection on analog ADC and ultrasonic depth. |
| **7. Anomaly & Fusion**| Anomaly Bank & Fusion | `app/analytics/fusion_engine.py`|< 0.5 ms | Z-score surge check, CUSUM drift, Electrocution Risk Index. |
| **8. Memory Buffer** | In-Memory Batch Queue | `app/db/buffer.py` | 0–300 ms | Temporal batching before multi-row database write. |
| **9. Persistence** | asyncpg Pool & PostgreSQL | `app/db/telemetry_repo.py` | 2–8 ms | Multi-row batch transaction commit with indexed columns. |
| **10. WebSocket Push**| Connection Manager | `app/connection_manager.py` | 1–3 ms | Async broadcasting to active browser clients. |
| **11. RAF Dispatch** | Client Sliding Window | `frontend/src/hooks/` | 16 ms | RAF synchronization, metric sliding window slice(-100). |
| **12. UI Render** | Recharts / SVG Schematic | `frontend/src/components/` | 16 ms | Canvas draw, acoustic hazard siren trigger, DOM update. |

---

## 4. Fault Domain Isolation & Graceful Degradation

The platform implements strict boundary isolation so that failures in one tier do not cascade:

```d2
direction: down

fault_tree: Failure Isolation Architecture {
  style.fill: "#ffffff"
  style.stroke: "#e2e8f0"

  serial_fail: Physical USB Cable Disconnected {
    shape: rectangle
    style.fill: "#fee2e2"
    style.stroke: "#ef4444"
  }

  serial_handler: PySerial Exponential Backoff Loop {
    shape: step
    style.fill: "#fef3c7"
    style.stroke: "#f59e0b"
    desc: "Retries COM port scan every 1-2s; backend does NOT crash"
  }

  mqtt_active: MQTT Broker Continues Ingestion {
    shape: rectangle
    style.fill: "#dcfce7"
    style.stroke: "#16a34a"
    desc: "Secondary telemetry path maintains full ingestion"
  }

  serial_fail -> serial_handler: "Triggers SerialException"
  serial_fail -> mqtt_active: "Zero impact on MQTT protocol"

  db_down: PostgreSQL Database Unreachable {
    shape: rectangle
    style.fill: "#fee2e2"
    style.stroke: "#ef4444"
  }

  db_handler: Buffer Ring Retention & WebSocket Passthrough {
    shape: step
    style.fill: "#fef3c7"
    style.stroke: "#f59e0b"
    desc: "Live WebSockets continue streaming; DB flushes retry on re-auth"
  }

  db_down -> db_handler: "Pool reconnects in background"

  ollama_offline: Ollama LLM Service Stopped {
    shape: rectangle
    style.fill: "#fee2e2"
    style.stroke: "#ef4444"
  }

  heuristic_fallback: Deterministic Rule Diagnostics {
    shape: step
    style.fill: "#dbeafe"
    style.stroke: "#2563eb"
    desc: "Heuristics evaluate immediately (0ms); operator receives rule report"
  }

  ollama_offline -> heuristic_fallback: "Circuit breaker routes to rule engine"
}
```

1. **Hardware Disconnection**: If the Root Gateway USB cable is detached, `serial_manager.py` catches `serial.SerialException`, logs the event, and enters an automatic retry loop. The FastAPI server and WebSocket broadcasts remain fully operational.
2. **Database Outage**: If PostgreSQL restarts or drops connections, the in-memory batch buffer retains the most recent records, while the `asyncpg` pool automatically attempts re-authentication. Real-time WebSocket broadcasting continues uninterrupted.
3. **AI Inference Timeout**: If the local Ollama LLM is busy or uninstalled, the AI assistant gracefully falls back to the deterministic diagnostic heuristic engine (`app/ai/diagnostics.py`), ensuring safety-critical rule evaluations never stall.
