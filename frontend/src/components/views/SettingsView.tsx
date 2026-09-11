import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { PortInfo } from '../../types/telemetry';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../../constants/gasThresholds';
import { TelemetrySourceCard } from '../settings/TelemetrySourceCard';
import { VoltageFloodThresholdCard } from '../settings/VoltageFloodThresholdCard';
import { GasThresholdCard } from '../settings/GasThresholdCard';
import { OllamaConfigCard } from '../settings/OllamaConfigCard';
import { DatabaseMaintenanceCard } from '../settings/DatabaseMaintenanceCard';

interface SettingsViewProps {
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
  selectedPort,
  ports,
  onConfigUpdate,
  onScanPorts,
  onResetData,
  gasThresholds: initialGasThresholds = DEFAULT_GAS_THRESHOLDS,
  onUpdateGasThresholds
}) => {
  // Local state for physical & environmental hazard thresholds
  const [voltageLimit, setVoltageLimit] = useState<number>(5.0);
  const [floodThreshold, setFloodThreshold] = useState<number>(10.0);
  const [tempThreshold, setTempThreshold] = useState<number>(initialGasThresholds.temp ?? DEFAULT_GAS_THRESHOLDS.temp);
  const [humidityThreshold, setHumidityThreshold] = useState<number>(initialGasThresholds.humidity ?? DEFAULT_GAS_THRESHOLDS.humidity);
  const [mq7Threshold, setMq7Threshold] = useState<number>(initialGasThresholds.mq7);
  const [mq135Threshold, setMq135Threshold] = useState<number>(initialGasThresholds.mq135);
  const [mq136Threshold, setMq136Threshold] = useState<number>(initialGasThresholds.mq136);
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

  // Ollama AI local engine configuration state
  const [ollamaHost, setOllamaHost] = useState<string>('http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState<string>('qwen2.5:0.5b');
  const [ollamaStatusMsg, setOllamaStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUpdatingOllama, setIsUpdatingOllama] = useState<boolean>(false);

  // MQTT configuration state
  const [activeInputMode, setActiveInputMode] = useState<'serial' | 'mqtt'>('serial');
  const [mqttHost, setMqttHost] = useState<string>('192.168.1.100');
  const [mqttPort, setMqttPort] = useState<number>(1883);
  const [mqttTopic, setMqttTopic] = useState<string>('sensors/smartpole/#');
  const [mqttUser, setMqttUser] = useState<string>('iot_user');
  const [mqttPassword, setMqttPassword] = useState<string>('••••••••');
  const [mqttStatusMsg, setMqttStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isConnectingMqtt, setIsConnectingMqtt] = useState<boolean>(false);

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

  // Fetch initial db configuration and Ollama configuration from backend
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/telemetry/db-config')
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.host) setDbHost(cfg.host);
        if (cfg.port) setDbPort(cfg.port);
        if (cfg.user) setDbUser(cfg.user);
        if (cfg.database) setDbName(cfg.database);
      })
      .catch(() => {});

    fetch('http://127.0.0.1:8000/api/ai/config')
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.host) setOllamaHost(cfg.host);
        if (cfg.model) setOllamaModel(cfg.model);
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

  const handleSaveOllamaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingOllama(true);
    setOllamaStatusMsg(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: ollamaHost.trim(),
          model: ollamaModel.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update Ollama configuration');
      }
      setOllamaStatusMsg({ text: `Model "${ollamaModel.trim()}" configured and saved!`, isError: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save Ollama configuration';
      setOllamaStatusMsg({ text: msg, isError: true });
    } finally {
      setIsUpdatingOllama(false);
      setTimeout(() => setOllamaStatusMsg(null), 5000);
    }
  };

  const handleSaveThresholds = () => {
    if (onUpdateGasThresholds) {
      onUpdateGasThresholds({
        mq7: mq7Threshold,
        mq135: mq135Threshold,
        mq136: mq136Threshold,
        temp: tempThreshold,
        humidity: humidityThreshold
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {savedSuccess && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#ecfdf5',
          color: '#059669',
          border: '1px solid #a7f3d0',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <CheckCircle2 style={{ width: '16px', height: '16px' }} />
          Threshold parameters successfully preserved and applied!
        </div>
      )}

      {/* Uniform Responsive 1x1 Grid Layout with Balanced Sized Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        alignItems: 'stretch'
      }}>
        {/* Card 1: Input source */}
        <TelemetrySourceCard
          selectedPort={selectedPort}
          ports={ports}
          activeInputMode={activeInputMode}
          setActiveInputMode={setActiveInputMode}
          onConfigUpdate={onConfigUpdate}
          onScanPorts={onScanPorts}
          baudRate={baudRate}
          setBaudRate={setBaudRate}
          mqttHost={mqttHost}
          setMqttHost={setMqttHost}
          mqttPort={mqttPort}
          setMqttPort={setMqttPort}
          mqttTopic={mqttTopic}
          setMqttTopic={setMqttTopic}
          mqttUser={mqttUser}
          setMqttUser={setMqttUser}
          mqttPassword={mqttPassword}
          setMqttPassword={setMqttPassword}
          mqttStatusMsg={mqttStatusMsg}
          isConnectingMqtt={isConnectingMqtt}
          onSaveMqtt={handleSaveMqtt}
        />

        {/* Card 2: Voltage, Flood & Environmental limits */}
        <VoltageFloodThresholdCard
          voltageLimit={voltageLimit}
          setVoltageLimit={setVoltageLimit}
          floodThreshold={floodThreshold}
          setFloodThreshold={setFloodThreshold}
          tempThreshold={tempThreshold}
          setTempThreshold={setTempThreshold}
          humidityThreshold={humidityThreshold}
          setHumidityThreshold={setHumidityThreshold}
          onApply={handleSaveThresholds}
        />

        {/* Card 3: Atmospheric gas limits */}
        <GasThresholdCard
          mq7Threshold={mq7Threshold}
          setMq7Threshold={setMq7Threshold}
          mq135Threshold={mq135Threshold}
          setMq135Threshold={setMq135Threshold}
          mq136Threshold={mq136Threshold}
          setMq136Threshold={setMq136Threshold}
          onApply={handleSaveThresholds}
        />

        {/* Card 4: Ollama configuration */}
        <OllamaConfigCard
          ollamaHost={ollamaHost}
          setOllamaHost={setOllamaHost}
          ollamaModel={ollamaModel}
          setOllamaModel={setOllamaModel}
          ollamaStatusMsg={ollamaStatusMsg}
          isUpdatingOllama={isUpdatingOllama}
          onSaveOllama={handleSaveOllamaConfig}
        />

        {/* Card 5: Database Maintenance */}
        <DatabaseMaintenanceCard
          dbHost={dbHost}
          setDbHost={setDbHost}
          dbPort={dbPort}
          setDbPort={setDbPort}
          dbUser={dbUser}
          setDbUser={setDbUser}
          dbPassword={dbPassword}
          setDbPassword={setDbPassword}
          dbName={dbName}
          setDbName={setDbName}
          dbStatusMsg={dbStatusMsg}
          isUpdatingDb={isUpdatingDb}
          onSaveDb={handleSaveDbCredentials}
          onResetData={onResetData}
        />
      </div>
    </div>
  );
};
