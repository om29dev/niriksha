import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { TelemetryPacket, PoleId } from '../../types/telemetry';
import { HistoryFilterBar } from '../history/HistoryFilterBar';

type SortColumn =
  | 'seq'
  | 'pole_id'
  | 'is_upright'
  | 'voltage'
  | 'water_depth'
  | 'power'
  | 'temperature'
  | 'mq7';

type SortDirection = 'asc' | 'desc';

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

  // Handle column header sorting click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(column === 'seq' ? 'desc' : 'asc');
    }
  };

  // Search filter across all visible data fields
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();

    return records.filter((r) => {
      // Search sequence number
      if (`#${r.seq}`.includes(q) || String(r.seq).includes(q)) return true;
      // Search pole node
      if (`pole ${r.pole_id}`.toLowerCase().includes(q) || String(r.pole_id) === q) return true;
      // Orientation
      const orientationStr = r.is_upright === false ? 'tilted fallen' : 'upright';
      if (orientationStr.includes(q)) return true;
      // Voltage
      if (r.voltage !== null && r.voltage !== undefined && `${r.voltage.toFixed(1)}v`.includes(q)) return true;
      // Water depth
      if (r.water_depth !== null && r.water_depth !== undefined && `${r.water_depth.toFixed(1)}cm`.includes(q)) return true;
      // Power
      if (r.power !== null && r.power !== undefined && `${r.power.toFixed(1)}w`.includes(q)) return true;
      // Temperature / humidity
      if (r.temperature !== null && r.temperature !== undefined && `${r.temperature.toFixed(1)}c`.includes(q)) return true;
      if (r.humidity !== null && r.humidity !== undefined && `${r.humidity.toFixed(0)}%`.includes(q)) return true;
      // Gas
      if (r.mq7 !== null && r.mq7 !== undefined && `co ${r.mq7.toFixed(0)}`.includes(q)) return true;
      if (r.mq135 !== null && r.mq135 !== undefined && `air ${r.mq135.toFixed(0)}`.includes(q)) return true;
      // Status
      if (r.status && r.status.toLowerCase().includes(q)) return true;

      return false;
    });
  }, [records, searchQuery]);

  // Sort displayed records
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortColumn) {
        case 'seq':
          valA = a.seq ?? 0;
          valB = b.seq ?? 0;
          break;
        case 'pole_id':
          valA = a.pole_id ?? 0;
          valB = b.pole_id ?? 0;
          break;
        case 'is_upright':
          valA = a.is_upright ? 1 : 0;
          valB = b.is_upright ? 1 : 0;
          break;
        case 'voltage':
          valA = a.voltage ?? -9999;
          valB = b.voltage ?? -9999;
          break;
        case 'water_depth':
          valA = a.water_depth ?? -9999;
          valB = b.water_depth ?? -9999;
          break;
        case 'power':
          valA = a.power ?? -9999;
          valB = b.power ?? -9999;
          break;
        case 'temperature':
          valA = a.temperature ?? -9999;
          valB = b.temperature ?? -9999;
          break;
        case 'mq7':
          valA = a.mq7 ?? -9999;
          valB = b.mq7 ?? -9999;
          break;
        default:
          valA = a.seq ?? 0;
          valB = b.seq ?? 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRecords, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatTimestamp = (ts: number | string) => {
    if (!ts) return 'N/A';
    const date = typeof ts === 'number' ? new Date(ts > 1e11 ? ts : ts * 1000) : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + date.getMilliseconds();
  };

  // Render clickable header column with sorting icon
  const renderSortHeader = (label: string, column: SortColumn, align: 'left' | 'right' = 'left') => {
    const isSorted = sortColumn === column;
    return (
      <th
        onClick={() => handleSort(column)}
        style={{
          padding: '12px 16px',
          textAlign: align,
          cursor: 'pointer',
          userSelect: 'none',
          color: isSorted ? '#2563eb' : '#475569',
          fontWeight: isSorted ? '700' : '600'
        }}
        title={`Sort by ${label} (${isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'click to sort'})`}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span>{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp style={{ width: '13px', height: '13px', color: '#2563eb' }} />
            ) : (
              <ArrowDown style={{ width: '13px', height: '13px', color: '#2563eb' }} />
            )
          ) : (
            <ArrowUpDown style={{ width: '12px', height: '12px', color: '#94a3b8', opacity: 0.6 }} />
          )}
        </div>
      </th>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters & Search Toolbar */}
      <HistoryFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        poleFilter={poleFilter}
        setPoleFilter={(id) => {
          setPoleFilter(id);
          setCurrentPage(1);
        }}
        uprightFilter={uprightFilter}
        setUprightFilter={(val) => {
          setUprightFilter(val);
          setCurrentPage(1);
        }}
        pageSize={pageSize}
        setPageSize={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        isFilterDropdownOpen={isFilterDropdownOpen}
        setIsFilterDropdownOpen={setIsFilterDropdownOpen}
        onRefresh={fetchHistory}
        isLoading={isLoading}
        totalCount={totalCount}
      />

      {/* Main Historical Table Container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {renderSortHeader('Seq / Timestamp', 'seq')}
                {renderSortHeader('Pole Node', 'pole_id')}
                {renderSortHeader('Orientation', 'is_upright')}
                {renderSortHeader('Voltage', 'voltage')}
                {renderSortHeader('Water Depth', 'water_depth')}
                {renderSortHeader('Power Grid', 'power')}
                {renderSortHeader('Environment', 'temperature')}
                {renderSortHeader('Gas (MQ Array)', 'mq7')}
                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontWeight: '600' }}>
                  Payload
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading telemetry records from PostgreSQL...
                  </td>
                </tr>
              ) : sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    {searchQuery ? `No telemetry records matched "${searchQuery}".` : 'No telemetry records matched the selected query.'}
                  </td>
                </tr>
              ) : (
                sortedRecords.map((r, idx) => {
                  const isSurge = (r.voltage || 0) > 5.0;
                  const isTilt = r.is_upright === false;
                  const isFlood = (r.water_depth || 0) > 100;

                  return (
                    <tr
                      key={`${r.seq}-${r.timestamp}-${idx}`}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isTilt || isSurge ? '#fef2f2' : isFlood ? '#fffbeb' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>#{r.seq}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{formatTimestamp(r.timestamp)}</div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb'
                          }}
                        >
                          Pole {r.pole_id}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {r.is_upright === false ? (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle style={{ width: '13px', height: '13px' }} />
                            TILTED
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                            Upright
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {r.voltage !== null && r.voltage !== undefined ? (
                          <span style={{ fontWeight: '600', color: isSurge ? '#dc2626' : '#0f172a' }}>
                            {r.voltage.toFixed(1)} V
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Not Connected</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {r.water_depth !== null && r.water_depth !== undefined ? (
                          <span style={{ fontWeight: '600', color: isFlood ? '#d97706' : '#0f172a' }}>
                            {r.water_depth.toFixed(1)} cm
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Not Connected</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {r.power !== null && r.power !== undefined ? (
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>
                            {r.power.toFixed(1)} W
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Not Connected</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {r.temperature !== null && r.temperature !== undefined ? (
                          <span>{r.temperature.toFixed(1)}°C | {r.humidity?.toFixed(0)}%</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Not Connected</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {r.mq7 !== null && r.mq7 !== undefined ? (
                          <span style={{ fontSize: '11px', color: '#475569' }}>
                            CO: {r.mq7.toFixed(0)} | Air: {r.mq135?.toFixed(0)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Not Connected</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedPacketModal(r)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Inspect JSON
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#64748b'
          }}
        >
          <div>
            Showing <strong>{(currentPage - 1) * pageSize + (records.length > 0 ? 1 : 0)}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, totalCount)}</strong> of <strong>{totalCount.toLocaleString()}</strong> frames
            {searchQuery && ` (filtered from current page)`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: currentPage <= 1 ? '#94a3b8' : '#334155',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
              Previous
            </button>

            <span>Page {currentPage} of {totalPages}</span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages || isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Packet Inspection Modal */}
      {selectedPacketModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedPacketModal(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              maxWidth: '650px',
              width: '90%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                  Packet #{selectedPacketModal.seq} (Pole {selectedPacketModal.pole_id})
                </h3>
              </div>
              <button
                onClick={() => setSelectedPacketModal(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <pre
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '14px',
                  fontSize: '12px',
                  color: '#0f172a',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {JSON.stringify(selectedPacketModal, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

