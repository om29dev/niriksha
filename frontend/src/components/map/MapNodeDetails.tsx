import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { PoleId, TelemetryPacket } from '../../types/telemetry';
import type { PoleGeoConfig } from '../../constants/mapConfig';

interface MapNodeDetailsProps {
  selectedPole: PoleGeoConfig;
  selectedPacket: TelemetryPacket | null;
  statusInfo: { label: string; color: string; bg: string; border: string };
  onSelectPole: (poleId: PoleId) => void;
}

export const MapNodeDetails: React.FC<MapNodeDetailsProps> = ({
  selectedPole,
  selectedPacket,
  statusInfo,
  onSelectPole
}) => {
  const pole = selectedPole || {
    id: 1,
    name: 'Pole 1 (Relay)',
    role: 'Sensor Node',
    lat: 18.5204,
    lng: 73.8567,
    coverageRadius: 180
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
            Spatial Node Inspection
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
            {pole.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b' }}>{pole.role}</p>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: '700',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: statusInfo?.bg || '#ecfdf5',
            color: statusInfo?.color || '#059669',
            border: `1px solid ${statusInfo?.border || '#a7f3d0'}`
          }}
        >
          {statusInfo?.label || 'ONLINE'}
        </span>
      </div>

      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Coordinates</span>
          <span style={{ fontWeight: '600', color: '#0f172a' }}>{(pole.lat || 18.52).toFixed(4)}° N, {(pole.lng || 73.85).toFixed(4)}° E</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Coverage Range</span>
          <span style={{ fontWeight: '600', color: '#0f172a' }}>{pole.coverageRadius || 180} m</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Mesh Protocol</span>
          <span style={{ fontWeight: '600', color: '#2563eb' }}>painlessMesh 2.4 GHz</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Live Sensor Telemetry</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Voltage</span>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
              {selectedPacket?.voltage !== undefined && selectedPacket?.voltage !== null ? `${selectedPacket.voltage.toFixed(1)} V` : 'Not Connected'}
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Water Depth</span>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
              {selectedPacket?.water_depth !== undefined && selectedPacket?.water_depth !== null ? `${selectedPacket.water_depth.toFixed(1)} cm` : 'Not Connected'}
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Active Power</span>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
              {selectedPacket?.power !== undefined && selectedPacket?.power !== null ? `${selectedPacket.power.toFixed(1)} W` : 'Not Connected'}
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Orientation</span>
            <div style={{ fontSize: '13px', fontWeight: '700', color: selectedPacket?.is_upright === false ? '#dc2626' : '#059669', marginTop: '3px' }}>
              {selectedPacket?.is_upright === false ? 'TILTED' : 'Upright'}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onSelectPole((pole.id || 1) as PoleId)}
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '10px',
          borderRadius: '6px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <span>Open in Primary Dashboard</span>
        <ArrowUpRight style={{ width: '15px', height: '15px' }} />
      </button>
    </div>
  );
};
