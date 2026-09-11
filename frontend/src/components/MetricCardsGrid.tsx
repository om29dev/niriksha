import React from 'react';
import { Zap, AlertTriangle, ShieldCheck, Waves, Gauge, Droplets, Wind, Flame } from 'lucide-react';
import type { TelemetryPacket } from '../types/telemetry';
import { MetricCard } from './MetricCard';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../constants/gasThresholds';

interface MetricCardsGridProps {
  selectedLatest: TelemetryPacket | null;
  gasThresholds?: Partial<GasThresholdConfig>;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ selectedLatest, gasThresholds: customThresholds }) => {
  const gasThresholds = { ...DEFAULT_GAS_THRESHOLDS, ...customThresholds };
  const isVoltageHazard = !!(selectedLatest?.voltage !== null && selectedLatest?.voltage !== undefined && selectedLatest.voltage > 5.0);
  const isUprightDown = selectedLatest?.is_upright === false;
  const isFloodHazard = !!(selectedLatest?.water_depth && selectedLatest.water_depth > 100.0);
  const isTempHazard = !!(selectedLatest?.temperature && selectedLatest.temperature > 45.0);
  const isHumidityHazard = !!(selectedLatest?.humidity && selectedLatest.humidity > 85.0);
  const isMq7Hazard = !!(selectedLatest?.mq7 && selectedLatest.mq7 > gasThresholds.mq7);
  const isMq135Hazard = !!(selectedLatest?.mq135 && selectedLatest.mq135 > gasThresholds.mq135);
  const isMq136Hazard = !!(selectedLatest?.mq136 && selectedLatest.mq136 > gasThresholds.mq136);
  const isMq2Hazard = !!(selectedLatest?.mq2 && selectedLatest.mq2 > gasThresholds.mq2);


  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* 1. Water Probe Voltage */}
      <MetricCard
        title="WATER VOLTAGE"
        value={selectedLatest?.voltage}
        unit="V"
        icon={<Zap style={{ width: '20px', height: '20px', color: isVoltageHazard ? '#dc2626' : '#d97706' }} />}
        subtitle="Water Probes (Safe 0V)"
        isHazard={isVoltageHazard}
        hazardText="⚠️ ELECTRIFICATION HAZARD"
        hazardBorderColor="#f87171"
        hazardBgColor="#fef2f2"
      />

      {/* 2. Current */}
      <MetricCard
        title="CURRENT"
        value={selectedLatest?.current_ma}
        unit="A"
        icon={<Zap style={{ width: '20px', height: '20px', color: '#7c3aed' }} />}
        subtitle="Electric Current Flow"
        accentColor="#7c3aed"
      />

      {/* 3. Upright Status */}
      <MetricCard
        title="UPRIGHT STATUS"
        value={null}
        unit=""
        icon={
          isUprightDown ? (
            <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
          ) : (
            <ShieldCheck style={{ width: '20px', height: '20px', color: '#059669' }} />
          )
        }
        subtitle="Pole Vertical Alignment"
        isHazard={isUprightDown}
        hazardText="⚠️ Pole Down / Fall Detected"
        customValueDisplay={
          <div style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: isUprightDown ? '#dc2626' : selectedLatest?.is_upright ? '#059669' : '#64748b'
          }}>
            {selectedLatest?.is_upright === true ? 'UPRIGHT' : selectedLatest?.is_upright === false ? 'TILT ALERT' : (
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                Not Connected
              </span>
            )}
          </div>
        }
      />

      {/* 4. Water Depth */}
      <MetricCard
        title="WATER DEPTH"
        value={selectedLatest?.water_depth}
        unit="cm"
        icon={<Waves style={{ width: '20px', height: '20px', color: '#0284c7' }} />}
        subtitle="Submersion Level"
        accentColor="#0284c7"
        isHazard={isFloodHazard}
        hazardText="⚠️ High Flood Warning"
        hazardBorderColor="#7dd3fc"
        hazardBgColor="#f0f9ff"
      />

      {/* 5. Temperature */}
      <MetricCard
        title="TEMPERATURE"
        value={selectedLatest?.temperature}
        unit="°C"
        icon={<Gauge style={{ width: '20px', height: '20px', color: isTempHazard ? '#ea580c' : '#2563eb' }} />}
        subtitle="Ambient Temperature"
        accentColor="#2563eb"
        isHazard={isTempHazard}
        hazardText="⚠️ High Thermal Alert"
        hazardBorderColor="#fdba74"
        hazardBgColor="#fff7ed"
      />

      {/* 6. Humidity */}
      <MetricCard
        title="HUMIDITY"
        value={selectedLatest?.humidity}
        unit="%"
        icon={<Droplets style={{ width: '20px', height: '20px', color: '#059669' }} />}
        subtitle="Relative Humidity"
        accentColor="#059669"
        isHazard={isHumidityHazard}
        hazardText="⚠️ Moisture Saturation"
        hazardBorderColor="#86efac"
        hazardBgColor="#f0fdf4"
      />

      {/* 7. Carbon Monoxide */}
      <MetricCard
        title="CARBON MONOXIDE"
        value={selectedLatest?.mq7}
        unit="ppm"
        icon={<Wind style={{ width: '20px', height: '20px', color: isMq7Hazard ? '#ea580c' : '#475569' }} />}
        subtitle="Carbon Monoxide"
        accentColor="#0f172a"
        isHazard={isMq7Hazard}
        hazardText="⚠️ High CO Level"
        hazardBorderColor="#fdba74"
        hazardBgColor="#fff7ed"
      />

      {/* 8. Air Quality */}
      <MetricCard
        title="AIR QUALITY"
        value={selectedLatest?.mq135}
        unit="ppm"
        icon={<Wind style={{ width: '20px', height: '20px', color: isMq135Hazard ? '#9333ea' : '#475569' }} />}
        subtitle="Air Pollution / NH3 / NOx"
        accentColor="#9333ea"
        isHazard={isMq135Hazard}
        hazardText="⚠️ Hazardous Air Quality"
        hazardBorderColor="#d8b4fe"
        hazardBgColor="#faf5ff"
      />

      {/* 9. Sewage Gas */}
      <MetricCard
        title="SEWAGE GAS"
        value={selectedLatest?.mq136}
        unit="ppm"
        icon={<Wind style={{ width: '20px', height: '20px', color: isMq136Hazard ? '#dc2626' : '#475569' }} />}
        subtitle="Sewage Gas / Toxic Vapors"
        accentColor="#dc2626"
        isHazard={isMq136Hazard}
        hazardText="⚠️ Toxic Sewage Gas"
        hazardBorderColor="#fca5a5"
        hazardBgColor="#fef2f2"
      />

      {/* 10. Smoke / Gas Leakage */}
      <MetricCard
        title="SMOKE / GAS LEAKAGE"
        value={selectedLatest?.mq2}
        unit="ppm"
        icon={<Flame style={{ width: '20px', height: '20px', color: isMq2Hazard ? '#c2410c' : '#475569' }} />}
        subtitle="Smoke & Combustible Gas"
        accentColor="#0f172a"
        isHazard={isMq2Hazard}
        hazardText="⚠️ Smoke / Gas Detected"
        hazardBorderColor="#fed7aa"
        hazardBgColor="#fff7ed"
      />
    </section>
  );
};
