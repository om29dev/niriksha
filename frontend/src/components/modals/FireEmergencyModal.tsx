import React from 'react';
import { Flame, X, Volume2, VolumeX, MapPin, Thermometer, Wind } from 'lucide-react';
import type { TelemetryPacket } from '../../types/telemetry';
import { DEFAULT_POLES } from '../../constants/polesCatalog';

interface FireEmergencyModalProps {
  isFireEmergency: boolean;
  fireAlertDismissed: boolean;
  onDismiss: () => void;
  audioMuted: boolean;
  onToggleMute: () => void;
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  onNavigateToLocation?: (poleId: number) => void;
}

export const FireEmergencyModal: React.FC<FireEmergencyModalProps> = ({
  isFireEmergency,
  fireAlertDismissed,
  onDismiss,
  audioMuted,
  onToggleMute,
  latestPole1,
  latestPole2,
  latestPole3,
  onNavigateToLocation
}) => {
  if (!isFireEmergency || fireAlertDismissed) {
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
      address: 'Zone 3 - Central Gateway Command & Primary Environmental Node'
    }
  };

  const allPolePackets = [
    { id: 1 as const, pkt: latestPole1 },
    { id: 2 as const, pkt: latestPole2 },
    { id: 3 as const, pkt: latestPole3 }
  ];

  // Filter for poles actively reporting fire conditions (temperature >= 60°C)
  const burningPoles = allPolePackets.filter((item) => (item.pkt?.temperature ?? 0.0) >= 60.0);

  const displayPoles = burningPoles.length > 0
    ? burningPoles
    : [allPolePackets.reduce((max, cur) => ((cur.pkt?.temperature ?? 0) > (max.pkt?.temperature ?? 0) ? cur : max), allPolePackets[0])];

  return (
    <>
      {/* Orange/Red Emergency Screen Flashing Overlay */}
      <div className="screen-emergency-active" style={{
        animation: 'emergencyFlash 0.6s infinite ease-in-out',
        backgroundColor: 'rgba(234, 88, 12, 0.35)'
      }} />

      {/* Critical Fire Emergency Modal Dialog */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 45%, rgba(234, 88, 12, 0.5) 0%, rgba(194, 65, 12, 0.68) 45%, rgba(15, 23, 42, 0.92) 100%)',
        backdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        boxShadow: 'inset 0 0 160px rgba(234, 88, 12, 0.7)'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '3px solid #ea580c',
          boxShadow: '0 25px 70px -5px rgba(234, 88, 12, 0.8), 0 0 45px rgba(249, 115, 22, 0.5), 0 0 0 2px #c2410c',
          maxWidth: '720px',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top Hazard Warning Strip */}
          <div style={{
            background: 'repeating-linear-gradient(45deg, #c2410c, #c2410c 12px, #9a3412 12px, #9a3412 24px)',
            height: '8px',
            width: '100%'
          }} />

          {/* Modal Header */}
          <div style={{
            backgroundColor: '#ea580c',
            color: '#ffffff',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #c2410c'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                backgroundColor: '#ffffff',
                color: '#ea580c',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 0.8s infinite'
              }}>
                <Flame style={{ width: '26px', height: '26px' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    backgroundColor: '#9a3412',
                    color: '#ffedd5',
                    fontSize: '10px',
                    fontWeight: '900',
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    FIRE EMERGENCY SOS
                  </span>
                  <span style={{ fontSize: '11px', color: '#ffedd5', fontWeight: '600' }}>
                    EXTREME THERMAL OUTBREAK DETECTED
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '3px 0 0 0', letterSpacing: '0.01em' }}>
                  EXTREME TEMPERATURE & BLAZE HAZARD DETECTED
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
            
            {/* Individual Pole Cards with Temperature, Smoke/CO, Location */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {displayPoles.map(({ id, pkt }) => {
                  const temp = pkt?.temperature ?? 0.0;
                  const isSevereFire = temp >= 60.0;
                  const mq135 = pkt?.mq135;
                  const mq7 = pkt?.mq7;
                  const humidity = pkt?.humidity;
                  const meta = poleMetadata[id] || {
                    refId: `REF-PL0${id}`,
                    address: `Zone ${id} - Monitored Sector Grid`
                  };
                  const poleCatalogItem = DEFAULT_POLES.find((p: { id: number }) => p.id === id);

                  return (
                    <div
                      key={id}
                      style={{
                        border: isSevereFire ? '2px solid #ea580c' : '1px solid #e2e8f0',
                        backgroundColor: isSevereFire ? '#fffaf5' : '#ffffff',
                        borderRadius: '10px',
                        padding: '16px 18px',
                        boxShadow: isSevereFire ? '0 4px 14px rgba(234, 88, 12, 0.12)' : '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* Top Row: Pole Identity & Location */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                              {poleCatalogItem?.name || `Pole ${id}`}
                            </span>
                            <span style={{
                              backgroundColor: '#ffedd5',
                              color: '#9a3412',
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontFamily: 'monospace'
                            }}>
                              Ref ID: {meta.refId}
                            </span>
                            {isSevereFire && (
                              <span style={{
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 7px',
                                borderRadius: '4px'
                              }}>
                                ACTIVE BLAZE ZONE
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', color: '#475569', fontSize: '12px' }}>
                            <MapPin style={{ width: '13px', height: '13px', color: '#64748b', flexShrink: 0 }} />
                            <span>
                              <strong style={{ color: '#1e293b' }}>Location (Ref {meta.refId}):</strong> {meta.address}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sensor Readings Layout: BIG Prominent Temperature Box */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{
                          backgroundColor: isSevereFire ? '#fff7ed' : '#f8fafc',
                          border: `2px solid ${isSevereFire ? '#ea580c' : '#cbd5e1'}`,
                          borderRadius: '8px',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '10px',
                              backgroundColor: isSevereFire ? '#ffedd5' : '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSevereFire ? '#ea580c' : '#64748b',
                              flexShrink: 0
                            }}>
                              <Flame style={{ width: '26px', height: '26px' }} />
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                AMBIENT FIRE TEMPERATURE READING
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: isSevereFire ? '#c2410c' : '#475569', marginTop: '2px' }}>
                                {isSevereFire ? 'CRITICAL THERMAL OUTBREAK SURPASSING 60°C' : 'Standard Temperature Range'}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', justifyContent: 'flex-end' }}>
                              <span style={{
                                fontSize: '38px',
                                fontWeight: '900',
                                color: isSevereFire ? '#c2410c' : '#0f172a',
                                letterSpacing: '-0.03em',
                                lineHeight: '1'
                              }}>
                                {temp.toFixed(1)}
                              </span>
                              <span style={{ fontSize: '22px', fontWeight: '800', color: isSevereFire ? '#c2410c' : '#64748b' }}>
                                °C
                              </span>
                            </div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              color: isSevereFire ? '#9a3412' : '#15803d',
                              marginTop: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}>
                              {isSevereFire ? 'BLAZE IN PROGRESS (>60°C)' : 'NORMAL'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                          <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>
                              <Wind style={{ width: '14px', height: '14px', color: '#9333ea' }} />
                              AIR QUALITY (MQ-135)
                            </div>
                            <div style={{
                              fontSize: '15px',
                              fontWeight: '900',
                              color: mq135 !== null && mq135 !== undefined && mq135 > 150 ? '#dc2626' : '#0f172a'
                            }}>
                              {mq135 !== null && mq135 !== undefined ? `${mq135.toFixed(1)} ppm` : 'Not Connected'}
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              {mq135 !== null && mq135 !== undefined && mq135 > 150 ? '⚠️ High Pollution' : 'Nominal'}
                            </span>
                          </div>

                          <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>
                              <Flame style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                              CARBON MONOXIDE (MQ-7)
                            </div>
                            <div style={{
                              fontSize: '15px',
                              fontWeight: '900',
                              color: mq7 !== null && mq7 !== undefined && mq7 > 50 ? '#dc2626' : '#0f172a'
                            }}>
                              {mq7 !== null && mq7 !== undefined ? `${mq7.toFixed(1)} ppm` : 'Not Connected'}
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              {mq7 !== null && mq7 !== undefined && mq7 > 50 ? '⚠️ Toxic Gas' : 'Safe level'}
                            </span>
                          </div>

                          <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>
                              <Thermometer style={{ width: '14px', height: '14px', color: '#2563eb' }} />
                              HUMIDITY
                            </div>
                            <div style={{
                              fontSize: '15px',
                              fontWeight: '900',
                              color: '#0f172a'
                            }}>
                              {humidity !== null && humidity !== undefined ? `${humidity.toFixed(1)}%` : 'Not Connected'}
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              Desiccation
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar / Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              flexWrap: 'nowrap',
              gap: '12px'
            }}>
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
                      <span>Unmute Siren</span>
                    </>
                  ) : (
                    <>
                      <Volume2 style={{ width: '15px', height: '15px', color: '#ea580c' }} />
                      <span>Mute Siren</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const targetPoleId = displayPoles[0]?.id ?? 3;
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
                    border: '1px solid #ea580c',
                    backgroundColor: '#fff7ed',
                    color: '#c2410c',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(234, 88, 12, 0.1)',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap'
                  }}
                  title="View Fire Location on Spatial Vector Map"
                >
                  <MapPin style={{ width: '15px', height: '15px', color: '#ea580c' }} />
                  <span>Show Fire Location on Map</span>
                </button>
              </div>

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
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(234, 88, 12, 0.35)',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Acknowledge & Dismiss Fire SOS
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
