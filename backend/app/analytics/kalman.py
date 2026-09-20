from typing import Dict, Optional


class SingleStateKalmanFilter:
    """
    1D discrete-time Kalman filter for smoothing noisy analog and ultrasonic sensor signals.
    Minimizes mean squared error between noisy ADC samples and the underlying physical process.
    """

    def __init__(self, process_variance: float = 1e-3, measurement_variance: float = 1e-1):
        self.q = process_variance       # Process noise covariance Q
        self.r = measurement_variance   # Measurement noise covariance R
        self.x: Optional[float] = None  # Estimated state
        self.p: float = 1.0             # Estimation error covariance P
        self.k: float = 0.0             # Kalman gain K

    def update(self, measurement: Optional[float]) -> Optional[float]:
        """Performs prediction and measurement update cycle."""
        if measurement is None:
            return None

        # Initialization on first reading
        if self.x is None:
            self.x = measurement
            self.p = self.r
            return round(self.x, 3)

        # 1. Prediction step
        # State extrapolation: x_hat_k|k-1 = x_hat_k-1|k-1
        # Covariance extrapolation: P_k|k-1 = P_k-1|k-1 + Q
        self.p = self.p + self.q

        # 2. Measurement update step
        # Kalman Gain: K_k = P_k|k-1 / (P_k|k-1 + R)
        self.k = self.p / (self.p + self.r)
        # State update: x_hat_k|k = x_hat_k|k-1 + K_k * (z_k - x_hat_k|k-1)
        self.x = self.x + self.k * (measurement - self.x)
        # Covariance update: P_k|k = (1 - K_k) * P_k|k-1
        self.p = (1.0 - self.k) * self.p

        return round(self.x, 3)

    def reset(self):
        self.x = None
        self.p = 1.0


class PoleKalmanBank:
    """Maintains individual Kalman filter channels per pole and sensor type."""

    def __init__(self):
        # Maps (pole_id, sensor_name) -> SingleStateKalmanFilter
        self.filters: Dict[str, SingleStateKalmanFilter] = {}

    def filter_value(self, pole_id: int, sensor_name: str, raw_value: Optional[float]) -> Optional[float]:
        if raw_value is None:
            return None

        key = f"{pole_id}:{sensor_name}"
        if key not in self.filters:
            # Tune process/measurement noise per physical sensor dynamics
            if sensor_name == "water_depth":
                # Ultrasonic sensor has discrete jitter & surface waves
                self.filters[key] = SingleStateKalmanFilter(process_variance=0.05, measurement_variance=2.0)
            elif "mq" in sensor_name:
                # Chemical gas sensors have slow drift and ADC noise
                self.filters[key] = SingleStateKalmanFilter(process_variance=0.01, measurement_variance=0.8)
            elif sensor_name in ("voltage", "current_ma"):
                # Fast response electrical telemetry
                self.filters[key] = SingleStateKalmanFilter(process_variance=0.1, measurement_variance=0.2)
            else:
                self.filters[key] = SingleStateKalmanFilter(process_variance=0.02, measurement_variance=0.5)

        return self.filters[key].update(raw_value)
