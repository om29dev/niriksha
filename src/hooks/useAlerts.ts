import { useState, useCallback, useRef } from 'react';
import type { PersistentAlert, PoleId } from '../types/telemetry';

const INITIAL_DEMO_ALERTS: PersistentAlert[] = [
  {
    id: 101,
    pole_id: 1,
    alert_type: 'VOLTAGE_LEAK_WARNING',
    severity: 'warning',
    title: 'Grounding Leakage Warning',
    description: 'Periodic grounding leakage detected during test routine (3.4V). Submerged probe safely isolated.',
    trigger_value: 3.4,
    unit: 'V',
    status: 'RESOLVED',
    triggered_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    resolved_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    resolved_by: 'Mesh Diagnostics'
  },
  {
    id: 102,
    pole_id: 2,
    alert_type: 'MQ135_AIR_QUALITY_SPIKE',
    severity: 'info',
    title: 'Atmospheric Pollutant Surge',
    description: 'Transient atmospheric pollutant surge (162 ppm) detected near drainage conduit.',
    trigger_value: 162,
    unit: 'ppm',
    status: 'RESOLVED',
    triggered_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    resolved_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    resolved_by: 'Safety Supervisor'
  }
];

export function useAlerts() {
  const [alerts, setAlerts] = useState<PersistentAlert[]>(() => {
    try {
      const saved = localStorage.getItem('niriksha_sim_alerts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_DEMO_ALERTS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const alertsRef = useRef<PersistentAlert[]>(alerts);
  alertsRef.current = alerts;

  const persistAlerts = (newAlerts: PersistentAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem('niriksha_sim_alerts', JSON.stringify(newAlerts));
    } catch {
      // ignore
    }
  };

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    // Simulating instant local query
    setTimeout(() => {
      setIsLoading(false);
    }, 150);
  }, []);

  // Resolve a single alert
  const resolveAlert = useCallback((alertId: number, operatorName: string = 'Operator') => {
    const updated = alertsRef.current.map((a) =>
      a.id === alertId
        ? {
            ...a,
            status: 'RESOLVED' as const,
            resolved_at: new Date().toISOString(),
            resolved_by: operatorName
          }
        : a
    );
    persistAlerts(updated);
  }, []);

  // Resolve multiple selected alerts
  const resolveSelectedAlerts = useCallback((alertIds: number[], operatorName: string = 'Operator') => {
    if (!alertIds || alertIds.length === 0) return;
    const idSet = new Set(alertIds);
    const updated = alertsRef.current.map((a) =>
      idSet.has(a.id)
        ? {
            ...a,
            status: 'RESOLVED' as const,
            resolved_at: new Date().toISOString(),
            resolved_by: operatorName
          }
        : a
    );
    persistAlerts(updated);
  }, []);

  // Resolve all unresolved alerts (optionally filtered by poleId)
  const resolveAllAlerts = useCallback((poleId?: PoleId, operatorName: string = 'Operator') => {
    const nowIso = new Date().toISOString();
    const updated = alertsRef.current.map((a) => {
      if (poleId && a.pole_id !== poleId) return a;
      if (a.status === 'RESOLVED') return a;
      return {
        ...a,
        status: 'RESOLVED' as const,
        resolved_at: nowIso,
        resolved_by: operatorName
      };
    });
    persistAlerts(updated);
  }, []);

  // Handle incoming simulation alert broadcasts
  const handleWsAlertEvent = useCallback((eventData: any) => {
    if (!eventData || !eventData.type) return;

    if (eventData.type === 'HAZARD_ALERT' || eventData.type === 'NEW_ALERT') {
      const poleId = (eventData.pole_id || 1) as PoleId;
      const message = eventData.message || 'Hazard alert detected by simulated telemetry.';
      const isCritical = message.includes('HIGH') || message.includes('ELECTRIFICATION') || message.includes('FIRE');
      const newAlert: PersistentAlert = {
        id: Date.now(),
        pole_id: poleId,
        alert_type: 'SIMULATION_HAZARD',
        severity: isCritical ? 'critical' : 'warning',
        title: isCritical ? 'Critical Sensor Hazard' : 'Warning Sensor Threshold',
        description: message,
        trigger_value: null,
        unit: '',
        status: 'UNRESOLVED',
        triggered_at: new Date().toISOString()
      };

      setAlerts((prev) => {
        // Prevent flood of duplicate unresolved alerts for the exact same message
        const isDuplicate = prev.some(
          (a) => a.pole_id === poleId && a.description === message && a.status === 'UNRESOLVED'
        );
        if (isDuplicate) return prev;
        const next = [newAlert, ...prev].slice(0, 100);
        try {
          localStorage.setItem('niriksha_sim_alerts', JSON.stringify(next));
        } catch {}
        return next;
      });
    } else if (eventData.type === 'ALERT_RESOLVED' && eventData.alert) {
      const resolved: PersistentAlert = eventData.alert;
      const updated = alertsRef.current.map((a) => (a.id === resolved.id ? { ...a, ...resolved } : a));
      persistAlerts(updated);
    } else if (eventData.type === 'TELEMETRY_RESET') {
      persistAlerts([]);
    }
  }, []);

  const unresolvedAlerts = alerts.filter((a) => a.status === 'UNRESOLVED');
  const resolvedAlerts = alerts.filter((a) => a.status === 'RESOLVED');

  return {
    alerts,
    unresolvedAlerts,
    resolvedAlerts,
    unresolvedCount: unresolvedAlerts.length,
    isLoading,
    fetchAlerts,
    resolveAlert,
    resolveSelectedAlerts,
    resolveAllAlerts,
    handleWsAlertEvent
  };
}
