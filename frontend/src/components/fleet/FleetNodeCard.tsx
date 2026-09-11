import React from 'react';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  Layers,
  Clock,
  ExternalLink,
  Zap,
  Waves,
  Thermometer,
  Wind,
  Droplets,
  ShieldCheck,
  Radio
} from 'lucide-react';
import type { PoleId, TelemetryPacket, PoleState } from '../../types/telemetry';

interface FleetNodeCardProps {
  id: PoleId;
  name: string;
  type: string;
  packet: TelemetryPacket | null;
  state?: PoleState;
  onSelectPole: (id: PoleId) => void;
}

const renderSensorStatus = (val: number | boolean | null | undefined) => {
  if (val === null || val === undefined) {
    return (
      <span style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
        Not Connected
      </span>
    );
  }

  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: '600',
        color: '#059669',
        backgroundColor: '#ecfdf5',
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#10b981'
        }}
      />
      Connected
    </span>
  );
};

export const FleetNodeCard: React.FC<FleetNodeCardProps> = ({
  id,
  name,
  type,
  packet,
  state,
  onSelectPole
}) => {
  const isDown = state?.isDown || packet?.is_upright === false;
  const isOffline = state?.isOffline;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: isDown ? '2px solid #ef4444' : isOffline ? '1px solid #fde68a' : '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: isDown ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      {/* Header: Name, Status Badge, View Graphs Button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{name}</h3>
            {isDown ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#dc2626',
                  backgroundColor: '#fee2e2',
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}
              >
                <AlertTriangle style={{ width: '12px', height: '12px' }} />
                POLE TILTED
              </span>
            ) : isOffline ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#b45309',
                  backgroundColor: '#fef3c7',
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}
              >
                <WifiOff style={{ width: '12px', height: '12px' }} />
                OFFLINE
              </span>
            ) : (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#059669',
                  backgroundColor: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}
              >
                <Wifi style={{ width: '12px', height: '12px' }} />
                ONLINE
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', minHeight: '34px' }}>{type}</div>
        </div>

        <button
          onClick={() => onSelectPole(id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Dashboard Graphs
          <ExternalLink style={{ width: '12px', height: '12px' }} />
        </button>
      </div>

      {/* Heartbeat & Node Metadata Row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '10px 12px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          fontSize: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock style={{ width: '14px', height: '14px', color: '#2563eb' }} />
            Last Seen:
          </span>
          <strong style={{ color: '#0f172a' }}>
            {packet ? new Date(packet.timestamp * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Waiting for packet...'}
          </strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers style={{ width: '14px', height: '14px', color: '#2563eb' }} />
            Pole ID:
          </span>
          <strong style={{ color: '#0f172a' }}>
            #{packet?.pole_id ?? id}
          </strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio style={{ width: '14px', height: '14px', color: '#2563eb' }} />
            Mesh Node ID:
          </span>
          <strong style={{ color: '#0f172a' }}>
            {packet?.mesh_node_id !== undefined && packet?.mesh_node_id !== null
              ? String(packet.mesh_node_id).padStart(2, '0')
              : String(id).padStart(2, '0')}
          </strong>
        </div>
      </div>

      {/* Real-time Telemetry Sensor Connectivity Table */}
      <div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#334155',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <span>Sensors Connectivity</span>
          <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>
            {packet ? 'Node Active' : 'Node Inactive'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            border: '1px solid #f1f5f9',
            borderRadius: '6px',
            padding: '8px',
            backgroundColor: '#fafbfc'
          }}
        >
          {/* 1. Water Voltage */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Zap style={{ width: '14px', height: '14px', color: '#d97706' }} />
              Water Probe Voltage
            </span>
            {renderSensorStatus(packet?.voltage)}
          </div>

          {/* 2. Current */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Zap style={{ width: '14px', height: '14px', color: '#7c3aed' }} />
              Current
            </span>
            {renderSensorStatus(packet?.current_ma)}
          </div>

          {/* 3. Upright / Tilt Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <ShieldCheck style={{ width: '14px', height: '14px', color: '#059669' }} />
              Tilt Sensor
            </span>
            {renderSensorStatus(packet?.is_upright)}
          </div>

          {/* 4. Water Depth */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Waves style={{ width: '14px', height: '14px', color: '#0284c7' }} />
              Water Depth Sensor
            </span>
            {renderSensorStatus(packet?.water_depth)}
          </div>

          {/* 5. Temperature */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Thermometer style={{ width: '14px', height: '14px', color: '#2563eb' }} />
              Temperature Sensor
            </span>
            {renderSensorStatus(packet?.temperature)}
          </div>

          {/* 6. Humidity */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Droplets style={{ width: '14px', height: '14px', color: '#059669' }} />
              Humidity Sensor
            </span>
            {renderSensorStatus(packet?.humidity)}
          </div>

          {/* 7. Carbon Monoxide (MQ-7) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Wind style={{ width: '14px', height: '14px', color: '#64748b' }} />
              Carbon Monoxide (MQ-7)
            </span>
            {renderSensorStatus(packet?.mq7)}
          </div>

          {/* 8. Air Quality (MQ-135) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Wind style={{ width: '14px', height: '14px', color: '#64748b' }} />
              Air Quality (MQ-135)
            </span>
            {renderSensorStatus(packet?.mq135)}
          </div>

          {/* 9. Sewage Gas (MQ-136) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Wind style={{ width: '14px', height: '14px', color: '#64748b' }} />
              Sewage Gas (MQ-136)
            </span>
            {renderSensorStatus(packet?.mq136)}
          </div>
        </div>
      </div>
    </div>
  );
};
