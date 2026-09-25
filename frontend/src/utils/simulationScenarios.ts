import type { TelemetryPacket } from '../types/telemetry';

export type ScenarioType =
  | 'NORMAL'
  | 'HIGH_VOLTAGE'
  | 'FIRE_THERMAL'
  | 'FLOOD_SUBMERSION'
  | 'POLE_TILT'
  | 'TOXIC_GAS';

export interface ScenarioDefinition {
  id: ScenarioType;
  label: string;
  description: string;
  badgeColor: string;
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'NORMAL',
    label: 'Normal Mesh Baseline',
    description: 'All 3 poles upright, safe 0.1V water probe, 27°C, safe water & gas levels',
    badgeColor: '#10b981'
  },
  {
    id: 'HIGH_VOLTAGE',
    label: 'Water Electrification',
    description: 'Pole 1 detects voltage leak (12.4V) in submerged water probe',
    badgeColor: '#ef4444'
  },
  {
    id: 'FIRE_THERMAL',
    label: 'Thermal Fire Outbreak',
    description: 'Pole 3 detects extreme temperature spike (68.5°C) & high combustion',
    badgeColor: '#f97316'
  },
  {
    id: 'FLOOD_SUBMERSION',
    label: 'Severe Flood Level',
    description: 'Pole 2 ultrasonic sensor reports water depth exceeding 118 cm',
    badgeColor: '#0ea5e9'
  },
  {
    id: 'POLE_TILT',
    label: 'Structural Tilt / Fallen',
    description: 'Pole 2 tilt sensor trips upright=false (fallen/toppled pole)',
    badgeColor: '#eab308'
  },
  {
    id: 'TOXIC_GAS',
    label: 'Toxic Gas Spike',
    description: 'Pole 1 detects elevated CO (72 ppm) and hazardous pollutants',
    badgeColor: '#a855f7'
  }
];

export function createSimulatedPacket(poleId: number, seq: number, scenario: ScenarioType): TelemetryPacket {
  const now = Math.floor(Date.now() / 1000);
  const isP1 = poleId === 1;
  const isP2 = poleId === 2;
  const isP3 = poleId === 3;

  // Defaults (Normal)
  let voltage = 0.1 + Math.sin(seq / 4) * 0.05 + Math.random() * 0.04;
  let current_ma = 1200 + Math.cos(seq / 5) * 80 + Math.random() * 20;
  let temp = 27.5 + Math.sin(seq / 8) * 1.5 + (Math.random() * 0.4 - 0.2);
  let humidity = 58 + Math.cos(seq / 9) * 4 + (Math.random() * 1 - 0.5);
  let water_depth = isP2 ? 14.0 + Math.sin(seq / 3) * 1.5 : (isP1 ? 12.0 : 4.0);
  let is_upright = true;
  let mq7 = 16.0 + Math.random() * 3;
  let mq135 = 65.0 + Math.random() * 5;
  let mq136 = 8.0 + Math.random() * 2;
  let electrocution_risk = 0;
  let fire_risk = 0;
  let alert_msg: string | null = null;

  // Scenario overrides
  switch (scenario) {
    case 'HIGH_VOLTAGE':
      if (isP1) {
        voltage = 12.8 + Math.sin(seq / 2) * 1.2;
        water_depth = 45.0;
        electrocution_risk = 92;
        alert_msg = 'CRITICAL: Water Electrification Leak Detected on Pole 1';
      }
      break;

    case 'FIRE_THERMAL':
      if (isP3) {
        temp = 68.5 + Math.sin(seq / 2) * 3;
        humidity = 24.0;
        mq7 = 55.0;
        fire_risk = 95;
        alert_msg = 'CRITICAL: Thermal Fire Outbreak (68.5°C) on Pole 3';
      }
      break;

    case 'FLOOD_SUBMERSION':
      if (isP2) {
        water_depth = 118.0 + Math.sin(seq / 2) * 5;
        humidity = 94.0;
        alert_msg = 'WARNING: Water Submersion Depth (118cm) on Pole 2';
      }
      break;

    case 'POLE_TILT':
      if (isP2) {
        is_upright = false;
        alert_msg = 'CRITICAL: Pole 2 Inclinometer Tripped - Structural Tilt / Fallen';
      }
      break;

    case 'TOXIC_GAS':
      if (isP1) {
        mq7 = 72.0 + Math.sin(seq / 2) * 5;
        mq135 = 210.0 + Math.sin(seq / 2) * 15;
        alert_msg = 'WARNING: Toxic Gas Spike (CO 72 ppm, Pollutants 210 ppm) on Pole 1';
      }
      break;

    case 'NORMAL':
    default:
      break;
  }

  const vRounded = Number(voltage.toFixed(1));
  const cRounded = Number(current_ma.toFixed(0));
  const tRounded = Number(temp.toFixed(1));
  const hRounded = Number(humidity.toFixed(1));
  const wRounded = Number(water_depth.toFixed(1));
  const powerRounded = Number(((230 * (cRounded / 1000))).toFixed(1));

  return {
    seq,
    timestamp: now,
    pole_id: poleId,
    mesh_node_id: 1000 + poleId,
    is_online: true,
    alert_message: alert_msg,
    temperature: tRounded,
    humidity: hRounded,
    water_depth: wRounded,
    is_upright,
    voltage: vRounded,
    current_ma: cRounded,
    power: powerRounded,
    energy: Number((1.55 + seq * 0.001).toFixed(3)),
    frequency: 50.0,
    pf: 0.98,
    mq7: Number(mq7.toFixed(1)),
    mq135: Number(mq135.toFixed(1)),
    mq136: Number(mq136.toFixed(1)),
    electrocution_risk_index: electrocution_risk,
    fire_combustion_index: fire_risk,
    sensors: {
      temperature: { val: tRounded, status: temp >= 60 ? 'CRITICAL' : temp > 45 ? 'WARNING' : 'NORMAL', unit: '°C' },
      humidity: { val: hRounded, status: humidity > 85 ? 'WARNING' : 'NORMAL', unit: '%' },
      water_depth: { val: wRounded, status: water_depth > 100 ? 'CRITICAL' : 'NORMAL', unit: 'cm' },
      voltage: { val: vRounded, status: vRounded > 5.0 ? 'CRITICAL' : 'NORMAL', unit: 'V' },
      current_ma: { val: cRounded, status: 'NORMAL', unit: 'mA' },
      power: { val: powerRounded, status: 'NORMAL', unit: 'W' },
      frequency: { val: 50.0, status: 'NORMAL', unit: 'Hz' },
      pf: { val: 0.98, status: 'NORMAL', unit: '' },
      mq7: { val: Number(mq7.toFixed(1)), status: mq7 > 50 ? 'WARNING' : 'NORMAL', unit: 'ppm' },
      mq135: { val: Number(mq135.toFixed(1)), status: mq135 > 150 ? 'WARNING' : 'NORMAL', unit: 'ppm' },
      mq136: { val: Number(mq136.toFixed(1)), status: mq136 > 15 ? 'WARNING' : 'NORMAL', unit: 'ppm' },
      tilt: { val: null, is_upright, status: is_upright ? 'NORMAL' : 'CRITICAL' }
    },
    status: is_upright ? (alert_msg ? (scenario === 'HIGH_VOLTAGE' || scenario === 'FIRE_THERMAL' ? 'CRITICAL' : 'WARNING') : 'NORMAL') : 'CRITICAL',
    source: 'SIMULATOR_DEMO'
  };
}
