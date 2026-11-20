import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { PriceAlertRule } from '../types/financial';

export interface TriggeredAlertEvent {
  id: string;
  symbol: string;
  companyName: string;
  currentPrice: number;
  targetValue: number;
  conditionType: PriceAlertRule['conditionType'];
  reason: string;
  triggeredAt: string;
}

// Pleasant dual-tone chime (A5 880Hz -> E6 1320Hz) via browser Web Audio API
export function playAlertChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Audio may be blocked before first user gesture
  }
}

export function usePriceAlertWatcher() {
  const { user, alerts, refreshUserData } = useAuth();
  const [triggeredQueue, setTriggeredQueue] = useState<TriggeredAlertEvent[]>([]);
  const acknowledgedIdsRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef(false);

  // Load previously acknowledged alerts from sessionStorage to avoid duplicate popups in same session
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('pricealerter_acknowledged_alerts');
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          arr.forEach((id) => acknowledgedIdsRef.current.add(id));
        }
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  const dismissAlert = useCallback((id: string) => {
    acknowledgedIdsRef.current.add(id);
    try {
      sessionStorage.setItem(
        'pricealerter_acknowledged_alerts',
        JSON.stringify(Array.from(acknowledgedIdsRef.current))
      );
    } catch {
      // ignore
    }
    setTriggeredQueue((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setTriggeredQueue((prev) => {
      prev.forEach((a) => acknowledgedIdsRef.current.add(a.id));
      try {
        sessionStorage.setItem(
          'pricealerter_acknowledged_alerts',
          JSON.stringify(Array.from(acknowledgedIdsRef.current))
        );
      } catch {
        // ignore
      }
      return [];
    });
  }, []);

  const checkAlerts = useCallback(async () => {
    if (!user || inFlightRef.current) return;
    const activeAlerts = alerts.filter((a) => a.enabled && a.status === 'ACTIVE');
    if (activeAlerts.length === 0) return;

    inFlightRef.current = true;
    try {
      const newlyTriggered: TriggeredAlertEvent[] = [];
      const now = new Date().toISOString();

      // 1. Instant client-side quote evaluation
      for (const alert of activeAlerts) {
        if (acknowledgedIdsRef.current.has(alert.id)) continue;
        const sym = alert.symbol.toUpperCase();
        const initial = api.getInitialStock(sym);

        let currentPrice = initial?.currentPrice;
        let prevClose = initial?.previousClose;

        // If not in instant cache, fetch live quote
        if (currentPrice == null) {
          try {
            const res = await api.getStockBySymbol(sym);
            if (res.stock?.currentPrice != null) {
              currentPrice = res.stock.currentPrice;
              prevClose = res.stock.previousClose;
            }
          } catch {
            // ignore network failure
          }
        }

        if (currentPrice == null) continue;

        let triggered = false;
        let reason = '';
        const target = alert.targetValue;

        if (alert.conditionType === 'PRICE_ABOVE' && currentPrice >= target) {
          triggered = true;
          reason = `${sym} reached ₹${currentPrice.toFixed(2)} (Target was ≥ ₹${target.toFixed(2)})`;
        } else if (alert.conditionType === 'PRICE_BELOW' && currentPrice <= target) {
          triggered = true;
          reason = `${sym} reached ₹${currentPrice.toFixed(2)} (Target was ≤ ₹${target.toFixed(2)})`;
        } else if (alert.conditionType === 'PCT_CHANGE_UP' && prevClose && prevClose > 0) {
          const pct = ((currentPrice - prevClose) / prevClose) * 100;
          if (pct >= target) {
            triggered = true;
            reason = `${sym} gained +${pct.toFixed(2)}% (Target was +${target}%)`;
          }
        } else if (alert.conditionType === 'PCT_CHANGE_DOWN' && prevClose && prevClose > 0) {
          const pct = ((currentPrice - prevClose) / prevClose) * 100;
          if (pct <= -Math.abs(target)) {
            triggered = true;
            reason = `${sym} declined ${pct.toFixed(2)}% (Target was -${Math.abs(target)}%)`;
          }
        }

        if (triggered) {
          acknowledgedIdsRef.current.add(alert.id);
          newlyTriggered.push({
            id: alert.id,
            symbol: sym,
            companyName: alert.companyName || sym,
            currentPrice,
            targetValue: target,
            conditionType: alert.conditionType,
            reason,
            triggeredAt: now,
          });

          // Update alert status on backend to TRIGGERED
          void api.updateAlert(alert.id, {
            status: 'TRIGGERED',
          });
        }
      }

      // 2. Also run backend evaluation endpoint to synchronize D1 notifications
      try {
        const evalRes = await api.evaluateAlerts();
        if (evalRes?.alerts && Array.isArray(evalRes.alerts)) {
          for (const a of evalRes.alerts) {
            if (!acknowledgedIdsRef.current.has(a.id)) {
              acknowledgedIdsRef.current.add(a.id);
              newlyTriggered.push({
                id: a.id,
                symbol: a.symbol,
                companyName: a.companyName || a.symbol,
                currentPrice: a.currentPrice,
                targetValue: a.targetValue,
                conditionType: a.conditionType,
                reason: a.reason,
                triggeredAt: now,
              });
            }
          }
        }
      } catch {
        // ignore backend evaluation failure
      }

      if (newlyTriggered.length > 0) {
        setTriggeredQueue((prev) => [...prev, ...newlyTriggered]);
        playAlertChime();

        // Browser web notification
        if (
          user.preferences?.browserNotifications &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          const first = newlyTriggered[0];
          new Notification(`🚨 Price Alert Triggered: ${first.symbol}`, {
            body: first.reason,
            icon: '/favicon-192x192.png',
          });
        }

        // Refresh user's notifications in AuthContext
        void refreshUserData();
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [user, alerts, refreshUserData]);

  // Run on mount, when alerts change, and periodically every 12 seconds
  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => {
      void checkAlerts();
    }, 1200);

    const interval = setInterval(() => {
      void checkAlerts();
    }, 12000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user, alerts, checkAlerts]);

  return {
    triggeredQueue,
    dismissAlert,
    dismissAll,
    checkAlerts,
  };
}
