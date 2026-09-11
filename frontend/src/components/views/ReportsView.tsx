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

export const ReportsView: React.FC<ReportsViewProps> = ({ persistentAlerts }) => {
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedPole, setSelectedPole] = useState<PoleId | 'all'>('all');
  const [statsData, setStatsData] = useState<Record<number, PoleStatSummary>>({});
  const [totalSamples, setTotalSamples] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedAt, setGeneratedAt] = useState<Date>(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const now = Date.now() / 1000;
      let duration = 24 * 3600;
      if (timeWindow === '1h') duration = 3600;
      else if (timeWindow === '6h') duration = 6 * 3600;
      else if (timeWindow === '7d') duration = 7 * 24 * 3600;

      const sinceTimestamp = now - duration;
      let url = `http://127.0.0.1:8000/api/telemetry/stats?since_timestamp=${sinceTimestamp}`;
      if (selectedPole !== 'all') {
        url += `&pole_id=${selectedPole}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json && json.poles) {
        setStatsData(json.poles);
        setTotalSamples(json.sample_count || 0);
        setGeneratedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to load telemetry stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeWindow, selectedPole]);

  const handleExportCsv = () => {
    const now = Date.now() / 1000;
    let duration = 24 * 3600;
    if (timeWindow === '1h') duration = 3600;
    else if (timeWindow === '6h') duration = 6 * 3600;
    else if (timeWindow === '7d') duration = 7 * 24 * 3600;

    const sinceTimestamp = now - duration;
    let url = `http://127.0.0.1:8000/api/telemetry/export?since_timestamp=${sinceTimestamp}&limit=2000`;
    if (selectedPole !== 'all') {
      url += `&pole_id=${selectedPole}`;
    }
    window.open(url, '_blank');
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
            <strong>Automated Audit Signature:</strong> NIRIKSHA Mesh Engine Core v2.4
          </div>
          <div>
            <strong>Compliance Standard:</strong> ISO/IEC 30141 Air-Gapped IoT Standard
          </div>
        </div>
      </div>
    </div>
  );
};
