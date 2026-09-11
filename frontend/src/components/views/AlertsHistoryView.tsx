import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  Zap,
  Waves,
  Thermometer,
  CloudRain,
  CheckCheck,
  Download,
  Info
} from 'lucide-react';
import type { PoleId, PoleState, PersistentAlert } from '../../types/telemetry';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../../constants/gasThresholds';
import { AlertsStatusHeader } from '../alerts/AlertsStatusHeader';
import { AlertsKpiStrip } from '../alerts/AlertsKpiStrip';
import { LiveIncidentsCard, type LiveIncidentItem } from '../alerts/LiveIncidentsCard';
import { AlertsFilterBar } from '../alerts/AlertsFilterBar';
import { AlertsTable } from '../alerts/AlertsTable';
import { AlertsPagination } from '../alerts/AlertsPagination';

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
  const realTimeIncidents: LiveIncidentItem[] = useMemo(() => [
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
      title: `High Ambient Temperature Threshold Exceeded (>${gasThresholds.temp}°C)`,
      severity: 'warning' as const,
      description: 'Thermal warning on DHT11 telemetry.',
      poles: tempHazardPoles,
      icon: Thermometer
    }] : []),
    ...(humidityHazardPoles.length > 0 ? [{
      id: 'humidity',
      title: `High Relative Humidity Level (>${gasThresholds.humidity}%)`,
      severity: 'info' as const,
      description: 'Condensation risk detected on weather sensor enclosure.',
      poles: humidityHazardPoles,
      icon: CloudRain
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

  const unresolvedOnCurrentPageCount = paginatedAlerts.filter(a => a.status === 'UNRESOLVED').length;
  const isAllPageSelected = unresolvedOnCurrentPageCount > 0 && paginatedAlerts.filter(a => a.status === 'UNRESOLVED').every(a => selectedAlertIds.has(a.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Incident Status & Audio Siren Controls */}
      <AlertsStatusHeader
        unresolvedAlerts={unresolvedAlerts}
        liveHazardsCount={realTimeIncidents.length}
        audioMuted={audioMuted}
        onToggleMute={onToggleMute}
      />

      {/* KPI Metric Strip */}
      <AlertsKpiStrip
        criticalCount={criticalCount}
        warningCount={warningCount}
        liveCount={realTimeIncidents.length}
        resolvedCount={resolvedCount}
      />

      {/* Real-Time Active Critical Conditions (Only shown when active incidents exist) */}
      <LiveIncidentsCard
        incidents={realTimeIncidents}
        onSelectPole={onSelectPole}
      />

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
        <AlertsFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedPoleFilter={selectedPoleFilter}
          setSelectedPoleFilter={setSelectedPoleFilter}
          selectedSeverityFilter={selectedSeverityFilter}
          setSelectedSeverityFilter={setSelectedSeverityFilter}
          selectedStatusFilter={selectedStatusFilter}
          setSelectedStatusFilter={setSelectedStatusFilter}
          activeTab={activeTab}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />

        {/* Alerts Table */}
        <AlertsTable
          paginatedAlerts={paginatedAlerts}
          isAllPageSelected={isAllPageSelected}
          onToggleSelectAll={handleToggleSelectAll}
          unresolvedOnCurrentPageCount={unresolvedOnCurrentPageCount}
          selectedAlertIds={selectedAlertIds}
          onToggleSelect={handleToggleSelect}
          onSelectPole={onSelectPole}
          onResolveAlert={onResolveAlert}
          activeTab={activeTab}
        />

        {/* Pagination & Count Navigation Bar */}
        <AlertsPagination
          rangeDisplay={rangeDisplay}
          currentPage={validCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

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
