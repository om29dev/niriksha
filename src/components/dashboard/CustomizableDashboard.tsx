import React, { useState, useEffect, useCallback } from 'react';
import type { PoleId, TelemetryPacket, TimeRangeOption, PoleState, PersistentAlert } from '../../types/telemetry';
import type { DashboardCardConfig } from '../../types/dashboard';
import { DEFAULT_DASHBOARD_CARDS, AVAILABLE_CHARTS } from '../../constants/dashboardDefaults';
import { DEFAULT_GAS_THRESHOLDS, type GasThresholdConfig } from '../../constants/gasThresholds';
import { TelemetryChart } from '../charts/TelemetryChart';
import { AddCardModal } from './AddCardModal';
import { DashboardMapCard } from './DashboardMapCard';
import { DashboardControlsBar } from './DashboardControlsBar';
import { RealtimeIncidentsBanner } from './RealtimeIncidentsBanner';
import { DashboardMetricTile } from './DashboardMetricTile';

const STORAGE_KEY = 'iot_custom_dashboard_layout_v2';

interface CustomizableDashboardProps {
  activePoleTab: PoleId;
  setActivePoleTab: (poleId: PoleId) => void;
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  latestAny: TelemetryPacket | null;
  telemetryHistory: TelemetryPacket[];
  historicalData: TelemetryPacket[];
  timeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  poleStateMap: Record<PoleId, PoleState>;
  selectedLatest: TelemetryPacket | null;
  selectedState: PoleState;
  gasThresholds?: Partial<GasThresholdConfig>;
  onNavigateToMap?: () => void;
  persistentAlerts?: PersistentAlert[];
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  activePoleTab,
  setActivePoleTab,
  latestPole1,
  latestPole2,
  latestPole3,
  latestAny,
  telemetryHistory,
  historicalData,
  timeRange,
  onTimeRangeChange,
  poleStateMap,
  selectedLatest,
  selectedState,
  gasThresholds: customGasThresholds,
  onNavigateToMap,
  persistentAlerts: _persistentAlerts = []
}) => {
  const gasThresholds = { ...DEFAULT_GAS_THRESHOLDS, ...customGasThresholds };

  // Load layout from localStorage or fallback to defaults
  const [cards, setCards] = useState<DashboardCardConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved dashboard layout', e);
    }
    return DEFAULT_DASHBOARD_CARDS;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync cards state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error('Failed to save dashboard layout', e);
    }
  }, [cards]);

  const handleToggleAllToPole = (targetPole: PoleId) => {
    setActivePoleTab(targetPole);
  };

  const activeLatest = useCallback((): TelemetryPacket | null => {
    if (activePoleTab === 1) return latestPole1;
    if (activePoleTab === 2) return latestPole2;
    if (activePoleTab === 3) return latestPole3 ?? latestAny;
    return latestAny;
  }, [activePoleTab, latestPole1, latestPole2, latestPole3, latestAny]);

  const activeHistory = useCallback(() => {
    const rawDataSource = timeRange === 'realtime' ? telemetryHistory : historicalData;
    const filtered = rawDataSource.filter((p) => p.pole_id === activePoleTab);

    return filtered.map((pt) => {
      const d = new Date(pt.timestamp * 1000);
      const timeLabel =
        timeRange === '24h'
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        ...pt,
        timeLabel,
        formattedTime: d.toLocaleTimeString()
      };
    });
  }, [timeRange, activePoleTab, telemetryHistory, historicalData]);

  const handleRemoveCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCard = (newCard: DashboardCardConfig) => {
    setCards((prev) => [...prev, newCard]);
  };

  const handleResetLayout = () => {
    if (window.confirm('Reset dashboard cards and positions back to default layout?')) {
      const fresh = DEFAULT_DASHBOARD_CARDS.map((c) => ({
        ...c,
        poleId: activePoleTab
      }));
      setCards(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedCardIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCardIndex !== null && draggedCardIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index: number) => {
    if (draggedCardIndex === null || draggedCardIndex === index) {
      setDraggedCardIndex(null);
      setDragOverIndex(null);
      return;
    }

    setCards((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedCardIndex, 1);
      updated.splice(index, 0, movedItem);
      return updated;
    });

    setDraggedCardIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedCardIndex(null);
    setDragOverIndex(null);
  };

  const renderChartWidget = (card: DashboardCardConfig, index: number) => {
    const chartDef = AVAILABLE_CHARTS.find((c) => c.key === card.chartKey) || AVAILABLE_CHARTS[0];
    const poleHistory = activeHistory();

    return (
      <TelemetryChart
        key={card.id}
        title={chartDef.title}
        subtitle={chartDef.subtitle}
        dataKey={chartDef.key}
        unit={chartDef.unit}
        strokeColor={chartDef.strokeColor}
        activePoleTab={activePoleTab}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        data={poleHistory}
        onRemove={() => handleRemoveCard(card.id)}
        isDragging={draggedCardIndex === index}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
      {/* Real-Time Hardware Sensor State (Current Scan) */}
      <RealtimeIncidentsBanner
        latestPole1={latestPole1}
        latestPole2={latestPole2}
        latestPole3={latestPole3}
        poleStateMap={poleStateMap}
        gasThresholds={gasThresholds}
        onJumpToPole={handleToggleAllToPole}
      />

      {/* Unified Single Control Bar: Pole Selection + Status Info + Actions */}
      <DashboardControlsBar
        activePoleTab={activePoleTab}
        onSelectPole={handleToggleAllToPole}
        poleStateMap={poleStateMap}
        selectedLatest={selectedLatest}
        selectedState={selectedState}
        onResetLayout={handleResetLayout}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Uniform CSS Grid with Dense Packing */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gridAutoRows: '180px',
          gridAutoFlow: 'dense',
          gap: '16px'
        }}
      >
        {/* Embedded Live Spatial Vector Map Card (2x2 Grid Tile like Graphs) */}
        <div
          style={{
            gridColumn: 'span 2',
            gridRow: 'span 2',
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <DashboardMapCard
            poleStateMap={poleStateMap}
            latestPole1={latestPole1}
            latestPole2={latestPole2}
            latestPole3={latestPole3}
            selectedPoleId={activePoleTab}
            onSelectPoleId={(id) => handleToggleAllToPole(id)}
            onNavigateToMap={onNavigateToMap || (() => {})}
          />
        </div>

        {cards.map((card, idx) => {
          const isChart = card.type === 'chart';
          const isDragOver = dragOverIndex === idx;

          return (
            <div
              key={card.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              style={{
                gridColumn: isChart ? 'span 2' : 'span 1',
                gridRow: isChart ? 'span 2' : 'span 1',
                position: 'relative',
                transition: 'all 0.2s ease',
                outline: isDragOver ? '2px dashed #2563eb' : 'none',
                outlineOffset: '2px',
                borderRadius: '8px'
              }}
            >
              {isChart ? (
                renderChartWidget(card, idx)
              ) : (
                <DashboardMetricTile
                  card={card}
                  index={idx}
                  latest={activeLatest()}
                  gasThresholds={gasThresholds}
                  onRemoveCard={handleRemoveCard}
                  isDragging={draggedCardIndex === idx}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCard={handleAddCard}
        activePoleDefault={activePoleTab}
      />
    </div>
  );
};
