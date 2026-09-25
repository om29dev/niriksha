import React, { useState } from 'react';
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
  const currentScenarioDef = SCENARIOS.find((s) => s.id === activeScenario) || SCENARIOS[0];

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderBottom: '2px solid #2563eb',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Left: Preview Announcement Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}
        >
          DEMO PREVIEW
        </span>

        <span style={{ fontSize: '13px', fontWeight: '500', color: '#e2e8f0' }}>
          This is an interactive browser preview of <strong>NIRIKSHA</strong>. Test hazard heuristics and telemetry charts in real time.
        </span>
      </div>

      {/* Right: Simulation Controls and Scenario Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Scenario Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
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
            <ChevronDown style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '320px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '6px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
                zIndex: 100
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                Select Hazard / Sensor Scenario
              </div>
              {SCENARIOS.map((scenario) => (
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
                    border: 'none',
                    backgroundColor: activeScenario === scenario.id ? '#334155' : 'transparent',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'background-color 0.15s'
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
                  <span style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '16px' }}>
                    {scenario.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Simulation Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isSimulating ? '#22c55e' : '#94a3b8' }}>
          <Radio style={{ width: '14px', height: '14px', animation: isSimulating ? 'pulse 1.5s infinite' : 'none' }} />
          <span>{isSimulating ? 'Simulating Live Stream' : 'Simulation Paused'}</span>
        </div>

        {/* Start / Stop Button */}
        <button
          onClick={onToggleSimulation}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isSimulating ? '#dc2626' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            boxShadow: isSimulating ? '0 1px 3px rgba(220,38,38,0.4)' : '0 1px 3px rgba(37,99,235,0.4)'
          }}
        >
          {isSimulating ? (
            <>
              <Square style={{ width: '13px', height: '13px', fill: '#ffffff' }} />
              <span>Stop Simulation</span>
            </>
          ) : (
            <>
              <Play style={{ width: '13px', height: '13px', fill: '#ffffff' }} />
              <span>Start Simulation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
