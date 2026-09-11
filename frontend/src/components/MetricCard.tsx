import React from 'react';
import { GripVertical, X } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | null | undefined;
  unit: string;
  icon: React.ReactNode;
  subtitle: string;
  isHazard?: boolean;
  hazardText?: string;
  customValueDisplay?: React.ReactNode;
  accentColor?: string;
  hazardBgColor?: string;
  hazardBorderColor?: string;
  // Customization & Drag Props
  onRemove?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
  isDragging?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  subtitle,
  isHazard = false,
  hazardText,
  customValueDisplay,
  accentColor = '#0f172a',
  hazardBgColor = '#fef2f2',
  hazardBorderColor = '#f87171',
  onRemove,
  dragHandleProps,
  isDragging = false
}) => {
  const renderDisplay = () => {
    if (customValueDisplay) {
      return customValueDisplay;
    }
    if (value !== null && value !== undefined) {
      return (
        <div className="metric-value" style={{ color: isHazard ? '#dc2626' : accentColor }}>
          {`${value} ${unit}`.trim()}
        </div>
      );
    }
    return (
      <div className="metric-value" style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
          Not Connected
        </span>
      </div>
    );
  };

  return (
    <div
      className="lab-card"
      style={{
        borderColor: isHazard ? hazardBorderColor : isDragging ? '#3b82f6' : '#e2e8f0',
        backgroundColor: isHazard ? hazardBgColor : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px',
        height: '100%',
        width: '100%',
        minHeight: '170px',
        opacity: isDragging ? 0.4 : 1,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        boxShadow: isDragging ? '0 10px 25px -5px rgba(59, 130, 246, 0.25)' : undefined
      }}
    >
      {/* Header controls: Drag handle, Title, Local Pole Selector, Remove Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {dragHandleProps && (
            <span
              {...dragHandleProps}
              title="Drag to reposition card"
              style={{
                cursor: 'grab',
                display: 'inline-flex',
                alignItems: 'center',
                color: '#94a3b8',
                padding: '2px',
                borderRadius: '4px'
              }}
            >
              <GripVertical style={{ width: '14px', height: '14px' }} />
            </span>
          )}
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.02em',
              color: isHazard ? '#dc2626' : '#64748b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={title}
          >
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {icon}

          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove card from dashboard"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {renderDisplay()}
      </div>

      <div style={{ fontSize: '11px', color: isHazard ? '#b91c1c' : '#94a3b8', textAlign: 'center', lineHeight: '1.2' }}>
        {isHazard && hazardText ? hazardText : subtitle}
      </div>
    </div>
  );
};
