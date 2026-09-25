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

      {/* Comprehensive Scenario Hazard Symbology Key */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 10,
          maxWidth: '240px'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Map Telemetry & Hazard Key</span>
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: '10px', fontWeight: '600' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Optimal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#b91c1c' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span>⚡ Voltage Leak</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c2410c' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }} />
            <span>🔥 Fire Outbreak</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0369a1' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />
            <span>🌊 Severe Flood</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#a16207' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }} />
            <span>⚠️ Toppled Tilt</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7e22ce' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }} />
            <span>☣️ Toxic Gas</span>
          </div>
        </div>
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
