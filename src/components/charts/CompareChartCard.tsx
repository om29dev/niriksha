import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { TimeRangeOption, PoleId } from '../../types/telemetry';

interface CompareChartCardProps {
  title: string;
  metricKey: string;
  unit: string;
  poleAId: PoleId;
  poleBId: PoleId;
  poleAName: string;
  poleBName: string;
  colorA?: string;
  colorB?: string;
  timeRange: TimeRangeOption;
  data: Array<{
    timeLabel: string;
    timestamp: number;
    valA: number | null;
    valB: number | null;
  }>;
  latestValA: number | null;
  latestValB: number | null;
}

export const CompareChartCard: React.FC<CompareChartCardProps> = ({
  title,
  unit,
  poleAId,
  poleBId,
  poleAName,
  poleBName,
  colorA = '#2563eb', // Cobalt Blue
  colorB = '#ea580c', // High contrast Orange/Amber
  timeRange: _timeRange,
  data,
  latestValA,
  latestValB
}) => {
  const isANotConnected = latestValA === null || latestValA === undefined;
  const isBNotConnected = latestValB === null || latestValB === undefined;
  const isBothNotConnected = isANotConnected && isBNotConnected;

  // Calculate combined domain
  const yDomain = useMemo<[number | 'auto', number | 'auto']>(() => {
    const validValues = data
      .flatMap((d) => [d.valA, d.valB])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    if (validValues.length === 0) return [0, 10];

    const min = Math.min(...validValues);
    const max = Math.max(...validValues);

    if (min === max) {
      if (min === 0) return [0, 10];
      return [Math.max(0, Math.floor(min * 0.8)), Math.ceil(max * 1.2)];
    }

    const padding = (max - min) * 0.15;
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [data]);

  // Delta calculation if both valid
  const delta = useMemo(() => {
    if (latestValA !== null && latestValB !== null) {
      const diff = latestValA - latestValB;
      return diff;
    }
    return null;
  }, [latestValA, latestValB]);

  return (
    <div
      className="lab-card"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        minHeight: '380px',
        height: '100%'
      }}
    >
      {/* Header with Title and Live Values of both poles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            {title}
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: '#f1f5f9',
              color: '#475569'
            }}
          >
            {unit || 'Value'}
          </span>
        </div>

        {/* Live Metrics Comparison Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Pole A */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#eff6ff',
              border: `1px solid ${colorA}33`,
              borderRadius: '6px',
              padding: '4px 10px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colorA }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
              Pole {poleAId}:
            </span>
            {latestValA !== null ? (
              <span style={{ fontSize: '13px', fontWeight: '700', color: colorA }}>
                {latestValA} {unit}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                Not Connected
              </span>
            )}
          </div>

          {/* Pole B */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fff7ed',
              border: `1px solid ${colorB}33`,
              borderRadius: '6px',
              padding: '4px 10px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colorB }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
              Pole {poleBId}:
            </span>
            {latestValB !== null ? (
              <span style={{ fontSize: '13px', fontWeight: '700', color: colorB }}>
                {latestValB} {unit}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                Not Connected
              </span>
            )}
          </div>

          {/* Differential delta pill */}
          {delta !== null && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
              title={`Difference (Pole ${poleAId} - Pole ${poleBId})`}
            >
              Δ: <span style={{ color: delta >= 0 ? '#2563eb' : '#ea580c', fontWeight: '700' }}>
                {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} {unit}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div style={{ flex: 1, minHeight: '260px', width: '100%', position: 'relative' }}>
        {isBothNotConnected && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(2px)',
              zIndex: 10,
              borderRadius: '6px'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                Both Nodes Disconnected
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
              Neither Pole {poleAId} nor Pole {poleBId} stream {title.toLowerCase()} telemetry
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              minTickGap={45}
              dy={6}
            />
            <YAxis
              domain={yDomain}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              dx={-4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
                fontSize: '12px',
                padding: '8px 12px'
              }}
              formatter={(val: any, name: any) => [
                val !== null && val !== undefined ? `${val} ${unit}` : 'Not Connected',
                name === 'valA' ? `Pole ${poleAId} (${poleAName})` : `Pole ${poleBId} (${poleBName})`
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              formatter={(value) => {
                if (value === 'valA') return <span style={{ color: colorA, fontWeight: '600' }}>Pole {poleAId} ({poleAName})</span>;
                if (value === 'valB') return <span style={{ color: colorB, fontWeight: '600' }}>Pole {poleBId} ({poleBName})</span>;
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="valA"
              stroke={colorA}
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 5, fill: colorA }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="valB"
              stroke={colorB}
              strokeWidth={2.4}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 5, fill: colorB }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
