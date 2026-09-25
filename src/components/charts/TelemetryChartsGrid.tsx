import React from 'react';
import type { PoleId, TimeRangeOption } from '../../types/telemetry';
import { TelemetryChart } from './TelemetryChart';

interface TelemetryChartsGridProps {
  activePoleTab: PoleId;
  timeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  poleHistory: any[];
}

export const TelemetryChartsGrid: React.FC<TelemetryChartsGridProps> = ({
  activePoleTab,
  timeRange,
  onTimeRangeChange,
  poleHistory
}) => {
  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))',
      gap: '20px'
    }}>
      {/* Graph 1: Voltage Curve */}
      <TelemetryChart
        title="Voltage Curve"
        subtitle="Electrical potential in Volts"
        dataKey="voltage"
        unit="V"
        strokeColor="#d97706"
        activePoleTab={activePoleTab}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        data={poleHistory}
      />

      {/* Graph 2: Current Curve */}
      <TelemetryChart
        title="Current Curve"
        subtitle="Electrical current in Amperes"
        dataKey="current_ma"
        unit="A"
        strokeColor="#7c3aed"
        activePoleTab={activePoleTab}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        data={poleHistory}
      />

      {/* Graph 3: Water Depth Curve */}
      <TelemetryChart
        title="Water Depth Curve"
        subtitle="Submersion level in cm"
        dataKey="water_depth"
        unit="cm"
        strokeColor="#0284c7"
        activePoleTab={activePoleTab}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        data={poleHistory}
      />

      {/* Graph 4: Temperature Curve */}
      <TelemetryChart
        title="Temperature Curve"
        subtitle="Ambient thermal reading in °C"
        dataKey="temperature"
        unit="°C"
        strokeColor="#2563eb"
        activePoleTab={activePoleTab}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        data={poleHistory}
      />
    </section>
  );
};
