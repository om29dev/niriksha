import type { PoleId } from './telemetry';

export type CardType = 'metric' | 'chart';

export type MetricKey =
  | 'voltage'
  | 'current_ma'
  | 'is_upright'
  | 'water_depth'
  | 'temperature'
  | 'humidity'
  | 'mq7'
  | 'mq135'
  | 'mq136';

export type ChartKey =
  | 'voltage'
  | 'current_ma'
  | 'water_depth'
  | 'temperature';

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
}

export interface ChartDefinition {
  key: ChartKey;
  title: string;
  subtitle: string;
  unit: string;
  strokeColor: string;
}
