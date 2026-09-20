import math
from typing import Optional, Dict, Tuple


class StreamingEWMA:
    """Calculates streaming exponential moving average and variance without storing history."""

    def __init__(self, alpha: float = 0.15):
        self.alpha = alpha
        self.mean: Optional[float] = None
        self.variance: float = 0.0
        self.count: int = 0

    def update(self, val: float) -> Tuple[float, float]:
        self.count += 1
        if self.mean is None:
            self.mean = val
            self.variance = 1.0
            return self.mean, math.sqrt(self.variance)

        diff = val - self.mean
        # Update exponential mean
        self.mean = self.mean + self.alpha * diff
        # Update incremental exponential variance (Welford-style adaptation)
        self.variance = (1.0 - self.alpha) * (self.variance + self.alpha * (diff ** 2))
        std = math.sqrt(max(self.variance, 1e-4))
        return self.mean, std


class CUSUMDriftDetector:
    """Two-sided Cumulative Sum (CUSUM) control chart to detect subtle persistent sensor drifts."""

    def __init__(self, slack: float = 0.5, threshold: float = 5.0):
        self.k = slack          # Slack value (allowable deviation)
        self.h = threshold      # Action threshold
        self.s_pos = 0.0        # Cumulative positive drift
        self.s_neg = 0.0        # Cumulative negative drift

    def update(self, error: float) -> Tuple[bool, str]:
        self.s_pos = max(0.0, self.s_pos + error - self.k)
        self.s_neg = max(0.0, self.s_neg - error - self.k)

        if self.s_pos > self.h:
            self.s_pos = 0.0  # Reset upon trip
            return True, "UPWARD_DRIFT"
        if self.s_neg > self.h:
            self.s_neg = 0.0
            return True, "DOWNWARD_DRIFT"
        return False, "STABLE"


class AnomalyDetectorBank:
    """Manages EWMA and CUSUM models per telemetry channel."""

    def __init__(self):
        self.ewma_models: Dict[str, StreamingEWMA] = {}
        self.cusum_models: Dict[str, CUSUMDriftDetector] = {}

    def analyze_sensor(self, pole_id: int, sensor: str, value: Optional[float]) -> Dict[str, Any]:
        """
        Evaluates a sensor value against dynamic statistical baselines.
        Returns anomaly flags, z-score, and drift indicators.
        """
        if value is None:
            return {"is_anomaly": False, "z_score": 0.0, "drift": "STABLE"}

        key = f"{pole_id}:{sensor}"
        if key not in self.ewma_models:
            self.ewma_models[key] = StreamingEWMA(alpha=0.1)
            self.cusum_models[key] = CUSUMDriftDetector(slack=0.5, threshold=4.0)

        ewma = self.ewma_models[key]
        cusum = self.cusum_models[key]

        mean, std = ewma.update(value)
        z_score = (value - mean) / std if std > 0 else 0.0
        drift_detected, drift_type = cusum.update(z_score)

        # Flag an anomaly if instantaneous z-score exceeds 3.0 sigma or CUSUM triggers
        is_surge = abs(z_score) >= 3.0 and ewma.count > 5
        is_anomaly = is_surge or drift_detected

        return {
            "is_anomaly": is_anomaly,
            "z_score": round(z_score, 2),
            "baseline_mean": round(mean, 2),
            "std_dev": round(std, 2),
            "drift": drift_type if drift_detected else "STABLE",
            "samples_seen": ewma.count
        }
