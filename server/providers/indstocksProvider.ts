import fs from 'fs';
import path from 'path';
import type { StockHistoricalPoint, StockInstrument } from '../../src/types/financial';

const INDSTOCKS_API_BASE = (
  process.env.INDSTOCKS_API_BASE_URL || 'https://api.indstocks.com'
).replace(/\/+$/, '');

export function getIndstocksAccessToken(): string {
  return (
    process.env.INDSTOCKS_ACCESS_TOKEN ||
    process.env.INDSTOCKS_API_KEY ||
    ''
  ).trim();
}

export type IndstocksInterval =
  | '1minute'
  | '2minute'
  | '3minute'
  | '4minute'
  | '5minute'
  | '10minute'
  | '15minute'
  | '30minute'
  | '60minute'
  | '120minute'
  | '180minute'
  | '240minute'
  | '1day'
  | '1week'
  | '1month';

export interface IndstocksCandle {
  ts: number; // Unix epoch seconds (IST open)
  o: number;  // Open
  h: number;  // High
  l: number;  // Low
  c: number;  // Close
  v: number;  // Volume
}

export interface IndstocksHistoricalResponse {
  success: boolean;
  data?: Record<string, { candles: IndstocksCandle[] | null }>;
  debug_info?: string;
  message?: string;
}

const INTERVAL_MAX_RANGE_DAYS: Record<IndstocksInterval, number> = {
  '1minute': 7,
  '2minute': 7,
  '3minute': 7,
  '4minute': 7,
  '5minute': 7,
  '10minute': 7,
  '15minute': 7,
  '30minute': 7,
  '60minute': 15,
  '120minute': 15,
  '180minute': 15,
  '240minute': 15,
  '1day': 365,
  '1week': 365,
  '1month': 365,
};

// In-memory cache for historical candle queries
const candleCache = new Map<
  string,
  { points: StockHistoricalPoint[]; fetchedAt: number }
>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function mapToIndstocksInterval(
  standardInterval: string = '1d'
): IndstocksInterval {
  const norm = standardInterval.trim().toLowerCase();
  switch (norm) {
    case '1m':
    case '1min':
    case '1minute':
      return '1minute';
    case '2m':
    case '2min':
    case '2minute':
      return '2minute';
    case '3m':
    case '3min':
    case '3minute':
      return '3minute';
    case '4m':
    case '4min':
    case '4minute':
      return '4minute';
    case '5m':
    case '5min':
    case '5minute':
      return '5minute';
    case '10m':
    case '10min':
    case '10minute':
      return '10minute';
    case '15m':
    case '15min':
    case '15minute':
      return '15minute';
    case '30m':
    case '30min':
    case '30minute':
      return '30minute';
    case '60m':
    case '60min':
    case '1h':
    case '60minute':
      return '60minute';
    case '120m':
    case '2h':
    case '120minute':
      return '120minute';
    case '180m':
    case '3h':
    case '180minute':
      return '180minute';
    case '240m':
    case '4h':
    case '240minute':
      return '240minute';
    case '1w':
    case '1wk':
    case '1week':
      return '1week';
    case '1mo':
    case '1month':
      return '1month';
    case '1d':
    case '1day':
    default:
      return '1day';
  }
}

export function computeRangeTimestamps(range = '3mo'): {
  startTime: number;
  endTime: number;
} {
  const now = Date.now();
  let ms = 90 * 24 * 60 * 60 * 1000; // 3 months default
  const r = range.toLowerCase();
  if (r === '1d') ms = 1 * 24 * 60 * 60 * 1000;
  else if (r === '5d') ms = 5 * 24 * 60 * 60 * 1000;
  else if (r === '1mo') ms = 30 * 24 * 60 * 60 * 1000;
  else if (r === '3mo') ms = 90 * 24 * 60 * 60 * 1000;
  else if (r === '6mo') ms = 180 * 24 * 60 * 60 * 1000;
  else if (r === '1y') ms = 365 * 24 * 60 * 60 * 1000;
  else if (r === '2y') ms = 2 * 365 * 24 * 60 * 60 * 1000;
  else if (r === '5y') ms = 5 * 365 * 24 * 60 * 60 * 1000;
  else if (r === 'max') ms = 10 * 365 * 24 * 60 * 60 * 1000;

  return {
    startTime: now - ms,
    endTime: now,
  };
}

export function formatCandleTimestamp(
  epochSeconds: number,
  interval: IndstocksInterval
): string {
  const d = new Date(epochSeconds * 1000);
  if (interval === '1day' || interval === '1week' || interval === '1month') {
    return d.toISOString().slice(0, 10);
  }
  return d.toISOString();
}

/**
 * Fetch historical OHLCV data for up to 5 scrip codes from INDstocks API Suite.
 * Endpoint: GET /market/historical/{interval}?scrip-codes={codes}&start_time={ms}&end_time={ms}
 */
export async function fetchIndstocksHistoricalData(opts: {
  scripCodes: string[];
  interval: IndstocksInterval;
  startTime: number; // Unix epoch ms
  endTime: number;   // Unix epoch ms
  accessToken?: string;
  timeoutMs?: number;
}): Promise<Record<string, StockHistoricalPoint[]>> {
  const token = opts.accessToken || getIndstocksAccessToken();
  const result: Record<string, StockHistoricalPoint[]> = {};
  if (!opts.scripCodes || opts.scripCodes.length === 0) return result;

  // scrip-codes maximum 5 identifiers per call
  const cleanCodes = Array.from(
    new Set(opts.scripCodes.map((c) => c.trim()).filter(Boolean))
  );

  const batches: string[][] = [];
  for (let i = 0; i < cleanCodes.length; i += 5) {
    batches.push(cleanCodes.slice(i, i + 5));
  }

  const maxRangeMs =
    (INTERVAL_MAX_RANGE_DAYS[opts.interval] || 7) * 24 * 60 * 60 * 1000;
  const requestedSpan = opts.endTime - opts.startTime;

  // Determine windows if requested window exceeds single call ceiling
  const windows: { start: number; end: number }[] = [];
  if (requestedSpan <= maxRangeMs) {
    windows.push({ start: opts.startTime, end: opts.endTime });
  } else {
    let currentEnd = opts.endTime;
    while (currentEnd > opts.startTime) {
      const currentStart = Math.max(opts.startTime, currentEnd - maxRangeMs);
      windows.push({ start: currentStart, end: currentEnd });
      currentEnd = currentStart;
    }
    // Walk forward chronologically
    windows.reverse();
  }

  for (const batch of batches) {
    const scripParam = batch.join(',');
    const batchPoints: Record<string, StockHistoricalPoint[]> = {};

    for (const win of windows) {
      const url = `${INDSTOCKS_API_BASE}/market/historical/${opts.interval}?scrip-codes=${encodeURIComponent(
        scripParam
      )}&start_time=${win.start}&end_time=${win.end}`;

      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (token) {
        headers['Authorization'] = token.startsWith('Bearer ')
          ? token
          : `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs || 8000);

      try {
        const res = await fetch(url, {
          headers,
          signal: controller.signal,
        });

        if (!res.ok) {
          console.warn(
            `[INDstocks] Historical API returned HTTP ${res.status} for ${scripParam}`
          );
          continue;
        }

        const body = (await res.json()) as IndstocksHistoricalResponse;
        if (body.success && body.data) {
          for (const [code, scripData] of Object.entries(body.data)) {
            if (scripData && Array.isArray(scripData.candles)) {
              if (!batchPoints[code]) batchPoints[code] = [];
              for (const c of scripData.candles) {
                batchPoints[code].push({
                  date: formatCandleTimestamp(c.ts, opts.interval),
                  open: Number(c.o.toFixed(2)),
                  high: Number(c.h.toFixed(2)),
                  low: Number(c.l.toFixed(2)),
                  close: Number(c.c.toFixed(2)),
                  volume: Math.round(c.v),
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn(
          `[INDstocks] Request failed for ${url}:`,
          err instanceof Error ? err.message : err
        );
      } finally {
        clearTimeout(timer);
      }
    }

    // Merge de-duplicated points sorted chronologically
    for (const [code, pts] of Object.entries(batchPoints)) {
      const seenDates = new Set<string>();
      const deduped: StockHistoricalPoint[] = [];
      for (const p of pts) {
        if (!seenDates.has(p.date)) {
          seenDates.add(p.date);
          deduped.push(p);
        }
      }
      result[code] = deduped;
    }
  }

  return result;
}

/**
 * Fetch expired F&O contract candles from INDstocks API Suite.
 * Endpoint: GET /market/historical/expired/{interval}?trading-symbols={symbols}&start_time={ms}&end_time={ms}&segment={NFO|BFO}
 */
export async function fetchIndstocksExpiredCandles(opts: {
  tradingSymbols: string[];
  interval: IndstocksInterval;
  startTime: number;
  endTime: number;
  segment?: 'NFO' | 'BFO';
  accessToken?: string;
  timeoutMs?: number;
}): Promise<Record<string, StockHistoricalPoint[]>> {
  const token = opts.accessToken || getIndstocksAccessToken();
  const segment = opts.segment || 'NFO';
  const result: Record<string, StockHistoricalPoint[]> = {};
  if (!opts.tradingSymbols || opts.tradingSymbols.length === 0) return result;

  // trading-symbols: 1 to 50 identifiers per call
  const cleanSymbols = Array.from(
    new Set(opts.tradingSymbols.map((s) => s.trim()).filter(Boolean))
  );

  const batches: string[][] = [];
  for (let i = 0; i < cleanSymbols.length; i += 50) {
    batches.push(cleanSymbols.slice(i, i + 50));
  }

  for (const batch of batches) {
    const symbolsParam = batch.join(',');
    const url = `${INDSTOCKS_API_BASE}/market/historical/expired/${opts.interval}?trading-symbols=${encodeURIComponent(
      symbolsParam
    )}&start_time=${opts.startTime}&end_time=${opts.endTime}&segment=${segment}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs || 8000);

    try {
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        console.warn(
          `[INDstocks] Expired API returned HTTP ${res.status} for ${symbolsParam}`
        );
        continue;
      }

      const body = (await res.json()) as IndstocksHistoricalResponse;
      if (body.success && body.data) {
        for (const [sym, scripData] of Object.entries(body.data)) {
          if (scripData && Array.isArray(scripData.candles)) {
            result[sym] = scripData.candles.map((c) => ({
              date: formatCandleTimestamp(c.ts, opts.interval),
              open: Number(c.o.toFixed(2)),
              high: Number(c.h.toFixed(2)),
              low: Number(c.l.toFixed(2)),
              close: Number(c.c.toFixed(2)),
              volume: Math.round(c.v),
            }));
          }
        }
      }
    } catch (err) {
      console.warn(
        `[INDstocks] Expired request failed:`,
        err instanceof Error ? err.message : err
      );
    } finally {
      clearTimeout(timer);
    }
  }

  return result;
}

/**
 * Convenience helper to fetch and map candles for an individual Indian security.
 * Attempts INDstocks scrip-code lookup, falling back cleanly if token not yet connected.
 */
export async function getStockHistoricalFromIndstocks(opts: {
  symbol: string;
  bseCode?: string | null;
  instrumentToken?: number | string | null;
  range?: string;
  interval?: string;
}): Promise<StockHistoricalPoint[] | null> {
  const token = getIndstocksAccessToken();
  if (!token) return null; // Gracefully bypass when access token not configured

  const cleanSym = opts.symbol.toUpperCase().trim();
  const mappedInterval = mapToIndstocksInterval(opts.interval || (opts.range === '1d' ? '15m' : '1d'));
  const cacheKey = `${cleanSym}:${opts.range || '3mo'}:${mappedInterval}`;

  const cached = candleCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.points;
  }

  const { startTime, endTime } = computeRangeTimestamps(opts.range || '3mo');

  // Build candidate scrip-codes (e.g. NSE_3045, NSE_RELIANCE, BSE_500325)
  const candidateCodes: string[] = [];
  if (opts.instrumentToken) candidateCodes.push(`NSE_${opts.instrumentToken}`);
  candidateCodes.push(`NSE_${cleanSym}`);
  if (opts.bseCode && /^\d{6}$/.test(opts.bseCode)) {
    candidateCodes.push(`BSE_${opts.bseCode}`);
  }

  try {
    const data = await fetchIndstocksHistoricalData({
      scripCodes: candidateCodes.slice(0, 5),
      interval: mappedInterval,
      startTime,
      endTime,
      accessToken: token,
    });

    for (const code of candidateCodes) {
      if (data[code] && data[code].length > 0) {
        candleCache.set(cacheKey, {
          points: data[code],
          fetchedAt: Date.now(),
        });
        return data[code];
      }
    }
  } catch (err) {
    console.warn(
      `[INDstocks] Could not retrieve candles for ${cleanSym}:`,
      err instanceof Error ? err.message : err
    );
  }

  return null;
}

export interface IndstocksQuoteRecord {
  live_price?: number;
  day_change?: number;
  day_change_percentage?: number;
  day_low?: number;
  day_high?: number;
  day_open?: number;
  prev_close?: number;
  '52week_high'?: number;
  '52week_low'?: number;
  upper_circuit?: number;
  lower_circuit?: number;
  volume?: number;
  market_depth?: any;
}

export interface IndstocksQuotesResponse {
  status: 'success' | 'error';
  data?: Record<string, IndstocksQuoteRecord>;
  message?: string;
  debug_info?: string;
}

const quoteBatchCache = new Map<
  string,
  { quote: IndstocksQuoteRecord; fetchedAt: number }
>();
const QUOTE_CACHE_TTL_MS = 15 * 1000; // 15 seconds

/**
 * Fetch full real-time market quotes (LTP, OHLC, 52W high/low, circuit limits, volume)
 * from INDstocks GET /market/quotes/full?scrip-codes=...
 * Supports up to 1000 instruments per call.
 */
export async function fetchIndstocksQuotes(
  scripCodes: string[],
  timeoutMs = 8000
): Promise<Record<string, IndstocksQuoteRecord>> {
  const token = getIndstocksAccessToken();
  const result: Record<string, IndstocksQuoteRecord> = {};
  if (!scripCodes || scripCodes.length === 0) return result;

  const cleanCodes = Array.from(
    new Set(scripCodes.map((c) => c.trim()).filter(Boolean))
  );
  const toFetch: string[] = [];
  const now = Date.now();

  for (const code of cleanCodes) {
    const cached = quoteBatchCache.get(code);
    if (cached && now - cached.fetchedAt < QUOTE_CACHE_TTL_MS) {
      result[code] = cached.quote;
    } else {
      toFetch.push(code);
    }
  }

  if (toFetch.length === 0) return result;

  // Up to 1000 instruments per request batch
  const BATCH_SIZE = 500;
  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    const url = `${INDSTOCKS_API_BASE}/market/quotes/full?scrip-codes=${encodeURIComponent(
      batch.join(',')
    )}`;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      if (res.ok) {
        const body = (await res.json()) as IndstocksQuotesResponse;
        if (body.status === 'success' && body.data) {
          for (const [code, q] of Object.entries(body.data)) {
            result[code] = q;
            quoteBatchCache.set(code, { quote: q, fetchedAt: now });
          }
        }
      }
    } catch (err) {
      console.warn(
        `[INDstocks] Quotes full batch failed:`,
        err instanceof Error ? err.message : err
      );
    } finally {
      clearTimeout(timer);
    }
  }

  return result;
}

/**
 * Fetch lightweight Last Traded Price (LTP) from INDstocks GET /market/quotes/ltp
 */
export async function fetchIndstocksLtp(
  scripCodes: string[],
  timeoutMs = 6000
): Promise<Record<string, { livePrice: number; prevClose: number }>> {
  const quotes = await fetchIndstocksQuotes(scripCodes, timeoutMs);
  const result: Record<string, { livePrice: number; prevClose: number }> = {};
  for (const [code, q] of Object.entries(quotes)) {
    if (typeof q.live_price === 'number') {
      result[code] = {
        livePrice: q.live_price,
        prevClose: q.prev_close ?? q.live_price,
      };
    }
  }
  return result;
}

/**
 * Enrich an existing list of StockInstrument records with INDstocks live prices & stats
 */
export async function enrichStocksWithIndstocksQuotes(
  stocks: StockInstrument[]
): Promise<StockInstrument[]> {
  const token = getIndstocksAccessToken();
  if (!token || stocks.length === 0) return stocks;

  const codeToStockMap = new Map<string, StockInstrument>();
  const scripCodes: string[] = [];

  for (const s of stocks) {
    if (s.registry?.zerodhaNseToken) {
      const code = `NSE_${s.registry.zerodhaNseToken}`;
      scripCodes.push(code);
      codeToStockMap.set(code, s);
    }
    const nseSymCode = `NSE_${s.symbol.toUpperCase()}`;
    scripCodes.push(nseSymCode);
    codeToStockMap.set(nseSymCode, s);

    if (s.bseCode && /^\d{6}$/.test(s.bseCode)) {
      const bseCode = `BSE_${s.bseCode}`;
      scripCodes.push(bseCode);
      codeToStockMap.set(bseCode, s);
    }
  }

  try {
    const quotes = await fetchIndstocksQuotes(scripCodes);
    const nowIso = new Date().toISOString();

    for (const [code, q] of Object.entries(quotes)) {
      const stock = codeToStockMap.get(code);
      if (!stock || !q) continue;

      if (typeof q.live_price === 'number' && q.live_price > 0) {
        stock.currentPrice = q.live_price;
      }
      if (typeof q.prev_close === 'number' && q.prev_close > 0) {
        stock.previousClose = q.prev_close;
      }
      if (typeof q.day_open === 'number') stock.open = q.day_open;
      if (typeof q.day_high === 'number') stock.dayHigh = q.day_high;
      if (typeof q.day_low === 'number') stock.dayLow = q.day_low;
      if (typeof q['52week_high'] === 'number') stock.week52High = q['52week_high'];
      if (typeof q['52week_low'] === 'number') stock.week52Low = q['52week_low'];
      if (typeof q.volume === 'number') stock.volume = q.volume;

      if (!stock.dataSourcesUsed) stock.dataSourcesUsed = [];
      if (!stock.dataSourcesUsed.includes('INDstocks Live Market Feed')) {
        stock.dataSourcesUsed.push('INDstocks Live Market Feed');
      }
      stock.provenance.source = `${stock.provenance.source} · INDstocks`;
      stock.provenance.retrievedAt = nowIso;
      stock.lastTradeTime = nowIso;
    }
  } catch (err) {
    console.warn(
      `[INDstocks] Failed to enrich stocks with quotes:`,
      err instanceof Error ? err.message : err
    );
  }

  return stocks;
}

export interface IndstocksExploreSnapshot {
  sourceUrl: string;
  provenance: string;
  retrievedAt: string;
  totalUniverse: number;
  marketCapTiers: {
    largeCap: StockInstrument[];
    midCap: StockInstrument[];
    smallCap: StockInstrument[];
  };
  highlights: {
    topGainers: StockInstrument[];
    topLosers: StockInstrument[];
    mostActive: StockInstrument[];
    near52WeekHigh: StockInstrument[];
    near52WeekLow: StockInstrument[];
  };
  sectors: Record<string, StockInstrument[]>;
}

/**
 * Generate the Explore All Stocks feed categorized matching INDstocks explore-all:
 * https://www.indstocks.com/investments/stocks/explore-all
 */
export function getIndstocksExploreFeed(
  stocks: StockInstrument[]
): IndstocksExploreSnapshot {
  const calcPct = (s: StockInstrument) =>
    s.currentPrice && s.previousClose
      ? Number(
          (((s.currentPrice - s.previousClose) / s.previousClose) * 100).toFixed(
            2
          )
        )
      : 0;

  const valid = stocks.filter((s) => s.currentPrice && s.currentPrice > 0);

  // Large Cap >= 20000 Cr, Mid Cap 5000 - 20000 Cr, Small Cap < 5000 Cr
  const largeCap = valid.filter((s) => (s.marketCapCr ?? 0) >= 20000);
  const midCap = valid.filter(
    (s) => (s.marketCapCr ?? 0) >= 5000 && (s.marketCapCr ?? 0) < 20000
  );
  const smallCap = valid.filter((s) => (s.marketCapCr ?? 0) < 5000);

  const topGainers = [...valid]
    .sort((a, b) => calcPct(b) - calcPct(a))
    .slice(0, 25);
  const topLosers = [...valid]
    .sort((a, b) => calcPct(a) - calcPct(b))
    .slice(0, 25);
  const mostActive = [...valid]
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 25);

  const near52WeekHigh = valid
    .filter(
      (s) => s.week52High && s.currentPrice && s.currentPrice >= s.week52High * 0.95
    )
    .slice(0, 25);
  const near52WeekLow = valid
    .filter(
      (s) => s.week52Low && s.currentPrice && s.currentPrice <= s.week52Low * 1.05
    )
    .slice(0, 25);

  const sectors: Record<string, StockInstrument[]> = {};
  for (const s of valid) {
    const sec = s.sector || 'Equities';
    if (!sectors[sec]) sectors[sec] = [];
    sectors[sec].push(s);
  }

  return {
    sourceUrl: 'https://www.indstocks.com/investments/stocks/explore-all',
    provenance:
      'INDstocks Explore All Stocks Intelligence Feed (NSE & BSE Equities)',
    retrievedAt: new Date().toISOString(),
    totalUniverse: valid.length,
    marketCapTiers: {
      largeCap: largeCap.slice(0, 50),
      midCap: midCap.slice(0, 50),
      smallCap: smallCap.slice(0, 50),
    },
    highlights: {
      topGainers,
      topLosers,
      mostActive,
      near52WeekHigh,
      near52WeekLow,
    },
    sectors,
  };
}
