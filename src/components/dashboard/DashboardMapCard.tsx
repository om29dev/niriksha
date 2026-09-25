import React from 'react';
import { MapPin, ArrowUpRight, Radio } from 'lucide-react';
import type { PoleId, TelemetryPacket, PoleState } from '../../types/telemetry';
import { MapSvgCanvas } from '../map/MapSvgCanvas';

interface DashboardMapCardProps {
  poleStateMap: Record<PoleId, PoleState>;
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  selectedPoleId: PoleId;
  onSelectPoleId: (poleId: PoleId) => void;
  onNavigateToMap: () => void;
}

export const DashboardMapCard: React.FC<DashboardMapCardProps> = ({
  poleStateMap,
  latestPole1,
  latestPole2,
  latestPole3,
  selectedPoleId,
  onSelectPoleId,
  onNavigateToMap
}) => {
  const packets: Record<PoleId, TelemetryPacket | null> = {
    1: latestPole1,
    2: latestPole2,
    3: latestPole3
  };

  const getNodeStatus = (poleId: PoleId) => {
    const st = poleStateMap ? poleStateMap[poleId] : null;
    const pkt = packets ? packets[poleId] : null;
    if (st?.isDown || pkt?.is_upright === false) {
      return { label: 'TILT / COLLAPSED', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' };
    }
    if ((pkt?.voltage || 0) > 5.0) {
      return { label: 'VOLTAGE SURGE', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' };
    }
    if ((pkt?.water_depth || 0) > 100) {
      return { label: 'FLOOD INUNDATION', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    }
    if (st?.isOffline) {
      return { label: 'OFFLINE', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
    }
    return { label: 'OPTIMAL ONLINE', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
  };

  const activeHazardCount = [1, 2, 3].filter((id) => {
    const pkt = packets[id as PoleId];
    const st = poleStateMap[id as PoleId];
    return (pkt?.voltage ?? 0) > 5.0 || pkt?.is_upright === false || st?.isDown;
  }).length;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafafa',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              padding: '5px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <MapPin style={{ width: '15px', height: '15px' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              SPATIAL TOPOLOGY MAP
            </h4>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              Live Mesh & GIS Coordinates
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeHazardCount > 0 ? (
            <span
              style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Radio style={{ width: '10px', height: '10px' }} />
              {activeHazardCount} Alert{activeHazardCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span
              style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              Nominal
            </span>
          )}

          <button
            onClick={onNavigateToMap}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '5px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
          >
            <span>Full Map</span>
            <ArrowUpRight style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      </div>

      {/* Embedded Vector Canvas */}
      <div style={{ flex: 1, minHeight: '260px', width: '100%', position: 'relative', backgroundColor: '#f8fafc' }}>
        <MapSvgCanvas
          showGrid={true}
          showCoverage={true}
          showMeshLinks={true}
          selectedPoleId={selectedPoleId}
          onSelectPoleId={onSelectPoleId}
          getNodeStatus={getNodeStatus}
          packets={packets}
        />
      </div>
    </div>
  );
};
