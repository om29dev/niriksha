import pytest
from app.analytics.anomaly import StreamingEWMA, CUSUMDriftDetector, AnomalyDetectorBank


class TestStreamingEWMA:
    def test_initial_sample_baseline(self):
        ewma = StreamingEWMA(alpha=0.15)
        mean, std = ewma.update(10.0)
        assert mean == 10.0
        assert std == 1.0
        assert ewma.count == 1

    def test_steady_signal_stabilization(self):
        ewma = StreamingEWMA(alpha=0.2)
        # Feed 30 constant values
        for _ in range(30):
            mean, std = ewma.update(5.0)

        assert abs(mean - 5.0) < 0.01
        assert std < 0.1
        assert ewma.count == 30

    def test_surge_detection_z_score(self):
        ewma = StreamingEWMA(alpha=0.1)
        for _ in range(25):
            ewma.update(3.0)

        mean, std = ewma.update(3.0)
        surge_sample = 12.0
        z_score = (surge_sample - mean) / std
        assert z_score > 3.0


class TestCUSUMDriftDetector:
    def test_stable_signal_no_trip(self):
        cusum = CUSUMDriftDetector(slack=0.5, threshold=4.0)
        for _ in range(20):
            tripped, drift_type = cusum.update(0.2)
            assert not tripped
            assert drift_type == "STABLE"

    def test_persistent_positive_drift(self):
        cusum = CUSUMDriftDetector(slack=0.5, threshold=3.0)
        tripped = False
        drift_direction = ""
        # Feed errors consistently greater than slack k=0.5
        for _ in range(10):
            has_tripped, dtype = cusum.update(1.5)
            if has_tripped:
                tripped = True
                drift_direction = dtype
                break

        assert tripped
        assert drift_direction == "UPWARD_DRIFT"
        # Verify cumulative sum resets after trip
        assert cusum.s_pos == 0.0

    def test_persistent_negative_drift(self):
        cusum = CUSUMDriftDetector(slack=0.5, threshold=3.0)
        tripped = False
        drift_direction = ""
        for _ in range(10):
            has_tripped, dtype = cusum.update(-1.5)
            if has_tripped:
                tripped = True
                drift_direction = dtype
                break

        assert tripped
        assert drift_direction == "DOWNWARD_DRIFT"
        assert cusum.s_neg == 0.0


class TestAnomalyDetectorBank:
    def test_none_value_returns_safe_defaults(self):
        bank = AnomalyDetectorBank()
        result = bank.analyze_sensor(pole_id=1, sensor="voltage", value=None)
        assert result["is_anomaly"] is False
        assert result["z_score"] == 0.0
        assert result["drift"] == "STABLE"

    def test_surge_anomaly_flagging(self):
        bank = AnomalyDetectorBank()
        # Warmup baseline with steady readings
        for _ in range(10):
            bank.analyze_sensor(pole_id=1, sensor="voltage", value=2.0)

        # Trigger sudden massive spike
        surge_result = bank.analyze_sensor(pole_id=1, sensor="voltage", value=15.0)
        assert surge_result["is_anomaly"] is True
        assert surge_result["z_score"] >= 3.0
