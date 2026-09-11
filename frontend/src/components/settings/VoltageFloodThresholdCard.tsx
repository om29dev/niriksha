import React from 'react';
import { Sliders, AlertTriangle } from 'lucide-react';

export interface VoltageFloodThresholdCardProps {
  voltageLimit: number;
  setVoltageLimit: (val: number) => void;
  floodThreshold: number;
  setFloodThreshold: (val: number) => void;
  onApply: () => void;
}

export const VoltageFloodThresholdCard: React.FC<VoltageFloodThresholdCardProps> = ({
  voltageLimit,
  setVoltageLimit,
  floodThreshold,
  setFloodThreshold,
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
        <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
          <Sliders style={{ width: '16px', height: '16px' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Voltage & Flood Limits
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Critical electrification and water depth bounds
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {/* High Voltage Trigger */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>High Voltage Trigger</span>
            <span style={{ fontWeight: '700', color: '#dc2626' }}>{voltageLimit} V</span>
          </div>
          <input
            type="range"
            min="3"
            max="20"
            step="0.5"
            value={voltageLimit}
            onChange={(e) => setVoltageLimit(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#dc2626', height: '6px' }}
          />
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '3px' }}>
            Triggers acoustic siren and emergency alert modal (&gt;5.0V lethal risk).
          </span>
        </div>

        {/* Flood Water Clearance Limit */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>Flood Water Clearance Limit</span>
            <span style={{ fontWeight: '700', color: '#2563eb' }}>&lt; {floodThreshold} cm</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={floodThreshold}
            onChange={(e) => setFloodThreshold(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#2563eb', height: '6px' }}
          />
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '3px' }}>
            Pole 1/Pole 3 ultrasonic transceiver flood height boundary.
          </span>
        </div>

        {/* Status Information Callout */}
        <div style={{
          marginTop: 'auto',
          padding: '10px 12px',
          borderRadius: '6px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
            Electrification thresholds trigger hardware siren tone & screen beacon overlay immediately.
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onApply}
        style={{
          marginTop: '8px',
          padding: '9px 14px',
          borderRadius: '6px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          fontWeight: '600',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        Apply Physical Thresholds
      </button>
    </section>
  );
};
