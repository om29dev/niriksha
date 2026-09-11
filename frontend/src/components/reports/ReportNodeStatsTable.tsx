import React from 'react';
import type { PoleId } from '../../types/telemetry';

export interface MetricStat {
  min: number | null;
  max: number | null;
  avg: number | null;
}

export interface PoleStatSummary {
  sample_count: number;
  tilt_incidents: number;
  temperature: MetricStat;
  humidity: MetricStat;
  water_depth: MetricStat;
  voltage: MetricStat;
  current_ma: MetricStat;
  power: MetricStat;
  mq7: MetricStat;
  mq135: MetricStat;
  mq136: MetricStat;
}

interface ReportNodeStatsTableProps {
  statsData: Record<number, PoleStatSummary>;
  selectedPole: PoleId | 'all';
}

export const ReportNodeStatsTable: React.FC<ReportNodeStatsTableProps> = ({
  statsData,
  selectedPole
}) => {
  return (
    <div className="print-avoid-break">
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
        1. Statistical Sensor Distribution per Node
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '10px 12px' }}>Pole Node</th>
              <th style={{ padding: '10px 12px' }}>Samples</th>
              <th style={{ padding: '10px 12px' }}>Voltage (V) [Min / Avg / Max]</th>
              <th style={{ padding: '10px 12px' }}>Water Depth (cm) [Min / Avg / Max]</th>
              <th style={{ padding: '10px 12px' }}>Active Power (W) [Avg / Max]</th>
              <th style={{ padding: '10px 12px' }}>Temp / Humidity [Avg]</th>
              <th style={{ padding: '10px 12px' }}>Tilt Incidents</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((pId) => {
              const pData = statsData[pId];
              if (!pData && selectedPole !== 'all' && Number(selectedPole) !== pId) return null;

              return (
                <tr key={pId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>
                    Pole {pId}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b' }}>
                    {pData?.sample_count ? pData.sample_count.toLocaleString() : '0'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {pData?.voltage.min !== null && pData?.voltage.min !== undefined
                      ? `${pData.voltage.min.toFixed(1)} / ${pData.voltage.avg?.toFixed(1)} / ${pData.voltage.max?.toFixed(1)} V`
                      : <span style={{ color: '#94a3b8' }}>Not Connected</span>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {pData?.water_depth.min !== null && pData?.water_depth.min !== undefined
                      ? `${pData.water_depth.min.toFixed(1)} / ${pData.water_depth.avg?.toFixed(1)} / ${pData.water_depth.max?.toFixed(1)} cm`
                      : <span style={{ color: '#94a3b8' }}>Not Connected</span>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {pData?.power.avg !== null && pData?.power.avg !== undefined
                      ? `${pData.power.avg.toFixed(1)} W / ${pData.power.max?.toFixed(1)} W`
                      : <span style={{ color: '#94a3b8' }}>Not Connected</span>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {pData?.temperature.avg !== null && pData?.temperature.avg !== undefined
                      ? `${pData.temperature.avg.toFixed(1)}°C / ${pData.humidity.avg?.toFixed(1)}%`
                      : <span style={{ color: '#94a3b8' }}>Not Connected</span>}
                  </td>
                  <td style={{ padding: '12px', fontWeight: '600', color: pData?.tilt_incidents ? '#dc2626' : '#059669' }}>
                    {pData?.tilt_incidents || 0}
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
