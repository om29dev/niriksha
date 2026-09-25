import React from 'react';
import { Radio, Layers, Compass, Maximize2, Minimize2 } from 'lucide-react';
import type { PoleId, PoleState } from '../../types/telemetry';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

interface MapHeaderBarProps {
  selectedPoleId?: PoleId;
  onSelectPoleId?: (poleId: PoleId) => void;
  poleStateMap?: Record<number, PoleState>;
  showMeshLinks: boolean;
  onToggleMeshLinks: () => void;
  showCoverage: boolean;
  onToggleCoverage: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const MapHeaderBar: React.FC<MapHeaderBarProps> = ({
  selectedPoleId,
  onSelectPoleId,
  poleStateMap,
  showMeshLinks,
  onToggleMeshLinks,
  showCoverage,
  onToggleCoverage,
  showGrid,
  onToggleGrid,
  isFullscreen,
  onToggleFullscreen
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      {/* Left: Focused Node Selector */}
      <div>
        {selectedPoleId && onSelectPoleId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
              Inspect Node:
            </span>
            <PoleSelectDropdown
              poles={DEFAULT_POLES}
              selectedPoleId={selectedPoleId}
              onSelectPole={onSelectPoleId}
              poleStateMap={poleStateMap}
              width="220px"
              size="sm"
            />
          </div>
        ) : <div />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

        <button
          onClick={onToggleMeshLinks}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            border: '1px solid',
            borderColor: showMeshLinks ? '#2563eb' : '#cbd5e1',
            backgroundColor: showMeshLinks ? '#eff6ff' : '#ffffff',
            color: showMeshLinks ? '#2563eb' : '#475569',
            cursor: 'pointer'
          }}
        >
          <Radio style={{ width: '14px', height: '14px' }} />
          Mesh RF Links
        </button>

        <button
          onClick={onToggleCoverage}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            border: '1px solid',
            borderColor: showCoverage ? '#2563eb' : '#cbd5e1',
            backgroundColor: showCoverage ? '#eff6ff' : '#ffffff',
            color: showCoverage ? '#2563eb' : '#475569',
            cursor: 'pointer'
          }}
        >
          <Layers style={{ width: '14px', height: '14px' }} />
          Coverage Radii
        </button>

        <button
          onClick={onToggleGrid}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            border: '1px solid',
            borderColor: showGrid ? '#2563eb' : '#cbd5e1',
            backgroundColor: showGrid ? '#eff6ff' : '#ffffff',
            color: showGrid ? '#2563eb' : '#475569',
            cursor: 'pointer'
          }}
        >
          <Compass style={{ width: '14px', height: '14px' }} />
          Grid Overlay
        </button>

        <button
          onClick={onToggleFullscreen}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#475569',
            cursor: 'pointer'
          }}
        >
          {isFullscreen ? <Minimize2 style={{ width: '14px', height: '14px' }} /> : <Maximize2 style={{ width: '14px', height: '14px' }} />}
          {isFullscreen ? 'Exit Fullscreen' : 'Expand'}
        </button>
      </div>
    </div>
  );
};
