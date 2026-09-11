import type { DashboardCardConfig, MetricDefinition, ChartDefinition } from '../types/dashboard';

export const AVAILABLE_METRICS: MetricDefinition[] = [
  { key: 'voltage', title: 'WATER VOLTAGE', unit: 'V', subtitle: 'Water Probes (Safe 0V)' },
  { key: 'current_ma', title: 'CURRENT', unit: 'A', subtitle: 'Electric Current Flow' },
  { key: 'is_upright', title: 'UPRIGHT STATUS', unit: '', subtitle: 'Pole Vertical Alignment' },
  { key: 'water_depth', title: 'WATER DEPTH', unit: 'cm', subtitle: 'Submersion Level' },
  { key: 'temperature', title: 'TEMPERATURE', unit: '°C', subtitle: 'Ambient Temperature' },
  { key: 'humidity', title: 'HUMIDITY', unit: '%', subtitle: 'Relative Humidity' },
  { key: 'mq7', title: 'CARBON MONOXIDE', unit: 'ppm', subtitle: 'Carbon Monoxide' },
  { key: 'mq135', title: 'AIR QUALITY', unit: 'ppm', subtitle: 'Air Pollution / NH3 / NOx' },
  { key: 'mq136', title: 'SEWAGE GAS', unit: 'ppm', subtitle: 'Sewage Gas / Toxic Vapors' },
  { key: 'mq2', title: 'SMOKE / GAS LEAKAGE', unit: 'ppm', subtitle: 'Smoke & Combustible Gas' }
];

export const AVAILABLE_CHARTS: ChartDefinition[] = [
  {
    key: 'voltage',
    title: 'Voltage Curve',
    subtitle: 'Electrical potential in Volts',
    unit: 'V',
    strokeColor: '#d97706'
  },
  {
    key: 'current_ma',
    title: 'Current Curve',
    subtitle: 'Electrical current in Amperes',
    unit: 'A',
    strokeColor: '#7c3aed'
  },
  {
    key: 'water_depth',
    title: 'Water Depth Curve',
    subtitle: 'Submersion level in cm',
    unit: 'cm',
    strokeColor: '#0284c7'
  },
  {
    key: 'temperature',
    title: 'Temperature Curve',
    subtitle: 'Ambient thermal reading in °C',
    unit: '°C',
    strokeColor: '#2563eb'
  }
];

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  // Value metric cards (1x1)
  { id: 'm-voltage', type: 'metric', metricKey: 'voltage', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-current', type: 'metric', metricKey: 'current_ma', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-upright', type: 'metric', metricKey: 'is_upright', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-water', type: 'metric', metricKey: 'water_depth', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-temp', type: 'metric', metricKey: 'temperature', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-humidity', type: 'metric', metricKey: 'humidity', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-mq7', type: 'metric', metricKey: 'mq7', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-mq135', type: 'metric', metricKey: 'mq135', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-mq136', type: 'metric', metricKey: 'mq136', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-mq2', type: 'metric', metricKey: 'mq2', poleId: 1, colSpan: 1, rowSpan: 1 },

  // Graph curve cards (2x2)
  { id: 'c-voltage', type: 'chart', chartKey: 'voltage', poleId: 1, colSpan: 2, rowSpan: 2 },
  { id: 'c-current', type: 'chart', chartKey: 'current_ma', poleId: 1, colSpan: 2, rowSpan: 2 },
  { id: 'c-water', type: 'chart', chartKey: 'water_depth', poleId: 1, colSpan: 2, rowSpan: 2 },
  { id: 'c-temp', type: 'chart', chartKey: 'temperature', poleId: 1, colSpan: 2, rowSpan: 2 }
];
