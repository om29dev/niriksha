import pytest
from app.analytics.kalman import SingleStateKalmanFilter, PoleKalmanBank


class TestSingleStateKalmanFilter:
    def test_initialization_and_first_sample(self):
        kf = SingleStateKalmanFilter(process_variance=0.01, measurement_variance=0.5)
        assert kf.x is None
        assert kf.p == 1.0

        first_val = kf.update(24.5)
        assert first_val == 24.5
        assert kf.x == 24.5
        assert kf.p == 0.5

    def test_none_measurement_handling(self):
        kf = SingleStateKalmanFilter()
        assert kf.update(None) is None
        # State remains None
        assert kf.x is None

        # After initializing, None still returns None without resetting state
        kf.update(10.0)
        assert kf.update(None) is None
        assert kf.x == 10.0

    def test_noise_smoothing_and_convergence(self):
        kf = SingleStateKalmanFilter(process_variance=0.05, measurement_variance=1.0)
        noisy_signals = [50.0, 52.0, 48.5, 51.2, 49.8, 50.5, 50.2, 49.9]
        smoothed = []
        for sample in noisy_signals:
            smoothed.append(kf.update(sample))

        # Smoothed output converges closely to true process mean (~50.2)
        assert abs(smoothed[-1] - 50.2) < 1.0
        # Kalman gain stabilizes to a fraction under 1.0
        assert 0.0 < kf.k < 1.0

    def test_filter_reset(self):
        kf = SingleStateKalmanFilter()
        kf.update(100.0)
        assert kf.x == 100.0

        kf.reset()
        assert kf.x is None
        assert kf.p == 1.0


class TestPoleKalmanBank:
    def test_bank_sensor_channels(self):
        bank = PoleKalmanBank()
        # Feed readings for distinct poles and sensors
        p1_depth = bank.filter_value(pole_id=1, sensor_name="water_depth", raw_value=35.0)
        p2_volt = bank.filter_value(pole_id=2, sensor_name="voltage", raw_value=4.9)
        p1_gas = bank.filter_value(pole_id=1, sensor_name="mq7", raw_value=18.5)

        assert p1_depth == 35.0
        assert p2_volt == 4.9
        assert p1_gas == 18.5

        # Check channel keys created
        assert "1:water_depth" in bank.filters
        assert "2:voltage" in bank.filters
        assert "1:mq7" in bank.filters

    def test_bank_handles_none_values(self):
        bank = PoleKalmanBank()
        res = bank.filter_value(pole_id=1, sensor_name="water_depth", raw_value=None)
        assert res is None
        assert "1:water_depth" not in bank.filters
