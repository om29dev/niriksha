import React, { useState, useEffect } from 'react';
import {
  History,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  X
} from 'lucide-react';
import type { TelemetryPacket, PoleId } from '../../types/telemetry';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

export const HistoryView: React.FC = () => {
  const [records, setRecords] = useState<TelemetryPacket[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;
  
  // Filters
  const [poleFilter, setPoleFilter] = useState<PoleId | 'all'>('all');
  const [uprightFilter, setUprightFilter] = useState<'all' | 'upright' | 'tilted'>('all');
  const [selectedPacketModal, setSelectedPacketModal] = useState<TelemetryPacket | null>(null);

  const fetchHistory = async () => {
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
      if (json && json.data) {
        setRecords(json.data);
        setTotalCount(json.total || 0);
      }
    } catch (err) {
      console.error('Failed to load telemetry history', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentPage, pageSize, poleFilter, uprightFilter]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const formatTimestamp = (ts: number | string) => {
    if (!ts) return 'N/A';
    const date = typeof ts === 'number' ? new Date(ts > 1e11 ? ts : ts * 1000) : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + date.getMilliseconds();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Filters */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History style={{ width: '20px', height: '20px', color: '#2563eb' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              Historical Telemetry Log & Packet Explorer
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Search, filter, and inspect chronological sensor frames preserved in PostgreSQL time-series logs.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Scalable Pole Filter */}
          <PoleSelectDropdown
            poles={DEFAULT_POLES}
            selectedPoleId={poleFilter}
            onSelectPole={(id) => {
              setPoleFilter(id);
              setCurrentPage(1);
            }}
            allowAllOption={true}
            allOptionLabel="All Field Poles"
            width="220px"
            size="sm"
          />

          {/* Upright / Tilt Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle style={{ width: '15px', height: '15px', color: '#64748b' }} />
            <select
              value={uprightFilter}
              onChange={(e) => {
                setUprightFilter(e.target.value as any);
                setCurrentPage(1);
              }}
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
              <option value="all">Any Orientation</option>
              <option value="upright">Upright Only</option>
              <option value="tilted">Tilted / Fallen Hazards Only</option>
            </select>
          </div>

          <button
            onClick={fetchHistory}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <RefreshCw style={{ width: '13px', height: '13px' }} />
            Refresh
          </button>
        </div>
      </div>

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
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Seq / Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Pole Node</th>
                <th style={{ padding: '12px 16px' }}>Orientation</th>
                <th style={{ padding: '12px 16px' }}>Voltage</th>
                <th style={{ padding: '12px 16px' }}>Water Depth</th>
                <th style={{ padding: '12px 16px' }}>Power Grid</th>
                <th style={{ padding: '12px 16px' }}>Environment</th>
                <th style={{ padding: '12px 16px' }}>Gas (MQ Array)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading telemetry records from PostgreSQL...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No telemetry records matched the selected query.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const isSurge = (r.voltage || 0) > 5.0;
                  const isTilt = r.is_upright === false;
                  const isFlood = (r.water_depth || 0) > 100;

                  return (
                    <tr
                      key={`${r.seq}-${r.timestamp}-${idx}`}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isTilt || isSurge ? '#fef2f2' : isFlood ? '#fffbeb' : 'transparent'
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
