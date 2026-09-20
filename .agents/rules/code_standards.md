# Code Quality, File Limits, and Production Standards

## Strict File Size Constraint (< 200 Lines)
- **Zero Tolerance for Files Exceeding 200 Lines**: Every source code file (`.py`, `.ts`, `.tsx`) must be kept strictly below 200 lines.
- Deconstruct complex modules into clean layered packages:
  - Configuration & settings: `app/core/`
  - Persistence & queries: `app/db/`
  - Ingestion protocols: `app/protocols/`
  - Signal processing & anomaly detection: `app/analytics/`
  - Intelligence & heuristics: `app/ai/`
  - REST & WebSocket endpoints: `app/routers/`

## Production Protocols (No Mock / Simulation)
- Mock simulation loops and synthetic data generators are strictly disallowed in active production runtimes.
- System ingestion accepts telemetry exclusively through:
  1. Physical Serial COM gateways (`pyserial`)
  2. Industrial MQTT brokers (`aiomqtt`)

## Advanced Algorithmic Telemetry Processing
- All incoming sensor readings must flow through:
  1. 1D Kalman noise filtering (smoothing noisy ADC and ultrasonic readings).
  2. Streaming statistical anomaly detection (EWMA dynamic baseline, Z-score surge flagging, CUSUM drift detection).
  3. Multi-sensor hazard fusion (electrocution risk indexing, fire/combustion cross-validation, structural tilt debounce).

## Human-Grade Craftsmanship
- Avoid robotic AI boilerplate comments.
- Code should be written idiomatically, defensively, and concisely.
- Maintain strict typing, robust error recovery, and clear architectural documentation.
