import type { Response } from 'express';
import { getDb } from '../db/database.ts';
import {
  evaluatePriceAlerts,
  refreshIndicesFromProvider,
  refreshStockBySymbol,
  syncAllIndianStocks,
} from '../providers/marketDataProvider.ts';
import { refreshIposFromProvider } from '../providers/ipoDataProvider.ts';

export type IstMarketSession = 'PRE_OPEN' | 'MARKET_OPEN' | 'POST_CLOSE' | 'WEEKEND';

export interface AutomationStatusSnapshot {
  running: boolean;
  startedAt: string | null;
  marketSession: IstMarketSession;
  istTimeLabel: string;
  liveClients: number;
  pollIntervalsSec: {
    indices: number;
    equitiesAndAlerts: number;
    iposAndGmp: number;
  };
  cycles: {
    indices: number;
    equities: number;
    ipos: number;
    alertsEvaluated: number;
    alertsTriggeredTotal: number;
  };
  lastRunAt: {
    indices: string | null;
    equities: string | null;
    ipos: string | null;
    alerts: string | null;
  };
  lastError: string | null;
}

const sseClients = new Set<Response>();
let engineRunning = false;
let startedAtIso: string | null = null;

let indicesTimer: ReturnType<typeof setInterval> | null = null;
let equitiesTimer: ReturnType<typeof setInterval> | null = null;
let iposTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

let inflightIndices = false;
let inflightEquities = false;
let inflightIpos = false;

const cycles = {
  indices: 0,
  equities: 0,
  ipos: 0,
  alertsEvaluated: 0,
  alertsTriggeredTotal: 0,
};

const lastRunAt: AutomationStatusSnapshot['lastRunAt'] = {
  indices: null,
  equities: null,
  ipos: null,
  alerts: null,
};

let lastIndicesEpoch = 0;
let lastEquitiesEpoch = 0;
let lastIposEpoch = 0;
let lastError: string | null = null;

export function getIstMarketSession(now: Date = new Date()): {
  session: IstMarketSession;
  istTimeLabel: string;
  isActiveTradingWindow: boolean;
} {
  // Shift UTC timestamp by +5h30m to compute Asia/Kolkata wall clock deterministically
  const istMs = now.getTime() + 5.5 * 3600_000;
  const istDate = new Date(istMs);
  const day = istDate.getUTCDay(); // 0 = Sun, 6 = Sat
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const totalMins = hours * 60 + minutes;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const istTimeLabel = `${hh}:${mm} IST`;

  if (day === 0 || day === 6) {
    return { session: 'WEEKEND', istTimeLabel, isActiveTradingWindow: false };
  }
  if (totalMins >= 9 * 60 && totalMins < 9 * 60 + 15) {
    return { session: 'PRE_OPEN', istTimeLabel, isActiveTradingWindow: true };
  }
  if (totalMins >= 9 * 60 + 15 && totalMins <= 15 * 60 + 35) {
    return { session: 'MARKET_OPEN', istTimeLabel, isActiveTradingWindow: true };
  }
  return { session: 'POST_CLOSE', istTimeLabel, isActiveTradingWindow: false };
}

function getTargetIntervalsMs(): {
  indicesMs: number;
  equitiesMs: number;
  iposMs: number;
} {
  const { isActiveTradingWindow } = getIstMarketSession();
  return isActiveTradingWindow
    ? {
        indicesMs: 30_000,
        equitiesMs: 120_000,
        iposMs: 300_000,
      }
    : {
        indicesMs: 180_000,
        equitiesMs: 600_000,
        iposMs: 900_000,
      };
}

export function broadcastMarketEvent(eventType: string, payload: unknown): void {
  if (sseClients.size === 0) return;
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of Array.from(sseClients)) {
    try {
      res.write(data);
    } catch {
      sseClients.delete(res);
    }
  }
}

export function registerSseClient(res: Response): () => void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  sseClients.add(res);

  const initialPayload = {
    status: getAutomationStatus(),
    timestamp: new Date().toISOString(),
  };
  try {
    res.write(`event: connected\ndata: ${JSON.stringify(initialPayload)}\n\n`);
  } catch {
    sseClients.delete(res);
  }

  return () => {
    sseClients.delete(res);
  };
}

export async function runIndicesSyncCycle(force = false): Promise<void> {
  if (inflightIndices) return;
  const { indicesMs } = getTargetIntervalsMs();
  if (!force && Date.now() - lastIndicesEpoch < indicesMs - 2000) return;

  inflightIndices = true;
  try {
    const res = await refreshIndicesFromProvider(true);
    lastIndicesEpoch = Date.now();
    lastRunAt.indices = new Date().toISOString();
    cycles.indices += 1;
    broadcastMarketEvent('indices', {
      indices: res.indices,
      liveFeedReachable: res.liveFeedReachable,
      timestamp: lastRunAt.indices,
      session: getIstMarketSession().session,
    });
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Index refresh cycle failed';
  } finally {
    inflightIndices = false;
  }
}

export async function runEquitiesAndAlertsCycle(force = false): Promise<void> {
  if (inflightEquities) return;
  const { equitiesMs } = getTargetIntervalsMs();
  if (!force && Date.now() - lastEquitiesEpoch < equitiesMs - 5000) return;

  inflightEquities = true;
  try {
    const universe = await syncAllIndianStocks(true);
    lastEquitiesEpoch = Date.now();
    lastRunAt.equities = new Date().toISOString();
    cycles.equities += 1;

    // Autonomously hydrate live quotes for every active price alert symbol
    const db = getDb();
    const activeSymbols = Array.from(
      new Set(
        db.priceAlerts
          .filter((a) => a.enabled && a.status === 'ACTIVE')
          .map((a) => a.symbol.toUpperCase())
      )
    ).slice(0, 15);

    if (activeSymbols.length > 0) {
      await Promise.all(
        activeSymbols.map((sym) => refreshStockBySymbol(sym, '1mo').catch(() => null))
      );
    }

    const triggered = evaluatePriceAlerts();
    cycles.alertsEvaluated += 1;
    cycles.alertsTriggeredTotal += triggered;
    lastRunAt.alerts = new Date().toISOString();

    broadcastMarketEvent('stocks', {
      totalUniverse: universe.length,
      timestamp: lastRunAt.equities,
      triggeredAlerts: triggered,
      session: getIstMarketSession().session,
    });

    if (triggered > 0) {
      broadcastMarketEvent('alerts', {
        triggered,
        timestamp: lastRunAt.alerts,
      });
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Equities sync cycle failed';
  } finally {
    inflightEquities = false;
  }
}

export async function runIposSyncCycle(force = false): Promise<void> {
  if (inflightIpos) return;
  const { iposMs } = getTargetIntervalsMs();
  if (!force && Date.now() - lastIposEpoch < iposMs - 5000) return;

  inflightIpos = true;
  try {
    const ipos = await refreshIposFromProvider(true);
    lastIposEpoch = Date.now();
    lastRunAt.ipos = new Date().toISOString();
    cycles.ipos += 1;
    broadcastMarketEvent('ipos', {
      total: ipos.length,
      timestamp: lastRunAt.ipos,
      session: getIstMarketSession().session,
    });
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'IPO sync cycle failed';
  } finally {
    inflightIpos = false;
  }
}

export function startAutomationEngine(): void {
  if (engineRunning) return;
  engineRunning = true;
  startedAtIso = new Date().toISOString();

  // Warm up feeds right after server boot (non-blocking)
  void runIndicesSyncCycle(true);
  void runIposSyncCycle(true);
  void runEquitiesAndAlertsCycle(true);

  indicesTimer = setInterval(() => {
    void runIndicesSyncCycle(false);
  }, 30_000);
  indicesTimer.unref();

  equitiesTimer = setInterval(() => {
    void runEquitiesAndAlertsCycle(false);
  }, 60_000);
  equitiesTimer.unref();

  iposTimer = setInterval(() => {
    void runIposSyncCycle(false);
  }, 120_000);
  iposTimer.unref();

  heartbeatTimer = setInterval(() => {
    broadcastMarketEvent('heartbeat', {
      timestamp: new Date().toISOString(),
      session: getIstMarketSession().session,
      istTimeLabel: getIstMarketSession().istTimeLabel,
    });
  }, 25_000);
  heartbeatTimer.unref();
}

export function stopAutomationEngine(): void {
  engineRunning = false;
  if (indicesTimer) clearInterval(indicesTimer);
  if (equitiesTimer) clearInterval(equitiesTimer);
  if (iposTimer) clearInterval(iposTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  indicesTimer = null;
  equitiesTimer = null;
  iposTimer = null;
  heartbeatTimer = null;
  for (const res of Array.from(sseClients)) {
    try {
      res.end();
    } catch {
      // ignore
    }
    sseClients.delete(res);
  }
}

export function getAutomationStatus(): AutomationStatusSnapshot {
  const { session, istTimeLabel } = getIstMarketSession();
  const { indicesMs, equitiesMs, iposMs } = getTargetIntervalsMs();
  return {
    running: engineRunning,
    startedAt: startedAtIso,
    marketSession: session,
    istTimeLabel,
    liveClients: sseClients.size,
    pollIntervalsSec: {
      indices: Math.round(indicesMs / 1000),
      equitiesAndAlerts: Math.round(equitiesMs / 1000),
      iposAndGmp: Math.round(iposMs / 1000),
    },
    cycles: { ...cycles },
    lastRunAt: { ...lastRunAt },
    lastError,
  };
}
