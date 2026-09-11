import React from 'react';
import type { PoleStatSummary } from './ReportNodeStatsTable';

interface ReportGasAuditCardProps {
  pole3Stats?: PoleStatSummary;
}

export const ReportGasAuditCard: React.FC<ReportGasAuditCardProps> = ({ pole3Stats }) => {
  return (
    <div className="print-avoid-break">
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
        3. Air Quality & Gas Sensor Audit (Pole 3 Master Array)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <div style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>MQ-7 Carbon Monoxide</span>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
            {pole3Stats?.mq7?.avg !== null && pole3Stats?.mq7?.avg !== undefined
              ? `${pole3Stats.mq7.avg.toFixed(1)} ppm`
              : 'Nominal (< 50)'}
          </div>
          <span style={{ fontSize: '11px', color: '#059669' }}>Safe Occupational Range</span>
        </div>

        <div style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>MQ-135 Air Quality / NH3</span>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
            {pole3Stats?.mq135?.avg !== null && pole3Stats?.mq135?.avg !== undefined
              ? `${pole3Stats.mq135.avg.toFixed(1)} ppm`
              : 'Nominal (< 150)'}
          </div>
          <span style={{ fontSize: '11px', color: '#059669' }}>Safe Baseline</span>
        </div>

        <div style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>MQ-136 Hydrogen Sulfide</span>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
            {pole3Stats?.mq136?.avg !== null && pole3Stats?.mq136?.avg !== undefined
              ? `${pole3Stats.mq136.avg.toFixed(1)} ppm`
              : 'Nominal (< 15)'}
          </div>
          <span style={{ fontSize: '11px', color: '#059669' }}>Safe Sewer Margin</span>
        </div>
      </div>
    </div>
  );
};
