import React from 'react';
import { Check } from 'lucide-react';
import type { MetricDefinition, ChartDefinition, MetricKey, ChartKey } from '../../types/dashboard';

interface AddWidgetOptionsGridProps {
  cardType: 'metric' | 'chart';
  filteredMetrics: MetricDefinition[];
  filteredCharts: ChartDefinition[];
  selectedMetric: MetricKey;
  selectedChart: ChartKey;
  onSelectMetric: (key: MetricKey) => void;
  onSelectChart: (key: ChartKey) => void;
}

export const AddWidgetOptionsGrid: React.FC<AddWidgetOptionsGridProps> = ({
  cardType,
  filteredMetrics,
  filteredCharts,
  selectedMetric,
  selectedChart,
  onSelectMetric,
  onSelectChart
}) => {
  const items = cardType === 'metric'
    ? filteredMetrics.map((m) => ({
        key: m.key,
        title: m.title,
        subtitle: m.subtitle,
        unit: m.unit,
        isSelected: selectedMetric === m.key,
        onSelect: () => onSelectMetric(m.key)
      }))
    : filteredCharts.map((c) => ({
        key: c.key,
        title: c.title,
        subtitle: c.subtitle,
        unit: c.unit,
        isSelected: selectedChart === c.key,
        onSelect: () => onSelectChart(c.key)
      }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '2px' }}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onSelect}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '8px 10px',
            borderRadius: '6px',
            border: `1.5px solid ${item.isSelected ? '#2563eb' : '#e2e8f0'}`,
            backgroundColor: item.isSelected ? '#eff6ff' : '#f8fafc',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: item.isSelected ? '#1d4ed8' : '#1e293b' }}>{item.title}</span>
            {item.isSelected && <Check style={{ width: '12px', height: '12px', color: '#2563eb' }} />}
          </div>
          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{item.subtitle}</span>
          {item.unit && <span style={{ fontSize: '9px', fontWeight: '600', color: '#2563eb', marginTop: '2px' }}>[{item.unit}]</span>}
        </button>
      ))}
    </div>
  );
};
