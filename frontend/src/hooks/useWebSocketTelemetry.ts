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
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [packetRate, setPacketRate] = useState<number>(0);

  const packetCountRef = useRef<number>(0);
  const historyRef = useRef<TelemetryPacket[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const onWsMessageRef = useRef(onWsMessage);
  onWsMessageRef.current = onWsMessage;

  const scanPorts = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ports');
      const json = await res.json();
      setPorts(json.ports || []);
      setSerialConnected(Boolean(json.is_connected));
      if (json.current_port) {
        setSelectedPort(json.current_port);
      } else if (json.ports?.length > 0 && !selectedPort) {
        setSelectedPort(json.ports[0].device);
      }

      const mqttRes = await fetch('http://127.0.0.1:8000/api/mqtt');
      const mqttJson = await mqttRes.json();
      setMqttConnected(Boolean(mqttJson.connected));
    } catch (err) {
      console.warn('Backend unreachable during status poll', err);
    }
  }, [selectedPort]);

  const hydrateRecent = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/telemetry/recent?limit=100');
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        historyRef.current = json.data;
        setTelemetryHistory(json.data);

        const now = Date.now() / 1000;
        json.data.forEach((pkt: TelemetryPacket) => {
          if (now - (pkt.timestamp || 0) < 30) {
            if (pkt.pole_id === 1) setLatestPole1(pkt);
            else if (pkt.pole_id === 2) setLatestPole2(pkt);
            else if (pkt.pole_id === 3) setLatestPole3(pkt);
          }
        });
        const lastPkt = json.data[json.data.length - 1];
        if (now - (lastPkt.timestamp || 0) < 30) {
          setLatestAny(lastPkt);
        }
      }
    } catch (err) {
      console.warn('Could not fetch recent telemetry', err);
    }
  }, []);

  const handleConfigUpdate = useCallback(async (portName: string) => {
    try {
      await fetch('http://127.0.0.1:8000/api/ports/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: portName, baudrate: 115200 })
      });
      setSelectedPort(portName);
      scanPorts();
    } catch (err) {
      console.error('Port configuration failed', err);
    }
  }, [scanPorts]);

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
      console.error('Telemetry reset failed', err);
    }
  }, []);

  useEffect(() => {
    scanPorts();
    hydrateRecent();

    const rateInterval = setInterval(() => {
      setPacketRate(packetCountRef.current);
      packetCountRef.current = 0;
    }, 1000);

    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (onWsMessageRef.current) onWsMessageRef.current(packet);

          if (packet.type === 'CONNECTION_ESTABLISHED') {
            setSerialConnected(Boolean(packet.serial_connected));
            setMqttConnected(Boolean(packet.mqtt_connected));
            return;
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

            historyRef.current = [...historyRef.current, packet].slice(-90);
            window.requestAnimationFrame(() => {
              setTelemetryHistory(historyRef.current);
            });
          }
        } catch {
          // Ignore control frames
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => ws.close();
    };

    connectWebSocket();

    return () => {
      clearInterval(rateInterval);
      clearTimeout(reconnectTimer);
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
    setLatestAny
  };
}
