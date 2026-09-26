import type { PoleId } from './telemetry';

export type CardType = 'metric' | 'chart';

export type SensorDomain = 'electrical' | 'environment' | 'motion';

export type MetricKey =
  | 'voltage'
  | 'current_ma'
  | 'power'
  | 'energy'
  | 'frequency'
  | 'pf'
  | 'temperature'
  | 'humidity'
  | 'mq7'
  | 'mq135'
  | 'mq136'
  | 'mq2'
  | 'mpu_temperature'
  | 'is_upright'
  | 'water_depth'
  | 'pitch'
  | 'roll'
  | 'tilt_angle'
  | 'accel_x'
  | 'accel_y'
  | 'accel_z'
  | 'gyro_x'
  | 'gyro_y'
  | 'gyro_z';

export type ChartKey = MetricKey;

export interface DashboardCardConfig {
  id: string;
  type: CardType;
  metricKey?: MetricKey;
  chartKey?: ChartKey;
  poleId: PoleId;
  colSpan: 1 | 2; // 1 for 1x1, 2 for 2x2
  rowSpan: 1 | 2; // 1 for 1x1, 2 for 2x2
}

export interface MetricDefinition {
  key: MetricKey;
  title: string;
  unit: string;
  subtitle: string;
  domain: SensorDomain;
}

export interface ChartDefinition {
  key: ChartKey;
  title: string;
  subtitle: string;
  unit: string;
  strokeColor: string;
  domain: SensorDomain;
}
