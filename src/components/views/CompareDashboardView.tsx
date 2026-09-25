import React, { useState, useMemo } from 'react';
import {
  Zap,
  Waves,
  Gauge,
  Droplets,
  Wind
} from 'lucide-react';
import type { PoleId, TelemetryPacket, TimeRangeOption, PoleState } from '../../types/telemetry';
import { CompareChartCard } from '../charts/CompareChartCard';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../../constants/gasThresholds';
import { CompareControlsBar } from '../compare/CompareControlsBar';
import { CompareNodeSummaryCard } from '../compare/CompareNodeSummaryCard';
import { CompareMatrixTable, type ComparisonMetricRow } from '../compare/CompareMatrixTable';

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

  const [poleA, setPoleA] = useState<PoleId>(1);
  const [poleB, setPoleB] = useState<PoleId>(2);

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

    const allTimestamps = Array.from(
      new Set([...historyA.map((p) => p.timestamp), ...historyB.map((p) => p.timestamp)])
    ).sort((a, b) => a - b).slice(-40);

    const mapA = new Map(historyA.map((p) => [p.timestamp, p]));
    const mapB = new Map(historyB.map((p) => [p.timestamp, p]));

    const buildMetricPoints = (key: keyof TelemetryPacket) =>
      allTimestamps.map((ts) => {
        const pA = mapA.get(ts);
        const pB = mapB.get(ts);
        const d = new Date(ts * 1000);
        return {
          timestamp: ts,
          timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          valA: pA && pA[key] !== undefined && pA[key] !== null ? (pA[key] as number) : null,
          valB: pB && pB[key] !== undefined && pB[key] !== null ? (pB[key] as number) : null
        };
      });

    return {
      voltage: buildMetricPoints('voltage'),
      current: buildMetricPoints('current_ma'),
      waterDepth: buildMetricPoints('water_depth'),
      temperature: buildMetricPoints('temperature'),
      humidity: buildMetricPoints('humidity'),
      mq7: buildMetricPoints('mq7'),
      mq135: buildMetricPoints('mq135'),
      mq136: buildMetricPoints('mq136')
    };
  }, [poleA, poleB, timeRange, telemetryHistory, historicalData]);

  // Metric Comparison Table Rows
  const comparisonMetrics: ComparisonMetricRow[] = [
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
      isHazardA: !!(latestA?.temperature && latestA.temperature > gasThresholds.temp),
      isHazardB: !!(latestB?.temperature && latestB.temperature > gasThresholds.temp)
    },
    {
      label: 'Relative Humidity',
      key: 'humidity',
      unit: '%',
      valA: latestA?.humidity,
      valB: latestB?.humidity,
      icon: Droplets,
      isHazardA: !!(latestA?.humidity && latestA.humidity > gasThresholds.humidity),
      isHazardB: !!(latestB?.humidity && latestB.humidity > gasThresholds.humidity)
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
      label: 'Air Quality (MQ-135)',
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
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
      {/* Top Controls Bar */}
      <CompareControlsBar
        poleA={poleA}
        poleB={poleB}
        onSelectPoleA={setPoleA}
        onSelectPoleB={setPoleB}
        onSwapPoles={handleSwapPoles}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        poleStateMap={poleStateMap}
      />

      {/* Side-by-Side Node Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <CompareNodeSummaryCard
          label="Node A Reference"
          poleId={poleA}
          poleInfo={POLE_INFO[poleA]}
          latest={latestA}
          state={stateA}
          accentColor="#2563eb"
          borderColor="#bfdbfe"
          shadowColor="rgba(37,99,235,0.08)"
        />
        <CompareNodeSummaryCard
          label="Node B Reference"
          poleId={poleB}
          poleInfo={POLE_INFO[poleB]}
          latest={latestB}
          state={stateB}
          accentColor="#ea580c"
          borderColor="#fed7aa"
          shadowColor="rgba(234,88,12,0.08)"
        />
      </div>

      {/* Side-by-Side Matrix Comparison Table */}
      <CompareMatrixTable
        poleA={poleA}
        poleB={poleB}
        metrics={comparisonMetrics}
      />

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
          <CompareChartCard
            title="Air Quality (MQ-135) Comparison"
            metricKey="mq135"
            unit="ppm"
            poleAId={poleA}
            poleBId={poleB}
            poleAName={POLE_INFO[poleA].name}
            poleBName={POLE_INFO[poleB].name}
            colorA="#2563eb"
            colorB="#ea580c"
            timeRange={timeRange}
            data={comparisonTimeSeries.mq135}
            latestValA={latestA?.mq135 ?? null}
            latestValB={latestB?.mq135 ?? null}
          />
        </div>
      </div>
    </div>
  );
};
