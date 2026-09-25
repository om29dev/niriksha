import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { TelemetryPacket, PoleId } from '../../types/telemetry';
import { HistoryFilterBar } from '../history/HistoryFilterBar';
import { HistoryTable, type SortColumn, type SortDirection } from '../history/HistoryTable';
import { HistoryPagination } from '../history/HistoryPagination';
import { HistoryPacketModal } from '../history/HistoryPacketModal';

const generateHistoricalRecords = (): TelemetryPacket[] => {
  const list: TelemetryPacket[] = [];
  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < 90; i++) {
    const poleId = ((i % 3) + 1) as 1 | 2 | 3;
    const timeOffset = (90 - i) * 20;
    const isUpright = i !== 42 && i !== 75;
    list.push({
      pole_id: poleId,
      seq: 2000 - (90 - i),
      timestamp: now - timeOffset,
      is_upright: isUpright,
      voltage: Number((0.04 + (i % 5) * 0.08).toFixed(2)),
      water_depth: Number((12.5 + (i % 7) * 1.5).toFixed(1)),
      power: Number((14.2 + (i % 4) * 0.8).toFixed(1)),
      temperature: Number((26.0 + (i % 6) * 0.7).toFixed(1)),
      humidity: Number((58.0 + (i % 8) * 1.2).toFixed(1)),
      mq7: Number((8.5 + (i % 5) * 1.2).toFixed(1)),
      mq135: Number((24.0 + (i % 6) * 2.1).toFixed(1)),
      mq136: Number((3.2 + (i % 4) * 0.5).toFixed(1)),
      status: 'HISTORY',
      alert_message: isUpright ? undefined : `Pole ${poleId} structural tilt detected`
    });
  }
  return list.reverse();
};

export const HistoryView: React.FC = () => {
  const [allRecords] = useState<TelemetryPacket[]>(generateHistoricalRecords);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [poleFilter, setPoleFilter] = useState<PoleId | 'all'>('all');
  const [uprightFilter, setUprightFilter] = useState<'all' | 'upright' | 'tilted'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);
  const [selectedPacketModal, setSelectedPacketModal] = useState<TelemetryPacket | null>(null);

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('seq');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 150);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(column === 'seq' ? 'desc' : 'asc');
    }
  };

  const filteredRecords = useMemo(() => {
    let result = allRecords;

    if (poleFilter !== 'all') {
      result = result.filter((r) => r.pole_id === poleFilter);
    }

    if (uprightFilter === 'upright') {
      result = result.filter((r) => r.is_upright === true);
    } else if (uprightFilter === 'tilted') {
      result = result.filter((r) => r.is_upright === false);
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase().trim();

    return result.filter((r) => {
      if (`#${r.seq}`.includes(q) || String(r.seq).includes(q)) return true;
      if (`pole ${r.pole_id}`.toLowerCase().includes(q) || String(r.pole_id) === q) return true;
      const orientationStr = r.is_upright === false ? 'tilted fallen' : 'upright';
      if (orientationStr.includes(q)) return true;
      if (r.voltage !== null && r.voltage !== undefined && `${r.voltage.toFixed(1)}v`.includes(q)) return true;
      if (r.water_depth !== null && r.water_depth !== undefined && `${r.water_depth.toFixed(1)}cm`.includes(q)) return true;
      if (r.power !== null && r.power !== undefined && `${r.power.toFixed(1)}w`.includes(q)) return true;
      if (r.temperature !== null && r.temperature !== undefined && `${r.temperature.toFixed(1)}c`.includes(q)) return true;
      if (r.humidity !== null && r.humidity !== undefined && `${r.humidity.toFixed(0)}%`.includes(q)) return true;
      if (r.mq7 !== null && r.mq7 !== undefined && `co ${r.mq7.toFixed(0)}`.includes(q)) return true;
      if (r.mq135 !== null && r.mq135 !== undefined && `air ${r.mq135.toFixed(0)}`.includes(q)) return true;
      return false;
    });
  }, [allRecords, poleFilter, uprightFilter, searchQuery]);

  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      let valA: any = a[sortColumn] ?? (sortColumn === 'is_upright' ? (a.is_upright ? 1 : 0) : -9999);
      let valB: any = b[sortColumn] ?? (sortColumn === 'is_upright' ? (b.is_upright ? 1 : 0) : -9999);
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRecords, sortColumn, sortDirection]);

  const totalCount = sortedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <HistoryFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        poleFilter={poleFilter}
        setPoleFilter={(id) => { setPoleFilter(id); setCurrentPage(1); }}
        uprightFilter={uprightFilter}
        setUprightFilter={(val) => { setUprightFilter(val); setCurrentPage(1); }}
        isFilterDropdownOpen={isFilterDropdownOpen}
        setIsFilterDropdownOpen={setIsFilterDropdownOpen}
        onRefresh={fetchHistory}
        isLoading={isLoading}
      />

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Top Visible Page Control */}
        <HistoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          isLoading={isLoading}
          variant="top"
        />

        {/* Historical Telemetry Data Table */}
        <HistoryTable
          records={paginatedRecords}
          isLoading={isLoading}
          searchQuery={searchQuery}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          onInspect={setSelectedPacketModal}
        />

        {/* Bottom Visible Page Control */}
        <HistoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          isLoading={isLoading}
          variant="bottom"
        />
      </div>

      <HistoryPacketModal
        packet={selectedPacketModal}
        onClose={() => setSelectedPacketModal(null)}
      />
    </div>
  );
};
