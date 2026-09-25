import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  variant?: 'top' | 'bottom';
}

export const HistoryPagination: React.FC<HistoryPaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  variant = 'bottom'
}) => {
  const [jumpInput, setJumpInput] = useState<string>('');

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
      setJumpInput('');
    }
  };

  const startRecord = (currentPage - 1) * pageSize + (totalCount > 0 ? 1 : 0);
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  // Generate visible page numbers with surrounding context
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      style={{
        padding: variant === 'top' ? '10px 18px' : '14px 20px',
        backgroundColor: variant === 'top' ? '#f8fafc' : '#ffffff',
        borderTop: variant === 'bottom' ? '1px solid #e2e8f0' : 'none',
        borderBottom: variant === 'top' ? '1px solid #e2e8f0' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '12px',
        color: '#475569'
      }}
    >
      {/* Left: Summary Count & Page Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          Showing <strong>{startRecord.toLocaleString()}</strong>-<strong>{endRecord.toLocaleString()}</strong> of{' '}
          <strong>{totalCount.toLocaleString()}</strong> frames
        </div>
        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>|</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={isLoading}
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '3px 6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        )}
      </div>

      {/* Right: Direct Navigation Controls & Page Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || isLoading}
          title="First Page"
          style={{
            padding: '5px 8px',
            borderRadius: '5px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: currentPage <= 1 ? '#cbd5e1' : '#334155',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <ChevronsLeft style={{ width: '14px', height: '14px' }} />
        </button>

        {/* Previous */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || isLoading}
          title="Previous Page"
          style={{
            padding: '5px 8px',
            borderRadius: '5px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: currentPage <= 1 ? '#cbd5e1' : '#334155',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontWeight: '500'
          }}
        >
          <ChevronLeft style={{ width: '14px', height: '14px' }} />
          <span>Prev</span>
        </button>

        {/* Numeric Page Buttons */}
        {getPageNumbers().map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p)}
              disabled={isLoading || p === currentPage}
              style={{
                minWidth: '28px',
                height: '28px',
                padding: '0 6px',
                borderRadius: '5px',
                border: p === currentPage ? '1px solid #2563eb' : '1px solid #cbd5e1',
                backgroundColor: p === currentPage ? '#2563eb' : '#ffffff',
                color: p === currentPage ? '#ffffff' : '#334155',
                fontWeight: p === currentPage ? '700' : '500',
                cursor: p === currentPage ? 'default' : 'pointer',
                fontSize: '12px'
              }}
            >
              {p}
            </button>
          ) : (
            <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94a3b8' }}>
              …
            </span>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || isLoading}
          title="Next Page"
          style={{
            padding: '5px 8px',
            borderRadius: '5px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontWeight: '500'
          }}
        >
          <span>Next</span>
          <ChevronRight style={{ width: '14px', height: '14px' }} />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || isLoading}
          title="Last Page"
          style={{
            padding: '5px 8px',
            borderRadius: '5px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <ChevronsRight style={{ width: '14px', height: '14px' }} />
        </button>

        {/* Page Jump Form */}
        <form onSubmit={handleJump} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
          <input
            type="number"
            min={1}
            max={totalPages}
            placeholder="Go"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            style={{
              width: '42px',
              height: '28px',
              textAlign: 'center',
              border: '1px solid #cbd5e1',
              borderRadius: '5px',
              fontSize: '11px',
              outline: 'none',
              color: '#0f172a'
            }}
          />
          <button
            type="submit"
            style={{
              height: '28px',
              padding: '0 8px',
              borderRadius: '5px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
};
