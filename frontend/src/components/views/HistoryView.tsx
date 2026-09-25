import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { TelemetryPacket, PoleId } from '../../types/telemetry';
import { HistoryFilterBar } from '../history/HistoryFilterBar';
import { HistoryTable, type SortColumn, type SortDirection } from '../history/HistoryTable';
import { HistoryPagination } from '../history/HistoryPagination';
import { HistoryPacketModal } from '../history/HistoryPacketModal';

export const HistoryView: React.FC = () => {
  const [records, setRecords] = useState<TelemetryPacket[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
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
    try {
      const offset = (currentPage - 1) * pageSize;
      let url = `http://127.0.0.1:8000/api/telemetry/history?limit=${pageSize}&offset=${offset}`;

      if (poleFilter !== 'all') {
        url += `&pole_id=${poleFilter}`;
      }
      if (uprightFilter === 'upright') {
        url += `&is_upright=true`;
      } else if (uprightFilter === 'tilted') {
        url += `&is_upright=false`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data)) {
        setRecords(json.data);
        setTotalCount(json.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch historical telemetry', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, poleFilter, uprightFilter]);

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
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();

    return records.filter((r) => {
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
      if (r.status && r.status.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [records, searchQuery]);

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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
          records={sortedRecords}
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
