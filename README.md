# NIRIKSHA - Interactive Web Simulation Demo

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20GitHub%20Pages-blue.svg)](https://om29dev.github.io/niriksha/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)

This branch (`simulation-demo`) contains the standalone, static browser demonstration build of the **NIRIKSHA** Distributed IoT Environmental & Hazard Monitoring Network.

## 🌟 Interactive Preview Features

- **Live In-Browser Mesh Simulation**: Generates realistic multi-pole telemetry streams (Poles 1, 2, 3) in real time without requiring physical hardware or local server backends.
- **Dynamic Hazard Scenario Testing**:
  - `Normal Mesh Baseline`: Upright nodes, safe submerged voltage (~0.1V), nominal ambient temperatures and gas levels.
  - `Water Electrification`: Simulates dangerous AC voltage leaks (>5.0V) in submerged water probes.
  - `Thermal Fire Outbreak`: Simulates extreme thermal spikes (>=60°C) and combustion gas surges.
  - `Severe Flood Level`: Simulates ultrasonic submersion depth exceeding 100cm.
  - `Structural Tilt / Fallen`: Simulates inclinometer/tilt trips on pole structural collapse.
  - `Toxic Gas Spike`: Simulates dangerous carbon monoxide (MQ-7) and volatile pollutant spikes (MQ-135).
- **High-Performance Laboratory Aesthetics**: Air-gapped, light-themed industrial UI with sliding-window charts and real-time incident intercept.

## 🚀 Local Development

To run the simulation demo locally:

```powershell
npm install
npm run dev
```

The demo will launch at `http://localhost:5173/`.

## 📦 Automated GitHub Pages Deployment

Pushing to this `simulation-demo` branch automatically triggers the `.github/workflows/deploy-pages.yml` workflow, building the static bundle and publishing it directly to the `gh-pages` branch.
