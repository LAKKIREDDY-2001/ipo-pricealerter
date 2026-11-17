import { handleD1Api, syncMarketSnapshotToD1, type D1Env } from "../lib/d1-api";

type Snapshot = {
  stocks?: any[];
  allLiveStocks?: any[];
  ipos?: any[];
  indices?: any[];
  insights?: any[];
  blogs?: any[];
  benchmarks?: Record<string, any>;
  liveGmps?: any[];
  trackedIpos?: any[];
  recentIpos?: any[];
  lastSyncTime?: string;
  lastSyncFormatted?: string;
  generatedAt?: string;
};

let snapshotCache: { expiresAt: number; value: Snapshot } | null = null;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

const unavailable = (feature: string) =>
  json(
    {
      ok: false,
      error: `${feature} requires a persistent backend database. This Cloudflare Pages deployment currently serves read-only market data.`,
      code: "PERSISTENT_BACKEND_NOT_CONFIGURED",
    },
    503,
  );

async function loadSnapshot(request: Request, assets: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> }): Promise<Snapshot> {
  if (snapshotCache && snapshotCache.expiresAt > Date.now()) {
    return snapshotCache.value;
  }

  const assetUrl = new URL("/data/live-market-data.json", request.url);
  const response = await assets.fetch(new Request(assetUrl.toString(), {
    headers: { accept: "application/json" },
  }));

  if (!response.ok) {
    throw new Error(`Market snapshot request failed (${response.status})`);
  }

  const data = (await response.json()) as Snapshot;
  if (!data || typeof data !== "object") {
    throw new Error("Market snapshot has an invalid JSON shape");
  }
  snapshotCache = { value: data, expiresAt: Date.now() + 30_000 };
  return data;
}


type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: Record<string, any>;
      timestamp?: number[];
      indicators?: { quote?: Array<{ open?: Array<number | null>; high?: Array<number | null>; low?: Array<number | null>; close?: Array<number | null>; volume?: Array<number | null> }> };
    }>;
  };
};
const quoteCache = new Map<string, { expiresAt: number; quote: any }>();
const historyCache = new Map<string, { expiresAt: number; history: any[] }>();
const macroCache: { expiresAt: number; data: any } = { expiresAt: 0, data: null };

async function fetchYahooTickerQuote(ticker: string): Promise<any | null> {
  const cached = quoteCache.get(ticker);
  if (cached && cached.expiresAt > Date.now()) return cached.quote;
  try {
    const endpoint = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
    endpoint.searchParams.set("range", "1d");
    endpoint.searchParams.set("interval", "5m");
    const response = await fetch(endpoint.toString(), {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 PriceAlerter/1.0" },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as YahooChart;
    const result = payload.chart?.result?.[0];
    const meta = result?.meta;
    const price = Number(meta?.regularMarketPrice);
    if (!meta || !Number.isFinite(price) || price <= 0) return null;
    const previous = Number(meta.chartPreviousClose ?? meta.previousClose ?? 0);
    const closes = (result?.indicators?.quote?.[0]?.close || []).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const quote = {
      currentPrice: price,
      previousClose: previous > 0 ? previous : null,
      dayChange: previous > 0 ? Number((price - previous).toFixed(2)) : null,
      dayChangePercent: previous > 0 ? Number((((price - previous) / previous) * 100).toFixed(2)) : null,
      open: typeof meta.regularMarketOpen === "number" ? meta.regularMarketOpen : null,
      dayHigh: typeof meta.regularMarketDayHigh === "number" ? meta.regularMarketDayHigh : null,
      dayLow: typeof meta.regularMarketDayLow === "number" ? meta.regularMarketDayLow : null,
      week52High: typeof meta.fiftyTwoWeekHigh === "number" ? meta.fiftyTwoWeekHigh : null,
      week52Low: typeof meta.fiftyTwoWeekLow === "number" ? meta.fiftyTwoWeekLow : null,
      volume: typeof meta.regularMarketVolume === "number" ? meta.regularMarketVolume : null,
      sparkline: closes.slice(-24),
      lastTradeTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
      quoteSource: "Yahoo Finance",
      quoteStatus: "third-party-delayed-or-latest-available",
      quoteCurrency: meta.currency || "INR",
      quoteSymbol: ticker,
    };
    quoteCache.set(ticker, { quote, expiresAt: Date.now() + 30_000 });
    return quote;
  } catch {
    return null;
  }
}

async function fetchYahooQuote(stock: any): Promise<any | null> {
  const symbol = String(stock.yahooSymbol || stock.symbol || "").trim();
  if (!symbol) return null;
  const candidates = symbol.includes(".") || symbol.startsWith("^") || symbol.includes("=") || symbol.endsWith("=F")
    ? [symbol]
    : [`${symbol}.NS`, `${symbol}.BO`];
  for (const ticker of candidates) {
    const quote = await fetchYahooTickerQuote(ticker);
    if (quote) return quote;
  }
  return null;
}

async function fetchYahooHistory(stock: any, requestedRange: string): Promise<any[]> {
  const symbol = String(stock.yahooSymbol || stock.symbol || "").trim();
  if (!symbol) return [];
  const ticker = symbol.includes(".") || symbol.startsWith("^") ? symbol : `${symbol}.NS`;
  const range = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y"].includes(requestedRange) ? requestedRange : "3mo";
  const cacheKey = `${ticker}:${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.history;
  const interval = range === "1d" ? "5m" : range === "5d" ? "15m" : range === "5y" ? "1wk" : "1d";
  try {
    const endpoint = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
    endpoint.searchParams.set("range", range);
    endpoint.searchParams.set("interval", interval);
    const response = await fetch(endpoint.toString(), {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 PriceAlerter/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const result = ((await response.json()) as YahooChart).chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const quote = result?.indicators?.quote?.[0];
    if (!quote) return [];
    const history = timestamps.map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString(),
      open: quote.open?.[index] ?? null,
      high: quote.high?.[index] ?? null,
      low: quote.low?.[index] ?? null,
      close: quote.close?.[index] ?? null,
      volume: quote.volume?.[index] ?? null,
    })).filter((point) => typeof point.close === "number" && Number.isFinite(point.close));
    historyCache.set(cacheKey, { history, expiresAt: Date.now() + 60_000 });
    return history;
  } catch {
    return [];
  }
}

function normalizeStockDetail(stock: any) {
  return {
    ...stock,
    bseCode: stock.bseCode || "",
    sparkline: Array.isArray(stock.sparkline) ? stock.sparkline.filter((v: unknown) => typeof v === "number" && Number.isFinite(v)) : [],
    historicalSeries: Array.isArray(stock.historicalSeries) ? stock.historicalSeries : [],
    announcements: Array.isArray(stock.announcements) ? stock.announcements : [],
    fundamentals: {
      pe: null, pb: null, roePct: null, rocePct: null, debtToEquity: null,
      revenueGrowthPct: null, profitGrowthPct: null, dividendYieldPct: null,
      reportingPeriod: "Latest available", source: "Company filings / exchange data",
      ...(stock.fundamentals || {}),
    },
    provenance: {
      source: stock.provenance?.source || stock.dataSource || "Published snapshot",
      retrievedAt: stock.provenance?.retrievedAt || stock.lastTradeTime || null,
      effectiveDate: stock.provenance?.effectiveDate || null,
      verificationStatus: stock.provenance?.verificationStatus || "Unverified",
      qualityStatus: stock.provenance?.qualityStatus || "UNAVAILABLE",
      currency: stock.provenance?.currency || "INR",
      unit: stock.provenance?.unit || "INR",
      dataCategory: stock.provenance?.dataCategory || "Equities",
    },
  };
}

const growwCompanyCache = new Map<string, { expiresAt: number; data: any }>();

function parseGrowwNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!cleaned) return null;
  const parsed = Number(cleaned[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchGrowwCompanyInfo(stock: any): Promise<any | null> {
  let searchId = String(stock.searchId || "").trim();
  if (!searchId) {
    const symbol = String(stock.symbol || "").trim();
    if (!symbol) return null;
    try {
      const searchUrl = new URL("https://groww.in/v1/api/search/v3/query/global/st_p_query");
      searchUrl.searchParams.set("page", "0");
      searchUrl.searchParams.set("query", symbol);
      searchUrl.searchParams.set("size", "10");
      searchUrl.searchParams.set("web", "true");
      const searchResponse = await fetch(searchUrl.toString(), {
        headers: { accept: "application/json", "user-agent": "Mozilla/5.0 PriceAlerter/1.0" },
        signal: AbortSignal.timeout(3500),
      });
      if (!searchResponse.ok) return null;
      const searchData = await searchResponse.json() as any;
      const matches = searchData?.data?.content || [];
      const exact = matches.find((item: any) =>
        item.entity_type === "Stocks" && (
          String(item.nse_scrip_code || "").toUpperCase() === symbol.toUpperCase() ||
          String(item.bse_scrip_code || "").toUpperCase() === symbol.toUpperCase() ||
          String(item.bse_scrip_code || "").toUpperCase() === String(stock.bseCode || "").toUpperCase()
        )
      );
      searchId = String(exact?.search_id || "");
    } catch {
      return null;
    }
  }
  if (!searchId) return null;
  const cached = growwCompanyCache.get(searchId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  try {
    const endpoint = `https://groww.in/v1/api/stocks_data/v1/company/search_id/${encodeURIComponent(searchId)}?page=0&size=10`;
    const response = await fetch(endpoint, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 PriceAlerter/1.0" },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    if (!data || typeof data !== "object") return null;
    growwCompanyCache.set(searchId, { data, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
    return data;
  } catch {
    return null;
  }
}

function mergeGrowwCompanyDetails(stock: any, info: any) {
  if (!info) return stock;
  const values = new Map<string, string>();
  for (const item of info.fundamentals || []) {
    if (item?.shortName && item?.value) values.set(String(item.shortName).toLowerCase(), String(item.value));
    if (item?.name && item?.value) values.set(String(item.name).toLowerCase(), String(item.value));
  }
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const value = values.get(key.toLowerCase());
      if (value) return parseGrowwNumber(value);
    }
    return null;
  };
  const parseRows = (rows: any[], basis: string) => {
    if (!Array.isArray(rows) || !rows.length) return null;
    const row = (name: string) => rows.find((item: any) => String(item.title || "").toLowerCase() === name.toLowerCase());
    const series = (obj: any) => obj && typeof obj === "object"
      ? Object.entries(obj).map(([period, value]) => ({ period, valueCr: parseGrowwNumber(value) })).filter((x) => x.valueCr !== null)
      : [];
    return {
      basis,
      revenueYearly: series(row("Revenue")?.yearly),
      profitYearly: series(row("Profit")?.yearly),
      netWorthYearly: series(row("Net Worth")?.yearly),
      revenueQuarterly: series(row("Revenue")?.quarterly),
      profitQuarterly: series(row("Profit")?.quarterly),
    };
  };
  const financialStatements = [
    parseRows(info.financialStatementV2?.CONSOLIDATED, "CONSOLIDATED"),
    parseRows(info.financialStatementV2?.STANDALONE, "STANDALONE"),
  ].filter(Boolean);
  const shareholding = info.shareholdingPatternV2?.data
    ? Object.entries(info.shareholdingPatternV2.data).map(([quarter, raw]: [string, any]) => ({
        quarter,
        promoters: parseGrowwNumber(raw?.promoters),
        fii: parseGrowwNumber(raw?.fii),
        dii: parseGrowwNumber(raw?.dii),
        public: parseGrowwNumber(raw?.public),
        others: parseGrowwNumber(raw?.others),
      }))
    : [];
  const peers = Array.isArray(info.similarAssets?.peerList)
    ? info.similarAssets.peerList.slice(0, 8).map((peer: any) => ({
        symbol: peer.companyHeader?.nseScriptCode || String(peer.companyHeader?.bseScriptCode || ""),
        companyName: peer.companyHeader?.displayName || peer.companyHeader?.nseScriptCode || "Peer company",
        marketCapCr: parseGrowwNumber(peer.marketCap),
        pe: parseGrowwNumber(peer.peRatio),
        pb: parseGrowwNumber(peer.pbRatio),
        yearHigh: parseGrowwNumber(peer.nseYearHigh ?? peer.bseYearHigh),
        yearLow: parseGrowwNumber(peer.nseYearLow ?? peer.bseYearLow),
      })).filter((peer: any) => peer.symbol)
    : [];
  const header = info.header || {};
  const details = info.details || {};
  const profile = {
    ceo: details.ceo || stock.companyProfile?.ceo || null,
    managingDirector: details.managingDirector || stock.companyProfile?.managingDirector || null,
    foundedYear: details.foundedYear || stock.companyProfile?.foundedYear || null,
    businessSummary: details.businessSummary || stock.companyProfile?.businessSummary || null,
    epsTtm: get("eps(ttm)", "eps") ?? stock.companyProfile?.epsTtm ?? null,
    bookValue: get("book value") ?? stock.companyProfile?.bookValue ?? null,
    industryPe: get("industry p/e") ?? stock.companyProfile?.industryPe ?? null,
    faceValue: get("face value") ?? stock.companyProfile?.faceValue ?? null,
  };
  const fundamentals = {
    ...(stock.fundamentals || {}),
    pe: get("p/e ratio(ttm)") ?? stock.fundamentals?.pe ?? null,
    pb: get("p/b ratio") ?? stock.fundamentals?.pb ?? null,
    roePct: get("roe") ?? stock.fundamentals?.roePct ?? null,
    rocePct: get("roce") ?? stock.fundamentals?.rocePct ?? null,
    debtToEquity: get("debt to equity") ?? stock.fundamentals?.debtToEquity ?? null,
    revenueGrowthPct: get("revenue growth") ?? stock.fundamentals?.revenueGrowthPct ?? null,
    profitGrowthPct: get("profit growth") ?? stock.fundamentals?.profitGrowthPct ?? null,
    dividendYieldPct: get("div yield", "dividend yield") ?? stock.fundamentals?.dividendYieldPct ?? null,
    reportingPeriod: "Latest available Groww company data",
    source: "Groww company profile / filings",
  };
  return {
    ...stock,
    companyName: header.displayName || stock.companyName,
    marketCapCr: get("mkt cap", "market cap") ?? stock.marketCapCr,
    sector: header.industryName || stock.sector,
    industry: header.industryName || stock.industry,
    logoUrl: header.logoUrl || stock.logoUrl,
    searchId: header.searchId || stock.searchId,
    week52High: parseGrowwNumber(info.priceData?.nse?.yearHighPrice ?? info.priceData?.bse?.yearHighPrice) ?? stock.week52High,
    week52Low: parseGrowwNumber(info.priceData?.nse?.yearLowPrice ?? info.priceData?.bse?.yearLowPrice) ?? stock.week52Low,
    companyProfile: { ...(stock.companyProfile || {}), ...profile },
    fundamentals,
    registry: { ...(stock.registry || {}), faceValue: profile.faceValue ?? stock.registry?.faceValue ?? null, isFnoEnabled: Boolean(header.isFnoEnabled || header.isNseFnoEnabled || stock.registry?.isFnoEnabled) },
    shareholding: shareholding.length ? shareholding : (stock.shareholding || []),
    financialStatements: financialStatements.length ? financialStatements : (stock.financialStatements || []),
    peers: peers.length ? peers : (stock.peers || []),
    dataSourcesUsed: [...new Set([...(stock.dataSourcesUsed || []), "Groww company profile / filings"])],
  };
}

async function enrichQuotes(stocks: any[]): Promise<{ stocks: any[]; successful: number }> {
  // Keep the number of upstream requests bounded for Cloudflare Pages.
  // Quotes for other symbols remain explicitly marked as snapshot values.
  const MAX_QUOTE_LOOKUPS = 20;
  const CONCURRENCY = 4;
  const result = [...stocks];
  let successful = 0;
  let next = 0;
  async function worker() {
    while (next < Math.min(stocks.length, MAX_QUOTE_LOOKUPS)) {
      const index = next++;
      const stock = stocks[index];
      const quote = await fetchYahooQuote(stock);
      if (!quote) continue;
      successful++;
      result[index] = {
        ...stock,
        ...quote,
        provenance: {
          ...(stock.provenance || {}),
          source: quote.quoteSource,
          retrievedAt: quote.lastTradeTime,
          verificationStatus: "Third-party quote; may be delayed",
          qualityStatus: "UNOFFICIAL_DELAYED_OR_LATEST",
          currency: quote.quoteCurrency,
        },
      };
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, stocks.length, MAX_QUOTE_LOOKUPS) }, () => worker()));
  return { stocks: result, successful };
}

function normalizeStocks(snapshot: Snapshot): any[] {
  const base = Array.isArray(snapshot.stocks) ? [...snapshot.stocks] : [];
  const seen = new Set(base.map((s) => String(s.symbol || "").toUpperCase()));
  for (const item of snapshot.allLiveStocks || []) {
    const symbol = String(item.symbol || "").toUpperCase();
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    const price = Number(item.rawPrice ?? item.price ?? 0);
    const change = item.rawChange == null ? null : Number(item.rawChange);
    base.push({
      id: `snapshot-${symbol}`,
      symbol,
      bseCode: item.bseCode || null,
      searchId: item.searchId || null,
      companyName: item.name || symbol,
      exchange: item.bseCode ? "NSE/BSE" : "NSE",
      sector: item.category === "RECENT_IPO" ? "IPO Debut" : "Equities",
      industry: item.category === "RECENT_IPO" ? "Recent Listings" : "Equities",
      currentPrice: price,
      previousClose: change == null ? null : Number((price - change).toFixed(2)),
      dayChange: change,
      dayChangePercent: item.rawChangePercent ?? null,
      volume: item.volume ?? null,
      marketCapCr: item.marketCapCr ?? null,
      dataSource: item.source || "published-market-snapshot",
    });
  }
  return base;
}

function filterAndPageStocks(all: any[], url: URL) {
  let rows = [...all];
  const exchange = url.searchParams.get("exchange");
  const sector = url.searchParams.get("sector");
  const tier = url.searchParams.get("mcapTier");
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  const tab = url.searchParams.get("tab");

  if (exchange && exchange !== "All") {
    rows = rows.filter((s) => s.exchange === exchange || s.exchange === "NSE/BSE");
  }
  if (sector && sector !== "All") {
    rows = rows.filter((s) => String(s.sector || "").toLowerCase() === sector.toLowerCase());
  }
  if (tier && tier !== "All") {
    rows = rows.filter((s) => {
      const cap = Number(s.marketCapCr || 0);
      if (tier === "Large") return cap >= 20_000;
      if (tier === "Mid") return cap >= 5_000 && cap < 20_000;
      if (tier === "Small") return cap < 5_000;
      return true;
    });
  }
  if (query) {
    rows = rows.filter((s) =>
      [s.symbol, s.companyName, s.name, s.bseCode]
        .some((v) => String(v || "").toLowerCase().includes(query)),
    );
  }
  const changePct = (s: any) => {
    const explicit = Number(s.dayChangePercent ?? s.changePercent);
    if (Number.isFinite(explicit)) return explicit;
    const current = Number(s.currentPrice);
    const previous = Number(s.previousClose);
    return current > 0 && previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };
  if (tab === "gainers") rows = rows.filter((s) => changePct(s) > 0).sort((a, b) => changePct(b) - changePct(a));
  if (tab === "losers") rows = rows.filter((s) => changePct(s) < 0).sort((a, b) => changePct(a) - changePct(b));
  if (tab === "active") rows.sort((a, b) => Number(b.volume || 0) - Number(a.volume || 0));

  const sortBy = url.searchParams.get("sortBy");
  const sortDir = url.searchParams.get("sortDir") === "asc" ? 1 : -1;
  if (sortBy && !["gainers", "losers", "active"].includes(tab || "")) {
    rows.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === "string" || typeof bv === "string") {
        return String(av || "").localeCompare(String(bv || "")) * sortDir;
      }
      return (Number(av || 0) - Number(bv || 0)) * sortDir;
    });
  }

  const total = rows.length;
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 50)));
  const allStocks = normalizeExchangeCounts(all);
  return {
    stocks: rows.slice((page - 1) * limit, page * limit),
    total,
    totalUniverse: all.length,
    nseCount: allStocks.nseCount,
    bseCount: allStocks.bseCount,
    sectors: [...new Set(all.map((s) => s.sector).filter(Boolean))].sort(),
    liveFeedReachable: false,
    dataSource: "published-market-snapshot",
    liveSyncedAt: snapshotTimestamp(all) || null,
  };
}

function normalizeExchangeCounts(stocks: any[]) {
  return {
    nseCount: stocks.filter((s) => s.exchange === "NSE" || s.exchange === "NSE/BSE").length,
    bseCount: stocks.filter((s) => s.exchange === "BSE" || s.exchange === "NSE/BSE").length,
  };
}

function snapshotTimestamp(stocks: any[]) {
  return stocks.find((s) => s.updatedAt || s.lastUpdated)?.updatedAt ||
    stocks.find((s) => s.updatedAt || s.lastUpdated)?.lastUpdated || null;
}

function filterIpos(snapshot: Snapshot, url: URL) {
  let ipos = Array.isArray(snapshot.ipos) ? [...snapshot.ipos] : [];
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  if (category && category !== "All") ipos = ipos.filter((i) => i.category === category);
  if (status && status !== "All") ipos = ipos.filter((i) => String(i.status || "").toLowerCase() === status.toLowerCase());
  if (query) ipos = ipos.filter((i) => String(i.companyName || "").toLowerCase().includes(query));
  return { ipos, total: ipos.length, dataSource: "published-market-snapshot" };
}

export async function onRequest(context: {
  request: Request;
  params: { path?: string | string[] };
  env: D1Env & { ASSETS: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> } };
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/api";
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": url.origin,
        "access-control-allow-methods": "GET, HEAD, POST, PATCH, PUT, DELETE, OPTIONS",
        "access-control-allow-headers": "Content-Type, Authorization",
        "access-control-max-age": "86400",
      },
    });
  }
  if (pathname === "/api/admin/sync-snapshot" && method === "POST") {
    try {
      const snapshot = await loadSnapshot(request, env.ASSETS);
      return await syncMarketSnapshotToD1(request, env, snapshot, normalizeStocks(snapshot));
    } catch (error) {
      return json({ ok: false, error: error instanceof Error ? error.message : "Snapshot sync failed" }, 500);
    }
  }

  try {
    const d1Response = await handleD1Api(request, url, env);
    if (d1Response) return d1Response;
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : "Database API execution error",
      code: "D1_API_EXECUTION_ERROR",
    }, 500);
  }

  if (method !== "GET" && method !== "HEAD") {
    return unavailable("Write operations, accounts, watchlists and alerts");
  }

  if (pathname === "/api/health") {
    try {
      const snapshot = await loadSnapshot(request, env.ASSETS);
      return json({
        status: "ok",
        platform: "PriceAlerter",
        runtime: "cloudflare-pages-functions",
        backendMode: "Pages Functions with snapshot IPO data and on-demand quotes",
        persistentDatabaseConfigured: Boolean(env.DB),
        liveQuoteProvider: "Yahoo Finance (best effort, may be delayed)",
        ipoProvider: "build-time snapshot",
        counts: {
          stocks: normalizeStocks(snapshot).length,
          ipos: snapshot.ipos?.length || 0,
          indices: snapshot.indices?.length || 0,
          blogs: snapshot.blogs?.length || 0,
        },
        snapshotTimestamp: snapshot.lastSyncTime || snapshot.generatedAt || null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return json({ status: "degraded", error: error instanceof Error ? error.message : "Snapshot unavailable" }, 503);
    }
  }

  if (pathname === "/api/auth/me") return json({ user: null });
  if (pathname === "/api/auth/logout") return json({ ok: true });
  if (pathname === "/api/stream/market") return new Response(null, { status: 204 });

  try {
    const snapshot = await loadSnapshot(request, env.ASSETS);

    if (pathname === "/api/market/indices") {
      const baseIndices = Array.isArray(snapshot.indices) ? snapshot.indices : [];
      const refreshed = await Promise.all(baseIndices.map(async (item: any, index: number) => {
        if (index >= 5) return item;
        const label = `${item.symbol || ""} ${item.name || ""}`.toUpperCase();
        const ticker = item.yahooSymbol || (label.includes("SENSEX") ? "^BSESN" : label.includes("BANK NIFTY") ? "^NSEBANK" : label.includes("NIFTY 50") || label.includes("NIFTY50") ? "^NSEI" : "");
        if (!ticker) return item;
        const quote = await fetchYahooTickerQuote(ticker);
        if (!quote) return item;
        return {
          ...item,
          value: quote.currentPrice,
          previousClose: quote.previousClose,
          change: quote.dayChange,
          changePercent: quote.dayChangePercent,
          provenance: {
            ...(item.provenance || {}),
            source: quote.quoteSource,
            retrievedAt: quote.lastTradeTime,
            qualityStatus: "UNOFFICIAL_DELAYED_OR_LATEST",
            verificationStatus: "Third-party quote; may be delayed",
            currency: "PTS",
          },
        };
      }));
      const liveCount = refreshed.filter((item: any, index: number) => item !== baseIndices[index]).length;
      return json({
        indices: refreshed,
        liveFeedReachable: liveCount > 0,
        quotesUpdated: liveCount,
        dataSource: liveCount ? "Yahoo Finance (delayed or latest available)" : "published-market-snapshot",
        retrievedAt: new Date().toISOString(),
      });
    }
    if (pathname === "/api/market/macro") {
      if (!url.searchParams.has("refresh") && macroCache.data && macroCache.expiresAt > Date.now()) {
        return json({ ok: true, data: macroCache.data, liveFeedReachable: macroCache.data.liveFeedReachable, dataSource: macroCache.data.dataSource });
      }
      const base = snapshot.benchmarks?.macro || snapshot.benchmarks || {};
      const [fx, gold, silver, crude, yield10y] = await Promise.all([
        fetchYahooTickerQuote("USDINR=X"),
        fetchYahooTickerQuote("GC=F"),
        fetchYahooTickerQuote("SI=F"),
        fetchYahooTickerQuote("BZ=F"),
        fetchYahooTickerQuote("^TNX"),
      ]);
      const now = new Date().toISOString();
      const data = {
        usdInr: fx ? { rate: fx.currentPrice, bid: fx.currentPrice, ask: fx.currentPrice, lastRefreshed: fx.lastTradeTime } : base.usdInr || null,
        gold: gold ? { price: gold.currentPrice, nominal: "GC=F · USD/oz", timestamp: gold.lastTradeTime } : base.gold || null,
        silver: silver ? { price: silver.currentPrice, nominal: "SI=F · USD/oz", timestamp: silver.lastTradeTime } : base.silver || null,
        brentCrude: crude ? { price: crude.currentPrice, unit: "USD/barrel", date: crude.lastTradeTime } : base.brentCrude || null,
        us10yYield: yield10y ? { rate: yield10y.currentPrice, unit: "%", date: yield10y.lastTradeTime } : base.us10yYield || null,
        retrievedAt: now,
        source: [fx, gold, silver, crude, yield10y].some(Boolean) ? "Yahoo Finance" : "Published snapshot",
        liveFeedReachable: [fx, gold, silver, crude, yield10y].some(Boolean),
        liveQuotesCount: [fx, gold, silver, crude, yield10y].filter(Boolean).length,
        dataSource: [fx, gold, silver, crude, yield10y].some(Boolean) ? "Yahoo Finance (delayed or latest available)" : "published-market-snapshot",
      };
      macroCache.data = data;
      macroCache.expiresAt = Date.now() + 45_000;
      return json({ ok: true, data, liveFeedReachable: data.liveFeedReachable, dataSource: data.dataSource });
    }
    if (pathname === "/api/stocks") {
      let universe = normalizeStocks(snapshot);
      if (env.DB) {
        const stored = await env.DB.prepare("SELECT payload_json FROM stock_instruments ORDER BY symbol").all<any>();
        if (stored.results?.length) universe = stored.results.map((row: any) => JSON.parse(row.payload_json));
      }
      const page = filterAndPageStocks(universe, url);
      const enriched = await enrichQuotes(page.stocks || []);
      let responseStocks = enriched.stocks;
      let storedQuoteCount = 0;
      if (env.DB && responseStocks.length) {
        const symbols = responseStocks.map((stock: any) => String(stock.symbol || "").toUpperCase()).filter(Boolean);
        if (symbols.length) {
          const placeholders = symbols.map(() => "?").join(",");
          const saved = await env.DB.prepare(`SELECT * FROM stock_quotes WHERE symbol IN (${placeholders})`).bind(...symbols).all<any>();
          const bySymbol = new Map((saved.results || []).map((row: any) => [String(row.symbol).toUpperCase(), row]));
          responseStocks = responseStocks.map((stock: any) => {
            if (stock.quoteSource) return stock;
            const row: any = bySymbol.get(String(stock.symbol || "").toUpperCase());
            if (!row) return stock;
            storedQuoteCount++;
            return {
              ...stock,
              currentPrice: row.price,
              previousClose: row.previous_close,
              dayChange: row.day_change,
              dayChangePercent: row.day_change_percent,
              volume: row.volume,
              lastTradeTime: row.quote_time,
              quoteSource: row.provider,
              quoteStatus: "stored-not-live",
              quoteRetrievedAt: row.retrieved_at,
            };
          });
        }
      }
      if (env.DB && enriched.successful) {
        const writes: any[] = [];
        for (const stock of enriched.stocks.filter((item: any) => item.quoteSource)) {
          const retrievedAt = new Date().toISOString();
          const quoteTime = stock.lastTradeTime || retrievedAt;
          const args = [String(stock.symbol),stock.currentPrice??null,stock.previousClose??null,stock.dayChange??null,stock.dayChangePercent??null,stock.volume??null,stock.quoteCurrency||"INR",stock.quoteSource,quoteTime,retrievedAt,stock.quoteStatus||"UNOFFICIAL_DELAYED_OR_LATEST"];
          writes.push(env.DB.prepare(`INSERT INTO stock_quotes(symbol,price,previous_close,day_change,day_change_percent,volume,currency,provider,quote_time,retrieved_at,quality_status,raw_json)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET price=excluded.price,previous_close=excluded.previous_close,day_change=excluded.day_change,day_change_percent=excluded.day_change_percent,volume=excluded.volume,currency=excluded.currency,provider=excluded.provider,quote_time=excluded.quote_time,retrieved_at=excluded.retrieved_at,quality_status=excluded.quality_status,raw_json=excluded.raw_json`)
            .bind(...args.slice(0,10),args[10],JSON.stringify(stock)));
          writes.push(env.DB.prepare(`INSERT OR IGNORE INTO stock_quote_history(id,symbol,price,previous_close,day_change,day_change_percent,volume,currency,provider,quote_time,retrieved_at,quality_status)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
            .bind(crypto.randomUUID(),...args));
        }
        for (let i=0;i<writes.length;i+=50) await env.DB.batch(writes.slice(i,i+50));
      }
      return json({
        ...page,
        stocks: responseStocks,
        liveFeedReachable: enriched.successful > 0,
        quotesUpdated: enriched.successful,
        storedQuotesUsed: storedQuoteCount,
        quoteSource: enriched.successful > 0 ? "Yahoo Finance" : storedQuoteCount > 0 ? "Cloudflare D1 stored quotes" : "published-market-snapshot",
        quoteDisclaimer: "Only a limited number of symbols are checked on demand. Other prices may be stale snapshots. Third-party quotes may be delayed or unavailable; verify with NSE/BSE.",
      });
    }
    if (pathname.startsWith("/api/stocks/")) {
      const symbol = decodeURIComponent(pathname.slice("/api/stocks/".length)).toLowerCase();
      let universe = normalizeStocks(snapshot);
      if (env.DB) {
        const stored = await env.DB.prepare("SELECT payload_json FROM stock_instruments WHERE symbol=?").bind(symbol.toUpperCase()).first<any>();
        if (stored?.payload_json) {
          try { universe = [JSON.parse(stored.payload_json)]; } catch { /* fallback to snapshot */ }
        }
      }
      const stock = universe.find((s) =>
        String(s.symbol || "").toLowerCase() === symbol ||
        String(s.bseCode || "").toLowerCase() === symbol
      );
      if (!stock) return json({ error: `Stock "${symbol}" not found` }, 404);
      const requestedRange = url.searchParams.get("range") || "3mo";
      const [enriched, history, companyInfo] = await Promise.all([
        fetchYahooQuote(stock),
        fetchYahooHistory(stock, requestedRange),
        fetchGrowwCompanyInfo(stock),
      ]);
      const companyEnriched = mergeGrowwCompanyDetails(normalizeStockDetail(stock), companyInfo);
      let output = {
        ...companyEnriched,
        ...(enriched || {}),
        historicalSeries: history.length ? history : (Array.isArray(stock.historicalSeries) ? stock.historicalSeries : []),
        sparkline: enriched?.sparkline?.length ? enriched.sparkline : (Array.isArray(stock.sparkline) ? stock.sparkline : []),
      };
      if (!enriched && env.DB) {
        const saved = await env.DB.prepare("SELECT * FROM stock_quotes WHERE symbol=?").bind(String(stock.symbol).toUpperCase()).first<any>();
        if (saved) output = normalizeStockDetail({ ...output, currentPrice: saved.price, previousClose: saved.previous_close, dayChange: saved.day_change, dayChangePercent: saved.day_change_percent, volume: saved.volume, lastTradeTime: saved.quote_time, quoteSource: saved.provider, quoteStatus: "stored-not-live", quoteRetrievedAt: saved.retrieved_at });
      }
      return json({
        stock: output,
        fromUpstream: Boolean(enriched || history.length || companyInfo),
        linkedIpo: null,
        dataSource: enriched ? "Yahoo Finance" : companyInfo ? "Groww company profile / filings" : output.quoteStatus === "stored-not-live" ? "Cloudflare D1 stored quote" : "published-market-snapshot",
        quoteDisclaimer: "Third-party quotes may be delayed or unavailable. Verify prices with NSE/BSE.",
      });
    }
    if (pathname === "/api/ipos") {
      if (env.DB) {
        const stored = await env.DB.prepare("SELECT payload_json FROM ipo_offerings ORDER BY company_name").all<any>();
        if (stored.results?.length) {
          const payloads = stored.results.map((row: any) => JSON.parse(row.payload_json));
          const filtered = filterIpos({ ...snapshot, ipos: payloads }, url);
          return json({ ...filtered, dataSource: "cloudflare-d1", persisted: true });
        }
      }
      return json(filterIpos(snapshot, url));
    }
    if (pathname.startsWith("/api/ipos/")) {
      const slug = decodeURIComponent(pathname.slice("/api/ipos/".length)).toLowerCase();
      let ipo = (snapshot.ipos || []).find((item) => String(item.slug || "").toLowerCase() === slug);
      let source = "published-market-snapshot";
      if (env.DB) {
        const stored = await env.DB.prepare("SELECT payload_json FROM ipo_offerings WHERE slug=?").bind(slug).first<any>();
        if (stored?.payload_json) {
          try { ipo = JSON.parse(stored.payload_json); source = "cloudflare-d1"; } catch { /* keep snapshot version */ }
        }
      }
      return ipo ? json({ ipo, dataSource: source }) : json({ error: `IPO "${slug}" not found` }, 404);
    }
    if (pathname === "/api/insights") return json({ insights: snapshot.insights || [], dataSource: "published-market-snapshot" });
    if (pathname.startsWith("/api/insights/")) {
      const slug = decodeURIComponent(pathname.slice("/api/insights/".length)).toLowerCase();
      const insight = (snapshot.insights || []).find((item) => String(item.slug || "").toLowerCase() === slug) || null;
      return insight ? json({ insight }) : json({ insight: null }, 404);
    }
    if (pathname === "/api/blogs") return json({ articles: snapshot.blogs || [], dataSource: "published-market-snapshot" });
    if (pathname.startsWith("/api/blogs/")) {
      const slug = decodeURIComponent(pathname.slice("/api/blogs/".length)).toLowerCase();
      const blogs = snapshot.blogs || [];
      const article = blogs.find((item) => String(item.slug || "").toLowerCase() === slug) || null;
      const related = blogs.filter((item) => item !== article).slice(0, 3);
      return article ? json({ article, related }) : json({ article: null, related: [] }, 404);
    }
    if (pathname === "/api/search") {
      const q = (url.searchParams.get("q") || "").trim().toLowerCase();
      const stocks = normalizeStocks(snapshot).filter((s) =>
        [s.symbol, s.companyName].some((v) => String(v || "").toLowerCase().includes(q))
      ).slice(0, 10);
      const ipos = (snapshot.ipos || []).filter((i) => String(i.companyName || "").toLowerCase().includes(q)).slice(0, 10);
      const blogs = (snapshot.blogs || []).filter((b) => String(b.title || "").toLowerCase().includes(q)).slice(0, 5);
      const insights = (snapshot.insights || []).filter((i) => String(i.title || "").toLowerCase().includes(q)).slice(0, 5);
      return json({ ipos, stocks, blogs, insights, sectors: [] });
    }
    if (pathname === "/api/public-config") return json({ adsenseClientId: null, appUrl: url.origin, siteUrl: url.origin });
    if (pathname === "/api/automation/status") {
      return json({
        running: false,
        backendMode: "Pages Functions with snapshot IPO data and on-demand quotes",
        marketSession: "UNKNOWN",
        liveClients: 0,
        lastRunAt: null,
        lastError: "Background automation is unavailable on the static Pages deployment.",
      });
    }
    if (pathname === "/api/company-logo") {
      const sym = (url.searchParams.get("symbol") || "").trim().toUpperCase();
      const bse = (url.searchParams.get("bseCode") || "").trim();
      const name = (url.searchParams.get("name") || sym).trim();
      const explicitUrl = url.searchParams.get("url")?.trim();

      const candidates: string[] = [];
      if (explicitUrl && /^https?:\/\//i.test(explicitUrl)) candidates.push(explicitUrl);
      if (sym && !/^\d+$/.test(sym)) {
        candidates.push(
          `https://assets-netstorage.groww.in/stock-assets/logos2/${encodeURIComponent(sym)}.webp`,
          `https://images.dhan.co/symbol/${encodeURIComponent(sym)}.png`,
          `https://assets-netstorage.groww.in/stock-assets/logos/${encodeURIComponent(sym)}.png`,
          `https://cdn.alphavantage.co/logos/${encodeURIComponent(sym)}.png`
        );
      }
      if (/^\d{6}$/.test(bse)) {
        candidates.push(
          `https://assets-netstorage.groww.in/stock-assets/logos2/GSTK${bse}.webp`,
          `https://assets-netstorage.groww.in/stock-assets/logos/GSTK${bse}.png`
        );
      }

      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, {
            headers: { "user-agent": "Mozilla/5.0 PriceAlerter/1.0" },
            signal: AbortSignal.timeout(2500),
          });
          if (res.ok && res.status === 200) {
            const ct = res.headers.get("content-type") || (candidate.endsWith(".webp") ? "image/webp" : "image/png");
            return new Response(res.body, {
              status: 200,
              headers: {
                "content-type": ct,
                "cache-control": "public, max-age=604800, immutable",
                "x-logo-source": candidate,
              },
            });
          }
        } catch { /* try next candidate */ }
      }

      const initials = (name || sym).split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() || "").join("") || sym.slice(0, 2) || "PA";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#14263F"/>
            <stop offset="100%" stop-color="#2563EB"/>
          </linearGradient>
        </defs>
        <rect width="80" height="80" rx="18" fill="url(#g)"/>
        <text x="50%" y="54%" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5">${initials}</text>
      </svg>`;
      return new Response(svg, {
        status: 200,
        headers: {
          "content-type": "image/svg+xml",
          "cache-control": "public, max-age=86400",
        },
      });
    }

    return json({ error: "API route not implemented", path: pathname }, 404);
  } catch (error) {
    return json({
      ok: false,
      error: "Unable to load the published market data snapshot.",
      detail: error instanceof Error ? error.message : "Unknown snapshot error",
      path: pathname,
    }, 503);
  }
}
