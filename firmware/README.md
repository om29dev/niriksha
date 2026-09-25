# NIRIKSHA Microcontroller Firmware Suite

This directory contains the embedded C++ sketches flashed to the Espressif ESP32-WROOM-32 microcontrollers deployed across the NIRIKSHA environmental intelligence mesh.

---

## 📂 Firmware Layout & Node Responsibilities

```
firmware/
├── pole1_sensor_node/
│   └── pole1_sensor_node.ino       # Pole 1: Submersion & Flood Monitoring Node
├── pole2_sensor_node/
│   └── pole2_sensor_node.ino       # Pole 2: Electrical Grid & Energy Metering Node
├── pole3_gateway_hub/
│   └── pole3_gateway_hub.ino       # Pole 3: painlessMesh Root Gateway & UART Bridge
└── README.md                       # This documentation guide
```

---

## 📡 1. Wireless Mesh Protocol (`painlessMesh`)

All nodes communicate over an ad-hoc, self-healing 2.4 GHz radio mesh built upon ESP-NOW Wi-Fi broadcast frames. No central Wi-Fi router or internet connectivity is required.

- **Mesh SSID:** `NIRIKSHA_MESH`
- **Mesh Password:** `nirikshaSecure2026`
- **Mesh Port:** `5555`
- **Radio Frequency:** `2.4 GHz` (Channel auto-sync via mesh beaconing)

### Collision Prevention: Staggered Transmit Cadence
To eliminate radio frame collisions across concurrent transmissions, field nodes transmit on staggered intervals managed by `TaskScheduler`:
- **Pole 1:** Transmits sensor telemetry every **2300 ms**
- **Pole 2:** Transmits sensor telemetry every **2500 ms**
- **Pole 3:** Designated as the Root Gateway Sink (`mesh.setRoot(true)`), listening continuously.

---

## 🔌 2. Hardware Pinout & Wiring Specifications

### Pole 1: Submersion & Water Depth Node (`pole1_sensor_node`)
Designed for flood monitoring, water depth calculation, and submerged electrical leakage detection.

| Sensor / Module | Hardware Interface | ESP32 GPIO Pin | Description / Purpose |
| :--- | :--- | :--- | :--- |
| **HC-SR04** | Digital Output (Trig) | `GPIO 18` | 10 µs ultrasonic trigger pulse |
| **HC-SR04** | Digital Input (Echo) | `GPIO 19` | Echo return pulse width measurement |
| **ZMPT101B** | Analog In (ADC1) | `GPIO 34` | Peak-to-peak AC voltage leakage sampling |
| **SW-520D** | Digital In (Internal Pullup) | `GPIO 27` | Structural tilt detection (0 = Upright, 1 = Tilted) |
| **MQ-7** | Analog In (ADC1) | `GPIO 35` | Carbon monoxide (CO) analog voltage |
| **MQ-135** | Analog In (ADC1) | `GPIO 32` | Air quality / hazardous gas detection |
| **MQ-136** | Analog In (ADC1) | `GPIO 33` | Hydrogen Sulfide ($H_2S$) analog voltage |
| **MQ-2** | Analog In (ADC2) | `GPIO 25` | Combustible gas / LPG / smoke detection |

### Pole 2: Power Grid & Metering Node (`pole2_sensor_node`)
Designed for grid power quality monitoring, current leakage detection, and energy measurement.

| Sensor / Module | Hardware Interface | ESP32 GPIO Pin | Description / Purpose |
| :--- | :--- | :--- | :--- |
| **PZEM-004T v3.0** | Hardware UART RX2 | `GPIO 16` | Connects to PZEM TX (Modbus RTU over TTL) |
| **PZEM-004T v3.0** | Hardware UART TX2 | `GPIO 17` | Connects to PZEM RX (Modbus RTU over TTL) |
| **SW-520D** | Digital In (Internal Pullup) | `GPIO 27` | Structural tilt detection (0 = Upright, 1 = Tilted) |
| **MQ-7** | Analog In (ADC1) | `GPIO 35` | Carbon monoxide (CO) analog voltage |
| **MQ-135** | Analog In (ADC1) | `GPIO 32` | Air quality / hazardous gas detection |
| **MQ-136** | Analog In (ADC1) | `GPIO 33` | Hydrogen Sulfide ($H_2S$) analog voltage |
| **MQ-2** | Analog In (ADC2) | `GPIO 25` | Combustible gas / LPG / smoke detection |

### Pole 3: Root Gateway Hub Node (`pole3_gateway_hub`)
Acts as the central mesh sink and hardware bridge between the 2.4 GHz RF mesh and the host PC.

- **Mesh Configuration:** Configured as `mesh.setRoot(true)` and `mesh.setContainsRoot(true)`.
- **UART Transmit:** Listens for mesh packets from Pole 1 and Pole 2, encapsulates them with the sink prefix, and outputs them over USB UART Serial at **115200 baud**:
  ```
  MESH_JSON:{"pole_id":1,"water_depth":24.5,"voltage":1.2,"is_upright":true,...}\n
  ```

---

## 🛠️ 3. Compilation & Flashing Instructions

### Required Libraries (Install via Arduino Library Manager)
1. **`painlessMesh`** (v1.5.0+) by painlessMesh development team
2. **`ArduinoJson`** (v6.21.0+) by Benoit Blanchon
3. **`PZEM004Tv30`** (v1.1.2+) by Mandar (for Pole 2)
4. **`TaskScheduler`** (included as dependency of painlessMesh)

### Arduino IDE Settings
- **Board:** `ESP32 Dev Module`
- **CPU Frequency:** `240MHz (WiFi/BT)`
- **Flash Frequency:** `80MHz`
- **Flash Mode:** `QIO`
- **Partition Scheme:** `Default 4MB with spiffs (1.2MB APP / 1.5MB SPIFFS)`
- **Upload Speed:** `921600`
- **Port:** Select corresponding USB-to-UART Silicon Labs CP210x or CH340 COM port

---

## 🔒 4. Operational Guardrails

> [!IMPORTANT]
> The `.ino` sketches in this directory represent verified, hardware-tested embedded images running in production. They must remain stable and read-only. Any modification to timing tasks, pin allocations, or JSON structures must be coordinated with the backend `protocols/normalizer.py` unified schema parser.
