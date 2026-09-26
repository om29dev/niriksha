export interface SensorPoint {
  val: number | null;
  status: string;
  unit?: string;
  is_upright?: boolean | null;
}

export interface TelemetryPacket {
  seq: number;
  timestamp: number;
  pole_id: number;
  mesh_node_id?: number;
  is_online?: boolean;
  alert_message?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  water_depth?: number | null;
  is_upright?: boolean | null;
  voltage?: number | null;
  current_ma?: number | null;
  power?: number | null;
  energy?: number | null;
  frequency?: number | null;
  pf?: number | null;
  mq7?: number | null;
  mq135?: number | null;
  mq136?: number | null;
  mq2?: number | null;
  accel_x?: number | null;
  accel_y?: number | null;
  accel_z?: number | null;
  gyro_x?: number | null;
  gyro_y?: number | null;
  gyro_z?: number | null;
  pitch?: number | null;
  roll?: number | null;
  tilt_angle?: number | null;
  mpu_temperature?: number | null;
  electrocution_risk_index?: number;
  fire_combustion_index?: number;
  sensors?: Record<string, SensorPoint>;
  status: string;
  source?: string;
}

export interface PortInfo {
  device: string;
  description: string;
  hwid: string;
}

export type PoleId = 1 | 2 | 3;

export interface PoleState {
  isDown: boolean;
  isOffline: boolean;
  secondsSince: number | null;
}

export type TimeRangeOption = 'realtime' | '1h' | '6h' | '24h';

export interface PersistentAlert {
  id: number;
  pole_id: PoleId;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  trigger_value: number | null;
  unit: string;
  status: 'UNRESOLVED' | 'RESOLVED';
  triggered_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
}
