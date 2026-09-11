import React from 'react';
import { Zap, X, Volume2, VolumeX, ShieldAlert, MapPin, Compass, Droplets } from 'lucide-react';
import type { TelemetryPacket } from '../../types/telemetry';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

interface VoltageEmergencyModalProps {
  isVoltageEmergency: boolean;
  voltageAlertDismissed: boolean;
  onDismiss: () => void;
  audioMuted: boolean;
  onToggleMute: () => void;
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  onNavigateToLocation?: (poleId: number) => void;
}

export const VoltageEmergencyModal: React.FC<VoltageEmergencyModalProps> = ({
  isVoltageEmergency,
  voltageAlertDismissed,
  onDismiss,
  audioMuted,
  onToggleMute,
  latestPole1,
  latestPole2,
  latestPole3,
  onNavigateToLocation
}) => {
  if (!isVoltageEmergency || voltageAlertDismissed) {
    return null;
  }

  // Map pole addresses and reference IDs
  const poleMetadata: Record<number, { refId: string; address: string }> = {
    1: {
      refId: 'REF-PL01',
      address: 'Zone 1 - Sector 4 Lowland Drainage Basin, Sector Road Grid'
    },
    2: {
      refId: 'REF-PL02',
      address: 'Zone 2 - North Transformer Substation #3, Utility Corridor'
    },
    3: {
      refId: 'REF-PL03',
      address: 'Zone 3 - Central Gateway Command & Primary Inundation Line'
    }
  };

  // Filter exclusively for poles that are actively showing high voltage (i.e. electrocuted > 5.0V)
  const allPolePackets = [
    { id: 1 as const, pkt: latestPole1 },
    { id: 2 as const, pkt: latestPole2 },
    { id: 3 as const, pkt: latestPole3 }
  ];

  const electrocutedPoles = allPolePackets.filter((item) => (item.pkt?.voltage ?? 0.0) > 5.0);

  // If none directly >5.0 (safeguard fallback), show the pole with the highest voltage
  const displayPoles = electrocutedPoles.length > 0
    ? electrocutedPoles
    : [allPolePackets.reduce((max, cur) => ((cur.pkt?.voltage ?? 0) > (max.pkt?.voltage ?? 0) ? cur : max), allPolePackets[0])];

  return (
    <>
      {/* Red Emergency Screen Flashing Overlay */}
      <div className="screen-emergency-active" />

      {/* Critical High-Urgency Emergency Modal Dialog */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 45%, rgba(220, 38, 38, 0.45) 0%, rgba(153, 27, 27, 0.6) 45%, rgba(15, 23, 42, 0.88) 100%)',
        backdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        boxShadow: 'inset 0 0 160px rgba(220, 38, 38, 0.65)'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '3px solid #dc2626',
          boxShadow: '0 25px 70px -5px rgba(220, 38, 38, 0.75), 0 0 45px rgba(239, 68, 68, 0.5), 0 0 0 2px #b91c1c',
          maxWidth: '720px',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top Hazard Warning Strip */}
          <div style={{
            background: 'repeating-linear-gradient(45deg, #b91c1c, #b91c1c 12px, #991b1b 12px, #991b1b 24px)',
            height: '8px',
            width: '100%'
          }} />

          {/* Modal Header */}
          <div style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #b91c1c'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                backgroundColor: '#ffffff',
                color: '#dc2626',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1s infinite'
              }}>
                <ShieldAlert style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    backgroundColor: '#991b1b',
                    color: '#fef2f2',
                    fontSize: '10px',
                    fontWeight: '900',
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    CRITICAL SOS
                  </span>
                  <span style={{ fontSize: '11px', color: '#fecaca', fontWeight: '600' }}>
                    AUTOMATED GRID LOCKOUT REQUIRED
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '3px 0 0 0', letterSpacing: '0.01em' }}>
                  WATER ELECTRIFICATION & INUNDATION HAZARD DETECTED
                </h3>
              </div>
            </div>

            <button
              onClick={onDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.15s'
              }}
              title="Acknowledge Alert"
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '20px 24px', backgroundColor: '#fcfcfc', maxHeight: '82vh', overflowY: 'auto' }}>
            
            {/* Individual Pole SOS Cards with Tilt, Voltage, Water Depth, Location, Ref ID */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {displayPoles.map(({ id, pkt }) => {
                  const v = pkt?.voltage ?? 0.0;
                  const isVoltageHazard = v > 5.0;
                  const isUpright = pkt?.is_upright ?? true;
                  const waterDepth = pkt?.water_depth;
                  const hasWaterSensor = waterDepth !== null && waterDepth !== undefined;
                  const isWaterDeep = hasWaterSensor && waterDepth > 15;
                  const isTiltHazard = !isUpright;

                  const isAnyHazardOnPole = isVoltageHazard || isTiltHazard || isWaterDeep;
                  const meta = poleMetadata[id] || {
                    refId: `REF-PL0${id}`,
                    address: `Zone ${id} - Monitored Sector Grid`
                  };
                  const poleCatalogItem = DEFAULT_POLES.find((p: { id: number }) => p.id === id);

                  return (
                    <div
                      key={id}
                      style={{
                        border: isAnyHazardOnPole ? '2px solid #ef4444' : '1px solid #e2e8f0',
                        backgroundColor: isAnyHazardOnPole ? '#fffbfb' : '#ffffff',
                        borderRadius: '10px',
                        padding: '16px 18px',
                        boxShadow: isAnyHazardOnPole ? '0 4px 12px rgba(220, 38, 38, 0.08)' : '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* Top Row: Pole Identity, Reference ID, Location Address */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                              {poleCatalogItem?.name || `Pole ${id}`}
                            </span>
                            <span style={{
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontFamily: 'monospace'
                            }}>
                              Ref ID: {meta.refId}
                            </span>
                            {isAnyHazardOnPole && (
                              <span style={{
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 7px',
                                borderRadius: '4px'
                              }}>
                                CRITICAL NODE
                              </span>
                            )}
                          </div>
                          
                          {/* Address / Location Display */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', color: '#475569', fontSize: '12px' }}>
                            <MapPin style={{ width: '13px', height: '13px', color: '#64748b', flexShrink: 0 }} />
                            <span>
                              <strong style={{ color: '#1e293b' }}>Location (Ref {meta.refId}):</strong> {meta.address}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sensor Readings Layout: BIG Prominent Voltage Hazard Box on top, Tilt & Water below */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        {/* 1. BIG Voltage Box */}
                        <div style={{
                          backgroundColor: isVoltageHazard ? '#fef2f2' : '#f8fafc',
                          border: `2px solid ${isVoltageHazard ? '#ef4444' : '#cbd5e1'}`,
                          borderRadius: '10px',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: isVoltageHazard ? '0 4px 14px rgba(220, 38, 38, 0.18)' : 'none',
                          background: isVoltageHazard
                            ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                            : '#f8fafc'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                              backgroundColor: isVoltageHazard ? '#dc2626' : '#2563eb',
                              color: '#ffffff',
                              borderRadius: '10px',
                              padding: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}>
                              <Zap style={{ width: '32px', height: '32px' }} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: '800',
                                  color: isVoltageHazard ? '#991b1b' : '#334155',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                  lineHeight: 1
                                }}>
                                  SURFACE VOLTAGE LEAKAGE DETECTED
                                </span>
                                {isVoltageHazard ? (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    backgroundColor: '#dc2626',
                                    color: '#ffffff',
                                    fontSize: '10.5px',
                                    fontWeight: '800',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    letterSpacing: '0.03em',
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.2,
                                    boxShadow: '0 1px 3px rgba(220,38,38,0.25)'
                                  }}>
                                    <Zap style={{ width: '11px', height: '11px', fill: '#ffffff' }} />
                                    <span>ACTIVE ELECTROCUTION</span>
                                  </span>
                                ) : (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    backgroundColor: '#16a34a',
                                    color: '#ffffff',
                                    fontSize: '10.5px',
                                    fontWeight: '800',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    letterSpacing: '0.03em',
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.2
                                  }}>
                                    SAFE
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11.5px', color: isVoltageHazard ? '#b91c1c' : '#64748b', marginTop: '3px' }}>
                                Measured on grounding water probe terminals in surrounding basin
                              </div>
                            </div>
                          </div>

                          {/* Big Voltage Readout */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            flexShrink: 0,
                            paddingLeft: '16px'
                          }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'baseline',
                              gap: '4px',
                              lineHeight: 1,
                              color: isVoltageHazard ? '#dc2626' : '#15803d',
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              whiteSpace: 'nowrap'
                            }}>
                              <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '-0.03em' }}>
                                {v.toFixed(1)}
                              </span>
                              <span style={{ fontSize: '22px', fontWeight: '800', color: isVoltageHazard ? '#dc2626' : '#15803d' }}>
                                V
                              </span>
                            </div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              color: isVoltageHazard ? '#991b1b' : '#15803d',
                              marginTop: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              whiteSpace: 'nowrap'
                            }}>
                              {isVoltageHazard ? 'CRITICAL LEVEL (>5V)' : 'NO VOLTAGE'}
                            </div>
                          </div>
                        </div>

                        {/* 2 & 3. Secondary Vital Readings: Tilt Status & Water Level */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {/* Pole Tilt Status */}
                          <div style={{
                            backgroundColor: isTiltHazard ? '#fee2e2' : '#f8fafc',
                            border: `1.5px solid ${isTiltHazard ? '#f87171' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>
                              <Compass style={{ width: '14px', height: '14px', color: isTiltHazard ? '#dc2626' : '#2563eb' }} />
                              POLE TILT ORIENTATION
                            </div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '800',
                              color: isTiltHazard ? '#b91c1c' : '#15803d'
                            }}>
                              {isTiltHazard ? '⚠️ TILTED / FALLEN HAZARD' : '✓ UPRIGHT & SECURED'}
                            </div>
                            <span style={{ fontSize: '10.5px', color: isTiltHazard ? '#dc2626' : '#64748b' }}>
                              {isTiltHazard ? 'Structural integrity breached' : 'Normal vertical alignment'}
                            </span>
                          </div>

                          {/* Water Level Reading */}
                          <div style={{
                            backgroundColor: isWaterDeep ? '#fee2e2' : '#f8fafc',
                            border: `1.5px solid ${isWaterDeep ? '#f87171' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>
                              <Droplets style={{ width: '14px', height: '14px', color: isWaterDeep ? '#dc2626' : '#0284c7' }} />
                              WATER SUBMERSION LEVEL
                            </div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '900',
                              color: !hasWaterSensor ? '#94a3b8' : isWaterDeep ? '#dc2626' : '#0284c7'
                            }}>
                              {hasWaterSensor ? `${waterDepth.toFixed(1)} cm` : 'N/A'}
                            </div>
                            <span style={{ fontSize: '10.5px', fontWeight: '600', color: !hasWaterSensor ? '#64748b' : isWaterDeep ? '#b91c1c' : '#475569' }}>
                              {!hasWaterSensor ? 'No water probe fitted' : isWaterDeep ? '⚠️ Severe Flood Level' : 'Low Inundation / Safe'}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar / Controls - All on one line */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              flexWrap: 'nowrap',
              gap: '12px'
            }}>
              {/* Left Buttons: Mute Alarm & Show Location on Map */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={onToggleMute}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: audioMuted ? '#dc2626' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {audioMuted ? (
                    <>
                      <VolumeX style={{ width: '15px', height: '15px', color: '#dc2626' }} />
                      <span>Unmute Alarm</span>
                    </>
                  ) : (
                    <>
                      <Volume2 style={{ width: '15px', height: '15px', color: '#2563eb' }} />
                      <span>Mute Alarm</span>
                    </>
                  )}
                </button>

                {/* Show Location on Map Button */}
                <button
                  onClick={() => {
                    const targetPoleId = displayPoles[0]?.id ?? 1;
                    if (onNavigateToLocation) {
                      onNavigateToLocation(targetPoleId);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: '1px solid #2563eb',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.1)',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap'
                  }}
                  title="View Electrocuted Pole Location on Spatial Vector Map"
                >
                  <MapPin style={{ width: '15px', height: '15px', color: '#2563eb' }} />
                  <span>Show Location on Map</span>
                </button>
              </div>

              {/* Right: Acknowledge & Dismiss SOS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={onDismiss}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '800',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(220, 38, 38, 0.35)',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Acknowledge & Dismiss SOS
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
