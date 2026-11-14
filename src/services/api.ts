import type {
  AdminAuditLog,
  AuthUser,
  BlogArticle,
  DataSourceStatus,
  IPOOffering,
  MarketIndexInstrument,
  MarketInsight,
  NotificationItem,
  PriceAlertRule,
  StockInstrument,
  WatchlistEntry,
} from '../types/financial';
import {
  SEED_INDICES,
  SEED_IPOS,
  SEED_STOCKS,
  SEED_INSIGHTS,
  SEED_BLOG_ARTICLES,
} from '../../server/data/seedData';

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

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(resolveApiUrl(url), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

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

export const api = {
  getIndices: async (refresh = false) => {
    try {
      return await request<{ indices: MarketIndexInstrument[]; liveFeedReachable: boolean; retrievedAt: string }>(
        `/api/market/indices${refresh ? '?refresh=1' : ''}`
      );
    } catch (err) {
      return {
        indices: SEED_INDICES,
        liveFeedReachable: false,
        retrievedAt: new Date().toISOString(),
      };
    }
  },

  getIpos: async (params?: { category?: string; status?: string; q?: string; includeArchived?: boolean }) => {
    try {
      const sp = new URLSearchParams();
      if (params?.category) sp.set('category', params.category);
      if (params?.status) sp.set('status', params.status);
      if (params?.q) sp.set('q', params.q);
      if (params?.includeArchived) sp.set('includeArchived', '1');
      const qs = sp.toString();
      return await request<{ ipos: IPOOffering[]; total: number }>(`/api/ipos${qs ? `?${qs}` : ''}`);
    } catch {
      let filtered = [...SEED_IPOS];
      if (params?.category && params.category !== 'All') {
        filtered = filtered.filter((i) => i.category.toLowerCase() === params.category!.toLowerCase());
      }
      if (params?.status && params.status !== 'All') {
        filtered = filtered.filter((i) => i.status.toLowerCase() === params.status!.toLowerCase());
      }
      if (params?.q) {
        const query = params.q.toLowerCase();
        filtered = filtered.filter((i) =>
          i.companyName.toLowerCase().includes(query) ||
          i.shortName.toLowerCase().includes(query) ||
          i.slug.toLowerCase().includes(query)
        );
      }
      return { ipos: filtered, total: filtered.length };
    }
  },

  getIpoBySlug: async (slug: string) => {
    try {
      return await request<{ ipo: IPOOffering }>(`/api/ipos/${encodeURIComponent(slug)}`);
    } catch {
      const found = SEED_IPOS.find((i) =>
        i.slug.toLowerCase() === slug.toLowerCase() ||
        i.shortName.toLowerCase() === slug.toLowerCase()
      );
      if (found) return { ipo: found };
      throw new ApiError(`IPO offering "${slug}" not found.`, 404);
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
    try {
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
      let stocks = [...SEED_STOCKS];
      const sectors = Array.from(new Set(stocks.map((s) => s.sector))).filter(Boolean).sort();
      if (params?.exchange && params.exchange !== 'All') {
        stocks = stocks.filter((s) => s.exchange === params.exchange || s.exchange === 'NSE/BSE');
      }
      if (params?.sector && params.sector !== 'All') {
        stocks = stocks.filter((s) => s.sector.toLowerCase() === params.sector!.toLowerCase());
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
        stocks = stocks.filter((s) =>
          s.companyName.toLowerCase().includes(query) ||
          s.symbol.toLowerCase().includes(query)
        );
      }
      const calcPct = (s: StockInstrument) =>
        s.currentPrice && s.previousClose ? ((s.currentPrice - s.previousClose) / s.previousClose) * 100 : 0;

      if (params?.tab === 'gainers') {
        stocks = stocks.filter((s) => calcPct(s) > 0).sort((a, b) => calcPct(b) - calcPct(a));
      } else if (params?.tab === 'losers') {
        stocks = stocks.filter((s) => calcPct(s) < 0).sort((a, b) => calcPct(a) - calcPct(b));
      }
      const totalUniverse = SEED_STOCKS.length;
      const limit = params?.limit || stocks.length;
      const page = params?.page || 1;
      const paginated = stocks.slice((page - 1) * limit, page * limit);
      return {
        stocks: paginated,
        total: stocks.length,
        totalUniverse,
        nseCount: SEED_STOCKS.filter((s) => s.exchange === 'NSE' || s.exchange === 'NSE/BSE').length,
        bseCount: SEED_STOCKS.filter((s) => s.exchange === 'BSE' || s.exchange === 'NSE/BSE').length,
        sectors,
        liveFeedReachable: false,
        liveSyncedAt: new Date().toISOString(),
      };
    }
  },

  getStockBySymbol: async (symbol: string, range = '3mo') => {
    try {
      return await request<{ stock: StockInstrument; fromUpstream: boolean; linkedIpo: IPOOffering | null }>(
        `/api/stocks/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}`
      );
    } catch {
      const found = SEED_STOCKS.find((s) => s.symbol.toLowerCase() === symbol.toLowerCase());
      if (found) {
        const linkedIpo = SEED_IPOS.find((i) =>
          i.shortName.toLowerCase() === symbol.toLowerCase() ||
          i.slug.toLowerCase().includes(symbol.toLowerCase())
        ) || null;
        return { stock: found, fromUpstream: false, linkedIpo };
      }
      throw new ApiError(`Stock symbol "${symbol}" not found.`, 404);
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
      const query = q.toLowerCase();
      const ipos = SEED_IPOS.filter((i) =>
        i.companyName.toLowerCase().includes(query) ||
        i.shortName.toLowerCase().includes(query) ||
        i.slug.toLowerCase().includes(query)
      );
      const stocks = SEED_STOCKS.filter((s) =>
        s.companyName.toLowerCase().includes(query) ||
        s.symbol.toLowerCase().includes(query)
      );
      const blogs = SEED_BLOG_ARTICLES.filter((b) => b.title.toLowerCase().includes(query));
      const insights = SEED_INSIGHTS.filter((ins) => ins.title.toLowerCase().includes(query));
      return { ipos, stocks, blogs, insights, sectors: [] };
    }
  },

  getInsights: async () => {
    try {
      return await request<{ insights: MarketInsight[] }>('/api/insights');
    } catch (err) {
      return { insights: SEED_INSIGHTS };
    }
  },

  getInsightBySlug: async (slug: string) => {
    try {
      return await request<{ insight: MarketInsight }>(`/api/insights/${encodeURIComponent(slug)}`);
    } catch (err) {
      const insight = SEED_INSIGHTS.find((i) => i.slug === slug);
      if (insight) return { insight };
      throw err;
    }
  },

  getBlogs: async () => {
    try {
      return await request<{ articles: BlogArticle[] }>('/api/blogs');
    } catch (err) {
      return { articles: SEED_BLOG_ARTICLES };
    }
  },

  getBlogBySlug: async (slug: string) => {
    try {
      return await request<{ article: BlogArticle; related: BlogArticle[] }>(`/api/blogs/${encodeURIComponent(slug)}`);
    } catch (err) {
      const article = SEED_BLOG_ARTICLES.find((b) => b.slug === slug);
      if (article) {
        const related = SEED_BLOG_ARTICLES.filter((b) => b.slug !== slug).slice(0, 3);
        return { article, related };
      }
      throw err;
    }
  },

  getPublicConfig: () =>
    request<{ adsenseClientId: string | null; appUrl: string | null }>('/api/public-config'),

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
        marketSession: 'PRE_OPEN' as const,
        istTimeLabel: 'IST Baseline Mode',
        liveClients: 1,
        pollIntervalsSec: { indices: 10, equitiesAndAlerts: 15, iposAndGmp: 60 },
        cycles: { indices: 1, equities: 1, ipos: 1, alertsEvaluated: 0, alertsTriggeredTotal: 0 },
        lastRunAt: { indices: new Date().toISOString(), equities: new Date().toISOString(), ipos: new Date().toISOString(), alerts: null },
        lastError: null,
      };
    }
  },

  submitContact: (payload: { name: string; email: string; topic: string; message: string }) =>
    request<{ ticketId: string; receivedAt: string; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Auth
  me: () => request<{ user: AuthUser | null }>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  updatePreferences: (payload: { name?: string; preferences?: Partial<AuthUser['preferences']> }) =>
    request<{ user: AuthUser }>('/api/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

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
};
