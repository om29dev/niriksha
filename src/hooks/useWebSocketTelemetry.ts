import { useState, useEffect, useRef, useCallback } from 'react';
import type { TelemetryPacket, PortInfo } from '../types/telemetry';

export function useWebSocketTelemetry(onWsMessage?: (data: any) => void) {
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPacket[]>([]);
  const [latestPole1, setLatestPole1] = useState<TelemetryPacket | null>(null);
  const [latestPole2, setLatestPole2] = useState<TelemetryPacket | null>(null);
  const [latestPole3, setLatestPole3] = useState<TelemetryPacket | null>(null);
  const [latestAny, setLatestAny] = useState<TelemetryPacket | null>(null);

  const [ports, setPorts] = useState<PortInfo[]>([
    { device: 'Virtual LoRa Mesh (COM-SIM)', description: 'Simulated 433MHz Gateway Node 3', hwid: 'USB-SIM-GATEWAY-01' },
    { device: 'LoRa Node 1 (Virtual)', description: 'Sensor Node 1 Sub-GHz', hwid: 'USB-SIM-NODE-01' },
    { device: 'LoRa Node 2 (Virtual)', description: 'Sensor Node 2 Sub-GHz', hwid: 'USB-SIM-NODE-02' }
  ]);
  const [selectedPort, setSelectedPort] = useState<string>('Virtual LoRa Mesh (COM-SIM)');
  const [serialConnected, setSerialConnected] = useState<boolean>(true);
  const [mqttConnected, setMqttConnected] = useState<boolean>(true);
  const [wsConnected, setWsConnected] = useState<boolean>(true);
  const [packetRate, setPacketRate] = useState<number>(0);

  const packetCountRef = useRef<number>(0);
  const onWsMessageRef = useRef(onWsMessage);
  onWsMessageRef.current = onWsMessage;

  // Custom setter for latestAny that also updates packet rate counter
  const handleSetLatestAny = useCallback((packet: TelemetryPacket | null) => {
    if (packet) {
      packetCountRef.current += 1;
    }
    setLatestAny(packet);
  }, []);

  const scanPorts = useCallback(async () => {
    setPorts([
      { device: 'Virtual LoRa Mesh (COM-SIM)', description: 'Simulated 433MHz Gateway Node 3', hwid: 'USB-SIM-GATEWAY-01' },
      { device: 'LoRa Node 1 (Virtual)', description: 'Sensor Node 1 Sub-GHz', hwid: 'USB-SIM-NODE-01' },
      { device: 'LoRa Node 2 (Virtual)', description: 'Sensor Node 2 Sub-GHz', hwid: 'USB-SIM-NODE-02' }
    ]);
    setSerialConnected(true);
    setMqttConnected(true);
    setWsConnected(true);
  }, []);

  const handleConfigUpdate = useCallback(async (portName: string) => {
    setSelectedPort(portName);
  }, []);

  const handleResetData = useCallback(async () => {
    setTelemetryHistory([]);
    setLatestPole1(null);
    setLatestPole2(null);
    setLatestPole3(null);
    setLatestAny(null);
    if (onWsMessageRef.current) {
      onWsMessageRef.current({ type: 'TELEMETRY_RESET' });
    }
  }, []);

  useEffect(() => {
    const rateInterval = setInterval(() => {
      setPacketRate(packetCountRef.current);
      packetCountRef.current = 0;
    }, 1000);

    return () => {
      clearInterval(rateInterval);
    };
  }, []);

  return {
    telemetryHistory,
    latestPole1,
    latestPole2,
    latestPole3,
    latestAny,
    ports,
    selectedPort,
    serialConnected,
    mqttConnected,
    wsConnected,
    packetRate,
    scanPorts,
    handleConfigUpdate,
    handleResetData,
    setTelemetryHistory,
    setLatestPole1,
    setLatestPole2,
    setLatestPole3,
    setLatestAny: handleSetLatestAny
  };
}
