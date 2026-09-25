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
  // By default, simulation is PAUSED. It starts only if the user clicks "Play Simulation"
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [scenario, setScenario] = useState<ScenarioType>('NORMAL');

  const seqRef = useRef<number>(2000);
  const poleCycleRef = useRef<number>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPacketRef = useRef(onPacketEmitted);
  onPacketRef.current = onPacketEmitted;
  const onAlertRef = useRef(onAlertEmitted);
  onAlertRef.current = onAlertEmitted;
  const initialPrimedRef = useRef<boolean>(false);

  // Prime mesh nodes with fresh baseline readings for a given scenario
  const primeNodes = useCallback((scen: ScenarioType) => {
    for (let p = 1; p <= 3; p++) {
      seqRef.current += 1;
      const pkt = createSimulatedPacket(p, seqRef.current, scen);
      onPacketRef.current(pkt);
      if (pkt.alert_message && onAlertRef.current) {
        onAlertRef.current(pkt);
      }
    }
  }, []);

  // Prime baseline once on mount so all dashboard widgets display valid data while paused
  useEffect(() => {
    if (!initialPrimedRef.current) {
      initialPrimedRef.current = true;
      primeNodes('NORMAL');
    }
  }, [primeNodes]);

  // Interval timer runs only when isSimulating is true
  useEffect(() => {
    if (!isSimulating) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

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

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSimulating, scenario]);

  const startSimulation = useCallback(() => {
    setIsSimulating(true);
  }, []);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  const selectScenario = useCallback(
    (newScenario: ScenarioType) => {
      setScenario(newScenario);
      primeNodes(newScenario);
    },
    [primeNodes]
  );

  return {
    isSimulating,
    scenario,
    toggleSimulation,
    selectScenario,
    startSimulation,
    stopSimulation
  };
}
