---
name: pyserial-iot-telemetry
description: >-
  Robust serial (COM port) communication, PySerial fault tolerance, auto-reconnection,
  packet parsing, baud rate handling, and synthetic mock simulation for hardware telemetry.
---

# PySerial Hardware Ingestion & Fault Tolerance Skill

This skill documents patterns for integrating microcontroller serial hardware (USB COM ports) into real-time web applications with 100% fault tolerance.

---

## 🔌 Core Operational Principles

### 1. Zero-Crash Fault Tolerance
- A physical USB cable disconnect, hardware reboot, or bad COM port selection **must never crash the backend**.
- Always wrap port access in defensive `try/except (serial.SerialException, OSError, UnicodeDecodeError)` blocks.
- On disconnect:
  - Close any dangling port handles.
  - Switch internal status to `DISCONNECTED` or `RECONNECTING`.
  - Pause for a fixed or exponential backoff period (1-2 seconds).
  - Rescan available COM ports using `serial.tools.list_ports.comports()`.
  - Attempt auto-reconnection continuously in the background.

### 2. Buffer Purging on Reconnection
- Partial or corrupted byte sequences frequently linger on serial lines after resets.
- Always call `ser.reset_input_buffer()` (or `ser.flushInput()`) immediately upon opening the port before reading frames.

### 3. Non-Blocking I/O in Asyncio
- PySerial is blocking by nature.
- Execute the serial read loop either:
  - Using an explicit async worker task with short `timeout` (e.g. `timeout=0.1` or `timeout=0.5`).
  - Or offloaded into a thread via `asyncio.to_thread(self._read_worker)`.

### 4. Packet Parsing & Validation
- Standard serial protocol conventions (e.g. newline-delimited JSON or comma-separated values):
  ```python
  line = ser.readline().decode("utf-8", errors="ignore").strip()
  if not line:
      continue
  try:
      data = json.loads(line)
      # Process verified telemetry packet
  except json.JSONDecodeError:
      # Discard corrupted frames gracefully
      continue
  ```

### 5. Synthetic / Mock Telemetry Generator
- Hardware might not always be plugged into developer workstations or CI environments.
- Provide a mock generator that mimics realistic telemetry waveforms (sine waves, jitter, ambient temperature drift, alerts).
- Allow automatic fallback or API switch between mock mode and physical COM port reading.

---

## 🛠️ Verification & Diagnostics

- **List active COM ports on Windows:**
  ```powershell
  python -c "import serial.tools.list_ports; [print(f'{p.device}: {p.description}') for p in serial.tools.list_ports.comports()]"
  ```
- **Inspect Serial Manager module:**
  [serial_manager.py](file:///d:/proj/SIH/backend/serial_manager.py)
