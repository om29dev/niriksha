import React, { useState } from 'react';
import { Activity, Bell, AlertTriangle, WifiOff, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import type { PoleId } from '../types/telemetry';
import type { ActiveView } from './Sidebar';

interface HeaderProps {
  activeView?: ActiveView;
  downPoles: PoleId[];
  offlinePoles: PoleId[];
  wsConnected: boolean;
  useSimulation: boolean;
  selectedPort: string;
  packetRate: number;
  unresolvedAlertsCount?: number;
  onNavigateAlerts?: () => void;
  onOpenAi?: () => void;
}

const VIEW_METADATA: Record<ActiveView, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Real-Time Sensor Dashboard',
    subtitle: 'Air-gapped mesh acquisition • Live telemetry stream & chart curves'
  },
  map: {
    title: 'Live Spatial Sensor Topology',
    subtitle: 'Vector coverage schematic • RF links • Offline field coordinates'
  },
  fleet: {
    title: 'Fleet Node Architecture & Inventory',
    subtitle: 'Field hardware specifications, sensor array status & live diagnostics'
  },
  compare: {
    title: 'Multi-Node Comparative Analytics',
    subtitle: 'Dual-node differential time-series & synchronized correlation curves'
  },
  alerts: {
    title: 'Safety & Hazard Incident Management',
    subtitle: 'Persistent PostgreSQL incident log • Audio siren controls • Action center'
  },
  history: {
    title: 'Historical Telemetry Log Explorer',
    subtitle: 'PostgreSQL time-series database query • Sensor frame audit explorer'
  },
  reports: {
    title: 'Compliance & Telemetry Audit Reports',
    subtitle: 'Statistical aggregation • Incident summaries • Air-gapped CSV export'
  },
  ai: {
    title: 'NIRIKSHA Telemetry & Safety Intelligence AI',
    subtitle: 'Local offline LLM diagnostic reasoning • Multi-sensor safety heuristic'
  },
  settings: {
    title: 'System Settings & Hardware Diagnostics',
    subtitle: 'Serial COM configuration • Database credentials • Calibration thresholds'
  }
};

export const Header: React.FC<HeaderProps> = ({
  activeView = 'dashboard',
  downPoles,
  offlinePoles,
  unresolvedAlertsCount = 0,
  onNavigateAlerts,
  onOpenAi
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const totalAlerts = Math.max(downPoles.length + offlinePoles.length, unresolvedAlertsCount);
  const currentMeta = VIEW_METADATA[activeView] || VIEW_METADATA.dashboard;

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      paddingBottom: '12px',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: '16px',
      position: 'relative'
    }}>
      {/* Distinct Dynamic View Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb',
          flexShrink: 0
        }}>
          <Activity style={{ width: '18px', height: '18px' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: '#0f172a', margin: 0 }}>
            {currentMeta.title}
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Corner Buttons: AI Assistant + Alerts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onOpenAi && (
          <button
            onClick={onOpenAi}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dbeafe';
              e.currentTarget.style.borderColor = '#93c5fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
            title="Open Sensor AI Diagnostic Assistant"
          >
            <Sparkles style={{ width: '15px', height: '15px', color: '#2563eb' }} />
            <span>AI Assistant</span>
          </button>
        )}

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: totalAlerts > 0 ? (downPoles.length > 0 ? '#fca5a5' : '#fcd34d') : '#cbd5e1',
            backgroundColor: totalAlerts > 0 ? (downPoles.length > 0 ? '#fef2f2' : '#fffbeb') : '#ffffff',
            color: totalAlerts > 0 ? (downPoles.length > 0 ? '#b91c1c' : '#92400e') : '#334155',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
          }}
        >
          <Bell style={{ width: '15px', height: '15px', color: totalAlerts > 0 ? (downPoles.length > 0 ? '#dc2626' : '#d97706') : '#64748b' }} />
          <span>Alerts</span>
          {totalAlerts > 0 ? (
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '1px 7px',
              borderRadius: '9999px',
              backgroundColor: downPoles.length > 0 ? '#dc2626' : '#d97706',
              color: '#ffffff',
              minWidth: '20px',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              {totalAlerts}
            </span>
          ) : (
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '1px 6px',
              borderRadius: '9999px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0'
            }}>
              0
            </span>
          )}
        </button>

        {/* Right Corner Alert Popover Dropdown */}
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '320px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
              zIndex: 100,
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>System Alerts</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {totalAlerts > 0 ? `${totalAlerts} active notices` : 'All normal'}
              </span>
            </div>

            {totalAlerts === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', color: '#059669', fontSize: '12px' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                <span>All 3 nodes upright & connected</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {downPoles.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    fontSize: '11px',
                    color: '#991b1b'
                  }}>
                    <AlertTriangle style={{ width: '14px', height: '14px', color: '#dc2626', flexShrink: 0 }} />
                    <div>
                      <strong>Pole Tilt/Fallen:</strong> Pole {downPoles.join(', ')}
                    </div>
                  </div>
                )}

                {offlinePoles.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    fontSize: '11px',
                    color: '#92400e'
                  }}>
                    <WifiOff style={{ width: '14px', height: '14px', color: '#d97706', flexShrink: 0 }} />
                    <div>
                      <strong>Offline Node:</strong> Pole {offlinePoles.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {onNavigateAlerts && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onNavigateAlerts();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: '4px',
                  padding: '6px 10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#2563eb',
                  cursor: 'pointer'
                }}
              >
                <span>View Full Alerts Log</span>
                <ChevronRight style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </header>
  );
};

