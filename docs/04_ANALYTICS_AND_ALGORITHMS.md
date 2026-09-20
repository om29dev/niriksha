# 04. Algorithmic Analytics & Hazard Signal Processing

Raw transducer data from field-deployed IoT sensors is inherently noisy: analog ADC lines experience electromagnetic interference, ultrasonic acoustic pulses bounce off surface ripples, and gas sensors undergo heating-cycle fluctuations. Relying on raw, unconditioned sensor readings leads to rampant false alarms or missed catastrophic failures.

NIRIKSHA routes all normalized telemetry through an in-memory algorithmic processing pipeline before database storage or client broadcasting:
1. **1D Discrete-Time Linear Kalman Filtering** for noise and jitter rejection.
2. **Streaming Statistical Anomaly Detection** (EWMA Dynamic Baselines & CUSUM Drift Tracking).
3. **Multi-Sensor Composite Hazard Fusion** (Electrocution Risk Index, Fire & Combustion Index, and Tilt Debounce).

---

## 1. Algorithmic Pipeline Architecture

```d2
direction: right

raw_in: Normalized Telemetry Packet {
  shape: document
  style.fill: "#f8fafc"
}

stage1: Stage 1: 1D Kalman Filter Bank (kalman.py) {
  shape: step
  style.fill: "#ede9fe"
  style.stroke: "#7c3aed"
  desc: "Minimizes Mean Squared Error\nPer-channel tuned Q and R covariances"
}

stage2: Stage 2: Streaming Anomaly Bank (anomaly.py) {
  shape: step
  style.fill: "#ede9fe"
  style.stroke: "#7c3aed"
  desc: "EWMA Mean & Variance (Welford adaptation)\nZ-Score Surge Flagging (|z| > 3.0)\nTwo-Sided CUSUM Slow Drift Accumulator"
}

stage3: Stage 3: Multi-Sensor Hazard Fusion (fusion_engine.py) {
  shape: step
  style.fill: "#fee2e2"
  style.stroke: "#ef4444"
  desc: "Electrocution Risk Index (Voltage x Water Depth)\nFire & Combustion Index (Temp + MQ-7 + MQ-2)\nTilt Debounce Verification"
}

enriched_out: Enriched Telemetry Packet {
  shape: document
  style.fill: "#dcfce7"
  style.stroke: "#16a34a"
  payload: "Filtered Sensors + Composite Indices + Alert Objects"
}

raw_in -> stage1: "Raw Floats"
stage1 -> stage2: "Noise-Suppressed Stream"
stage2 -> stage3: "Z-Scores & Drift Indicators"
stage3 -> enriched_out: "To Batch Buffer & WebSockets"
```

---

## 2. 1D Discrete-Time Linear Kalman Filter (`kalman.py`)

The 1D Kalman filter operates as an optimal recursive data estimator, minimizing the mean squared error between noisy ADC measurements and the underlying physical process state without buffering historical vectors.

### 2.1 State-Space Equations
For each discrete time step $k$:

1. **State Extrapolation (Prediction)**:
   $$\hat{x}_{k|k-1} = \hat{x}_{k-1|k-1}$$
   The expected state equals the previous estimated state (random-walk assumption).

2. **Covariance Extrapolation (Prediction Error)**:
   $$P_{k|k-1} = P_{k-1|k-1} + Q$$
   Where $Q$ is the process noise covariance (how rapidly the physical environment can genuinely change).

3. **Kalman Gain Computation**:
   $$K_k = \frac{P_{k|k-1}}{P_{k|k-1} + R}$$
   Where $R$ is the measurement noise covariance (sensor instrument error / ADC jitter).

4. **State Estimate Update**:
   $$\hat{x}_{k|k} = \hat{x}_{k|k-1} + K_k \cdot (z_k - \hat{x}_{k|k-1})$$
   Where $z_k$ is the raw sensor reading. $K_k$ dynamically weights between the prediction and the new measurement:
   - When sensor noise $R$ is large, $K_k \to 0$ (filter favors historical inertia).
   - When estimation error $P$ is large, $K_k \to 1$ (filter snaps rapidly to new measurements).

5. **Covariance Update**:
   $$P_{k|k} = (1 - K_k) \cdot P_{k|k-1}$$

### 2.2 Empirical Covariance Tuning Matrix

The filter parameters are calibrated in `PoleKalmanBank` according to physical transducer dynamics:

| Sensor Type | Process Variance ($Q$) | Measurement Variance ($R$) | Physical Justification |
| :--- | :--- | :--- | :--- |
| **Ultrasonic Flood Depth (`water_depth`)** | $0.05$ | $2.00$ | Surface ripples, wind turbulence, and acoustic echo jitter produce high measurement variance ($R=2.0$). Actual floodwater rises smoothly ($Q=0.05$). |
| **Metal Oxide Gas Array (`mq7`, `mq135`, etc.)** | $0.01$ | $0.80$ | Gas sensor heaters cycle and cause baseline thermal ADC wobble. Chemical dispersion in air is relatively gradual. |
| **Electrical Potential (`voltage`, `current_ma`)** | $0.10$ | $0.20$ | Electrical line faults happen instantaneously ($Q=0.10$). The filter must respond in milliseconds to lethal potential without lagging behind reality. |

---

## 3. Streaming Statistical Anomaly Detection (`anomaly.py`)

Static alert thresholds (e.g. `water_depth > 100 cm`) fail to detect early-stage anomalous behavior, such as a localized water accumulation rising abnormally fast or a subtle chemical leak that has not yet crossed a catastrophic boundary.

NIRIKSHA executes two statistical detection algorithms on every telemetry channel:

### 3.1 Streaming Exponentially Weighted Moving Average (EWMA)
To avoid storing large time-series arrays in RAM, EWMA dynamically updates running mean $\mu$ and standard deviation $\sigma$ in $O(1)$ constant time using an incremental Welford adaptation:

$$\mu_k = \mu_{k-1} + \alpha \cdot (x_k - \mu_{k-1})$$
$$\sigma^2_k = (1 - \alpha) \cdot \left(\sigma^2_{k-1} + \alpha \cdot (x_k - \mu_{k-1})^2\right)$$

- **Smoothing Factor**: $\alpha = 0.10$
- **Dynamic Z-Score Surge Trigger**:
  $$z_k = \frac{x_k - \mu_k}{\sigma_k}$$
  If $|z_k| > 3.0$, the measurement deviates by more than 3 standard deviations from its moving baseline, flagging an instant **SURGE_ANOMALY**.

### 3.2 Two-Sided Cumulative Sum (CUSUM) Drift Detector
CUSUM is an optimal quality control chart for detecting subtle, insidious shifts in the mean level of a process that are too small to trip a single-sample $3\sigma$ threshold.

$$\text{Error}: e_k = x_k - \mu_{\text{expected}}$$
$$\text{Positive Accumulator}: S_k^+ = \max(0, S_{k-1}^+ + e_k - k_{\text{slack}})$$
$$\text{Negative Accumulator}: S_k^- = \max(0, S_{k-1}^- - e_k - k_{\text{slack}})$$

- **Slack Parameter ($k_{\text{slack}}$)**: Set to $0.5$ (permits normal minor fluctuations).
- **Decision Threshold ($h$)**: Set to $4.0$.
- **Detection Behavior**:
  - If $S_k^+ > 4.0$: Flags `UPWARD_DRIFT` (e.g. slow, persistent gutter blockage or smoldering wire insulation before open fire).
  - If $S_k^- > 4.0$: Flags `DOWNWARD_DRIFT` (e.g. degrading sensor battery voltage or failing sensor element).
  - Upon tripping, the accumulator resets to zero.

---

## 4. Multi-Sensor Composite Hazard Fusion (`fusion_engine.py`)

Disasters in urban infrastructure are rarely isolated single-sensor phenomena. Catastrophic municipal accidents occur when multiple environmental risks converge.

### 4.1 Electrocution Risk Index ($0.0 \text{ to } 100.0\%$)
A small voltage leakage into dry air is harmless; the same voltage leakage into standing flood water creates a lethal electric field that can paralyze pedestrians and emergency workers.

The fusion engine calculates:
$$S_{\text{volt}} = \min\left(100.0, \frac{V_{\text{measured}}}{5.0} \times 70.0\right)$$
$$\text{Multiplier}_{\text{depth}} = \begin{cases} 1.0 & \text{if } D_{\text{water}} \le 0 \\ \min\left(1.5, 1.0 + \frac{D_{\text{water}}}{200.0}\right) & \text{if } D_{\text{water}} > 0 \end{cases}$$
$$\text{Risk}_{\text{electrocution}} = \min(100.0, S_{\text{volt}} \times \text{Multiplier}_{\text{depth}})$$

- **Critical Threshold**: If $\text{Risk}_{\text{electrocution}} \ge 70.0\%$ (or raw $V > 5.0\text{V}$):
  - Raises a `critical` severity `voltage_surge` incident.
  - Automatically engages the browser's full-screen emergency modal and triggers the 880 Hz acoustic evacuation siren.

### 4.2 Fire & Thermal Combustion Index ($0.0 \text{ to } 100.0\%$)
During summer heatwaves, ambient air temperature can exceed $45^\circ\text{C}$ without any actual fire. Relying solely on a temperature sensor causes rampant false alarms. Conversely, an electrical fire inside a junction box produces toxic smoke and carbon monoxide before thermal heat radiates outward.

The fusion engine cross-verifies heat with chemical signatures:
$$S_{\text{thermal}} = \begin{cases} 0 & \text{if } T \le 35.0^\circ\text{C} \\ \min\left(50.0, \frac{T - 35.0}{25.0} \times 50.0\right) & \text{if } T > 35.0^\circ\text{C} \end{cases}$$
$$S_{\text{CO}} = \begin{cases} 0 & \text{if } \text{PPM}_{\text{MQ7}} \le 20.0 \\ \min\left(35.0, \frac{\text{PPM}_{\text{MQ7}} - 20.0}{30.0} \times 35.0\right) & \text{if } \text{PPM}_{\text{MQ7}} > 20.0 \end{cases}$$
$$S_{\text{combustible}} = \begin{cases} 0 & \text{if } \text{PPM}_{\text{MQ2}} \le 30.0 \\ \min\left(25.0, \frac{\text{PPM}_{\text{MQ2}} - 30.0}{40.0} \times 25.0\right) & \text{if } \text{PPM}_{\text{MQ2}} > 30.0 \end{cases}$$
$$\text{Index}_{\text{fire}} = \min(100.0, S_{\text{thermal}} + S_{\text{CO}} + S_{\text{combustible}})$$

- **Critical Outbreak**: If $\text{Index}_{\text{fire}} \ge 75.0\%$ or temperature exceeds $60.0^\circ\text{C}$, the engine dispatches a high-priority `fire_emergency` alert.

### 4.3 Structural Tilt Debounce Confirmation
The SW-520D mechanical tilt switch can briefly bounce when a heavy truck drives over an adjacent pothole.
- The engine maintains an internal `_tilt_counters[pole_id]`.
- When `is_upright == False`, the counter increments.
- A critical `tilt_collapse` alert is issued **only after 2 consecutive non-upright packets** ($> 4.6\text{ seconds}$ sustained displacement).
- When the pole returns upright, the counter immediately resets to zero.
