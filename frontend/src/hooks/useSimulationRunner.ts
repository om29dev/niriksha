import { useState, useEffect, useRef, useCallback } from 'react';
import type { TelemetryPacket } from '../types/telemetry';
import { createSimulatedPacket, type ScenarioType } from '../utils/simulationScenarios';

interface UseSimulationRunnerProps {
  onPacketEmitted: (packet: TelemetryPacket) => void;
  onAlertEmitted?: (packet: TelemetryPacket) => void;
}

export function useSimulationRunner({
  onPacketEmitted,
  onAlertEmitted
}: UseSimulationRunnerProps) {
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [scenario, setScenario] = useState<ScenarioType>('NORMAL');

  const seqRef = useRef<number>(2000);
  const poleCycleRef = useRef<number>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPacketRef = useRef(onPacketEmitted);
  onPacketRef.current = onPacketEmitted;
  const onAlertRef = useRef(onAlertEmitted);
  onAlertRef.current = onAlertEmitted;

  const stopSimulation = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  const startSimulation = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsSimulating(true);

    timerRef.current = setInterval(() => {
      seqRef.current += 1;
      const currentPole = poleCycleRef.current;
      const packet = createSimulatedPacket(currentPole, seqRef.current, scenario);

      onPacketRef.current(packet);

      if (packet.alert_message && onAlertRef.current) {
        onAlertRef.current(packet);
      }

      poleCycleRef.current = currentPole >= 3 ? 1 : currentPole + 1;
    }, 700);
  }, [scenario]);

  const toggleSimulation = useCallback(() => {
    if (isSimulating) {
      stopSimulation();
    } else {
      startSimulation();
    }
  }, [isSimulating, startSimulation, stopSimulation]);

  const selectScenario = useCallback(
    (newScenario: ScenarioType) => {
      setScenario(newScenario);
      if (isSimulating) {
        // Immediately fire a cycle with the new scenario
        for (let p = 1; p <= 3; p++) {
          seqRef.current += 1;
          const pkt = createSimulatedPacket(p, seqRef.current, newScenario);
          onPacketRef.current(pkt);
          if (pkt.alert_message && onAlertRef.current) {
            onAlertRef.current(pkt);
          }
        }
      }
    },
    [isSimulating]
  );

  useEffect(() => {
    if (isSimulating) {
      startSimulation();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scenario, isSimulating, startSimulation]);

  return {
    isSimulating,
    scenario,
    toggleSimulation,
    selectScenario,
    startSimulation,
    stopSimulation
  };
}
