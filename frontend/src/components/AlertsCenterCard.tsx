import React, { useState } from 'react';
import {
  AlertTriangle,
  WifiOff,
  Waves,
  Thermometer,
  Droplets,
  Wind,
  Flame,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  BellRing
} from 'lucide-react';
import type { PoleId, PoleState } from '../types/telemetry';

interface AlertsCenterCardProps {
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
  mq2HazardPoles: PoleId[];
}

interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  icon: React.ReactNode;
  title: string;
  description: string;
  poles: PoleId[];
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const AlertsCenterCard: React.FC<AlertsCenterCardProps> = ({
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
  mq2HazardPoles
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Compile active alerts list
  const alerts: AlertItem[] = [];

  if (downPoles.length > 0) {
    alerts.push({
      id: 'pole-down',
      severity: 'critical',
      icon: <AlertTriangle style={{ width: '18px', height: '18px', color: '#e11d48' }} />,
      title: 'Critical Tilt Alert: Pole Fallen / Down',
      description: 'Physical tilt sensors indicate vertical alignment loss. Urgent physical inspection needed.',
      poles: downPoles,
      bgColor: '#fff1f2',
      borderColor: '#fecdd3',
      textColor: '#9f1239'
    });
  }

  if (offlinePoles.length > 0) {
    alerts.push({
      id: 'offline',
      severity: 'warning',
      icon: <WifiOff style={{ width: '18px', height: '18px', color: '#d97706' }} />,
      title: 'Heartbeat Timeout: Node Offline',
      description: 'No telemetry packets received for over 7 seconds. Gateway waiting for heartbeat.',
      poles: offlinePoles,
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      textColor: '#92400e'
    });
  }

  if (floodHazardPoles.length > 0) {
    alerts.push({
      id: 'flood',
      severity: 'warning',
      icon: <Waves style={{ width: '18px', height: '18px', color: '#0284c7' }} />,
      title: 'Flood Level Alert: High Water Submersion (> 100cm)',
      description: 'Submersion depth exceeds the 100cm critical flood threshold. Elevated risk of water penetration.',
      poles: floodHazardPoles,
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      textColor: '#0369a1'
    });
  }

  if (tempHazardPoles.length > 0) {
    alerts.push({
      id: 'temp',
      severity: 'warning',
      icon: <Thermometer style={{ width: '18px', height: '18px', color: '#ea580c' }} />,
      title: 'Thermal Warning: High Ambient Temperature (> 45°C)',
      description: 'Internal temperature exceeds 45°C. Enclosure cooling check recommended.',
      poles: tempHazardPoles,
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
      textColor: '#9a3412'
    });
  }

  if (humidityHazardPoles.length > 0) {
    alerts.push({
      id: 'humidity',
      severity: 'warning',
      icon: <Droplets style={{ width: '18px', height: '18px', color: '#16a34a' }} />,
      title: 'High Humidity Alert: Condensation Risk (> 85%)',
      description: 'Relative humidity exceeds 85%. Possible circuit corrosion or condensation.',
      poles: humidityHazardPoles,
      bgColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      textColor: '#166534'
    });
  }

  if (mq7HazardPoles.length > 0) {
    alerts.push({
      id: 'mq7',
      severity: 'critical',
      icon: <Wind style={{ width: '18px', height: '18px', color: '#ea580c' }} />,
      title: 'Toxic Gas Warning: Carbon Monoxide (> 50 ppm)',
      description: 'High CO concentration detected. Area requires immediate ventilation.',
      poles: mq7HazardPoles,
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
      textColor: '#9a3412'
    });
  }

  if (mq135HazardPoles.length > 0) {
    alerts.push({
      id: 'mq135',
      severity: 'warning',
      icon: <Wind style={{ width: '18px', height: '18px', color: '#9333ea' }} />,
      title: 'Air Quality Hazard: Excessive Atmospheric Pollutants (> 150 ppm)',
      description: 'Harmful pollutants & gas concentration exceed baseline threshold.',
      poles: mq135HazardPoles,
      bgColor: '#faf5ff',
      borderColor: '#e9d5ff',
      textColor: '#6b21a8'
    });
  }

  if (mq136HazardPoles.length > 0) {
    alerts.push({
      id: 'mq136',
      severity: 'critical',
      icon: <Wind style={{ width: '18px', height: '18px', color: '#dc2626' }} />,
      title: 'Sewage Gas Warning: Toxic Vapors (> 15 ppm)',
      description: 'Dangerous sewage gas accumulation detected. High toxicity risk.',
      poles: mq136HazardPoles,
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      textColor: '#991b1b'
    });
  }

  if (mq2HazardPoles.length > 0) {
    alerts.push({
      id: 'mq2',
      severity: 'critical',
      icon: <Flame style={{ width: '18px', height: '18px', color: '#c2410c' }} />,
      title: 'Combustion Alert: Smoke / Flammable Gas Detected (> 300 ppm)',
      description: 'Combustible gases or smoke detected above 300 ppm safety threshold.',
      poles: mq2HazardPoles,
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
      textColor: '#9a3412'
    });
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <section style={{ marginBottom: '24px' }}>
      <div
        className="lab-card"
        style={{
          padding: '16px 20px',
          borderColor: alerts.length > 0 ? (criticalCount > 0 ? '#fca5a5' : '#fde68a') : '#e2e8f0',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Card Header & Summary Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alerts.length > 0 ? (criticalCount > 0 ? '#fee2e2' : '#fef3c7') : '#ecfdf5',
              color: alerts.length > 0 ? (criticalCount > 0 ? '#dc2626' : '#d97706') : '#059669'
            }}>
              {alerts.length > 0 ? <BellRing style={{ width: '20px', height: '20px' }} /> : <ShieldCheck style={{ width: '20px', height: '20px' }} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Active System Alerts & Hazards Center
                </h3>
                {alerts.length > 0 ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: criticalCount > 0 ? '#fef2f2' : '#fffbeb',
                    color: criticalCount > 0 ? '#dc2626' : '#b45309',
                    border: `1px solid ${criticalCount > 0 ? '#fecaca' : '#fde68a'}`
                  }}>
                    {alerts.length} Active {alerts.length === 1 ? 'Notice' : 'Notices'}
                  </span>
                ) : (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0'
                  }}>
                    All Poles Normal
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                {alerts.length > 0
                  ? `${criticalCount} critical hazard${criticalCount !== 1 ? 's' : ''}, ${warningCount} advisory notice${warningCount !== 1 ? 's' : ''} across mesh nodes.`
                  : 'Zero hardware outages, water leaks, or sensor threshold breaches detected.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Selected Pole Active Status Tag */}
            <div style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: '600',
              backgroundColor: selectedState.isDown ? '#fee2e2' : selectedState.isOffline ? '#fef3c7' : '#f1f5f9',
              color: selectedState.isDown ? '#991b1b' : selectedState.isOffline ? '#92400e' : '#475569',
              border: `1px solid ${selectedState.isDown ? '#fca5a5' : selectedState.isOffline ? '#fcd34d' : '#e2e8f0'}`
            }}>
              Pole {activePoleTab}: {selectedState.isDown ? 'POLE DOWN' : selectedState.isOffline ? 'OFFLINE' : 'HEALTHY'}
            </div>

            {alerts.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <span>{isExpanded ? 'Collapse' : 'Show Details'}</span>
                {isExpanded ? <ChevronUp style={{ width: '14px', height: '14px' }} /> : <ChevronDown style={{ width: '14px', height: '14px' }} />}
              </button>
            )}
          </div>
        </div>

        {/* Alerts Content Feed (Fixed height scrollable container when expanded, no page jumping) */}
        {alerts.length > 0 && isExpanded && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {alerts.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: item.bgColor,
                  border: `1px solid ${item.borderColor}`,
                  borderRadius: '6px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.icon}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: item.textColor }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: item.textColor, opacity: 0.9 }}>
                      {item.description}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: item.textColor }}>
                    Affects:
                  </span>
                  {item.poles.map((poleId) => (
                    <button
                      key={poleId}
                      onClick={() => setActivePoleTab(poleId)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                        border: `1px solid ${item.borderColor}`,
                        color: item.textColor
                      }}
                      title={`Switch view to Pole ${poleId}`}
                    >
                      Pole {poleId} {activePoleTab === poleId ? '✓' : ''}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
