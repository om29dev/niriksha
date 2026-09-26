import type { DashboardCardConfig, MetricDefinition, ChartDefinition } from '../types/dashboard';

export const AVAILABLE_METRICS: MetricDefinition[] = [
  // Electrical & Power
  { key: 'voltage', title: 'WATER VOLTAGE', unit: 'V', subtitle: 'Water Probes (Safe 0V)', domain: 'electrical' },
  { key: 'current_ma', title: 'CURRENT', unit: 'A', subtitle: 'Electric Current Flow', domain: 'electrical' },
  { key: 'power', title: 'ACTIVE POWER', unit: 'W', subtitle: 'PZEM Active Power', domain: 'electrical' },
  { key: 'energy', title: 'ENERGY CONSUMED', unit: 'kWh', subtitle: 'Cumulative Energy', domain: 'electrical' },
  { key: 'frequency', title: 'GRID FREQUENCY', unit: 'Hz', subtitle: 'AC Line Frequency', domain: 'electrical' },
  { key: 'pf', title: 'POWER FACTOR', unit: '', subtitle: 'Grid Power Factor', domain: 'electrical' },

  // Environment & Gas
  { key: 'temperature', title: 'TEMPERATURE', unit: '°C', subtitle: 'DHT11 Ambient Temp', domain: 'environment' },
  { key: 'humidity', title: 'HUMIDITY', unit: '%', subtitle: 'DHT11 Relative Humidity', domain: 'environment' },
  { key: 'mq7', title: 'CARBON MONOXIDE', unit: 'ppm', subtitle: 'MQ-7 Toxic CO', domain: 'environment' },
  { key: 'mq135', title: 'AIR QUALITY', unit: 'ppm', subtitle: 'MQ-135 Air Pollution / NH3', domain: 'environment' },
  { key: 'mq136', title: 'SEWAGE GAS', unit: 'ppm', subtitle: 'MQ-136 H2S Sewer Gas', domain: 'environment' },
  { key: 'mq2', title: 'FLAMMABLE GAS', unit: 'ppm', subtitle: 'MQ-2 LPG & Smoke', domain: 'environment' },
  { key: 'mpu_temperature', title: 'IMU CORE TEMP', unit: '°C', subtitle: 'MPU6050 Internal Die Temp', domain: 'environment' },

  // Structural & Motion (Kinematics & Landslide)
  { key: 'is_upright', title: 'UPRIGHT STATUS', unit: '', subtitle: 'Pole Vertical Alignment', domain: 'motion' },
  { key: 'water_depth', title: 'WATER DEPTH', unit: 'cm', subtitle: 'Ultrasonic Submersion', domain: 'motion' },
  { key: 'tilt_angle', title: 'TOTAL TILT ANGLE', unit: '°', subtitle: 'Angular Landslide Deviation', domain: 'motion' },
  { key: 'pitch', title: 'PITCH ANGLE', unit: '°', subtitle: 'Y-Axis Vertical Tilt', domain: 'motion' },
  { key: 'roll', title: 'ROLL ANGLE', unit: '°', subtitle: 'X-Axis Horizontal Roll', domain: 'motion' },
  { key: 'accel_x', title: 'ACCELERATION X', unit: 'm/s²', subtitle: 'Lateral Ground Accel', domain: 'motion' },
  { key: 'accel_y', title: 'ACCELERATION Y', unit: 'm/s²', subtitle: 'Longitudinal Ground Accel', domain: 'motion' },
  { key: 'accel_z', title: 'ACCELERATION Z', unit: 'm/s²', subtitle: 'Vertical Gravity Vector', domain: 'motion' },
  { key: 'gyro_x', title: 'ANGULAR RATE X', unit: '°/s', subtitle: 'Pitch Rotation Speed', domain: 'motion' },
  { key: 'gyro_y', title: 'ANGULAR RATE Y', unit: '°/s', subtitle: 'Roll Rotation Speed', domain: 'motion' },
  { key: 'gyro_z', title: 'ANGULAR RATE Z', unit: '°/s', subtitle: 'Yaw Rotation Speed', domain: 'motion' }
];

export const AVAILABLE_CHARTS: ChartDefinition[] = [
  // Electrical & Power
  { key: 'voltage', title: 'Voltage Curve', subtitle: 'Electrical potential in Volts', unit: 'V', strokeColor: '#d97706', domain: 'electrical' },
  { key: 'current_ma', title: 'Current Curve', subtitle: 'Electrical current in Amperes', unit: 'A', strokeColor: '#7c3aed', domain: 'electrical' },
  { key: 'power', title: 'Power Curve', subtitle: 'Active real power in Watts', unit: 'W', strokeColor: '#b45309', domain: 'electrical' },
  { key: 'energy', title: 'Energy Curve', subtitle: 'Cumulative consumption in kWh', unit: 'kWh', strokeColor: '#059669', domain: 'electrical' },
  { key: 'frequency', title: 'Frequency Curve', subtitle: 'Grid frequency in Hertz', unit: 'Hz', strokeColor: '#2563eb', domain: 'electrical' },
  { key: 'pf', title: 'Power Factor Curve', subtitle: 'Power factor scalar ratio', unit: '', strokeColor: '#6366f1', domain: 'electrical' },

  // Environment & Gas
  { key: 'temperature', title: 'Temperature Curve', subtitle: 'Ambient thermal reading in °C', unit: '°C', strokeColor: '#2563eb', domain: 'environment' },
  { key: 'humidity', title: 'Humidity Curve', subtitle: 'Relative humidity percentage', unit: '%', strokeColor: '#0d9488', domain: 'environment' },
  { key: 'mq7', title: 'Carbon Monoxide Curve', subtitle: 'MQ-7 CO concentration in ppm', unit: 'ppm', strokeColor: '#ea580c', domain: 'environment' },
  { key: 'mq135', title: 'Air Quality Curve', subtitle: 'MQ-135 air pollution in ppm', unit: 'ppm', strokeColor: '#9333ea', domain: 'environment' },
  { key: 'mq136', title: 'Sewage Gas Curve', subtitle: 'MQ-136 H2S concentration in ppm', unit: 'ppm', strokeColor: '#dc2626', domain: 'environment' },
  { key: 'mq2', title: 'Combustible Gas Curve', subtitle: 'MQ-2 flammable vapors in ppm', unit: 'ppm', strokeColor: '#c026d3', domain: 'environment' },
  { key: 'mpu_temperature', title: 'IMU Core Temp Curve', subtitle: 'MPU6050 die temperature in °C', unit: '°C', strokeColor: '#3b82f6', domain: 'environment' },

  // Structural & Motion (Kinematics & Landslide)
  { key: 'water_depth', title: 'Water Depth Curve', subtitle: 'Submersion level in cm', unit: 'cm', strokeColor: '#0284c7', domain: 'motion' },
  { key: 'tilt_angle', title: 'Tilt Angle Deviation', subtitle: 'Landslide / Ground shift deviation from upright in °', unit: '°', strokeColor: '#dc2626', domain: 'motion' },
  { key: 'pitch', title: 'Pitch Angle Curve', subtitle: 'MPU6050 pitch angle in °', unit: '°', strokeColor: '#8b5cf6', domain: 'motion' },
  { key: 'roll', title: 'Roll Angle Curve', subtitle: 'MPU6050 roll angle in °', unit: '°', strokeColor: '#ec4899', domain: 'motion' },
  { key: 'accel_x', title: 'Accel X-Axis Curve', subtitle: 'Lateral acceleration in m/s²', unit: 'm/s²', strokeColor: '#0284c7', domain: 'motion' },
  { key: 'accel_y', title: 'Accel Y-Axis Curve', subtitle: 'Longitudinal acceleration in m/s²', unit: 'm/s²', strokeColor: '#0891b2', domain: 'motion' },
  { key: 'accel_z', title: 'Accel Z-Axis Curve', subtitle: 'Vertical gravity vector in m/s²', unit: 'm/s²', strokeColor: '#16a34a', domain: 'motion' },
  { key: 'gyro_x', title: 'Gyro X Rate Curve', subtitle: 'Angular pitch velocity in °/s', unit: '°/s', strokeColor: '#f59e0b', domain: 'motion' },
  { key: 'gyro_y', title: 'Gyro Y Rate Curve', subtitle: 'Angular roll velocity in °/s', unit: '°/s', strokeColor: '#d97706', domain: 'motion' },
  { key: 'gyro_z', title: 'Gyro Z Rate Curve', subtitle: 'Angular yaw velocity in °/s', unit: '°/s', strokeColor: '#b45309', domain: 'motion' }
];

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  // Value metric cards (1x1)
  { id: 'm-voltage', type: 'metric', metricKey: 'voltage', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-current', type: 'metric', metricKey: 'current_ma', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-upright', type: 'metric', metricKey: 'is_upright', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-tilt', type: 'metric', metricKey: 'tilt_angle', poleId: 3, colSpan: 1, rowSpan: 1 },
  { id: 'm-water', type: 'metric', metricKey: 'water_depth', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-temp', type: 'metric', metricKey: 'temperature', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-humidity', type: 'metric', metricKey: 'humidity', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-mq7', type: 'metric', metricKey: 'mq7', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-mq135', type: 'metric', metricKey: 'mq135', poleId: 1, colSpan: 1, rowSpan: 1 },
  { id: 'm-mq136', type: 'metric', metricKey: 'mq136', poleId: 1, colSpan: 1, rowSpan: 1 },

  // Graph curve cards (2x2)
  { id: 'c-voltage', type: 'chart', chartKey: 'voltage', poleId: 1, colSpan: 2, rowSpan: 2 },
  { id: 'c-current', type: 'chart', chartKey: 'current_ma', poleId: 1, colSpan: 2, rowSpan: 2 },
  { id: 'c-water', type: 'chart', chartKey: 'water_depth', poleId: 1, colSpan: 2, rowSpan: 2 },
  { id: 'c-temp', type: 'chart', chartKey: 'temperature', poleId: 1, colSpan: 2, rowSpan: 2 },
  { id: 'c-tilt', type: 'chart', chartKey: 'tilt_angle', poleId: 3, colSpan: 2, rowSpan: 2 }
];
