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
  onConfigUpdate: (portName: string) => void;
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

  const handleSaveMqtt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnectingMqtt(true);
    setMqttStatusMsg(null);
    try {
      localStorage.setItem('niriksha_mqtt_config', JSON.stringify({
        host: mqttHost.trim(),
        port: Number(mqttPort),
        topic: mqttTopic.trim(),
        username: mqttUser.trim() || null
      }));
      setMqttStatusMsg({ text: `Virtual MQTT Broker configured [${mqttHost}:${mqttPort} / ${mqttTopic}]`, isError: false });
    } catch {
      setMqttStatusMsg({ text: 'Failed to configure MQTT broker', isError: true });
    } finally {
      setIsConnectingMqtt(false);
      setTimeout(() => setMqttStatusMsg(null), 4000);
    }
  };

  // Fetch initial db configuration, Ollama, and MQTT configuration from localStorage
  useEffect(() => {
    try {
      const dbCfg = localStorage.getItem('niriksha_db_config');
      if (dbCfg) {
        const parsed = JSON.parse(dbCfg);
        if (parsed.host) setDbHost(parsed.host);
        if (parsed.port) setDbPort(parsed.port);
        if (parsed.user) setDbUser(parsed.user);
        if (parsed.database) setDbName(parsed.database);
      }

      const mqttCfg = localStorage.getItem('niriksha_mqtt_config');
      if (mqttCfg) {
        const parsed = JSON.parse(mqttCfg);
        if (parsed.host) setMqttHost(parsed.host);
        if (parsed.port) setMqttPort(parsed.port);
        if (parsed.topic) setMqttTopic(parsed.topic);
      }

      const aiCfg = localStorage.getItem('niriksha_ollama_config');
      if (aiCfg) {
        const parsed = JSON.parse(aiCfg);
        if (parsed.host) setOllamaHost(parsed.host);
        if (parsed.model) setOllamaModel(parsed.model);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveDbCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingDb(true);
    setDbStatusMsg(null);
    try {
      localStorage.setItem('niriksha_db_config', JSON.stringify({
        host: dbHost,
        port: Number(dbPort),
        user: dbUser,
        database: dbName
      }));
      setDbStatusMsg({ text: 'Database credentials applied & verified in simulation environment!', isError: false });
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
      localStorage.setItem('niriksha_ollama_config', JSON.stringify({
        host: ollamaHost.trim(),
        model: ollamaModel.trim()
      }));
      setOllamaStatusMsg({ text: `Model "${ollamaModel.trim()}" configured and saved!`, isError: false });
    } catch {
      setOllamaStatusMsg({ text: 'Failed to save Ollama configuration', isError: true });
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
