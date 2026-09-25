import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, ChevronDown, Radio } from 'lucide-react';
import { SCENARIOS, type ScenarioType } from '../utils/simulationScenarios';

interface PreviewNoticeBannerProps {
  isSimulating: boolean;
  activeScenario: ScenarioType;
  onToggleSimulation: () => void;
  onSelectScenario: (scenario: ScenarioType) => void;
}

export const PreviewNoticeBanner: React.FC<PreviewNoticeBannerProps> = ({
  isSimulating,
  activeScenario,
  onToggleSimulation,
  onSelectScenario
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentScenarioDef = SCENARIOS.find((s) => s.id === activeScenario) || SCENARIOS[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        color: '#0f172a',
        borderBottom: '1px solid #cbd5e1',
        borderTop: '2px solid #2563eb',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Left: Preview Announcement Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}
        >
          DEMO PREVIEW
        </span>

        <span style={{ fontSize: '12.5px', fontWeight: '500', color: '#475569' }}>
          Interactive browser preview of <strong style={{ color: '#0f172a' }}>NIRIKSHA</strong>. Live mesh simulation & hazard heuristics.
        </span>
      </div>

      {/* Right: Simulation Controls and Scenario Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Scenario Selector Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: currentScenarioDef.badgeColor
              }}
            />
            <span>Scenario: <strong>{currentScenarioDef.label}</strong></span>
            <ChevronDown style={{ width: '14px', height: '14px', color: '#64748b' }} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '320px',
                maxWidth: 'calc(100vw - 32px)',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.04)',
                zIndex: 100
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Select Hazard / Sensor Scenario
              </div>
              {SCENARIOS.map((scenario) => {
                const isSelected = activeScenario === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      onSelectScenario(scenario.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      color: isSelected ? '#1d4ed8' : '#1e293b',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      marginBottom: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: scenario.badgeColor,
                          flexShrink: 0
                        }}
                      />
                      <span>{scenario.label}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '16px' }}>
                      {scenario.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Simulation Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isSimulating ? '#16a34a' : '#64748b' }}>
          <Radio style={{ width: '14px', height: '14px', color: isSimulating ? '#16a34a' : '#94a3b8' }} />
          <span style={{ fontWeight: '500' }}>{isSimulating ? 'Live Telemetry' : 'Simulation Paused'}</span>
        </div>

        {/* Start / Stop Button */}
        <button
          onClick={onToggleSimulation}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isSimulating ? '#ffffff' : '#2563eb',
            color: isSimulating ? '#475569' : '#ffffff',
            border: isSimulating ? '1px solid #cbd5e1' : 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: isSimulating ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 3px rgba(37,99,235,0.4)'
          }}
        >
          {isSimulating ? (
            <>
              <Square style={{ width: '12px', height: '12px', color: '#64748b' }} />
              <span>Pause Simulation</span>
            </>
          ) : (
            <>
              <Play style={{ width: '12px', height: '12px', fill: '#ffffff' }} />
              <span>Resume Simulation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
