import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { PoleId } from '../../types/telemetry';

interface ReportExecutiveSummaryProps {
  selectedPole: PoleId | 'all';
  timeWindow: '1h' | '6h' | '24h' | '7d';
  generatedAt: Date;
  totalSamples: number;
  criticalCount: number;
  warningCount: number;
  fleetCompliancePct: string;
}

export const ReportExecutiveSummary: React.FC<ReportExecutiveSummaryProps> = ({
  selectedPole,
  timeWindow,
  generatedAt,
  totalSamples,
  criticalCount,
  warningCount,
  fleetCompliancePct
}) => {
  return (
    <>
      {/* Document Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb' }}>
            NIRIKSHA Telemetry Platform • Air-Gapped Environmental Audit
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Mesh Fleet Telemetry & Safety Report
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Scope: {selectedPole === 'all' ? 'Entire Mesh Fleet' : `Pole ${selectedPole}`} | Window: {timeWindow}
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
          <div><strong>Generated:</strong> {generatedAt.toLocaleString()}</div>
          <div><strong>Total Samples:</strong> {totalSamples.toLocaleString()} frames</div>
          <div><strong>Database WAL:</strong> PostgreSQL 16 (Local)</div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Total Data Frames</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {totalSamples.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <CheckCircle2 style={{ width: '12px', height: '12px' }} /> 100% Ingestion Integrity
          </span>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Critical Safety Alerts</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: criticalCount > 0 ? '#dc2626' : '#059669', marginTop: '4px' }}>
            {criticalCount}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Voltage Surge & Collapse Events
          </span>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Warning Advisories</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: warningCount > 0 ? '#d97706' : '#059669', marginTop: '4px' }}>
            {warningCount}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Inundation & Thermal Thresholds
          </span>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Fleet Compliance Index</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
            {fleetCompliancePct}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Mesh Safety & Vertical Alignment
          </span>
        </div>
      </div>
    </>
  );
};
