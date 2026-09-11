import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { PoleId } from '../../types/telemetry';

export interface LiveIncidentItem {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  poles: PoleId[];
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
}

export interface LiveIncidentsCardProps {
  incidents: LiveIncidentItem[];
  onSelectPole: (poleId: PoleId) => void;
}

export const LiveIncidentsCard: React.FC<LiveIncidentsCardProps> = ({
  incidents,
  onSelectPole
}) => {
  if (incidents.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            boxShadow: '0 0 0 3px #fee2e2'
          }} />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Real-Time Hardware Sensor State (Current Scan)
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {`${incidents.length} active physical hazards`}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {incidents.map((incident) => {
          const Icon = incident.icon;
          const isCrit = incident.severity === 'critical';
          return (
            <div
              key={incident.id}
              style={{
                backgroundColor: isCrit ? '#fff1f2' : '#fffbeb',
                border: isCrit ? '1px solid #fecdd3' : '1px solid #fde68a',
                borderLeft: `4px solid ${isCrit ? '#dc2626' : '#d97706'}`,
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: isCrit ? '#fee2e2' : '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCrit ? '#dc2626' : '#d97706',
                  flexShrink: 0
                }}>
                  <Icon style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                      {incident.title}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: isCrit ? '#fee2e2' : '#fef3c7',
                      color: isCrit ? '#b91c1c' : '#b45309'
                    }}>
                      LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {incident.description}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {incident.poles.map((p) => (
                  <button
                    key={p}
                    onClick={() => onSelectPole(p)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Jump to Pole {p}</span>
                    <ExternalLink style={{ width: '11px', height: '11px' }} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
