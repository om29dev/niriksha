import React from 'react';
import { RefreshCw, Trash2, Server } from 'lucide-react';
import type { PortInfo } from '../types/telemetry';

interface ConfigBarProps {
  useSimulation: boolean;
  selectedPort: string;
  ports: PortInfo[];
  onConfigUpdate: (simMode: boolean, portName: string) => void;
  onScanPorts: () => void;
  onResetData: () => void;
}

export const ConfigBar: React.FC<ConfigBarProps> = ({
  useSimulation,
  selectedPort,
  ports,
  onConfigUpdate,
  onScanPorts,
  onResetData
}) => {
  return (
    <section style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Data Source:</span>
        
        <button
          onClick={() => onConfigUpdate(true, '')}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            border: '1px solid',
            backgroundColor: useSimulation ? '#2563eb' : '#ffffff',
            color: useSimulation ? '#ffffff' : '#475569',
            borderColor: useSimulation ? '#2563eb' : '#cbd5e1'
          }}
        >
          Multi-Pole Simulator
        </button>

        <button
          onClick={() => {
            const targetPort = selectedPort || (ports.length > 0 ? ports[0].device : '');
            onConfigUpdate(false, targetPort);
          }}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            border: '1px solid',
            backgroundColor: !useSimulation ? '#2563eb' : '#ffffff',
            color: !useSimulation ? '#ffffff' : '#475569',
            borderColor: !useSimulation ? '#2563eb' : '#cbd5e1'
          }}
        >
          Physical Gateway COM
        </button>

        {!useSimulation && (
          <select
            value={selectedPort}
            onChange={(e) => onConfigUpdate(false, e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a'
            }}
          >
            {ports.length === 0 ? (
              <option value="">No COM Ports Detected</option>
            ) : (
              ports.map((p) => (
                <option key={p.device} value={p.device}>
                  {p.device} - {p.description}
                </option>
              ))
            )}
          </select>
        )}

        <button
          onClick={onScanPorts}
          title="Rescan Hardware Ports"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '13px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#475569',
            cursor: 'pointer'
          }}
        >
          <RefreshCw style={{ width: '13px', height: '13px' }} />
          Scan
        </button>

        <button
          onClick={onResetData}
          title="Reset All Readings and Clear Database"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            cursor: 'pointer'
          }}
        >
          <Trash2 style={{ width: '13px', height: '13px' }} />
          Reset All
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
        <Server style={{ width: '14px', height: '14px', color: '#2563eb' }} />
        <span>PostgreSQL: <code>iot_dashboard</code></span>
      </div>
    </section>
  );
};
