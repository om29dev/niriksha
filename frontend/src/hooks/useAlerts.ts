import { useState, useEffect, useCallback, useRef } from 'react';
import type { PersistentAlert, PoleId } from '../types/telemetry';

export function useAlerts() {
  const [alerts, setAlerts] = useState<PersistentAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const alertsRef = useRef<PersistentAlert[]>([]);

  // Keep ref in sync
  alertsRef.current = alerts;

  // Fetch all alerts from backend database
  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/alerts?limit=250');
      const json = await res.json();
      if (json.alerts && Array.isArray(json.alerts)) {
        setAlerts(json.alerts);
      }
    } catch (err) {
      console.warn('Could not fetch alerts from database', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Resolve a single alert
  const resolveAlert = useCallback(async (alertId: number, operatorName: string = 'Operator') => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved_by: operatorName })
      });
      const json = await res.json();
      if (json.status === 'success' && json.alert) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, ...json.alert } : a))
        );
      }
    } catch (err) {
      console.error('Failed to resolve alert', err);
    }
  }, []);

  // Resolve multiple selected alerts
  const resolveSelectedAlerts = useCallback(async (alertIds: number[], operatorName: string = 'Operator') => {
    if (!alertIds || alertIds.length === 0) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/alerts/resolve-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_ids: alertIds, resolved_by: operatorName })
      });
      const json = await res.json();
      if (json.status === 'success' && json.resolved_alerts) {
        const idSet = new Set(alertIds);
        const resolvedMap = new Map<number, PersistentAlert>(
          json.resolved_alerts.map((a: PersistentAlert) => [a.id, a])
        );
        setAlerts((prev: PersistentAlert[]) =>
          prev.map((a: PersistentAlert): PersistentAlert => {
            if (idSet.has(a.id)) {
              return resolvedMap.get(a.id) || { ...a, status: 'RESOLVED' };
            }
            return a;
          })
        );
      }
    } catch (err) {
      console.error('Failed to resolve selected alerts', err);
    }
  }, []);

  // Resolve all unresolved alerts (optionally filtered by poleId)
  const resolveAllAlerts = useCallback(async (poleId?: PoleId, operatorName: string = 'Operator') => {
    try {
      const url = poleId
        ? `http://127.0.0.1:8000/api/alerts/resolve-all?pole_id=${poleId}`
        : 'http://127.0.0.1:8000/api/alerts/resolve-all';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved_by: operatorName })
      });
      const json = await res.json();
      if (json.status === 'success') {
        const nowIso = new Date().toISOString();
        setAlerts((prev) =>
          prev.map((a) => {
            if (poleId && a.pole_id !== poleId) return a;
            return {
              ...a,
              status: 'RESOLVED',
              resolved_at: nowIso,
              resolved_by: operatorName
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed to resolve all alerts', err);
    }
  }, []);

  // Fetch initial alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Periodic polling fallback (every 10 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAlerts();
    }, 10000);
    return () => clearInterval(timer);
  }, [fetchAlerts]);

  // Handle incoming WebSocket alert broadcasts
  const handleWsAlertEvent = useCallback((eventData: any) => {
    if (!eventData || !eventData.type) return;

    if (eventData.type === 'NEW_ALERT' && eventData.alert) {
      const newAlert: PersistentAlert = eventData.alert;
      setAlerts((prev) => {
        // Avoid duplicate id in list
        const exists = prev.some((a) => a.id === newAlert.id);
        if (exists) {
          return prev.map((a) => (a.id === newAlert.id ? newAlert : a));
        }
        return [newAlert, ...prev];
      });
    } else if (eventData.type === 'ALERT_RESOLVED' && eventData.alert) {
      const resolved: PersistentAlert = eventData.alert;
      setAlerts((prev) =>
        prev.map((a) => (a.id === resolved.id ? { ...a, ...resolved } : a))
      );
    } else if (eventData.type === 'ALL_ALERTS_RESOLVED') {
      const targetPole = eventData.pole_id;
      const nowIso = new Date().toISOString();
      setAlerts((prev) =>
        prev.map((a) => {
          if (targetPole && a.pole_id !== targetPole) return a;
          return {
            ...a,
            status: 'RESOLVED',
            resolved_at: nowIso,
            resolved_by: 'Operator'
          };
        })
      );
    } else if (eventData.type === 'ALERTS_CLEARED' || eventData.type === 'TELEMETRY_RESET') {
      setAlerts([]);
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
