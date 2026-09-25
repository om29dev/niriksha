import React, { useRef, useEffect } from 'react';
import { Filter, RefreshCw, Download, FileText, Printer } from 'lucide-react';
import type { PoleId } from '../../types/telemetry';
import { PoleSelectDropdown } from '../PoleSelectDropdown';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

interface ReportsFilterBarProps {
  timeWindow: '1h' | '6h' | '24h' | '7d';
  onTimeWindowChange: (w: '1h' | '6h' | '24h' | '7d') => void;
  selectedPole: PoleId | 'all';
  onSelectedPoleChange: (p: PoleId | 'all') => void;
  isFilterOpen: boolean;
  onToggleFilterOpen: () => void;
  onCloseFilter: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
}

export const ReportsFilterBar: React.FC<ReportsFilterBarProps> = ({
  timeWindow,
  onTimeWindowChange,
  selectedPole,
  onSelectedPoleChange,
  isFilterOpen,
  onToggleFilterOpen,
  onCloseFilter,
  isLoading,
  onRefresh,
  onExportCsv,
  onPrint
}) => {
  const filterRef = useRef<HTMLDivElement>(null);
  const activeFiltersCount = (timeWindow !== '24h' ? 1 : 0) + (selectedPole !== 'all' ? 1 : 0);

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
      className="no-print"
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
            <span>Filter Report Scope</span>
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
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Report Scope</span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      onTimeWindowChange('24h');
                      onSelectedPoleChange('all');
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
                    Reset
                  </button>
                )}
              </div>

              {/* Time Window Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                  Historical Time Window:
                </label>
                <select
                  value={timeWindow}
                  onChange={(e) => onTimeWindowChange(e.target.value as any)}
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
                  <option value="1h">Past 1 Hour</option>
                  <option value="6h">Past 6 Hours</option>
                  <option value="24h">Past 24 Hours (Default)</option>
                  <option value="7d">Past 7 Days</option>
                </select>
              </div>

              {/* Scalable Pole Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                  Target Mesh Node:
                </label>
                <PoleSelectDropdown
                  poles={DEFAULT_POLES}
                  selectedPoleId={selectedPole}
                  onSelectPole={(id) => onSelectedPoleChange(id)}
                  allowAllOption={true}
                  allOptionLabel="All Field Poles"
                  width="100%"
                  size="sm"
                />
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={onCloseFilter}
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
                  Apply Scope
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
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
            cursor: 'pointer'
          }}
        >
          <RefreshCw style={{ width: '13px', height: '13px', animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onExportCsv}
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
          <Download style={{ width: '13px', height: '13px' }} />
          Export CSV
        </button>

        {/* Dedicated Download PDF Button */}
        <button
          onClick={onPrint}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            border: '1px solid #2563eb',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
          }}
          title="Generates high-resolution vector PDF using the browser print pipeline"
        >
          <FileText style={{ width: '14px', height: '14px' }} />
          Download PDF Report
        </button>

        <button
          onClick={onPrint}
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
          <Printer style={{ width: '13px', height: '13px' }} />
          Print
        </button>
      </div>
    </div>
  );
};
