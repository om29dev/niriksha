import React from 'react';
import type { PoleId, TelemetryPacket, PoleState } from '../../types/telemetry';

interface PoleDisplayInfo {
  name: string;
  role: string;
  sensors: string;
}

interface CompareNodeSummaryCardProps {
  label: 'Node A Reference' | 'Node B Reference';
  poleId: PoleId;
  poleInfo: PoleDisplayInfo;
  latest: TelemetryPacket | null;
  state?: PoleState;
  accentColor: string;
  borderColor: string;
  shadowColor: string;
}

export const CompareNodeSummaryCard: React.FC<CompareNodeSummaryCardProps> = ({
  label,
  poleId,
  poleInfo,
  latest,
  state,
  accentColor,
  borderColor,
  shadowColor
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${borderColor}`,
        borderLeft: `5px solid ${accentColor}`,
        borderRadius: '8px',
        padding: '16px 20px',
        boxShadow: `0 1px 3px ${shadowColor}`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: accentColor, textTransform: 'uppercase' }}>
            {label}
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '2px 0 0 0' }}>
            Pole {poleId}: {poleInfo.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
            {poleInfo.role}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: state?.isOffline ? '#fef2f2' : '#ecfdf5',
              color: state?.isOffline ? '#dc2626' : '#059669',
              border: state?.isOffline ? '1px solid #fecaca' : '1px solid #a7f3d0'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: state?.isOffline ? '#ef4444' : '#10b981'
              }}
            />
            {state?.isOffline ? 'Offline' : 'Online'}
          </span>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Seq #{latest?.seq ?? '—'}
          </div>
        </div>
      </div>
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
        <strong>Sensors:</strong> {poleInfo.sensors}
      </div>
    </div>
  );
};
