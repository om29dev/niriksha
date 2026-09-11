import { useState, useEffect, useRef, useCallback } from 'react';
import type { TelemetryPacket, PortInfo } from '../types/telemetry';

export function useWebSocketTelemetry(onWsMessage?: (data: any) => void) {
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPacket[]>([]);
  const [latestPole1, setLatestPole1] = useState<TelemetryPacket | null>(null);
  const [latestPole2, setLatestPole2] = useState<TelemetryPacket | null>(null);
  const [latestPole3, setLatestPole3] = useState<TelemetryPacket | null>(null);
  const [latestAny, setLatestAny] = useState<TelemetryPacket | null>(null);

  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [useSimulation, setUseSimulation] = useState<boolean>(true);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [packetRate, setPacketRate] = useState<number>(0);

  const packetCountRef = useRef<number>(0);
  const historyRef = useRef<TelemetryPacket[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const onWsMessageRef = useRef(onWsMessage);
  onWsMessageRef.current = onWsMessage;

  // Scan physical ports from backend
  const scanPorts = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ports');
      const json = await res.json();
      setPorts(json.ports || []);
      setUseSimulation(json.is_simulation);
      if (json.current_port) {
        setSelectedPort(json.current_port);
      } else if (json.ports && json.ports.length > 0 && !selectedPort) {
        setSelectedPort(json.ports[0].device);
      }
    } catch (err) {
      console.warn('Backend currently unreachable', err);
    }
  }, [selectedPort]);

  // Hydrate recent entries from database on mount
  const hydrateRecent = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/telemetry/recent?limit=100');
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        historyRef.current = json.data;
        setTelemetryHistory(json.data);

        json.data.forEach((pkt: TelemetryPacket) => {
          if (pkt.pole_id === 1) setLatestPole1(pkt);
          else if (pkt.pole_id === 2) setLatestPole2(pkt);
          else if (pkt.pole_id === 3) setLatestPole3(pkt);
        });
        setLatestAny(json.data[json.data.length - 1]);
      }
    } catch (err) {
      console.warn('Could not fetch historical telemetry', err);
    }
  }, []);

  // Configure Port or toggle simulation mode
  const handleConfigUpdate = useCallback(async (simMode: boolean, portName: string) => {
    try {
      await fetch('http://127.0.0.1:8000/api/ports/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port: portName,
          baudrate: 115200,
          use_simulation: simMode
        })
      });
      setUseSimulation(simMode);
      setSelectedPort(portName);
      scanPorts();
    } catch (err) {
      console.error('Config update failed', err);
    }
  }, [scanPorts]);

  // Reset all data
  const handleResetData = useCallback(async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/telemetry/reset', { method: 'POST' });
      historyRef.current = [];
      setTelemetryHistory([]);
      setLatestPole1(null);
      setLatestPole2(null);
      setLatestPole3(null);
      setLatestAny(null);
    } catch (err) {
      console.error('Reset failed', err);
    }
  }, []);

  // WebSocket connection & frame throttling
  useEffect(() => {
    scanPorts();
    hydrateRecent();

    const hzInterval = setInterval(() => {
      setPacketRate(packetCountRef.current);
      packetCountRef.current = 0;
    }, 1000);

    let reconnectTimer: any = null;

    const connectWebSocket = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log('[WS] Connected to telemetry stream');
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (onWsMessageRef.current) {
            onWsMessageRef.current(packet);
          }
          if (packet.type === 'TELEMETRY_RESET') {
            historyRef.current = [];
            setTelemetryHistory([]);
            setLatestPole1(null);
            setLatestPole2(null);
            setLatestPole3(null);
            setLatestAny(null);
            return;
          }
          if (packet.seq !== undefined) {
            packetCountRef.current += 1;
            setLatestAny(packet);

            if (packet.pole_id === 1) setLatestPole1(packet);
            else if (packet.pole_id === 2) setLatestPole2(packet);
            else if (packet.pole_id === 3) setLatestPole3(packet);

            // High performance sliding window (max 90 items, 30 per pole)
            historyRef.current = [...historyRef.current, packet].slice(-90);

            window.requestAnimationFrame(() => {
              setTelemetryHistory(historyRef.current);
            });
          }
        } catch {
          // Ignore non-telemetry control frames
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      clearInterval(hzInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [scanPorts, hydrateRecent]);

  return {
    telemetryHistory,
    latestPole1,
    latestPole2,
    latestPole3,
    latestAny,
    ports,
    selectedPort,
    useSimulation,
    wsConnected,
    packetRate,
    scanPorts,
    handleConfigUpdate,
    handleResetData,
    setTelemetryHistory,
    setLatestPole1,
    setLatestPole2,
    setLatestPole3,
    setLatestAny
  };
}
