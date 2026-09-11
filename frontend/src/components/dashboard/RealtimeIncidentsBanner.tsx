import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { PoleId, TelemetryPacket, PoleState } from '../../types/telemetry';
import type { GasThresholdConfig } from '../../constants/gasThresholds';
import {
  Zap,
  AlertTriangle,
  Waves,
  Thermometer,
  CloudRain,
  Flame
} from 'lucide-react';

interface RealtimeIncidentsBannerProps {
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  poleStateMap: Record<PoleId, PoleState>;
  gasThresholds: GasThresholdConfig;
  onJumpToPole: (poleId: PoleId) => void;
}

export const RealtimeIncidentsBanner: React.FC<RealtimeIncidentsBannerProps> = ({
  latestPole1,
  latestPole2,
  latestPole3,
  poleStateMap,
  gasThresholds,
  onJumpToPole
}) => {
  const realTimeIncidents = React.useMemo(() => {
    const allPackets: Record<PoleId, TelemetryPacket | null> = {
      1: latestPole1,
      2: latestPole2,
      3: latestPole3
    };

    const voltagePoles: PoleId[] = [];
    const downPoles: PoleId[] = [];
    const floodPoles: PoleId[] = [];
    const tempPoles: PoleId[] = [];
    const humPoles: PoleId[] = [];
    const mq7Poles: PoleId[] = [];
    const mq135Poles: PoleId[] = [];
    const mq136Poles: PoleId[] = [];
    const offlinePoles: PoleId[] = [];

    ([1, 2, 3] as PoleId[]).forEach((id) => {
      const pkt = allPackets[id];
      const st = poleStateMap[id];

      if (st?.isOffline) offlinePoles.push(id);
      if (st?.isDown || pkt?.is_upright === false) downPoles.push(id);
      if ((pkt?.voltage ?? 0) > 5.0) voltagePoles.push(id);
      if ((pkt?.water_depth ?? 0) > 100) floodPoles.push(id);
      if ((pkt?.temperature ?? 0) > gasThresholds.temp) tempPoles.push(id);
      if ((pkt?.humidity ?? 0) > gasThresholds.humidity) humPoles.push(id);
      if ((pkt?.mq7 ?? 0) > gasThresholds.mq7) mq7Poles.push(id);
      if ((pkt?.mq135 ?? 0) > gasThresholds.mq135) mq135Poles.push(id);
      if ((pkt?.mq136 ?? 0) > gasThresholds.mq136) mq136Poles.push(id);
    });

    return [
      ...(voltagePoles.length > 0 ? [{
        id: 'voltage',
        title: 'Water Electrification Emergency (>5V)',
        severity: 'critical' as const,
        description: 'Lethal voltage leakage detected on water probes. Siren triggered.',
        poles: voltagePoles,
        icon: Zap
      }] : []),
      ...(downPoles.length > 0 ? [{
        id: 'down',
        title: 'Structural Pole Collapse / Tilt Detection',
        severity: 'critical' as const,
        description: 'Upright orientation lost. Gyroscope reported horizontal angle tilt.',
        poles: downPoles,
        icon: AlertTriangle
      }] : []),
      ...(floodPoles.length > 0 ? [{
        id: 'flood',
        title: 'Water Inundation / Flood Alert (>100cm)',
        severity: 'warning' as const,
        description: 'Water level proximity hazard triggered via Ultrasonic sensor.',
        poles: floodPoles,
        icon: Waves
      }] : []),
      ...(tempPoles.length > 0 ? [{
        id: 'temp',
        title: `High Ambient Temperature Threshold Exceeded (>${gasThresholds.temp}°C)`,
        severity: 'warning' as const,
        description: 'Thermal warning on DHT11 telemetry.',
        poles: tempPoles,
        icon: Thermometer
      }] : []),
      ...(humPoles.length > 0 ? [{
        id: 'humidity',
        title: `High Relative Humidity Level (>${gasThresholds.humidity}%)`,
        severity: 'info' as const,
        description: 'Condensation risk detected on weather sensor enclosure.',
        poles: humPoles,
        icon: CloudRain
      }] : []),
      ...(mq7Poles.length > 0 ? [{
        id: 'mq7',
        title: `Toxic Carbon Monoxide Detected (MQ-7 > ${gasThresholds.mq7} PPM)`,
        severity: 'critical' as const,
        description: 'Carbon monoxide gas spike above standard safety margins.',
        poles: mq7Poles,
        icon: Flame
      }] : []),
      ...(mq135Poles.length > 0 ? [{
        id: 'mq135',
        title: `Air Quality Deterioration (MQ-135 > ${gasThresholds.mq135} PPM)`,
        severity: 'warning' as const,
        description: 'High particulate or ammonia air concentration detected.',
        poles: mq135Poles,
        icon: Flame
      }] : []),
      ...(mq136Poles.length > 0 ? [{
        id: 'mq136',
        title: `Hydrogen Sulfide Gas Alert (MQ-136 > ${gasThresholds.mq136} PPM)`,
        severity: 'warning' as const,
        description: 'Sewer gas / H2S threshold exceeded on sensor cluster.',
        poles: mq136Poles,
        icon: Flame
      }] : []),
      ...(offlinePoles.length > 0 ? [{
        id: 'offline',
        title: 'Mesh Node Heartbeat Timeout',
        severity: 'warning' as const,
        description: 'Telemetry packets stopped arriving for >7 seconds. Possible power or radio loss.',
        poles: offlinePoles,
        icon: AlertTriangle
      }] : [])
    ];
  }, [latestPole1, latestPole2, latestPole3, poleStateMap, gasThresholds]);

  if (realTimeIncidents.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 0 3px #fee2e2'
            }}
          />
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Real-Time Hardware Sensor State (Current Scan)
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {`${realTimeIncidents.length} active physical hazards`}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {realTimeIncidents.map((incident) => {
          const Icon = incident.icon;
          const isCrit = incident.severity === 'critical';
          return (
            <div
              key={incident.id}
              style={{
                backgroundColor: isCrit ? '#fff1f2' : '#fffbeb',
                border: isCrit ? '1px solid #fecdd3' : '1px solid #fde68a',
                borderLeft: `4px solid ${isCrit ? '#dc2626' : '#d97706'}`,
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: isCrit ? '#fee2e2' : '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCrit ? '#dc2626' : '#d97706',
                    flexShrink: 0
                  }}
                >
                  <Icon style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                      {incident.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: isCrit ? '#fee2e2' : '#fef3c7',
                        color: isCrit ? '#b91c1c' : '#b45309'
                      }}
                    >
                      LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {incident.description}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {incident.poles.map((p) => (
                  <button
                    key={p}
                    onClick={() => onJumpToPole(p)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Jump to Pole {p}</span>
                    <ExternalLink style={{ width: '11px', height: '11px' }} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
