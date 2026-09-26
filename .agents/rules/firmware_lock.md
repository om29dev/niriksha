---
trigger: always_active
description: Firmware lock rule prohibiting modification of microcontroller firmware sketches
---

# Microcontroller Firmware Lock Directive

## Absolute Read-Only Constraint
- Files within `firmware/` (`firmware/pole1_sensor_node/`, `firmware/pole2_sensor_node/`, `firmware/pole3_gateway_hub/`) are strictly **READ-ONLY**.
- Agents and automated tools MUST NEVER modify, rewrite, or overwrite any `.ino` or C/C++ sketch in `firmware/`.
- All sensor normalization, data transformations, pitch/roll tilt kinematics, calibration offset compensations, and threshold checks must be performed in the Python backend (`app/protocols/`, `app/analytics/`) and the React dashboard frontend (`frontend/src/`).
- Any modification to firmware sketches requires explicit, separate written authorization from the user.
