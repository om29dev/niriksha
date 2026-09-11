import math
import random
import time
from typing import Dict, Any, Optional


class MockSimulator:
    """
    Dedicated generator for realistic multi-pole mesh telemetry.
    Matches hardware payload schema (no 'status' field sent in JSON).
    Simulates:
    - Pole Down: Pole tilt (is_upright: false).
    - Offline: Occasional radio packet dropouts (simulated node stops transmitting).
    """

    def __init__(self):
        self.seq = 1
        # Track simulated tilt events (Pole Down): {pole_id: tilt_end_timestamp}
        self.tilt_events: Dict[int, float] = {}
        # Track simulated offline/transmission dropouts: {pole_id: offline_end_timestamp}
        self.offline_nodes: Dict[int, float] = {}
        # Track simulated water electrification (leakage voltage): {pole_id: leak_end_timestamp}
        self.voltage_leak_events: Dict[int, float] = {}
        # Track simulated high water flood events: {pole_id: flood_end_timestamp}
        self.flood_events: Dict[int, float] = {}
        # Track simulated high temperature events: {pole_id: temp_end_timestamp}
        self.high_temp_events: Dict[int, float] = {}
        # Track simulated high humidity events: {pole_id: humidity_end_timestamp}
        self.high_humidity_events: Dict[int, float] = {}
        # Track simulated gas alert events on Pole 3: {sensor_name: end_timestamp}
        self.gas_alert_events: Dict[str, float] = {}

    def _check_voltage_leak(self, pole_id: int, current_time: float) -> float:
        """
        Simulates water probe voltage sensor:
        - Normally safe: 0.0V (or slight millivolt sensor noise ~0.0 to 0.4V).
        - Occasionally electricity leaks into water (~4% chance): spikes to dangerous 180V - 240V AC for 10-16s.
        """
        if pole_id in self.voltage_leak_events:
            if current_time < self.voltage_leak_events[pole_id]:
                # Active high voltage leak detected in water!
                return round(220.0 + random.uniform(-15.0, 15.0), 1)
            else:
                del self.voltage_leak_events[pole_id]

        # Trigger occasional water electrification hazard (~3% chance), lasts 12-16s
        if random.random() < 0.03 and not self.voltage_leak_events:
            self.voltage_leak_events[pole_id] = current_time + random.uniform(12.0, 16.0)
            return round(220.0 + random.uniform(-15.0, 15.0), 1)

        # Baseline safe condition: 0.0V (or slight harmless residual reading < 0.5V)
        return round(max(0.0, random.uniform(0.0, 0.3)), 1)

    def _check_tilt(self, pole_id: int, current_time: float) -> bool:
        """Returns True if pole is currently upright, False if tilted (Pole Down)."""
        if pole_id in self.tilt_events:
            if current_time < self.tilt_events[pole_id]:
                return False  # Pole is down / tilted
            else:
                del self.tilt_events[pole_id]

        # Trigger occasional tilt / pole down event (~3% chance), lasts 12-20s
        if random.random() < 0.03 and not self.tilt_events:
            self.tilt_events[pole_id] = current_time + random.uniform(12.0, 20.0)
            return False

        return True

    def _check_flood(self, pole_id: int, current_time: float) -> float:
        """Normally normal depth (10-25cm), occasionally floods (>100cm)."""
        if pole_id in self.flood_events:
            if current_time < self.flood_events[pole_id]:
                return round(115.0 + random.uniform(-5.0, 15.0), 1)
            else:
                del self.flood_events[pole_id]

        if random.random() < 0.025 and not self.flood_events:
            self.flood_events[pole_id] = current_time + random.uniform(12.0, 18.0)
            return round(115.0 + random.uniform(-5.0, 15.0), 1)

        return round(15.0 + 5.0 * math.sin(current_time * 0.1) + random.uniform(-0.5, 0.5), 1)

    def _check_temperature(self, current_time: float) -> float:
        """
        Normally 26-30°C.
        Simulates two hazard levels:
        - Thermal warning: 46-52°C
        - Extreme Fire/Blaze Emergency: spikes to 85°C - 165°C for 14-20s, simulating active fire outbreak.
        """
        if 3 in self.high_temp_events:
            if current_time < self.high_temp_events[3]:
                # Active fire or severe overheating event
                return round(110.0 + random.uniform(-15.0, 35.0), 1)
            else:
                del self.high_temp_events[3]

        # Trigger occasional extreme fire / high temperature hazard (~3.5% chance), lasts 14-20s
        if random.random() < 0.035 and not self.high_temp_events:
            self.high_temp_events[3] = current_time + random.uniform(14.0, 20.0)
            return round(110.0 + random.uniform(-15.0, 35.0), 1)

        return round(28.0 + 2.5 * math.sin(current_time * 0.05) + random.uniform(-0.3, 0.3), 1)

    def _check_humidity(self, current_time: float) -> float:
        """Normally 55-65%, occasionally high humidity (>85%)."""
        if 3 in self.high_humidity_events:
            if current_time < self.high_humidity_events[3]:
                return round(91.0 + random.uniform(-2.0, 5.0), 1)
            else:
                del self.high_humidity_events[3]

        if random.random() < 0.025 and not self.high_humidity_events:
            self.high_humidity_events[3] = current_time + random.uniform(12.0, 18.0)
            return round(91.0 + random.uniform(-2.0, 5.0), 1)

        return round(60.0 + 4.0 * math.cos(current_time * 0.04) + random.uniform(-0.5, 0.5), 1)

    def _check_gas_sensors(self, current_time: float) -> Dict[str, float]:
        """
        Simulates gas sensors connected to Pole 3:
        - MQ-7 (Carbon Monoxide): Normal baseline ~12-25 ppm. Threshold > 50 ppm.
        - MQ-135 (Air Quality / NH3 / Smoke): Normal baseline ~40-80 ppm. Threshold > 150 ppm.
        - MQ-136 (Hydrogen Sulfide H2S): Normal baseline ~2-6 ppm. Threshold > 15 ppm.
        Occasionally triggers simulated toxic gas spike (~2.5% chance) lasting 12-16s.
        """
        # MQ-7 CO
        if "mq7" in self.gas_alert_events:
            if current_time < self.gas_alert_events["mq7"]:
                mq7 = round(65.0 + random.uniform(-5.0, 15.0), 1)
            else:
                del self.gas_alert_events["mq7"]
                mq7 = round(18.0 + random.uniform(-2.0, 3.0), 1)
        elif random.random() < 0.02 and not self.gas_alert_events:
            self.gas_alert_events["mq7"] = current_time + random.uniform(12.0, 16.0)
            mq7 = round(65.0 + random.uniform(-5.0, 15.0), 1)
        else:
            mq7 = round(18.0 + random.uniform(-2.0, 3.0), 1)

        # MQ-135 Air Quality
        if "mq135" in self.gas_alert_events:
            if current_time < self.gas_alert_events["mq135"]:
                mq135 = round(185.0 + random.uniform(-10.0, 25.0), 1)
            else:
                del self.gas_alert_events["mq135"]
                mq135 = round(55.0 + random.uniform(-5.0, 5.0), 1)
        elif random.random() < 0.02 and not self.gas_alert_events:
            self.gas_alert_events["mq135"] = current_time + random.uniform(12.0, 16.0)
            mq135 = round(185.0 + random.uniform(-10.0, 25.0), 1)
        else:
            mq135 = round(55.0 + random.uniform(-5.0, 5.0), 1)

        # Sewage Gas (MQ-136)
        if "mq136" in self.gas_alert_events:
            if current_time < self.gas_alert_events["mq136"]:
                mq136 = round(22.0 + random.uniform(-2.0, 8.0), 1)
            else:
                del self.gas_alert_events["mq136"]
                mq136 = round(4.0 + random.uniform(-0.5, 0.8), 1)
        elif random.random() < 0.02 and not self.gas_alert_events:
            self.gas_alert_events["mq136"] = current_time + random.uniform(12.0, 16.0)
            mq136 = round(22.0 + random.uniform(-2.0, 8.0), 1)
        else:
            mq136 = round(4.0 + random.uniform(-0.5, 0.8), 1)

        return {"mq7": mq7, "mq135": mq135, "mq136": mq136}

    def _is_offline(self, pole_id: int, current_time: float) -> bool:
        """Returns True if node packet is dropped (offline). Keep offline periods short (8s) and rare so poles remain active most of the time."""
        if pole_id in self.offline_nodes:
            if current_time < self.offline_nodes[pole_id]:
                return True
            else:
                del self.offline_nodes[pole_id]

        # Trigger occasional offline period (~1.5% chance), lasts 8-10s
        if random.random() < 0.015 and not self.offline_nodes:
            self.offline_nodes[pole_id] = current_time + random.uniform(8.0, 10.0)
            return True

        return False

    def generate_packet(self) -> Optional[Dict[str, Any]]:
        """
        Generates sensor telemetry matching the .ino JSON format.
        Voltage represents two probes in water: normally 0.0V, spikes when electricity detected.
        """
        t = time.time()
        # Rotate mock generation across the 3 poles: 1, 2, 3
        pole_rotation = (self.seq % 3) + 1

        # If this pole is currently offline, skip sending a packet (simulates transmission loss)
        if self._is_offline(pole_rotation, t):
            self.seq += 1
            return None

        is_upright = self._check_tilt(pole_rotation, t)
        v_reading = self._check_voltage_leak(pole_rotation, t)

        if pole_rotation == 1:
            # Pole 1: Ultrasonic water depth (cm), ZMPT AC water voltage probe (V), Tilt
            depth_reading = self._check_flood(1, t)
            raw = {
                "seq": self.seq,
                "timestamp": round(t, 3),
                "pole_id": 1,
                "mesh_node_id": 1,
                "water_depth": depth_reading,
                "is_upright": is_upright,
                "voltage": v_reading,
                "current": None,
                "frequency": 50.0 if v_reading > 10.0 else 0.0,
                "pf": 1.0 if v_reading > 10.0 else 0.0,
                "mq7": None,
                "mq135": None,
                "mq136": None,
                "source": "SIMULATION"
            }
        elif pole_rotation == 2:
            # Pole 2: Water voltage probe (V), Ultrasonic water depth (cm), Tilt. Current is Not Connected.
            depth_reading = self._check_flood(2, t)
            raw = {
                "seq": self.seq,
                "timestamp": round(t, 3),
                "pole_id": 2,
                "mesh_node_id": 2,
                "water_depth": depth_reading,
                "is_upright": is_upright,
                "voltage": v_reading,
                "current": None,
                "power": round(v_reading * 1.2, 1) if v_reading > 10.0 else 0.0,
                "energy": round(14.82 + (t % 1000) * 0.001, 3),
                "frequency": 50.0 if v_reading > 10.0 else 0.0,
                "pf": 0.96 if v_reading > 10.0 else 0.0,
                "mq7": None,
                "mq135": None,
                "mq136": None,
                "source": "SIMULATION"
            }
        else:
            # Pole 3: Root Hub Gateway with DHT11 (Temperature & Humidity) + MQ Gas Sensors (MQ-7, MQ-135, MQ-136)
            gases = self._check_gas_sensors(t)
            raw = {
                "seq": self.seq,
                "timestamp": round(t, 3),
                "pole_id": 3,
                "mesh_node_id": 3,
                "temperature": self._check_temperature(t),
                "humidity": self._check_humidity(t),
                "mq7": gases["mq7"],
                "mq135": gases["mq135"],
                "mq136": gases["mq136"],
                "source": "SIMULATION"
            }

        self.seq += 1
        return raw

    def reset(self):
        """Resets the packet sequence counter and cleared events."""
        self.seq = 1
        self.tilt_events.clear()
        self.offline_nodes.clear()
        self.voltage_leak_events.clear()
        self.flood_events.clear()
        self.high_temp_events.clear()
        self.high_humidity_events.clear()
        self.gas_alert_events.clear()
