import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
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
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  const activeFiltersCount =
    (selectedPoleFilter !== 'all' ? 1 : 0) +
    (selectedSeverityFilter !== 'all' ? 1 : 0) +
    (activeTab === 'all' && selectedStatusFilter !== 'all' ? 1 : 0);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      backgroundColor: '#ffffff',
      padding: '12px 18px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Left: Search Box and Single Filter Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', maxWidth: '640px' }}>
        {/* Search Box */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '7px 12px'
        }}>
          <Search style={{ width: '15px', height: '15px', color: '#94a3b8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search alerts by title, description, or sensor..."
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
              style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>

        {/* Single Filter Button & Popover */}
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(prev => !prev)}
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
                width: '290px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Filter Alerts</span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setSelectedPoleFilter('all');
                      setSelectedSeverityFilter('all');
                      setSelectedStatusFilter('all');
                    }}
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
                    Reset All
                  </button>
                )}
              </div>

              {/* Scalable Pole Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                  Field Pole Node:
                </label>
                <PoleSelectDropdown
                  poles={DEFAULT_POLES}
                  selectedPoleId={selectedPoleFilter}
                  onSelectPole={(id) => setSelectedPoleFilter(id)}
                  allowAllOption={true}
                  allOptionLabel="All Nodes"
                  width="100%"
                  size="sm"
                />
              </div>

              {/* Severity Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                  Severity Level:
                </label>
                <select
                  value={selectedSeverityFilter}
                  onChange={(e) => setSelectedSeverityFilter(e.target.value as any)}
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="warning">Warning Only</option>
                  <option value="info">Info Only</option>
                </select>
              </div>

              {/* Status Filter (visible on "All" tab) */}
              {activeTab === 'all' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                    Resolution Status:
                  </label>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    <option value="all">All States</option>
                    <option value="UNRESOLVED">Unresolved Only</option>
                    <option value="RESOLVED">Resolved Only</option>
                  </select>
                </div>
              )}

              <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            padding: '6px 10px',
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

