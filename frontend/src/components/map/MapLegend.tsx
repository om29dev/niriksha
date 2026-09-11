import React from 'react';
import { Compass } from 'lucide-react';

interface MapLegendProps {
  showGrid: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = () => {
  return (
    <>
      {/* Compass Rose */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#334155',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          zIndex: 10
        }}
      >
        <Compass style={{ width: '16px', height: '16px', color: '#2563eb' }} />
        <span>N 0° 00' E</span>
      </div>

      {/* Scale Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '11px',
          color: '#64748b',
          zIndex: 10
        }}
      >
        <span style={{ fontWeight: '600', color: '#0f172a' }}>Vector Spatial Scale</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '60px', height: '3px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
          <span>100 m</span>
        </div>
      </div>
    </>
  );
};
