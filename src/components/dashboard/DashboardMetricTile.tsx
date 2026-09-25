import React from 'react';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Waves,
  Gauge,
  Droplets,
  Wind
} from 'lucide-react';
import type { TelemetryPacket } from '../../types/telemetry';
import type { DashboardCardConfig, MetricKey } from '../../types/dashboard';
import type { GasThresholdConfig } from '../../constants/gasThresholds';
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

  let title = 'METRIC';
  let unit = '';
  let subtitle = '';
  let icon = <Zap style={{ width: '18px', height: '18px', color: '#64748b' }} />;
  let isHazard = false;
  let hazardText = '';
  let hazardBorderColor: string | undefined;
  let hazardBgColor: string | undefined;
  let accentColor = '#0f172a';
  let customValueDisplay: React.ReactNode = undefined;
  let val: number | null | undefined = null;

  if (mKey === 'voltage') {
    title = 'WATER VOLTAGE';
    val = latest?.voltage;
    unit = 'V';
    subtitle = 'Water Probes (Safe 0V)';
    isHazard = !!(val !== null && val !== undefined && val > 5.0);
    hazardText = '⚠️ ELECTRIFICATION HAZARD';
    hazardBorderColor = '#f87171';
    hazardBgColor = '#fef2f2';
    icon = <Zap style={{ width: '18px', height: '18px', color: isHazard ? '#dc2626' : '#d97706' }} />;
  } else if (mKey === 'current_ma') {
    title = 'CURRENT';
    val = latest?.current_ma;
    unit = 'A';
    subtitle = 'Electric Current Flow';
    accentColor = '#7c3aed';
    icon = <Zap style={{ width: '18px', height: '18px', color: '#7c3aed' }} />;
  } else if (mKey === 'is_upright') {
    title = 'UPRIGHT STATUS';
    subtitle = 'Pole Vertical Alignment';
    const isUprightDown = latest?.is_upright === false;
    isHazard = isUprightDown;
    hazardText = '⚠️ Pole Down / Fall Detected';
    icon = isUprightDown ? (
      <AlertTriangle style={{ width: '18px', height: '18px', color: '#dc2626' }} />
    ) : (
      <ShieldCheck style={{ width: '18px', height: '18px', color: '#059669' }} />
    );
    customValueDisplay = (
      <div
        style={{
          fontSize: '1.6rem',
          fontWeight: '700',
          color: isUprightDown ? '#dc2626' : latest?.is_upright ? '#059669' : '#64748b'
        }}
      >
        {latest?.is_upright === true ? 'UPRIGHT' : latest?.is_upright === false ? 'TILT ALERT' : (
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
            Not Connected
          </span>
        )}
      </div>
    );
  } else if (mKey === 'water_depth') {
    title = 'WATER DEPTH';
    val = latest?.water_depth;
    unit = 'cm';
    subtitle = 'Submersion Level';
    accentColor = '#0284c7';
    isHazard = !!(latest?.water_depth && latest.water_depth > 100.0);
    hazardText = '⚠️ High Flood Warning';
    hazardBorderColor = '#7dd3fc';
    hazardBgColor = '#f0f9ff';
    icon = <Waves style={{ width: '18px', height: '18px', color: '#0284c7' }} />;
  } else if (mKey === 'temperature') {
    title = 'TEMPERATURE';
    val = latest?.temperature;
    unit = '°C';
    subtitle = 'Ambient Temperature';
    accentColor = '#2563eb';
    isHazard = !!(latest?.temperature && latest.temperature > 45.0);
    hazardText = '⚠️ High Thermal Alert';
    hazardBorderColor = '#fdba74';
    hazardBgColor = '#fff7ed';
    icon = <Gauge style={{ width: '18px', height: '18px', color: isHazard ? '#ea580c' : '#2563eb' }} />;
  } else if (mKey === 'humidity') {
    title = 'HUMIDITY';
    val = latest?.humidity;
    unit = '%';
    subtitle = 'Relative Humidity';
    accentColor = '#059669';
    isHazard = !!(val && val > 85.0);
    hazardText = '⚠️ Moisture Saturation';
    hazardBorderColor = '#86efac';
    hazardBgColor = '#f0fdf4';
    icon = <Droplets style={{ width: '18px', height: '18px', color: '#059669' }} />;
  } else if (mKey === 'mq7') {
    title = 'CARBON MONOXIDE';
    val = latest?.mq7;
    unit = 'ppm';
    subtitle = 'Carbon Monoxide';
    isHazard = !!(latest?.mq7 && latest.mq7 > gasThresholds.mq7);
    hazardText = '⚠️ High CO Level';
    hazardBorderColor = '#fdba74';
    hazardBgColor = '#fff7ed';
    icon = <Wind style={{ width: '18px', height: '18px', color: isHazard ? '#ea580c' : '#475569' }} />;
  } else if (mKey === 'mq135') {
    title = 'AIR QUALITY';
    val = latest?.mq135;
    unit = 'ppm';
    subtitle = 'Air Pollution / NH3 / NOx';
    accentColor = '#9333ea';
    isHazard = !!(latest?.mq135 && latest.mq135 > gasThresholds.mq135);
    hazardText = '⚠️ Hazardous Air Quality';
    hazardBorderColor = '#d8b4fe';
    hazardBgColor = '#faf5ff';
    icon = <Wind style={{ width: '18px', height: '18px', color: isHazard ? '#9333ea' : '#475569' }} />;
  } else if (mKey === 'mq136') {
    title = 'SEWAGE GAS';
    val = latest?.mq136;
    unit = 'ppm';
    subtitle = 'Sewage Gas / Toxic Vapors';
    accentColor = '#dc2626';
    isHazard = !!(latest?.mq136 && latest.mq136 > gasThresholds.mq136);
    hazardText = '⚠️ Toxic Sewage Gas';
    hazardBorderColor = '#fca5a5';
    hazardBgColor = '#fef2f2';
    icon = <Wind style={{ width: '18px', height: '18px', color: isHazard ? '#dc2626' : '#475569' }} />;
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
