import React, { useState } from 'react';
import { X, Plus, Activity, LineChart } from 'lucide-react';
import type { PoleId } from '../../types/telemetry';
import type { CardType, MetricKey, ChartKey, DashboardCardConfig, SensorDomain } from '../../types/dashboard';
import { AVAILABLE_METRICS, AVAILABLE_CHARTS } from '../../constants/dashboardDefaults';
import { AddWidgetDomainTabs } from './AddWidgetDomainTabs';
import { AddWidgetOptionsGrid } from './AddWidgetOptionsGrid';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: DashboardCardConfig) => void;
  activePoleDefault: PoleId;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({
  isOpen,
  onClose,
  onAddCard,
  activePoleDefault
}) => {
  const [cardType, setCardType] = useState<CardType>('metric');
  const [activeDomain, setActiveDomain] = useState<SensorDomain>('electrical');
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('voltage');
  const [selectedChart, setSelectedChart] = useState<ChartKey>('voltage');

  if (!isOpen) return null;

  const handleAdd = () => {
    const uniqueId = `${cardType === 'metric' ? 'm' : 'c'}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    if (cardType === 'metric') {
      onAddCard({
        id: uniqueId,
        type: 'metric',
        metricKey: selectedMetric,
        poleId: activePoleDefault,
        colSpan: 1,
        rowSpan: 1
      });
    } else {
      onAddCard({
        id: uniqueId,
        type: 'chart',
        chartKey: selectedChart,
        poleId: activePoleDefault,
        colSpan: 2,
        rowSpan: 2
      });
    }
    onClose();
  };

  const filteredMetrics = AVAILABLE_METRICS.filter((m) => m.domain === activeDomain);
  const filteredCharts = AVAILABLE_CHARTS.filter((c) => c.domain === activeDomain);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '560px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Add Sensor Card to Grid</h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Assign live metric reading or dynamic chart curve</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Card Type Selector (Metric 1x1 vs Chart 2x2) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setCardType('metric')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              borderRadius: '6px',
              border: `2px solid ${cardType === 'metric' ? '#2563eb' : '#e2e8f0'}`,
              backgroundColor: cardType === 'metric' ? '#eff6ff' : '#ffffff',
              color: cardType === 'metric' ? '#1d4ed8' : '#475569',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Activity style={{ width: '15px', height: '15px' }} />
            Value Card (1x1)
          </button>
          <button
            type="button"
            onClick={() => setCardType('chart')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              borderRadius: '6px',
              border: `2px solid ${cardType === 'chart' ? '#2563eb' : '#e2e8f0'}`,
              backgroundColor: cardType === 'chart' ? '#eff6ff' : '#ffffff',
              color: cardType === 'chart' ? '#1d4ed8' : '#475569',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <LineChart style={{ width: '15px', height: '15px' }} />
            Live Graph (2x2)
          </button>
        </div>

        {/* Domain Sub-Tabs */}
        <AddWidgetDomainTabs activeDomain={activeDomain} onSelectDomain={setActiveDomain} />

        {/* Selectable Options Grid */}
        <AddWidgetOptionsGrid
          cardType={cardType}
          filteredMetrics={filteredMetrics}
          filteredCharts={filteredCharts}
          selectedMetric={selectedMetric}
          selectedChart={selectedChart}
          onSelectMetric={setSelectedMetric}
          onSelectChart={setSelectedChart}
        />

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
          <button type="button" onClick={onClose} style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={handleAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
            <Plus style={{ width: '14px', height: '14px' }} />
            Add to Grid
          </button>
        </div>
      </div>
    </div>
  );
};
