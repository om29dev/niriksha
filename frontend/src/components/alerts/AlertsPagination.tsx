import React from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

export interface AlertsPaginationProps {
  rangeDisplay: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const AlertsPagination: React.FC<AlertsPaginationProps> = ({
  rangeDisplay,
  currentPage,
  totalPages,
  onPageChange
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '8px',
        borderTop: '1px solid #f1f5f9'
      }}>
        {/* Display range: e.g. "10 out of 100", "20 out of 100" */}
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
          Showing <span style={{ color: '#2563eb', fontWeight: '700' }}>{rangeDisplay}</span> alerts
        </div>

        {/* Page Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: currentPage <= 1 ? '#94a3b8' : '#334155',
              fontSize: '11px',
              fontWeight: '600',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft style={{ width: '14px', height: '14px' }} />
            Previous
          </button>

          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', padding: '0 8px' }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: currentPage >= totalPages ? '#94a3b8' : '#334155',
              fontSize: '11px',
              fontWeight: '600',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
            <ChevronRight style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      {/* Footer info notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
        <Info style={{ width: '14px', height: '14px', color: '#2563eb', flexShrink: 0 }} />
        <span>
          <strong>Air-gapped Compliance:</strong> Alerts persist in the local PostgreSQL database (<code>alerts</code> table) even if sensor readings normalize or power cycles. Alerts can only transition to <code>RESOLVED</code> by operator confirmation.
        </span>
      </div>
    </div>
  );
};
