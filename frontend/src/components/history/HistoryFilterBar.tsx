import React, { useRef, useEffect } from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import type { PoleId } from '../../types/telemetry';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

export interface HistoryFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  poleFilter: PoleId | 'all';
  setPoleFilter: (p: PoleId | 'all') => void;
  uprightFilter: 'all' | 'upright' | 'tilted';
  setUprightFilter: (u: 'all' | 'upright' | 'tilted') => void;
  isFilterDropdownOpen: boolean;
  setIsFilterDropdownOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  poleFilter,
  setPoleFilter,
  uprightFilter,
  setUprightFilter,
  isFilterDropdownOpen,
  setIsFilterDropdownOpen,
  onRefresh,
  isLoading
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterDropdownOpen, setIsFilterDropdownOpen]);

  const activeFiltersCount = (poleFilter !== 'all' ? 1 : 0) + (uprightFilter !== 'all' ? 1 : 0);

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
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)'
      }}
    >
      {/* Search Input Box */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', maxWidth: '640px' }}>
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
            placeholder="Search seq, pole, voltage, temp, water..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              width: '100%',
              color: '#0f172a',
              backgroundColor: 'transparent'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              title="Clear search"
              style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: '2px' }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>

        {/* Filter Popover Button */}
        <div style={{ position: 'relative' }} ref={popoverRef}>
          <button
            onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
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
              cursor: 'pointer'
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

          {isFilterDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 50,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                width: '290px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Filter Telemetry</span>
                {(poleFilter !== 'all' || uprightFilter !== 'all') && (
                  <button
                    onClick={() => { setPoleFilter('all'); setUprightFilter('all'); }}
                    style={{ border: 'none', background: 'none', fontSize: '11px', color: '#2563eb', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                  >
                    Reset All
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Field Pole Node:</label>
                <PoleSelectDropdown
                  poles={DEFAULT_POLES}
                  selectedPoleId={poleFilter}
                  onSelectPole={(id) => setPoleFilter(id)}
                  allowAllOption={true}
                  allOptionLabel="All Field Poles"
                  width="100%"
                  size="sm"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Orientation Status:</label>
                <select
                  value={uprightFilter}
                  onChange={(e) => setUprightFilter(e.target.value as any)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    color: '#334155',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Any Orientation</option>
                  <option value="upright">Upright Only</option>
                  <option value="tilted">Tilted / Fallen Hazards Only</option>
                </select>
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsFilterDropdownOpen(false)}
                  style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Reload latest records from PostgreSQL"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#334155',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw style={{ width: '13px', height: '13px', animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>
    </div>
  );
};
