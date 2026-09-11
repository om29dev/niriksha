import React from 'react';
import type { PoleId, PoleState, TelemetryPacket } from '../types/telemetry';
import { PoleSelectDropdown } from './PoleSelectDropdown';
import { DEFAULT_POLES } from '../constants/polesCatalog';

interface PoleNavProps {
  activePoleTab: PoleId;
  setActivePoleTab: (poleId: PoleId) => void;
  poleStateMap: Record<PoleId, PoleState>;
  selectedLatest: TelemetryPacket | null;
  selectedState: PoleState;
}

export const PoleNav: React.FC<PoleNavProps> = ({
  activePoleTab,
  setActivePoleTab,
  poleStateMap,
  selectedLatest,
  selectedState
}) => {
  return (
    <section style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#ffffff',
        padding: '14px 20px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Active Pole:</span>
          
          {/* Searchable Dropdown for Scalable Pole Selection */}
          <PoleSelectDropdown
            poles={DEFAULT_POLES}
            selectedPoleId={activePoleTab}
            onSelectPole={setActivePoleTab}
            poleStateMap={poleStateMap}
            width="250px"
          />


        </div>

        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Viewing readings and live charts for <strong style={{ color: '#2563eb' }}>Pole {activePoleTab}</strong>
          {selectedLatest && <span> • Last Seq: #{selectedLatest.seq}</span>}
          {selectedState?.secondsSince !== null && (
            <span style={{ color: selectedState?.isOffline ? '#d97706' : '#64748b' }}>
              {' '}(Last seen: {selectedState?.secondsSince}s ago)
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
