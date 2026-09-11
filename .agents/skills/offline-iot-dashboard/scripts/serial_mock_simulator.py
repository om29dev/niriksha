"""
Serial Mock Telemetry Simulator
Generates high-frequency sensor readings (Temperature, Pressure, Humidity, Voltage, Current, Vibration)
matching physical IoT board serial outputs in newline-delimited JSON format.
"""

import json
import math
import random
import time
from typing import Dict, Any


def generate_packet(sequence_id: int) -> Dict[str, Any]:
    t = time.time()
    # Synthetic physical fluctuations
    temp = round(23.5 + 2.5 * math.sin(t * 0.1) + random.uniform(-0.2, 0.2), 2)
    pressure = round(1013.25 + 5.0 * math.cos(t * 0.05) + random.uniform(-0.5, 0.5), 2)
    humidity = round(45.0 + 3.0 * math.sin(t * 0.08) + random.uniform(-0.3, 0.3), 1)
    voltage = round(3.3 + 0.05 * math.sin(t * 0.2) + random.uniform(-0.02, 0.02), 3)
    current = round(145.0 + 20.0 * math.sin(t * 0.15) + random.uniform(-5.0, 5.0), 1)
    vibration = round(abs(random.gauss(0.12, 0.04)), 3)

    return {
        "seq": sequence_id,
        "timestamp": round(t, 3),
        "temperature": temp,
        "pressure": pressure,
        "humidity": humidity,
        "voltage": voltage,
        "current_ma": current,
        "vibration_g": vibration,
        "status": "NORMAL" if temp < 26.5 and vibration < 0.25 else "WARNING"
    }


def stream_mock_data(hz: float = 5.0):
    seq = 1
    interval = 1.0 / hz
    print(f"[*] Starting offline IoT telemetry mock stream at {hz} Hz (Ctrl+C to stop)...")
    try:
        while True:
            pkt = generate_packet(seq)
            line = json.dumps(pkt)
            print(line, flush=True)
            seq += 1
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[*] Mock stream stopped.")


if __name__ == "__main__":
    stream_mock_data(hz=4.0)
