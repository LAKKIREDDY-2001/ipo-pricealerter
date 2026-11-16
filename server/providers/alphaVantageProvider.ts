import fs from 'fs';
import path from 'path';

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';
export const DEFAULT_ALPHA_VANTAGE_KEY = 'K2UZXJYH6HDX8QGF';

export function getAlphaVantageApiKey(): string {
  return (process.env.ALPHA_VANTAGE_API_KEY || DEFAULT_ALPHA_VANTAGE_KEY).trim();
}

export interface AlphaVantageQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  latestTradingDay: string;
}

export interface AlphaVantageMacroSnapshot {
  usdInr: {
    rate: number;
    bid: number;
    ask: number;
    lastRefreshed: string;
  } | null;
  gold: {
    price: number;
    nominal: string;
    timestamp: string;
  } | null;
  silver: {
    price: number;
    nominal: string;
    timestamp: string;
  } | null;
  brentCrude: {
    price: number;
    unit: string;
    date: string;
  } | null;
  us10yYield: {
    rate: number;
    unit: string;
    date: string;
  } | null;
  retrievedAt: string;
}

// In-memory caches to respect free tier rate limit (5 calls/min)
const quoteCache = new Map<string, { data: AlphaVantageQuote; timestamp: number }>();
const logoCache = new Map<string, { png?: string; svg?: string } | null>();

const MACRO_CACHE_FILE = path.resolve(process.cwd(), 'server', 'data', 'macro-cache.json');
const MACRO_TTL_MS = 30 * 60 * 1000; // 30 minutes cache for macro indicators

function loadPersistedMacroCache(): AlphaVantageMacroSnapshot | null {
  try {
    if (fs.existsSync(MACRO_CACHE_FILE)) {
      const raw = fs.readFileSync(MACRO_CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as AlphaVantageMacroSnapshot;
      if (parsed && parsed.retrievedAt) {
        return parsed;
      }
    }
  } catch {
    // Ignore corrupt cache
  }
  return null;
}

function savePersistedMacroCache(data: AlphaVantageMacroSnapshot): void {
  try {
    const dir = path.dirname(MACRO_CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MACRO_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Ignore write failure
  }
}

let macroCache: { data: AlphaVantageMacroSnapshot; timestamp: number } | null = null;
const initialMacro = loadPersistedMacroCache();
if (initialMacro) {
  macroCache = {
    data: initialMacro,
    timestamp: new Date(initialMacro.retrievedAt).getTime() || Date.now(),
  };
}

async function fetchJsonSafe<T>(url: string, timeoutMs = 6000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PriceAlerter/1.0 (+https://pricealerter.in)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      // Check for rate limit or error message
      if (parsed?.Information?.includes('rate limit') || parsed?.Information?.includes('premium')) {
        return null;
      }
      return parsed as T;
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch quote for an equity symbol (e.g. RELIANCE.BSE, INFY.BSE, IBM)
 */
export async function fetchAlphaVantageQuote(symbol: string): Promise<AlphaVantageQuote | null> {
  const cleanSym = symbol.trim().toUpperCase();
  if (!cleanSym) return null;

  const now = Date.now();
  const cached = quoteCache.get(cleanSym);
  if (cached && now - cached.timestamp < MACRO_TTL_MS) {
    return cached.data;
  }

  const apiKey = getAlphaVantageApiKey();
  const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(cleanSym)}&apikey=${encodeURIComponent(apiKey)}`;

  interface GlobalQuoteResponse {
    'Global Quote'?: {
      '01. symbol'?: string;
      '02. open'?: string;
      '03. high'?: string;
      '04. low'?: string;
      '05. price'?: string;
      '06. volume'?: string;
      '07. latest trading day'?: string;
      '08. previous close'?: string;
      '09. change'?: string;
      '10. change percent'?: string;
    };
  }

  const res = await fetchJsonSafe<GlobalQuoteResponse>(url);
  const q = res?.['Global Quote'];
  if (!q || !q['05. price']) return null;

  const price = parseFloat(q['05. price']);
  if (isNaN(price) || price <= 0) return null;

  const quote: AlphaVantageQuote = {
    symbol: q['01. symbol'] || cleanSym,
    price,
    change: parseFloat(q['09. change'] || '0') || 0,
    changePercent: parseFloat((q['10. change percent'] || '0').replace('%', '')) || 0,
    open: parseFloat(q['02. open'] || '0') || price,
    high: parseFloat(q['03. high'] || '0') || price,
    low: parseFloat(q['04. low'] || '0') || price,
    previousClose: parseFloat(q['08. previous close'] || '0') || price,
    volume: parseInt(q['06. volume'] || '0', 10) || 0,
    latestTradingDay: q['07. latest trading day'] || new Date().toISOString().slice(0, 10),
  };

  quoteCache.set(cleanSym, { data: quote, timestamp: now });
  return quote;
}

/**
 * Fetch company logo URLs from Alpha Vantage
 */
export async function fetchAlphaVantageLogo(symbol: string): Promise<{ png?: string; svg?: string } | null> {
  const cleanSym = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleanSym) return null;

  if (logoCache.has(cleanSym)) {
    return logoCache.get(cleanSym) ?? null;
  }

  const apiKey = getAlphaVantageApiKey();
  const url = `${ALPHA_VANTAGE_BASE}?function=COMPANY_LOGO&symbol=${encodeURIComponent(cleanSym)}&apikey=${encodeURIComponent(apiKey)}`;

  interface LogoResponse {
    symbol?: string;
    logo_url_png?: string;
    logo_url_svg?: string;
  }

  const res = await fetchJsonSafe<LogoResponse>(url);
  if (res?.logo_url_png || res?.logo_url_svg) {
    const entry = {
      png: res.logo_url_png,
      svg: res.logo_url_svg,
    };
    logoCache.set(cleanSym, entry);
    return entry;
  }

  logoCache.set(cleanSym, null);
  return null;
}

/**
 * Fetch macro commodities and currency snapshot (USD/INR, Gold, Silver, Brent Crude, US 10Y Yield)
 * Uses sequential fetching with gentle pacing and caches to server/data/macro-cache.json for 30 minutes
 */
export async function fetchAlphaVantageMacro(): Promise<AlphaVantageMacroSnapshot> {
  const now = Date.now();
  if (macroCache && now - macroCache.timestamp < MACRO_TTL_MS) {
    return macroCache.data;
  }

  const apiKey = getAlphaVantageApiKey();
  const existing = macroCache?.data || loadPersistedMacroCache();

  // 1. USD / INR Exchange Rate
  interface FxResponse {
    'Realtime Currency Exchange Rate'?: {
      '5. Exchange Rate'?: string;
      '6. Last Refreshed'?: string;
      '8. Bid Price'?: string;
      '9. Ask Price'?: string;
    };
  }
  const fxRes = await fetchJsonSafe<FxResponse>(
    `${ALPHA_VANTAGE_BASE}?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=INR&apikey=${apiKey}`
  );
  let usdInr = existing?.usdInr || null;
  const rateData = fxRes?.['Realtime Currency Exchange Rate'];
  if (rateData && rateData['5. Exchange Rate']) {
    usdInr = {
      rate: parseFloat(rateData['5. Exchange Rate']),
      bid: parseFloat(rateData['8. Bid Price'] || rateData['5. Exchange Rate']),
      ask: parseFloat(rateData['9. Ask Price'] || rateData['5. Exchange Rate']),
      lastRefreshed: rateData['6. Last Refreshed'] || new Date().toISOString(),
    };
  }

  await delay(1200);

  // 2. Gold Spot
  interface SpotResponse {
    nominal?: string;
    price?: string;
    timestamp?: string;
  }
  const goldRes = await fetchJsonSafe<SpotResponse>(
    `${ALPHA_VANTAGE_BASE}?function=GOLD_SILVER_SPOT&symbol=GOLD&apikey=${apiKey}`
  );
  let gold = existing?.gold || null;
  if (goldRes?.price) {
    gold = {
      price: parseFloat(goldRes.price),
      nominal: goldRes.nominal || 'XAUUSD',
      timestamp: goldRes.timestamp || new Date().toISOString(),
    };
  }

  await delay(1200);

  // 3. Silver Spot
  const silverRes = await fetchJsonSafe<SpotResponse>(
    `${ALPHA_VANTAGE_BASE}?function=GOLD_SILVER_SPOT&symbol=SILVER&apikey=${apiKey}`
  );
  let silver = existing?.silver || null;
  if (silverRes?.price) {
    silver = {
      price: parseFloat(silverRes.price),
      nominal: silverRes.nominal || 'XAGUSD',
      timestamp: silverRes.timestamp || new Date().toISOString(),
    };
  }

  await delay(1200);

  // 4. Brent Crude
  interface SeriesResponse {
    data?: Array<{ date: string; value: string }>;
  }
  const brentRes = await fetchJsonSafe<SeriesResponse>(
    `${ALPHA_VANTAGE_BASE}?function=BRENT&apikey=${apiKey}`
  );
  let brentCrude = existing?.brentCrude || null;
  const brentLatest = brentRes?.data?.[0];
  if (brentLatest && brentLatest.value && brentLatest.value !== '.') {
    brentCrude = {
      price: parseFloat(brentLatest.value),
      unit: 'USD/barrel',
      date: brentLatest.date,
    };
  }

  await delay(1200);

  // 5. 10Y US Treasury Yield
  const yieldRes = await fetchJsonSafe<SeriesResponse>(
    `${ALPHA_VANTAGE_BASE}?function=TREASURY_YIELD&interval=monthly&maturity=10year&apikey=${apiKey}`
  );
  let us10yYield = existing?.us10yYield || null;
  const yieldLatest = yieldRes?.data?.[0];
  if (yieldLatest && yieldLatest.value && yieldLatest.value !== '.') {
    us10yYield = {
      rate: parseFloat(yieldLatest.value),
      unit: '%',
      date: yieldLatest.date,
    };
  }

  const snapshot: AlphaVantageMacroSnapshot = {
    usdInr,
    gold,
    silver,
    brentCrude,
    us10yYield,
    retrievedAt: new Date().toISOString(),
  };

  macroCache = { data: snapshot, timestamp: now };
  savePersistedMacroCache(snapshot);
  return snapshot;
}
