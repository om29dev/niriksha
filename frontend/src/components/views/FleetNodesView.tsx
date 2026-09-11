import React, { useState, useMemo } from 'react';
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
  Flame,
  Droplets,
  ShieldCheck,
  Radio,
  Search,
  Filter
} from 'lucide-react';
import type { PoleId, TelemetryPacket, PoleState } from '../../types/telemetry';

interface FleetNodesViewProps {
  poleStateMap: Record<PoleId, PoleState>;
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  onSelectPole: (poleId: PoleId) => void;
}

export const FleetNodesView: React.FC<FleetNodesViewProps> = ({
  poleStateMap,
  latestPole1,
  latestPole2,
  latestPole3,
  onSelectPole
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'down' | 'offline'>('all');

  const allPoles: { id: PoleId; name: string; type: string; packet: TelemetryPacket | null }[] = [
    { id: 1, name: 'Pole 1 (Relay Node)', type: 'Leaf Sensor Node • Submersion & Tilt Alert', packet: latestPole1 },
    { id: 2, name: 'Pole 2 (Relay Node)', type: 'Leaf Sensor Node • Power Monitor & Tilt Alert', packet: latestPole2 },
    { id: 3, name: 'Pole 3 (Root Hub)', type: 'Gateway & Mesh Master Node • Weather & Air Quality', packet: latestPole3 }
  ];

  const filteredPoles = useMemo(() => {
    return allPoles.filter(pole => {
      const state = poleStateMap[pole.id];
      const isDown = state?.isDown || pole.packet?.is_upright === false;
      const isOffline = state?.isOffline;

      if (statusFilter === 'down' && !isDown) return false;
      if (statusFilter === 'offline' && !isOffline) return false;
      if (statusFilter === 'online' && (isDown || isOffline)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = pole.name.toLowerCase().includes(q);
        const matchesType = pole.type.toLowerCase().includes(q);
        const matchesId = `pole ${pole.id}`.includes(q) || String(pole.id) === q;
        if (!matchesName && !matchesType && !matchesId) return false;
      }

      return true;
    });
  }, [allPoles, poleStateMap, searchQuery, statusFilter]);

  // Helper to format sensor display: only Connected or Not Connected badge
  const renderSensorStatus = (
    val: number | boolean | null | undefined
  ) => {
    if (val === null || val === undefined) {
      return (
        <span style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
          Not Connected
        </span>
      );
    }

    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '600',
        color: '#059669',
        backgroundColor: '#ecfdf5',
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#10b981'
        }} />
        Connected
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            Mesh Fleet Node Architecture & Real-Time Telemetry
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Live readings, hardware status, and sensor suite across all three air-gapped field poles.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '6px 12px',
            width: '240px'
          }}>
            <Search style={{ width: '15px', height: '15px', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search poles by ID or role..."
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                color: '#0f172a',
                width: '100%'
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter style={{ width: '14px', height: '14px', color: '#64748b' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: '600',
                color: '#334155',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">All States</option>
              <option value="online">Online Only</option>
              <option value="down">Tilted Hazards Only</option>
              <option value="offline">Offline Only</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <Layers style={{ width: '15px', height: '15px' }} />
            {filteredPoles.length} / {allPoles.length} Nodes
          </div>
        </div>
      </div>

      {/* Grid of Pole Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {filteredPoles.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#64748b'
          }}>
            No poles matched the current search or status filter.
          </div>
        ) : (
          filteredPoles.map(({ id, name, type, packet }) => {
          const state = poleStateMap[id];
          const isDown = state?.isDown || packet?.is_upright === false;
          const isOffline = state?.isOffline;

          return (
            <div
              key={id}
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
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#dc2626',
                        backgroundColor: '#fee2e2',
                        padding: '2px 8px',
                        borderRadius: '9999px'
                      }}>
                        <AlertTriangle style={{ width: '12px', height: '12px' }} />
                        POLE TILTED
                      </span>
                    ) : isOffline ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#b45309',
                        backgroundColor: '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: '9999px'
                      }}>
                        <WifiOff style={{ width: '12px', height: '12px' }} />
                        OFFLINE
                      </span>
                    ) : (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#059669',
                        backgroundColor: '#ecfdf5',
                        padding: '2px 8px',
                        borderRadius: '9999px'
                      }}>
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
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
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
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#334155',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Sensors Connectivity</span>
                  <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>
                    {packet ? 'Node Active' : 'Node Inactive'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '1px solid #f1f5f9',
                  borderRadius: '6px',
                  padding: '8px',
                  backgroundColor: '#fafbfc'
                }}>
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

                  {/* 10. Smoke / Gas Leakage (MQ-2) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                      <Flame style={{ width: '14px', height: '14px', color: '#64748b' }} />
                      Smoke / Gas (MQ-2)
                    </span>
                    {renderSensorStatus(packet?.mq2)}
                  </div>
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
