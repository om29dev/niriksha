import React from 'react';
import { Sliders, Thermometer, Droplets } from 'lucide-react';

export interface VoltageFloodThresholdCardProps {
  voltageLimit: number;
  setVoltageLimit: (val: number) => void;
  floodThreshold: number;
  setFloodThreshold: (val: number) => void;
  tempThreshold: number;
  setTempThreshold: (val: number) => void;
  humidityThreshold: number;
  setHumidityThreshold: (val: number) => void;
  onApply: () => void;
}

export const VoltageFloodThresholdCard: React.FC<VoltageFloodThresholdCardProps> = ({
  voltageLimit,
  setVoltageLimit,
  floodThreshold,
  setFloodThreshold,
  tempThreshold,
  setTempThreshold,
  humidityThreshold,
  setHumidityThreshold,
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
      gap: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
          <Sliders style={{ width: '16px', height: '16px' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Physical & Environmental Limits
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Electrification, water level, thermal & humidity bounds
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {/* High Voltage Trigger */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
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
            style={{ width: '100%', accentColor: '#dc2626', height: '5px' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginTop: '1px' }}>
            Siren & overlay trigger (&gt;5.0V hazard).
          </span>
        </div>

        {/* Flood Water Clearance Limit */}
        <div style={{ borderTop: '1px solid #f8fafc', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>Flood Clearance Limit</span>
            <span style={{ fontWeight: '700', color: '#2563eb' }}>&lt; {floodThreshold} cm</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={floodThreshold}
            onChange={(e) => setFloodThreshold(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#2563eb', height: '5px' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginTop: '1px' }}>
            Ultrasonic clearance safety margin.
          </span>
        </div>

        {/* High Temperature Limit */}
        <div style={{ borderTop: '1px solid #f8fafc', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
            <span style={{ fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Thermometer style={{ width: '12px', height: '12px', color: '#ea580c' }} />
              High Temperature Warning
            </span>
            <span style={{ fontWeight: '700', color: '#ea580c' }}>&gt; {tempThreshold} °C</span>
          </div>
          <input
            type="range"
            min="30"
            max="60"
            step="1"
            value={tempThreshold}
            onChange={(e) => setTempThreshold(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#ea580c', height: '5px' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginTop: '1px' }}>
            Thermal alert trigger (default: 45°C).
          </span>
        </div>

        {/* High Humidity Limit */}
        <div style={{ borderTop: '1px solid #f8fafc', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
            <span style={{ fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Droplets style={{ width: '12px', height: '12px', color: '#0284c7' }} />
              High Humidity Warning
            </span>
            <span style={{ fontWeight: '700', color: '#0284c7' }}>&gt; {humidityThreshold} %</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={humidityThreshold}
            onChange={(e) => setHumidityThreshold(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#0284c7', height: '5px' }}
          />
          <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginTop: '1px' }}>
            Condensation & moisture risk boundary.
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onApply}
        style={{
          marginTop: 'auto',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          fontWeight: '600',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        Apply Physical & Environmental Thresholds
      </button>
    </section>
  );
};
