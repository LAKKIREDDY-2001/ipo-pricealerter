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
    const endpoint = new URL(\`https://query1.finance.yahoo.com/v8/finance/chart/\${encodeURIComponent(ticker)}\`);
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
    : [\`\${symbol}.NS\`, \`\${symbol}.BO\`];
  for (const ticker of candidates) {
    const quote = await fetchYahooTickerQuote(ticker);
    if (quote) return quote;
  }
  return null;
}

async function fetchYahooHistory(stock: any, requestedRange: string): Promise<any[]> {
  const symbol = String(stock.yahooSymbol || stock.symbol || "").trim();
  if (!symbol) return [];
  const ticker = symbol.includes(".") || symbol.startsWith("^") ? symbol : \`\${symbol}.NS\`;
  const range = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y"].includes(requestedRange) ? requestedRange : "3mo";
  const cacheKey = \`\${ticker}:\${range}\`;
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.history;
  const interval = range === "1d" ? "5m" : range === "5d" ? "15m" : range === "5y" ? "1wk" : "1d";
  try {
    const endpoint = new URL(\`https://query1.finance.yahoo.com/v8/finance/chart/\${encodeURIComponent(ticker)}\`);
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

  const d1Response = await handleD1Api(request, url, env);
  if (d1Response) return d1Response;

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
      return json({
        indices: snapshot.indices || [],
        liveFeedReachable: false,
        dataSource: "published-market-snapshot",
        retrievedAt: snapshot.lastSyncTime || snapshot.generatedAt || null,
      });
    }
    if (pathname === "/api/market/macro") {
      const macro = snapshot.benchmarks?.macro || snapshot.benchmarks || null;
      return json({ ok: Boolean(macro), data: macro, liveFeedReachable: false, dataSource: "published-market-snapshot" });
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
      const enriched = await fetchYahooQuote(stock);
      let output = enriched ? { ...stock, ...enriched } : stock;
      if (!enriched && env.DB) {
        const saved = await env.DB.prepare("SELECT * FROM stock_quotes WHERE symbol=?").bind(String(stock.symbol).toUpperCase()).first<any>();
        if (saved) output = { ...stock, currentPrice: saved.price, previousClose: saved.previous_close, dayChange: saved.day_change, dayChangePercent: saved.day_change_percent, volume: saved.volume, lastTradeTime: saved.quote_time, quoteSource: saved.provider, quoteStatus: "stored-not-live", quoteRetrievedAt: saved.retrieved_at };
      }
      return json({
        stock: output,
        fromUpstream: Boolean(enriched),
        linkedIpo: null,
        dataSource: enriched ? "Yahoo Finance" : output.quoteStatus === "stored-not-live" ? "Cloudflare D1 stored quote" : "published-market-snapshot",
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
    if (pathname === "/api/company-logo") return json({ error: "Logo proxy is not configured on this deployment." }, 404);

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
