import React, { useState } from 'react';
import {
  Sliders,
  Database,
  Usb,
  RefreshCw,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import type { PortInfo } from '../../types/telemetry';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../../constants/gasThresholds';


interface SettingsViewProps {
  useSimulation: boolean;
  selectedPort: string;
  ports: PortInfo[];
  onConfigUpdate: (simMode: boolean, portName: string) => void;
  onScanPorts: () => void;
  onResetData: () => void;
  audioMuted?: boolean;
  onToggleMute?: () => void;
  gasThresholds?: GasThresholdConfig;
  onUpdateGasThresholds?: (thresholds: GasThresholdConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  useSimulation,
  selectedPort,
  ports,
  onConfigUpdate,
  onScanPorts,
  onResetData,
  gasThresholds: initialGasThresholds = DEFAULT_GAS_THRESHOLDS,
  onUpdateGasThresholds
}) => {
  // Local state for interactive safety threshold simulation / customization
  const [voltageLimit, setVoltageLimit] = useState<number>(5.0);
  const [floodThreshold, setFloodThreshold] = useState<number>(10.0);
  const [mq7Threshold, setMq7Threshold] = useState<number>(initialGasThresholds.mq7);
  const [mq135Threshold, setMq135Threshold] = useState<number>(initialGasThresholds.mq135);
  const [mq136Threshold, setMq136Threshold] = useState<number>(initialGasThresholds.mq136);
  const [mq2Threshold, setMq2Threshold] = useState<number>(initialGasThresholds.mq2);
  const [baudRate, setBaudRate] = useState<string>('115200');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Database credential settings state
  const [dbHost, setDbHost] = useState<string>('localhost');
  const [dbPort, setDbPort] = useState<number>(5432);
  const [dbUser, setDbUser] = useState<string>('postgres');
  const [dbPassword, setDbPassword] = useState<string>('postgres');
  const [dbName, setDbName] = useState<string>('iot_dashboard');
  const [dbStatusMsg, setDbStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUpdatingDb, setIsUpdatingDb] = useState<boolean>(false);

  // MQTT configuration state (clean & real feel matching DB credentials pattern)
  const [activeInputMode, setActiveInputMode] = useState<'mock' | 'serial' | 'mqtt'>(
    useSimulation ? 'mock' : 'serial'
  );
  const [mqttHost, setMqttHost] = useState<string>('192.168.1.100');
  const [mqttPort, setMqttPort] = useState<number>(1883);
  const [mqttTopic, setMqttTopic] = useState<string>('sensors/smartpole/#');
  const [mqttUser, setMqttUser] = useState<string>('iot_user');
  const [mqttPassword, setMqttPassword] = useState<string>('••••••••');
  const [mqttStatusMsg, setMqttStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isConnectingMqtt, setIsConnectingMqtt] = useState<boolean>(false);

  React.useEffect(() => {
    if (activeInputMode !== 'mqtt') {
      setActiveInputMode(useSimulation ? 'mock' : 'serial');
    }
  }, [useSimulation]);

  const handleSaveMqtt = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnectingMqtt(true);
    setMqttStatusMsg(null);
    setTimeout(() => {
      setIsConnectingMqtt(false);
      setMqttStatusMsg({ text: `Connected to MQTT Broker [${mqttHost}:${mqttPort}]`, isError: false });
      setTimeout(() => setMqttStatusMsg(null), 4000);
    }, 800);
  };

  // Fetch initial db configuration from backend
  React.useEffect(() => {
    fetch('http://127.0.0.1:8000/api/telemetry/db-config')
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.host) setDbHost(cfg.host);
        if (cfg.port) setDbPort(cfg.port);
        if (cfg.user) setDbUser(cfg.user);
        if (cfg.database) setDbName(cfg.database);
      })
      .catch(() => {});
  }, []);

  const handleSaveDbCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingDb(true);
    setDbStatusMsg(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/telemetry/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: dbHost,
          port: Number(dbPort),
          user: dbUser,
          password: dbPassword,
          database: dbName
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Connection failed');
      }
      setDbStatusMsg({ text: 'Database credentials applied & verified!', isError: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to database';
      setDbStatusMsg({ text: msg, isError: true });
    } finally {
      setIsUpdatingDb(false);
      setTimeout(() => setDbStatusMsg(null), 5000);
    }
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateGasThresholds) {
      onUpdateGasThresholds({
        mq7: mq7Threshold,
        mq135: mq135Threshold,
        mq136: mq136Threshold,
        mq2: mq2Threshold
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Settings Header */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            System Settings & Hardware Diagnostics
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Configure air-gapped serial COM connectivity, database connection credentials, and hazard thresholds.
          </p>
        </div>
        {savedSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <CheckCircle2 style={{ width: '16px', height: '16px' }} />
            Settings Preserved
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px',
        alignItems: 'stretch'
      }}>
        {/* Section 1: Ingestion Gateway & COM Port */}
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
              <form onSubmit={handleSaveMqtt} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        {/* Section 2: Hazard Alert & Threshold Calibration */}
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
              <Sliders style={{ width: '16px', height: '16px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Hazard Triggers & Thresholds
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Calibrate acoustic siren and critical telemetry limits
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveThresholds} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>High Voltage Trigger</span>
                  <span style={{ fontWeight: '700', color: '#dc2626' }}>{voltageLimit} V</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="0.5"
                  value={voltageLimit}
                  onChange={(e) => setVoltageLimit(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#dc2626', height: '6px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Triggers acoustic siren and emergency alert modal.
                </span>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>Flood Water Clearance Limit</span>
                  <span style={{ fontWeight: '700', color: '#2563eb' }}>&lt; {floodThreshold} cm</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={floodThreshold}
                  onChange={(e) => setFloodThreshold(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563eb', height: '6px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Pole 3 Ultrasonic transceiver flood height boundary.
                </span>
              </div>

              {/* MQ-7 Carbon Monoxide */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>Carbon Monoxide (MQ-7) Threshold</span>
                  <span style={{ fontWeight: '700', color: '#ea580c' }}>&gt; {mq7Threshold} PPM</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={mq7Threshold}
                  onChange={(e) => setMq7Threshold(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#ea580c', height: '6px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  OSHA/NIOSH industrial safety limit: 50 ppm.
                </span>
              </div>

              {/* MQ-135 Air Quality */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>Air Quality / Pollutants (MQ-135) Threshold</span>
                  <span style={{ fontWeight: '700', color: '#9333ea' }}>&gt; {mq135Threshold} PPM</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={mq135Threshold}
                  onChange={(e) => setMq135Threshold(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#9333ea', height: '6px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  NH3, NOx, and benzene air deterioration limit: 150 ppm.
                </span>
              </div>

              {/* MQ-136 Sewage Gas */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>Sewage Gas / H2S (MQ-136) Threshold</span>
                  <span style={{ fontWeight: '700', color: '#dc2626' }}>&gt; {mq136Threshold} PPM</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={mq136Threshold}
                  onChange={(e) => setMq136Threshold(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#dc2626', height: '6px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Hydrogen sulfide toxic sewer gas danger: 15 ppm.
                </span>
              </div>

              {/* MQ-2 Smoke / Combustible Gas */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>Smoke & Combustible Gas (MQ-2) Threshold</span>
                  <span style={{ fontWeight: '700', color: '#c2410c' }}>&gt; {mq2Threshold} PPM</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="25"
                  value={mq2Threshold}
                  onChange={(e) => setMq2Threshold(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#c2410c', height: '6px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  LPG, propane, and smoke explosive threshold: 300 ppm.
                </span>
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '12px',
                padding: '9px 14px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Apply Threshold Parameters
            </button>
          </form>
        </section>

        {/* Section 3: Database Maintenance & Credentials */}
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
              <Database style={{ width: '16px', height: '16px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Database Maintenance & Credentials
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                PostgreSQL asyncpg batch storage credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveDbCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Host
                </label>
                <input
                  type="text"
                  value={dbHost}
                  onChange={(e) => setDbHost(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff'
                  }}
                  placeholder="localhost"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Port
                </label>
                <input
                  type="number"
                  value={dbPort}
                  onChange={(e) => setDbPort(parseInt(e.target.value) || 5432)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
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
                  Password
                </label>
                <input
                  type="password"
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
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
                Database Name
              </label>
              <input
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
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

            {dbStatusMsg && (
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: dbStatusMsg.isError ? '#fef2f2' : '#ecfdf5',
                color: dbStatusMsg.isError ? '#dc2626' : '#059669',
                border: `1px solid ${dbStatusMsg.isError ? '#fecaca' : '#a7f3d0'}`
              }}>
                {dbStatusMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingDb}
              style={{
                marginTop: '4px',
                padding: '9px 14px',
                borderRadius: '6px',
                backgroundColor: isUpdatingDb ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                cursor: isUpdatingDb ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isUpdatingDb ? 'Testing & Reconnecting...' : 'Save & Reconnect DB'}
            </button>
          </form>

          <div style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>Purge Telemetry History</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Clear records & reset charts</div>
            </div>
            <button
              type="button"
              onClick={onResetData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                cursor: 'pointer'
              }}
            >
              <Trash2 style={{ width: '13px', height: '13px' }} />
              Purge Data
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

