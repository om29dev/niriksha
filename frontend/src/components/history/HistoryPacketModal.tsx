import React from 'react';
import { FileCode, X } from 'lucide-react';
import type { TelemetryPacket } from '../../types/telemetry';

export interface HistoryPacketModalProps {
  packet: TelemetryPacket | null;
  onClose: () => void;
}

export const HistoryPacketModal: React.FC<HistoryPacketModalProps> = ({ packet, onClose }) => {
  if (!packet) return null;

  return (
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
      onClick={onClose}
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
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode style={{ width: '18px', height: '18px', color: '#2563eb' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Packet #{packet.seq} (Pole {packet.pole_id})
            </h3>
          </div>
          <button
            onClick={onClose}
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
            {JSON.stringify(packet, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
