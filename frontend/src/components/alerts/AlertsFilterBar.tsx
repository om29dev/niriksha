import React from 'react';
import { Search } from 'lucide-react';
import type { PoleId } from '../../types/telemetry';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

export interface AlertsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPoleFilter: PoleId | 'all';
  setSelectedPoleFilter: (p: PoleId | 'all') => void;
  selectedSeverityFilter: 'all' | 'critical' | 'warning' | 'info';
  setSelectedSeverityFilter: (s: 'all' | 'critical' | 'warning' | 'info') => void;
  selectedStatusFilter: 'all' | 'UNRESOLVED' | 'RESOLVED';
  setSelectedStatusFilter: (st: 'all' | 'UNRESOLVED' | 'RESOLVED') => void;
  activeTab: 'unresolved' | 'all';
  pageSize: number;
  setPageSize: (size: number) => void;
}

export const AlertsFilterBar: React.FC<AlertsFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedPoleFilter,
  setSelectedPoleFilter,
  selectedSeverityFilter,
  setSelectedSeverityFilter,
  selectedStatusFilter,
  setSelectedStatusFilter,
  activeTab,
  pageSize,
  setPageSize
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      backgroundColor: '#fafbfc',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      {/* Search Box */}
      <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px' }}>
        <Search style={{ width: '15px', height: '15px', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Search by title, description, or sensor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '12px',
            width: '100%',
            color: '#0f172a',
            backgroundColor: 'transparent'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', padding: '0 4px' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Scalable Pole Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Pole:</span>
        <PoleSelectDropdown
          poles={DEFAULT_POLES}
          selectedPoleId={selectedPoleFilter}
          onSelectPole={(id) => setSelectedPoleFilter(id)}
          allowAllOption={true}
          allOptionLabel="All Nodes"
          width="210px"
          size="sm"
        />
      </div>

      {/* Severity Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Severity:</span>
        <select
          value={selectedSeverityFilter}
          onChange={(e) => setSelectedSeverityFilter(e.target.value as any)}
          style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '6px 10px',
            backgroundColor: '#ffffff',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Status Filter (visible on "All" tab) */}
      {activeTab === 'all' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '6px 10px',
              backgroundColor: '#ffffff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All States</option>
            <option value="UNRESOLVED">Unresolved Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>
        </div>
      )}

      {/* Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Show:</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '5px 8px',
            backgroundColor: '#ffffff',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>
    </div>
  );
};
