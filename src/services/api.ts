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

export const api = {
  getIndices: (refresh = false) =>
    request<{ indices: MarketIndexInstrument[]; liveFeedReachable: boolean; retrievedAt: string }>(
      `/api/market/indices${refresh ? '?refresh=1' : ''}`
    ),

  getIpos: (params?: { category?: string; status?: string; q?: string; includeArchived?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.category) sp.set('category', params.category);
    if (params?.status) sp.set('status', params.status);
    if (params?.q) sp.set('q', params.q);
    if (params?.includeArchived) sp.set('includeArchived', '1');
    const qs = sp.toString();
    return request<{ ipos: IPOOffering[]; total: number }>(`/api/ipos${qs ? `?${qs}` : ''}`);
  },

  getIpoBySlug: (slug: string) =>
    request<{ ipo: IPOOffering }>(`/api/ipos/${encodeURIComponent(slug)}`),

  getStocks: (params?: {
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
    return request<{
      stocks: StockInstrument[];
      total: number;
      totalUniverse: number;
      nseCount: number;
      bseCount: number;
      sectors: string[];
      liveFeedReachable: boolean;
      liveSyncedAt: string | null;
    }>(`/api/stocks${qs ? `?${qs}` : ''}`);
  },

  getStockBySymbol: (symbol: string, range = '3mo') =>
    request<{ stock: StockInstrument; fromUpstream: boolean; linkedIpo: IPOOffering | null }>(
      `/api/stocks/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}`
    ),

  globalSearch: (q: string) =>
    request<{
      ipos: IPOOffering[];
      stocks: StockInstrument[];
      blogs: BlogArticle[];
      insights: MarketInsight[];
      sectors: string[];
    }>(`/api/search?q=${encodeURIComponent(q)}`),

  getInsights: () => request<{ insights: MarketInsight[] }>('/api/insights'),
  getInsightBySlug: (slug: string) =>
    request<{ insight: MarketInsight }>(`/api/insights/${encodeURIComponent(slug)}`),

  getBlogs: () => request<{ articles: BlogArticle[] }>('/api/blogs'),
  getBlogBySlug: (slug: string) =>
    request<{ article: BlogArticle; related: BlogArticle[] }>(`/api/blogs/${encodeURIComponent(slug)}`),

  getPublicConfig: () =>
    request<{ adsenseClientId: string | null; appUrl: string | null }>('/api/public-config'),

  getAutomationStatus: () =>
    request<{
      running: boolean;
      startedAt: string | null;
      marketSession: 'PRE_OPEN' | 'MARKET_OPEN' | 'POST_CLOSE' | 'WEEKEND';
      istTimeLabel: string;
      liveClients: number;
      pollIntervalsSec: { indices: number; equitiesAndAlerts: number; iposAndGmp: number };
      cycles: { indices: number; equities: number; ipos: number; alertsEvaluated: number; alertsTriggeredTotal: number };
      lastRunAt: { indices: string | null; equities: string | null; ipos: string | null; alerts: string | null };
      lastError: string | null;
    }>('/api/automation/status'),

  submitContact: (payload: { name: string; email: string; topic: string; message: string }) =>
    request<{ ticketId: string; receivedAt: string; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Auth
  me: async () => {
    const res = await request<{ user: AuthUser | null; token?: string }>('/api/auth/me');
    if (res.user && res.token && !getAuthToken()) {
      setAuthToken(res.token);
    } else if (!res.user && getAuthToken()) {
      setAuthToken(null);
    }
    return res;
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
