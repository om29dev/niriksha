import { useState, useEffect } from 'react';
import type { TelemetryPacket, PoleId, PoleState } from '../types/telemetry';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../constants/gasThresholds';

export function useHazardDetection(
  latestPole1: TelemetryPacket | null,
  latestPole2: TelemetryPacket | null,
  latestPole3: TelemetryPacket | null,
  customGasThresholds?: Partial<GasThresholdConfig>
) {
  const gasThresholds = { ...DEFAULT_GAS_THRESHOLDS, ...customGasThresholds };
  // 1-second interval to keep time-since-last-packet fresh
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(Date.now() / 1000);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeSec(Date.now() / 1000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPoleState = (pkt: TelemetryPacket | null): PoleState => {
    if (!pkt) return { isDown: false, isOffline: true, secondsSince: null };
    const secondsSince = Math.max(0, Math.round(currentTimeSec - pkt.timestamp));
    const isOffline = secondsSince > 7;
    const isDown = pkt.is_upright === false;
    return { isDown, isOffline, secondsSince };
  };

  const poleStateMap: Record<PoleId, PoleState> = {
    1: getPoleState(latestPole1),
    2: getPoleState(latestPole2),
    3: getPoleState(latestPole3),
  };

  const downPoles = ([1, 2, 3] as const).filter((id) => poleStateMap[id].isDown);
  const offlinePoles = ([1, 2, 3] as const).filter((id) => poleStateMap[id].isOffline);

  // 1. Water Voltage Leak: Two probes in water measure voltage > 5.0V (Electrification Hazard on active poles)
  const voltageHazardPoles = ([1, 2, 3] as const).filter((id) => {
    if (poleStateMap[id].isOffline) return false;
    const pkt = id === 1 ? latestPole1 : id === 2 ? latestPole2 : latestPole3;
    return pkt && pkt.voltage !== null && pkt.voltage !== undefined && pkt.voltage > 5.0;
  });

  const isVoltageEmergency = voltageHazardPoles.length > 0;

  // 2. Flood Hazard: Water Depth > 100cm (on active poles)
  const floodHazardPoles = ([1, 2, 3] as const).filter((id) => {
    if (poleStateMap[id].isOffline) return false;
    const pkt = id === 1 ? latestPole1 : id === 2 ? latestPole2 : latestPole3;
    return pkt && pkt.water_depth !== null && pkt.water_depth !== undefined && pkt.water_depth > 100.0;
  });

  // 3. High Temperature Hazards (on active poles):
  // Fire Outbreak / Extreme Thermal Hazard (>= 60°C)
  const fireHazardPoles = ([1, 2, 3] as const).filter((id) => {
    if (poleStateMap[id].isOffline) return false;
    const pkt = id === 1 ? latestPole1 : id === 2 ? latestPole2 : latestPole3;
    return pkt && pkt.temperature !== null && pkt.temperature !== undefined && pkt.temperature >= 60.0;
  });
  const isFireEmergency = fireHazardPoles.length > 0;

  // Standard Thermal Warning (> temp threshold, default 45°C)
  const tempHazardPoles = ([1, 2, 3] as const).filter((id) => {
    if (poleStateMap[id].isOffline) return false;
    const pkt = id === 1 ? latestPole1 : id === 2 ? latestPole2 : latestPole3;
    return pkt && pkt.temperature !== null && pkt.temperature !== undefined && pkt.temperature > gasThresholds.temp;
  });

  // 4. High Humidity Hazard: Humidity > humidity threshold (default 85%)
  const humidityHazardPoles = ([1, 2, 3] as const).filter((id) => {
    if (poleStateMap[id].isOffline) return false;
    const pkt = id === 1 ? latestPole1 : id === 2 ? latestPole2 : latestPole3;
    return pkt && pkt.humidity !== null && pkt.humidity !== undefined && pkt.humidity > gasThresholds.humidity;
  });

  // 5. Toxic Gas Hazards with distinct thresholds for each gas (on active poles)
  // MQ-7: Carbon Monoxide (> 50 ppm default)
  const mq7HazardPoles = ([1, 2, 3] as const).filter((id) => {
    if (poleStateMap[id].isOffline) return false;
    const pkt = id === 1 ? latestPole1 : id === 2 ? latestPole2 : latestPole3;
    return pkt && pkt.mq7 !== null && pkt.mq7 !== undefined && pkt.mq7 > gasThresholds.mq7;
  });

  // MQ-135: Air Quality / Pollutants (> 150 ppm default)
  const mq135HazardPoles = ([1, 2, 3] as const).filter((id) => {
    if (poleStateMap[id].isOffline) return false;
    const pkt = id === 1 ? latestPole1 : id === 2 ? latestPole2 : latestPole3;
    return pkt && pkt.mq135 !== null && pkt.mq135 !== undefined && pkt.mq135 > gasThresholds.mq135;
  });

  // MQ-136: Sewage Gas / H2S (> 15 ppm default)
  const mq136HazardPoles = ([1, 2, 3] as const).filter((id) => {
    if (poleStateMap[id].isOffline) return false;
    const pkt = id === 1 ? latestPole1 : id === 2 ? latestPole2 : latestPole3;
    return pkt && pkt.mq136 !== null && pkt.mq136 !== undefined && pkt.mq136 > gasThresholds.mq136;
  });

  return {
    poleStateMap,
    downPoles,
    offlinePoles,
    voltageHazardPoles,
    isVoltageEmergency,
    floodHazardPoles,
    tempHazardPoles,
    fireHazardPoles,
    isFireEmergency,
    humidityHazardPoles,
    mq7HazardPoles,
    mq135HazardPoles,
    mq136HazardPoles
  };
}
