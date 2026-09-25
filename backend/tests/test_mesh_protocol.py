import pytest
from app.protocols.normalizer import normalize_mesh_packet


class TestMeshProtocolNormalizer:
    def test_complete_sensor_packet(self):
        raw = {
            "pole_id": 1,
            "mesh_node_id": "NODE_A1",
            "temperature": 27.4,
            "humidity": 65.0,
            "water_depth": 32.5,
            "is_upright": True,
            "voltage": 230.1,
            "current": 1.25,
            "power": 287.6,
            "mq7": 12.0
        }
        res = normalize_mesh_packet(raw, source="SERIAL:COM3", seq=42)

        assert res["seq"] == 42
        assert res["pole_id"] == 1
        assert res["mesh_node_id"] == "NODE_A1"
        assert res["source"] == "SERIAL:COM3"
        assert res["is_upright"] is True

        # Check sensors dictionary
        assert res["sensors"]["temperature"]["status"] == "CONNECTED"
        assert res["sensors"]["temperature"]["val"] == 27.4
        assert res["sensors"]["water_depth"]["status"] == "CONNECTED"
        assert res["sensors"]["water_depth"]["val"] == 32.5

    def test_missing_sensors_marked_not_connected(self):
        # Pole 2 with minimal sensors
        raw = {
            "pole_id": 2,
            "water_depth": 15.0,
            "is_upright": True
        }
        res = normalize_mesh_packet(raw, source="MQTT:sih/mesh", seq=1)

        assert res["sensors"]["water_depth"]["status"] == "CONNECTED"
        assert res["sensors"]["water_depth"]["val"] == 15.0

        # Unconnected sensors must have status NOT_CONNECTED and val None
        assert res["sensors"]["temperature"]["status"] == "NOT_CONNECTED"
        assert res["sensors"]["temperature"]["val"] is None
        assert res["sensors"]["voltage"]["status"] == "NOT_CONNECTED"
        assert res["sensors"]["voltage"]["val"] is None
        assert res["sensors"]["mq7"]["status"] == "NOT_CONNECTED"
        assert res["sensors"]["mq7"]["val"] is None

    def test_gas_adc_conversion(self):
        # Raw ADC reading conversion
        raw = {
            "pole_id": 1,
            "co_raw": 2048,
            "air_quality_raw": 1024
        }
        res = normalize_mesh_packet(raw, source="SERIAL:COM3")

        assert res["mq7"] is not None
        assert 49.0 <= res["mq7"] <= 51.0
        assert res["mq135"] is not None
        assert 74.0 <= res["mq135"] <= 76.0
