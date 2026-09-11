import React, { useState, useMemo } from 'react';
import type { PoleId, TelemetryPacket, PoleState } from '../../types/telemetry';
import { FleetFilterBar } from '../fleet/FleetFilterBar';
import { FleetNodeCard } from '../fleet/FleetNodeCard';

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
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const allPoles: { id: PoleId; name: string; type: string; packet: TelemetryPacket | null }[] = useMemo(() => [
    { id: 1, name: 'Pole 1 (Relay Node)', type: 'Leaf Sensor Node • Submersion & Tilt Alert', packet: latestPole1 },
    { id: 2, name: 'Pole 2 (Relay Node)', type: 'Leaf Sensor Node • Power Monitor & Tilt Alert', packet: latestPole2 },
    { id: 3, name: 'Pole 3 (Root Hub)', type: 'Gateway & Mesh Master Node • Weather & Air Quality', packet: latestPole3 }
  ], [latestPole1, latestPole2, latestPole3]);

  const filteredPoles = useMemo(() => {
    return allPoles.filter((pole) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filter & Search Toolbar */}
      <FleetFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isFilterOpen={isFilterOpen}
        onToggleFilterOpen={() => setIsFilterOpen((prev) => !prev)}
        onCloseFilter={() => setIsFilterOpen(false)}
        showingCount={filteredPoles.length}
        totalCount={allPoles.length}
      />

      {/* Grid of Pole Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        {filteredPoles.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b'
            }}
          >
            No poles matched the current search or status filter.
          </div>
        ) : (
          filteredPoles.map(({ id, name, type, packet }) => (
            <FleetNodeCard
              key={id}
              id={id}
              name={name}
              type={type}
              packet={packet}
              state={poleStateMap[id]}
              onSelectPole={onSelectPole}
            />
          ))
        )}
      </div>
    </div>
  );
};
