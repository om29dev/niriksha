import React from 'react';

export interface AlertsKpiStripProps {
  criticalCount: number;
  warningCount: number;
  liveCount: number;
  resolvedCount: number;
}

export const AlertsKpiStrip: React.FC<AlertsKpiStripProps> = ({
  criticalCount,
  warningCount,
  liveCount,
  resolvedCount
}) => {
  return (
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
        <div style={{ fontSize: '22px', fontWeight: '700', color: liveCount > 0 ? '#2563eb' : '#059669', marginTop: '4px' }}>
          {liveCount}
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
  );
};
