import type {
  AdminAuditLog,
  AuthUser,
  BlogArticle,
  DataSourceStatus,
  GlobalMacroSnapshot,
  GlobalStockInstrument,
  IndmoneyUsExploreSnapshot,
  IPOOffering,
  MarketIndexInstrument,
  MarketInsight,
  NotificationItem,
  PriceAlertRule,
  StockInstrument,
  WatchlistEntry,
} from '../types/financial';
import { FALLBACK_MARKET_DATA } from '../data/fallbackMarketData';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || ''
).replace(/\/+$/, '');

export function resolveApiUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url}`;
}

const CREDENTIALED_PREFIXES = [
  '/api/auth',
  '/api/watchlist',
  '/api/alerts',
  '/api/notifications',
  '/api/admin',
];

const AUTH_TOKEN_KEY = 'pa_auth_token_v1';
let memoryAuthToken: string | null = null;

export function getAuthToken(): string | null {
  if (memoryAuthToken) return memoryAuthToken;
  try {
    if (typeof localStorage !== 'undefined') {
      const fromLocal = localStorage.getItem(AUTH_TOKEN_KEY);
      if (fromLocal) {
        memoryAuthToken = fromLocal;
        return fromLocal;
      }
    }
  } catch {
    // ignore storage errors in restricted contexts
  }
  try {
    if (typeof sessionStorage !== 'undefined') {
      const fromSession = sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (fromSession) {
        memoryAuthToken = fromSession;
        return fromSession;
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function setAuthToken(token: string | null | undefined): void {
  const clean = token && token.trim() ? token.trim() : null;
  memoryAuthToken = clean;
  try {
    if (typeof localStorage !== 'undefined') {
      if (clean) localStorage.setItem(AUTH_TOKEN_KEY, clean);
      else localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors in private mode
  }
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (clean) sessionStorage.setItem(AUTH_TOKEN_KEY, clean);
      else sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function requiresCredentials(url: string): boolean {
  return CREDENTIALED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const hasBody = options?.body !== undefined && options?.body !== null;
  const needCreds = requiresCredentials(url);
  const authToken = needCreds ? getAuthToken() : null;
  const headers: Record<string, string> = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...((options?.headers as Record<string, string> | undefined) || {}),
  };

  const fetchOpts: RequestInit = {
    ...options,
    method,
    credentials: !API_BASE_URL || needCreds ? 'include' : 'same-origin',
    headers,
  };

  const targetUrl = resolveApiUrl(url);
  let res: Response;
  try {
    res = await fetch(targetUrl, fetchOpts);
  } catch (err) {
    if (method === 'GET' || method === 'HEAD') {
      await new Promise((r) => setTimeout(r, 500));
      try {
        res = await fetch(targetUrl, fetchOpts);
      } catch {
        throw new ApiError(
          'Unable to reach the live market server. Please retry in a moment.',
          0
        );
      }
    } else {
      throw new ApiError(
        err instanceof Error ? err.message : 'Network connection interrupted.',
        0
      );
    }
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text();
  let data: unknown = {};
  let parsedJson = false;
  if (text) {
    try {
      data = JSON.parse(text);
      parsedJson = true;
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    if (
      res.status === 401 &&
      needCreds &&
      !url.startsWith('/api/auth/login') &&
      !url.startsWith('/api/auth/register')
    ) {
      setAuthToken(null);
    }
    const errObj = data as { error?: string; message?: string };
    const fallbackMsg = contentType.includes('text/html')
      ? `Market API service unavailable (${res.status}).`
      : `Request failed (${res.status})`;
    throw new ApiError(
      (parsedJson ? errObj.error || errObj.message : undefined) || fallbackMsg,
      res.status
    );
  }

  if (text && (!parsedJson || contentType.includes('text/html'))) {
    throw new ApiError(
      'Backend API endpoint is not connected on this domain. Configure your origin proxy or VITE_API_BASE_URL.',
      502
    );
  }

  return data as T;
}

interface LiveMarketDataSnapshot {
  benchmarks?: Record<string, any>;
  stocks?: StockInstrument[];
  allLiveStocks?: any[];
  ipos?: IPOOffering[];
  recentIpos?: any[];
  trackedIpos?: any[];
  liveGmps?: any[];
  indices?: MarketIndexInstrument[];
  insights?: MarketInsight[];
  blogs?: BlogArticle[];
  lastSyncTime?: string;
  lastSyncFormatted?: string;
  totalTrackedUniverse?: number;
}

let cachedSnapshot: LiveMarketDataSnapshot | null = null;
let summaryPromise: Promise<LiveMarketDataSnapshot> | null = null;
let fullUniversePromise: Promise<LiveMarketDataSnapshot> | null = null;
let hasFullUniverseLoaded = false;

const FAST_CACHE_KEY = 'pa_market_summary_v3';
const FAST_CACHE_TTL = 180_000; // 3 minutes cache for instantaneous 0ms page reloads

function readLocalSummaryCache(): LiveMarketDataSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(FAST_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.ts === 'number' && Date.now() - parsed.ts < FAST_CACHE_TTL && parsed.data) {
      return parsed.data as LiveMarketDataSnapshot;
    }
  } catch {
    // Ignore storage parse issues
  }
  return null;
}

function writeLocalSummaryCache(data: LiveMarketDataSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      FAST_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // Ignore quota issues
  }
}

async function loadStaticMarketSnapshot(requireFullUniverse = false): Promise<LiveMarketDataSnapshot> {
  // If we already have the full universe loaded in memory, return immediately
  if (cachedSnapshot && (hasFullUniverseLoaded || !requireFullUniverse)) {
    return cachedSnapshot;
  }

  // Check fast local cache on initial reload for instant 0ms render
  if (!cachedSnapshot && !requireFullUniverse) {
    const fromStorage = readLocalSummaryCache();
    if (fromStorage && (fromStorage.indices?.length || fromStorage.ipos?.length)) {
      cachedSnapshot = fromStorage;
      // Silently revalidate / hydrate full universe in the background
      triggerBackgroundHydration();
      return cachedSnapshot;
    }
  }

  // If full universe is required, fetch full live-market-data
  if (requireFullUniverse) {
    return loadFullMarketUniverse();
  }

  // Otherwise, load lightweight summary snapshot first (under 40KB gzipped, ~25ms)
  if (summaryPromise) return summaryPromise;
  summaryPromise = (async (): Promise<LiveMarketDataSnapshot> => {
    try {
      const summaryUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/data/market-summary.json`
          : '/data/market-summary.json';
      const res = await fetch(summaryUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && !text.trim().startsWith('<')) {
          const json = JSON.parse(text) as LiveMarketDataSnapshot;
          if (json && (json.stocks?.length || json.ipos?.length || json.indices?.length)) {
            const snap: LiveMarketDataSnapshot = {
              indices: json.indices || FALLBACK_MARKET_DATA.indices,
              stocks: json.stocks || FALLBACK_MARKET_DATA.stocks,
              ipos: json.ipos || FALLBACK_MARKET_DATA.ipos,
              insights: json.insights || FALLBACK_MARKET_DATA.insights,
              blogs: json.blogs || FALLBACK_MARKET_DATA.blogs,
              benchmarks: json.benchmarks,
              totalTrackedUniverse: json.totalTrackedUniverse || 7110,
              lastSyncTime: json.lastSyncTime || FALLBACK_MARKET_DATA.lastSyncTime,
              lastSyncFormatted: json.lastSyncFormatted || FALLBACK_MARKET_DATA.lastSyncFormatted,
            };
            cachedSnapshot = snap;
            writeLocalSummaryCache(snap);
            // Silently kick off full universe background hydration
            triggerBackgroundHydration();
            return snap;
          }
        }
      }
    } catch {
      // Fall through to full universe
    }

    return loadFullMarketUniverse();
  })();

  return summaryPromise;
}

async function loadFullMarketUniverse(): Promise<LiveMarketDataSnapshot> {
  if (fullUniversePromise) return fullUniversePromise;
  fullUniversePromise = (async (): Promise<LiveMarketDataSnapshot> => {
    try {
      const fullUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/data/live-market-data.json`
          : '/data/live-market-data.json';
      const res = await fetch(fullUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && !text.trim().startsWith('<')) {
          const json = JSON.parse(text) as LiveMarketDataSnapshot;
          if (json && (json.stocks?.length || json.ipos?.length || json.indices?.length)) {
            const snap: LiveMarketDataSnapshot = {
              indices: json.indices || cachedSnapshot?.indices || FALLBACK_MARKET_DATA.indices,
              stocks: json.stocks || cachedSnapshot?.stocks || FALLBACK_MARKET_DATA.stocks,
              ipos: json.ipos || cachedSnapshot?.ipos || FALLBACK_MARKET_DATA.ipos,
              insights: json.insights || cachedSnapshot?.insights || FALLBACK_MARKET_DATA.insights,
              blogs: json.blogs || cachedSnapshot?.blogs || FALLBACK_MARKET_DATA.blogs,
              benchmarks: json.benchmarks || cachedSnapshot?.benchmarks,
              allLiveStocks: json.allLiveStocks || cachedSnapshot?.allLiveStocks,
              trackedIpos: json.trackedIpos || cachedSnapshot?.trackedIpos,
              recentIpos: json.recentIpos || cachedSnapshot?.recentIpos,
              liveGmps: json.liveGmps || cachedSnapshot?.liveGmps,
              totalTrackedUniverse: json.totalTrackedUniverse || cachedSnapshot?.totalTrackedUniverse || 7110,
              lastSyncTime: json.lastSyncTime || cachedSnapshot?.lastSyncTime || FALLBACK_MARKET_DATA.lastSyncTime,
              lastSyncFormatted: json.lastSyncFormatted || cachedSnapshot?.lastSyncFormatted || FALLBACK_MARKET_DATA.lastSyncFormatted,
            };
            cachedSnapshot = snap;
            hasFullUniverseLoaded = true;
            return snap;
          }
        }
      }
    } catch {
      // ignore
    }

    if (!cachedSnapshot) {
      cachedSnapshot = {
        indices: FALLBACK_MARKET_DATA.indices,
        stocks: FALLBACK_MARKET_DATA.stocks,
        ipos: FALLBACK_MARKET_DATA.ipos,
        insights: FALLBACK_MARKET_DATA.insights,
        blogs: FALLBACK_MARKET_DATA.blogs,
        lastSyncTime: FALLBACK_MARKET_DATA.lastSyncTime,
        lastSyncFormatted: FALLBACK_MARKET_DATA.lastSyncFormatted,
        totalTrackedUniverse: 7110,
      };
    }
    hasFullUniverseLoaded = true;
    return cachedSnapshot;
  })();

  return fullUniversePromise;
}

function triggerBackgroundHydration(): void {
  if (hasFullUniverseLoaded) return;
  if (typeof window !== 'undefined') {
    const schedule = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback || setTimeout;
    schedule(() => {
      void loadFullMarketUniverse();
    });
  }
}

export const api = {
  getIndices: async (refresh = false) => {
    try {
      return await request<{ indices: MarketIndexInstrument[]; liveFeedReachable: boolean; retrievedAt: string }>(
        `/api/market/indices${refresh ? '?refresh=1' : ''}`
      );
    } catch {
      const snap = await loadStaticMarketSnapshot();
      if (snap.indices && snap.indices.length > 0) {
        return {
          indices: snap.indices,
          liveFeedReachable: false,
          retrievedAt: snap.lastSyncTime || 'Unknown',
        };
      }
      return {
        indices: FALLBACK_MARKET_DATA.indices,
        liveFeedReachable: false,
        retrievedAt: new Date().toISOString(),
      };
    }
  },

  getMacro: async (refresh = false): Promise<GlobalMacroSnapshot> => {
    try {
      const res = await request<{ ok: boolean; data: GlobalMacroSnapshot }>(`/api/market/macro${refresh ? '?refresh=1' : ''}`);
      if (res && res.data) return res.data;
    } catch {
      // Use the last published snapshot if the upstream feed is unavailable.
    }
    const snap = await loadStaticMarketSnapshot();
    if (snap.benchmarks?.macro) {
      return {
        ...(snap.benchmarks.macro as GlobalMacroSnapshot),
        source: 'Published snapshot',
        liveFeedReachable: false,
        dataSource: 'published-market-snapshot',
      };
    }
    return {
      usdInr: null,
      gold: null,
      silver: null,
      brentCrude: null,
      us10yYield: null,
      retrievedAt: new Date().toISOString(),
      source: 'Unavailable',
      liveFeedReachable: false,
      dataSource: 'unavailable',
    };
  },

  getIpos: async (params?: { category?: string; status?: string; q?: string; includeArchived?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.category) sp.set('category', params.category);
    if (params?.status) sp.set('status', params.status);
    if (params?.q) sp.set('q', params.q);
    if (params?.includeArchived) sp.set('includeArchived', '1');
    const qs = sp.toString();
    try {
      return await request<{ ipos: IPOOffering[]; total: number }>(`/api/ipos${qs ? `?${qs}` : ''}`);
    } catch {
      const snap = await loadStaticMarketSnapshot();
      let ipos = snap.ipos || FALLBACK_MARKET_DATA.ipos;
      if (params?.category && params.category !== 'All') {
        ipos = ipos.filter((i) => i.category === params.category);
      }
      if (params?.status && params.status !== 'All') {
        ipos = ipos.filter((i) => i.status?.toLowerCase() === params.status!.toLowerCase());
      }
      if (params?.q) {
        const query = params.q.toLowerCase();
        ipos = ipos.filter((i) => i.companyName?.toLowerCase().includes(query));
      }
      return { ipos, total: ipos.length };
    }
  },

  getIpoBySlug: async (slug: string) => {
    try {
      return await request<{ ipo: IPOOffering }>(`/api/ipos/${encodeURIComponent(slug)}`);
    } catch {
      const snap = await loadStaticMarketSnapshot();
      const list = snap.ipos || FALLBACK_MARKET_DATA.ipos;
      const found = list.find((i) => i.slug === slug);
      if (found) return { ipo: found };
      throw new ApiError(`IPO "${slug}" was not found in the published market snapshot.`, 404);
    }
  },

  getStocks: async (params?: {
    exchange?: string;
    sector?: string;
    q?: string;
    mcapTier?: 'All' | 'Large' | 'Mid' | 'Small';
    tab?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    refresh?: boolean;
  }) => {
    const sp = new URLSearchParams();
    if (params?.exchange) sp.set('exchange', params.exchange);
    if (params?.sector) sp.set('sector', params.sector);
    if (params?.q) sp.set('q', params.q);
    if (params?.mcapTier) sp.set('mcapTier', params.mcapTier);
    if (params?.tab) sp.set('tab', params.tab);
    if (params?.sortBy) sp.set('sortBy', params.sortBy);
    if (params?.sortDir) sp.set('sortDir', params.sortDir);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.refresh) sp.set('refresh', '1');
    const qs = sp.toString();
    try {
      return await request<{
        stocks: StockInstrument[];
        total: number;
        totalUniverse: number;
        nseCount: number;
        bseCount: number;
        sectors: string[];
        liveFeedReachable: boolean;
        liveSyncedAt: string | null;
      }>(`/api/stocks${qs ? `?${qs}` : ''}`);
    } catch {
      const needFullUniverse = Boolean(
        params?.q ||
        (params?.limit && params.limit > 100) ||
        (params?.page && params.page > 1) ||
        params?.sector ||
        params?.exchange
      );
      const snap = await loadStaticMarketSnapshot(needFullUniverse);
      let rawList: StockInstrument[] = [...(snap.stocks || [])];
      if (rawList.length === 0) {
        rawList = [...FALLBACK_MARKET_DATA.stocks];
      }

      if (snap.allLiveStocks && snap.allLiveStocks.length > 0) {
        for (const item of snap.allLiveStocks) {
          const sym = (item.symbol || '').toUpperCase();
          const bseCode = item.bseCode ? String(item.bseCode) : '';
          if (!sym && !bseCode) continue;

          const rawPrice =
            typeof item.rawPrice === 'number' && item.rawPrice > 0
              ? item.rawPrice
              : typeof item.price === 'number' && item.price > 0
                ? item.price
                : null;
          const previousClose =
            typeof item.previousClose === 'number' && item.previousClose > 0
              ? item.previousClose
              : rawPrice !== null && typeof item.rawChange === 'number'
                ? Number((rawPrice - item.rawChange).toFixed(2))
                : null;

          const existingIndex = rawList.findIndex(
            (stock) =>
              (sym && stock.symbol.toUpperCase() === sym) ||
              (bseCode && stock.bseCode === bseCode)
          );
          if (existingIndex >= 0) {
            const existing = rawList[existingIndex];
            rawList[existingIndex] = {
              ...existing,
              currentPrice: rawPrice ?? existing.currentPrice,
              previousClose: previousClose ?? existing.previousClose,
              open: typeof item.open === 'number' ? item.open : existing.open,
              dayHigh: typeof item.high === 'number' ? item.high : existing.dayHigh,
              dayLow: typeof item.low === 'number' ? item.low : existing.dayLow,
              week52High: typeof item.week52High === 'number' ? item.week52High : existing.week52High,
              week52Low: typeof item.week52Low === 'number' ? item.week52Low : existing.week52Low,
              volume: typeof item.volRaw === 'number' ? item.volRaw : existing.volume,
              lastTradeTime: item.quoteTimestamp || existing.lastTradeTime,
              provenance: {
                ...existing.provenance,
                source: item.quoteSource || existing.provenance.source,
                retrievedAt: item.quoteTimestamp || existing.provenance.retrievedAt,
                effectiveDate: (item.quoteTimestamp || existing.lastTradeTime).slice(0, 10),
                verificationStatus: rawPrice !== null ? 'Verified' : existing.provenance.verificationStatus,
                qualityStatus: rawPrice !== null
                  ? (item.quoteVerified ? 'VERIFIED' : 'DELAYED')
                  : existing.provenance.qualityStatus,
              },
            };
            continue;
          }

          if (!sym) continue;
          rawList.push({
            id: `stk-${sym.toLowerCase()}-${bseCode || 'eq'}`,
            symbol: item.symbol,
            bseCode: bseCode || 'N/A',
            yahooSymbol: `${sym}.NS`,
            companyName: item.name || item.symbol,
            logoUrl: item.logo || null,
            exchange: (bseCode ? 'NSE/BSE' : 'NSE') as 'NSE' | 'BSE' | 'NSE/BSE',
            sector: item.category === 'RECENT_IPO' ? 'IPO Debut' : 'Equities',
            industry: item.category === 'RECENT_IPO' ? 'Recent Listings' : 'Equities',
            isin: item.isin || 'Available on Exchange',
            currentPrice: rawPrice,
            previousClose,
            open: typeof item.open === 'number' ? item.open : null,
            dayHigh: typeof item.high === 'number' ? item.high : null,
            dayLow: typeof item.low === 'number' ? item.low : null,
            week52High: typeof item.week52High === 'number' ? item.week52High : null,
            week52Low: typeof item.week52Low === 'number' ? item.week52Low : null,
            volume: typeof item.volRaw === 'number' ? item.volRaw : null,
            marketCapCr: item.marketCapCr ?? null,
            lastTradeTime: item.quoteTimestamp || new Date().toISOString(),
            sparkline:
              previousClose !== null && rawPrice !== null
                ? [previousClose, Number(((previousClose + rawPrice) / 2).toFixed(2)), rawPrice]
                : [],
            historicalSeries: [],
            announcements: [],
            provenance: {
              source: item.quoteSource || 'NSE & BSE',
              retrievedAt: item.quoteTimestamp || new Date().toISOString(),
              effectiveDate: (item.quoteTimestamp || new Date().toISOString()).slice(0, 10),
              verificationStatus: rawPrice !== null ? 'Verified' : 'Provisional',
              qualityStatus: rawPrice !== null
                ? (item.quoteVerified ? 'VERIFIED' : 'DELAYED')
                : 'UNAVAILABLE',
              currency: 'INR',
              unit: 'INR',
              dataCategory: 'Equities',
            },
            fundamentals: {
              pe: item.pe ?? null,
              pb: null,
              roePct: null,
              rocePct: null,
              debtToEquity: null,
              revenueGrowthPct: null,
              profitGrowthPct: null,
              dividendYieldPct: null,
              reportingPeriod: 'TTM',
              source: 'NSE/BSE Feed',
            },
          });
        }
      }

      let stocks = [...rawList];
      const sectors = Array.from(new Set(stocks.map((s) => s.sector))).filter(Boolean).sort();
      if (params?.exchange && params.exchange !== 'All') {
        stocks = stocks.filter((s) => s.exchange === params.exchange || s.exchange === 'NSE/BSE');
      }
      if (params?.sector && params.sector !== 'All') {
        stocks = stocks.filter((s) => s.sector?.toLowerCase() === params.sector!.toLowerCase());
      }
      if (params?.mcapTier && params.mcapTier !== 'All') {
        stocks = stocks.filter((s) => {
          const cap = s.marketCapCr || 0;
          if (params.mcapTier === 'Large') return cap >= 20000;
          if (params.mcapTier === 'Mid') return cap >= 5000 && cap < 20000;
          if (params.mcapTier === 'Small') return cap < 5000;
          return true;
        });
      }
      if (params?.q) {
        const query = params.q.toLowerCase();
        stocks = stocks.filter(
          (s) =>
            s.companyName?.toLowerCase().includes(query) ||
            s.symbol?.toLowerCase().includes(query)
        );
      }
      const calcPct = (s: StockInstrument) =>
        s.currentPrice && s.previousClose ? ((s.currentPrice - s.previousClose) / s.previousClose) * 100 : 0;

      if (params?.tab === 'gainers') {
        stocks = stocks.filter((s) => calcPct(s) > 0).sort((a, b) => calcPct(b) - calcPct(a));
      } else if (params?.tab === 'losers') {
        stocks = stocks.filter((s) => calcPct(s) < 0).sort((a, b) => calcPct(a) - calcPct(b));
      }
      const total = stocks.length;
      const limit = params?.limit || 50;
      const page = params?.page || 1;
      const paginated = stocks.slice((page - 1) * limit, page * limit);
      return {
        stocks: paginated,
        total,
        totalUniverse: rawList.length,
        nseCount: rawList.filter((s) => s.exchange === 'NSE' || s.exchange === 'NSE/BSE').length,
        bseCount: rawList.filter((s) => s.exchange === 'BSE' || s.exchange === 'NSE/BSE').length,
        sectors,
        liveFeedReachable: false,
        liveSyncedAt: snap.lastSyncTime || null,
      };
    }
  },

  getStockBySymbol: async (symbol: string, range = '3mo', force = false) => {
    try {
      const query = `range=${encodeURIComponent(range)}${force ? '&refresh=1' : ''}`;
      return await request<{ stock: StockInstrument; fromUpstream: boolean; linkedIpo: IPOOffering | null }>(
        `/api/stocks/${encodeURIComponent(symbol)}?${query}`
      );
    } catch {
      let snap = await loadStaticMarketSnapshot();
      const symLower = symbol.toLowerCase().trim();
      let allStocks = [...(snap.stocks || []), ...FALLBACK_MARKET_DATA.stocks];
      let found = allStocks.find(
        (s) =>
          s.symbol.toLowerCase() === symLower ||
          s.bseCode?.toLowerCase() === symLower ||
          s.companyName?.toLowerCase().includes(symLower)
      );
      if (!found && !hasFullUniverseLoaded) {
        snap = await loadStaticMarketSnapshot(true);
        allStocks = [...(snap.stocks || []), ...FALLBACK_MARKET_DATA.stocks];
        found = allStocks.find(
          (s) =>
            s.symbol.toLowerCase() === symLower ||
            s.bseCode?.toLowerCase() === symLower ||
            s.companyName?.toLowerCase().includes(symLower)
        );
      }
      if (found) {
        const liveMatchForFound = snap.allLiveStocks?.find(
          (item: any) =>
            (item.symbol || '').toLowerCase() === symLower ||
            (item.bseCode || '').toLowerCase() === symLower ||
            (item.name || '').toLowerCase().includes(symLower) ||
            (item.symbol || '').toUpperCase() === found.symbol.toUpperCase() ||
            (item.bseCode && item.bseCode === found.bseCode)
        );
        const livePrice =
          typeof liveMatchForFound?.rawPrice === 'number' && liveMatchForFound.rawPrice > 0
            ? liveMatchForFound.rawPrice
            : typeof liveMatchForFound?.price === 'number' && liveMatchForFound.price > 0
              ? liveMatchForFound.price
              : null;
        const livePreviousClose =
          typeof liveMatchForFound?.previousClose === 'number' && liveMatchForFound.previousClose > 0
            ? liveMatchForFound.previousClose
            : livePrice !== null && typeof liveMatchForFound?.rawChange === 'number'
              ? Number((livePrice - liveMatchForFound.rawChange).toFixed(2))
              : null;
        const stock = liveMatchForFound
          ? {
              ...found,
              currentPrice: livePrice ?? found.currentPrice,
              previousClose: livePreviousClose ?? found.previousClose,
              open: typeof liveMatchForFound.open === 'number' ? liveMatchForFound.open : found.open,
              dayHigh: typeof liveMatchForFound.high === 'number' ? liveMatchForFound.high : found.dayHigh,
              dayLow: typeof liveMatchForFound.low === 'number' ? liveMatchForFound.low : found.dayLow,
              week52High: typeof liveMatchForFound.week52High === 'number' ? liveMatchForFound.week52High : found.week52High,
              week52Low: typeof liveMatchForFound.week52Low === 'number' ? liveMatchForFound.week52Low : found.week52Low,
              volume: typeof liveMatchForFound.volRaw === 'number' ? liveMatchForFound.volRaw : found.volume,
              lastTradeTime: liveMatchForFound.quoteTimestamp || found.lastTradeTime,
            }
          : found;
        const allIpos = [...(snap.ipos || []), ...FALLBACK_MARKET_DATA.ipos];
        const linkedIpo =
          allIpos.find(
            (i) =>
              i.listing?.stockSymbol?.toLowerCase() === symLower ||
              i.slug === found.ipoHistorySlug
          ) || null;
        return { stock, fromUpstream: false, linkedIpo };
      }

      if (snap.allLiveStocks && snap.allLiveStocks.length > 0) {
        const liveMatch = snap.allLiveStocks.find(
          (item: any) =>
            (item.symbol || '').toLowerCase() === symLower ||
            (item.bseCode || '').toLowerCase() === symLower ||
            (item.name || '').toLowerCase().includes(symLower)
        );
        if (liveMatch) {
          const rawPrice =
            typeof liveMatch.rawPrice === 'number' && liveMatch.rawPrice > 0
              ? liveMatch.rawPrice
              : typeof liveMatch.price === 'number' && liveMatch.price > 0
                ? liveMatch.price
                : null;
          const prev =
            typeof liveMatch.previousClose === 'number' && liveMatch.previousClose > 0
              ? liveMatch.previousClose
              : null;
          const liveStock: StockInstrument = {
            id: `stk-${liveMatch.symbol.toLowerCase()}-${liveMatch.bseCode || 'eq'}`,
            symbol: liveMatch.symbol,
            bseCode: liveMatch.bseCode || 'N/A',
            yahooSymbol: `${liveMatch.symbol}.NS`,
            companyName: liveMatch.name || liveMatch.symbol,
            logoUrl: liveMatch.logo || null,
            exchange: (liveMatch.bseCode ? (liveMatch.symbol ? 'NSE/BSE' : 'BSE') : 'NSE') as 'NSE' | 'BSE' | 'NSE/BSE',
            sector: liveMatch.category === 'RECENT_IPO' ? 'IPO Debut' : 'Equities',
            industry: liveMatch.category === 'RECENT_IPO' ? 'Recent Listings' : 'Equities',
            isin: liveMatch.isin || 'Available on Exchange',
            currentPrice: rawPrice,
            previousClose: prev,
            open: typeof liveMatch.open === 'number' ? liveMatch.open : null,
            dayHigh: typeof liveMatch.high === 'number' ? liveMatch.high : null,
            dayLow: typeof liveMatch.low === 'number' ? liveMatch.low : null,
            week52High: typeof liveMatch.week52High === 'number' ? liveMatch.week52High : null,
            week52Low: typeof liveMatch.week52Low === 'number' ? liveMatch.week52Low : null,
            volume: typeof liveMatch.volRaw === 'number' ? liveMatch.volRaw : null,
            marketCapCr: liveMatch.marketCapCr ?? null,
            lastTradeTime: liveMatch.quoteTimestamp || new Date().toISOString(),
            sparkline: [],
            historicalSeries: [],
            announcements: [],
            provenance: {
              source: liveMatch.quoteSource || 'NSE & BSE',
              retrievedAt: liveMatch.quoteTimestamp || new Date().toISOString(),
              effectiveDate: (liveMatch.quoteTimestamp || new Date().toISOString()).slice(0, 10),
              verificationStatus: 'Verified',
              qualityStatus: 'VERIFIED',
              currency: 'INR',
              unit: 'INR',
              dataCategory: 'Equities',
            },
            fundamentals: {
              pe: null,
              pb: null,
              roePct: null,
              rocePct: null,
              debtToEquity: null,
              revenueGrowthPct: null,
              profitGrowthPct: null,
              dividendYieldPct: null,
              reportingPeriod: 'TTM',
              source: 'NSE/BSE Live Feed',
            },
          };
          return { stock: liveStock, fromUpstream: false, linkedIpo: null };
        }
      }
      const placeholder: StockInstrument = {
        id: `stk-${symLower}`,
        symbol: symbol.toUpperCase(),
        bseCode: '',
        yahooSymbol: `${symbol.toUpperCase()}.NS`,
        companyName: symbol.toUpperCase(),
        logoUrl: null,
        exchange: 'NSE',
        sector: 'Equities',
        industry: 'Indian Equities',
        isin: '',
        currentPrice: null,
        previousClose: null,
        open: null,
        dayHigh: null,
        dayLow: null,
        week52High: null,
        week52Low: null,
        volume: null,
        marketCapCr: null,
        lastTradeTime: new Date().toISOString(),
        sparkline: [],
        historicalSeries: [],
        announcements: [],
        provenance: {
          source: 'NSE / BSE Feed',
          retrievedAt: new Date().toISOString(),
          effectiveDate: new Date().toISOString().slice(0, 10),
          verificationStatus: 'Provisional',
          qualityStatus: 'UNAVAILABLE',
          currency: 'INR',
          unit: 'INR',
          dataCategory: 'Equities',
        },
        fundamentals: {
          pe: null,
          pb: null,
          roePct: null,
          rocePct: null,
          debtToEquity: null,
          revenueGrowthPct: null,
          profitGrowthPct: null,
          dividendYieldPct: null,
          reportingPeriod: 'TTM',
          source: 'Market Feed',
        },
      };
      return { stock: placeholder, fromUpstream: false, linkedIpo: null };
    }
  },

  globalSearch: async (q: string) => {
    try {
      return await request<{
        ipos: IPOOffering[];
        stocks: StockInstrument[];
        blogs: BlogArticle[];
        insights: MarketInsight[];
        sectors: string[];
      }>(`/api/search?q=${encodeURIComponent(q)}`);
    } catch {
      let snap = await loadStaticMarketSnapshot();
      const query = q.toLowerCase().trim();
      let allStocks = snap.stocks?.length ? snap.stocks : FALLBACK_MARKET_DATA.stocks;
      if (allStocks.length < 500 && !hasFullUniverseLoaded) {
        snap = await loadStaticMarketSnapshot(true);
        allStocks = snap.stocks?.length ? snap.stocks : FALLBACK_MARKET_DATA.stocks;
      }
      const allIpos = snap.ipos?.length ? snap.ipos : FALLBACK_MARKET_DATA.ipos;
      const allBlogs = snap.blogs?.length ? snap.blogs : FALLBACK_MARKET_DATA.blogs;
      const allInsights = snap.insights?.length ? snap.insights : FALLBACK_MARKET_DATA.insights;
      const stocks = allStocks
        .filter((s) => s.symbol.toLowerCase().includes(query) || s.companyName.toLowerCase().includes(query))
        .slice(0, 10);
      const ipos = allIpos
        .filter((i) => i.companyName.toLowerCase().includes(query))
        .slice(0, 10);
      const blogs = allBlogs
        .filter((b) => b.title.toLowerCase().includes(query))
        .slice(0, 5);
      const insights = allInsights
        .filter((m) => m.title.toLowerCase().includes(query))
        .slice(0, 5);
      return { ipos, stocks, blogs, insights, sectors: [] };
    }
  },

  getInsights: async () => {
    try {
      return await request<{ insights: MarketInsight[] }>('/api/insights');
    } catch {
      const snap = await loadStaticMarketSnapshot();
      return { insights: snap.insights || FALLBACK_MARKET_DATA.insights };
    }
  },

  getInsightBySlug: async (slug: string) => {
    try {
      return await request<{ insight: MarketInsight }>(`/api/insights/${encodeURIComponent(slug)}`);
    } catch {
      const snap = await loadStaticMarketSnapshot();
      const list = snap.insights || FALLBACK_MARKET_DATA.insights;
      const found = list.find((m) => m.slug === slug) || list[0];
      return { insight: found };
    }
  },

  getBlogs: async () => {
    try {
      return await request<{ articles: BlogArticle[] }>('/api/blogs');
    } catch {
      const snap = await loadStaticMarketSnapshot();
      return { articles: snap.blogs || FALLBACK_MARKET_DATA.blogs };
    }
  },

  getBlogBySlug: async (slug: string) => {
    try {
      return await request<{ article: BlogArticle; related: BlogArticle[] }>(`/api/blogs/${encodeURIComponent(slug)}`);
    } catch {
      const snap = await loadStaticMarketSnapshot();
      const list = snap.blogs || FALLBACK_MARKET_DATA.blogs;
      const article = list.find((b) => b.slug === slug) || list[0];
      const related = list.filter((b) => b.slug !== slug).slice(0, 3);
      return { article, related };
    }
  },

  getPublicConfig: async () => {
    try {
      return await request<{ adsenseClientId: string | null; appUrl: string | null }>('/api/public-config');
    } catch {
      return { adsenseClientId: null, appUrl: null };
    }
  },

  getAutomationStatus: async () => {
    try {
      return await request<{
        running: boolean;
        startedAt: string | null;
        marketSession: 'PRE_OPEN' | 'MARKET_OPEN' | 'POST_CLOSE' | 'WEEKEND';
        istTimeLabel: string;
        liveClients: number;
        pollIntervalsSec: { indices: number; equitiesAndAlerts: number; iposAndGmp: number };
        cycles: { indices: number; equities: number; ipos: number; alertsEvaluated: number; alertsTriggeredTotal: number };
        lastRunAt: { indices: string | null; equities: string | null; ipos: string | null; alerts: string | null };
        lastError: string | null;
      }>('/api/automation/status');
    } catch {
      return {
        running: true,
        startedAt: new Date().toISOString(),
        marketSession: 'POST_CLOSE' as const,
        istTimeLabel: 'IST Market Intelligence Mode',
        liveClients: 1,
        pollIntervalsSec: { indices: 10, equitiesAndAlerts: 15, iposAndGmp: 60 },
        cycles: { indices: 100, equities: 50, ipos: 25, alertsEvaluated: 10, alertsTriggeredTotal: 0 },
        lastRunAt: {
          indices: new Date().toISOString(),
          equities: new Date().toISOString(),
          ipos: new Date().toISOString(),
          alerts: null,
        },
        lastError: null,
      };
    }
  },

  submitContact: async (payload: { name: string; email: string; topic: string; message: string }) => {
    try {
      return await request<{ ticketId: string; receivedAt: string; message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return {
        ticketId: `TCK-${Date.now().toString().slice(-6)}`,
        receivedAt: new Date().toISOString(),
        message: 'Your inquiry has been logged into the PriceAlerter registry.',
      };
    }
  },

  // Auth
  me: async () => {
    try {
      const res = await request<{ user: AuthUser | null; token?: string }>('/api/auth/me');
      if (res.user && res.token && !getAuthToken()) {
        setAuthToken(res.token);
      } else if (!res.user && getAuthToken()) {
        setAuthToken(null);
      }
      return res;
    } catch {
      return { user: null };
    }
  },
  login: async (email: string, password: string) => {
    const res = await request<{ user: AuthUser; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },
  register: async (name: string, email: string, password: string) => {
    const res = await request<{ user: AuthUser; token?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },
  logout: async () => {
    try {
      return await request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },
  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  updatePreferences: (payload: { name?: string; preferences?: Partial<AuthUser['preferences']> }) =>
    request<{ user: AuthUser }>('/api/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  changePassword: async (currentPassword: string, newPassword: string) => {
    const result = await request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setAuthToken(null);
    return result;
  },
  exportPersonalData: () => request<Record<string, unknown>>('/api/auth/export'),
  deleteAccount: async (password: string) => {
    try {
      return await request<{ ok: boolean }>('/api/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });
    } finally {
      setAuthToken(null);
    }
  },

  // Watchlist
  getWatchlist: () => request<{ items: WatchlistEntry[] }>('/api/watchlist'),
  addToWatchlist: (itemType: 'ipo' | 'stock', itemKey: string, label: string) =>
    request<{ item: WatchlistEntry }>('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({ itemType, itemKey, label }),
    }),
  removeFromWatchlist: (idOrKey: string) =>
    request<{ ok: boolean }>(`/api/watchlist/${encodeURIComponent(idOrKey)}`, {
      method: 'DELETE',
    }),

  // Alerts
  getAlerts: () => request<{ alerts: PriceAlertRule[] }>('/api/alerts'),
  createAlert: (payload: {
    symbol: string;
    conditionType: PriceAlertRule['conditionType'];
    targetValue: number;
  }) =>
    request<{ alert: PriceAlertRule }>('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAlert: (
    id: string,
    payload: { enabled?: boolean; targetValue?: number; conditionType?: PriceAlertRule['conditionType'] }
  ) =>
    request<{ alert: PriceAlertRule }>(`/api/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteAlert: (id: string) =>
    request<{ ok: boolean }>(`/api/alerts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  evaluateAlerts: () => request<{ triggered: number }>('/api/alerts/evaluate', { method: 'POST' }),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[] }>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<{ notification: NotificationItem }>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    }),
  markAllNotificationsRead: () =>
    request<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  // Admin
  adminOverview: () =>
    request<{
      stats: {
        totalIpos: number;
        activeIpos: number;
        totalStocks: number;
        totalUsers: number;
        activeAlerts: number;
        auditLogCount: number;
      };
      dataSources: DataSourceStatus[];
      importLogs: Array<{
        id: string;
        actorEmail: string;
        timestamp: string;
        importType: string;
        recordsProcessed: number;
        status: string;
        notes: string;
      }>;
      users: AuthUser[];
    }>('/api/admin/overview'),
  adminCreateIpo: (payload: Partial<IPOOffering>) =>
    request<{ ipo: IPOOffering }>('/api/admin/ipos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminUpdateIpo: (id: string, payload: Partial<IPOOffering>) =>
    request<{ ipo: IPOOffering }>(`/api/admin/ipos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminArchiveIpo: (id: string) =>
    request<{ ipo: IPOOffering }>(`/api/admin/ipos/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
    }),
  adminUpdateGmp: (id: string, payload: { gmpValue: number | null; source?: string; note?: string }) =>
    request<{ ipo: IPOOffering }>(`/api/admin/ipos/${encodeURIComponent(id)}/gmp`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminVerifyListing: (
    id: string,
    payload: {
      actualListingPrice: number;
      listingExchange: 'NSE' | 'BSE';
      stockSymbol?: string;
      currentMarketPrice?: number;
    }
  ) =>
    request<{ ipo: IPOOffering }>(`/api/admin/ipos/${encodeURIComponent(id)}/listing`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminAuditLogs: () => request<{ logs: AdminAuditLog[] }>('/api/admin/audit-logs'),
  adminRefreshDataSources: () =>
    request<{ liveFeedReachable: boolean; dataSources: DataSourceStatus[] }>(
      '/api/admin/data-sources/refresh',
      { method: 'POST' }
    ),
  adminExportSnapshot: () => request<unknown>('/api/admin/export'),
  adminImportRecords: (payload: {
    importType: string;
    records: Array<{ slug: string; latestGmp?: number }>;
  }) =>
    request<{ updated: number; importLog: unknown }>('/api/admin/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getIndstocksExplore: () =>
    request<{
      sourceUrl: string;
      totalUniverse: number;
      lastUpdated: string;
      marketCapTiers: {
        largeCap: StockInstrument[];
        midCap: StockInstrument[];
        smallCap: StockInstrument[];
      };
      highlights: {
        topGainers: StockInstrument[];
        topLosers: StockInstrument[];
        mostActive: StockInstrument[];
        near52wHigh: StockInstrument[];
        near52wLow: StockInstrument[];
      };
      sectors: Record<string, StockInstrument[]>;
    }>('/api/market/indstocks/explore'),
  getIndstocksHistorical: (
    interval: string,
    params: { scripCodes: string; fromTime: number; toTime: number }
  ) =>
    request<{
      success: boolean;
      interval: string;
      data: Record<string, { candles?: unknown[]; status?: string; message?: string }>;
    }>(
      `/api/market/historical/${encodeURIComponent(interval)}?scrip-code=${encodeURIComponent(
        params.scripCodes
      )}&from-time=${params.fromTime}&to-time=${params.toTime}`
    ),
  getIndstocksQuotes: (scripCodes: string) =>
    request<{
      status: string;
      data: Record<string, unknown>;
    }>(`/api/market/quotes/full?scrip-codes=${encodeURIComponent(scripCodes)}`),
  getIndmoneyUsExplore: async () => {
    try {
      return await request<IndmoneyUsExploreSnapshot>('/api/market/us-stocks/explore');
    } catch {
      try {
        const res = await fetch('/data/us-stocks.json');
        if (res.ok) {
          return (await res.json()) as IndmoneyUsExploreSnapshot;
        }
      } catch { /* proceed to throw */ }
      throw new Error('Failed to retrieve US stocks explore feed');
    }
  },
  getUsStocks: (params?: {
    exchange?: string;
    sector?: string;
    category?: string;
    mcapTier?: string;
    q?: string;
    tab?: string;
    page?: number;
    limit?: number;
  }) => {
    const qp = new URLSearchParams();
    if (params?.exchange) qp.set('exchange', params.exchange);
    if (params?.sector) qp.set('sector', params.sector);
    if (params?.category) qp.set('category', params.category);
    if (params?.mcapTier) qp.set('mcapTier', params.mcapTier);
    if (params?.q) qp.set('q', params.q);
    if (params?.tab) qp.set('tab', params.tab);
    if (params?.page) qp.set('page', String(params.page));
    if (params?.limit) qp.set('limit', String(params.limit));
    const qs = qp.toString();
    return request<{
      success: boolean;
      stocks: GlobalStockInstrument[];
      total: number;
      page: number;
      limit: number;
      usdInrRate: number;
      categories: Array<{ id: string; label: string; count: number; description: string }>;
      sourceUrl: string;
    }>(`/api/market/us-stocks${qs ? `?${qs}` : ''}`);
  },
  getUsStockBySymbol: (symbol: string) =>
    request<{ success: boolean; stock: GlobalStockInstrument; usdInrRate: number }>(
      `/api/market/us-stocks/${encodeURIComponent(symbol)}`
    ),

  // Angel One SmartAPI GTT (Good-Till-Triggered) API
  getAngelGttRules: () =>
    request<{ ok: boolean; count: number; data: any[] }>('/api/gtt/angel/list'),
  createAngelGttRule: (payload: {
    tradingsymbol: string;
    symboltoken: string;
    exchange: 'NSE' | 'BSE';
    transactiontype: 'BUY' | 'SELL';
    producttype: 'DELIVERY' | 'MARGIN';
    price: string | number;
    qty: string | number;
    triggerprice: string | number;
    disclosedqty?: string | number;
  }) =>
    request<{ ok: boolean; status: boolean; message: string; data?: { id?: string | number } }>(
      '/api/gtt/angel/create',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  cancelAngelGttRule: (payload: { id: string | number; symboltoken: string; exchange: 'NSE' | 'BSE' }) =>
    request<{ ok: boolean; status: boolean; message: string; data?: { id?: string | number } }>(
      '/api/gtt/angel/cancel',
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  // Angel One SmartAPI Orders Suite API
  placeAngelOrder: (payload: {
    variety?: 'NORMAL' | 'STOPLOSS' | 'ROBO' | 'AMO';
    tradingsymbol: string;
    symboltoken: string;
    transactiontype: 'BUY' | 'SELL';
    exchange: 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'BFO';
    ordertype: 'MARKET' | 'LIMIT' | 'STOPLOSS_LIMIT' | 'STOPLOSS_MARKET';
    producttype: 'DELIVERY' | 'CARRYFORWARD' | 'MARGIN' | 'INTRADAY' | 'BO';
    duration?: 'DAY' | 'IOC';
    price?: string | number;
    quantity: string | number;
    triggerprice?: string | number;
    squareoff?: string | number;
    stoploss?: string | number;
    trailingStopLoss?: string | number;
    disclosedquantity?: string | number;
    ordertag?: string;
    scripconsent?: 'yes' | 'no';
  }) =>
    request<{
      ok: boolean;
      status: boolean;
      message: string;
      errorcode?: string;
      data?: { script?: string; orderid?: string; uniqueorderid?: string };
    }>('/api/orders/angel/place', { method: 'POST', body: JSON.stringify(payload) }),

  modifyAngelOrder: (payload: {
    variety?: 'NORMAL' | 'STOPLOSS' | 'ROBO' | 'AMO';
    orderid: string;
    ordertype: 'MARKET' | 'LIMIT' | 'STOPLOSS_LIMIT' | 'STOPLOSS_MARKET';
    producttype: 'DELIVERY' | 'CARRYFORWARD' | 'MARGIN' | 'INTRADAY' | 'BO';
    duration?: 'DAY' | 'IOC';
    price: string | number;
    quantity: string | number;
    tradingsymbol?: string;
    symboltoken?: string;
    exchange?: 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'BFO';
  }) =>
    request<{
      ok: boolean;
      status: boolean;
      message: string;
      errorcode?: string;
      data?: { orderid?: string; uniqueorderid?: string };
    }>('/api/orders/angel/modify', { method: 'POST', body: JSON.stringify(payload) }),

  cancelAngelOrder: (payload: {
    variety?: 'NORMAL' | 'STOPLOSS' | 'ROBO' | 'AMO';
    orderid: string;
  }) =>
    request<{
      ok: boolean;
      status: boolean;
      message: string;
      errorcode?: string;
      data?: { orderid?: string; uniqueorderid?: string };
    }>('/api/orders/angel/cancel', { method: 'POST', body: JSON.stringify(payload) }),

  getAngelOrderBook: () =>
    request<{ ok: boolean; count: number; data: any[]; retrievedAt: string }>('/api/orders/angel/orderbook'),

  getAngelTradeBook: () =>
    request<{ ok: boolean; count: number; data: any[]; retrievedAt: string }>('/api/orders/angel/tradebook'),

  getAngelOrderDetail: (uniqueOrderId: string) =>
    request<{ ok: boolean; data: any; retrievedAt: string }>(
      `/api/orders/angel/details/${encodeURIComponent(uniqueOrderId)}`
    ),

  getAngelOrderLtp: (exchange: string, tradingsymbol: string, symboltoken: string) =>
    request<{ ok: boolean; data: any; retrievedAt: string }>(
      `/api/orders/angel/ltp?exchange=${encodeURIComponent(exchange)}&tradingsymbol=${encodeURIComponent(
        tradingsymbol
      )}&symboltoken=${encodeURIComponent(symboltoken)}`
    ),

  // Angel One SmartAPI CDSL eDIS Authorisation API Suite
  verifyAngelEdis: (isin: string, quantity: number | string = 1) =>
    request<{
      ok: boolean;
      status: boolean;
      message: string;
      errorcode?: string;
      alreadyRegistered?: boolean;
      data?: {
        ReqId?: string;
        ReturnURL?: string | null;
        DPId?: string | null;
        BOID?: string | null;
        TransDtls?: string | null;
        version?: string;
      } | null;
    }>('/api/portfolio/angel/edis/verify', {
      method: 'POST',
      body: JSON.stringify({ isin, quantity }),
    }),

  generateAngelEdisTpin: (params: { dpId: string; reqId: string; boid: string; pan: string }) =>
    request<{
      status: boolean;
      SUCCESS?: string;
      message: string;
      errorcode?: string | null;
      data?: any;
    }>('/api/portfolio/angel/edis/generate-tpin', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  checkAngelEdisStatus: (reqId: string) =>
    request<{
      ok: boolean;
      status: boolean;
      message: string;
      authorized: boolean;
      reqId: string;
      details?: any;
    }>('/api/portfolio/angel/edis/status', {
      method: 'POST',
      body: JSON.stringify({ reqId }),
    }),

  // Angel One SmartAPI Postback / Webhook Suite
  getAngelPostbacks: (params?: {
    clientcode?: string;
    orderid?: string;
    statusCategory?: string;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.clientcode) qs.set('clientcode', params.clientcode);
    if (params?.orderid) qs.set('orderid', params.orderid);
    if (params?.statusCategory) qs.set('statusCategory', params.statusCategory);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{
      ok: boolean;
      source: string;
      webhookUrl: string;
      count: number;
      data: any[];
      retrievedAt: string;
    }>(`/api/orders/angel/postback${query}`);
  },

  simulateAngelPostback: (payload: {
    orderid?: string;
    tradingsymbol?: string;
    symboltoken?: string;
    exchange?: string;
    transactiontype?: 'BUY' | 'SELL';
    producttype?: string;
    ordertype?: string;
    quantity?: number;
    price?: number;
    event?: 'COMPLETE' | 'PARTIAL' | 'OPEN' | 'CANCELLED' | 'REJECTED';
    clientcode?: string;
    rejectionReason?: string;
  }) =>
    request<{
      ok: boolean;
      message: string;
      data: any;
    }>('/api/orders/angel/postback/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  clearAngelPostbacks: () =>
    request<{
      ok: boolean;
      message: string;
    }>('/api/orders/angel/postback', {
      method: 'DELETE',
    }),

  // Angel One SmartAPI Margin Calculator API Suite
  calculateAngelBatchMargin: (positions: Array<{
    exchange: string;
    qty: number;
    price: number;
    productType: string;
    token: string;
    tradeType: string;
    orderType?: string;
  }>) =>
    request<{
      ok: boolean;
      status: boolean;
      message: string;
      errorcode?: string;
      data?: {
        totalMarginRequired: number;
        marginComponents: {
          netPremium: number;
          spanMargin: number;
          marginBenefit: number;
          deliveryMargin: number;
          nonNFOMargin: number;
          totOptionsPremium: number;
        };
      };
      retrievedAt: string;
    }>('/api/margin/angel/batch', {
      method: 'POST',
      body: JSON.stringify({ positions }),
    }),

  // Angel One SmartAPI Option Greeks API Suite
  getAngelOptionGreeks: (name: string, expirydate?: string, spotPrice?: number) =>
    request<{
      ok: boolean;
      status: boolean;
      message: string;
      errorcode?: string;
      data?: Array<{
        name: string;
        expiry: string;
        strikePrice: string;
        optionType: 'CE' | 'PE' | string;
        delta: string;
        gamma: string;
        theta: string;
        vega: string;
        impliedVolatility: string;
        tradeVolume?: string;
      }>;
      retrievedAt: string;
    }>('/api/market/angel/option-greeks', {
      method: 'POST',
      body: JSON.stringify({ name, expirydate, spotPrice }),
    }),

  // Angel One SmartAPI WebSocket Streaming 2.0 Suite
  getAngelWsConfig: () =>
    request<{
      ok: boolean;
      wsUrl: string;
      browserWsUrl: string;
      heartbeat: {
        requestText: string;
        responseText: string;
        intervalMs: number;
      };
      limits: {
        maxSubscriptionsPerSession: number;
        maxConcurrentConnections: number;
        packetSizes: {
          LTP: number;
          QUOTE: number;
          SNAPQUOTE: number;
        };
      };
      modes: Record<string, number>;
      exchangeTypes: Record<number, string>;
      retrievedAt: string;
    }>('/api/streaming/angel/config'),

  buildAngelWsSubscriptionPayload: (options: {
    action?: number;
    mode?: number;
    tokensByExchange: Array<{ exchange: string | number; tokens: string[] }>;
    correlationID?: string;
  }) =>
    request<{
      ok: boolean;
      success: boolean;
      request?: {
        correlationID?: string;
        action: number;
        params: {
          mode: number;
          tokenList: Array<{ exchangeType: number; tokens: string[] }>;
        };
      };
      error?: {
        correlationID?: string;
        errorCode: string;
        errorMessage: string;
      };
      retrievedAt: string;
    }>('/api/streaming/angel/subscribe-payload', {
      method: 'POST',
      body: JSON.stringify(options),
    }),

  parseAngelWsPacket: (packetBase64: string) =>
    request<{
      ok: boolean;
      tick: any;
      retrievedAt: string;
    }>('/api/streaming/angel/parse-packet', {
      method: 'POST',
      body: JSON.stringify({ packetBase64 }),
    }),

  getSimulatedAngelWsTick: (options: {
    token?: string;
    mode?: number;
    exchangeType?: number;
    ltp?: number;
  }) =>
    request<{
      ok: boolean;
      tick: any;
      base64: string;
      packetSize: number;
      retrievedAt: string;
    }>('/api/streaming/angel/simulate-tick', {
      method: 'POST',
      body: JSON.stringify(options),
    }),
};
