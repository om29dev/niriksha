"""
Unit verification suite for NIRIKSHA modernized architecture:
Tests normalizer, Kalman filter, streaming anomaly detection, and hazard fusion.
"""
from app.protocols import normalize_mesh_packet
from app.analytics import SingleStateKalmanFilter, StreamingEWMA, CUSUMDriftDetector, MultiSensorFusionEngine


def test_normalizer():
    raw_packet = {
        "pole_id": 1,
        "temperature": 28.5,
        "water_depth": 34.0,
        "is_upright": True,
        "voltage": 1.2
    }
    normalized = normalize_mesh_packet(raw_packet, source="SERIAL:COM3", seq=10)
    assert normalized["pole_id"] == 1
    assert normalized["seq"] == 10
    assert normalized["sensors"]["temperature"]["val"] == 28.5
    assert normalized["sensors"]["temperature"]["status"] == "CONNECTED"
    assert normalized["sensors"]["mq7"]["status"] == "NOT_CONNECTED"
    assert normalized["sensors"]["mq7"]["val"] is None
    print("[PASS] Normalizer test passed")


def test_kalman_filter():
    kf = SingleStateKalmanFilter(process_variance=0.05, measurement_variance=1.0)
    noisy_measurements = [50.0, 52.0, 48.5, 51.2, 49.8, 50.5]
    estimates = [kf.update(m) for m in noisy_measurements]
    # Filter output should be close to true mean (~50.3)
    assert abs(estimates[-1] - 50.3) < 2.0
    print("[PASS] Kalman filter convergence test passed")


def test_anomaly_detection():
    ewma = StreamingEWMA(alpha=0.2)
    # Feed normal values
    for _ in range(20):
        ewma.update(2.0)
    mean, std = ewma.update(2.0)
    assert abs(mean - 2.0) < 0.1

    # Sudden surge test
    surge_val = 8.5
    z_score = (surge_val - mean) / std
    assert z_score > 3.0  # Statistical outlier detected
    print("[PASS] Streaming EWMA anomaly detection test passed")


def test_cusum_drift():
    cusum = CUSUMDriftDetector(slack=0.5, threshold=3.0)
    # Subtle steady upward bias
    drift_tripped = False
    for _ in range(10):
        tripped, _ = cusum.update(1.2)
        if tripped:
            drift_tripped = True
            break
    assert drift_tripped
    print("[PASS] CUSUM subtle drift detection test passed")


def test_hazard_fusion():
    fusion = MultiSensorFusionEngine()

    # 1. High voltage + water depth -> elevated Electrocution Risk Index
    elec_risk = fusion.compute_electrocution_risk(voltage=4.8, water_depth=120.0)
    assert elec_risk >= 70.0  # Escalated due to water conductance multiplier

    # 2. Fire Combustion Index
    fire_idx = fusion.compute_fire_combustion_index(temperature=55.0, mq7_co=65.0, mq2_combustible=45.0)
    assert fire_idx >= 75.0  # High combustion confidence

    packet = {
        "pole_id": 2,
        "voltage": 5.5,
        "water_depth": 80.0,
        "temperature": 30.0,
        "is_upright": True
    }
    hazards = fusion.evaluate_hazards(packet)
    assert any(h["alert_type"] == "voltage_surge" for h in hazards)
    print("[PASS] Multi-sensor hazard fusion test passed")


if __name__ == "__main__":
    test_normalizer()
    test_kalman_filter()
    test_anomaly_detection()
    test_cusum_drift()
    test_hazard_fusion()
    print("\nAll architecture unit tests passed successfully!")
