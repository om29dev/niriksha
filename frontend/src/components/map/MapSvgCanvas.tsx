import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { PoleId, TelemetryPacket } from '../../types/telemetry';
import { POLE_GEO_CONFIGS } from '../../constants/mapConfig';

interface MapSvgCanvasProps {
  showGrid: boolean;
  showCoverage: boolean;
  showMeshLinks: boolean;
  selectedPoleId: PoleId;
  onSelectPoleId: (poleId: PoleId) => void;
  getNodeStatus: (poleId: PoleId) => { label: string; color: string; bg: string; border: string };
  packets: Record<PoleId, TelemetryPacket | null>;
}

export const MapSvgCanvas: React.FC<MapSvgCanvasProps> = ({
  showGrid,
  showCoverage,
  showMeshLinks,
  selectedPoleId,
  onSelectPoleId,
  getNodeStatus,
  packets = {} as Record<PoleId, TelemetryPacket | null>
}) => {
  // Zoom and Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.25, 3.5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.25, 0.6));
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.min(Math.max(prev + zoomDelta, 0.6), 3.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start pan if left click or middle click and not clicking directly on a button/node if dragging
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
    >
      {/* Zoom Control Overlay Widget */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(4px)',
          padding: '4px 6px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '5px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            cursor: 'pointer'
          }}
        >
          <ZoomIn style={{ width: '15px', height: '15px' }} />
        </button>

        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#334155',
            minWidth: '38px',
            textAlign: 'center'
          }}
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '5px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            cursor: 'pointer'
          }}
        >
          <ZoomOut style={{ width: '15px', height: '15px' }} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: '#cbd5e1', margin: '0 2px' }} />

        <button
          type="button"
          onClick={handleResetZoom}
          title="Reset Zoom & Pan"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '5px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            cursor: 'pointer'
          }}
        >
          <RotateCcw style={{ width: '13px', height: '13px' }} />
        </button>
      </div>

      <svg
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f8fafc',
          display: 'block'
        }}
        viewBox="0 0 1000 650"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="gridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>

        {showGrid && <rect width="1000" height="650" fill="url(#gridPattern)" />}

        {/* Zoomed and Panned Canvas Content */}
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: '500px 325px', transition: isPanning ? 'none' : 'transform 0.15s ease-out' }}
        >

      {/* Sector lines */}
      <path d="M 50 480 Q 300 450 500 420 T 950 380" fill="none" stroke="#e2e8f0" strokeWidth="24" strokeLinecap="round" />
      <path d="M 500 50 L 500 600" fill="none" stroke="#e2e8f0" strokeWidth="18" strokeLinecap="round" />
      <text x="520" y="580" fill="#94a3b8" fontSize="12" fontWeight="600">CENTRAL AVENUE SECTOR</text>
      <text x="120" y="470" fill="#94a3b8" fontSize="11" fontWeight="500">CANAL ROAD (FLOOD ZONE)</text>

      {/* Coverage rings */}
      {showCoverage && Object.values(POLE_GEO_CONFIGS).map((p) => {
        const cx = (p.x / 100) * 1000;
        const cy = (p.y / 100) * 650;
        const r = (p.coverageRadius / 260) * 130;
        const status = getNodeStatus(p.id as PoleId);
        return (
          <g key={`cov-${p.id}`}>
            <circle cx={cx} cy={cy} r={r} fill={status.color} fillOpacity="0.06" stroke={status.color} strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx={cx} cy={cy} r={r * 0.4} fill={status.color} fillOpacity="0.04" />
          </g>
        );
      })}

      {/* Mesh links */}
      {showMeshLinks && (
        <g>
          <line x1={(POLE_GEO_CONFIGS[1].x / 100) * 1000} y1={(POLE_GEO_CONFIGS[1].y / 100) * 650} x2={(POLE_GEO_CONFIGS[3].x / 100) * 1000} y2={(POLE_GEO_CONFIGS[3].y / 100) * 650} stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6 4" />
          <line x1={(POLE_GEO_CONFIGS[2].x / 100) * 1000} y1={(POLE_GEO_CONFIGS[2].y / 100) * 650} x2={(POLE_GEO_CONFIGS[3].x / 100) * 1000} y2={(POLE_GEO_CONFIGS[3].y / 100) * 650} stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6 4" />
          <rect x="360" y="290" width="110" height="22" rx="4" fill="#ffffff" stroke="#bfdbfe" strokeWidth="1" />
          <text x="415" y="305" fill="#2563eb" fontSize="10" fontWeight="700" textAnchor="middle">RF: 2300ms</text>
          <rect x="590" y="275" width="110" height="22" rx="4" fill="#ffffff" stroke="#bfdbfe" strokeWidth="1" />
          <text x="645" y="290" fill="#2563eb" fontSize="10" fontWeight="700" textAnchor="middle">RF: 2500ms</text>
        </g>
      )}

      {/* Nodes */}
      {Object.values(POLE_GEO_CONFIGS).map((p) => {
        const cx = (p.x / 100) * 1000;
        const cy = (p.y / 100) * 650;
        const isSelected = selectedPoleId === p.id;
        const pkt = packets[p.id as PoleId];
        const isElectrocuted = (pkt?.voltage ?? 0.0) > 5.0;
        const status = getNodeStatus(p.id as PoleId);

        return (
          <g
            key={`pin-${p.id}`}
            onClick={() => onSelectPoleId(p.id as PoleId)}
            style={{ cursor: 'pointer' }}
            className={isElectrocuted ? 'map-electrocuted-pulse' : undefined}
          >
            {/* Blinking Red Radar Wave for Electrocuted / High-Voltage Pole */}
            {isElectrocuted && (
              <>
                <circle cx={cx} cy={cy} r="20" fill="#ef4444" fillOpacity="0.3" stroke="#dc2626" className="map-radar-blink" />
                <circle cx={cx} cy={cy} r="32" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx={cx} cy={cy} r="48" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.7" />
              </>
            )}

            {/* Standard Selection Ring if Not Electrocuted */}
            {!isElectrocuted && isSelected && (
              <circle cx={cx} cy={cy} r="32" fill="none" stroke="#2563eb" strokeWidth="3" strokeOpacity="0.8" />
            )}

            {/* Main Node Pin Body */}
            <circle
              cx={cx}
              cy={cy}
              r="22"
              fill={isElectrocuted ? '#fef2f2' : status.bg}
              stroke={isElectrocuted ? '#dc2626' : status.color}
              strokeWidth={isElectrocuted ? '3.5' : '2.5'}
            />

            {/* Electrocuted Warning Icon Indicator */}
            {isElectrocuted ? (
              <text x={cx} y={cy - 28} fill="#dc2626" fontSize="14" fontWeight="900" textAnchor="middle" filter="drop-shadow(0 1px 2px rgba(220,38,38,0.5))">
                ⚡ HIGH VOLTAGE
              </text>
            ) : null}

            <text
              x={cx}
              y={cy + 5}
              fill={isElectrocuted ? '#dc2626' : status.color}
              fontSize="13"
              fontWeight="900"
              textAnchor="middle"
            >
              P{p.id}
            </text>

            {/* Node Name Label Pill */}
            <g transform={`translate(${cx}, ${cy + 34})`}>
              <rect
                x="-70"
                y="0"
                width="140"
                height="24"
                rx="6"
                fill={isElectrocuted ? '#fef2f2' : '#ffffff'}
                stroke={isElectrocuted ? '#dc2626' : '#cbd5e1'}
                strokeWidth={isElectrocuted ? '2' : '1'}
              />
              <text
                x="0"
                y="16"
                fill={isElectrocuted ? '#b91c1c' : '#0f172a'}
                fontSize="11"
                fontWeight="800"
                textAnchor="middle"
              >
                {p.name}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  </svg>
</div>
  );
};
