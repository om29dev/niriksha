import React from 'react';
import { RotateCcw, Plus } from 'lucide-react';
import type { PoleId, TelemetryPacket, PoleState } from '../../types/telemetry';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

interface DashboardControlsBarProps {
  activePoleTab: PoleId;
  onSelectPole: (poleId: PoleId) => void;
  poleStateMap: Record<PoleId, PoleState>;
  selectedLatest: TelemetryPacket | null;
  selectedState: PoleState;
  onResetLayout: () => void;
  onOpenAddModal: () => void;
}

export const DashboardControlsBar: React.FC<DashboardControlsBarProps> = ({
  activePoleTab,
  onSelectPole,
  poleStateMap,
  selectedLatest,
  selectedState,
  onResetLayout,
  onOpenAddModal
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#ffffff',
        padding: '12px 18px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}
    >
      {/* Left: Scalable Searchable Pole Selector + Quick Sequence Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
          Active Pole:
        </span>
        <PoleSelectDropdown
          poles={DEFAULT_POLES}
          selectedPoleId={activePoleTab}
          onSelectPole={(id) => onSelectPole(id as PoleId)}
          poleStateMap={poleStateMap}
          width="250px"
        />

        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {selectedLatest && <span>Last Seq: #{selectedLatest.seq}</span>}
          {selectedState.secondsSince !== null && (
            <span style={{ color: selectedState.isOffline ? '#d97706' : '#64748b' }}>
              {' '}({selectedState.secondsSince}s ago)
            </span>
          )}
        </span>
      </div>

      {/* Right: Reset Layout & Add Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onResetLayout}
          title="Reset cards and positions back to default layout"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#475569',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <RotateCcw style={{ width: '13px', height: '13px' }} />
          Reset Layout
        </button>

        <button
          type="button"
          onClick={onOpenAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 15px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
          Add Card
        </button>
      </div>
    </div>
  );
};
