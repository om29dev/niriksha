import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  Zap,
  Volume2,
  VolumeX,
  Waves,
  Thermometer,
  CloudRain,
  ShieldCheck,
  Search,
  Download,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { PoleId, PoleState, PersistentAlert } from '../../types/telemetry';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../../constants/gasThresholds';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

interface AlertsHistoryViewProps {
  downPoles: PoleId[];
  offlinePoles: PoleId[];
  poleStateMap: Record<PoleId, PoleState>;
  floodHazardPoles: PoleId[];
  tempHazardPoles: PoleId[];
  humidityHazardPoles: PoleId[];
  mq7HazardPoles: PoleId[];
  mq135HazardPoles: PoleId[];
  mq136HazardPoles: PoleId[];
  mq2HazardPoles: PoleId[];
  isVoltageEmergency: boolean;
  audioMuted: boolean;
  onToggleMute: () => void;
  onSelectPole: (poleId: PoleId) => void;
  persistentAlerts: PersistentAlert[];
  unresolvedAlerts: PersistentAlert[];
  onResolveAlert: (id: number) => void;
  onResolveSelected?: (ids: number[]) => void;
  onResolveAll?: (poleId?: PoleId) => void;
  onRefreshAlerts?: () => void;
  isLoadingAlerts?: boolean;
  gasThresholds?: Partial<GasThresholdConfig>;
}

export const AlertsHistoryView: React.FC<AlertsHistoryViewProps> = ({
  downPoles,
  offlinePoles,
  floodHazardPoles,
  tempHazardPoles,
  humidityHazardPoles,
  mq7HazardPoles,
  mq135HazardPoles,
  mq136HazardPoles,
  mq2HazardPoles,
  isVoltageEmergency,
  audioMuted,
  onToggleMute,
  onSelectPole,
  persistentAlerts,
  unresolvedAlerts,
  onResolveAlert,
  onResolveSelected,
  gasThresholds: customGasThresholds
}) => {
  const gasThresholds = { ...DEFAULT_GAS_THRESHOLDS, ...customGasThresholds };
  // Local Filter & Search state for historical table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPoleFilter, setSelectedPoleFilter] = useState<PoleId | 'all'>('all');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'UNRESOLVED' | 'RESOLVED'>('all');
  const [activeTab, setActiveTab] = useState<'unresolved' | 'all'>('unresolved');

  // Multi-select state for bulk resolution
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<number>>(new Set());

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Real-time calculated incidents (from live telemetry states)
  const realTimeIncidents = useMemo(() => [
    ...(isVoltageEmergency ? [{
      id: 'voltage',
      title: 'Water Electrification Emergency (>5V)',
      severity: 'critical' as const,
      description: 'Lethal voltage leakage detected on water probes. Siren activated.',
      poles: [1] as PoleId[],
      icon: Zap
    }] : []),
    ...(downPoles.length > 0 ? [{
      id: 'down',
      title: 'Structural Pole Collapse / Tilt Detection',
      severity: 'critical' as const,
      description: 'Upright orientation lost. Microcontroller gyro reported horizontal inversion.',
      poles: downPoles,
      icon: AlertTriangle
    }] : []),
    ...(floodHazardPoles.length > 0 ? [{
      id: 'flood',
      title: 'Water Inundation / Flood Alert (>100cm)',
      severity: 'warning' as const,
      description: 'Water level proximity hazard triggered via Ultrasonic sensor.',
      poles: floodHazardPoles,
      icon: Waves
    }] : []),
    ...(tempHazardPoles.length > 0 ? [{
      id: 'temp',
      title: 'High Ambient Temperature Threshold Exceeded (>45°C)',
      severity: 'warning' as const,
      description: 'Thermal warning on DHT11 telemetry.',
      poles: tempHazardPoles,
      icon: Thermometer
    }] : []),
    ...(humidityHazardPoles.length > 0 ? [{
      id: 'humidity',
      title: 'High Relative Humidity Level (>85%)',
      severity: 'info' as const,
      description: 'Condensation risk detected on weather sensor enclosure.',
      poles: humidityHazardPoles,
      icon: CloudRain
    }] : []),
    ...(mq2HazardPoles.length > 0 ? [{
      id: 'mq2',
      title: `Flammable / Combustible Gas Leak (MQ-2 > ${gasThresholds.mq2} PPM)`,
      severity: 'warning' as const,
      description: 'Elevated LPG, Propane, or Methane gas reading detected.',
      poles: mq2HazardPoles,
      icon: Flame
    }] : []),
    ...(mq7HazardPoles.length > 0 ? [{
      id: 'mq7',
      title: `Toxic Carbon Monoxide Detected (MQ-7 > ${gasThresholds.mq7} PPM)`,
      severity: 'critical' as const,
      description: 'Carbon monoxide gas spike above standard safety margins.',
      poles: mq7HazardPoles,
      icon: Flame
    }] : []),
    ...(mq135HazardPoles.length > 0 ? [{
      id: 'mq135',
      title: `Air Quality Deterioration (MQ-135 > ${gasThresholds.mq135} PPM)`,
      severity: 'warning' as const,
      description: 'High particulate or ammonia air concentration detected.',
      poles: mq135HazardPoles,
      icon: Flame
    }] : []),
    ...(mq136HazardPoles.length > 0 ? [{
      id: 'mq136',
      title: `Hydrogen Sulfide Gas Alert (MQ-136 > ${gasThresholds.mq136} PPM)`,
      severity: 'warning' as const,
      description: 'Sewer gas / H2S threshold exceeded on sensor cluster.',
      poles: mq136HazardPoles,
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
  ], [
    isVoltageEmergency,
    downPoles,
    floodHazardPoles,
    tempHazardPoles,
    humidityHazardPoles,
    mq2HazardPoles,
    mq7HazardPoles,
    mq135HazardPoles,
    mq136HazardPoles,
    offlinePoles,
    gasThresholds
  ]);

  // Filtered persistent alerts list
  const filteredAlerts = useMemo(() => {
    return persistentAlerts.filter((item) => {
      // Tab filter
      if (activeTab === 'unresolved' && item.status !== 'UNRESOLVED') {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) {
        return false;
      }

      // Pole filter
      if (selectedPoleFilter !== 'all' && item.pole_id !== selectedPoleFilter) {
        return false;
      }

      // Severity filter
      if (selectedSeverityFilter !== 'all' && item.severity !== selectedSeverityFilter) {
        return false;
      }

      // Query search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesType = item.alert_type.toLowerCase().includes(q);
        const matchesPole = `pole ${item.pole_id}`.includes(q);
        if (!matchesTitle && !matchesDesc && !matchesType && !matchesPole) {
          return false;
        }
      }

      return true;
    });
  }, [persistentAlerts, activeTab, selectedStatusFilter, selectedPoleFilter, selectedSeverityFilter, searchQuery]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPoleFilter, selectedSeverityFilter, selectedStatusFilter, activeTab, pageSize]);

  // Paginated alerts slice
  const totalCount = filteredAlerts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAlerts = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredAlerts.slice(startIndex, startIndex + pageSize);
  }, [filteredAlerts, validCurrentPage, pageSize]);

  // Calculate range label: e.g. "10 out of 100", "20 out of 100"
  const rangeDisplay = useMemo(() => {
    if (totalCount === 0) return '0 out of 0';
    const end = Math.min(validCurrentPage * pageSize, totalCount);
    return `${end} out of ${totalCount}`;
  }, [validCurrentPage, pageSize, totalCount]);

  // Multi-select handlers
  const handleToggleSelectAll = () => {
    const unresolvedOnPage = paginatedAlerts.filter(a => a.status === 'UNRESOLVED');
    const allSelected = unresolvedOnPage.length > 0 && unresolvedOnPage.every(a => selectedAlertIds.has(a.id));

    const next = new Set(selectedAlertIds);
    if (allSelected) {
      unresolvedOnPage.forEach(a => next.delete(a.id));
    } else {
      unresolvedOnPage.forEach(a => next.add(a.id));
    }
    setSelectedAlertIds(next);
  };

  const handleToggleSelect = (id: number) => {
    const next = new Set(selectedAlertIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedAlertIds(next);
  };

  const handleResolveSelected = () => {
    const idsToResolve = Array.from(selectedAlertIds);
    if (idsToResolve.length === 0) return;
    if (onResolveSelected) {
      onResolveSelected(idsToResolve);
    } else {
      idsToResolve.forEach(id => onResolveAlert(id));
    }
    setSelectedAlertIds(new Set());
  };

  // Export alerts to CSV
  const handleExportCSV = () => {
    if (filteredAlerts.length === 0) return;

    const headers = ['ID', 'Pole ID', 'Severity', 'Status', 'Alert Type', 'Title', 'Description', 'Trigger Value', 'Unit', 'Triggered At', 'Resolved At', 'Resolved By'];
    const rows = filteredAlerts.map((a) => [
      a.id,
      `Pole ${a.pole_id}`,
      a.severity.toUpperCase(),
      a.status,
      a.alert_type,
      `"${(a.title || '').replace(/"/g, '""')}"`,
      `"${(a.description || '').replace(/"/g, '""')}"`,
      a.trigger_value !== null ? a.trigger_value : '',
      a.unit || '',
      a.triggered_at || '',
      a.resolved_at || '',
      a.resolved_by || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `niriksha_alerts_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const criticalCount = persistentAlerts.filter(a => a.severity === 'critical' && a.status === 'UNRESOLVED').length;
  const warningCount = persistentAlerts.filter(a => a.severity === 'warning' && a.status === 'UNRESOLVED').length;
  const resolvedCount = persistentAlerts.filter(a => a.status === 'RESOLVED').length;

  const unresolvedOnCurrentPage = paginatedAlerts.filter(a => a.status === 'UNRESOLVED');
  const isAllPageSelected = unresolvedOnCurrentPage.length > 0 && unresolvedOnCurrentPage.every(a => selectedAlertIds.has(a.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
              Safety & Hazard Incident Management
            </h2>
            {unresolvedAlerts.length > 0 && (
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5'
              }}>
                {unresolvedAlerts.length} Unresolved Action{unresolvedAlerts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Real-time hazard detection with persistent incident logging in PostgreSQL. Historical alerts remain tracked until manually resolved.
          </p>
        </div>

        {/* Right side controls: Alarm Siren Mute toggle positioned on the far right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onToggleMute}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              border: '1px solid',
              backgroundColor: audioMuted ? '#fef2f2' : '#eff6ff',
              color: audioMuted ? '#dc2626' : '#2563eb',
              borderColor: audioMuted ? '#fecaca' : '#bfdbfe',
              transition: 'all 0.15s ease'
            }}
          >
            {audioMuted ? <VolumeX style={{ width: '16px', height: '16px' }} /> : <Volume2 style={{ width: '16px', height: '16px' }} />}
            {audioMuted ? 'Alarm Siren Muted' : 'Alarm Siren Armed'}
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px 18px',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Critical Unresolved
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: criticalCount > 0 ? '#dc2626' : '#0f172a', marginTop: '4px' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Immediate hazard intervention required
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px 18px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Warning Unresolved
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: warningCount > 0 ? '#b45309' : '#0f172a', marginTop: '4px' }}>
            {warningCount}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Submersion, heat, gas threshold notices
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px 18px',
          borderLeft: '4px solid #2563eb'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Real-Time Live Hazards
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: realTimeIncidents.length > 0 ? '#2563eb' : '#059669', marginTop: '4px' }}>
            {realTimeIncidents.length}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Physically breaching limits at this second
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px 18px',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Resolved Incidents
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#047857', marginTop: '4px' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Archived in PostgreSQL history
          </div>
        </div>
      </div>

      {/* SECTION 1: Real-Time Active Critical Conditions (Only shown when active incidents exist) */}
      {realTimeIncidents.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
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
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
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
                        onClick={() => onSelectPole(p)}
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

      {/* SECTION 2: Persistent Alerts History & Resolution Center */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Navigation & Controls Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '16px'
        }}>
          {/* Tab Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setActiveTab('unresolved')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'unresolved' ? '#ffffff' : 'transparent',
                color: activeTab === 'unresolved' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'unresolved' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Unresolved Action Items</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: unresolvedAlerts.length > 0 ? '#fee2e2' : '#f1f5f9',
                color: unresolvedAlerts.length > 0 ? '#dc2626' : '#64748b',
                fontWeight: '700'
              }}>
                {unresolvedAlerts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'all' ? '#ffffff' : 'transparent',
                color: activeTab === 'all' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Full Historical Audit Log</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                fontWeight: '700'
              }}>
                {persistentAlerts.length}
              </span>
            </button>
          </div>

          {/* Action buttons (Multi-select resolve & Export CSV) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedAlertIds.size > 0 && (
              <button
                onClick={handleResolveSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #10b981',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckCheck style={{ width: '15px', height: '15px' }} />
                Resolve Selected ({selectedAlertIds.size})
              </button>
            )}

            <button
              onClick={handleExportCSV}
              disabled={filteredAlerts.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '12px',
                fontWeight: '600',
                cursor: filteredAlerts.length === 0 ? 'not-allowed' : 'pointer',
                opacity: filteredAlerts.length === 0 ? 0.5 : 1
              }}
            >
              <Download style={{ width: '13px', height: '13px' }} />
              Export CSV ({filteredAlerts.length})
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#fafbfc',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px' }}>
            <Search style={{ width: '15px', height: '15px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by title, description, or sensor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                width: '100%',
                color: '#0f172a',
                backgroundColor: 'transparent'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', padding: '0 4px' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Scalable Pole Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Pole:</span>
            <PoleSelectDropdown
              poles={DEFAULT_POLES}
              selectedPoleId={selectedPoleFilter}
              onSelectPole={(id) => setSelectedPoleFilter(id)}
              allowAllOption={true}
              allOptionLabel="All Nodes"
              width="210px"
              size="sm"
            />
          </div>

          {/* Severity Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Severity:</span>
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value as any)}
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 10px',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Status Filter (visible on "All" tab) */}
          {activeTab === 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All States</option>
                <option value="UNRESOLVED">Unresolved Only</option>
                <option value="RESOLVED">Resolved Only</option>
              </select>
            </div>
          )}

          {/* Page Size Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 8px',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Alerts Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
                <th style={{ padding: '10px 14px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleToggleSelectAll}
                    disabled={unresolvedOnCurrentPage.length === 0}
                    title="Select all unresolved on this page"
                    style={{ cursor: unresolvedOnCurrentPage.length === 0 ? 'not-allowed' : 'pointer', accentColor: '#2563eb' }}
                  />
                </th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Severity</th>
                <th style={{ padding: '10px 14px' }}>Node</th>
                <th style={{ padding: '10px 14px' }}>Incident Title & Details</th>
                <th style={{ padding: '10px 14px' }}>Trigger Value</th>
                <th style={{ padding: '10px 14px' }}>Triggered Time</th>
                <th style={{ padding: '10px 14px' }}>Resolution</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px 14px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck style={{ width: '32px', height: '32px', color: '#cbd5e1' }} />
                      <div style={{ fontWeight: '600', color: '#64748b' }}>
                        {activeTab === 'unresolved' ? 'No unresolved alerts! All historical issues have been resolved.' : 'No alerts match the selected filters.'}
                      </div>
                      <div style={{ fontSize: '11px' }}>
                        Alerts automatically record to PostgreSQL when telemetry thresholds are breached.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAlerts.map((alert) => {
                  const isUnresolved = alert.status === 'UNRESOLVED';
                  const isCrit = alert.severity === 'critical';
                  const isWarn = alert.severity === 'warning';
                  const isSelected = selectedAlertIds.has(alert.id);

                  // Format timestamp nicely
                  const triggeredDate = alert.triggered_at ? new Date(alert.triggered_at) : null;
                  const timeStr = triggeredDate ? triggeredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Unknown';
                  const dateStr = triggeredDate ? triggeredDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

                  return (
                    <tr
                      key={alert.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isSelected
                          ? '#eff6ff'
                          : isUnresolved
                          ? (isCrit ? '#fffbfc' : '#fffdfa')
                          : '#ffffff',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Checkbox for selection */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                        {isUnresolved ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(alert.id)}
                            style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                          />
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: isUnresolved ? '#fee2e2' : '#ecfdf5',
                          color: isUnresolved ? '#dc2626' : '#059669',
                          border: `1px solid ${isUnresolved ? '#fca5a5' : '#a7f3d0'}`
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isUnresolved ? '#ef4444' : '#10b981'
                          }} />
                          {isUnresolved ? 'UNRESOLVED' : 'RESOLVED'}
                        </span>
                      </td>

                      {/* Severity */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: isCrit ? '#fee2e2' : isWarn ? '#fef3c7' : '#f1f5f9',
                          color: isCrit ? '#b91c1c' : isWarn ? '#b45309' : '#475569'
                        }}>
                          {alert.severity}
                        </span>
                      </td>

                      {/* Node */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <button
                          onClick={() => onSelectPole(alert.pole_id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            color: '#0f172a',
                            fontWeight: '600',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Pole {alert.pole_id}
                          <ExternalLink style={{ width: '10px', height: '10px', color: '#64748b' }} />
                        </button>
                      </td>

                      {/* Title & Description */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', maxWidth: '300px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>
                          {alert.title}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          {alert.description}
                        </div>
                      </td>

                      {/* Trigger Value */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontFamily: 'monospace', fontWeight: '600', color: '#334155' }}>
                        {alert.trigger_value !== null && alert.trigger_value !== undefined
                          ? `${alert.trigger_value} ${alert.unit || ''}`
                          : '—'}
                      </td>

                      {/* Triggered Time */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: '500' }}>
                          <Clock style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
                          {timeStr}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                          {dateStr}
                        </div>
                      </td>

                      {/* Resolution details */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        {alert.status === 'RESOLVED' ? (
                          <div style={{ fontSize: '11px', color: '#059669' }}>
                            <div style={{ fontWeight: '600' }}>Resolved by {alert.resolved_by || 'Operator'}</div>
                            {alert.resolved_at && (
                              <div style={{ fontSize: '10px', color: '#64748b' }}>
                                {new Date(alert.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '500' }}>
                            Pending Operator Action
                          </span>
                        )}
                      </td>

                      {/* Action Button: Individual resolve */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                        {isUnresolved ? (
                          <button
                            onClick={() => onResolveAlert(alert.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: '1px solid #10b981',
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Check style={{ width: '12px', height: '12px' }} />
                            Resolve
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Archived
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Count Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #f1f5f9'
        }}>
          {/* Display range: e.g. "10 out of 100", "20 out of 100" */}
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
            Showing <span style={{ color: '#2563eb', fontWeight: '700' }}>{rangeDisplay}</span> alerts
          </div>

          {/* Page Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validCurrentPage <= 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: validCurrentPage <= 1 ? '#94a3b8' : '#334155',
                fontSize: '11px',
                fontWeight: '600',
                cursor: validCurrentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
              Previous
            </button>

            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', padding: '0 8px' }}>
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage >= totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: validCurrentPage >= totalPages ? '#94a3b8' : '#334155',
                fontSize: '11px',
                fontWeight: '600',
                cursor: validCurrentPage >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>

        {/* Footer info notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
          <Info style={{ width: '14px', height: '14px', color: '#2563eb', flexShrink: 0 }} />
          <span>
            <strong>Air-gapped Compliance:</strong> Alerts persist in the local PostgreSQL database (<code>alerts</code> table) even if sensor readings normalize or power cycles. Alerts can only transition to <code>RESOLVED</code> by operator confirmation.
          </span>
        </div>
      </div>
    </div>
  );
};
