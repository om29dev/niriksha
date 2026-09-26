import React from 'react';
import { Zap, Wind, Compass } from 'lucide-react';
import type { SensorDomain } from '../../types/dashboard';

interface AddWidgetDomainTabsProps {
  activeDomain: SensorDomain;
  onSelectDomain: (domain: SensorDomain) => void;
}

export const AddWidgetDomainTabs: React.FC<AddWidgetDomainTabsProps> = ({
  activeDomain,
  onSelectDomain
}) => {
  const domains: { id: SensorDomain; label: string; icon: React.ReactNode }[] = [
    { id: 'electrical', label: 'Electrical & Power', icon: <Zap style={{ width: '14px', height: '14px' }} /> },
    { id: 'environment', label: 'Environment & Gas', icon: <Wind style={{ width: '14px', height: '14px' }} /> },
    { id: 'motion', label: 'Structural & Motion', icon: <Compass style={{ width: '14px', height: '14px' }} /> }
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
      {domains.map((d) => {
        const isActive = activeDomain === d.id;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelectDomain(d.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: isActive ? '1px solid #2563eb' : '1px solid transparent',
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              color: isActive ? '#1d4ed8' : '#64748b',
              fontWeight: isActive ? '700' : '500',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {d.icon}
            {d.label}
          </button>
        );
      })}
    </div>
  );
};
