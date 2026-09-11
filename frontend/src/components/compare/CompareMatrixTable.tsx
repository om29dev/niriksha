import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { PoleId } from '../../types/telemetry';

export interface ComparisonMetricRow {
  label: string;
  key: string;
  unit: string;
  valA: number | null | undefined;
  valB: number | null | undefined;
  icon: LucideIcon;
  isHazardA: boolean;
  isHazardB: boolean;
}

interface CompareMatrixTableProps {
  poleA: PoleId;
  poleB: PoleId;
  metrics: ComparisonMetricRow[];
}

export const CompareMatrixTable: React.FC<CompareMatrixTableProps> = ({
  poleA,
  poleB,
  metrics
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Live Telemetry Matrix Comparison
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
          Instantaneous differential readout across all hardware sensor channels
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 16px', fontWeight: '700', color: '#475569' }}>Sensor Channel</th>
              <th style={{ padding: '10px 16px', fontWeight: '700', color: '#2563eb' }}>Pole {poleA} Reading</th>
              <th style={{ padding: '10px 16px', fontWeight: '700', color: '#ea580c' }}>Pole {poleB} Reading</th>
              <th style={{ padding: '10px 16px', fontWeight: '700', color: '#334155' }}>Differential (Δ)</th>
              <th style={{ padding: '10px 16px', fontWeight: '700', color: '#334155' }}>Relative Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((row, idx) => {
              const hasA = row.valA !== null && row.valA !== undefined;
              const hasB = row.valB !== null && row.valB !== undefined;
              const diff = hasA && hasB ? (row.valA as number) - (row.valB as number) : null;

              return (
                <tr
                  key={row.key}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <row.icon style={{ width: '16px', height: '16px', color: '#64748b' }} />
                      {row.label}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {hasA ? (
                      <span
                        style={{
                          fontWeight: '700',
                          color: row.isHazardA ? '#dc2626' : '#2563eb',
                          backgroundColor: row.isHazardA ? '#fee2e2' : '#eff6ff',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {row.valA} {row.unit}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                        ● Not Connected
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {hasB ? (
                      <span
                        style={{
                          fontWeight: '700',
                          color: row.isHazardB ? '#dc2626' : '#ea580c',
                          backgroundColor: row.isHazardB ? '#fee2e2' : '#fff7ed',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {row.valB} {row.unit}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                        ● Not Connected
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {diff !== null ? (
                      <span
                        style={{
                          fontWeight: '600',
                          color: Math.abs(diff) < 0.01 ? '#64748b' : diff > 0 ? '#2563eb' : '#ea580c'
                        }}
                      >
                        {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} {row.unit}
                      </span>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {hasA && hasB ? (
                      Math.abs(diff ?? 0) < 0.05 ? (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>
                          ✓ Equal Values
                        </span>
                      ) : (diff ?? 0) > 0 ? (
                        <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>
                          Pole {poleA} Higher
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '600' }}>
                          Pole {poleB} Higher
                        </span>
                      )
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Node divergence (hardware role mismatch)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
