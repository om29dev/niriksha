# Architecture & Engineering Guide: NIRIKSHA IoT Platform

This technical architecture reference documents the end-to-end data pipeline, hardware integration, asynchronous buffering, and frontend rendering pipeline for the NIRIKSHA Smart IoT Mesh & Hazard Monitoring System.

---

## 1. System Topology & Data Flow

```
                      +-----------------------------+
                      |   Pole 1: Environmental &   |
                      |   Flood Node (ESP32)        |
                      | - HC-SR04 Ultrasonic (Depth)|
                      | - ZMPT101B (Water Voltage)  |
                      | - SW-520D (Tilt Switch)     |
                      | - MQ Gas Array              |
                      +--------------+--------------+
                                     |
                                     | 2.4 GHz RF (painlessMesh)
                                     | JSON Telemetry (Staggered 2300ms)
                                     v
+-----------------------------+      |
|   Pole 2: Power Grid Node   |      |
|   (ESP32)                   |      |
| - PZEM-004T (V, I, W, kWh)  |------+
| - SW-520D (Tilt Switch)     |
| - MQ Gas Array              |
+-----------------------------+
               |
               | 2.4 GHz RF (painlessMesh)
               | JSON Telemetry (Staggered 2500ms)
               v
+-----------------------------------------------------------+
|   Pole 3: Root Gateway Hub Node (ESP32)                   |
| - painlessMesh Root Node (mesh.setRoot(true))             |
| - Serial UART Broadcast: "MESH_JSON:<json_payload>\n"     |
+-----------------------------+-----------------------------+
                              |
                              | USB Serial (115200 Baud)
                              v
+-----------------------------------------------------------+
|   FastAPI Ingestion Layer (Python 3.10+)                  |
| - PySerial Worker Task / Mock Simulator Fallback          |
| - Normalization Pipeline (Multi-Pole Unified Schema)      |
+--------------+-----------------------------+--------------+
               |                             |
               | In-Memory Buffer            | Push Broadcast
               | (Multi-Row Batch Insert)    | (JSON frames)
               v                             v
+-----------------------------+   +-------------------------+
|   PostgreSQL Database       |   |   WebSocket Manager     |
| - asyncpg Connection Pool   |   |   /ws Endpoint          |
| - 250-300ms Batch Flushes   |   +------------+------------+
| - Time-series Indexes       |                |
+-----------------------------+                | 60fps RequestAnimationFrame
                                               v
                                  +-------------------------+
                                  |   React 19 Dashboard    |
                                  | - Sliding Window Buffer |
                                  | - Real-time Recharts    |
                                  | - Hazard Rule Engine    |
                                  | - Web Audio Sirens      |
                                  +-------------------------+
```

---

## 2. Microcontroller Mesh Protocols (`lastlocal/`)

### 2.1 Staggered Broadcast Cadence
To eliminate 2.4 GHz RF packet collision over the ESP-NOW mesh layer:
- **Pole 1:** Transmits every `2300ms`
- **Pole 2:** Transmits every `2500ms`
- **Pole 3 (Root Hub):** Operates as the mesh sink, capturing frames and emitting newline-delimited strings to USB Serial:
  ```
  MESH_JSON:{"pole_id":1,"water_depth":24.5,"is_upright":true,"voltage":0.0,"mq7":12.4,...}
  ```

### 2.2 ZMPT101B Water Electrification Sensing
Pole 1 measures leakage current in flooded streets using an analog peak-to-peak sampling window over 40ms:
```cpp
while ((millis() - startTime) < 40) {
  int readVal = analogRead(ZMPT_PIN);
  if (readVal > maxVal) maxVal = readVal;
  if (readVal < minVal) minVal = readVal;
}
int peakToPeak = maxVal - minVal;
if (peakToPeak < NOISE_CUTOFF) {
  readings[i] = 0.0;
} else {
  readings[i] = peakToPeak * VOLTAGE_FACTOR;
}
```

---

## 3. Asynchronous Decoupled Ingestion Pipeline

### 3.1 The C10K Telemetry Problem
Synchronously executing `INSERT INTO telemetry ...` per incoming serial frame creates database lock contention and starves the asyncio event loop. 

### 3.2 In-Memory Batch Buffer Pattern
- Incoming packets from `SerialManager` or `MockSimulator` pass into `buffer_insert_telemetry(packet)`.
- Packets append to an internal array `_batch_buffer` under an `asyncio.Lock()`.
- A background worker `batch_flush_worker()` wakes every `300ms` (or when `len(_batch_buffer) >= 50`):
  ```python
  async with _batch_lock:
      records_to_insert = list(_batch_buffer)
      _batch_buffer.clear()
  
  if records_to_insert:
      async with pool.acquire() as conn:
          async with conn.transaction():
              await conn.executemany(INSERT_QUERY, records_to_insert)
  ```

### 3.3 Connection Pool Management
Managed through a single `asyncpg.Pool` initialized during FastAPI's lifespan startup:
- `min_size = 2`
- `max_size = 10`
- `command_timeout = 60`

---

## 4. PySerial Fault Tolerance & Auto-Reconnection

### 4.1 Zero-Crash Resilience
Physical COM ports can be abruptly unplugged, reset, or assigned new identifiers.
1. The read loop wraps all I/O in defensive exceptions:
   ```python
   except (serial.SerialException, OSError, UnicodeDecodeError) as e:
       self.is_connected = False
       logger.warning(f"Serial port connection error: {e}. Retrying in 2.0s...")
       await asyncio.sleep(2.0)
   ```
2. When the port is reopened, `reset_input_buffer()` purges corrupted fragments.
3. If no physical hardware is found, the system smoothly falls back to `MockSimulator`.

---

## 5. Frontend Real-Time Architecture

### 5.1 Memory Protection via Sliding Window
Unbounded array growth in continuous 24/7 uptime causes memory leaks and DOM lag.
- Chart series are capped at 50 to 100 entries:
  ```typescript
  setHistory((prev) => {
    const updated = [...prev, newPoint];
    return updated.length > 100 ? updated.slice(updated.length - 100) : updated;
  });
  ```

### 5.2 Decoupled WebSocket Hook
- Socket messages are collected in a mutable `useRef`.
- State updates are debounced/throttled via `requestAnimationFrame` to ensure 60fps rendering smoothness regardless of incoming packet frequencies.

### 5.3 Unified Sensor Display Rule
Inactive or unequipped sensors on a node have `status === "NOT_CONNECTED"` and `val === null`. The frontend renders a discrete `"Not Connected"` badge rather than misleading `0` values.
