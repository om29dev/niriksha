import React from 'react';
import { MapPin, Radio, Layers, Compass, Maximize2, Minimize2 } from 'lucide-react';
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
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin style={{ width: '20px', height: '20px', color: '#2563eb' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            Live Spatial Sensor Topology & Mesh Map
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
          Real-time top-down schematic of field sensor nodes, RF wireless links, and coverage radii (100% offline).
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {selectedPoleId && onSelectPoleId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PoleSelectDropdown
              poles={DEFAULT_POLES}
              selectedPoleId={selectedPoleId}
              onSelectPole={onSelectPoleId}
              poleStateMap={poleStateMap}
              width="210px"
              size="sm"
            />
          </div>
        )}

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
