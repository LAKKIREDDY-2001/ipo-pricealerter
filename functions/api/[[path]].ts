import { handleD1Api, syncMarketSnapshotToD1, type D1Env } from "../lib/d1-api";
import {
  getAngelCredentials,
  fetchAngelHoldings,
  convertAngelHoldingsToPortfolio,
  fetchAngelCautionaryScrips,
  searchAngelScrip,
  fetchAngelIntradayScrips,
  type AngelApiCredentials,
  type AngelExchange,
} from "../../server/providers/angelSmartApiProvider";

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
let usStocksCache: { expiresAt: number; data: any } | null = null;

async function loadUsStocksSnapshot(request: Request, assets: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> }): Promise<any> {
  if (usStocksCache && usStocksCache.expiresAt > Date.now()) {
    return usStocksCache.data;
  }
  try {
    const assetUrl = new URL("/data/us-stocks.json", request.url);
    const response = await assets.fetch(new Request(assetUrl.toString(), {
      headers: { accept: "application/json" },
    }));
    if (response.ok) {
      const data = await response.json();
      usStocksCache = { data, expiresAt: Date.now() + 60_000 };
      return data;
    }
  } catch { /* proceed to fallback */ }
  return null;
}

function quoteFreshnessStatus(lastTradeTime: unknown): "DELAYED" | "STALE" {
  if (!lastTradeTime) return "STALE";
  const timestamp = typeof lastTradeTime === "number"
    ? new Date(lastTradeTime > 1e12 ? lastTradeTime : lastTradeTime * 1000)
    : new Date(String(lastTradeTime));
  if (Number.isNaN(timestamp.getTime())) return "STALE";
  const tradeDate = timestamp.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return tradeDate === today ? "DELAYED" : "STALE";
}

function stockYahooCandidates(stock: any): string[] {
  const candidates: string[] = [];
  const symbol = String(stock.symbol || "").trim().toUpperCase().replace(/-(EQ|BE|BZ)$/i, "");
  const yahoo = String(stock.yahooSymbol || "").trim().toUpperCase();
  const bseCode = String(stock.bseCode || "").trim();
  const exchange = String(stock.exchange || "").toUpperCase();
  const hasNse = exchange.includes("NSE");
  const hasBse = exchange.includes("BSE") || /^\d{6}$/.test(bseCode);
  const add = (value: string) => { if (value && !candidates.includes(value)) candidates.push(value); };
  if (hasNse && symbol && !/^\d+$/.test(symbol)) add(symbol.endsWith(".NS") ? symbol : symbol + ".NS");
  if (hasBse && /^\d{6}$/.test(bseCode)) add(bseCode + ".BO");
  if (yahoo) add(yahoo);
  if (symbol && !/^\d+$/.test(symbol)) {
    add(symbol.endsWith(".NS") || symbol.endsWith(".BO") ? symbol : symbol + ".NS");
    add(symbol.endsWith(".BO") ? symbol : symbol + ".BO");
  }
  return candidates;
}

async function fetchYahooTickerQuote(ticker: string, force = false, expectedCurrency: string | null = "INR"): Promise<any | null> {
  if (!force) {
    const cached = quoteCache.get(ticker);
    if (cached && cached.expiresAt > Date.now()) return cached.quote;
  }
  try {
    const endpoint = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
    endpoint.searchParams.set("range", "1d");
    endpoint.searchParams.set("interval", "5m");
    const response = await fetch(endpoint.toString(), {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 PriceAlerter/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as YahooChart;
    const result = payload.chart?.result?.[0];
    const meta = result?.meta;
    const price = Number(meta?.regularMarketPrice);
    if (!meta || !Number.isFinite(price) || price <= 0) return null;
    // Prevent a ticker collision from assigning another company's quote to this stock.
    if (String(meta.symbol || "").toUpperCase() !== ticker.toUpperCase()) return null;
    if (expectedCurrency && meta.currency && String(meta.currency).toUpperCase() !== expectedCurrency) return null;
    const previous = Number(meta.chartPreviousClose ?? meta.previousClose ?? 0);
    const closes = (result?.indicators?.quote?.[0]?.close || []).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const lastTradeTime = meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null;
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
      lastTradeTime,
      quoteSource: "Market data feed",
      quoteStatus: quoteFreshnessStatus(lastTradeTime),
      quoteCurrency: meta.currency || "INR",
      quoteSymbol: ticker,
    };
    quoteCache.set(ticker, { quote, expiresAt: Date.now() + 30_000 });
    return quote;
  } catch {
    return null;
  }
}

async function fetchGoogleFinanceQuote(stock: any, force = false): Promise<any | null> {
  const symbol = String(stock.googleFinanceSymbol || stock.symbol || "").trim().toUpperCase();
  const bseCode = String(stock.bseCode || "").trim();
  const isBseOnly = String(stock.exchange || "").toUpperCase() === "BSE";
  const candidates = symbol.includes(":")
    ? [symbol]
    : [
        ...(isBseOnly && /^\d{6}$/.test(bseCode) ? ["BOM:" + bseCode] : []),
        ...(symbol ? [symbol + ":NSE"] : []),
        ...(/^\d{6}$/.test(bseCode) ? ["BOM:" + bseCode] : []),
        ...(symbol ? [symbol + ":BOM"] : []),
      ].filter((value, index, all) => all.indexOf(value) === index);
  for (const candidate of candidates) {
    const cacheKey = "google:" + candidate;
    if (!force) {
      const cached = quoteCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) return cached.quote;
    }
    try {
      const endpoint = new URL("https://www.google.com/finance/quote/" + encodeURIComponent(candidate));
      endpoint.searchParams.set("hl", "en");
      const response = await fetch(endpoint.toString(), {
        headers: { accept: "text/html", "user-agent": "Mozilla/5.0 (compatible; PriceAlerter/1.0)" },
        signal: AbortSignal.timeout(4500),
      });
      if (!response.ok) continue;
      const html = await response.text();
      const priceText = html.match(/class=["'][^"']*YMlKec[^"']*fxKbKc[^"']*["'][^>]*>\s*([^<]+)\s*</i)?.[1]
        || html.match(/data-last-price=["']([0-9,.]+)["']/i)?.[1];
      if (!priceText) continue;
      const price = Number(priceText.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(price) || price <= 0) continue;
      const previousText = html.match(/Previous close[\s\S]{0,500}?(?:₹|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i)?.[1];
      const previous = previousText ? Number(previousText.replace(/,/g, "")) : null;
      const quote = {
        currentPrice: price,
        previousClose: previous && Number.isFinite(previous) && previous > 0 ? previous : null,
        dayChange: previous && Number.isFinite(previous) && previous > 0 ? Number((price - previous).toFixed(2)) : null,
        dayChangePercent: previous && Number.isFinite(previous) && previous > 0 ? Number((((price - previous) / previous) * 100).toFixed(2)) : null,
        sparkline: [],
        quoteSource: "Market data feed",
        quoteStatus: "DELAYED",
        quoteCurrency: "INR",
        quoteSymbol: candidate,
        quoteRetrievedAt: new Date().toISOString(),
      };
      quoteCache.set(cacheKey, { quote, expiresAt: Date.now() + 60_000 });
      return quote;
    } catch {
      // Try the next exchange symbol if this source is unavailable.
    }
  }
  return null;
}

async function fetchYahooQuote(stock: any, force = false): Promise<any | null> {
  const candidates = stockYahooCandidates(stock);
  if (!candidates.length) return null;
  // Query NSE and BSE symbols concurrently so a missing NSE listing does not
  // make the user wait for two serial upstream timeouts.
  const quotes = await Promise.all(candidates.map((ticker) => fetchYahooTickerQuote(ticker, force, "INR")));
  return quotes.find(Boolean) || null;
}

async function fetchYahooHistory(stock: any, requestedRange: string, force = false): Promise<any[]> {
  const candidates = stockYahooCandidates(stock);
  if (!candidates.length) return [];
  const range = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "max"].includes(requestedRange) ? requestedRange : "1d";
  const interval = range === "1d" ? "5m" : range === "5d" ? "15m" : range === "5y" || range === "max" ? "1wk" : "1d";

  for (const ticker of candidates) {
    const cacheKey = `${ticker}:${range}`;
    if (!force) {
      const cached = historyCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) return cached.history;
    }
    try {
      const endpoint = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
      endpoint.searchParams.set("range", range === "max" ? "10y" : range);
      endpoint.searchParams.set("interval", interval);
      const response = await fetch(endpoint.toString(), {
        headers: { accept: "application/json", "user-agent": "Mozilla/5.0 PriceAlerter/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) continue;
      const result = ((await response.json()) as YahooChart).chart?.result?.[0];
      const timestamps = result?.timestamp || [];
      const quote = result?.indicators?.quote?.[0];
      if (!quote || !timestamps.length) continue;
      const history = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString(),
        open: quote.open?.[index] ?? null,
        high: quote.high?.[index] ?? null,
        low: quote.low?.[index] ?? null,
        close: quote.close?.[index] ?? null,
        volume: quote.volume?.[index] ?? null,
      })).filter((point) => typeof point.close === "number" && Number.isFinite(point.close));
      if (history.length > 0) {
        historyCache.set(cacheKey, { history, expiresAt: Date.now() + 60_000 });
        return history;
      }
    } catch {
      // try next candidate
    }
  }
  return [];
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
      source: stock.provenance?.source || stock.dataSource ? "Market data" : "Published snapshot",
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

function growwCompanyMatchesStock(stock: any, data: any): boolean {
  const header = data?.header || {};
  const stockIsin = String(stock.isin || "").trim().toUpperCase();
  const companyIsin = String(header.isin || "").trim().toUpperCase();
  if (stockIsin && stockIsin !== "AVAILABLE ON EXCHANGE" && companyIsin) {
    return stockIsin === companyIsin;
  }
  const stockSymbol = String(stock.symbol || "").trim().toUpperCase();
  const companyNse = String(header.nseScriptCode || "").trim().toUpperCase();
  if (stockSymbol && companyNse) return stockSymbol === companyNse;
  const stockBse = String(stock.bseCode || "").trim().toUpperCase();
  const companyBse = String(header.bseScriptCode || "").trim().toUpperCase();
  return Boolean(stockBse && companyBse && stockBse === companyBse);
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
  if (cached && cached.expiresAt > Date.now() && growwCompanyMatchesStock(stock, cached.data)) return cached.data;
  try {
    const endpoint = `https://groww.in/v1/api/stocks_data/v1/company/search_id/${encodeURIComponent(searchId)}?page=0&size=10`;
    const response = await fetch(endpoint, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 PriceAlerter/1.0" },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    if (!data || typeof data !== "object" || !growwCompanyMatchesStock(stock, data)) return null;
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
    reportingPeriod: "Latest available company filings",
    source: "Official corporate filings & exchange records",
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
    dataSourcesUsed: ["Exchange records", "Company disclosures"],
  };
}

async function enrichQuotes(stocks: any[]): Promise<{ stocks: any[]; successful: number }> {
  // Keep the number of upstream requests bounded for Cloudflare Pages.
  // Refresh every stock on the visible 50-row page; later pages are refreshed when opened.
  const MAX_QUOTE_LOOKUPS = 50;
  const CONCURRENCY = 12;
  const result = [...stocks];
  let successful = 0;
  let next = 0;
  async function worker() {
    while (next < Math.min(stocks.length, MAX_QUOTE_LOOKUPS)) {
      const index = next++;
      const stock = stocks[index];
      const quote = await fetchYahooQuote(stock) || await fetchGoogleFinanceQuote(stock);
      if (!quote) continue;
      successful++;
      result[index] = {
        ...stock,
        ...quote,
        provenance: {
          ...(stock.provenance || {}),
          source: quote.quoteSource || "Market data feed",
          retrievedAt: quote.lastTradeTime || new Date().toISOString(),
          verificationStatus: "Unverified",
          qualityStatus: quote.quoteStatus === "DELAYED" ? "DELAYED" : "LIVE",
          currency: quote.quoteCurrency || "INR",
        },
      };
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, stocks.length, MAX_QUOTE_LOOKUPS) }, () => worker()));
  return { stocks: result, successful };
}

function normalizeStocks(snapshot: Snapshot): any[] {
  const base = Array.isArray(snapshot.stocks) ? [...snapshot.stocks] : [];
  const bySymbol = new Map<string, number>();
  base.forEach((stock, index) => {
    const symbol = String(stock.symbol || "").trim().toUpperCase();
    if (symbol) bySymbol.set(symbol, index);
  });

  // The published snapshot intentionally contains the full security universe,
  // while allLiveStocks contains the priced subset. Merge that priced subset
  // into matching rows too; previously it was only used to append missing rows,
  // leaving many existing catalogue entries with blank prices.
  for (const item of snapshot.allLiveStocks || []) {
    const symbol = String(item.symbol || "").trim().toUpperCase();
    if (!symbol) continue;
    const rawPrice = Number(item.rawPrice ?? item.price ?? 0);
    const price = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : null;
    const change = item.rawChange == null ? null : Number(item.rawChange);
    const tradeTime = item.quoteTimestamp || item.lastTradeTime || null;
    const existingIndex = bySymbol.get(symbol);

    if (existingIndex !== undefined) {
      const existing = base[existingIndex];
      const effectiveTradeTime = tradeTime || existing.lastTradeTime || null;
      base[existingIndex] = {
        ...existing,
        currentPrice: price ?? existing.currentPrice ?? null,
        previousClose: Number(item.previousClose) > 0 ? Number(item.previousClose) : existing.previousClose ?? null,
        dayChange: Number.isFinite(change) ? change : existing.dayChange ?? null,
        dayChangePercent: item.pct !== null && item.pct !== undefined && Number.isFinite(Number(item.pct)) ? Number(item.pct) : existing.dayChangePercent ?? null,
        open: Number(item.open) > 0 ? Number(item.open) : existing.open ?? null,
        dayHigh: Number(item.high) > 0 ? Number(item.high) : existing.dayHigh ?? null,
        dayLow: Number(item.low) > 0 ? Number(item.low) : existing.dayLow ?? null,
        week52High: Number(item.week52High) > 0 ? Number(item.week52High) : existing.week52High ?? null,
        week52Low: Number(item.week52Low) > 0 ? Number(item.week52Low) : existing.week52Low ?? null,
        volume: Number(item.volRaw ?? item.volume) >= 0 ? Number(item.volRaw ?? item.volume) : existing.volume ?? null,
        marketCapCr: Number(item.marketCapCr) > 0 ? Number(item.marketCapCr) : existing.marketCapCr ?? null,
        logoUrl: item.logo || existing.logoUrl || null,
        lastTradeTime: effectiveTradeTime,
        quoteSource: item.quoteSource || existing.quoteSource || "Published market snapshot",
        provenance: {
          ...(existing.provenance || {}),
          source: item.quoteSource || existing.provenance?.source || "Published market snapshot",
          retrievedAt: effectiveTradeTime || existing.provenance?.retrievedAt || null,
          effectiveDate: effectiveTradeTime ? effectiveTradeTime.split("T")[0] : existing.provenance?.effectiveDate || null,
          verificationStatus: "Unverified",
          qualityStatus: price !== null ? quoteFreshnessStatus(effectiveTradeTime) : existing.provenance?.qualityStatus || "UNAVAILABLE",
          currency: "INR",
          unit: "INR per share",
          dataCategory: existing.provenance?.dataCategory || "Equities",
        },
      };
      continue;
    }

    if (price === null) continue;
    const effectiveTradeTime = tradeTime || null;
    const stock = {
      id: `snapshot-${symbol}`,
      symbol,
      bseCode: item.bseCode || null,
      searchId: item.searchId || null,
      companyName: item.name || symbol,
      logoUrl: item.logo || null,
      exchange: item.bseCode ? "NSE/BSE" : "NSE",
      sector: item.category === "RECENT_IPO" ? "IPO Debut" : "Equities",
      industry: item.category === "RECENT_IPO" ? "Recent Listings" : "Equities",
      currentPrice: price,
      previousClose: Number(item.previousClose) > 0 ? Number(item.previousClose) : change == null ? null : Number((price - change).toFixed(2)),
      dayChange: change,
      dayChangePercent: item.pct !== null && item.pct !== undefined && Number.isFinite(Number(item.pct)) ? Number(item.pct) : null,
      open: Number(item.open) > 0 ? Number(item.open) : null,
      dayHigh: Number(item.high) > 0 ? Number(item.high) : null,
      dayLow: Number(item.low) > 0 ? Number(item.low) : null,
      week52High: Number(item.week52High) > 0 ? Number(item.week52High) : null,
      week52Low: Number(item.week52Low) > 0 ? Number(item.week52Low) : null,
      volume: Number(item.volRaw ?? item.volume) >= 0 ? Number(item.volRaw ?? item.volume) : null,
      marketCapCr: Number(item.marketCapCr) > 0 ? Number(item.marketCapCr) : null,
      lastTradeTime: effectiveTradeTime,
      dataSource: "Published market snapshot",
      provenance: {
        source: item.quoteSource || "Published market snapshot",
        retrievedAt: effectiveTradeTime,
        effectiveDate: effectiveTradeTime ? effectiveTradeTime.split("T")[0] : null,
        verificationStatus: "Unverified",
        qualityStatus: effectiveTradeTime ? quoteFreshnessStatus(effectiveTradeTime) : "STALE",
        currency: "INR",
        unit: "INR per share",
        dataCategory: item.category === "RECENT_IPO" ? "IPO Debut" : "Equities",
      },
    };
    bySymbol.set(symbol, base.length);
    base.push(stock);
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
    const rawExplicit = s.dayChangePercent ?? s.changePercent;
    const explicit = rawExplicit === null || rawExplicit === undefined || rawExplicit === ""
      ? Number.NaN
      : Number(rawExplicit);
    if (Number.isFinite(explicit)) return explicit;
    const current = Number(s.currentPrice);
    const previous = Number(s.previousClose);
    return current > 0 && previous > 0 ? ((current - previous) / previous) * 100 : Number.NaN;
  };
  if (tab === "gainers") rows = rows.filter((s) => Number.isFinite(changePct(s)) && changePct(s) > 0).sort((a, b) => changePct(b) - changePct(a));
  if (tab === "losers") rows = rows.filter((s) => Number.isFinite(changePct(s)) && changePct(s) < 0).sort((a, b) => changePct(a) - changePct(b));
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

  if (pathname === "/api/market/angel/status") {
    const customEnv = env as unknown as Record<string, string | undefined>;
    const creds = getAngelCredentials(customEnv);
    return json({
      ok: true,
      configured: Boolean(creds?.apiKey),
      clientCodeConfigured: Boolean(creds?.clientCode),
      pinConfigured: Boolean(creds?.pin),
      totpConfigured: Boolean(creds?.totpKey),
      apiKeyPresent: Boolean(creds?.apiKey),
      clientCode: creds?.clientCode ? creds.clientCode.replace(/(?<=.{2}).(?=.{2})/g, "*") : null,
      status: (creds?.apiKey && creds?.totpKey) ? "ready" : creds?.apiKey ? "missing_totp" : "unconfigured",
      timestamp: new Date().toISOString(),
    });
  }

  if (pathname === "/api/portfolio/angel/holdings") {
    const customEnv = env as unknown as Record<string, string | undefined>;
    let overrideCreds = getAngelCredentials(customEnv);
    if (method === "POST") {
      try {
        const body = (await request.json()) as any;
        if (body && typeof body === "object") {
          if (!overrideCreds && body.apiKey) {
            overrideCreds = {
              apiKey: body.apiKey,
              clientCode: body.clientCode,
              pin: body.pin,
              totpKey: body.totpKey,
            };
          } else if (overrideCreds) {
            if (body.clientCode) overrideCreds.clientCode = body.clientCode;
            if (body.pin) overrideCreds.pin = body.pin;
            if (body.totpKey) overrideCreds.totpKey = body.totpKey;
          }
        }
      } catch {
        // use default overrideCreds
      }
    }

    if (!overrideCreds || !overrideCreds.apiKey || !overrideCreds.totpKey) {
      return json({
        ok: false,
        error: "Angel One credentials (API key or TOTP key) not configured.",
        configured: Boolean(overrideCreds?.apiKey),
        holdings: [],
      }, 400);
    }

    try {
      const holdingsData = await fetchAngelHoldings(overrideCreds);
      if (!holdingsData) {
        return json({
          ok: false,
          error: "Failed to authenticate or fetch holdings from Angel One SmartAPI.",
          holdings: [],
        }, 502);
      }
      const holdings = convertAngelHoldingsToPortfolio(holdingsData.holdings || []);
      return json({
        ok: true,
        source: "Angel One SmartAPI (Live Demat)",
        totalHoldingsValue: holdingsData.totalholding?.totalholdingvalue ?? 0,
        totalInvValue: holdingsData.totalholding?.totalinvvalue ?? 0,
        totalProfitLoss: holdingsData.totalholding?.totalprofitandloss ?? 0,
        totalPnlPercentage: holdingsData.totalholding?.totalpnlpercentage ?? 0,
        holdings,
        retrievedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      return json({
        ok: false,
        error: err?.message || "Error communicating with Angel One SmartAPI",
        holdings: [],
      }, 500);
    }
  }

  if (pathname === "/api/market/angel/cautionary") {
    const customEnv = env as unknown as Record<string, string | undefined>;
    const creds = getAngelCredentials(customEnv);
    if (!creds?.apiKey) {
      return json({ ok: false, error: "Angel One credentials not configured.", data: [] }, 400);
    }
    const cautionary = await fetchAngelCautionaryScrips(creds);
    return json({
      ok: true,
      count: cautionary.length,
      data: cautionary,
      retrievedAt: new Date().toISOString(),
    });
  }

  if (pathname === "/api/market/angel/search") {
    const customEnv = env as unknown as Record<string, string | undefined>;
    const creds = getAngelCredentials(customEnv);
    const q = (url.searchParams.get("q") || "").trim();
    const exchange = (url.searchParams.get("exchange") || "NSE").toUpperCase() as AngelExchange;
    if (!q) {
      return json({ ok: false, error: "Missing search query parameter 'q'", data: [] }, 400);
    }
    const results = await searchAngelScrip(exchange, q, creds || undefined);
    return json({
      ok: true,
      exchange,
      query: q,
      results,
    });
  }

  if (pathname === "/api/market/angel/intraday") {
    const customEnv = env as unknown as Record<string, string | undefined>;
    const creds = getAngelCredentials(customEnv);
    const exchange = (url.searchParams.get("exchange") || "NSE").toUpperCase() === "BSE" ? "BSE" : "NSE";
    const scrips = await fetchAngelIntradayScrips(exchange, creds || undefined);
    return json({
      ok: true,
      exchange,
      count: scrips.length,
      data: scrips,
      retrievedAt: new Date().toISOString(),
    });
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
        liveQuoteProvider: "Multiple market data sources (may be delayed)",
        ipoProvider: "build-time snapshot",
        counts: {
          stocks: normalizeStocks(snapshot).length,
          snapshotStocks: snapshot.stocks?.length || 0,
          pricedStocks: snapshot.allLiveStocks?.length || 0,
          nseEquities: normalizeExchangeCounts(normalizeStocks(snapshot)).nseCount,
          bseEquities: normalizeExchangeCounts(normalizeStocks(snapshot)).bseCount,
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
      const forceIndices = url.searchParams.has("refresh");
      const baseIndices = Array.isArray(snapshot.indices) ? snapshot.indices : [];
      const refreshed = await Promise.all(baseIndices.map(async (item: any, index: number) => {
        if (index >= 24) return item;
        const label = `${item.symbol || ""} ${item.name || ""}`.toUpperCase();
        const ticker = label.includes("SENSEX") ? "^BSESN"
          : label.includes("BANK NIFTY") || label.includes("NIFTY BANK") ? "^NSEBANK"
          : label.includes("NIFTY 50") || label.includes("NIFTY50") ? "^NSEI"
          : label.includes("INDIA VIX") ? "^INDIAVIX"
          : label.includes("USD/INR") || label.includes("USDINR") || label.includes("USD INR") ? "INR=X"
          : label.includes("GOLD") ? "GC=F"
          : label.includes("SILVER") ? "SI=F"
          : label.includes("CRUDE") ? "BZ=F"
          : item.yahooSymbol || "";
        if (!ticker) return item;
        const quote = await fetchYahooTickerQuote(ticker, forceIndices, ["GC=F", "SI=F", "BZ=F"].includes(ticker) ? null : "INR");
        if (!quote) {
          const lastKnownTime = item.provenance?.effectiveDate || item.provenance?.retrievedAt || null;
          return {
            ...item,
            provenance: {
              ...(item.provenance || {}),
              source: "Published market snapshot",
              qualityStatus: quoteFreshnessStatus(lastKnownTime),
              verificationStatus: "Unverified",
            },
          };
        }
        const defaultCurrency = ticker.endsWith("=F") ? "USD" : ticker === "INR=X" ? "INR" : "PTS";
        return {
          ...item,
          value: quote.currentPrice,
          previousClose: quote.previousClose,
          change: quote.dayChange,
          changePercent: quote.dayChangePercent,
          provenance: {
            ...(item.provenance || {}),
            source: "Market data feed",
            retrievedAt: quote.lastTradeTime || new Date().toISOString(),
            qualityStatus: quote.quoteStatus === "STALE" ? "STALE" : "DELAYED",
            verificationStatus: "Unverified",
            currency: defaultCurrency,
          },
        };
      }));
      const liveCount = refreshed.filter((item: any, index: number) => item !== baseIndices[index]).length;
      return json({
        indices: refreshed,
        liveFeedReachable: liveCount > 0,
        quotesUpdated: liveCount,
        dataSource: liveCount ? "Market data feed" : "Published market snapshot",
        retrievedAt: new Date().toISOString(),
      });
    }
    if (pathname === "/api/market/macro") {
      const forceMacro = url.searchParams.has("refresh");
      if (!forceMacro && macroCache.data && macroCache.expiresAt > Date.now()) {
        return json({ ok: true, data: macroCache.data, liveFeedReachable: macroCache.data.liveFeedReachable, dataSource: macroCache.data.dataSource });
      }
      const base = snapshot.benchmarks?.macro || snapshot.benchmarks || {};
      const [fx, gold, silver, crude, yield10y] = await Promise.all([
        fetchYahooTickerQuote("INR=X", forceMacro),
        fetchYahooTickerQuote("GC=F", forceMacro, null),
        fetchYahooTickerQuote("SI=F", forceMacro, null),
        fetchYahooTickerQuote("BZ=F", forceMacro, null),
        fetchYahooTickerQuote("^TNX", forceMacro, null),
      ]);
      const now = new Date().toISOString();
      const data = {
        usdInr: fx ? { rate: fx.currentPrice, bid: fx.currentPrice, ask: fx.currentPrice, lastRefreshed: fx.lastTradeTime } : base.usdInr || null,
        gold: gold ? { price: gold.currentPrice, nominal: "GC=F · USD/oz", timestamp: gold.lastTradeTime } : base.gold || null,
        silver: silver ? { price: silver.currentPrice, nominal: "SI=F · USD/oz", timestamp: silver.lastTradeTime } : base.silver || null,
        brentCrude: crude ? { price: crude.currentPrice, unit: "USD/barrel", date: crude.lastTradeTime } : base.brentCrude || null,
        us10yYield: yield10y ? { rate: yield10y.currentPrice, unit: "%", date: yield10y.lastTradeTime } : base.us10yYield || null,
        retrievedAt: now,
        source: [fx, gold, silver, crude, yield10y].some(Boolean) ? "Market data feed" : "Published snapshot",
        liveFeedReachable: [fx, gold, silver, crude, yield10y].some(Boolean),
        liveQuotesCount: [fx, gold, silver, crude, yield10y].filter(Boolean).length,
        dataSource: [fx, gold, silver, crude, yield10y].some(Boolean) ? "Market data feed" : "Published market snapshot",
      };
      macroCache.data = data;
      macroCache.expiresAt = Date.now() + 45_000;
      return json({ ok: true, data, liveFeedReachable: data.liveFeedReachable, dataSource: data.dataSource });
    }
    if (pathname === "/api/market/us-stocks/explore") {
      const data = await loadUsStocksSnapshot(request, env.ASSETS);
      if (data) return json(data);
      return json({ error: "US stocks data currently unavailable" }, 503);
    }
    if (pathname === "/api/market/us-stocks") {
      const usSnapshot = await loadUsStocksSnapshot(request, env.ASSETS);
      if (!usSnapshot) return json({ error: "US stocks data currently unavailable" }, 503);
      let list = usSnapshot.stocks || [];

      const exchange = url.searchParams.get("exchange") || "All";
      if (exchange !== "All") list = list.filter((s: any) => s.exchange === exchange);

      const sector = url.searchParams.get("sector") || "All";
      if (sector !== "All") list = list.filter((s: any) => String(s.sector || "").toLowerCase() === sector.toLowerCase());

      const category = url.searchParams.get("category") || "All";
      if (category !== "All") list = list.filter((s: any) => String(s.indmoneyCategory || "").toLowerCase().includes(category.toLowerCase()));

      const mcapTier = url.searchParams.get("mcapTier") || "All";
      if (mcapTier === "Mega") list = list.filter((s: any) => Number(s.marketCapUsd) >= 200_000_000_000);
      else if (mcapTier === "Large") list = list.filter((s: any) => Number(s.marketCapUsd) >= 10_000_000_000 && Number(s.marketCapUsd) < 200_000_000_000);
      else if (mcapTier === "Mid") list = list.filter((s: any) => Number(s.marketCapUsd) < 10_000_000_000);

      const q = (url.searchParams.get("q") || "").trim().toLowerCase();
      if (q) {
        list = list.filter(
          (s: any) =>
            String(s.symbol || "").toLowerCase().includes(q) ||
            String(s.companyName || "").toLowerCase().includes(q) ||
            String(s.sector || "").toLowerCase().includes(q)
        );
      }

      const tab = url.searchParams.get("tab") || "";
      if (tab === "gainers") list = [...list].sort((a: any, b: any) => (b.changePercent || 0) - (a.changePercent || 0));
      else if (tab === "losers") list = [...list].sort((a: any, b: any) => (a.changePercent || 0) - (b.changePercent || 0));
      else if (tab === "popular") list = [...list].sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0));
      else if (tab === "etfs") list = list.filter((s: any) => Boolean(s.isEtf));

      const total = list.length;
      const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10) || 50));
      const paginated = list.slice((page - 1) * limit, page * limit);

      return json({
        success: true,
        stocks: paginated,
        total,
        page,
        limit,
        usdInrRate: usSnapshot.usdInrRate,
        categories: usSnapshot.categories,
        sourceUrl: usSnapshot.sourceUrl,
      });
    }
    if (pathname.startsWith("/api/market/us-stocks/")) {
      const sym = decodeURIComponent(pathname.slice("/api/market/us-stocks/".length)).trim().toUpperCase();
      const usSnapshot = await loadUsStocksSnapshot(request, env.ASSETS);
      if (!usSnapshot) return json({ error: "US stocks data currently unavailable" }, 503);
      const stock = (usSnapshot.stocks || []).find((s: any) => String(s.symbol || "").toUpperCase() === sym);
      if (!stock) return json({ success: false, message: `US stock symbol "${sym}" not found` }, 404);
      return json({ success: true, stock, usdInrRate: usSnapshot.usdInrRate });
    }
    if (pathname === "/api/stocks") {
      let universe = normalizeStocks(snapshot);
      if (env.DB) {
        const stored = await env.DB.prepare("SELECT payload_json FROM stock_instruments ORDER BY symbol").all<any>();
        if (stored.results?.length) {
          // D1 can lag behind a freshly published exchange snapshot. Never let a
          // partially populated D1 table replace (and shrink) the full universe.
          const bySymbol = new Map<string, any>();
          for (const stock of universe) {
            const key = String(stock.symbol || stock.bseCode || "").trim().toUpperCase();
            if (key) bySymbol.set(key, stock);
          }
          for (const row of stored.results) {
            try {
              const saved = JSON.parse(row.payload_json);
              const key = String(saved.symbol || saved.bseCode || "").trim().toUpperCase();
              if (!key) continue;
              const current = bySymbol.get(key);
              // The published snapshot is the latest build-time exchange catalogue;
              // retain it for matches and use D1 only to fill missing securities.
              if (!current) bySymbol.set(key, saved);
            } catch {
              // Ignore malformed legacy rows without losing the snapshot catalogue.
            }
          }
          universe = [...bySymbol.values()];
        }
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

      if (env.DB && responseStocks.length) {
        const historySymbols = responseStocks.map((stock: any) => String(stock.symbol || "").toUpperCase()).filter(Boolean);
        if (historySymbols.length) {
          const placeholders = historySymbols.map(() => "?").join(",");
          try {
            const historyRows = await env.DB.prepare(
              "SELECT symbol, price, quote_time, retrieved_at FROM stock_quote_history WHERE symbol IN (" + placeholders + ") ORDER BY retrieved_at DESC LIMIT ?"
            ).bind(...historySymbols, historySymbols.length * 24).all<any>();
            const historyBySymbol = new Map<string, number[]>();
            for (const row of historyRows.results || []) {
              const key = String(row.symbol || "").toUpperCase();
              const price = Number(row.price);
              if (!key || !Number.isFinite(price) || price <= 0) continue;
              const values = historyBySymbol.get(key) || [];
              if (values.length < 24) values.push(price);
              historyBySymbol.set(key, values);
            }
            responseStocks = responseStocks.map((stock: any) => {
              if (Array.isArray(stock.sparkline) && stock.sparkline.filter((v: any) => Number.isFinite(v)).length >= 2) return stock;
              const values = (historyBySymbol.get(String(stock.symbol || "").toUpperCase()) || []).reverse();
              return values.length >= 2 ? { ...stock, sparkline: values } : stock;
            });
          } catch {
            // Historical quotes are an optional enhancement; preserve current quotes if unavailable.
          }
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
        quoteSource: enriched.successful > 0 ? "Market data feed" : storedQuoteCount > 0 ? "Stored market data" : "published-market-snapshot",
        quoteDisclaimer: "Market quotes may be delayed. Outside market hours (9:15 AM – 3:30 PM IST), prices reflect the latest available session.",
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
      const forceStock = url.searchParams.get("refresh") === "1";
      const requestedRange = url.searchParams.get("range") || "1d";
      const [enriched, history, companyInfo] = await Promise.all([
        (async () => await fetchYahooQuote(stock, forceStock) || await fetchGoogleFinanceQuote(stock, forceStock))(),
        fetchYahooHistory(stock, requestedRange, forceStock),
        fetchGrowwCompanyInfo(stock),
      ]);
      let storedHistory: any[] = [];
      if (!history.length && env.DB) {
        try {
          const saved = await env.DB.prepare(
            "SELECT price, quote_time, retrieved_at FROM stock_quote_history WHERE symbol=? ORDER BY retrieved_at DESC LIMIT 250"
          ).bind(String(stock.symbol).toUpperCase()).all<any>();
          storedHistory = (saved.results || []).reverse().map((row: any) => {
            const close = Number(row.price);
            const date = row.quote_time || row.retrieved_at;
            return Number.isFinite(close) && close > 0 && date
              ? { date, open: close, high: close, low: close, close, volume: 0 }
              : null;
          }).filter(Boolean);
        } catch {
          storedHistory = [];
        }
      }
      const companyEnriched = mergeGrowwCompanyDetails(normalizeStockDetail(stock), companyInfo);
      const nowIso = new Date().toISOString();
      let output = {
        ...companyEnriched,
        ...(enriched || {}),
        historicalSeries: history.length ? history : storedHistory.length ? storedHistory : (Array.isArray(stock.historicalSeries) ? stock.historicalSeries : []),
        sparkline: enriched?.sparkline?.length ? enriched.sparkline : (Array.isArray(stock.sparkline) ? stock.sparkline : storedHistory.map((point: any) => point.close)),
      };

      if (enriched && typeof enriched.currentPrice === "number" && Number.isFinite(enriched.currentPrice)) {
        const tradeTime = enriched.lastTradeTime || null;
        output.currentPrice = enriched.currentPrice;
        output.previousClose = enriched.previousClose ?? output.previousClose;
        output.open = enriched.open ?? output.open;
        output.dayHigh = enriched.dayHigh ?? output.dayHigh;
        output.dayLow = enriched.dayLow ?? output.dayLow;
        output.week52High = enriched.week52High ?? output.week52High;
        output.week52Low = enriched.week52Low ?? output.week52Low;
        output.dayChange = enriched.dayChange ?? output.dayChange;
        output.dayChangePercent = enriched.dayChangePercent ?? output.dayChangePercent;
        output.volume = enriched.volume ?? output.volume;
        output.lastTradeTime = tradeTime || output.lastTradeTime || null;
        output.provenance = {
          ...(output.provenance || {}),
          source: "Market data feed",
          retrievedAt: nowIso,
          effectiveDate: nowIso.split("T")[0],
          verificationStatus: "Unverified",
          qualityStatus: enriched.quoteStatus === "STALE" ? "STALE" : "DELAYED",
          currency: enriched.quoteCurrency || "INR",
        };
        if (output.nseQuote) {
          output.nseQuote = {
            ...output.nseQuote,
            ltp: enriched.currentPrice,
            dayChange: enriched.dayChange ?? output.nseQuote.dayChange,
            dayChangePct: enriched.dayChangePercent ?? output.nseQuote.dayChangePct,
            volume: enriched.volume ?? output.nseQuote.volume,
            lastTradeTime: tradeTime || output.nseQuote.lastTradeTime,
          };
        }
        if (output.bseQuote) {
          output.bseQuote = {
            ...output.bseQuote,
            ltp: enriched.currentPrice,
            dayChange: enriched.dayChange ?? output.bseQuote.dayChange,
            dayChangePct: enriched.dayChangePercent ?? output.bseQuote.dayChangePct,
            volume: enriched.volume ?? output.bseQuote.volume,
            lastTradeTime: tradeTime || output.bseQuote.lastTradeTime,
          };
        }
        if (env.DB) {
          try {
            await env.DB.prepare(`INSERT INTO stock_quotes(symbol,price,previous_close,day_change,day_change_percent,volume,currency,provider,quote_time,retrieved_at,quality_status,raw_json)
              VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET price=excluded.price,previous_close=excluded.previous_close,day_change=excluded.day_change,day_change_percent=excluded.day_change_percent,volume=excluded.volume,currency=excluded.currency,provider=excluded.provider,quote_time=excluded.quote_time,retrieved_at=excluded.retrieved_at,quality_status=excluded.quality_status,raw_json=excluded.raw_json`)
               .bind(String(stock.symbol).toUpperCase(), enriched.currentPrice, enriched.previousClose ?? null, enriched.dayChange ?? null, enriched.dayChangePercent ?? null, enriched.volume ?? null, enriched.quoteCurrency || "INR", "Market data feed", tradeTime, nowIso, "UNOFFICIAL_DELAYED", JSON.stringify(output)).run();
          } catch { /* ignore db write error */ }
        }
      } else if (!enriched && env.DB) {
        const saved = await env.DB.prepare("SELECT * FROM stock_quotes WHERE symbol=?").bind(String(stock.symbol).toUpperCase()).first<any>();
        if (saved) {
          output = normalizeStockDetail({
            ...output,
            currentPrice: saved.price,
            previousClose: saved.previous_close,
            dayChange: saved.day_change,
            dayChangePercent: saved.day_change_percent,
            volume: saved.volume,
            lastTradeTime: saved.quote_time,
            quoteSource: "Yahoo Finance (unofficial; may be delayed)",
            quoteStatus: quoteFreshnessStatus(saved.quote_time),
            quoteRetrievedAt: saved.retrieved_at,
          });
          if (output.nseQuote) {
            output.nseQuote = { ...output.nseQuote, ltp: saved.price, dayChange: saved.day_change, dayChangePct: saved.day_change_percent, volume: saved.volume, lastTradeTime: saved.quote_time };
          }
          if (output.bseQuote) {
            output.bseQuote = { ...output.bseQuote, ltp: saved.price, dayChange: saved.day_change, dayChangePct: saved.day_change_percent, volume: saved.volume, lastTradeTime: saved.quote_time };
          }
        }
      }

      if (typeof output.currentPrice === "number") {
        if (output.nseQuote) output.nseQuote.ltp = output.currentPrice;
        if (output.bseQuote) output.bseQuote.ltp = output.currentPrice;
      }

      return json({
        stock: output,
        fromUpstream: Boolean(enriched || history.length || companyInfo),
        linkedIpo: null,
        dataSource: enriched ? "Market data feed" : companyInfo ? "Company disclosures" : output.quoteStatus === "STALE" ? "Stale stored quote" : "Published market snapshot",
        quoteDisclaimer: "Market quotes may be delayed. Prices are labelled stale when the last trade belongs to an earlier IST trading date.",
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
