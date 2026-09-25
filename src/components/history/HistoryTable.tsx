import React from 'react';
import { AlertTriangle, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { TelemetryPacket } from '../../types/telemetry';

export type SortColumn =
  | 'seq'
  | 'pole_id'
  | 'is_upright'
  | 'voltage'
  | 'water_depth'
  | 'power'
  | 'temperature'
  | 'mq7';

export type SortDirection = 'asc' | 'desc';

export interface HistoryTableProps {
  records: TelemetryPacket[];
  isLoading: boolean;
  searchQuery: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (col: SortColumn) => void;
  onInspect: (packet: TelemetryPacket) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  isLoading,
  searchQuery,
  sortColumn,
  sortDirection,
  onSort,
  onInspect
}) => {
  const formatTimestamp = (ts: number | string) => {
    if (!ts) return 'N/A';
    const d = typeof ts === 'number' ? new Date(ts > 1e11 ? ts : ts * 1000) : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + d.getMilliseconds();
  };

  const renderSortHeader = (label: string, column: SortColumn, align: 'left' | 'right' = 'left') => {
    const isSorted = sortColumn === column;
    return (
      <th
        onClick={() => onSort(column)}
        style={{
          padding: '12px 16px',
          textAlign: align,
          cursor: 'pointer',
          userSelect: 'none',
          color: isSorted ? '#2563eb' : '#475569',
          fontWeight: isSorted ? '700' : '600'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span>{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? <ArrowUp style={{ width: '13px', height: '13px', color: '#2563eb' }} />
              : <ArrowDown style={{ width: '13px', height: '13px', color: '#2563eb' }} />
          ) : (
            <ArrowUpDown style={{ width: '12px', height: '12px', color: '#94a3b8', opacity: 0.6 }} />
          )}
        </div>
      </th>
    );
  };

  return (
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
          ) : records.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                {searchQuery ? `No telemetry records matched "${searchQuery}".` : 'No telemetry records available.'}
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
                    backgroundColor: isTilt || isSurge ? '#fef2f2' : isFlood ? '#fffbeb' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>#{r.seq}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{formatTimestamp(r.timestamp)}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
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
                      onClick={() => onInspect(r)}
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
  );
};
