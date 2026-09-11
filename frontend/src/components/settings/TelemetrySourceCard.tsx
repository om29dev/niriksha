import React from 'react';
import { Usb, RefreshCw } from 'lucide-react';
import type { PortInfo } from '../../types/telemetry';

export interface TelemetrySourceCardProps {
  useSimulation: boolean;
  selectedPort: string;
  ports: PortInfo[];
  activeInputMode: 'mock' | 'serial' | 'mqtt';
  setActiveInputMode: (mode: 'mock' | 'serial' | 'mqtt') => void;
  onConfigUpdate: (simMode: boolean, portName: string) => void;
  onScanPorts: () => void;
  baudRate: string;
  setBaudRate: (rate: string) => void;
  mqttHost: string;
  setMqttHost: (h: string) => void;
  mqttPort: number;
  setMqttPort: (p: number) => void;
  mqttTopic: string;
  setMqttTopic: (t: string) => void;
  mqttUser: string;
  setMqttUser: (u: string) => void;
  mqttPassword: string;
  setMqttPassword: (p: string) => void;
  mqttStatusMsg: { text: string; isError: boolean } | null;
  isConnectingMqtt: boolean;
  onSaveMqtt: (e: React.FormEvent) => void;
}

export const TelemetrySourceCard: React.FC<TelemetrySourceCardProps> = ({
  useSimulation,
  selectedPort,
  ports,
  activeInputMode,
  setActiveInputMode,
  onConfigUpdate,
  onScanPorts,
  baudRate,
  setBaudRate,
  mqttHost,
  setMqttHost,
  mqttPort,
  setMqttPort,
  mqttTopic,
  setMqttTopic,
  mqttUser,
  setMqttUser,
  mqttPassword,
  setMqttPassword,
  mqttStatusMsg,
  isConnectingMqtt,
  onSaveMqtt
}) => {
  return (
    <section style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
          <Usb style={{ width: '16px', height: '16px' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Telemetry Input Source
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Hardware UART serial or mock synthetic telemetry
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px' }}>
            Operational Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveInputMode('mock');
                onConfigUpdate(true, '');
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: activeInputMode === 'mock' ? '#2563eb' : '#ffffff',
                color: activeInputMode === 'mock' ? '#ffffff' : '#475569',
                borderColor: activeInputMode === 'mock' ? '#2563eb' : '#cbd5e1',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              Mock Stream
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveInputMode('serial');
                const targetPort = selectedPort || (ports.length > 0 ? ports[0].device : '');
                onConfigUpdate(false, targetPort);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: activeInputMode === 'serial' ? '#2563eb' : '#ffffff',
                color: activeInputMode === 'serial' ? '#ffffff' : '#475569',
                borderColor: activeInputMode === 'serial' ? '#2563eb' : '#cbd5e1',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              Gateway Serial
            </button>
            <button
              type="button"
              onClick={() => setActiveInputMode('mqtt')}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: activeInputMode === 'mqtt' ? '#0f766e' : '#ffffff',
                color: activeInputMode === 'mqtt' ? '#ffffff' : '#475569',
                borderColor: activeInputMode === 'mqtt' ? '#0f766e' : '#cbd5e1',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              MQTT
            </button>
          </div>
        </div>

        {activeInputMode === 'mqtt' ? (
          <form onSubmit={onSaveMqtt} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Broker Host / IP
                </label>
                <input
                  type="text"
                  value={mqttHost}
                  onChange={(e) => setMqttHost(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff'
                  }}
                  placeholder="192.168.1.100"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Port
                </label>
                <input
                  type="number"
                  value={mqttPort}
                  onChange={(e) => setMqttPort(parseInt(e.target.value) || 1883)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Client User
                </label>
                <input
                  type="text"
                  value={mqttUser}
                  onChange={(e) => setMqttUser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Client Password
                </label>
                <input
                  type="password"
                  value={mqttPassword}
                  onChange={(e) => setMqttPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Subscription Topic
              </label>
              <input
                type="text"
                value={mqttTopic}
                onChange={(e) => setMqttTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff'
                }}
                placeholder="sensors/smartpole/#"
                required
              />
            </div>

            {mqttStatusMsg && (
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: mqttStatusMsg.isError ? '#fef2f2' : '#ecfdf5',
                color: mqttStatusMsg.isError ? '#dc2626' : '#059669',
                border: `1px solid ${mqttStatusMsg.isError ? '#fecaca' : '#a7f3d0'}`
              }}>
                {mqttStatusMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isConnectingMqtt}
              style={{
                marginTop: '4px',
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: isConnectingMqtt ? '#94a3b8' : '#0f766e',
                color: '#ffffff',
                border: 'none',
                fontWeight: '600',
                fontSize: '12px',
                cursor: isConnectingMqtt ? 'not-allowed' : 'pointer'
              }}
            >
              {isConnectingMqtt ? 'Connecting...' : 'Connect to MQTT Broker'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                  Serial Device (COM)
                </label>
                <button
                  type="button"
                  onClick={onScanPorts}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw style={{ width: '11px', height: '11px' }} />
                  Rescan Ports
                </button>
              </div>
              <select
                value={selectedPort}
                disabled={useSimulation}
                onChange={(e) => onConfigUpdate(false, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: useSimulation ? '#f8fafc' : '#ffffff',
                  color: useSimulation ? '#94a3b8' : '#0f172a',
                  cursor: useSimulation ? 'not-allowed' : 'pointer'
                }}
              >
                {ports.length === 0 ? (
                  <option value="">No COM Ports Detected</option>
                ) : (
                  ports.map((p) => (
                    <option key={p.device} value={p.device}>
                      {p.device} — {p.description}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Baud Rate
              </label>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                <option value="115200">115200 baud (Firmware Default)</option>
                <option value="9600">9600 baud</option>
                <option value="57600">57600 baud</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
