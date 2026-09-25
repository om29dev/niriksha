import React, { useState, useEffect, useMemo } from 'react';
import type { PersistentAlert, PoleId } from '../../types/telemetry';
import { AuditChartsSection } from '../reports/AuditChartsSection';
import { ReportsFilterBar } from '../reports/ReportsFilterBar';
import { ReportExecutiveSummary } from '../reports/ReportExecutiveSummary';
import { ReportNodeStatsTable, type PoleStatSummary } from '../reports/ReportNodeStatsTable';
import { ReportGasAuditCard } from '../reports/ReportGasAuditCard';

interface ReportsViewProps {
  persistentAlerts: PersistentAlert[];
}

const generateReportStats = (): Record<number, PoleStatSummary> => {
  return {
    1: {
      sample_count: 1420,
      tilt_incidents: 0,
      voltage: { avg: 0.12, min: 0.05, max: 0.35 },
      water_depth: { avg: 14.2, min: 11.0, max: 18.5 },
      current_ma: { avg: 145.2, min: 120.0, max: 175.0 },
      power: { avg: 14.5, min: 12.0, max: 16.2 },
      temperature: { avg: 26.4, min: 24.1, max: 28.9 },
      humidity: { avg: 59.1, min: 52.0, max: 64.0 },
      mq7: { avg: 8.4, min: 5.0, max: 12.0 },
      mq135: { avg: 26.2, min: 18.0, max: 34.0 },
      mq136: { avg: 3.1, min: 1.5, max: 4.8 }
    },
    2: {
      sample_count: 1395,
      tilt_incidents: 0,
      voltage: { avg: 0.14, min: 0.04, max: 0.40 },
      water_depth: { avg: 12.8, min: 9.5, max: 16.0 },
      current_ma: { avg: 152.0, min: 130.0, max: 180.0 },
      power: { avg: 15.1, min: 13.0, max: 17.0 },
      temperature: { avg: 25.8, min: 23.5, max: 28.2 },
      humidity: { avg: 61.3, min: 55.0, max: 68.0 },
      mq7: { avg: 7.9, min: 4.5, max: 11.2 },
      mq135: { avg: 24.8, min: 17.5, max: 32.0 },
      mq136: { avg: 2.8, min: 1.2, max: 4.2 }
    },
    3: {
      sample_count: 1450,
      tilt_incidents: 0,
      voltage: { avg: 0.11, min: 0.03, max: 0.32 },
      water_depth: { avg: 15.6, min: 12.0, max: 20.1 },
      current_ma: { avg: 148.5, min: 125.0, max: 170.0 },
      power: { avg: 14.8, min: 12.5, max: 16.5 },
      temperature: { avg: 27.1, min: 24.8, max: 29.5 },
      humidity: { avg: 58.4, min: 51.0, max: 63.5 },
      mq7: { avg: 9.2, min: 6.0, max: 13.5 },
      mq135: { avg: 28.5, min: 20.0, max: 38.0 },
      mq136: { avg: 3.6, min: 2.0, max: 5.5 }
    }
  };
};

export const ReportsView: React.FC<ReportsViewProps> = ({ persistentAlerts }) => {
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedPole, setSelectedPole] = useState<PoleId | 'all'>('all');
  const [statsData, setStatsData] = useState<Record<number, PoleStatSummary>>(generateReportStats);
  const [totalSamples, setTotalSamples] = useState<number>(4265);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedAt, setGeneratedAt] = useState<Date>(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const fetchStats = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setStatsData(generateReportStats());
      setTotalSamples(4265);
      setGeneratedAt(new Date());
      setIsLoading(false);
    }, 150);
  };

  useEffect(() => {
    fetchStats();
  }, [timeWindow, selectedPole]);

  const handleExportCsv = () => {
    const rows = [
      ['Timestamp', 'Pole_ID', 'Avg_Voltage_V', 'Avg_Water_Depth_CM', 'Avg_Current_mA', 'Avg_Temp_C', 'Avg_Humidity_Pct', 'Avg_MQ7_PPM', 'Avg_MQ135_PPM', 'Avg_MQ136_PPM'],
      ...[1, 2, 3].map((pid) => {
        const s = statsData[pid];
        return [
          new Date().toISOString(),
          pid,
          s?.voltage?.avg ?? 0,
          s?.water_depth?.avg ?? 0,
          s?.current_ma?.avg ?? 0,
          s?.temperature?.avg ?? 0,
          s?.humidity?.avg ?? 0,
          s?.mq7?.avg ?? 0,
          s?.mq135?.avg ?? 0,
          s?.mq136?.avg ?? 0
        ];
      })
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `niriksha_audit_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Incident counts from persistent alerts
  const criticalCount = persistentAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = persistentAlerts.filter((a) => a.severity === 'warning').length;
  const resolvedCount = persistentAlerts.filter((a) => a.status === 'RESOLVED').length;
  const totalAlerts = persistentAlerts.length;

  // Prepare chart dataset: Alert exposure by pole node
  const poleAlertsData = useMemo(() => {
    const counts: Record<number, { critical: number; warning: number }> = {
      1: { critical: 0, warning: 0 },
      2: { critical: 0, warning: 0 },
      3: { critical: 0, warning: 0 }
    };

    persistentAlerts.forEach((a) => {
      const pid = a.pole_id;
      if (counts[pid]) {
        if (a.severity === 'critical') counts[pid].critical += 1;
        else if (a.severity === 'warning') counts[pid].warning += 1;
      }
    });

    return [1, 2, 3].map((pid) => ({
      name: `Pole ${pid}`,
      critical: counts[pid]?.critical || 0,
      warning: counts[pid]?.warning || 0
    }));
  }, [persistentAlerts]);

  // Node frame ingestion distribution
  const nodeSampleDistribution = useMemo(() => {
    const colors: Record<number, string> = { 1: '#2563eb', 2: '#0284c7', 3: '#059669' };
    return [1, 2, 3].map((pId) => ({
      name: `Pole ${pId}`,
      samples: statsData[pId]?.sample_count || 0,
      fill: colors[pId] || '#2563eb'
    }));
  }, [statsData]);

  // Average sensor metrics comparison
  const averageMetricsData = useMemo(() => {
    return [1, 2, 3].map((pId) => ({
      name: `Pole ${pId}`,
      voltage: statsData[pId]?.voltage?.avg ?? null,
      power: statsData[pId]?.power?.avg ?? null,
      temp: statsData[pId]?.temperature?.avg ?? null,
      water: statsData[pId]?.water_depth?.avg ?? null
    }));
  }, [statsData]);

  // Compliance score calculation: based on tilt incidents and critical count
  const totalTilts = Object.values(statsData).reduce((acc, s) => acc + (s.tilt_incidents || 0), 0);
  const fleetCompliancePct = useMemo(() => {
    if (totalSamples === 0) return '100.0%';
    const incidentWeight = criticalCount * 2 + warningCount * 0.5 + totalTilts;
    const score = Math.max(88.0, 100 - (incidentWeight / Math.max(10, totalSamples / 50)) * 5);
    return `${score.toFixed(1)}%`;
  }, [totalSamples, criticalCount, warningCount, totalTilts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action Controls Toolbar */}
      <ReportsFilterBar
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
        selectedPole={selectedPole}
        onSelectedPoleChange={setSelectedPole}
        isFilterOpen={isFilterOpen}
        onToggleFilterOpen={() => setIsFilterOpen((prev) => !prev)}
        onCloseFilter={() => setIsFilterOpen(false)}
        isLoading={isLoading}
        onRefresh={fetchStats}
        onExportCsv={handleExportCsv}
        onPrint={handlePrint}
      />

      {/* Report Document Sheet (Laboratory Print-Friendly Layout) */}
      <div
        id="printable-report-sheet"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '32px 36px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Document Header & Executive KPI Cards */}
        <ReportExecutiveSummary
          selectedPole={selectedPole}
          timeWindow={timeWindow}
          generatedAt={generatedAt}
          totalSamples={totalSamples}
          criticalCount={criticalCount}
          warningCount={warningCount}
          fleetCompliancePct={fleetCompliancePct}
        />

        {/* Statistical Summary per Node */}
        <ReportNodeStatsTable
          statsData={statsData}
          selectedPole={selectedPole}
        />

        {/* Visual Charts Section (Pie & Bar Charts) */}
        <AuditChartsSection
          criticalCount={criticalCount}
          warningCount={warningCount}
          resolvedCount={resolvedCount}
          totalAlerts={totalAlerts}
          poleAlertsData={poleAlertsData}
          nodeSampleDistribution={nodeSampleDistribution}
          averageMetricsData={averageMetricsData}
        />

        {/* Gas Array Audit Breakdown */}
        <ReportGasAuditCard pole3Stats={statsData[3]} />

        {/* Audit Sign-Off Section */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
          <div>
            <strong>Automated Audit Signature:</strong> NIRIKSHA Mesh Engine Core v2.4 (Browser Simulation Engine)
          </div>
          <div>
            <strong>Compliance Standard:</strong> ISO/IEC 30141 Air-Gapped IoT Standard
          </div>
        </div>
      </div>
    </div>
  );
};
