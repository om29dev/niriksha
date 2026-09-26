import React from 'react';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Waves,
  Gauge,
  Droplets,
  Wind,
  Compass,
  Move3d,
  Activity
} from 'lucide-react';
import type { TelemetryPacket } from '../../types/telemetry';
import type { DashboardCardConfig, MetricKey } from '../../types/dashboard';
import type { GasThresholdConfig } from '../../constants/gasThresholds';
import { AVAILABLE_METRICS } from '../../constants/dashboardDefaults';
import { MetricCard } from '../MetricCard';

interface DashboardMetricTileProps {
  card: DashboardCardConfig;
  index: number;
  latest: TelemetryPacket | null;
  gasThresholds: GasThresholdConfig;
  onRemoveCard: (id: string) => void;
  isDragging: boolean;
}

export const DashboardMetricTile: React.FC<DashboardMetricTileProps> = ({
  card,
  latest,
  gasThresholds,
  onRemoveCard,
  isDragging
}) => {
  const mKey = card.metricKey as MetricKey;
  const def = AVAILABLE_METRICS.find((m) => m.key === mKey) || {
    key: mKey,
    title: mKey.toUpperCase(),
    unit: '',
    subtitle: '',
    domain: 'motion'
  };

  let title = def.title;
  let unit = def.unit;
  let subtitle = def.subtitle;
  let icon = <Activity style={{ width: '18px', height: '18px', color: '#64748b' }} />;
  let isHazard = false;
  let hazardText = '';
  let hazardBorderColor: string | undefined;
  let hazardBgColor: string | undefined;
  let accentColor = '#0f172a';
  let customValueDisplay: React.ReactNode = undefined;
  let val: number | null | undefined = latest ? (latest as any)[mKey] : null;

  if (mKey === 'voltage') {
    isHazard = !!(val !== null && val !== undefined && val > 5.0);
    hazardText = '⚠️ ELECTRIFICATION HAZARD';
    hazardBorderColor = '#f87171';
    hazardBgColor = '#fef2f2';
    icon = <Zap style={{ width: '18px', height: '18px', color: isHazard ? '#dc2626' : '#d97706' }} />;
  } else if (mKey === 'current_ma' || mKey === 'power' || mKey === 'energy' || mKey === 'frequency' || mKey === 'pf') {
    accentColor = '#7c3aed';
    icon = <Zap style={{ width: '18px', height: '18px', color: '#7c3aed' }} />;
  } else if (mKey === 'is_upright') {
    const isUprightDown = latest?.is_upright === false;
    isHazard = isUprightDown;
    hazardText = '⚠️ Pole Down / Fall Detected';
    icon = isUprightDown ? (
      <AlertTriangle style={{ width: '18px', height: '18px', color: '#dc2626' }} />
    ) : (
      <ShieldCheck style={{ width: '18px', height: '18px', color: '#059669' }} />
    );
    customValueDisplay = (
      <div style={{ fontSize: '1.6rem', fontWeight: '700', color: isUprightDown ? '#dc2626' : latest?.is_upright ? '#059669' : '#64748b' }}>
        {latest?.is_upright === true ? 'UPRIGHT' : latest?.is_upright === false ? 'TILT ALERT' : (
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
            Not Connected
          </span>
        )}
      </div>
    );
  } else if (mKey === 'tilt_angle' || mKey === 'pitch' || mKey === 'roll') {
    accentColor = '#8b5cf6';
    icon = <Compass style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />;
    if (mKey === 'tilt_angle') {
      isHazard = !!(val !== null && val !== undefined && val >= 15.0);
      hazardText = '⚠️ Landslide Ground Shift';
      hazardBorderColor = '#f87171';
      hazardBgColor = '#fef2f2';
      icon = <AlertTriangle style={{ width: '18px', height: '18px', color: isHazard ? '#dc2626' : '#8b5cf6' }} />;
    }
  } else if (mKey === 'water_depth') {
    accentColor = '#0284c7';
    isHazard = !!(val && val > 100.0);
    hazardText = '⚠️ High Flood Warning';
    hazardBorderColor = '#7dd3fc';
    hazardBgColor = '#f0f9ff';
    icon = <Waves style={{ width: '18px', height: '18px', color: '#0284c7' }} />;
  } else if (mKey === 'temperature' || mKey === 'mpu_temperature') {
    accentColor = '#2563eb';
    isHazard = !!(val && val > 45.0);
    hazardText = '⚠️ High Thermal Alert';
    hazardBorderColor = '#fdba74';
    hazardBgColor = '#fff7ed';
    icon = <Gauge style={{ width: '18px', height: '18px', color: isHazard ? '#ea580c' : '#2563eb' }} />;
  } else if (mKey === 'humidity') {
    accentColor = '#059669';
    isHazard = !!(val && val > 85.0);
    hazardText = '⚠️ Moisture Saturation';
    hazardBorderColor = '#86efac';
    hazardBgColor = '#f0fdf4';
    icon = <Droplets style={{ width: '18px', height: '18px', color: '#059669' }} />;
  } else if (mKey === 'mq7' || mKey === 'mq135' || mKey === 'mq136' || mKey === 'mq2') {
    const limit = mKey === 'mq7' ? gasThresholds.mq7 : mKey === 'mq135' ? gasThresholds.mq135 : gasThresholds.mq136;
    isHazard = !!(val && val > limit);
    hazardText = `⚠️ High ${def.title}`;
    hazardBorderColor = '#fdba74';
    hazardBgColor = '#fff7ed';
    icon = <Wind style={{ width: '18px', height: '18px', color: isHazard ? '#ea580c' : '#475569' }} />;
  } else if (mKey.startsWith('accel_') || mKey.startsWith('gyro_')) {
    accentColor = '#0891b2';
    icon = <Move3d style={{ width: '18px', height: '18px', color: '#0891b2' }} />;
  }

  return (
    <MetricCard
      key={card.id}
      title={title}
      value={val}
      unit={unit}
      icon={icon}
      subtitle={subtitle}
      isHazard={isHazard}
      hazardText={hazardText}
      hazardBorderColor={hazardBorderColor}
      hazardBgColor={hazardBgColor}
      accentColor={accentColor}
      customValueDisplay={customValueDisplay}
      onRemove={() => onRemoveCard(card.id)}
      isDragging={isDragging}
    />
  );
};
