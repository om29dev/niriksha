import React, { useState } from 'react';
import type { PoleId, TelemetryPacket, PoleState } from '../../types/telemetry';
import { POLE_GEO_CONFIGS } from '../../constants/mapConfig';
import { MapHeaderBar } from '../map/MapHeaderBar';
import { MapLegend } from '../map/MapLegend';
import { MapSvgCanvas } from '../map/MapSvgCanvas';
import { MapNodeDetails } from '../map/MapNodeDetails';

interface LiveMapViewProps {
  poleStateMap: Record<PoleId, PoleState>;
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  onSelectPole: (poleId: PoleId) => void;
  initialSelectedPoleId?: PoleId;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  poleStateMap,
  latestPole1,
  latestPole2,
  latestPole3,
  onSelectPole,
  initialSelectedPoleId = 3
}) => {
  const [selectedPoleId, setSelectedPoleId] = useState<PoleId>(initialSelectedPoleId);
  const [showCoverage, setShowCoverage] = useState<boolean>(true);
  const [showMeshLinks, setShowMeshLinks] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync state if initialSelectedPoleId changes (e.g. navigation from SOS box)
  React.useEffect(() => {
    if (initialSelectedPoleId) {
      setSelectedPoleId(initialSelectedPoleId);
    }
  }, [initialSelectedPoleId]);

  const packets: Record<PoleId, TelemetryPacket | null> = {
    1: latestPole1,
    2: latestPole2,
    3: latestPole3
  };

  // Safe fallback if selectedPoleId is not in POLE_GEO_CONFIGS
  const selectedPole = POLE_GEO_CONFIGS[selectedPoleId] || POLE_GEO_CONFIGS[3] || Object.values(POLE_GEO_CONFIGS)[0];
  const selectedPacket = packets[selectedPoleId] || null;

  const getNodeStatus = (poleId: PoleId) => {
    const st = poleStateMap ? poleStateMap[poleId] : null;
    const pkt = packets ? packets[poleId] : null;
    if (st?.isDown || pkt?.is_upright === false) {
      return { label: 'TILT / TOPPLED', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' };
    }
    if ((pkt?.voltage || 0) > 5.0) {
      return { label: 'VOLTAGE LEAK SURGE', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' };
    }
    if ((pkt?.temperature || 0) >= 60.0 || (pkt?.fire_combustion_index || 0) >= 70) {
      return { label: 'FIRE / THERMAL ALERT', color: '#ea580c', bg: '#fff7ed', border: '#fdba74' };
    }
    if ((pkt?.water_depth || 0) > 100) {
      return { label: 'FLOOD INUNDATION', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };
    }
    if ((pkt?.mq7 || 0) > 50 || (pkt?.mq135 || 0) > 150 || (pkt?.mq136 || 0) > 15) {
      return { label: 'TOXIC GAS SPIKE', color: '#7c3aed', bg: '#faf5ff', border: '#d8b4fe' };
    }
    if (st?.isOffline) {
      return { label: 'OFFLINE', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
    }
    return { label: 'OPTIMAL ONLINE', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <MapHeaderBar
        selectedPoleId={selectedPoleId}
        onSelectPoleId={setSelectedPoleId}
        poleStateMap={poleStateMap}
        showMeshLinks={showMeshLinks}
        onToggleMeshLinks={() => setShowMeshLinks(!showMeshLinks)}
        showCoverage={showCoverage}
        onToggleCoverage={() => setShowCoverage(!showCoverage)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: isFullscreen ? '1fr' : '1fr 340px', gap: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', position: 'relative', height: isFullscreen ? '780px' : '560px', overflow: 'hidden' }}>
          <MapLegend showGrid={showGrid} />
          <MapSvgCanvas
            showGrid={showGrid}
            showCoverage={showCoverage}
            showMeshLinks={showMeshLinks}
            selectedPoleId={selectedPoleId}
            onSelectPoleId={setSelectedPoleId}
            getNodeStatus={getNodeStatus}
            packets={packets}
          />
        </div>

        <MapNodeDetails
          selectedPole={selectedPole}
          selectedPacket={selectedPacket}
          statusInfo={getNodeStatus(selectedPoleId)}
          onSelectPole={onSelectPole}
        />
      </div>
    </div>
  );
};
