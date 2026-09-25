import React from 'react';
import { ShieldCheck, Clock, ExternalLink, Check } from 'lucide-react';
import type { PersistentAlert, PoleId } from '../../types/telemetry';

export interface AlertsTableProps {
  paginatedAlerts: PersistentAlert[];
  isAllPageSelected: boolean;
  onToggleSelectAll: () => void;
  unresolvedOnCurrentPageCount: number;
  selectedAlertIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectPole: (poleId: PoleId) => void;
  onResolveAlert: (id: number) => void;
  activeTab: 'unresolved' | 'all';
}

export const AlertsTable: React.FC<AlertsTableProps> = ({
  paginatedAlerts,
  isAllPageSelected,
  onToggleSelectAll,
  unresolvedOnCurrentPageCount,
  selectedAlertIds,
  onToggleSelect,
  onSelectPole,
  onResolveAlert,
  activeTab
}) => {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
            <th style={{ padding: '10px 14px', width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={isAllPageSelected}
                onChange={onToggleSelectAll}
                disabled={unresolvedOnCurrentPageCount === 0}
                title="Select all unresolved on this page"
                style={{ cursor: unresolvedOnCurrentPageCount === 0 ? 'not-allowed' : 'pointer', accentColor: '#2563eb' }}
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
                  <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {isUnresolved ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(alert.id)}
                        style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                      />
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                    )}
                  </td>

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

                  <td style={{ padding: '12px 14px', verticalAlign: 'middle', maxWidth: '300px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      {alert.title}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      {alert.description}
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontFamily: 'monospace', fontWeight: '600', color: '#334155' }}>
                    {alert.trigger_value !== null && alert.trigger_value !== undefined
                      ? `${alert.trigger_value} ${alert.unit || ''}`
                      : '-'}
                  </td>

                  <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: '500' }}>
                      <Clock style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
                      {timeStr}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                      {dateStr}
                    </div>
                  </td>

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
  );
};
