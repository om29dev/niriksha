import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Zap,
  Waves,
  Gauge,
  Droplets,
  Wind,
  Flame
} from 'lucide-react';
import type { PoleId, TelemetryPacket, TimeRangeOption, PoleState } from '../../types/telemetry';
import { CompareChartCard } from '../charts/CompareChartCard';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../../constants/gasThresholds';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

interface CompareDashboardViewProps {
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  telemetryHistory: TelemetryPacket[];
  historicalData: TelemetryPacket[];
  timeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  poleStateMap: Record<PoleId, PoleState>;
  gasThresholds?: Partial<GasThresholdConfig>;
}

const POLE_INFO: Record<PoleId, { name: string; role: string; sensors: string }> = {
  1: {
    name: 'Submersion & Flood Sensing',
    role: 'Leaf Sensor Node',
    sensors: 'Voltage Probes (ZMPT101B) • Ultrasonic Depth • SW-520D Tilt'
  },
  2: {
    name: 'Grid & Power Monitoring',
    role: 'Leaf Sensor Node',
    sensors: 'PZEM-004T Meter (Voltage, Current, Power) • SW-520D Tilt'
  },
  3: {
    name: 'Gateway Hub & Weather',
    role: 'Gateway Master Node',
    sensors: 'MQ Multi-Gas Array • DHT11 Thermal & Humidity • Mesh Gateway'
  }
};

export const CompareDashboardView: React.FC<CompareDashboardViewProps> = ({
  latestPole1,
  latestPole2,
  latestPole3,
  telemetryHistory,
  historicalData,
  timeRange,
  onTimeRangeChange,
  poleStateMap,
  gasThresholds: customThresholds
}) => {
  const gasThresholds = { ...DEFAULT_GAS_THRESHOLDS, ...customThresholds };

  // Select two poles to compare
  const [poleA, setPoleA] = useState<PoleId>(1);
  const [poleB, setPoleB] = useState<PoleId>(2);

  // Quick swap function
  const handleSwapPoles = () => {
    const temp = poleA;
    setPoleA(poleB);
    setPoleB(temp);
  };

  const getLatest = (id: PoleId): TelemetryPacket | null => {
    if (id === 1) return latestPole1;
    if (id === 2) return latestPole2;
    if (id === 3) return latestPole3;
    return null;
  };

  const latestA = getLatest(poleA);
  const latestB = getLatest(poleB);
  const stateA = poleStateMap[poleA];
  const stateB = poleStateMap[poleB];

  // Merge history streams for poleA and poleB
  const comparisonTimeSeries = useMemo(() => {
    const rawDataSource = timeRange === 'realtime' ? telemetryHistory : historicalData;
    const historyA = rawDataSource.filter((p) => p.pole_id === poleA);
    const historyB = rawDataSource.filter((p) => p.pole_id === poleB);

    // Group or match chronologically
    // Max 40 points sliding window for smooth 60fps rendering
    const allTimestamps = Array.from(
      new Set([...historyA.map((p) => p.timestamp), ...historyB.map((p) => p.timestamp)])
    ).sort((a, b) => a - b).slice(-40);

    const mapA = new Map(historyA.map((p) => [p.timestamp, p]));
    const mapB = new Map(historyB.map((p) => [p.timestamp, p]));

    return {
      voltage: allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA.voltage !== undefined && pA.voltage !== null ? pA.voltage : null,
          valB: pB && pB.voltage !== undefined && pB.voltage !== null ? pB.voltage : null
        };
      }),
      current: allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA.current_ma !== undefined && pA.current_ma !== null ? pA.current_ma : null,
          valB: pB && pB.current_ma !== undefined && pB.current_ma !== null ? pB.current_ma : null
        };
      }),
      waterDepth: allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA.water_depth !== undefined && pA.water_depth !== null ? pA.water_depth : null,
          valB: pB && pB.water_depth !== undefined && pB.water_depth !== null ? pB.water_depth : null
        };
      }),
      temperature: allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA.temperature !== undefined && pA.temperature !== null ? pA.temperature : null,
          valB: pB && pB.temperature !== undefined && pB.temperature !== null ? pB.temperature : null
        };
      }),
      humidity: allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA.humidity !== undefined && pA.humidity !== null ? pA.humidity : null,
          valB: pB && pB.humidity !== undefined && pB.humidity !== null ? pB.humidity : null
        };
      }),
      mq7: allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA.mq7 !== undefined && pA.mq7 !== null ? pA.mq7 : null,
          valB: pB && pB.mq7 !== undefined && pB.mq7 !== null ? pB.mq7 : null
        };
      }),
      mq135: allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA.mq135 !== undefined && pA.mq135 !== null ? pA.mq135 : null,
          valB: pB && pB.mq135 !== undefined && pB.mq135 !== null ? pB.mq135 : null
        };
      }),
      mq136: allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA.mq136 !== undefined && pA.mq136 !== null ? pA.mq136 : null,
          valB: pB && pB.mq136 !== undefined && pB.mq136 !== null ? pB.mq136 : null
        };
      }),
      mq2: allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA.mq2 !== undefined && pA.mq2 !== null ? pA.mq2 : null,
          valB: pB && pB.mq2 !== undefined && pB.mq2 !== null ? pB.mq2 : null
        };
      })
    };
  }, [poleA, poleB, timeRange, telemetryHistory, historicalData]);

  // Metric Comparison Table Rows
  const comparisonMetrics = [
    {
      label: 'AC Voltage',
      key: 'voltage',
      unit: 'V',
      valA: latestA?.voltage,
      valB: latestB?.voltage,
      icon: Zap,
      isHazardA: latestA?.voltage !== null && latestA?.voltage !== undefined && latestA.voltage > 5.0,
      isHazardB: latestB?.voltage !== null && latestB?.voltage !== undefined && latestB.voltage > 5.0
    },
    {
      label: 'Electric Current',
      key: 'current_ma',
      unit: 'A',
      valA: latestA?.current_ma,
      valB: latestB?.current_ma,
      icon: Zap,
      isHazardA: false,
      isHazardB: false
    },
    {
      label: 'Water Submersion Depth',
      key: 'water_depth',
      unit: 'cm',
      valA: latestA?.water_depth,
      valB: latestB?.water_depth,
      icon: Waves,
      isHazardA: !!(latestA?.water_depth && latestA.water_depth > 100),
      isHazardB: !!(latestB?.water_depth && latestB.water_depth > 100)
    },
    {
      label: 'Ambient Temperature',
      key: 'temperature',
      unit: '°C',
      valA: latestA?.temperature,
      valB: latestB?.temperature,
      icon: Gauge,
      isHazardA: !!(latestA?.temperature && latestA.temperature > 45),
      isHazardB: !!(latestB?.temperature && latestB.temperature > 45)
    },
    {
      label: 'Relative Humidity',
      key: 'humidity',
      unit: '%',
      valA: latestA?.humidity,
      valB: latestB?.humidity,
      icon: Droplets,
      isHazardA: !!(latestA?.humidity && latestA.humidity > 85),
      isHazardB: !!(latestB?.humidity && latestB.humidity > 85)
    },
    {
      label: 'Carbon Monoxide (MQ-7)',
      key: 'mq7',
      unit: 'ppm',
      valA: latestA?.mq7,
      valB: latestB?.mq7,
      icon: Wind,
      isHazardA: !!(latestA?.mq7 && latestA.mq7 > gasThresholds.mq7),
      isHazardB: !!(latestB?.mq7 && latestB.mq7 > gasThresholds.mq7)
    },
    {
      label: 'Air Quality Index (MQ-135)',
      key: 'mq135',
      unit: 'ppm',
      valA: latestA?.mq135,
      valB: latestB?.mq135,
      icon: Wind,
      isHazardA: !!(latestA?.mq135 && latestA.mq135 > gasThresholds.mq135),
      isHazardB: !!(latestB?.mq135 && latestB.mq135 > gasThresholds.mq135)
    },
    {
      label: 'Sewage Gas H2S (MQ-136)',
      key: 'mq136',
      unit: 'ppm',
      valA: latestA?.mq136,
      valB: latestB?.mq136,
      icon: Wind,
      isHazardA: !!(latestA?.mq136 && latestA.mq136 > gasThresholds.mq136),
      isHazardB: !!(latestB?.mq136 && latestB.mq136 > gasThresholds.mq136)
    },
    {
      label: 'Combustible Gas (MQ-2)',
      key: 'mq2',
      unit: 'ppm',
      valA: latestA?.mq2,
      valB: latestB?.mq2,
      icon: Flame,
      isHazardA: !!(latestA?.mq2 && latestA.mq2 > gasThresholds.mq2),
      isHazardB: !!(latestB?.mq2 && latestB.mq2 > gasThresholds.mq2)
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
      {/* Top Controls Bar: Node Selection & Range */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        {/* Pole Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
              Primary Node (A):
            </span>
            <PoleSelectDropdown
              poles={DEFAULT_POLES}
              selectedPoleId={poleA}
              onSelectPole={(id) => setPoleA(id as PoleId)}
              poleStateMap={poleStateMap}
              accentColor="#2563eb"
              width="210px"
              size="sm"
            />
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapPoles}
            title="Swap Pole A and Pole B"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#334155',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeftRight style={{ width: '14px', height: '14px', color: '#2563eb' }} />
            Swap
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
              Comparative Node (B):
            </span>
            <PoleSelectDropdown
              poles={DEFAULT_POLES}
              selectedPoleId={poleB}
              onSelectPole={(id) => setPoleB(id as PoleId)}
              poleStateMap={poleStateMap}
              accentColor="#ea580c"
              width="210px"
              size="sm"
            />
          </div>
        </div>

        {/* Time Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Time Horizon:</span>
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
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: isSelected ? '700' : '500',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#2563eb' : '#64748b',
                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side-by-Side Node Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Node A Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #bfdbfe',
            borderLeft: '5px solid #2563eb',
            borderRadius: '8px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(37,99,235,0.08)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' }}>
                Node A Reference
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '2px 0 0 0' }}>
                Pole {poleA}: {POLE_INFO[poleA].name}
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                {POLE_INFO[poleA].role}
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
                  backgroundColor: stateA?.isOffline ? '#fef2f2' : '#ecfdf5',
                  color: stateA?.isOffline ? '#dc2626' : '#059669',
                  border: stateA?.isOffline ? '1px solid #fecaca' : '1px solid #a7f3d0'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: stateA?.isOffline ? '#ef4444' : '#10b981'
                  }}
                />
                {stateA?.isOffline ? 'Offline' : 'Online'}
              </span>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Seq #{latestA?.seq ?? '—'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
            <strong>Sensors:</strong> {POLE_INFO[poleA].sensors}
          </div>
        </div>

        {/* Node B Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fed7aa',
            borderLeft: '5px solid #ea580c',
            borderRadius: '8px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(234,88,12,0.08)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#ea580c', textTransform: 'uppercase' }}>
                Node B Reference
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '2px 0 0 0' }}>
                Pole {poleB}: {POLE_INFO[poleB].name}
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                {POLE_INFO[poleB].role}
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
                  backgroundColor: stateB?.isOffline ? '#fef2f2' : '#ecfdf5',
                  color: stateB?.isOffline ? '#dc2626' : '#059669',
                  border: stateB?.isOffline ? '1px solid #fecaca' : '1px solid #a7f3d0'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: stateB?.isOffline ? '#ef4444' : '#10b981'
                  }}
                />
                {stateB?.isOffline ? 'Offline' : 'Online'}
              </span>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Seq #{latestB?.seq ?? '—'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
            <strong>Sensors:</strong> {POLE_INFO[poleB].sensors}
          </div>
        </div>
      </div>

      {/* Side-by-Side Matrix Comparison Table */}
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
              {comparisonMetrics.map((row, idx) => {
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

      {/* Comparative Graphs Grid (Dual lines for Pole A & Pole B) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Synchronized Comparison Curves
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Blue Solid: Pole {poleA} • Orange Dashed: Pole {poleB}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 540px), 1fr))',
            gap: '20px'
          }}
        >
          {/* 1. Voltage Comparison */}
          <CompareChartCard
            title="AC Voltage Comparison"
            metricKey="voltage"
            unit="V"
            poleAId={poleA}
            poleBId={poleB}
            poleAName={POLE_INFO[poleA].name}
            poleBName={POLE_INFO[poleB].name}
            colorA="#2563eb"
            colorB="#ea580c"
            timeRange={timeRange}
            data={comparisonTimeSeries.voltage}
            latestValA={latestA?.voltage ?? null}
            latestValB={latestB?.voltage ?? null}
          />

          {/* 2. Electric Current Comparison */}
          <CompareChartCard
            title="Electric Current Comparison"
            metricKey="current_ma"
            unit="A"
            poleAId={poleA}
            poleBId={poleB}
            poleAName={POLE_INFO[poleA].name}
            poleBName={POLE_INFO[poleB].name}
            colorA="#2563eb"
            colorB="#ea580c"
            timeRange={timeRange}
            data={comparisonTimeSeries.current}
            latestValA={latestA?.current_ma ?? null}
            latestValB={latestB?.current_ma ?? null}
          />

          {/* 3. Water Submersion Comparison */}
          <CompareChartCard
            title="Water Submersion Depth Comparison"
            metricKey="water_depth"
            unit="cm"
            poleAId={poleA}
            poleBId={poleB}
            poleAName={POLE_INFO[poleA].name}
            poleBName={POLE_INFO[poleB].name}
            colorA="#2563eb"
            colorB="#ea580c"
            timeRange={timeRange}
            data={comparisonTimeSeries.waterDepth}
            latestValA={latestA?.water_depth ?? null}
            latestValB={latestB?.water_depth ?? null}
          />

          {/* 4. Ambient Temperature Comparison */}
          <CompareChartCard
            title="Thermal Curve Comparison"
            metricKey="temperature"
            unit="°C"
            poleAId={poleA}
            poleBId={poleB}
            poleAName={POLE_INFO[poleA].name}
            poleBName={POLE_INFO[poleB].name}
            colorA="#2563eb"
            colorB="#ea580c"
            timeRange={timeRange}
            data={comparisonTimeSeries.temperature}
            latestValA={latestA?.temperature ?? null}
            latestValB={latestB?.temperature ?? null}
          />

          {/* 5. Carbon Monoxide Comparison */}
          <CompareChartCard
            title="Carbon Monoxide (MQ-7) Comparison"
            metricKey="mq7"
            unit="ppm"
            poleAId={poleA}
            poleBId={poleB}
            poleAName={POLE_INFO[poleA].name}
            poleBName={POLE_INFO[poleB].name}
            colorA="#2563eb"
            colorB="#ea580c"
            timeRange={timeRange}
            data={comparisonTimeSeries.mq7}
            latestValA={latestA?.mq7 ?? null}
            latestValB={latestB?.mq7 ?? null}
          />

          {/* 6. Combustible Gas (MQ-2) Comparison */}
          <CompareChartCard
            title="Smoke & Combustible Gas (MQ-2) Comparison"
            metricKey="mq2"
            unit="ppm"
            poleAId={poleA}
            poleBId={poleB}
            poleAName={POLE_INFO[poleA].name}
            poleBName={POLE_INFO[poleB].name}
            colorA="#2563eb"
            colorB="#ea580c"
            timeRange={timeRange}
            data={comparisonTimeSeries.mq2}
            latestValA={latestA?.mq2 ?? null}
            latestValB={latestB?.mq2 ?? null}
          />
        </div>
      </div>
    </div>
  );
};
