import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export interface AuditChartsSectionProps {
  criticalCount: number;
  warningCount: number;
  resolvedCount: number;
  totalAlerts: number;
  poleAlertsData: Array<{ name: string; critical: number; warning: number }>;
  nodeSampleDistribution: Array<{ name: string; samples: number; fill: string }>;
  averageMetricsData: Array<{
    name: string;
    voltage: number | null;
    power: number | null;
    temp: number | null;
    water: number | null;
  }>;
}

export const AuditChartsSection: React.FC<AuditChartsSectionProps> = ({
  criticalCount,
  warningCount,
  resolvedCount,
  totalAlerts,
  poleAlertsData,
  nodeSampleDistribution
}) => {
  // Alert Severity Pie Data
  const severityPieData = [
    { name: 'Critical Hazards', value: criticalCount, color: '#dc2626' },
    { name: 'Warning Notices', value: warningCount, color: '#d97706' },
    { name: 'Resolved / Normal', value: Math.max(0, resolvedCount), color: '#059669' }
  ].filter(d => d.value > 0);

  // If there are zero recorded alerts, provide a 100% Nominal slice
  const displayPieData = severityPieData.length > 0 ? severityPieData : [
    { name: 'Nominal & Healthy (0 Incidents)', value: 1, color: '#059669' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
        2. Visual Audit & Risk Analytics
      </h3>

      {/* Grid containing the 2 Primary Visual Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>

        {/* Chart 1: Donut Pie Chart of Safety Incidents & Severity Breakdown */}
        <div
          className="print-avoid-break"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                Safety Incident Severity Breakdown
              </h4>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Proportional distribution of persistent alerts & safety triggers
              </p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: totalAlerts > 0 ? '#fef2f2' : '#ecfdf5',
                color: totalAlerts > 0 ? '#dc2626' : '#059669'
              }}
            >
              {totalAlerts} Total Recorded
            </span>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any) => [value, 'Count']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Node-by-Node Incident Exposure Bar Chart */}
        <div
          className="print-avoid-break"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                Incident Exposure by Node
              </h4>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Critical vs. warning event load across individual mesh poles
              </p>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Multi-Node Comparison
            </span>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={poleAlertsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="critical" name="Critical Alert" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="warning" name="Warning Notice" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Chart 3: Node Sample Frame Distribution & Network Balance Bar Chart */}
      <div
        className="print-avoid-break"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
              Mesh Ingestion Frame Volume per Pole Node
            </h4>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Evaluates radio mesh packet delivery balance and PostgreSQL buffer consistency
            </p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#2563eb' }}>
            High Throughput WAL
          </span>
        </div>

        <div style={{ height: '180px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nodeSampleDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(val: any) => [`${Number(val).toLocaleString()} frames`, 'Ingested']}
              />
              <Bar dataKey="samples" name="Frames Logged" fill="#2563eb" radius={[0, 4, 4, 0]}>
                {nodeSampleDistribution.map((entry, index) => (
                  <Cell key={`cell-dist-${index}`} fill={entry.fill || '#2563eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
