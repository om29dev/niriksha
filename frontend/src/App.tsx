import { useState, useEffect } from 'react';
import type { PoleId, TimeRangeOption, TelemetryPacket } from './types/telemetry';
import { useWebSocketTelemetry } from './hooks/useWebSocketTelemetry';
import { useHazardDetection } from './hooks/useHazardDetection';
import { useEmergencyAudio } from './hooks/useEmergencyAudio';
import { useAlerts } from './hooks/useAlerts';
import { Sidebar, type ActiveView } from './components/Sidebar';
import { Header } from './components/Header';
import { CustomizableDashboard } from './components/dashboard/CustomizableDashboard';
import { VoltageEmergencyModal } from './components/VoltageEmergencyModal';
import { FireEmergencyModal } from './components/FireEmergencyModal';
import { SettingsView } from './components/views/SettingsView';
import { FleetNodesView } from './components/views/FleetNodesView';
import { AlertsHistoryView } from './components/views/AlertsHistoryView';
import { CompareDashboardView } from './components/views/CompareDashboardView';
import { LiveMapView } from './components/views/LiveMapView';
import { ReportsView } from './components/views/ReportsView';
import { HistoryView } from './components/views/HistoryView';
import { AiAssistantView } from './components/views/AiAssistantView';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from './constants/gasThresholds';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState<boolean>(false);
  const [activePoleTab, setActivePoleTab] = useState<PoleId>(1);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('realtime');
  const [historicalData, setHistoricalData] = useState<TelemetryPacket[]>([]);
  const [, setIsLoadingHistory] = useState<boolean>(false);

  // Gas thresholds configured per gas (MQ-7, MQ-135, MQ-136, MQ-2)
  const [gasThresholds, setGasThresholds] = useState<GasThresholdConfig>(() => {
    try {
      const saved = localStorage.getItem('iot_gas_thresholds');
      if (saved) {
        return { ...DEFAULT_GAS_THRESHOLDS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_GAS_THRESHOLDS;
  });

  const handleUpdateGasThresholds = (newThresholds: GasThresholdConfig) => {
    setGasThresholds(newThresholds);
    try {
      localStorage.setItem('iot_gas_thresholds', JSON.stringify(newThresholds));
    } catch {
      // ignore
    }
  };

  // High Voltage & Fire Emergency Modal & Sound Alert State
  const [voltageAlertDismissed, setVoltageAlertDismissed] = useState<boolean>(false);
  const [fireAlertDismissed, setFireAlertDismissed] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Persistent PostgreSQL alerts hook
  const {
    alerts: persistentAlerts,
    unresolvedAlerts,
    unresolvedCount,
    isLoading: isLoadingAlerts,
    fetchAlerts: refreshAlerts,
    resolveAlert,
    resolveSelectedAlerts,
    resolveAllAlerts,
    handleWsAlertEvent
  } = useAlerts();

  // Real-time WebSocket hook with alert event dispatch
  const {
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
    handleResetData
  } = useWebSocketTelemetry(handleWsAlertEvent);

  // Multi-pole hazard and pole status detection hook with distinct gas thresholds
  const {
    poleStateMap,
    downPoles,
    offlinePoles,
    isVoltageEmergency,
    floodHazardPoles,
    tempHazardPoles,
    fireHazardPoles,
    isFireEmergency,
    humidityHazardPoles,
    mq7HazardPoles,
    mq135HazardPoles,
    mq136HazardPoles,
    mq2HazardPoles
  } = useHazardDetection(latestPole1, latestPole2, latestPole3, gasThresholds);

  // Synthesized emergency audio hook
  const { startAlarm, stopAlarm } = useEmergencyAudio(audioMuted);

  // Sound loop trigger whenever a voltage emergency OR fire emergency is active and not dismissed
  const isEmergencySoundActive =
    (isVoltageEmergency && !voltageAlertDismissed) ||
    (isFireEmergency && !fireAlertDismissed);

  useEffect(() => {
    if (isEmergencySoundActive && !audioMuted) {
      startAlarm();
    } else {
      stopAlarm();
    }
    return () => {
      stopAlarm();
    };
  }, [isEmergencySoundActive, audioMuted, startAlarm, stopAlarm]);

  // Reset dismissed state once voltage returns to safe (<5V)
  useEffect(() => {
    if (!isVoltageEmergency) {
      setVoltageAlertDismissed(false);
    }
  }, [isVoltageEmergency]);

  // Reset dismissed state once fire returns to safe (<60°C)
  useEffect(() => {
    if (!isFireEmergency) {
      setFireAlertDismissed(false);
    }
  }, [isFireEmergency]);

  // Fetch data for a selected historical time range (1h, 6h, 24h)
  const handleTimeRangeChange = async (range: TimeRangeOption) => {
    setTimeRange(range);
    if (range === 'realtime') {
      setHistoricalData([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const now = Date.now() / 1000;
      let durationSeconds = 3600; // default 1 hour
      if (range === '6h') durationSeconds = 6 * 3600;
      else if (range === '24h') durationSeconds = 24 * 3600;

      const sinceTimestamp = now - durationSeconds;
      const res = await fetch(`http://127.0.0.1:8000/api/telemetry/recent?limit=500&since_timestamp=${sinceTimestamp}`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setHistoricalData(json.data);
      }
    } catch (err) {
      console.error('Failed to load time range data', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const selectedLatest = activePoleTab === 1 ? latestPole1
    : activePoleTab === 2 ? latestPole2
    : latestPole3 ?? latestAny;

  const selectedState = poleStateMap[activePoleTab];



  const onFullReset = async () => {
    await handleResetData();
    setHistoricalData([]);
  };

  const handleSelectPoleFromOtherViews = (poleId: PoleId) => {
    setActivePoleTab(poleId);
    setActiveView('dashboard');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        downPoles={downPoles}
        offlinePoles={offlinePoles}
        wsConnected={wsConnected}
        useSimulation={useSimulation}
        selectedPort={selectedPort}
        packetRate={packetRate}
        unresolvedAlertsCount={unresolvedCount}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, minWidth: 0, padding: '24px 32px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          
          {/* Header Bar */}
          <Header
            activeView={activeView}
            downPoles={downPoles}
            offlinePoles={offlinePoles}
            liveHazardsCount={
              (isVoltageEmergency ? 1 : 0) +
              downPoles.length +
              floodHazardPoles.length +
              tempHazardPoles.length +
              humidityHazardPoles.length +
              mq7HazardPoles.length +
              mq135HazardPoles.length +
              mq136HazardPoles.length +
              mq2HazardPoles.length +
              offlinePoles.length
            }
            isVoltageEmergency={isVoltageEmergency}
            isFireEmergency={isFireEmergency}
            fireHazardPoles={fireHazardPoles}
            floodHazardPoles={floodHazardPoles}
            tempHazardPoles={tempHazardPoles}
            gasHazardPoles={Array.from(new Set([...mq7HazardPoles, ...mq135HazardPoles, ...mq136HazardPoles, ...mq2HazardPoles]))}
            wsConnected={wsConnected}
            useSimulation={useSimulation}
            selectedPort={selectedPort}
            packetRate={packetRate}
            unresolvedAlertsCount={unresolvedCount}
            onNavigateAlerts={() => setActiveView('alerts')}
            onOpenAi={() => setAiDrawerOpen(true)}
          />

          {/* VIEW: Dashboard (Main Telemetry View) */}
          {activeView === 'dashboard' && (
            <CustomizableDashboard
              activePoleTab={activePoleTab}
              setActivePoleTab={setActivePoleTab}
              latestPole1={latestPole1}
              latestPole2={latestPole2}
              latestPole3={latestPole3}
              latestAny={latestAny}
              telemetryHistory={telemetryHistory}
              historicalData={historicalData}
              timeRange={timeRange}
              onTimeRangeChange={handleTimeRangeChange}
              poleStateMap={poleStateMap}
              selectedLatest={selectedLatest}
              selectedState={selectedState}
              gasThresholds={gasThresholds}
              onNavigateToMap={() => setActiveView('map')}
              persistentAlerts={persistentAlerts}
            />
          )}

          {/* VIEW: Dual-Node Comparison Dashboard */}
          {activeView === 'compare' && (
            <CompareDashboardView
              latestPole1={latestPole1}
              latestPole2={latestPole2}
              latestPole3={latestPole3}
              telemetryHistory={telemetryHistory}
              historicalData={historicalData}
              timeRange={timeRange}
              onTimeRangeChange={handleTimeRangeChange}
              poleStateMap={poleStateMap}
              gasThresholds={gasThresholds}
            />
          )}

          {/* VIEW: Fleet Nodes */}
          {activeView === 'fleet' && (
            <FleetNodesView
              poleStateMap={poleStateMap}
              latestPole1={latestPole1}
              latestPole2={latestPole2}
              latestPole3={latestPole3}
              onSelectPole={handleSelectPoleFromOtherViews}
            />
          )}

          {/* VIEW: Live Map (Spatial Vector Topology) */}
          {activeView === 'map' && (
            <LiveMapView
              key={`map-view-${activePoleTab}`}
              poleStateMap={poleStateMap}
              latestPole1={latestPole1}
              latestPole2={latestPole2}
              latestPole3={latestPole3}
              onSelectPole={handleSelectPoleFromOtherViews}
              initialSelectedPoleId={activePoleTab}
            />
          )}

          {/* VIEW: Historical Telemetry Log Explorer */}
          {activeView === 'history' && (
            <HistoryView />
          )}

          {/* VIEW: Reports & Audit Generator */}
          {activeView === 'reports' && (
            <ReportsView
              persistentAlerts={persistentAlerts}
            />
          )}

          {/* VIEW: AI Assistant & Safety Diagnostics */}
          {activeView === 'ai' && (
            <AiAssistantView
              latestPole1={latestPole1}
              latestPole2={latestPole2}
              latestPole3={latestPole3}
              persistentAlerts={persistentAlerts}
            />
          )}

          {/* VIEW: Alerts & Event Log */}
          {activeView === 'alerts' && (
            <AlertsHistoryView
              downPoles={downPoles}
              offlinePoles={offlinePoles}
              poleStateMap={poleStateMap}
              floodHazardPoles={floodHazardPoles}
              tempHazardPoles={tempHazardPoles}
              humidityHazardPoles={humidityHazardPoles}
              mq7HazardPoles={mq7HazardPoles}
              mq135HazardPoles={mq135HazardPoles}
              mq136HazardPoles={mq136HazardPoles}
              mq2HazardPoles={mq2HazardPoles}
              isVoltageEmergency={isVoltageEmergency}
              audioMuted={audioMuted}
              onToggleMute={() => setAudioMuted(!audioMuted)}
              onSelectPole={handleSelectPoleFromOtherViews}
              persistentAlerts={persistentAlerts}
              unresolvedAlerts={unresolvedAlerts}
              onResolveAlert={resolveAlert}
              onResolveSelected={resolveSelectedAlerts}
              onResolveAll={resolveAllAlerts}
              onRefreshAlerts={refreshAlerts}
              isLoadingAlerts={isLoadingAlerts}
              gasThresholds={gasThresholds}
            />
          )}

          {/* VIEW: Settings & Calibration */}
          {activeView === 'settings' && (
            <SettingsView
              useSimulation={useSimulation}
              selectedPort={selectedPort}
              ports={ports}
              onConfigUpdate={handleConfigUpdate}
              onScanPorts={scanPorts}
              onResetData={onFullReset}
              audioMuted={audioMuted}
              onToggleMute={() => setAudioMuted(!audioMuted)}
              gasThresholds={gasThresholds}
              onUpdateGasThresholds={handleUpdateGasThresholds}
            />
          )}

        </div>
      </main>

      {/* Critical Voltage Emergency Modal & Siren Tone Dialog */}
      <VoltageEmergencyModal
        isVoltageEmergency={isVoltageEmergency}
        voltageAlertDismissed={voltageAlertDismissed}
        onDismiss={() => {
          setVoltageAlertDismissed(true);
          stopAlarm();
        }}
        audioMuted={audioMuted}
        onToggleMute={() => setAudioMuted(!audioMuted)}
        latestPole1={latestPole1}
        latestPole2={latestPole2}
        latestPole3={latestPole3}
        onNavigateToLocation={(poleId) => {
          setActivePoleTab(poleId as PoleId);
          setActiveView('map');
          setVoltageAlertDismissed(true);
          stopAlarm();
        }}
      />

      {/* Critical Fire & Extreme Temperature Emergency Modal & Siren Tone Dialog */}
      <FireEmergencyModal
        isFireEmergency={isFireEmergency}
        fireAlertDismissed={fireAlertDismissed}
        onDismiss={() => {
          setFireAlertDismissed(true);
          stopAlarm();
        }}
        audioMuted={audioMuted}
        onToggleMute={() => setAudioMuted(!audioMuted)}
        latestPole1={latestPole1}
        latestPole2={latestPole2}
        latestPole3={latestPole3}
        onNavigateToLocation={(poleId) => {
          setActivePoleTab(poleId as PoleId);
          setActiveView('map');
          setFireAlertDismissed(true);
          stopAlarm();
        }}
      />

      {/* Global Right Corner AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        latestPole1={latestPole1}
        latestPole2={latestPole2}
        latestPole3={latestPole3}
        persistentAlerts={persistentAlerts}
        poleStateMap={poleStateMap}
        onNavigatePole={handleSelectPoleFromOtherViews}
        onOpenFullView={() => setActiveView('ai')}
      />
    </div>
  );
}
