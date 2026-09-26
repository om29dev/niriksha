import time
from typing import Dict, Any, Optional
from app.analytics.tilt_kinematics import compute_tilt_angles


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

    # MPU6050 Accelerometer & Gyroscope
    ax_val = data.get("accel_x")
    ay_val = data.get("accel_y")
    az_val = data.get("accel_z")
    gx_val = data.get("gyro_x")
    gy_val = data.get("gyro_y")
    gz_val = data.get("gyro_z")
    mpu_temp = data.get("mpu_temperature")

    # Derive Pitch, Roll, and Total Tilt Deviation
    angles = compute_tilt_angles(ax_val, ay_val, az_val)
    pitch_val = angles["pitch"]
    roll_val = angles["roll"]
    tilt_angle_val = angles["tilt_angle"]

    # If pole 3 has MPU6050, derive is_upright if not explicitly provided
    if is_upright_val is None and tilt_angle_val is not None:
        is_upright_val = (tilt_angle_val < 15.0)

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
        "mq2": sensor_entry(mq2_val, "ppm"),
        "accel_x": sensor_entry(ax_val, "m/s²"),
        "accel_y": sensor_entry(ay_val, "m/s²"),
        "accel_z": sensor_entry(az_val, "m/s²"),
        "gyro_x": sensor_entry(gx_val, "°/s"),
        "gyro_y": sensor_entry(gy_val, "°/s"),
        "gyro_z": sensor_entry(gz_val, "°/s"),
        "pitch": sensor_entry(pitch_val, "°"),
        "roll": sensor_entry(roll_val, "°"),
        "tilt_angle": sensor_entry(tilt_angle_val, "°"),
        "mpu_temperature": sensor_entry(mpu_temp, "°C")
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
        "accel_x": ax_val,
        "accel_y": ay_val,
        "accel_z": az_val,
        "gyro_x": gx_val,
        "gyro_y": gy_val,
        "gyro_z": gz_val,
        "pitch": pitch_val,
        "roll": roll_val,
        "tilt_angle": tilt_angle_val,
        "mpu_temperature": mpu_temp,
        "sensors": sensors,
        "source": source
    }
