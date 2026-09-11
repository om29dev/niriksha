import React from 'react';
import { Flame } from 'lucide-react';

export interface GasThresholdCardProps {
  mq7Threshold: number;
  setMq7Threshold: (val: number) => void;
  mq135Threshold: number;
  setMq135Threshold: (val: number) => void;
  mq136Threshold: number;
  setMq136Threshold: (val: number) => void;
  mq2Threshold: number;
  setMq2Threshold: (val: number) => void;
  onApply: () => void;
}

export const GasThresholdCard: React.FC<GasThresholdCardProps> = ({
  mq7Threshold,
  setMq7Threshold,
  mq135Threshold,
  setMq135Threshold,
  mq136Threshold,
  setMq136Threshold,
  mq2Threshold,
  setMq2Threshold,
  onApply
}) => {
  return (
    <section style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
          <Flame style={{ width: '16px', height: '16px' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Atmospheric & Gas Limits
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            MQ-series air quality, toxic, & combustible triggers
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {/* MQ-7 Carbon Monoxide */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>CO (MQ-7) Threshold</span>
            <span style={{ fontWeight: '700', color: '#ea580c' }}>&gt; {mq7Threshold} PPM</span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            step="5"
            value={mq7Threshold}
            onChange={(e) => setMq7Threshold(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#ea580c', height: '6px' }}
          />
          <span style={{ fontSize: '11px', color: '#64748b' }}>OSHA limit: 50 ppm.</span>
        </div>

        {/* MQ-135 Air Quality */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>Air Quality (MQ-135)</span>
            <span style={{ fontWeight: '700', color: '#9333ea' }}>&gt; {mq135Threshold} PPM</span>
          </div>
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={mq135Threshold}
            onChange={(e) => setMq135Threshold(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#9333ea', height: '6px' }}
          />
          <span style={{ fontSize: '11px', color: '#64748b' }}>Pollution limit: 150 ppm.</span>
        </div>

        {/* MQ-136 Sewage Gas */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>Sewage H2S (MQ-136)</span>
            <span style={{ fontWeight: '700', color: '#dc2626' }}>&gt; {mq136Threshold} PPM</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="1"
            value={mq136Threshold}
            onChange={(e) => setMq136Threshold(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#dc2626', height: '6px' }}
          />
          <span style={{ fontSize: '11px', color: '#64748b' }}>H2S sewer gas danger: 15 ppm.</span>
        </div>

        {/* MQ-2 Smoke / Combustible Gas */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>Combustible / Smoke (MQ-2)</span>
            <span style={{ fontWeight: '700', color: '#c2410c' }}>&gt; {mq2Threshold} PPM</span>
          </div>
          <input
            type="range"
            min="50"
            max="800"
            step="25"
            value={mq2Threshold}
            onChange={(e) => setMq2Threshold(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#c2410c', height: '6px' }}
          />
          <span style={{ fontSize: '11px', color: '#64748b' }}>Explosive threshold: 300 ppm.</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onApply}
        style={{
          marginTop: 'auto',
          padding: '9px 14px',
          borderRadius: '6px',
          backgroundColor: '#ea580c',
          color: '#ffffff',
          border: 'none',
          fontWeight: '600',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        Apply Gas Thresholds
      </button>
    </section>
  );
};
