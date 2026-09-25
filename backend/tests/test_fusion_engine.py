import pytest
from app.analytics.fusion_engine import MultiSensorFusionEngine


class TestMultiSensorFusionEngine:
    def test_electrocution_risk_edge_cases(self):
        fusion = MultiSensorFusionEngine()

        # Edge Case 1: voltage=None
        assert fusion.compute_electrocution_risk(voltage=None, water_depth=150.0) == 0.0

        # Edge Case 2: voltage <= 0
        assert fusion.compute_electrocution_risk(voltage=0.0, water_depth=50.0) == 0.0
        assert fusion.compute_electrocution_risk(voltage=-1.5, water_depth=50.0) == 0.0

        # Standard dry conditions (water_depth=None or 0)
        risk_dry = fusion.compute_electrocution_risk(voltage=3.0, water_depth=None)
        assert risk_dry == 42.0

        # Submersion multiplier increases danger
        risk_submerged = fusion.compute_electrocution_risk(voltage=3.0, water_depth=100.0)
        assert risk_submerged > risk_dry
        assert risk_submerged == 63.0  # 42.0 * 1.5

        # Upper ceiling clamped at 100.0
        assert fusion.compute_electrocution_risk(voltage=12.0, water_depth=200.0) == 100.0

    def test_fire_combustion_index_edge_cases(self):
        fusion = MultiSensorFusionEngine()

        # All sensors None
        assert fusion.compute_fire_combustion_index(None, None, None) == 0.0

        # Nominal safe conditions
        assert fusion.compute_fire_combustion_index(temperature=28.0, mq7_co=10.0, mq2_combustible=15.0) == 0.0

        # Thermal breach above 35°C
        temp_only = fusion.compute_fire_combustion_index(temperature=50.0, mq7_co=None, mq2_combustible=None)
        assert 0.0 < temp_only <= 50.0

        # Blaze signature: high thermal + high CO + flammable gas
        blaze_score = fusion.compute_fire_combustion_index(
            temperature=60.0,
            mq7_co=55.0,
            mq2_combustible=60.0
        )
        assert blaze_score >= 75.0

    def test_tilt_debounce_filter_edge_cases(self):
        """
        Tests debounce filter for transient vibration vs sustained structural collapse.
        - is_upright=False x 1: NO alert (vibration rejection)
        - is_upright=False x 2: ALERT raised (sustained collapse)
        - is_upright=True: resets counter
        """
        fusion = MultiSensorFusionEngine()
        pole_id = 1

        # Reading 1: Transient tilt (e.g., passing heavy truck vibration)
        packet_tilt_1 = {
            "pole_id": pole_id,
            "voltage": 2.5,
            "water_depth": 10.0,
            "is_upright": False
        }
        alerts_1 = fusion.evaluate_hazards(packet_tilt_1)
        # Assert NO tilt alert on single reading
        tilt_alerts_1 = [a for a in alerts_1 if a["alert_type"] == "tilt_collapse"]
        assert len(tilt_alerts_1) == 0, "Transient tilt on reading 1 must be debounced"

        # Reading 2: Sustained tilt confirms pole collapse
        packet_tilt_2 = {
            "pole_id": pole_id,
            "voltage": 2.5,
            "water_depth": 10.0,
            "is_upright": False
        }
        alerts_2 = fusion.evaluate_hazards(packet_tilt_2)
        tilt_alerts_2 = [a for a in alerts_2 if a["alert_type"] == "tilt_collapse"]
        assert len(tilt_alerts_2) == 1, "Sustained tilt on reading 2 must raise tilt_collapse alert"
        assert tilt_alerts_2[0]["severity"] == "critical"

        # Reading 3: Recovery back to upright
        packet_upright = {
            "pole_id": pole_id,
            "voltage": 2.5,
            "water_depth": 10.0,
            "is_upright": True
        }
        alerts_3 = fusion.evaluate_hazards(packet_upright)
        assert len([a for a in alerts_3 if a["alert_type"] == "tilt_collapse"]) == 0

        # Reading 4: Next single tilt does NOT immediately alert
        alerts_4 = fusion.evaluate_hazards(packet_tilt_1)
        assert len([a for a in alerts_4 if a["alert_type"] == "tilt_collapse"]) == 0

    def test_multi_pole_tilt_counter_isolation(self):
        """Pole 1 and Pole 2 must track tilt counters independently."""
        fusion = MultiSensorFusionEngine()

        # Pole 1 tilts once
        fusion.evaluate_hazards({"pole_id": 1, "is_upright": False})
        # Pole 2 tilts once
        alerts_p2 = fusion.evaluate_hazards({"pole_id": 2, "is_upright": False})
        assert not any(a["alert_type"] == "tilt_collapse" for a in alerts_p2)

        # Pole 1 tilts second time -> Pole 1 alerts
        alerts_p1 = fusion.evaluate_hazards({"pole_id": 1, "is_upright": False})
        assert any(a["alert_type"] == "tilt_collapse" for a in alerts_p1)

    def test_voltage_none_packet_evaluation(self):
        """Packet with voltage=None must execute cleanly without raising exceptions."""
        fusion = MultiSensorFusionEngine()
        packet = {
            "pole_id": 3,
            "voltage": None,
            "water_depth": 25.0,
            "temperature": 27.5,
            "is_upright": True
        }
        alerts = fusion.evaluate_hazards(packet)
        assert packet["electrocution_risk_index"] == 0.0
        assert not any(a["alert_type"] == "voltage_surge" for a in alerts)

    def test_flood_and_toxic_gas_hazards(self):
        fusion = MultiSensorFusionEngine()
        packet = {
            "pole_id": 2,
            "voltage": 1.2,
            "water_depth": 125.0,
            "mq7": 65.0,
            "mq135": 180.0,
            "mq136": 22.0,
            "is_upright": True
        }
        alerts = fusion.evaluate_hazards(packet)
        alert_types = {a["alert_type"] for a in alerts}
        assert "flood_submersion" in alert_types
        assert "gas_mq7" in alert_types
        assert "gas_mq135" in alert_types
        assert "gas_mq136" in alert_types
