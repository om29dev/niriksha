import math
from typing import Dict, Any, Optional, Tuple


def compute_tilt_angles(
    ax: Optional[float],
    ay: Optional[float],
    az: Optional[float]
) -> Dict[str, Optional[float]]:
    """
    Computes pitch, roll, and total tilt deviation from 3-axis accelerometer data (in m/s^2 or g).
    - Pitch (deg): Rotation around Y axis
    - Roll (deg): Rotation around X axis
    - Tilt Deviation (deg): Absolute angular tilt deviation from vertical (Z-axis).
    """
    if ax is None or ay is None or az is None:
        return {"pitch": None, "roll": None, "tilt_angle": None}

    # Avoid zero division
    norm_sq = ax * ax + ay * ay + az * az
    if norm_sq < 0.0001:
        return {"pitch": 0.0, "roll": 0.0, "tilt_angle": 0.0}

    norm = math.sqrt(norm_sq)

    # Pitch = atan2(ay, sqrt(ax^2 + az^2)) in degrees
    pitch = math.atan2(ay, math.sqrt(ax * ax + az * az)) * (180.0 / math.pi)

    # Roll = atan2(-ax, az) in degrees
    roll = math.atan2(-ax, az) * (180.0 / math.pi)

    # Total tilt angle relative to upright vertical (Z-axis aligned with gravity)
    # cos(theta) = az / norm
    clamped_cos = max(-1.0, min(1.0, abs(az) / norm))
    tilt_deviation = math.acos(clamped_cos) * (180.0 / math.pi)

    return {
        "pitch": round(pitch, 1),
        "roll": round(roll, 1),
        "tilt_angle": round(tilt_deviation, 1)
    }


def is_landslide_tilt_hazard(tilt_angle: Optional[float], threshold_deg: float = 15.0) -> bool:
    """Evaluates if the pole tilt angle indicates slope movement or landslide condition."""
    if tilt_angle is None:
        return False
    return tilt_angle >= threshold_deg
