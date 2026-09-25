import React, { useId, useMemo } from 'react';
import { GripVertical, X } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { PoleId, TimeRangeOption } from '../../types/telemetry';

interface TelemetryChartProps {
  title: string;
  subtitle?: string;
  dataKey: string;
  unit: string;
  strokeColor: string;
  activePoleTab?: PoleId;
  timeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  data: any[];
  onRemove?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
  isDragging?: boolean;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  title,
  subtitle: _subtitle,
  dataKey,
  unit,
  strokeColor,
  timeRange,
  onTimeRangeChange,
  data,
  onRemove,
  dragHandleProps,
  isDragging = false
}) => {
  const gradientId = useId().replace(/:/g, '');

  // Calculate dynamic domain with buffer so the curve never clips at the top or bottom
  const yDomain = useMemo<[number | 'auto', number | 'auto']>(() => {
    const validValues = data
      .map((d) => d[dataKey])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    if (validValues.length === 0) return [0, 'auto'];

    const min = Math.min(...validValues);
    const max = Math.max(...validValues);

    // If values are constant (e.g. 0V), show a sensible clean range
    if (min === max) {
      if (min === 0) return [0, 10];
      return [Math.floor(min * 0.8), Math.ceil(max * 1.2)];
    }

    const padding = (max - min) * 0.15;
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [data, dataKey]);

  // Current latest reading for quick reference in header
  const latestValue = useMemo(() => {
    for (let i = data.length - 1; i >= 0; i--) {
      const v = data[i]?.[dataKey];
      if (v !== undefined && v !== null && !isNaN(v)) {
        return v;
      }
    }
    return null;
  }, [data, dataKey]);

  return (
    <div
      className="lab-card"
      style={{
        height: '100%',
        width: '100%',
        minHeight: '360px',
        display: 'flex',
        flexDirection: 'column',
        borderColor: isDragging ? '#3b82f6' : '#e2e8f0',
        backgroundColor: '#ffffff',
        opacity: isDragging ? 0.4 : 1,
        padding: '16px 20px',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        boxShadow: isDragging ? '0 10px 25px -5px rgba(59, 130, 246, 0.25)' : '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      {/* Chart Header Bar */}
      <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {dragHandleProps && (
            <span
              {...dragHandleProps}
              title="Drag to reposition chart"
              style={{
                cursor: 'grab',
                display: 'inline-flex',
                alignItems: 'center',
                color: '#94a3b8',
                padding: '2px',
                borderRadius: '4px'
              }}
            >
              <GripVertical style={{ width: '16px', height: '16px' }} />
            </span>
          )}
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            {title}
          </h3>
        </div>

        {/* Right Controls: Time Range Pills + Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Segmented Pill Selector for Time Range */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              gap: '2px'
            }}
          >
            {[
              { label: 'Live', value: 'realtime' as const },
              { label: '1h', value: '1h' as const },
              { label: '6h', value: '6h' as const },
              { label: '24h', value: '24h' as const }
            ].map((opt) => {
              const isSelected = timeRange === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onTimeRangeChange(opt.value)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: isSelected ? '700' : '500',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#2563eb' : '#64748b',
                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove chart from dashboard"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '3px',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ flex: 1, minHeight: '260px', width: '100%', position: 'relative' }}>
        {latestValue === null && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
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
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#cbd5e1'
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                Sensor Not Connected
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
              This node does not carry or stream {title.toLowerCase()} telemetry
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

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
              formatter={(val: any) => [`${val} ${unit}`, title]}
              labelFormatter={(val, payload) => {
                const item = payload && payload[0]?.payload;
                return item ? `${item.formattedTime} (Seq #${item.seq})` : `${val}`;
              }}
            />

            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={2.2}
              fill={`url(#${gradientId})`}
              fillOpacity={1}
              isAnimationActive={false}
              connectNulls={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
