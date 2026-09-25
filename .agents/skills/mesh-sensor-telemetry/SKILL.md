---
name: mesh-sensor-telemetry
description: >-
  Hardware integration, painlessMesh communication protocols, Arduino C++ firmware architecture,
  sensor calibration (ZMPT101B, PZEM-004T, HC-SR04, MQ gas array), and gateway packet normalization.
---

# Microcontroller Mesh & Sensor Telemetry Skill

This skill documents the hardware sensor suite, painlessMesh RF topology, C++ microcontroller firmware conventions in `firmware/`, and the packet parsing rules for the NIRIKSHA IoT monitoring system.

---

## 📡 1. Mesh Topology & Physical Roles

```
[ Pole 1 Node (ESP32) ]              [ Pole 2 Node (ESP32) ]
- Submersion & Flood Sensing          - Electrical Grid Sensing
- ZMPT101B Voltage Leak Probe         - PZEM-004T Metering Module
- HC-SR04 Ultrasonic Sensor           - SW-520D Tilt Switch
- SW-520D Tilt Switch                 - MQ Series Gas Array
- MQ Series Gas Array                        |
          \                                  /
           \                                /
            v                              v
      [ Pole 3: Root Gateway Hub Node (ESP32) ]
      - painlessMesh Root Hub (mesh.setRoot(true))
      - Bridges 2.4GHz RF Mesh to USB Serial (UART)
      - Transmits formatted "MESH_JSON:{...}\n" to Host PC
```

### Critical Rule: Firmware Read-Only Guardrail
Microcontroller `.ino` sketches located inside [firmware/](file:///d:/proj/SIH/firmware/) represent verified physical hardware builds and **must never be modified** by automated agents unless explicitly requested by the user.

---

## ⏱️ 2. Staggered Mesh Transmit Cadence

To prevent radio frame collisions across concurrent ESP-NOW transmissions on the `NIRIKSHA_MESH` network:
- **Pole 1 Task Interval:** `2300ms`
- **Pole 2 Task Interval:** `2500ms`
- **Mesh Credentials:**
  ```cpp
  #define MESH_PREFIX   "NIRIKSHA_MESH"
  #define MESH_PASSWORD "nirikshaSecure2026"
  #define MESH_PORT     5555
  ```

---

## ⚡ 3. Sensor Suite & Calibration Principles

### 3.1 ZMPT101B AC Voltage Sensor (Pole 1)
- **Application:** Measures hazardous electrical leakage into flood water via submerged metallic probes.
- **Pin:** `GPIO 34` (Analog In)
- **Algorithm:** 40ms continuous peak-to-peak sampling window, 3-sample median filter to reject spikes, and tuned voltage scaling:
  ```cpp
  float VOLTAGE_FACTOR = 0.1394;
  const int NOISE_CUTOFF = 1100;
  ```

### 3.2 PZEM-004T V3.0 Power Monitor (Pole 2)
- **Application:** High-accuracy utility grid voltage, current, active power, energy accumulation, power factor, and frequency.
- **Protocol:** Modbus-RTU over Hardware UART.

### 3.3 HC-SR04 Ultrasonic Sensor (Pole 1)
- **Application:** Ground flood water accumulation monitoring.
- **Pins:** `TRIG_PIN = 18`, `ECHO_PIN = 19`
- **Formula:**
  ```cpp
  float distanceCm = (duration * 0.0343) / 2.0;
  float waterDepth = TOTAL_POLE_HEIGHT_CM - distanceCm;
  ```

### 3.4 SW-520D Tilt Switch (All Poles)
- **Application:** Detects pole toppling, storm tilt, or vehicular impact.
- **Pin:** `GPIO 27` (Internal Pullup)
- **Logic:** High when upright (`is_upright = true`), Low when displaced past 45° angle (`is_upright = false`).

### 3.5 MQ Gas Array (MQ-7, MQ-135, MQ-136, MQ-2)
- Measures CO, general air pollutants, sewer H₂S, and flammable hydrocarbon gas concentrations in parts-per-million (ppm).

---

## 🔄 4. Root Hub Packet Format & Parsing

Pole 3 serializes all mesh traffic and prefixes frames with `MESH_JSON:`:
```text
MESH_JSON:{"pole_id":1,"water_depth":25.3,"is_upright":true,"voltage":0.0,"mq7":14.2,"mq135":38.5,"mq136":8.1,"mq2":45.0}
```

### Python Ingestion Normalization:
```python
# Strip the MESH_JSON prefix before parsing
raw_str = line.replace("MESH_JSON:", "").strip()
payload = json.loads(raw_str)

# Map to unified schema
unified_packet = {
    "pole_id": payload.get("pole_id", 1),
    "timestamp": time.time(),
    "is_upright": payload.get("is_upright", True),
    "voltage": payload.get("voltage"),
    "water_depth": payload.get("water_depth"),
    "temperature": payload.get("temperature"),
    "humidity": payload.get("humidity"),
    "current_ma": payload.get("current_ma"),
    "power": payload.get("power"),
    "energy": payload.get("energy"),
    "frequency": payload.get("frequency"),
    "pf": payload.get("pf"),
    "mq7": payload.get("mq7"),
    "mq135": payload.get("mq135"),
    "mq136": payload.get("mq136"),
    "mq2": payload.get("mq2"),
    "status": "NORMAL"
}
```
If a metric is not emitted by a specific pole, the parser assigns `None` (`null` in JSON) so the UI displays `"Not Connected"`.
