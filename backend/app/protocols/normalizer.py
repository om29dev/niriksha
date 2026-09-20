import time
from typing import Dict, Any, Optional


def normalize_mesh_packet(data: Dict[str, Any], source: str, seq: int = 1) -> Dict[str, Any]:
    """
    Normalizes incoming sensor readings from Serial COM or MQTT into a unified schema.
    Sensors without active hardware readings are explicitly marked 'NOT_CONNECTED'.
    """
    pole_id = int(data.get("pole_id", 1))
    mesh_node_id = data.get("mesh_node_id")
    timestamp = float(data.get("timestamp", time.time()))

    temp_val = data.get("temperature")
    humidity_val = data.get("humidity")
    water_depth_val = data.get("water_depth")
    is_upright_val = data.get("is_upright")
    voltage_val = data.get("voltage")
    current_val = data.get("current", data.get("current_ma"))
    power_val = data.get("power")
    energy_val = data.get("energy")
    freq_val = data.get("frequency")
    pf_val = data.get("pf")

    # Gas sensors: calculate ppm estimates if raw ADC provided
    mq7_val = data.get("mq7")
    if mq7_val is None and data.get("co_raw") is not None:
        raw_co = float(data.get("co_raw", 0))
        mq7_val = round(raw_co * (100.0 / 4095.0), 1) if raw_co > 0 else 0.0

    mq135_val = data.get("mq135")
    if mq135_val is None and data.get("air_quality_raw") is not None:
        raw_aq = float(data.get("air_quality_raw", 0))
        mq135_val = round(raw_aq * (300.0 / 4095.0), 1) if raw_aq > 0 else 0.0

    mq136_val = data.get("mq136")
    mq2_val = data.get("mq2")

    def sensor_entry(val: Any, unit: str = "") -> Dict[str, Any]:
        if val is not None:
            return {"val": val, "status": "CONNECTED", "unit": unit}
        return {"val": None, "status": "NOT_CONNECTED", "unit": unit}

    sensors = {
        "temperature": sensor_entry(temp_val, "°C"),
        "humidity": sensor_entry(humidity_val, "%"),
        "water_depth": sensor_entry(water_depth_val, "cm"),
        "tilt": {
            "val": 1 if is_upright_val is True else (0 if is_upright_val is False else None),
            "status": "CONNECTED" if is_upright_val is not None else "NOT_CONNECTED",
            "is_upright": is_upright_val
        },
        "voltage": sensor_entry(voltage_val, "V"),
        "current": sensor_entry(current_val, "A"),
        "power": sensor_entry(power_val, "W"),
        "energy": sensor_entry(energy_val, "kWh"),
        "frequency": sensor_entry(freq_val, "Hz"),
        "pf": sensor_entry(pf_val, ""),
        "mq7": sensor_entry(mq7_val, "ppm"),
        "mq135": sensor_entry(mq135_val, "ppm"),
        "mq136": sensor_entry(mq136_val, "ppm"),
        "mq2": sensor_entry(mq2_val, "ppm")
    }

    return {
        "seq": data.get("seq", seq),
        "timestamp": round(timestamp, 3),
        "pole_id": pole_id,
        "mesh_node_id": mesh_node_id,
        "temperature": sensors["temperature"]["val"],
        "humidity": sensors["humidity"]["val"],
        "water_depth": sensors["water_depth"]["val"],
        "is_upright": sensors["tilt"]["is_upright"],
        "voltage": sensors["voltage"]["val"],
        "current_ma": sensors["current"]["val"],
        "power": sensors["power"]["val"],
        "energy": sensors["energy"]["val"],
        "frequency": sensors["frequency"]["val"],
        "pf": sensors["pf"]["val"],
        "mq7": sensors["mq7"]["val"],
        "mq135": sensors["mq135"]["val"],
        "mq136": sensors["mq136"]["val"],
        "mq2": sensors["mq2"]["val"],
        "sensors": sensors,
        "source": source
    }
