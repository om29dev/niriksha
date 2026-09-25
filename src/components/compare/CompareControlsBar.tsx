import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { PoleId, TimeRangeOption, PoleState } from '../../types/telemetry';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

interface CompareControlsBarProps {
  poleA: PoleId;
  poleB: PoleId;
  onSelectPoleA: (id: PoleId) => void;
  onSelectPoleB: (id: PoleId) => void;
  onSwapPoles: () => void;
  timeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  poleStateMap: Record<PoleId, PoleState>;
}

export const CompareControlsBar: React.FC<CompareControlsBarProps> = ({
  poleA,
  poleB,
  onSelectPoleA,
  onSelectPoleB,
  onSwapPoles,
  timeRange,
  onTimeRangeChange,
  poleStateMap
}) => {
  return (
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
            onSelectPole={(id) => onSelectPoleA(id as PoleId)}
            poleStateMap={poleStateMap}
            accentColor="#2563eb"
            width="210px"
            size="sm"
          />
        </div>

        {/* Swap Button */}
        <button
          onClick={onSwapPoles}
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
            onSelectPole={(id) => onSelectPoleB(id as PoleId)}
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
  );
};
