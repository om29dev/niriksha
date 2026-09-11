import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RotateCcw,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Waves,
  Gauge,
  Droplets,
  Wind,
  Flame,
  ExternalLink,
  Thermometer,
  CloudRain
} from 'lucide-react';
import type { PoleId, TelemetryPacket, TimeRangeOption, PoleState, PersistentAlert } from '../../types/telemetry';
import type { DashboardCardConfig, MetricKey } from '../../types/dashboard';
import { DEFAULT_DASHBOARD_CARDS, AVAILABLE_CHARTS } from '../../constants/dashboardDefaults';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../../constants/gasThresholds';
import { MetricCard } from '../MetricCard';
import { TelemetryChart } from '../charts/TelemetryChart';
import { AddCardModal } from './AddCardModal';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';
import { DashboardMapCard } from './DashboardMapCard';

const STORAGE_KEY = 'iot_custom_dashboard_layout_v2';

interface CustomizableDashboardProps {
  activePoleTab: PoleId;
  setActivePoleTab: (poleId: PoleId) => void;
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  latestAny: TelemetryPacket | null;
  telemetryHistory: TelemetryPacket[];
  historicalData: TelemetryPacket[];
  timeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  poleStateMap: Record<PoleId, PoleState>;
  selectedLatest: TelemetryPacket | null;
  selectedState: PoleState;
  gasThresholds?: Partial<GasThresholdConfig>;
  onNavigateToMap?: () => void;
  persistentAlerts?: PersistentAlert[];
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  activePoleTab,
  setActivePoleTab,
  latestPole1,
  latestPole2,
  latestPole3,
  latestAny,
  telemetryHistory,
  historicalData,
  timeRange,
  onTimeRangeChange,
  poleStateMap,
  selectedLatest,
  selectedState,
  gasThresholds: customGasThresholds,
  onNavigateToMap,
  persistentAlerts: _persistentAlerts = []
}) => {
  const gasThresholds = { ...DEFAULT_GAS_THRESHOLDS, ...customGasThresholds };
  // Load layout from localStorage or fallback to defaults
  const [cards, setCards] = useState<DashboardCardConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved dashboard layout', e);
    }
    return DEFAULT_DASHBOARD_CARDS;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync cards state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error('Failed to save dashboard layout', e);
    }
  }, [cards]);

  // When user clicks a Pole button in the unified bar:
  const handleToggleAllToPole = (targetPole: PoleId) => {
    setActivePoleTab(targetPole);
  };

  // Helper to retrieve latest packet for active pole
  const activeLatest = useCallback((): TelemetryPacket | null => {
    if (activePoleTab === 1) return latestPole1;
    if (activePoleTab === 2) return latestPole2;
    if (activePoleTab === 3) return latestPole3 ?? latestAny;
    return latestAny;
  }, [activePoleTab, latestPole1, latestPole2, latestPole3, latestAny]);

  // Helper to retrieve and format historical time series for active pole
  const activeHistory = useCallback(() => {
    const rawDataSource = timeRange === 'realtime' ? telemetryHistory : historicalData;
    const filtered = rawDataSource.filter((p) => p.pole_id === activePoleTab);

    return filtered.map((pt) => {
      const d = new Date(pt.timestamp * 1000);
      let timeLabel = '';
      if (timeRange === '24h') {
        timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      return {
        ...pt,
        timeLabel,
        formattedTime: d.toLocaleTimeString()
      };
    });
  }, [timeRange, activePoleTab, telemetryHistory, historicalData]);

  // Handlers for card mutations
  const handleRemoveCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCard = (newCard: DashboardCardConfig) => {
    setCards((prev) => [...prev, newCard]);
  };

  const handleResetLayout = () => {
    if (window.confirm('Reset dashboard cards and positions back to default layout?')) {
      const fresh = DEFAULT_DASHBOARD_CARDS.map((c) => ({
        ...c,
        poleId: activePoleTab
      }));
      setCards(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedCardIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCardIndex !== null && draggedCardIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index: number) => {
    if (draggedCardIndex === null || draggedCardIndex === index) {
      setDraggedCardIndex(null);
      setDragOverIndex(null);
      return;
    }

    setCards((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedCardIndex, 1);
      updated.splice(index, 0, movedItem);
      return updated;
    });

    setDraggedCardIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedCardIndex(null);
    setDragOverIndex(null);
  };

  // Render individual metric card based on metricKey
  const renderMetricWidget = (card: DashboardCardConfig, index: number) => {
    const latest = activeLatest();
    const mKey = card.metricKey as MetricKey;

    let title = 'METRIC';
    let unit = '';
    let subtitle = '';
    let icon = <Zap style={{ width: '18px', height: '18px', color: '#64748b' }} />;
    let isHazard = false;
    let hazardText = '';
    let hazardBorderColor: string | undefined;
    let hazardBgColor: string | undefined;
    let accentColor = '#0f172a';
    let customValueDisplay: React.ReactNode = undefined;
    let val: number | null | undefined = null;

    if (mKey === 'voltage') {
      title = 'WATER VOLTAGE';
      val = latest?.voltage;
      unit = 'V';
      subtitle = 'Water Probes (Safe 0V)';
      isHazard = !!(val !== null && val !== undefined && val > 5.0);
      hazardText = '⚠️ ELECTRIFICATION HAZARD';
      hazardBorderColor = '#f87171';
      hazardBgColor = '#fef2f2';
      icon = <Zap style={{ width: '18px', height: '18px', color: isHazard ? '#dc2626' : '#d97706' }} />;
    } else if (mKey === 'current_ma') {
      title = 'CURRENT';
      val = latest?.current_ma;
      unit = 'A';
      subtitle = 'Electric Current Flow';
      accentColor = '#7c3aed';
      icon = <Zap style={{ width: '18px', height: '18px', color: '#7c3aed' }} />;
    } else if (mKey === 'is_upright') {
      title = 'UPRIGHT STATUS';
      subtitle = 'Pole Vertical Alignment';
      const isUprightDown = latest?.is_upright === false;
      isHazard = isUprightDown;
      hazardText = '⚠️ Pole Down / Fall Detected';
      icon = isUprightDown ? (
        <AlertTriangle style={{ width: '18px', height: '18px', color: '#dc2626' }} />
      ) : (
        <ShieldCheck style={{ width: '18px', height: '18px', color: '#059669' }} />
      );
      customValueDisplay = (
        <div style={{
          fontSize: '1.6rem',
          fontWeight: '700',
          color: isUprightDown ? '#dc2626' : latest?.is_upright ? '#059669' : '#64748b'
        }}>
          {latest?.is_upright === true ? 'UPRIGHT' : latest?.is_upright === false ? 'TILT ALERT' : (
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
              Not Connected
            </span>
          )}
        </div>
      );
    } else if (mKey === 'water_depth') {
      title = 'WATER DEPTH';
      val = latest?.water_depth;
      unit = 'cm';
      subtitle = 'Submersion Level';
      accentColor = '#0284c7';
      isHazard = !!(latest?.water_depth && latest.water_depth > 100.0);
      hazardText = '⚠️ High Flood Warning';
      hazardBorderColor = '#7dd3fc';
      hazardBgColor = '#f0f9ff';
      icon = <Waves style={{ width: '18px', height: '18px', color: '#0284c7' }} />;
    } else if (mKey === 'temperature') {
      title = 'TEMPERATURE';
      val = latest?.temperature;
      unit = '°C';
      subtitle = 'Ambient Temperature';
      accentColor = '#2563eb';
      isHazard = !!(latest?.temperature && latest.temperature > 45.0);
      hazardText = '⚠️ High Thermal Alert';
      hazardBorderColor = '#fdba74';
      hazardBgColor = '#fff7ed';
      icon = <Gauge style={{ width: '18px', height: '18px', color: isHazard ? '#ea580c' : '#2563eb' }} />;
    } else if (mKey === 'humidity') {
      title = 'HUMIDITY';
      val = latest?.humidity;
      unit = '%';
      subtitle = 'Relative Humidity';
      accentColor = '#059669';
      isHazard = !!(val && val > 85.0);
      hazardText = '⚠️ Moisture Saturation';
      hazardBorderColor = '#86efac';
      hazardBgColor = '#f0fdf4';
      icon = <Droplets style={{ width: '18px', height: '18px', color: '#059669' }} />;
    } else if (mKey === 'mq7') {
      title = 'CARBON MONOXIDE';
      val = latest?.mq7;
      unit = 'ppm';
      subtitle = 'Carbon Monoxide';
      isHazard = !!(latest?.mq7 && latest.mq7 > gasThresholds.mq7);
      hazardText = '⚠️ High CO Level';
      hazardBorderColor = '#fdba74';
      hazardBgColor = '#fff7ed';
      icon = <Wind style={{ width: '18px', height: '18px', color: isHazard ? '#ea580c' : '#475569' }} />;
    } else if (mKey === 'mq135') {
      title = 'AIR QUALITY';
      val = latest?.mq135;
      unit = 'ppm';
      subtitle = 'Air Pollution / NH3 / NOx';
      accentColor = '#9333ea';
      isHazard = !!(latest?.mq135 && latest.mq135 > gasThresholds.mq135);
      hazardText = '⚠️ Hazardous Air Quality';
      hazardBorderColor = '#d8b4fe';
      hazardBgColor = '#faf5ff';
      icon = <Wind style={{ width: '18px', height: '18px', color: isHazard ? '#9333ea' : '#475569' }} />;
    } else if (mKey === 'mq136') {
      title = 'SEWAGE GAS';
      val = latest?.mq136;
      unit = 'ppm';
      subtitle = 'Sewage Gas / Toxic Vapors';
      accentColor = '#dc2626';
      isHazard = !!(latest?.mq136 && latest.mq136 > gasThresholds.mq136);
      hazardText = '⚠️ Toxic Sewage Gas';
      hazardBorderColor = '#fca5a5';
      hazardBgColor = '#fef2f2';
      icon = <Wind style={{ width: '18px', height: '18px', color: isHazard ? '#dc2626' : '#475569' }} />;
    } else if (mKey === 'mq2') {
      title = 'SMOKE / GAS LEAKAGE';
      val = latest?.mq2;
      unit = 'ppm';
      subtitle = 'Smoke & Combustible Gas';
      isHazard = !!(latest?.mq2 && latest.mq2 > gasThresholds.mq2);
      hazardText = '⚠️ Smoke / Gas Detected';
      hazardBorderColor = '#fed7aa';
      hazardBgColor = '#fff7ed';
      icon = <Flame style={{ width: '18px', height: '18px', color: isHazard ? '#c2410c' : '#475569' }} />;
    }

    return (
      <MetricCard
        key={card.id}
        title={title}
        value={val}
        unit={unit}
        icon={icon}
        subtitle={subtitle}
        isHazard={isHazard}
        hazardText={hazardText}
        hazardBorderColor={hazardBorderColor}
        hazardBgColor={hazardBgColor}
        accentColor={accentColor}
        customValueDisplay={customValueDisplay}
        onRemove={() => handleRemoveCard(card.id)}
        isDragging={draggedCardIndex === index}
      />
    );
  };

  // Render individual chart card based on chartKey
  const renderChartWidget = (card: DashboardCardConfig, index: number) => {
    const chartDef = AVAILABLE_CHARTS.find((c) => c.key === card.chartKey) || AVAILABLE_CHARTS[0];
    const poleHistory = activeHistory();

    return (
      <TelemetryChart
        key={card.id}
        title={chartDef.title}
        subtitle={chartDef.subtitle}
        dataKey={chartDef.key}
        unit={chartDef.unit}
        strokeColor={chartDef.strokeColor}
        activePoleTab={activePoleTab}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        data={poleHistory}
        onRemove={() => handleRemoveCard(card.id)}
        isDragging={draggedCardIndex === index}
      />
    );
  };

  // Compute real-time hardware sensor physical hazard incidents across all poles for Current Scan
  const realTimeIncidents = React.useMemo(() => {
    const allPackets: Record<PoleId, TelemetryPacket | null> = {
      1: latestPole1,
      2: latestPole2,
      3: latestPole3
    };

    const voltagePoles: PoleId[] = [];
    const downPoles: PoleId[] = [];
    const floodPoles: PoleId[] = [];
    const tempPoles: PoleId[] = [];
    const humPoles: PoleId[] = [];
    const mq2Poles: PoleId[] = [];
    const mq7Poles: PoleId[] = [];
    const mq135Poles: PoleId[] = [];
    const mq136Poles: PoleId[] = [];
    const offlinePoles: PoleId[] = [];

    ([1, 2, 3] as PoleId[]).forEach((id) => {
      const pkt = allPackets[id];
      const st = poleStateMap[id];

      if (st?.isOffline) offlinePoles.push(id);
      if (st?.isDown || pkt?.is_upright === false) downPoles.push(id);
      if ((pkt?.voltage ?? 0) > 5.0) voltagePoles.push(id);
      if ((pkt?.water_depth ?? 0) > 100) floodPoles.push(id);
      if ((pkt?.temperature ?? 0) > 45) tempPoles.push(id);
      if ((pkt?.humidity ?? 0) > 85) humPoles.push(id);
      if ((pkt?.mq2 ?? 0) > gasThresholds.mq2) mq2Poles.push(id);
      if ((pkt?.mq7 ?? 0) > gasThresholds.mq7) mq7Poles.push(id);
      if ((pkt?.mq135 ?? 0) > gasThresholds.mq135) mq135Poles.push(id);
      if ((pkt?.mq136 ?? 0) > gasThresholds.mq136) mq136Poles.push(id);
    });

    return [
      ...(voltagePoles.length > 0 ? [{
        id: 'voltage',
        title: 'Water Electrification Emergency (>5V)',
        severity: 'critical' as const,
        description: 'Lethal voltage leakage detected on water probes. Siren triggered.',
        poles: voltagePoles,
        icon: Zap
      }] : []),
      ...(downPoles.length > 0 ? [{
        id: 'down',
        title: 'Structural Pole Collapse / Tilt Detection',
        severity: 'critical' as const,
        description: 'Upright orientation lost. Gyroscope reported horizontal angle tilt.',
        poles: downPoles,
        icon: AlertTriangle
      }] : []),
      ...(floodPoles.length > 0 ? [{
        id: 'flood',
        title: 'Water Inundation / Flood Alert (>100cm)',
        severity: 'warning' as const,
        description: 'Water level proximity hazard triggered via Ultrasonic sensor.',
        poles: floodPoles,
        icon: Waves
      }] : []),
      ...(tempPoles.length > 0 ? [{
        id: 'temp',
        title: 'High Ambient Temperature Threshold Exceeded (>45°C)',
        severity: 'warning' as const,
        description: 'Thermal warning on DHT11 telemetry.',
        poles: tempPoles,
        icon: Thermometer
      }] : []),
      ...(humPoles.length > 0 ? [{
        id: 'humidity',
        title: 'High Relative Humidity Level (>85%)',
        severity: 'info' as const,
        description: 'Condensation risk detected on weather sensor enclosure.',
        poles: humPoles,
        icon: CloudRain
      }] : []),
      ...(mq2Poles.length > 0 ? [{
        id: 'mq2',
        title: `Flammable / Combustible Gas Leak (MQ-2 > ${gasThresholds.mq2} PPM)`,
        severity: 'warning' as const,
        description: 'Elevated LPG, Propane, or Methane gas reading detected.',
        poles: mq2Poles,
        icon: Flame
      }] : []),
      ...(mq7Poles.length > 0 ? [{
        id: 'mq7',
        title: `Toxic Carbon Monoxide Detected (MQ-7 > ${gasThresholds.mq7} PPM)`,
        severity: 'critical' as const,
        description: 'Carbon monoxide gas spike above standard safety margins.',
        poles: mq7Poles,
        icon: Flame
      }] : []),
      ...(mq135Poles.length > 0 ? [{
        id: 'mq135',
        title: `Air Quality Deterioration (MQ-135 > ${gasThresholds.mq135} PPM)`,
        severity: 'warning' as const,
        description: 'High particulate or ammonia air concentration detected.',
        poles: mq135Poles,
        icon: Flame
      }] : []),
      ...(mq136Poles.length > 0 ? [{
        id: 'mq136',
        title: `Hydrogen Sulfide Gas Alert (MQ-136 > ${gasThresholds.mq136} PPM)`,
        severity: 'warning' as const,
        description: 'Sewer gas / H2S threshold exceeded on sensor cluster.',
        poles: mq136Poles,
        icon: Flame
      }] : []),
      ...(offlinePoles.length > 0 ? [{
        id: 'offline',
        title: 'Mesh Node Heartbeat Timeout',
        severity: 'warning' as const,
        description: 'Telemetry packets stopped arriving for >7 seconds. Possible power or radio loss.',
        poles: offlinePoles,
        icon: AlertTriangle
      }] : [])
    ];
  }, [latestPole1, latestPole2, latestPole3, poleStateMap, gasThresholds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
      
      {/* Real-Time Hardware Sensor State (Current Scan) - only display when active incidents exist */}
      {realTimeIncidents.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 0 3px #fee2e2'
              }} />
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Real-Time Hardware Sensor State (Current Scan)
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {`${realTimeIncidents.length} active physical hazards`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {realTimeIncidents.map((incident) => {
              const Icon = incident.icon;
              const isCrit = incident.severity === 'critical';
              return (
                <div
                  key={incident.id}
                  style={{
                    backgroundColor: isCrit ? '#fff1f2' : '#fffbeb',
                    border: isCrit ? '1px solid #fecdd3' : '1px solid #fde68a',
                    borderLeft: `4px solid ${isCrit ? '#dc2626' : '#d97706'}`,
                    borderRadius: '6px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: isCrit ? '#fee2e2' : '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCrit ? '#dc2626' : '#d97706',
                      flexShrink: 0
                    }}>
                      <Icon style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                          {incident.title}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: isCrit ? '#fee2e2' : '#fef3c7',
                          color: isCrit ? '#b91c1c' : '#b45309'
                        }}>
                          LIVE
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {incident.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {incident.poles.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleToggleAllToPole(p)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <span>Jump to Pole {p}</span>
                        <ExternalLink style={{ width: '11px', height: '11px' }} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified Single Control Bar: Pole Selection + Status Info + Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
          padding: '12px 18px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Left: Scalable Searchable Pole Selector + Quick Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
            Active Pole:
          </span>
          <PoleSelectDropdown
            poles={DEFAULT_POLES}
            selectedPoleId={activePoleTab}
            onSelectPole={(id) => handleToggleAllToPole(id as PoleId)}
            poleStateMap={poleStateMap}
            width="250px"
          />


          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {selectedLatest && <span>Last Seq: #{selectedLatest.seq}</span>}
            {selectedState.secondsSince !== null && (
              <span style={{ color: selectedState.isOffline ? '#d97706' : '#64748b' }}>
                {' '}({selectedState.secondsSince}s ago)
              </span>
            )}
          </span>
        </div>

        {/* Right: Reset Layout & Add Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleResetLayout}
            title="Reset cards and positions back to default layout"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RotateCcw style={{ width: '13px', height: '13px' }} />
            Reset Layout
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            Add Card
          </button>
        </div>
      </div>

      {/* Uniform CSS Grid with Dense Packing */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gridAutoRows: '180px',
          gridAutoFlow: 'dense',
          gap: '16px'
        }}
      >
        {/* Embedded Live Spatial Vector Map Card (2x2 Grid Tile like Graphs) */}
        <div
          style={{
            gridColumn: 'span 2',
            gridRow: 'span 2',
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <DashboardMapCard
            poleStateMap={poleStateMap}
            latestPole1={latestPole1}
            latestPole2={latestPole2}
            latestPole3={latestPole3}
            selectedPoleId={activePoleTab}
            onSelectPoleId={(id) => handleToggleAllToPole(id)}
            onNavigateToMap={onNavigateToMap || (() => {})}
          />
        </div>

        {cards.map((card, idx) => {
          const isChart = card.type === 'chart';
          const isDragOver = dragOverIndex === idx;

          return (
            <div
              key={card.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              style={{
                gridColumn: isChart ? 'span 2' : 'span 1',
                gridRow: isChart ? 'span 2' : 'span 1',
                position: 'relative',
                transition: 'all 0.2s ease',
                outline: isDragOver ? '2px dashed #2563eb' : 'none',
                outlineOffset: '2px',
                borderRadius: '8px'
              }}
            >
              {isChart ? renderChartWidget(card, idx) : renderMetricWidget(card, idx)}
            </div>
          );
        })}
      </div>

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCard={handleAddCard}
        activePoleDefault={activePoleTab}
      />
    </div>
  );
};
