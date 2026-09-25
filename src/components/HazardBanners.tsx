import React from 'react';
import { AlertTriangle, WifiOff, Waves, Thermometer, Droplets, Wind } from 'lucide-react';
import type { PoleId, PoleState } from '../types/telemetry';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../constants/gasThresholds';

interface HazardBannersProps {
  downPoles: PoleId[];
  offlinePoles: PoleId[];
  activePoleTab: PoleId;
  setActivePoleTab: (id: PoleId) => void;
  selectedState: PoleState;
  floodHazardPoles: PoleId[];
  tempHazardPoles: PoleId[];
  humidityHazardPoles: PoleId[];
  mq7HazardPoles: PoleId[];
  mq135HazardPoles: PoleId[];
  mq136HazardPoles: PoleId[];
  gasThresholds?: Partial<GasThresholdConfig>;
}

export const HazardBanners: React.FC<HazardBannersProps> = ({
  downPoles,
  offlinePoles,
  activePoleTab,
  setActivePoleTab,
  selectedState,
  floodHazardPoles,
  tempHazardPoles,
  humidityHazardPoles,
  mq7HazardPoles,
  mq135HazardPoles,
  mq136HazardPoles,
  gasThresholds: customGasThresholds
}) => {
  const gasThresholds = { ...DEFAULT_GAS_THRESHOLDS, ...customGasThresholds };
  return (
    <>
      {/* Global Pole Down (Tilt) Critical Alert */}
      {downPoles.length > 0 && (
        <div style={{
          backgroundColor: '#fff1f2',
          border: '1px solid #fecdd3',
          borderLeft: '5px solid #e11d48',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle style={{ width: '22px', height: '22px', color: '#e11d48', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#9f1239' }}>
                Critical Hardware Alert: Pole Down (Tilt Switch Triggered) on {downPoles.map((id) => `Pole ${id}`).join(', ')}
              </strong>
              <p style={{ fontSize: '12px', color: '#be123c', marginTop: '2px' }}>
                Hardware tilt sensor indicates pole is no longer upright. Immediate physical inspection recommended.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {downPoles.map((poleId) => (
              <button
                key={poleId}
                onClick={() => setActivePoleTab(poleId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fda4af',
                  color: '#e11d48'
                }}
              >
                Inspect Pole {poleId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Offline Nodes Alert */}
      {offlinePoles.length > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderLeft: '5px solid #d97706',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <WifiOff style={{ width: '22px', height: '22px', color: '#d97706', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#92400e' }}>
                Node Transmission Offline: {offlinePoles.map((id) => `Pole ${id}`).join(', ')}
              </strong>
              <p style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                No mesh radio packets received for over 7 seconds. Gateway is awaiting heartbeat.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {offlinePoles.map((poleId) => (
              <button
                key={poleId}
                onClick={() => setActivePoleTab(poleId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fcd34d',
                  color: '#b45309'
                }}
              >
                View Pole {poleId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Pole Outage Banner: Pole Down (Tilt) */}
      {selectedState.isDown && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AlertTriangle style={{ width: '28px', height: '28px', color: '#dc2626', flexShrink: 0 }} />
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#991b1b', margin: 0 }}>
                Pole {activePoleTab} is DOWN (Tilt Sensor Triggered)
              </h2>
              <p style={{ fontSize: '13px', color: '#b91c1c', marginTop: '3px', margin: 0 }}>
                <strong>Hazard Alert:</strong> Pole vertical tilt switch is in a tilted state (is_upright = false). Check pole foundation and alignment.
              </p>
            </div>
          </div>
          <div style={{
            padding: '6px 14px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#991b1b',
            whiteSpace: 'nowrap'
          }}>
            POLE DOWN
          </div>
        </div>
      )}

      {/* Selected Pole Outage Banner: Offline (Heartbeat Timeout) */}
      {!selectedState.isDown && selectedState.isOffline && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <WifiOff style={{ width: '28px', height: '28px', color: '#d97706', flexShrink: 0 }} />
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#92400e', margin: 0 }}>
                Pole {activePoleTab} is OFFLINE (Radio Silence)
              </h2>
              <p style={{ fontSize: '13px', color: '#b45309', marginTop: '3px', margin: 0 }}>
                <strong>Diagnostic:</strong> No mesh packet received for {selectedState.secondsSince ?? '>7'} seconds. Check node power supply or mesh routing.
              </p>
            </div>
          </div>
          <div style={{
            padding: '6px 14px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#92400e',
            whiteSpace: 'nowrap'
          }}>
            OFFLINE
          </div>
        </div>
      )}

      {/* Normal Sensor Hazard Alerts: Water Depth / Flood (> 100cm) */}
      {floodHazardPoles.length > 0 && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderLeft: '5px solid #0284c7',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Waves style={{ width: '22px', height: '22px', color: '#0284c7', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#0369a1' }}>
                High Submersion Flood Alert: {floodHazardPoles.map((id) => `Pole ${id}`).join(', ')}
              </strong>
              <p style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px' }}>
                Water level exceeds 100 cm flood warning threshold. Elevated risk of structural and electrical hazards.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {floodHazardPoles.map((poleId) => (
              <button
                key={poleId}
                onClick={() => setActivePoleTab(poleId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid #7dd3fc',
                  color: '#0284c7'
                }}
              >
                View Pole {poleId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Normal Sensor Hazard Alerts: Ambient Temperature (> 45°C) */}
      {tempHazardPoles.length > 0 && (
        <div style={{
          backgroundColor: '#fff7ed',
          border: '1px solid #fed7aa',
          borderLeft: '5px solid #ea580c',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Thermometer style={{ width: '22px', height: '22px', color: '#ea580c', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#9a3412' }}>
                Thermal Warning Alert: {tempHazardPoles.map((id) => `Pole ${id}`).join(', ')}
              </strong>
              <p style={{ fontSize: '12px', color: '#c2410c', marginTop: '2px' }}>
                Ambient thermal sensor reading exceeds {gasThresholds.temp}°C threshold. Possible enclosure overheating or heatwave.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {tempHazardPoles.map((poleId) => (
              <button
                key={poleId}
                onClick={() => setActivePoleTab(poleId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fdba74',
                  color: '#ea580c'
                }}
              >
                View Pole {poleId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Normal Sensor Hazard Alerts: High Humidity (> 85%) */}
      {humidityHazardPoles.length > 0 && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderLeft: '5px solid #16a34a',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Droplets style={{ width: '22px', height: '22px', color: '#16a34a', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#166534' }}>
                High Atmospheric Humidity Alert: {humidityHazardPoles.map((id) => `Pole ${id}`).join(', ')}
              </strong>
              <p style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                Relative humidity reading exceeds {gasThresholds.humidity}% threshold. Condensation risk for electronics.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {humidityHazardPoles.map((poleId) => (
              <button
                key={poleId}
                onClick={() => setActivePoleTab(poleId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid #86efac',
                  color: '#16a34a'
                }}
              >
                View Pole {poleId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Normal Sensor Hazard Alerts: Carbon Monoxide (> 50 ppm) */}
      {mq7HazardPoles.length > 0 && (
        <div style={{
          backgroundColor: '#fff7ed',
          border: '1px solid #fed7aa',
          borderLeft: '5px solid #ea580c',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wind style={{ width: '22px', height: '22px', color: '#ea580c', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#9a3412' }}>
                Toxic Gas Warning: High Carbon Monoxide Concentration on {mq7HazardPoles.map((id) => `Pole ${id}`).join(', ')}
              </strong>
              <p style={{ fontSize: '12px', color: '#c2410c', marginTop: '2px' }}>
                Carbon monoxide concentration exceeds {gasThresholds.mq7} ppm safety threshold. Immediate ventilation recommended.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {mq7HazardPoles.map((poleId) => (
              <button
                key={poleId}
                onClick={() => setActivePoleTab(poleId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fdba74',
                  color: '#ea580c'
                }}
              >
                View Pole {poleId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Normal Sensor Hazard Alerts: Air Quality (> 150 ppm) */}
      {mq135HazardPoles.length > 0 && (
        <div style={{
          backgroundColor: '#faf5ff',
          border: '1px solid #e9d5ff',
          borderLeft: '5px solid #9333ea',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wind style={{ width: '22px', height: '22px', color: '#9333ea', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#6b21a8' }}>
                Air Quality Warning: High Pollutant Concentration on {mq135HazardPoles.map((id) => `Pole ${id}`).join(', ')}
              </strong>
              <p style={{ fontSize: '12px', color: '#7e22ce', marginTop: '2px' }}>
                Air pollution & harmful gas levels exceed {gasThresholds.mq135} ppm baseline threshold.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {mq135HazardPoles.map((poleId) => (
              <button
                key={poleId}
                onClick={() => setActivePoleTab(poleId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d8b4fe',
                  color: '#9333ea'
                }}
              >
                View Pole {poleId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Normal Sensor Hazard Alerts: Sewage Gas (> 15 ppm) */}
      {mq136HazardPoles.length > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderLeft: '5px solid #dc2626',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wind style={{ width: '22px', height: '22px', color: '#dc2626', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#991b1b' }}>
                Sewage Gas Warning: Toxic Sewage Gas Detected on {mq136HazardPoles.map((id) => `Pole ${id}`).join(', ')}
              </strong>
              <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '2px' }}>
                Sewage gas accumulation exceeds {gasThresholds.mq136} ppm danger limit. High toxicity risk.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {mq136HazardPoles.map((poleId) => (
              <button
                key={poleId}
                onClick={() => setActivePoleTab(poleId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fca5a5',
                  color: '#dc2626'
                }}
              >
                View Pole {poleId}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
