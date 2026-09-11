import React, { useState } from 'react';
import { X, Plus, Activity, LineChart } from 'lucide-react';
import type { PoleId } from '../../types/telemetry';
import type { CardType, MetricKey, ChartKey, DashboardCardConfig } from '../../types/dashboard';
import { AVAILABLE_METRICS, AVAILABLE_CHARTS } from '../../constants/dashboardDefaults';

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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Add Dashboard Card</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Configure metric or chart widget with custom pole assignment</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Card Type Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
            Card Widget Type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setCardType('metric')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: `2px solid ${cardType === 'metric' ? '#2563eb' : '#e2e8f0'}`,
                backgroundColor: cardType === 'metric' ? '#eff6ff' : '#ffffff',
                color: cardType === 'metric' ? '#1d4ed8' : '#475569',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Activity style={{ width: '16px', height: '16px' }} />
              Value Card (1x1 Unit)
            </button>

            <button
              type="button"
              onClick={() => setCardType('chart')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: `2px solid ${cardType === 'chart' ? '#2563eb' : '#e2e8f0'}`,
                backgroundColor: cardType === 'chart' ? '#eff6ff' : '#ffffff',
                color: cardType === 'chart' ? '#1d4ed8' : '#475569',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <LineChart style={{ width: '16px', height: '16px' }} />
              Live Graph (2x2 Unit)
            </button>
          </div>
        </div>



        {/* Metric or Graph Picker */}
        {cardType === 'metric' ? (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
              Select Telemetry Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            >
              {AVAILABLE_METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.title} ({m.subtitle}) {m.unit ? `[${m.unit}]` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
              Select Live Graph Curve
            </label>
            <select
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value as ChartKey)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            >
              {AVAILABLE_CHARTS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.title} - {c.subtitle}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add to Grid
          </button>
        </div>
      </div>
    </div>
  );
};
