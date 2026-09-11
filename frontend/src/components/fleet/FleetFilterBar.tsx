import React, { useRef, useEffect } from 'react';
import { Search, Filter, Layers, X } from 'lucide-react';

interface FleetFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'online' | 'down' | 'offline';
  onStatusFilterChange: (status: 'all' | 'online' | 'down' | 'offline') => void;
  isFilterOpen: boolean;
  onToggleFilterOpen: () => void;
  onCloseFilter: () => void;
  showingCount: number;
  totalCount: number;
}

export const FleetFilterBar: React.FC<FleetFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isFilterOpen,
  onToggleFilterOpen,
  onCloseFilter,
  showingCount,
  totalCount
}) => {
  const filterRef = useRef<HTMLDivElement>(null);
  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        onCloseFilter();
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen, onCloseFilter]);

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', maxWidth: '640px' }}>
        {/* Search Box */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '7px 12px'
          }}
        >
          <Search style={{ width: '15px', height: '15px', color: '#94a3b8', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search poles by ID, name, role or sensor..."
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: '#0f172a',
              width: '100%',
              backgroundColor: 'transparent'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>

        {/* Unified Filter Button & Popover */}
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button
            onClick={onToggleFilterOpen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              border: `1px solid ${activeFiltersCount > 0 ? '#93c5fd' : '#cbd5e1'}`,
              backgroundColor: activeFiltersCount > 0 ? '#eff6ff' : '#ffffff',
              color: activeFiltersCount > 0 ? '#2563eb' : '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            <Filter style={{ width: '14px', height: '14px' }} />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '1px 6px',
                  lineHeight: 1
                }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>

          {isFilterOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 50,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                width: '260px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Filter Nodes</span>
                {statusFilter !== 'all' && (
                  <button
                    onClick={() => onStatusFilterChange('all')}
                    style={{
                      border: 'none',
                      background: 'none',
                      fontSize: '11px',
                      color: '#2563eb',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                  Node Health State:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value as any)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#334155',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <option value="all">All States</option>
                  <option value="online">Online Only</option>
                  <option value="down">Tilted Hazards Only</option>
                  <option value="offline">Offline Only</option>
                </select>
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={onCloseFilter}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
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
        }}
      >
        <Layers style={{ width: '15px', height: '15px' }} />
        Showing {showingCount} of {totalCount} Nodes
      </div>
    </div>
  );
};
