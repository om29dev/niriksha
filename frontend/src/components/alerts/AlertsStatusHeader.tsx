import React from 'react';
import { Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import type { PersistentAlert } from '../../types/telemetry';

export interface AlertsStatusHeaderProps {
  unresolvedAlerts: PersistentAlert[];
  liveHazardsCount?: number;
  audioMuted: boolean;
  onToggleMute: () => void;
}

export const AlertsStatusHeader: React.FC<AlertsStatusHeaderProps> = ({
  unresolvedAlerts,
  liveHazardsCount = 0,
  audioMuted,
  onToggleMute
}) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
          Incident Status:
        </span>

        {/* Live Active Hazards Badge */}
        {liveHazardsCount > 0 ? (
          <span style={{
            fontSize: '11.5px',
            fontWeight: '700',
            padding: '3px 10px',
            borderRadius: '9999px',
            backgroundColor: '#fff1f2',
            color: '#e11d48',
            border: '1px solid #fecdd3',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#e11d48',
              boxShadow: '0 0 0 2px #ffe4e6'
            }} />
            <AlertTriangle style={{ width: '12px', height: '12px' }} />
            {liveHazardsCount} Live Hazard{liveHazardsCount !== 1 ? 's' : ''} (Active Now)
          </span>
        ) : null}

        {/* Unresolved Historical Actions Badge */}
        {unresolvedAlerts.length > 0 ? (
          <span style={{
            fontSize: '11.5px',
            fontWeight: '700',
            padding: '3px 10px',
            borderRadius: '9999px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fca5a5'
          }}>
            {unresolvedAlerts.length} Unresolved Action{unresolvedAlerts.length !== 1 ? 's' : ''}
          </span>
        ) : null}

        {/* All Clear Badge when 0 live hazards and 0 unresolved */}
        {liveHazardsCount === 0 && unresolvedAlerts.length === 0 && (
          <span style={{
            fontSize: '11.5px',
            fontWeight: '600',
            padding: '3px 10px',
            borderRadius: '9999px',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0'
          }}>
            All Systems Operational
          </span>
        )}
      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onToggleMute}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 13px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: '600',
            cursor: 'pointer',
            border: '1px solid',
            backgroundColor: audioMuted ? '#fef2f2' : '#eff6ff',
            color: audioMuted ? '#dc2626' : '#2563eb',
            borderColor: audioMuted ? '#fecaca' : '#bfdbfe',
            transition: 'all 0.15s ease'
          }}
        >
          {audioMuted ? <VolumeX style={{ width: '15px', height: '15px' }} /> : <Volume2 style={{ width: '15px', height: '15px' }} />}
          {audioMuted ? 'Alarm Siren Muted' : 'Alarm Siren Armed'}
        </button>
      </div>
    </div>
  );
};
