import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Usb,
  ShieldAlert,
  ArrowLeftRight,
  MapPin,
  FileText,
  History,
  Bot
} from 'lucide-react';
import type { PoleId } from '../types/telemetry';

export type ActiveView = 'dashboard' | 'compare' | 'fleet' | 'map' | 'history' | 'reports' | 'ai' | 'alerts' | 'settings';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  downPoles: PoleId[];
  offlinePoles: PoleId[];
  wsConnected: boolean;
  selectedPort: string;
  packetRate: number;
  unresolvedAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
  downPoles,
  offlinePoles,
  wsConnected,
  selectedPort,
  packetRate,
  unresolvedAlertsCount = 0
}) => {
  const totalAlerts = Math.max(downPoles.length + offlinePoles.length, unresolvedAlertsCount);

  const navItems = [
    {
      id: 'dashboard' as ActiveView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'map' as ActiveView,
      label: 'Live Map View',
      icon: MapPin,
      badge: 'Spatial'
    },
    {
      id: 'fleet' as ActiveView,
      label: 'Fleet Nodes',
      icon: Radio,
      badge: offlinePoles.length > 0 ? `${offlinePoles.length} off` : null,
      badgeColor: '#b45309',
      badgeBg: '#fef3c7'
    },
    {
      id: 'compare' as ActiveView,
      label: 'Node Comparison',
      icon: ArrowLeftRight,
      badge: 'Dual'
    },
    {
      id: 'alerts' as ActiveView,
      label: 'Alerts & Hazards',
      icon: Bell,
      badge: totalAlerts > 0 ? `${totalAlerts}` : null,
      badgeColor: '#dc2626',
      badgeBg: '#fee2e2'
    },
    {
      id: 'history' as ActiveView,
      label: 'Telemetry History',
      icon: History,
      badge: null
    },
    {
      id: 'reports' as ActiveView,
      label: 'Reports & Audits',
      icon: FileText,
      badge: null
    },
    {
      id: 'ai' as ActiveView,
      label: 'AI Diagnostic View',
      icon: Bot,
      badge: 'AI'
    },
    {
      id: 'settings' as ActiveView,
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '240px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40,
        userSelect: 'none'
      }}
    >
      {/* Brand / Logo Area */}
      <div
        style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 16px',
          borderBottom: '1px solid #f1f5f9',
          position: 'relative'
        }}
      >
        {collapsed ? (
          /* When collapsed: single centered button that expands on click */
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              padding: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <img
              src="/niriksha-logo.png"
              alt="Niriksha Logo"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '7px',
                objectFit: 'contain'
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: '-3px',
                right: '-3px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '50%',
                width: '14px',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b'
              }}
            >
              <ChevronRight style={{ width: '10px', height: '10px' }} />
            </span>
          </button>
        ) : (
          /* When expanded: logo + title + collapse chevron */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <img
                src="/niriksha-logo.png"
                alt="Niriksha Logo"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}
              />
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                  NIRIKSHA
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mesh Telemetry
                </div>
              </div>
            </div>

            <button
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                cursor: 'pointer',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <ChevronLeft style={{ width: '15px', height: '15px' }} />
            </button>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                width: '100%',
                padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#2563eb' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconComponent
                  style={{
                    width: '19px',
                    height: '19px',
                    color: isActive ? '#2563eb' : '#64748b',
                    flexShrink: 0
                  }}
                />
                {!collapsed && (
                  <span style={{ fontSize: '13px', fontWeight: isActive ? '600' : '500', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}
              </div>

              {/* Badges */}
              {item.badge && (
                collapsed ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '10px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: item.badgeColor || '#dc2626'
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      backgroundColor: item.badgeBg || '#fee2e2',
                      color: item.badgeColor || '#dc2626'
                    }}
                  >
                    {item.badge}
                  </span>
                )
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer Box */}
      <div
        style={{
          padding: collapsed ? '14px 8px' : '14px 16px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#fafbfc'
        }}
      >
        {!collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: wsConnected ? '#10b981' : '#ef4444'
                  }}
                />
                WebSocket
              </span>
              <span style={{ fontWeight: '600', color: wsConnected ? '#059669' : '#dc2626' }}>
                {wsConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Usb style={{ width: '13px', height: '13px' }} />
                Ingestion Mode
              </span>
              <span style={{ fontWeight: '600', color: '#334155' }}>
                {selectedPort || 'Gateway Serial'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
              <span>Frequency</span>
              <span style={{ fontWeight: '600', color: '#334155' }}>{packetRate} Hz</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            {/* Status indicator button / badge */}
            <div
              title={`WebSocket: ${wsConnected ? 'Connected' : 'Offline'} | ${selectedPort || 'Gateway Serial'} (${packetRate} Hz)`}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: wsConnected ? '#f0fdf4' : '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'default',
                transition: 'all 0.15s ease'
              }}
            >
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: wsConnected ? '#10b981' : '#ef4444',
                  boxShadow: wsConnected ? '0 0 0 2px #bbf7d0' : '0 0 0 2px #fecaca'
                }}
              />
            </div>

            {/* Warnings indicator if any alerts present */}
            {totalAlerts > 0 && (
              <div
                title={`${totalAlerts} Active Warnings`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveView('alerts')}
              >
                <ShieldAlert style={{ width: '18px', height: '18px' }} />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
