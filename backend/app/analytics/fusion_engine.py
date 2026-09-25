import time
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("analytics.fusion")


class MultiSensorFusionEngine:
    """Fuses multi-modal telemetry streams to assess composite hazard indices."""

    def __init__(self):
        # Maps pole_id -> consecutive tilt readings counter
        self._tilt_counters: Dict[int, int] = {}
        self._last_alert_time: Dict[str, float] = {}

    def compute_electrocution_risk(self, voltage: Optional[float], water_depth: Optional[float]) -> float:
        """
        Calculates composite electrocution danger index (0.0 to 100.0).
        Fuses conductive water submersion with electrification potential.
        """
        if voltage is None or voltage <= 0:
            return 0.0

        # Base voltage severity: 0V -> 0, 5V -> 70, >7V -> 100
        v_score = min(100.0, (voltage / 5.0) * 70.0)

        # Submersion multiplier: higher water depth increases conductance surface area
        if water_depth is not None and water_depth > 0:
            depth_factor = min(1.5, 1.0 + (water_depth / 200.0))
            return min(100.0, round(v_score * depth_factor, 1))

        return round(v_score, 1)

    def compute_fire_combustion_index(
        self,
        temperature: Optional[float],
        mq7_co: Optional[float],
        mq2_combustible: Optional[float]
    ) -> float:
        """
        Calculates fire and blaze probability index (0.0 to 100.0).
        Fuses thermal gradient with carbon monoxide and flammable gas signatures.
        """
        score = 0.0
        # Thermal component: nominal < 40°C, extreme > 60°C
        if temperature is not None and temperature > 35.0:
            score += min(50.0, ((temperature - 35.0) / 25.0) * 50.0)

        # Carbon Monoxide component (MQ-7): nominal < 20 ppm, high > 50 ppm
        if mq7_co is not None and mq7_co > 20.0:
            score += min(35.0, ((mq7_co - 20.0) / 30.0) * 35.0)

        # Combustible gas (MQ-2): elevated flammable presence
        if mq2_combustible is not None and mq2_combustible > 30.0:
            score += min(25.0, ((mq2_combustible - 30.0) / 40.0) * 25.0)

        return min(100.0, round(score, 1))

    def evaluate_hazards(self, packet: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluates normalized telemetry against fused composite indices and critical hardware margins.
        Returns a list of alert definitions ready for persistence.
        """
        pole_id = int(packet.get("pole_id", 1))
        alerts_to_raise = []

        volt = packet.get("voltage")
        depth = packet.get("water_depth")
        temp = packet.get("temperature")
        mq7 = packet.get("mq7")
        mq2 = packet.get("mq2")
        mq135 = packet.get("mq135")
        mq136 = packet.get("mq136")
        is_upright = packet.get("is_upright")

        # 1. Electrocution Risk Index
        elec_risk = self.compute_electrocution_risk(volt, depth)
        packet["electrocution_risk_index"] = elec_risk
        if elec_risk >= 70.0 or (volt is not None and volt > 5.0):
            volt_str = f"{volt:.1f}V" if volt is not None else "Unknown V"
            alerts_to_raise.append({
                "pole_id": pole_id,
                "alert_type": "voltage_surge",
                "severity": "critical",
                "title": f"Lethal Electrocution Potential ({volt_str} | Risk: {elec_risk}%)",
                "description": "Electrification potential in street water exceeds safety threshold.",
                "trigger_value": float(volt) if volt is not None else 0.0,
                "unit": "V"
            })

        # 2. Fire & Thermal Combustion Index
        fire_index = self.compute_fire_combustion_index(temp, mq7, mq2)
        packet["fire_combustion_index"] = fire_index
        temp_str = f"{temp:.1f}°C" if temp is not None else "Unknown °C"
        if fire_index >= 75.0 or (temp is not None and temp >= 60.0):
            alerts_to_raise.append({
                "pole_id": pole_id,
                "alert_type": "fire_emergency",
                "severity": "critical",
                "title": f"Extreme Fire Outbreak ({temp_str} | Index: {fire_index}%)",
                "description": "Blaze signature confirmed via thermal and gas sensor fusion.",
                "trigger_value": float(temp) if temp is not None else 0.0,
                "unit": "°C"
            })
        elif temp is not None and temp > 45.0:
            alerts_to_raise.append({
                "pole_id": pole_id,
                "alert_type": "high_temperature",
                "severity": "warning",
                "title": f"Excessive Heat Hazard ({temp:.1f}°C)",
                "description": "Ambient temperature breached the 45.0°C thermal margin.",
                "trigger_value": float(temp),
                "unit": "°C"
            })

        # 3. Structural Tilt with Confirmation Filter (Reject transient vehicle vibration)
        if is_upright is False:
            self._tilt_counters[pole_id] = self._tilt_counters.get(pole_id, 0) + 1
            if self._tilt_counters[pole_id] >= 2:  # Sustained over >= 2 readings
                alerts_to_raise.append({
                    "pole_id": pole_id,
                    "alert_type": "tilt_collapse",
                    "severity": "critical",
                    "title": "Structural Tilt / Pole Collapse Detected",
                    "description": "Sustained horizontal tilt reported by SW-520D sensor.",
                    "trigger_value": 0.0,
                    "unit": ""
                })
        else:
            self._tilt_counters[pole_id] = 0

        # 4. Flood Submersion Hazard (> 100cm)
        if depth is not None and depth > 100.0:
            alerts_to_raise.append({
                "pole_id": pole_id,
                "alert_type": "flood_submersion",
                "severity": "warning",
                "title": f"Water Submersion Flood Level ({depth:.1f}cm)",
                "description": "Street water level surpassed the 100cm flood threshold.",
                "trigger_value": float(depth),
                "unit": "cm"
            })

        # 5. Toxic Gas Breaches
        if mq7 is not None and mq7 > 50.0:
            alerts_to_raise.append({
                "pole_id": pole_id,
                "alert_type": "gas_mq7",
                "severity": "critical",
                "title": f"Toxic CO Gas Leak ({mq7:.1f} ppm)",
                "description": "Carbon monoxide concentration exceeded 50 ppm safety ceiling.",
                "trigger_value": float(mq7),
                "unit": "ppm"
            })

        if mq135 is not None and mq135 > 150.0:
            alerts_to_raise.append({
                "pole_id": pole_id,
                "alert_type": "gas_mq135",
                "severity": "warning",
                "title": f"Air Quality Deterioration ({mq135:.1f} ppm)",
                "description": "Ammonia / chemical particulate contamination detected.",
                "trigger_value": float(mq135),
                "unit": "ppm"
            })

        if mq136 is not None and mq136 > 15.0:
            alerts_to_raise.append({
                "pole_id": pole_id,
                "alert_type": "gas_mq136",
                "severity": "warning",
                "title": f"H2S Sewer Gas Breach ({mq136:.1f} ppm)",
                "description": "Toxic hydrogen sulfide sewer gas threshold breached.",
                "trigger_value": float(mq136),
                "unit": "ppm"
            })

        return alerts_to_raise
