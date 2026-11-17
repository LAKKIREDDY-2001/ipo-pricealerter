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
      "cache-control": "public, max-age=15, s-maxage=30",
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

async function loadSnapshot(request: Request): Promise<Snapshot> {
  if (snapshotCache && snapshotCache.expiresAt > Date.now()) {
    return snapshotCache.value;
  }

  const assetUrl = new URL("/data/live-market-data.json", request.url);
  const response = await fetch(assetUrl.toString(), {
    headers: { accept: "application/json" },
  } as RequestInit);

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
    }>;
  };
};
const quoteCache = new Map<string, { expiresAt: number; quote: any }>();

async function fetchYahooQuote(stock: any): Promise<any | null> {
  const symbol = String(stock.yahooSymbol || stock.symbol || "").trim();
  if (!symbol) return null;
  const candidates = symbol.includes(".") ? [symbol] : [`${symbol}.NS`, `${symbol}.BO`];
  for (const ticker of candidates) {
    const cached = quoteCache.get(ticker);
    if (cached && cached.expiresAt > Date.now()) return cached.quote;
    try {
      const endpoint = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
      endpoint.searchParams.set("range", "1d");
      endpoint.searchParams.set("interval", "1m");
      const response = await fetch(endpoint.toString(), {
        headers: { accept: "application/json", "user-agent": "Mozilla/5.0 PriceAlerter/1.0" },
        signal: AbortSignal.timeout(4500),
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as YahooChart;
      const meta = payload.chart?.result?.[0]?.meta;
      const price = Number(meta?.regularMarketPrice);
      if (!meta || !Number.isFinite(price) || price <= 0) continue;
      const previous = Number(meta.chartPreviousClose ?? meta.previousClose ?? 0);
      const quote = {
        currentPrice: price,
        previousClose: previous > 0 ? previous : null,
        dayChange: previous > 0 ? Number((price - previous).toFixed(2)) : null,
        dayChangePercent: previous > 0 ? Number((((price - previous) / previous) * 100).toFixed(2)) : null,
        open: meta.regularMarketOpen ?? null,
        dayHigh: meta.regularMarketDayHigh ?? null,
        dayLow: meta.regularMarketDayLow ?? null,
        volume: meta.regularMarketVolume ?? null,
        lastTradeTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
        quoteSource: "Yahoo Finance",
        quoteStatus: "third-party-delayed-or-latest-available",
        quoteCurrency: meta.currency || "INR",
        quoteSymbol: ticker,
      };
      quoteCache.set(ticker, { quote, expiresAt: Date.now() + 30_000 });
      return quote;
    } catch {
      // Try the alternate exchange ticker; never invent a quote.
    }
  }
  return null;
}

async function enrichQuotes(stocks: any[]): Promise<{ stocks: any[]; successful: number }> {
  let successful = 0;
  const result = await Promise.all(stocks.map(async (stock) => {
    const quote = await fetchYahooQuote(stock);
    if (!quote) return stock;
    successful += 1;
    return {
      ...stock,
      ...quote,
      provenance: {
        ...(stock.provenance || {}),
        source: quote.quoteSource,
        retrievedAt: new Date().toISOString(),
        verificationStatus: "Third-party quote; verify with NSE/BSE",
        qualityStatus: "UNOFFICIAL_DELAYED_OR_LATEST",
        currency: quote.quoteCurrency,
      },
    };
  }));
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
}): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/api";
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": url.origin,
        "access-control-allow-methods": "GET, HEAD, OPTIONS",
        "access-control-allow-headers": "Content-Type, Authorization",
        "access-control-max-age": "86400",
      },
    });
  }
  if (method !== "GET" && method !== "HEAD") {
    return unavailable("Write operations, accounts, watchlists and alerts");
  }

  if (pathname === "/api/health") {
    try {
      const snapshot = await loadSnapshot(request);
      return json({
        status: "ok",
        platform: "PriceAlerter",
        runtime: "cloudflare-pages-functions",
        backendMode: "read-only-static-snapshot",
        persistentDatabaseConfigured: false,
        liveProviderConnected: false,
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
    const snapshot = await loadSnapshot(request);

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
      const page = filterAndPageStocks(normalizeStocks(snapshot), url);
      const enriched = await enrichQuotes(page.stocks || []);
      return json({
        ...page,
        stocks: enriched.stocks,
        liveFeedReachable: enriched.successful > 0,
        quotesUpdated: enriched.successful,
        quoteSource: enriched.successful > 0 ? "Yahoo Finance" : "published-market-snapshot",
        quoteDisclaimer: "Third-party quotes may be delayed or unavailable. Verify prices with NSE/BSE.",
      });
    }
    if (pathname.startsWith("/api/stocks/")) {
      const symbol = decodeURIComponent(pathname.slice("/api/stocks/".length)).toLowerCase();
      const stock = normalizeStocks(snapshot).find((s) =>
        String(s.symbol || "").toLowerCase() === symbol ||
        String(s.bseCode || "").toLowerCase() === symbol
      );
      if (!stock) return json({ error: `Stock "${symbol}" not found` }, 404);
      const enriched = await fetchYahooQuote(stock);
      return json({
        stock: enriched ? { ...stock, ...enriched } : stock,
        fromUpstream: Boolean(enriched),
        linkedIpo: null,
        dataSource: enriched ? "Yahoo Finance" : "published-market-snapshot",
        quoteDisclaimer: "Third-party quotes may be delayed or unavailable. Verify prices with NSE/BSE.",
      });
    }
    if (pathname === "/api/ipos") return json(filterIpos(snapshot, url));
    if (pathname.startsWith("/api/ipos/")) {
      const slug = decodeURIComponent(pathname.slice("/api/ipos/".length)).toLowerCase();
      const ipo = (snapshot.ipos || []).find((item) => String(item.slug || "").toLowerCase() === slug);
      return ipo ? json({ ipo, dataSource: "published-market-snapshot" }) : json({ error: `IPO "${slug}" not found` }, 404);
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
        backendMode: "read-only-static-snapshot",
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
