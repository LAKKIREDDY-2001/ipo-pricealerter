import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import type {
  ExchangeLiveQuote,
  MarketIndexInstrument,
  StockCompanyProfile,
  StockFinancialSeries,
  StockHistoricalPoint,
  StockInstrument,
  StockMutualFundHolding,
  StockPeerComparison,
  StockRegistryMetadata,
  StockShareholdingQuarter,
} from '../../src/types/financial.ts';
import { createId, getDb, saveDb } from '../db/database.ts';

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        shortName?: string;
        longName?: string;
        exchangeName?: string;
        currency?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        regularMarketTime?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: unknown;
  };
}

interface GrowwLivePriceDto {
  type?: string;
  symbol?: string;
  tsInMillis?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  ltp?: number;
  dayChange?: number;
  dayChangePerc?: number;
  volume?: number;
  lastTradeTime?: number;
  lastTradeQty?: number;
  totalBuyQty?: number;
  totalSellQty?: number;
  highPriceRange?: number;
  lowPriceRange?: number;
  yearHighPrice?: number;
  yearLowPrice?: number;
}

interface GrowwAllStocksRecord {
  isin?: string;
  companyName?: string;
  companyShortName?: string;
  searchId?: string;
  industryCode?: number;
  bseScriptCode?: number | null;
  nseScriptCode?: string | null;
  yearlyHighPrice?: number | null;
  yearlyLowPrice?: number | null;
  closePrice?: number | null;
  marketCap?: number | null;
  livePriceDto?: GrowwLivePriceDto | null;
}

interface GrowwAllStocksResponse {
  records?: GrowwAllStocksRecord[];
  totalRecords?: number;
}

interface GrowwSearchResponse {
  data?: {
    content?: Array<{
      search_id?: string;
      isin?: string;
      entity_type?: string;
      title?: string;
      bse_scrip_code?: string | null;
      nse_scrip_code?: string | null;
    }>;
  };
}

interface GrowwFinRow {
  title?: string;
  yearly?: Record<string, number>;
  quarterly?: Record<string, number>;
}

interface GrowwCompanyResponse {
  header?: {
    searchId?: string;
    isin?: string;
    displayName?: string;
    logoUrl?: string | null;
    industryName?: string;
    nseScriptCode?: string;
    bseScriptCode?: string | number;
    bseTradingSymbol?: string | null;
    isFnoEnabled?: boolean;
    isNseFnoEnabled?: boolean;
    isBseFnoEnabled?: boolean;
  };
  details?: {
    fullName?: string;
    ceo?: string | null;
    managingDirector?: string | null;
    foundedYear?: string | null;
    businessSummary?: string | null;
  };
  fundamentals?: Array<{
    name?: string;
    shortName?: string;
    value?: string;
  }>;
  priceData?: {
    nse?: { yearLowPrice?: number; yearHighPrice?: number };
    bse?: { yearLowPrice?: number; yearHighPrice?: number };
  };
  shareholdingPatternV2?: {
    data?: Record<
      string,
      {
        promoters?: number;
        fii?: number;
        dii?: number;
        public?: number;
        others?: number;
      }
    >;
  };
  financialStatementV2?: {
    CONSOLIDATED?: GrowwFinRow[];
    STANDALONE?: GrowwFinRow[];
  };
  similarAssets?: {
    peerList?: Array<{
      companyHeader?: {
        displayName?: string;
        nseScriptCode?: string;
        bseScriptCode?: string | number;
      };
      nseYearLow?: number | null;
      nseYearHigh?: number | null;
      bseYearLow?: number | null;
      bseYearHigh?: number | null;
      marketCap?: number | null;
      peRatio?: number | null;
      pbRatio?: number | null;
    }>;
  };
  fundsInvested?: Array<{
    name?: string;
    investedAumPercent?: number | null;
    rating?: number | null;
    return1y?: number | null;
    return3y?: number | null;
  }>;
}

interface NseArchiveEntry {
  symbol: string;
  companyName: string;
  series: string;
  listingDate: string;
  marketLot: number | null;
  isin: string;
  faceValue: number | null;
}

interface ZerodhaInstrumentEntry {
  instrumentToken: number;
  exchangeToken: string;
  tradingsymbol: string;
  companyName: string;
  tickSize: number | null;
  lotSize: number | null;
}

interface BhavcopyEntry {
  isin: string;
  symbol: string;
  bseCode: string;
  series: string;
  name: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  last: number | null;
  prevClose: number | null;
  volume: number | null;
  lotSize: number | null;
  tradDt: string;
}

const INDEX_CACHE_TTL_MS = 20_000;
const QUOTE_CACHE_TTL_MS = 15_000;
const UNIVERSE_CACHE_TTL_MS = 30_000;
const REGISTRY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const BHAVCOPY_CACHE_TTL_MS = 15 * 60 * 1000;
const lastFetchMap = new Map<string, number>();

let liveUniverseCache: StockInstrument[] = [];
let liveUniverseLastSynced = 0;
let liveUniverseReachable = false;
let inflightUniverseSync: Promise<StockInstrument[]> | null = null;

// Cached official NSE CSV + Zerodha Kite instrument registries + NSE/BSE UDiFF Bhavcopies
const nseArchiveMap = new Map<string, NseArchiveEntry>();
const zerodhaNseMap = new Map<string, ZerodhaInstrumentEntry>();
const zerodhaBseMap = new Map<string, ZerodhaInstrumentEntry>();
let zerodhaNseList: ZerodhaInstrumentEntry[] = [];
let zerodhaBseList: ZerodhaInstrumentEntry[] = [];
let registryLastSynced = 0;
let inflightRegistrySync: Promise<void> | null = null;

const nseBhavByIsin = new Map<string, BhavcopyEntry>();
const nseBhavBySym = new Map<string, BhavcopyEntry>();
const bseBhavByIsin = new Map<string, BhavcopyEntry>();
const bseBhavByCode = new Map<string, BhavcopyEntry>();
const bseBhavBySym = new Map<string, BhavcopyEntry>();
let bhavcopyLastSynced = 0;
let inflightBhavcopySync: Promise<void> | null = null;

// Per-symbol live quote cache for stocks hydrated via accord_points / Yahoo outside Groww all_stocks
const liveQuoteHydrationCache = new Map<
  string,
  { quote: ExchangeLiveQuote; fetchedAt: number }
>();

// Persistent disk enrichment cache (industryCode -> industryName, verified logoUrls, fundamentals, hydrated quotes)
interface CachedStockEnrichment {
  searchId?: string;
  sector?: string;
  industry?: string;
  logoUrl?: string | null;
  marketCapCr?: number | null;
  week52High?: number | null;
  week52Low?: number | null;
  fundamentals?: StockInstrument['fundamentals'];
  companyProfile?: StockCompanyProfile | null;
  updatedAt: string;
}

interface MarketEnrichmentStore {
  industryCodes: Record<string, string>;
  logos: Record<string, string>;
  details: Record<string, CachedStockEnrichment>;
  quotes: Record<string, { quote: ExchangeLiveQuote; fetchedAt: number }>;
}

const ENRICHMENT_FILE = path.resolve(process.cwd(), 'server', 'data', 'market-enrichment.json');
let enrichmentStore: MarketEnrichmentStore | null = null;
let enrichmentSaveTimer: ReturnType<typeof setTimeout> | null = null;
const industryCodeSamples = new Map<number, string>();
const negativeLogoProbeCache = new Map<string, number>();

function getEnrichmentStore(): MarketEnrichmentStore {
  if (enrichmentStore) return enrichmentStore;
  try {
    if (fs.existsSync(ENRICHMENT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ENRICHMENT_FILE, 'utf8')) as Partial<MarketEnrichmentStore>;
      enrichmentStore = {
        industryCodes: parsed.industryCodes || {},
        logos: parsed.logos || {},
        details: parsed.details || {},
        quotes: parsed.quotes || {},
      };
      // Warm in-memory quote hydration cache from disk (if < 24h old)
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      for (const [sym, q] of Object.entries(enrichmentStore.quotes)) {
        if (q && q.quote && q.fetchedAt > cutoff) {
          liveQuoteHydrationCache.set(sym, q);
        }
      }
      return enrichmentStore;
    }
  } catch {
    // ignore corrupted cache and recreate cleanly
  }
  enrichmentStore = { industryCodes: {}, logos: {}, details: {}, quotes: {} };
  return enrichmentStore;
}

function scheduleEnrichmentSave(): void {
  if (enrichmentSaveTimer) return;
  enrichmentSaveTimer = setTimeout(() => {
    enrichmentSaveTimer = null;
    if (!enrichmentStore) return;
    try {
      const dir = path.dirname(ENRICHMENT_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = `${ENRICHMENT_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(enrichmentStore), 'utf8');
      fs.renameSync(tmp, ENRICHMENT_FILE);
    } catch {
      // ignore disk write issues in read-only environments
    }
  }, 1500);
  if (typeof enrichmentSaveTimer.unref === 'function') {
    enrichmentSaveTimer.unref();
  }
}

export function getCachedLogoUrl(symbol?: string | null, bseCode?: string | null): string | null {
  const store = getEnrichmentStore();
  const sym = symbol ? symbol.trim().toUpperCase() : '';
  const bse = bseCode && /^\d{6}$/.test(bseCode.trim()) ? bseCode.trim() : '';
  if (sym && store.logos[sym]) return store.logos[sym];
  if (bse && store.logos[bse]) return store.logos[bse];
  if (sym && store.details[sym]?.logoUrl) return store.details[sym].logoUrl ?? null;
  return null;
}

export function recordVerifiedLogoUrl(
  symbol: string | null | undefined,
  bseCode: string | null | undefined,
  logoUrl: string | null | undefined
): void {
  const normalized = normalizeGrowwLogoUrl(logoUrl) || (logoUrl && logoUrl.startsWith('https://') ? logoUrl : null);
  if (!normalized) return;
  const store = getEnrichmentStore();
  let changed = false;
  const sym = symbol ? symbol.trim().toUpperCase() : '';
  const bse = bseCode && /^\d{6}$/.test(bseCode.trim()) ? bseCode.trim() : '';
  if (sym && store.logos[sym] !== normalized) {
    store.logos[sym] = normalized;
    changed = true;
  }
  if (bse && store.logos[bse] !== normalized) {
    store.logos[bse] = normalized;
    changed = true;
  }
  if (liveUniverseCache.length > 0 && (sym || bse)) {
    for (const s of liveUniverseCache) {
      if ((sym && s.symbol.toUpperCase() === sym) || (bse && s.bseCode === bse)) {
        if (!s.logoUrl) s.logoUrl = normalized;
      }
    }
  }
  if (changed) scheduleEnrichmentSave();
}

function round2(n: number | null | undefined): number | null {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  return Number(n.toFixed(2));
}

function toIsoFromEpochSec(sec: number | null | undefined): string | null {
  if (!sec || !Number.isFinite(sec)) return null;
  const ms = sec > 1e12 ? sec : sec * 1000;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseNumericFundamental(val: string | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[₹,%xCr,\s]/gi, '');
  if (!cleaned || cleaned === '-' || cleaned.toLowerCase() === 'na') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

async function fetchTextWithTimeout(url: string, timeoutMs = 6000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PriceAlerter/1.0',
        Accept: 'text/csv, text/plain, */*',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBufferWithTimeout(url: string, timeoutMs = 8000): Promise<Buffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PriceAlerter/1.0)',
        Accept: '*/*',
      },
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function unzipFirstFile(buf: Buffer): string | null {
  try {
    if (buf.length < 30 || buf.readUInt32LE(0) !== 0x04034b50) return null;
    const flags = buf.readUInt16LE(6);
    const compMethod = buf.readUInt16LE(8);
    const compSize = buf.readUInt32LE(18);
    const nameLen = buf.readUInt16LE(26);
    const extraLen = buf.readUInt16LE(28);
    const dataStart = 30 + nameLen + extraLen;
    if (compMethod === 0) {
      return buf.subarray(dataStart, dataStart + compSize).toString('utf8');
    }
    if (compMethod === 8) {
      const end =
        (flags & 0x08) !== 0 || compSize === 0
          ? buf.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), dataStart)
          : dataStart + compSize;
      const slice = buf.subarray(dataStart, end > 0 ? end : undefined);
      return zlib.inflateRawSync(slice).toString('utf8');
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchJsonWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 4500
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'PriceAlerter/1.0',
        Accept: 'application/json, text/plain, */*',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function stripNseSeriesSuffix(sym: string): string {
  return sym.replace(/-(EQ|BE|BZ|SM|ST|BL|IT|IV|RR|RE\d*)$/i, '');
}

const KNOWN_ACRONYMS = new Set([
  'LTD',
  'PVT',
  'LLP',
  'LLC',
  'BSE',
  'NSE',
  'IT',
  'NBFC',
  'HFCL',
  'ITC',
  'BHEL',
  'ONGC',
  'NTPC',
  'GAIL',
  'SAIL',
  'MRF',
  'CEAT',
  'TVS',
  'SBI',
  'HDFC',
  'ICICI',
  'IDFC',
  'IIFL',
  'NSDL',
  'CDSL',
  'MCX',
  'NHPC',
  'SJVN',
  'IRFC',
  'IRCTC',
  'HAL',
  'BEL',
  'BEML',
  'NMDC',
  'IOC',
  'BPCL',
  'HPCL',
  'PSU',
  'USA',
  'UK',
  'II',
  'III',
  'IV',
]);

function smartTitleCaseCorporate(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      if (KNOWN_ACRONYMS.has(upper) || /^[A-Z0-9&.-]{1,3}$/.test(word)) {
        if (upper === 'OF' || upper === 'IN' || upper === 'ON' || upper === 'TO' || upper === 'FOR') {
          return word.toLowerCase();
        }
        return upper;
      }
      if (/^[A-Z]{2,}$/.test(word)) {
        return word.charAt(0) + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(' ');
}

function formatSearchIdAsName(searchId?: string | null): string | null {
  if (!searchId) return null;
  const cleaned = searchId.trim().replace(/-ltd$/i, ' Ltd').replace(/-limited$/i, ' Limited');
  const words = cleaned
    .split(/[-_]+/)
    .map((w) => w.trim())
    .filter((w) => w && !/^\d+$/.test(w));
  if (words.length < 2) return null;
  return smartTitleCaseCorporate(words.join(' '));
}

function pickCleanAlphaSymbol(candidates: Array<string | null | undefined>, fallback = ''): string {
  for (const raw of candidates) {
    if (!raw) continue;
    const sym = stripNseSeriesSuffix(String(raw).trim().toUpperCase());
    if (!sym || sym === 'N/A' || /^\d+$/.test(sym)) continue;
    if (/[A-Z]/.test(sym)) return sym;
  }
  return fallback;
}

function pickBestCompanyName(params: {
  primary?: string | null;
  curated?: string | null;
  nseArch?: string | null;
  kiteNse?: string | null;
  kiteBse?: string | null;
  bhavName?: string | null;
  searchId?: string | null;
  symbol: string;
  bseCode?: string | null;
}): string {
  const symUpper = params.symbol.trim().toUpperCase();
  const bseStr = (params.bseCode || '').trim();
  const clean = (v?: string | null) =>
    v ? v.replace(/\s+/g, ' ').trim() : '';

  const isUseful = (v: string) => {
    if (!v || v === 'N/A' || /^\d+$/.test(v)) return false;
    if (bseStr && v === bseStr) return false;
    return true;
  };

  const isAllCaps = (v: string) => v === v.toUpperCase() && /[A-Z]/.test(v);
  const isDescriptive = (v: string) =>
    isUseful(v) && v.toUpperCase() !== symUpper && (v.includes(' ') || v.length > symUpper.length + 1);

  const ordered = [
    clean(params.nseArch),
    clean(params.primary),
    clean(params.curated),
    clean(params.kiteNse),
    clean(params.kiteBse),
    clean(params.bhavName),
  ].filter(isUseful);

  // Prefer mixed-case descriptive corporate names first (e.g. "ITC Limited", "J.B. Chemicals & Pharmaceuticals Ltd")
  const mixedDescriptive = ordered.find((c) => isDescriptive(c) && !isAllCaps(c));
  if (mixedDescriptive) return mixedDescriptive;

  // Next prefer any descriptive name from registries (converting noisy ALL CAPS cleanly)
  const anyDescriptive = ordered.find((c) => isDescriptive(c));
  if (anyDescriptive) {
    return isAllCaps(anyDescriptive) ? smartTitleCaseCorporate(anyDescriptive) : anyDescriptive;
  }

  // If registries only returned an abbreviation matching symbol (e.g. "LTM"), try multi-word searchId
  const fromSlug = formatSearchIdAsName(params.searchId);
  if (fromSlug && isDescriptive(fromSlug)) return fromSlug;

  // Otherwise fallback to best non-numeric candidate or symbol
  const anyUseful = ordered[0];
  if (anyUseful) return isAllCaps(anyUseful) && anyUseful.length > 5 ? smartTitleCaseCorporate(anyUseful) : anyUseful;
  return params.symbol;
}

export function normalizeGrowwLogoUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('http://')) return trimmed.replace(/^http:\/\//i, 'https://');
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `https://assets-netstorage.groww.in${trimmed}`;
  return null;
}

const growwSearchIdLogoCache = new Map<string, string | null>();
export async function resolveGrowwLogoBySearchId(searchId: string): Promise<string | null> {
  const cleanId = searchId.trim();
  if (!cleanId) return null;
  if (growwSearchIdLogoCache.has(cleanId)) {
    return growwSearchIdLogoCache.get(cleanId) ?? null;
  }
  const info = await fetchGrowwCompanyDetails(cleanId);
  const url = normalizeGrowwLogoUrl(info?.header?.logoUrl);
  if (growwSearchIdLogoCache.size > 2000) {
    const first = growwSearchIdLogoCache.keys().next().value;
    if (first) growwSearchIdLogoCache.delete(first);
  }
  growwSearchIdLogoCache.set(cleanId, url);
  return url;
}

export function isNonEquityInstrument(
  sym: string,
  name: string,
  series = '',
  isin = ''
): boolean {
  const s = sym.trim().toUpperCase();
  const n = name.trim();
  const srs = series.trim().toUpperCase();
  const isinU = isin.trim().toUpperCase();

  // Exclude ETF indicative NAV (iNAV) tickers and Sovereign / GOI Strips / NCDs / Debt
  if (!s) return true;
  if (/INAV/i.test(s) || /-RL$/i.test(s) || /\bI-?NAV\b/i.test(n)) return true;
  if (/^GS\d{4,}/i.test(s)) return true;
  if (/^\d+(?:GS|GSEC|TB|SDL|NCD)/i.test(s)) return true;
  if (/-(N\d|N[A-Z]|Y[A-Z0-9]|Z[A-Z0-9]|S[A-Z]|D\d|GB|GS|SG|SD|RL)$/i.test(s)) return true;
  if (/^(SGB|SDL|TBILL|GOI|NHAI\d|IRFC\d|PFC\d|REC\d|NTPC\d)/i.test(s)) return true;
  if (/FMP\d+[A-Z]*$/i.test(s) || /\bFMP\b/i.test(n)) return true;
  if (/-(W\d+|RE\d*|PP)$/i.test(s) || /\b(WARRANTS?|RIGHTS\s+ENTITLEMENT)\b/i.test(n)) return true;
  // Allow valid 6-digit BSE equity scrip codes (e.g. 500325), reject debt codes starting with digits
  if (/^\d/.test(s) && !/^5\d{5}$/.test(s)) return true;

  if (
    /\b(GOI\s+STRIPS?|G-?SEC|T-?BILL|TREASURY\s+BILL|GOLDBONDS|NON[- ]?CONVERTIBLE\s+DEBENTURE|ZERO\s+COUPON\s+BOND|SOVEREIGN\s+GOLD)\b/i.test(
      n
    )
  ) {
    return true;
  }
  if (/(?:^|\s)\d+(?:\.\d+)?%\s*(?:GOI|G-?SEC|SDL|BOND|NCD|DEBENTURE)/i.test(n)) {
    return true;
  }

  if (srs) {
    if (['GB', 'GS', 'TB', 'SG', 'RL', 'F', 'G', 'H', 'W1', 'W2', 'RE'].includes(srs)) return true;
    if (/^(N|Y|Z)[A-Z0-9]$/.test(srs)) return true;
  }
  if (isinU && isinU.startsWith('IN00')) return true; // Government securities ISIN prefix
  return false;
}

const GENERIC_SECTORS = new Set([
  'NSE / BSE Equity',
  'NSE Listed Equity',
  'BSE Listed Equity',
  'NSE / BSE SME',
  'Listed Equity',
  'Indian Listed Equity',
  'SME Growth Equities',
]);

function isGenericSector(sec?: string | null): boolean {
  return !sec || !sec.trim() || GENERIC_SECTORS.has(sec.trim());
}

export function normalizeSectorLabel(sec: string): string {
  const s = sec.trim();
  if (s === 'Banking & Financial Services') return 'Financial Services';
  if (s === 'IT & Software') return 'Information Technology';
  if (s === 'Pharmaceuticals & Healthcare') return 'Pharmaceuticals';
  if (s === 'Infrastructure & Realty') return 'Infrastructure';
  if (s === 'FMCG & Consumer') return 'FMCG';
  if (s === 'Power & Renewables') return 'Power';
  if (s === 'Oil, Gas & Petrochemicals') return 'Oil';
  return s;
}

function inferSectorFromCompanyName(name: string, isEtf = false): string {
  if (isEtf || /\bETF\b|\bBEES\b|\bNIFTY\b.*\bFUND\b|\bINDEX FUND\b/i.test(name)) {
    return 'ETF & Index Funds';
  }
  const n = name.toUpperCase();
  if (/\b(BANKS?|BANKING)\b/.test(n)) {
    return 'Banks';
  }
  if (/\b(INSURANCE|ASSURANCE|REINSURANCE|GENERAL INS|LIFE INS)\b/.test(n)) {
    return 'Insurance';
  }
  if (/\b(FINANCE|FINSERV|FINANCIAL|CREDIT|CAPITAL|NBFC|SECURITIES|BROKING|INVESTMENTS?|FINVEST|VENTURES?|HOLDINGS?|LEASING|HOUSING FIN|MICROFINANCE|ASSET MANAGEMENT|AMC|TRUST|MERCANTILE|FINCORP|MONEY)\b/.test(n)) {
    return 'Financial Services';
  }
  if (/\b(PHARMA|PHARMACEUTICALS?|HEALTHCARE|HOSPITALS?|LABS?|LABORATORIES|LIFESCIENCES?|LIFE SCIENCES?|BIOSCIENCES?|BIOTECH|DIAGNOSTICS?|MEDTECH|MEDITECH|MEDICAL|REMEDIES|SURGICALS?|HEALTH|CLINICS?|WELLNESS)\b/.test(n)) {
    return 'Pharmaceuticals';
  }
  if (/\b(SOFTWARES?|INFOTECH|TECH|TECHNOLOG(?:Y|IES)|SYSTEMS?|DIGITAL|IT SERVICES|CYBER|CLOUD|DATA|TELEMATICS|SOLUTIONS?|COMPUTECH|COMPUTERS?|INFORMATICS?|AI|SEMICONDUCTOR)\b/.test(n)) {
    return 'Information Technology';
  }
  if (/\b(POWER|ENERGY|SOLAR|RENEWABLES?|WIND|HYDRO|ELECTRIC|GRID|TURBINES?|GENCO|TRANSCO|GREEN ENERGY)\b/.test(n)) {
    return 'Power';
  }
  if (/\b(PETROL|PETROLEUM|REFINER(?:Y|IES)|OIL|GAS|PETROCHEM|LUBRICANTS?|DRILLING|FUELS?)\b/.test(n)) {
    return 'Oil';
  }
  if (/\b(AUTO|AUTOMOTIVE|MOTORS?|TYRES?|FORGINGS?|AXLES?|GEARS?|MOBILITY|SCOOTERS?|TRACTORS?|COACH|FURNISH|AUTOPARTS|AUTO PARTS)\b/.test(n)) {
    return 'Auto Manufacturers';
  }
  if (/\b(STEELS?|METALS?|ALUMINIUM|ALUMINUM|COPPER|ZINC|IRON|MINING|MINERALS?|ALLOYS?|FERRO|FORGE|CASTINGS?|FOUNDRY|PIPES?|TUBES?|ISPAT|METALLICS?|STAINLESS)\b/.test(n)) {
    return 'Metals & Mining';
  }
  if (/\b(CEMENTS?|CONCRETE)\b/.test(n)) {
    return 'Cement';
  }
  if (/\b(PAINTS?|COATINGS?)\b/.test(n)) {
    return 'Paints';
  }
  if (/\b(CHEM|CHEMICALS?|PETROCHEMICALS?|FERTILIZERS?|AGROCHEM|PESTICIDES?|POLYMERS?|PLASTICS?|RESINS?|DYES|PIGMENTS?|ALKALI|SODA|ACIDS?|SPECIALTY|ORGANICS?|SOLVENTS?)\b/.test(n)) {
    return 'Chemicals & Materials';
  }
  if (/\b(INFRA|INFRASTRUCTURE|CONSTRUCTIONS?|REALTY|ESTATES?|HOUSING|BUILDERS?|DEVELOPERS?|BUILDCON|PROJECTS?|HIGHWAYS?|TOLL|PROPERTIES|LAND|REAL\s*ESTATE|ENGINEERS?)\b/.test(n)) {
    return 'Infrastructure';
  }
  if (/\b(JEWELL?ER[YS]?|GEMS?|DIAMONDS?|GOLD|BULLION|ORNAMENTS?)\b/.test(n)) {
    return 'Jewellery';
  }
  if (/\b(FOODS?|DAIRY|SUGARS?|TEA|COFFEE|BEVERAGES?|BREWERIES|DISTILLERIES|FLOUR|SPICES?|MILK|CHOCOLATES?|SWEETS?|ANGITHI|CATERING|RESTAURANTS?|GRAIN|RICE|EDIBLE)\b/.test(n)) {
    return 'Food & Beverages';
  }
  if (/\b(AGRO|AGRICULTURE|SEEDS?|PLANTATIONS?|AQUA|SEAFOODS?|POULTRY|CROPS?|FARMING)\b/.test(n)) {
    return 'Agro & Commodities';
  }
  if (/\b(RETAIL|MART|SUPERMARKET|HYPERMARKET|STORES?|FASHION|LIFESTYLE|FOOTWEAR|BAZAAR)\b/.test(n)) {
    return 'Retail Chains';
  }
  if (/\b(FMCG|CONSUMER|PERSONAL CARE|COSMETICS?|HYGIENE|HOME CARE)\b/.test(n)) {
    return 'FMCG';
  }
  if (/\b(TEXTILES?|APPARELS?|GARMENTS?|SPINNING|SPINNERS?|WEAVERS?|YARNS?|COTTON|FABRICS?|DENIM|WEAVING|MILLS?|SYNTHETICS?|SILKS?|KNITWEAR|WOOL)\b/.test(n)) {
    return 'Textiles & Apparel';
  }
  if (/\b(MARITIME|SHIPPING|PORTS?|MARINE|DOCK|SHIPYARD)\b/.test(n)) {
    return 'Maritime Industries';
  }
  if (/\b(AVIATION|AIRLINES?|AIRWAYS|AIRPORTS?)\b/.test(n)) {
    return 'Aviation';
  }
  if (/\b(LOGISTICS?|TRANSPORTS?|CARGO|FREIGHT|WAREHOUS(?:ING|E)|RAIL|CONTAINER|COURIER|SUPPLY CHAIN)\b/.test(n)) {
    return 'Logistics & Transport';
  }
  if (/\b(TELECOM|COMMUNICATIONS?|OPTICAL FIBER|CABLE TV|NETWORKS?)\b/.test(n)) {
    return 'Telecom';
  }
  if (/\b(MEDIA|ENTERTAINMENT|BROADCAST|TELEVISION|FILMS?|PUBLISHING|PRINTING|STUDIOS?|NEWS)\b/.test(n)) {
    return 'Media & Publishing';
  }
  if (/\b(DEFENCE|DEFENSE|AEROSPACE|MUNITIONS?|ORDNANCE)\b/.test(n)) {
    return 'Defence';
  }
  if (/\b(ENGINEERING|ELECTRONICS?|ELECTRICALS?|MACHINERY|EQUIPMENTS?|CABLES?|WIRES?|SWITCHGEAR|BEARINGS?|TRANSFORMERS?|PUMPS?|VALVES?|PRECISION|HEAVY|MOTORS?|TOOLS|AUTOMATION)\b/.test(n)) {
    return 'Capital Goods & Engineering';
  }
  if (/\b(HOTELS?|HOSPITALITY|RESORTS?|TOURISM|TRAVEL|LEISURE|CLUBS?)\b/.test(n)) {
    return 'Hospitality & Tourism';
  }
  if (/\b(PAPERS?|PACKAGING|BOX|CARTONS?|PRINTPACK|GLASS|CERAMICS?|TILES?|MARBLES?|GRANITES?|PLYWOOD|LAMINATES?)\b/.test(n)) {
    return 'Packaging & Building Materials';
  }
  if (/\b(TRADING|EXPORTS?|IMPORTS?|OVERSEAS|DISTRIBUTORS?|DISTRIBUTIONS?|COMMERCE|TRADELINK|GLOBAL|ENTERPRISES?|MERCHANDISE)\b/.test(n)) {
    return 'Distributors';
  }
  return 'Diversified Industrials';
}

function resolveSectorForStock(params: {
  companyName: string;
  industryCode?: number;
  curatedSector?: string | null;
  curatedIndustry?: string | null;
  symbol: string;
  isEtf?: boolean;
  isSme?: boolean;
}): { sector: string; industry: string } {
  const store = getEnrichmentStore();
  const detail = store.details[params.symbol.toUpperCase()];
  const mappedCodeName =
    typeof params.industryCode === 'number' && params.industryCode > 0
      ? store.industryCodes[String(params.industryCode)]
      : undefined;

  const explicitSector =
    (!isGenericSector(detail?.sector) ? detail?.sector : undefined) ??
    mappedCodeName ??
    (!isGenericSector(params.curatedSector) ? params.curatedSector : undefined);

  const rawSector =
    explicitSector ||
    inferSectorFromCompanyName(params.companyName, params.isEtf);
  const sector = normalizeSectorLabel(rawSector);

  const rawIndustry =
    (!isGenericSector(detail?.industry) ? detail?.industry : undefined) ??
    mappedCodeName ??
    (!isGenericSector(params.curatedIndustry) ? params.curatedIndustry : undefined) ??
    sector;
  const industry = normalizeSectorLabel(rawIndustry);

  return { sector, industry };
}

async function syncOfficialRegistries(): Promise<void> {
  if (
    registryLastSynced > 0 &&
    Date.now() - registryLastSynced < REGISTRY_CACHE_TTL_MS &&
    nseArchiveMap.size > 0
  ) {
    return;
  }
  if (inflightRegistrySync) {
    return inflightRegistrySync;
  }

  inflightRegistrySync = (async () => {
    try {
      const [nseCsv, smeCsv, kiteNseCsv, kiteBseCsv] = await Promise.all([
        fetchTextWithTimeout('https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv', 7000),
        fetchTextWithTimeout('https://nsearchives.nseindia.com/content/equities/SME_EQUITY_L.csv', 6000),
        fetchTextWithTimeout('https://api.kite.trade/instruments/NSE', 9000),
        fetchTextWithTimeout('https://api.kite.trade/instruments/BSE', 9000),
      ]);

      const parseNseCsv = (csv: string | null) => {
        if (!csv) return;
        const lines = csv.split(/\r?\n/).slice(1);
        for (const line of lines) {
          if (!line.trim() || line.startsWith('**')) continue;
          const cols = splitCsvLine(line);
          if (cols.length < 8) continue;
          const sym = cols[0]?.toUpperCase();
          const compName = cols[1] || sym;
          const series = cols[2] || 'EQ';
          const isin = cols[6] || '';
          if (!sym || isNonEquityInstrument(sym, compName, series, isin)) continue;
          nseArchiveMap.set(sym, {
            symbol: sym,
            companyName: compName,
            series,
            listingDate: cols[3] || '',
            marketLot: Number.isFinite(Number(cols[5])) ? Number(cols[5]) : null,
            isin,
            faceValue: Number.isFinite(Number(cols[7])) ? Number(cols[7]) : null,
          });
        }
      };

      parseNseCsv(nseCsv);
      parseNseCsv(smeCsv);

      if (kiteNseCsv) {
        const nextList: ZerodhaInstrumentEntry[] = [];
        const lines = kiteNseCsv.split(/\r?\n/).slice(1);
        for (const line of lines) {
          if (!line.trim()) continue;
          const cols = splitCsvLine(line);
          if (cols.length < 12) continue;
          if (cols[10] !== 'NSE' || cols[9] !== 'EQ') continue;
          const sym = cols[2]?.toUpperCase();
          const token = Number(cols[0]);
          if (!sym || !Number.isFinite(token)) continue;
          const entry: ZerodhaInstrumentEntry = {
            instrumentToken: token,
            exchangeToken: cols[1] || '',
            tradingsymbol: sym,
            companyName: (cols[3] || sym).replace(/^"|"$/g, '').trim(),
            tickSize: Number.isFinite(Number(cols[7])) ? Number(cols[7]) : null,
            lotSize: Number.isFinite(Number(cols[8])) ? Number(cols[8]) : null,
          };
          zerodhaNseMap.set(sym, entry);
          const cleanBase = stripNseSeriesSuffix(sym);
          if (!zerodhaNseMap.has(cleanBase)) zerodhaNseMap.set(cleanBase, entry);
          if (!isNonEquityInstrument(sym, entry.companyName)) {
            nextList.push(entry);
          }
        }
        zerodhaNseList = nextList;
      }

      if (kiteBseCsv) {
        const nextList: ZerodhaInstrumentEntry[] = [];
        const lines = kiteBseCsv.split(/\r?\n/).slice(1);
        for (const line of lines) {
          if (!line.trim()) continue;
          const cols = splitCsvLine(line);
          if (cols.length < 12) continue;
          if (cols[10] !== 'BSE' || cols[9] !== 'EQ') continue;
          const exToken = cols[1]?.trim();
          const sym = cols[2]?.toUpperCase();
          const token = Number(cols[0]);
          if (!exToken || !Number.isFinite(token)) continue;
          const entry: ZerodhaInstrumentEntry = {
            instrumentToken: token,
            exchangeToken: exToken,
            tradingsymbol: sym || exToken,
            companyName: (cols[3] || sym || exToken).replace(/^"|"$/g, '').trim(),
            tickSize: Number.isFinite(Number(cols[7])) ? Number(cols[7]) : null,
            lotSize: Number.isFinite(Number(cols[8])) ? Number(cols[8]) : null,
          };
          zerodhaBseMap.set(exToken, entry);
          if (sym) zerodhaBseMap.set(sym, entry);
          if (
            exToken.startsWith('5') &&
            exToken.length === 6 &&
            !isNonEquityInstrument(entry.tradingsymbol, entry.companyName)
          ) {
            nextList.push(entry);
          }
        }
        zerodhaBseList = nextList;
      }

      if (nseArchiveMap.size > 0 || zerodhaNseMap.size > 0 || zerodhaBseMap.size > 0) {
        registryLastSynced = Date.now();
      }
    } finally {
      inflightRegistrySync = null;
    }
  })();

  return inflightRegistrySync;
}

function getRecentIstDateStrings(days = 7): string[] {
  const out: string[] = [];
  const nowIstMs = Date.now() + 5.5 * 3600_000;
  for (let i = 0; i < days; i++) {
    const d = new Date(nowIstMs - i * 86_400_000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    out.push(`${yyyy}${mm}${dd}`);
  }
  return out;
}

function isNseEquitySeries(series: string, isin: string): boolean {
  if (!isin || (!isin.startsWith('INE') && !isin.startsWith('INF'))) return false;
  const s = series.toUpperCase();
  if (['GB', 'GS', 'TB', 'SG'].includes(s)) return false;
  if (/^(N|Y|Z)[A-Z0-9]$/.test(s)) return false;
  return true;
}

function isBseEquitySeries(series: string, isin: string): boolean {
  if (!isin || (!isin.startsWith('INE') && !isin.startsWith('INF'))) return false;
  const s = series.toUpperCase();
  if (['F', 'G', 'H'].includes(s)) return false;
  return true;
}

function parseBhavcopyRows(
  csvText: string,
  exchange: 'NSE' | 'BSE'
): BhavcopyEntry[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  const colIdx = (name: string) => headers.indexOf(name);

  const iTradDt = colIdx('TradDt');
  const iTp = colIdx('FinInstrmTp');
  const iId = colIdx('FinInstrmId');
  const iIsin = colIdx('ISIN');
  const iSym = colIdx('TckrSymb');
  const iSrs = colIdx('SctySrs');
  const iNm = colIdx('FinInstrmNm');
  const iOpn = colIdx('OpnPric');
  const iHgh = colIdx('HghPric');
  const iLw = colIdx('LwPric');
  const iCls = colIdx('ClsPric');
  const iLast = colIdx('LastPric');
  const iPrev = colIdx('PrvsClsgPric');
  const iVol = colIdx('TtlTradgVol');
  const iLot = colIdx('NewBrdLotQty');

  const entries: BhavcopyEntry[] = [];
  for (let r = 1; r < lines.length; r++) {
    const line = lines[r];
    if (!line || !line.trim()) continue;
    const cols = splitCsvLine(line);
    const tp = cols[iTp] || '';
    if (tp !== 'STK') continue;
    const isin = (cols[iIsin] || '').trim().toUpperCase();
    const series = (cols[iSrs] || '').trim().toUpperCase();
    const sym = (cols[iSym] || '').trim().toUpperCase();
    const instName = (cols[iNm] || sym).trim();
    if (!sym || !isin) continue;

    if (exchange === 'NSE' && !isNseEquitySeries(series, isin)) continue;
    if (exchange === 'BSE' && !isBseEquitySeries(series, isin)) continue;
    if (isNonEquityInstrument(sym, instName, series, isin)) continue;

    const num = (idx: number) => {
      const v = Number(cols[idx]);
      return Number.isFinite(v) && v > 0 ? round2(v) : null;
    };
    const intNum = (idx: number) => {
      const v = Number(cols[idx]);
      return Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
    };

    const close = num(iCls);
    const last = num(iLast) ?? close;
    entries.push({
      isin,
      symbol: sym,
      bseCode: exchange === 'BSE' ? (cols[iId] || '').trim() : '',
      series,
      name: (cols[iNm] || sym).trim(),
      open: num(iOpn),
      high: num(iHgh),
      low: num(iLw),
      close,
      last,
      prevClose: num(iPrev),
      volume: intNum(iVol),
      lotSize: intNum(iLot),
      tradDt: (cols[iTradDt] || '').trim(),
    });
  }
  return entries;
}

async function syncExchangeBhavcopies(force = false): Promise<void> {
  if (
    !force &&
    bhavcopyLastSynced > 0 &&
    Date.now() - bhavcopyLastSynced < BHAVCOPY_CACHE_TTL_MS &&
    (nseBhavByIsin.size > 0 || bseBhavByIsin.size > 0)
  ) {
    return;
  }
  if (inflightBhavcopySync) {
    return inflightBhavcopySync;
  }

  inflightBhavcopySync = (async () => {
    try {
      const candidates = getRecentIstDateStrings(7);

      const fetchNseBhav = async () => {
        for (const dt of candidates) {
          const url = `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${dt}_F_0000.csv.zip`;
          const buf = await fetchBufferWithTimeout(url, 8000);
          if (buf) {
            const csv = unzipFirstFile(buf);
            if (csv && csv.includes('TckrSymb')) {
              const rows = parseBhavcopyRows(csv, 'NSE');
              if (rows.length > 100) {
                nseBhavByIsin.clear();
                nseBhavBySym.clear();
                for (const row of rows) {
                  if (!nseBhavByIsin.has(row.isin)) nseBhavByIsin.set(row.isin, row);
                  if (!nseBhavBySym.has(row.symbol)) nseBhavBySym.set(row.symbol, row);
                }
                return;
              }
            }
          }
        }
      };

      const fetchBseBhav = async () => {
        for (const dt of candidates) {
          const url = `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${dt}_F_0000.CSV`;
          const csv = await fetchTextWithTimeout(url, 8000);
          if (csv && csv.includes('TckrSymb')) {
            const rows = parseBhavcopyRows(csv, 'BSE');
            if (rows.length > 100) {
              bseBhavByIsin.clear();
              bseBhavByCode.clear();
              bseBhavBySym.clear();
              for (const row of rows) {
                if (!bseBhavByIsin.has(row.isin)) bseBhavByIsin.set(row.isin, row);
                if (row.bseCode && !bseBhavByCode.has(row.bseCode)) bseBhavByCode.set(row.bseCode, row);
                if (!bseBhavBySym.has(row.symbol)) bseBhavBySym.set(row.symbol, row);
              }
              return;
            }
          }
        }
      };

      await Promise.all([fetchNseBhav(), fetchBseBhav()]);
      if (nseBhavByIsin.size > 0 || bseBhavByIsin.size > 0) {
        bhavcopyLastSynced = Date.now();
      }
    } finally {
      inflightBhavcopySync = null;
    }
  })();

  return inflightBhavcopySync;
}

async function fetchYahooChart(
  yahooSymbol: string,
  range = '1mo',
  interval = '1d'
): Promise<YahooChartResponse | null> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol
  )}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

  const data = await fetchJsonWithTimeout<YahooChartResponse>(url, {}, 4000);
  if (!data?.chart?.result?.[0]) return null;
  return data;
}

function parseYahooCandles(data: YahooChartResponse): StockHistoricalPoint[] {
  const result = data.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  if (!quote) return [];

  const points: StockHistoricalPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = quote.close?.[i];
    if (close === null || close === undefined || Number.isNaN(close)) continue;
    const open = quote.open?.[i] ?? close;
    const high = quote.high?.[i] ?? Math.max(open, close);
    const low = quote.low?.[i] ?? Math.min(open, close);
    const volume = quote.volume?.[i] ?? 0;
    const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
    points.push({
      date,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.round(volume),
    });
  }
  return points;
}

async function fetchGrowwLiveQuote(
  exchange: 'NSE' | 'BSE',
  scripCode: string
): Promise<ExchangeLiveQuote | null> {
  const url = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/${exchange}/segment/CASH/latest_prices_ohlc/${encodeURIComponent(
    scripCode
  )}`;
  const dto = await fetchJsonWithTimeout<GrowwLivePriceDto>(url, {}, 3500);
  if (!dto || (typeof dto.ltp !== 'number' && typeof dto.close !== 'number')) {
    return null;
  }
  const ltp = round2(dto.ltp ?? dto.close);
  const previousClose =
    typeof dto.dayChange === 'number' && dto.dayChange !== 0 && ltp !== null
      ? round2(ltp - dto.dayChange)
      : round2(dto.close ?? dto.ltp);
  return {
    ltp,
    previousClose,
    open: round2(dto.open),
    high: round2(dto.high),
    low: round2(dto.low),
    dayChange: round2(dto.dayChange),
    dayChangePct: round2(dto.dayChangePerc),
    volume: typeof dto.volume === 'number' ? Math.round(dto.volume) : null,
    lastTradeTime: toIsoFromEpochSec(dto.lastTradeTime ?? dto.tsInMillis),
    lastTradeQty: typeof dto.lastTradeQty === 'number' ? Math.round(dto.lastTradeQty) : null,
    totalBuyQty: typeof dto.totalBuyQty === 'number' ? Math.round(dto.totalBuyQty) : null,
    totalSellQty: typeof dto.totalSellQty === 'number' ? Math.round(dto.totalSellQty) : null,
    upperCircuit: round2(dto.highPriceRange),
    lowerCircuit: round2(dto.lowPriceRange),
  };
}

export async function fetchGrowwSearch(query: string): Promise<
  Array<{
    searchId: string;
    title: string;
    nseSymbol: string | null;
    bseCode: string | null;
    isin: string | null;
  }>
> {
  const url = `https://groww.in/v1/api/search/v3/query/global/st_p_query?page=0&query=${encodeURIComponent(
    query
  )}&size=15&web=true`;
  const data = await fetchJsonWithTimeout<GrowwSearchResponse>(url, {}, 3500);
  const content = data?.data?.content ?? [];
  return content
    .filter((c) => c.entity_type === 'Stocks' && (c.nse_scrip_code || c.bse_scrip_code))
    .map((c) => ({
      searchId: c.search_id || '',
      title: c.title || c.nse_scrip_code || c.bse_scrip_code || '',
      nseSymbol: c.nse_scrip_code || null,
      bseCode: c.bse_scrip_code || null,
      isin: c.isin || null,
    }));
}

async function fetchGrowwCompanyDetails(searchId: string): Promise<GrowwCompanyResponse | null> {
  if (!searchId) return null;
  const url = `https://groww.in/v1/api/stocks_data/v1/company/search_id/${encodeURIComponent(
    searchId
  )}?page=0&size=10`;
  return fetchJsonWithTimeout<GrowwCompanyResponse>(url, {}, 4500);
}

async function fetchAllStocksPage(page: number): Promise<GrowwAllStocksResponse | null> {
  return fetchJsonWithTimeout<GrowwAllStocksResponse>(
    'https://groww.in/v1/api/stocks_data/v1/all_stocks',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        listFilters: { INDUSTRY: [], INDEX: [] },
        objFilters: {
          CLOSE_PRICE: { max: 1000000, min: 0 },
          MARKET_CAP: { min: 0, max: 100000000000000000 },
        },
        page: String(page),
        size: '1000',
        sortBy: 'MARKET_CAP',
        sortType: 'DESC',
      }),
    },
    6500
  );
}

function mapGrowwRecordToStock(
  rec: GrowwAllStocksRecord,
  curated: StockInstrument | undefined,
  retrievedAtIso: string
): StockInstrument | null {
  const nseCode = rec.nseScriptCode ? String(rec.nseScriptCode).trim().toUpperCase() : '';
  const rawBse = rec.bseScriptCode ? String(rec.bseScriptCode).trim() : '';
  const bseCode = /^\d{6}$/.test(rawBse) ? rawBse : '';
  const symbol = nseCode || bseCode;
  if (!symbol) return null;
  if (isNonEquityInstrument(symbol, rec.companyName || symbol, '', rec.isin || '')) {
    return null;
  }

  const store = getEnrichmentStore();
  if (typeof rec.industryCode === 'number' && rec.industryCode > 0 && rec.searchId && !industryCodeSamples.has(rec.industryCode)) {
    industryCodeSamples.set(rec.industryCode, rec.searchId);
  }
  const detailEnrich = store.details[symbol] || (bseCode ? store.details[bseCode] : undefined);

  const dto = rec.livePriceDto;
  const ltp = round2(dto?.ltp ?? rec.closePrice ?? curated?.currentPrice ?? null);
  let prevClose: number | null = null;
  if (dto && typeof dto.dayChange === 'number' && dto.dayChange !== 0 && ltp !== null) {
    prevClose = round2(ltp - dto.dayChange);
  } else if (dto && typeof dto.close === 'number' && dto.close > 0 && dto.close !== ltp) {
    prevClose = round2(dto.close);
  }
  if (
    (prevClose === null || (prevClose === ltp && (!dto?.dayChange || dto.dayChange === 0))) &&
    typeof rec.closePrice === 'number' &&
    rec.closePrice > 0 &&
    rec.closePrice !== ltp
  ) {
    prevClose = round2(rec.closePrice);
  }
  if (prevClose === null) {
    prevClose = round2(dto?.close ?? rec.closePrice ?? curated?.previousClose ?? ltp);
  }

  const open = round2(dto?.open ?? curated?.open ?? prevClose);
  const dayHigh = round2(dto?.high ?? curated?.dayHigh ?? ltp);
  const dayLow = round2(dto?.low ?? curated?.dayLow ?? ltp);
  const week52High = round2(rec.yearlyHighPrice ?? detailEnrich?.week52High ?? curated?.week52High ?? null);
  const week52Low = round2(rec.yearlyLowPrice ?? detailEnrich?.week52Low ?? curated?.week52Low ?? null);
  const volume =
    typeof dto?.volume === 'number'
      ? Math.round(dto.volume)
      : curated?.volume ?? null;

  // Groww all_stocks marketCap is denominated in paise (1 Cr = 1e9 paise)
  const marketCapCr =
    typeof rec.marketCap === 'number' && rec.marketCap > 0
      ? Number((rec.marketCap / 1e9).toFixed(2))
      : detailEnrich?.marketCapCr ?? curated?.marketCapCr ?? null;

  const lastTradeIso =
    toIsoFromEpochSec(dto?.lastTradeTime ?? dto?.tsInMillis) ??
    curated?.lastTradeTime ??
    retrievedAtIso;

  const exchange: StockInstrument['exchange'] =
    nseCode && bseCode ? 'NSE/BSE' : nseCode ? 'NSE' : 'BSE';

  const sparkline =
    curated && curated.sparkline.length > 0
      ? [...curated.sparkline.slice(0, -1), ltp ?? curated.sparkline[curated.sparkline.length - 1]]
      : prevClose !== null && ltp !== null
        ? [prevClose, Number((((prevClose + ltp) / 2)).toFixed(2)), ltp]
        : [];

  const companyName = rec.companyName || curated?.companyName || symbol;
  const { sector, industry } = resolveSectorForStock({
    companyName,
    industryCode: rec.industryCode,
    curatedSector: curated?.sector,
    curatedIndustry: curated?.industry,
    symbol,
  });

  const resolvedLogo =
    getCachedLogoUrl(symbol, bseCode) ??
    normalizeGrowwLogoUrl(detailEnrich?.logoUrl ?? curated?.logoUrl) ??
    null;

  return {
    id: curated?.id || `stk-${symbol.toLowerCase()}`,
    symbol,
    bseCode: bseCode || curated?.bseCode || 'N/A',
    yahooSymbol: nseCode ? `${nseCode}.NS` : `${bseCode}.BO`,
    searchId: rec.searchId || detailEnrich?.searchId || curated?.searchId,
    companyName,
    logoUrl: resolvedLogo,
    exchange,
    sector,
    industry,
    isin: rec.isin || curated?.isin || 'Available on Exchange',
    currentPrice: ltp,
    previousClose: prevClose,
    open,
    dayHigh,
    dayLow,
    week52High,
    week52Low,
    volume,
    marketCapCr,
    lastTradeTime: lastTradeIso,
    nseQuote: curated?.nseQuote ?? null,
    bseQuote: curated?.bseQuote ?? null,
    fundamentals: detailEnrich?.fundamentals || curated?.fundamentals || {
      pe: null,
      pb: null,
      roePct: null,
      rocePct: null,
      debtToEquity: null,
      revenueGrowthPct: null,
      profitGrowthPct: null,
      dividendYieldPct: null,
      reportingPeriod: 'Exchange Live Feed',
      source: 'NSE / BSE Exchange Adapter',
    },
    companyProfile: detailEnrich?.companyProfile ?? curated?.companyProfile,
    registry: curated?.registry,
    shareholding: curated?.shareholding,
    financialStatements: curated?.financialStatements,
    peers: curated?.peers,
    fundsInvested: curated?.fundsInvested,
    dataSourcesUsed: curated?.dataSourcesUsed,
    sparkline,
    historicalSeries: curated?.historicalSeries || [],
    announcements: curated?.announcements || [],
    ipoHistorySlug: curated?.ipoHistorySlug,
    provenance: {
      source:
        dto?.type === 'LIVE_PRICE'
          ? 'NSE/BSE Live Market Feed (Groww Adapter)'
          : 'NSE/BSE Exchange Snapshot',
      retrievedAt: retrievedAtIso,
      effectiveDate: lastTradeIso.slice(0, 10),
      verificationStatus: 'Verified',
      qualityStatus: dto?.type === 'LIVE_PRICE' ? 'VERIFIED' : 'DELAYED',
      currency: 'INR',
      unit: 'INR per share',
      dataCategory: 'Equity Quote',
    },
  };
}

function parseFinancialSeries(
  rows: GrowwFinRow[] | undefined,
  basis: 'CONSOLIDATED' | 'STANDALONE'
): StockFinancialSeries | null {
  if (!rows || rows.length === 0) return null;
  const findRow = (title: string) =>
    rows.find((r) => (r.title || '').toLowerCase() === title.toLowerCase());

  const rev = findRow('Revenue');
  const prof = findRow('Profit');
  const nw = findRow('Net Worth');

  const mapSeries = (obj: Record<string, number> | undefined) =>
    obj
      ? Object.entries(obj).map(([period, valueCr]) => ({
          period,
          valueCr: Number(valueCr.toFixed(2)),
        }))
      : [];

  return {
    basis,
    revenueYearly: mapSeries(rev?.yearly),
    profitYearly: mapSeries(prof?.yearly),
    netWorthYearly: mapSeries(nw?.yearly),
    revenueQuarterly: mapSeries(rev?.quarterly),
    profitQuarterly: mapSeries(prof?.quarterly),
  };
}

function buildRegistryEquityStock(params: {
  symbol: string;
  bseCode: string;
  isin: string;
  companyName: string;
  exchange: StockInstrument['exchange'];
  nseBhav?: BhavcopyEntry;
  bseBhav?: BhavcopyEntry;
  nseArch?: NseArchiveEntry;
  kiteNse?: ZerodhaInstrumentEntry;
  kiteBse?: ZerodhaInstrumentEntry;
  curated?: StockInstrument;
  retrievedAtIso: string;
}): StockInstrument {
  const {
    symbol,
    bseCode,
    isin,
    companyName,
    exchange,
    nseBhav,
    bseBhav,
    nseArch,
    kiteNse,
    kiteBse,
    curated,
    retrievedAtIso,
  } = params;

  const primaryBhav = nseBhav ?? bseBhav;
  const hydrated = liveQuoteHydrationCache.get(symbol);
  const hydQ = hydrated?.quote;

  const ltp = round2(
    hydQ?.ltp ?? primaryBhav?.last ?? primaryBhav?.close ?? curated?.currentPrice ?? null
  );
  const prevClose = round2(
    hydQ?.previousClose ?? primaryBhav?.prevClose ?? curated?.previousClose ?? ltp
  );
  const open = round2(hydQ?.open ?? primaryBhav?.open ?? curated?.open ?? prevClose);
  const dayHigh = round2(hydQ?.high ?? primaryBhav?.high ?? curated?.dayHigh ?? ltp);
  const dayLow = round2(hydQ?.low ?? primaryBhav?.low ?? curated?.dayLow ?? ltp);
  const volume =
    hydQ?.volume ??
    ((nseBhav?.volume ?? 0) + (bseBhav?.volume ?? 0) > 0
      ? (nseBhav?.volume ?? 0) + (bseBhav?.volume ?? 0)
      : curated?.volume ?? null);

  const series = (nseBhav?.series || nseArch?.series || bseBhav?.series || '').toUpperCase();
  const isEtf = isin.startsWith('INF') || /\bETF\b/i.test(companyName);
  const isSme = ['SM', 'ST', 'M', 'MT', 'MS', 'TS'].includes(series);
  const { sector, industry } = resolveSectorForStock({
    companyName,
    curatedSector: curated?.sector,
    curatedIndustry: curated?.industry,
    symbol,
    isEtf,
    isSme,
  });

  const store = getEnrichmentStore();
  const detailEnrich = store.details[symbol] || (bseCode && bseCode !== 'N/A' ? store.details[bseCode] : undefined);
  const resolvedLogo =
    getCachedLogoUrl(symbol, bseCode) ??
    normalizeGrowwLogoUrl(detailEnrich?.logoUrl ?? curated?.logoUrl) ??
    null;

  const effectiveDate =
    hydQ?.lastTradeTime?.slice(0, 10) ||
    primaryBhav?.tradDt ||
    curated?.lastTradeTime?.slice(0, 10) ||
    retrievedAtIso.slice(0, 10);

  const hasLiveHydration = Boolean(hydQ && Date.now() - (hydrated?.fetchedAt ?? 0) < 300_000);
  const qualityStatus: StockInstrument['provenance']['qualityStatus'] = hasLiveHydration
    ? 'VERIFIED'
    : ltp !== null
      ? 'DELAYED'
      : 'UNAVAILABLE';

  const sparkline =
    curated && curated.sparkline.length > 0
      ? curated.sparkline
      : prevClose !== null && ltp !== null
        ? [prevClose, Number(((prevClose + ltp) / 2).toFixed(2)), ltp]
        : [];

  const isNseYahoo = exchange.includes('NSE') && !/^\d+$/.test(symbol);
  return {
    id: curated?.id || `stk-${symbol.toLowerCase().replace(/[^a-z0-9]/g, '')}-${bseCode !== 'N/A' ? bseCode : 'eq'}`,
    symbol,
    bseCode: bseCode || 'N/A',
    yahooSymbol: isNseYahoo ? `${symbol}.NS` : (bseCode && bseCode !== 'N/A' ? `${bseCode}.BO` : `${symbol}.BO`),
    searchId: detailEnrich?.searchId || curated?.searchId,
    companyName: companyName || symbol,
    logoUrl: resolvedLogo,
    exchange,
    sector,
    industry,
    isin: isin || 'Available on Exchange',
    currentPrice: ltp,
    previousClose: prevClose,
    open,
    dayHigh,
    dayLow,
    week52High: detailEnrich?.week52High ?? curated?.week52High ?? null,
    week52Low: detailEnrich?.week52Low ?? curated?.week52Low ?? null,
    volume,
    marketCapCr: detailEnrich?.marketCapCr ?? curated?.marketCapCr ?? null,
    lastTradeTime: hydQ?.lastTradeTime || (primaryBhav?.tradDt ? `${primaryBhav.tradDt}T10:00:00.000Z` : retrievedAtIso),
    nseQuote: curated?.nseQuote ?? null,
    bseQuote: curated?.bseQuote ?? null,
    fundamentals: detailEnrich?.fundamentals || curated?.fundamentals || {
      pe: null,
      pb: null,
      roePct: null,
      rocePct: null,
      debtToEquity: null,
      revenueGrowthPct: null,
      profitGrowthPct: null,
      dividendYieldPct: null,
      reportingPeriod: primaryBhav ? 'Exchange Bhavcopy & Feed' : 'Exchange Registry',
      source: 'NSE / BSE Official Registry',
    },
    companyProfile: detailEnrich?.companyProfile ?? curated?.companyProfile,
    registry: {
      nseSeries: nseBhav?.series || nseArch?.series || null,
      nseListingDate: nseArch?.listingDate || null,
      faceValue: nseArch?.faceValue ?? null,
      marketLot: primaryBhav?.lotSize ?? nseArch?.marketLot ?? kiteNse?.lotSize ?? kiteBse?.lotSize ?? 1,
      tickSize: kiteNse?.tickSize ?? kiteBse?.tickSize ?? 0.05,
      zerodhaNseToken: kiteNse?.instrumentToken ?? null,
      zerodhaBseToken: kiteBse?.instrumentToken ?? null,
      isFnoEnabled: Boolean(curated?.registry?.isFnoEnabled),
    },
    shareholding: curated?.shareholding,
    financialStatements: curated?.financialStatements,
    peers: curated?.peers,
    fundsInvested: curated?.fundsInvested,
    dataSourcesUsed: [
      ...(nseBhav || nseArch ? ['NSE India Official'] : []),
      ...(bseBhav || bseCode !== 'N/A' ? ['BSE India Official'] : []),
      ...(kiteNse || kiteBse ? ['Zerodha Kite Registry'] : []),
    ],
    sparkline,
    historicalSeries: curated?.historicalSeries || [],
    announcements: curated?.announcements || [],
    ipoHistorySlug: curated?.ipoHistorySlug,
    provenance: {
      source: hasLiveHydration
        ? `${exchange} Live Quote (Groww Adapter)`
        : primaryBhav
          ? `${exchange} Official Exchange Bhavcopy`
          : `${exchange} Official Scrip Registry`,
      retrievedAt: retrievedAtIso,
      effectiveDate,
      verificationStatus: ltp !== null ? 'Verified' : 'Provisional',
      qualityStatus,
      currency: 'INR',
      unit: 'INR per share',
      dataCategory: 'Equity Quote',
    },
  };
}

export async function syncAllIndianStocks(force = false): Promise<StockInstrument[]> {
  const now = Date.now();
  if (!force && liveUniverseCache.length > 0 && now - liveUniverseLastSynced < UNIVERSE_CACHE_TTL_MS) {
    return liveUniverseCache;
  }
  if (inflightUniverseSync) {
    return inflightUniverseSync;
  }

  inflightUniverseSync = (async () => {
    const db = getDb();
    const curatedBySymbol = new Map<string, StockInstrument>();
    const curatedByBse = new Map<string, StockInstrument>();
    for (const stk of db.stocks) {
      curatedBySymbol.set(stk.symbol.toUpperCase(), stk);
      if (stk.bseCode && stk.bseCode !== 'N/A') {
        curatedByBse.set(stk.bseCode.trim(), stk);
      }
    }

    try {
      const [firstPage] = await Promise.all([
        fetchAllStocksPage(0),
        syncOfficialRegistries(),
        syncExchangeBhavcopies(force),
      ]);

      let allRaw: GrowwAllStocksRecord[] = [];
      if (firstPage?.records?.length) {
        const totalRecords = firstPage.totalRecords ?? firstPage.records.length;
        const maxPages = Math.min(8, Math.max(1, Math.ceil(totalRecords / 1000)));
        const remainingIndices = Array.from({ length: maxPages - 1 }, (_, i) => i + 1);
        const remainingPages = await Promise.all(
          remainingIndices.map((p) => fetchAllStocksPage(p))
        );
        allRaw = [
          ...(firstPage.records || []),
          ...remainingPages.flatMap((p) => p?.records || []),
        ];
      }

      const retrievedAtIso = new Date().toISOString();
      const seenIsin = new Set<string>();
      const seenNseSym = new Set<string>();
      const seenBseCode = new Set<string>();
      const unified: StockInstrument[] = [];

      const markSeen = (stk: StockInstrument) => {
        if (stk.isin && (stk.isin.startsWith('INE') || stk.isin.startsWith('INF'))) {
          seenIsin.add(stk.isin.toUpperCase());
        }
        if (stk.exchange.includes('NSE') || !/^\d+$/.test(stk.symbol)) {
          seenNseSym.add(stripNseSeriesSuffix(stk.symbol.toUpperCase()));
        }
        if (stk.bseCode && stk.bseCode !== 'N/A') {
          seenBseCode.add(stk.bseCode.trim());
        }
      };

      // 1. Primary Groww all_stocks live records (enriched with official NSE/BSE Bhavcopy & Kite registries)
      for (const rec of allRaw) {
        const nseKey = rec.nseScriptCode ? String(rec.nseScriptCode).trim().toUpperCase() : '';
        const bseKey = rec.bseScriptCode ? String(rec.bseScriptCode).trim() : '';
        const curated =
          (nseKey ? curatedBySymbol.get(nseKey) : undefined) ??
          (bseKey ? curatedByBse.get(bseKey) : undefined);

        const mapped = mapGrowwRecordToStock(rec, curated, retrievedAtIso);
        if (!mapped) continue;

        const isinUpper = mapped.isin.toUpperCase();
        const nseBhav = nseBhavByIsin.get(isinUpper) ?? (nseKey ? nseBhavBySym.get(nseKey) : undefined);
        const bseBhav = bseBhavByIsin.get(isinUpper) ?? (bseKey ? bseBhavByCode.get(bseKey) : undefined);
        const kiteBse =
          (bseKey ? zerodhaBseMap.get(bseKey) : undefined) ??
          (bseBhav?.bseCode ? zerodhaBseMap.get(bseBhav.bseCode) : undefined) ??
          (nseKey ? zerodhaBseMap.get(nseKey) : undefined);

        // Upgrade numeric BSE codes to alphabetical NSE or BSE trading symbols whenever available
        if (!nseKey || /^\d+$/.test(mapped.symbol)) {
          const resolvedAlpha = pickCleanAlphaSymbol([
            nseBhav?.symbol,
            bseBhav?.symbol,
            kiteBse?.tradingsymbol,
          ]);
          if (resolvedAlpha) {
            mapped.symbol = resolvedAlpha;
            if (!curated?.id) {
              mapped.id = `stk-${resolvedAlpha.toLowerCase().replace(/[^a-z0-9]/g, '')}-${bseKey || 'eq'}`;
            }
          }
        }

        if (bseBhav && (!mapped.bseCode || mapped.bseCode === 'N/A')) {
          mapped.bseCode = bseBhav.bseCode;
        }
        const nseArch =
          (nseKey ? nseArchiveMap.get(nseKey) : undefined) ??
          (nseBhav ? nseArchiveMap.get(nseBhav.symbol) : undefined) ??
          nseArchiveMap.get(mapped.symbol);
        const kiteNse =
          (nseKey ? zerodhaNseMap.get(nseKey) : undefined) ??
          (nseBhav ? zerodhaNseMap.get(nseBhav.symbol) : undefined) ??
          zerodhaNseMap.get(mapped.symbol);

        const hasNse = Boolean(nseKey || nseBhav || nseArch);
        const hasBse = Boolean((mapped.bseCode && mapped.bseCode !== 'N/A') || bseBhav || kiteBse);
        mapped.exchange = hasNse && hasBse ? 'NSE/BSE' : hasNse ? 'NSE' : 'BSE';
        mapped.yahooSymbol = hasNse && !/^\d+$/.test(mapped.symbol)
          ? `${mapped.symbol}.NS`
          : mapped.bseCode && mapped.bseCode !== 'N/A'
            ? `${mapped.bseCode}.BO`
            : `${mapped.symbol}.BO`;

        // Ensure companyName is always a descriptive corporate name (never a bare ticker/scrip number if registries hold full name)
        mapped.companyName = pickBestCompanyName({
          primary: rec.companyName,
          curated: curated?.companyName,
          nseArch: nseArch?.companyName,
          kiteNse: kiteNse?.companyName,
          kiteBse: kiteBse?.companyName,
          bhavName: nseBhav?.name || bseBhav?.name,
          searchId: rec.searchId || curated?.searchId,
          symbol: mapped.symbol,
          bseCode: mapped.bseCode,
        });

        // Re-resolve sector after upgrading companyName & symbol
        if (isGenericSector(mapped.sector) || isGenericSector(mapped.industry)) {
          const updatedSec = resolveSectorForStock({
            companyName: mapped.companyName,
            industryCode: rec.industryCode,
            curatedSector: curated?.sector,
            curatedIndustry: curated?.industry,
            symbol: mapped.symbol,
          });
          mapped.sector = updatedSec.sector;
          mapped.industry = updatedSec.industry;
        }
        if (!mapped.logoUrl) {
          mapped.logoUrl = getCachedLogoUrl(mapped.symbol, mapped.bseCode) ?? curated?.logoUrl ?? null;
        }

        // Apply cached hydrated quote or Bhavcopy prices/prevClose when Groww all_stocks had stale/missing quotes
        const hydQ = liveQuoteHydrationCache.get(mapped.symbol)?.quote;
        if (mapped.currentPrice === null) {
          if (hydQ && hydQ.ltp !== null) {
            mapped.currentPrice = hydQ.ltp;
            mapped.previousClose = hydQ.previousClose ?? hydQ.ltp;
            mapped.open = hydQ.open ?? mapped.open;
            mapped.dayHigh = hydQ.high ?? mapped.dayHigh;
            mapped.dayLow = hydQ.low ?? mapped.dayLow;
            mapped.volume = hydQ.volume ?? mapped.volume;
          } else if (nseBhav || bseBhav) {
            mapped.currentPrice = nseBhav?.last ?? nseBhav?.close ?? bseBhav?.last ?? bseBhav?.close ?? null;
            mapped.previousClose = nseBhav?.prevClose ?? bseBhav?.prevClose ?? mapped.currentPrice;
            mapped.open = mapped.open ?? nseBhav?.open ?? bseBhav?.open ?? mapped.previousClose;
            mapped.dayHigh = mapped.dayHigh ?? nseBhav?.high ?? bseBhav?.high ?? mapped.currentPrice;
            mapped.dayLow = mapped.dayLow ?? nseBhav?.low ?? bseBhav?.low ?? mapped.currentPrice;
          }
        } else if (
          mapped.previousClose === mapped.currentPrice &&
          (nseBhav?.prevClose || bseBhav?.prevClose)
        ) {
          const officialPrev = nseBhav?.prevClose ?? bseBhav?.prevClose ?? null;
          const bhavClose = nseBhav?.close ?? nseBhav?.last ?? bseBhav?.close ?? bseBhav?.last ?? null;
          if (
            officialPrev &&
            officialPrev !== mapped.currentPrice &&
            (!bhavClose || Math.abs(bhavClose - mapped.currentPrice) / mapped.currentPrice < 0.015)
          ) {
            mapped.previousClose = officialPrev;
          }
        }
        if (mapped.previousClose !== null && mapped.currentPrice !== null && mapped.sparkline.length <= 3) {
          mapped.sparkline = [
            mapped.previousClose,
            Number(((mapped.previousClose + mapped.currentPrice) / 2).toFixed(2)),
            mapped.currentPrice,
          ];
        }
        if (mapped.volume === null && (nseBhav?.volume || bseBhav?.volume)) {
          mapped.volume = (nseBhav?.volume ?? 0) + (bseBhav?.volume ?? 0);
        }

        const dedupeKey =
          mapped.isin && (mapped.isin.startsWith('INE') || mapped.isin.startsWith('INF'))
            ? isinUpper
            : mapped.bseCode && mapped.bseCode !== 'N/A'
              ? `${mapped.symbol}-${mapped.bseCode}`
              : mapped.symbol;
        if (seenIsin.has(dedupeKey) || (mapped.exchange.includes('NSE') && seenNseSym.has(mapped.symbol))) {
          continue;
        }

        markSeen(mapped);
        unified.push(mapped);

        if (curated) {
          curated.currentPrice = mapped.currentPrice;
          curated.previousClose = mapped.previousClose;
          curated.open = mapped.open;
          curated.dayHigh = mapped.dayHigh;
          curated.dayLow = mapped.dayLow;
          curated.week52High = mapped.week52High ?? curated.week52High;
          curated.week52Low = mapped.week52Low ?? curated.week52Low;
          curated.volume = mapped.volume ?? curated.volume;
          curated.marketCapCr = mapped.marketCapCr ?? curated.marketCapCr;
          curated.searchId = mapped.searchId ?? curated.searchId;
          curated.logoUrl = mapped.logoUrl ?? curated.logoUrl;
          curated.sector = isGenericSector(curated.sector) ? mapped.sector : curated.sector;
          curated.industry = isGenericSector(curated.industry) ? mapped.industry : curated.industry;
          curated.companyName = mapped.companyName;
          curated.lastTradeTime = mapped.lastTradeTime;
          curated.provenance = { ...mapped.provenance };
        }
      }

      // 2. All remaining NSE Bhavcopy equities (joins BSE Bhavcopy / Kite BSE on same ISIN or symbol)
      for (const nseRow of nseBhavByIsin.values()) {
        if (seenIsin.has(nseRow.isin) || seenNseSym.has(nseRow.symbol)) continue;
        const bseRow = bseBhavByIsin.get(nseRow.isin) ?? bseBhavBySym.get(nseRow.symbol);
        const nseArch = nseArchiveMap.get(nseRow.symbol);
        const kiteNse = zerodhaNseMap.get(nseRow.symbol);
        const kiteBse =
          (bseRow?.bseCode ? zerodhaBseMap.get(bseRow.bseCode) : undefined) ??
          zerodhaBseMap.get(nseRow.symbol);
        const bseCode = bseRow?.bseCode || kiteBse?.exchangeToken || 'N/A';
        const exchange: StockInstrument['exchange'] = bseCode !== 'N/A' ? 'NSE/BSE' : 'NSE';
        const curated = curatedBySymbol.get(nseRow.symbol) ?? (bseCode !== 'N/A' ? curatedByBse.get(bseCode) : undefined);

        const stk = buildRegistryEquityStock({
          symbol: nseRow.symbol,
          bseCode,
          isin: nseRow.isin,
          companyName: pickBestCompanyName({
            nseArch: nseArch?.companyName,
            curated: curated?.companyName,
            kiteNse: kiteNse?.companyName,
            kiteBse: kiteBse?.companyName,
            bhavName: nseRow.name || bseRow?.name,
            symbol: nseRow.symbol,
            bseCode,
          }),
          exchange,
          nseBhav: nseRow,
          bseBhav: bseRow,
          nseArch,
          kiteNse,
          kiteBse,
          curated,
          retrievedAtIso,
        });
        markSeen(stk);
        unified.push(stk);
      }

      // 3. All remaining BSE Bhavcopy equities (BSE-only / SME / X / XT / M / MT / T / B / Z)
      for (const bseRow of bseBhavByIsin.values()) {
        if (seenIsin.has(bseRow.isin) || (bseRow.bseCode && seenBseCode.has(bseRow.bseCode))) continue;
        const kiteBse = bseRow.bseCode ? zerodhaBseMap.get(bseRow.bseCode) : undefined;
        const alphaSym = pickCleanAlphaSymbol(
          [bseRow.symbol, kiteBse?.tradingsymbol],
          bseRow.bseCode
        );
        const nseArch = nseArchiveMap.get(alphaSym);
        const kiteNse = zerodhaNseMap.get(alphaSym);
        const hasNse = Boolean(nseArch || kiteNse);
        const symbol = alphaSym || bseRow.bseCode;
        if (hasNse && seenNseSym.has(symbol)) continue;

        const curated =
          curatedBySymbol.get(symbol) ?? (bseRow.bseCode ? curatedByBse.get(bseRow.bseCode) : undefined);

        const stk = buildRegistryEquityStock({
          symbol,
          bseCode: bseRow.bseCode || 'N/A',
          isin: bseRow.isin,
          companyName: pickBestCompanyName({
            nseArch: nseArch?.companyName,
            curated: curated?.companyName,
            kiteNse: kiteNse?.companyName,
            kiteBse: kiteBse?.companyName,
            bhavName: bseRow.name,
            symbol,
            bseCode: bseRow.bseCode,
          }),
          exchange: hasNse ? 'NSE/BSE' : 'BSE',
          bseBhav: bseRow,
          nseArch,
          kiteNse,
          kiteBse,
          curated,
          retrievedAtIso,
        });
        markSeen(stk);
        unified.push(stk);
      }

      // 4. Official NSE EQUITY_L / SME_EQUITY_L stocks not traded in yesterday's Bhavcopy
      for (const arch of nseArchiveMap.values()) {
        if ((arch.isin && seenIsin.has(arch.isin)) || seenNseSym.has(arch.symbol)) continue;
        const kiteNse = zerodhaNseMap.get(arch.symbol);
        const kiteBse = zerodhaBseMap.get(arch.symbol);
        const bseCode = kiteBse?.exchangeToken || 'N/A';
        const stk = buildRegistryEquityStock({
          symbol: arch.symbol,
          bseCode,
          isin: arch.isin || 'Available on Exchange',
          companyName: pickBestCompanyName({
            nseArch: arch.companyName,
            kiteNse: kiteNse?.companyName,
            kiteBse: kiteBse?.companyName,
            symbol: arch.symbol,
            bseCode,
          }),
          exchange: bseCode !== 'N/A' ? 'NSE/BSE' : 'NSE',
          nseArch: arch,
          kiteNse,
          kiteBse,
          curated: curatedBySymbol.get(arch.symbol),
          retrievedAtIso,
        });
        markSeen(stk);
        unified.push(stk);
      }

      // 5. Remaining active NSE & BSE equities from Zerodha Kite official exchange files
      for (const kn of zerodhaNseList) {
        const baseSym = stripNseSeriesSuffix(kn.tradingsymbol);
        if (seenNseSym.has(baseSym)) continue;
        const kiteBse = zerodhaBseMap.get(baseSym);
        const bseCode = kiteBse?.exchangeToken || 'N/A';
        if (bseCode !== 'N/A' && seenBseCode.has(bseCode)) continue;
        const stk = buildRegistryEquityStock({
          symbol: baseSym,
          bseCode,
          isin: 'Available on Exchange',
          companyName: pickBestCompanyName({
            kiteNse: kn.companyName,
            kiteBse: kiteBse?.companyName,
            symbol: baseSym,
            bseCode,
          }),
          exchange: bseCode !== 'N/A' ? 'NSE/BSE' : 'NSE',
          kiteNse: kn,
          kiteBse,
          curated: curatedBySymbol.get(baseSym),
          retrievedAtIso,
        });
        markSeen(stk);
        unified.push(stk);
      }

      for (const kb of zerodhaBseList) {
        if (seenBseCode.has(kb.exchangeToken)) continue;
        const baseSym = pickCleanAlphaSymbol([kb.tradingsymbol], kb.exchangeToken);
        if (!/^\d+$/.test(baseSym) && seenNseSym.has(baseSym)) continue;
        const bseRow = bseBhavByCode.get(kb.exchangeToken);
        const stk = buildRegistryEquityStock({
          symbol: baseSym || kb.exchangeToken,
          bseCode: kb.exchangeToken,
          isin: bseRow?.isin || 'Available on Exchange',
          companyName: pickBestCompanyName({
            kiteBse: kb.companyName,
            bhavName: bseRow?.name,
            symbol: baseSym || kb.exchangeToken,
            bseCode: kb.exchangeToken,
          }),
          exchange: 'BSE',
          bseBhav: bseRow,
          kiteBse: kb,
          curated: curatedByBse.get(kb.exchangeToken) ?? curatedBySymbol.get(baseSym),
          retrievedAtIso,
        });
        markSeen(stk);
        unified.push(stk);
      }

      // 6. Preserve any curated/recently-viewed DB stocks not matched above
      for (const stk of db.stocks) {
        if (isNonEquityInstrument(stk.symbol, stk.companyName, stk.registry?.nseSeries || '', stk.isin)) {
          continue;
        }
        const key = stk.isin && stk.isin.startsWith('IN') ? stk.isin : stk.symbol;
        if (!seenIsin.has(key) && !seenNseSym.has(stk.symbol.toUpperCase()) && !seenBseCode.has(stk.bseCode)) {
          unified.push(stk);
        }
      }

      // 7. Sync live prices back onto Listed IPOs (matching either NSE symbol or BSE 6-digit code)
      const unifiedBySymbol = new Map<string, StockInstrument>();
      const unifiedByBse = new Map<string, StockInstrument>();
      for (const s of unified) {
        unifiedBySymbol.set(s.symbol.toUpperCase(), s);
        if (s.bseCode && s.bseCode !== 'N/A') unifiedByBse.set(s.bseCode, s);
      }
      for (const ipo of db.ipos) {
        if (ipo.listing.stockSymbol) {
          const key = ipo.listing.stockSymbol.toUpperCase();
          const liveStk = unifiedBySymbol.get(key) ?? unifiedByBse.get(key);
          if (liveStk && liveStk.currentPrice !== null) {
            ipo.listing.currentMarketPrice = liveStk.currentPrice;
            ipo.listing.previousClose = liveStk.previousClose;
            ipo.listing.priceStatus = liveStk.provenance.qualityStatus;
            ipo.listing.provenance = { ...liveStk.provenance };
          }
        }
      }

      const srcRow = db.dataSources.find((s) => s.id === 'src-nse-bse');
      if (srcRow) {
        srcRow.status = 'HEALTHY';
        srcRow.lastCheckedAt = retrievedAtIso;
        srcRow.lastSuccessAt = retrievedAtIso;
        srcRow.recordsCount = unified.length;
        srcRow.notes = `Live NSE & BSE full-market feed synced (${unified.length} equities across Groww, Official NSE/BSE Bhavcopies & Zerodha Kite).`;
      }

      liveUniverseCache = unified;
      liveUniverseLastSynced = Date.now();
      liveUniverseReachable = allRaw.length > 0 || nseBhavByIsin.size > 0 || bseBhavByIsin.size > 0;
      saveDb();
      evaluatePriceAlerts();
      return liveUniverseCache;
    } finally {
      inflightUniverseSync = null;
    }
  })();

  return inflightUniverseSync;
}

export function getLiveUniverseSnapshot(): {
  stocks: StockInstrument[];
  liveFeedReachable: boolean;
  lastSyncedAt: string | null;
} {
  if (liveUniverseCache.length > 0) {
    return {
      stocks: liveUniverseCache,
      liveFeedReachable: liveUniverseReachable,
      lastSyncedAt: liveUniverseLastSynced ? new Date(liveUniverseLastSynced).toISOString() : null,
    };
  }
  const db = getDb();
  return {
    stocks: db.stocks,
    liveFeedReachable: false,
    lastSyncedAt: null,
  };
}

export function findStockInUniverse(symbolOrCode: string): StockInstrument | undefined {
  const raw = symbolOrCode.trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
  const clean = stripNseSeriesSuffix(raw);
  const pool = liveUniverseCache.length > 0 ? liveUniverseCache : getDb().stocks;
  return (
    pool.find((s) => s.symbol.toUpperCase() === raw || s.symbol.toUpperCase() === clean) ||
    pool.find((s) => s.bseCode === raw || s.bseCode === clean) ||
    pool.find((s) => s.isin.toUpperCase() === raw) ||
    getDb().stocks.find((s) => s.symbol.toUpperCase() === clean || s.bseCode === clean)
  );
}

export interface StockUniverseQueryOptions {
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
}

async function fetchHydrationQuote(s: StockInstrument): Promise<{
  quote: ExchangeLiveQuote;
  sourceLabel: string;
} | null> {
  const useNse = s.exchange.includes('NSE') && !/^\d+$/.test(s.symbol);
  const growwQ =
    (useNse ? await fetchGrowwLiveQuote('NSE', s.symbol) : null) ??
    (s.bseCode && s.bseCode !== 'N/A' ? await fetchGrowwLiveQuote('BSE', s.bseCode) : null);
  if (growwQ && growwQ.ltp !== null) {
    return { quote: growwQ, sourceLabel: `${s.exchange} Live Quote (Groww Adapter)` };
  }

  // Fallback to Yahoo Finance for NSE/BSE tickers absent from Groww accord_points
  const primaryYahoo = s.yahooSymbol || (useNse ? `${s.symbol}.NS` : `${s.bseCode || s.symbol}.BO`);
  let yChart = await fetchYahooChart(primaryYahoo, '5d', '1d');
  if (!yChart && s.bseCode && s.bseCode !== 'N/A' && !primaryYahoo.endsWith('.BO')) {
    yChart = await fetchYahooChart(`${s.bseCode}.BO`, '5d', '1d');
  }
  const meta = yChart?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') return null;

  const ltp = round2(meta.regularMarketPrice);
  const previousClose = round2(meta.chartPreviousClose ?? meta.previousClose ?? ltp);
  const candles = parseYahooCandles(yChart!);
  const latestCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const lastTradeIso =
    toIsoFromEpochSec(meta.regularMarketTime) ?? new Date().toISOString();

  return {
    quote: {
      ltp,
      previousClose,
      open: round2(latestCandle?.open ?? previousClose),
      high: round2(meta.regularMarketDayHigh ?? latestCandle?.high ?? ltp),
      low: round2(meta.regularMarketDayLow ?? latestCandle?.low ?? ltp),
      dayChange:
        ltp !== null && previousClose !== null ? round2(ltp - previousClose) : null,
      dayChangePct:
        ltp !== null && previousClose !== null && previousClose > 0
          ? round2(((ltp - previousClose) / previousClose) * 100)
          : null,
      volume:
        typeof meta.regularMarketVolume === 'number'
          ? Math.round(meta.regularMarketVolume)
          : latestCandle?.volume ?? null,
      lastTradeTime: lastTradeIso,
      lastTradeQty: null,
      totalBuyQty: null,
      totalSellQty: null,
      upperCircuit: null,
      lowerCircuit: null,
    },
    sourceLabel: `${s.exchange} Quote (Yahoo Exchange Feed)`,
  };
}

function applyHydratedQuoteToStock(
  s: StockInstrument,
  quote: ExchangeLiveQuote,
  sourceLabel: string
): void {
  const nowMs = Date.now();
  const cachedEntry = { quote, fetchedAt: nowMs };
  liveQuoteHydrationCache.set(s.symbol, cachedEntry);
  const store = getEnrichmentStore();
  store.quotes[s.symbol] = cachedEntry;
  scheduleEnrichmentSave();

  s.currentPrice = quote.ltp;
  s.previousClose = quote.previousClose ?? s.previousClose;
  s.open = quote.open ?? s.open;
  s.dayHigh = quote.high ?? s.dayHigh;
  s.dayLow = quote.low ?? s.dayLow;
  s.volume = quote.volume ?? s.volume;
  if (quote.lastTradeTime) s.lastTradeTime = quote.lastTradeTime;
  if (s.previousClose !== null && s.currentPrice !== null) {
    s.sparkline = [
      s.previousClose,
      Number(((s.previousClose + s.currentPrice) / 2).toFixed(2)),
      s.currentPrice,
    ];
  }
  s.provenance = {
    ...s.provenance,
    source: sourceLabel,
    retrievedAt: new Date(nowMs).toISOString(),
    effectiveDate: (quote.lastTradeTime || new Date(nowMs).toISOString()).slice(0, 10),
    verificationStatus: 'Verified',
    qualityStatus: sourceLabel.includes('Groww') ? 'VERIFIED' : 'DELAYED',
  };
}

async function headImageOk(candidateUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1600);
  try {
    const res = await fetch(candidateUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'PriceAlerter/1.0' },
    });
    if (!res.ok) return false;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    return ct.startsWith('image/');
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function probeAndCacheStockLogo(stock: {
  symbol: string;
  bseCode?: string | null;
  searchId?: string | null;
  logoUrl?: string | null;
  companyName?: string | null;
}): Promise<string | null> {
  const sym = stock.symbol.trim().toUpperCase();
  const bse = stock.bseCode && /^\d{6}$/.test(stock.bseCode.trim()) ? stock.bseCode.trim() : '';
  const cached = getCachedLogoUrl(sym, bse);
  if (cached) return cached;
  if (stock.logoUrl) {
    const norm = normalizeGrowwLogoUrl(stock.logoUrl);
    if (norm) {
      recordVerifiedLogoUrl(sym, bse, norm);
      return norm;
    }
  }

  const probeKey = `${sym}|${bse}`;
  const lastNeg = negativeLogoProbeCache.get(probeKey) ?? 0;
  if (Date.now() - lastNeg < 30 * 60_000) return null;

  const alpha = !/^\d+$/.test(sym) ? sym : '';
  const candidates: string[] = [];
  if (alpha) {
    const enc = encodeURIComponent(alpha);
    candidates.push(
      `https://assets-netstorage.groww.in/stock-assets/logos2/${enc}.webp`,
      `https://assets-netstorage.groww.in/stock-assets/logos2/${enc}.png`,
      `https://assets-netstorage.groww.in/stock-assets/logos/${enc}.png`,
      `https://images.dhan.co/symbol/${enc}.png`
    );
  }
  if (bse) {
    candidates.push(
      `https://assets-netstorage.groww.in/stock-assets/logos/GSTK${bse}.png`,
      `https://assets-netstorage.groww.in/stock-assets/logos2/GSTK${bse}.webp`
    );
  }

  const checks = await Promise.all(candidates.map((u) => headImageOk(u)));
  const hitIdx = checks.findIndex(Boolean);
  if (hitIdx >= 0) {
    const hitUrl = candidates[hitIdx];
    recordVerifiedLogoUrl(sym, bse, hitUrl);
    return hitUrl;
  }

  if (stock.searchId) {
    const searchLogo = await resolveGrowwLogoBySearchId(stock.searchId);
    if (searchLogo) {
      recordVerifiedLogoUrl(sym, bse, searchLogo);
      return searchLogo;
    }
  }

  if (alpha || stock.companyName) {
    const tvSlugs = new Set<string>();
    const cleanBrand = (stock.companyName || '')
      .toLowerCase()
      .replace(/\b(limited|ltd|private|pvt|india|industries|enterprises|corp|corporation|holdings|services|solutions|technologies|systems)\b/g, ' ')
      .replace(/[^a-z0-9\s]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (cleanBrand.length >= 1) {
      tvSlugs.add(cleanBrand.slice(0, 2).join('-'));
      tvSlugs.add(cleanBrand[0]);
    }
    if (alpha && alpha.length >= 3) {
      tvSlugs.add(alpha.toLowerCase());
    }
    const tvUrls = Array.from(tvSlugs)
      .filter((s) => s.length >= 2 && s.length <= 40)
      .map((s) => `https://s3-symbol-logo.tradingview.com/${encodeURIComponent(s)}--big.svg`);
    if (tvUrls.length > 0) {
      const tvChecks = await Promise.all(tvUrls.map((u) => headImageOk(u)));
      const tvIdx = tvChecks.findIndex(Boolean);
      if (tvIdx >= 0) {
        recordVerifiedLogoUrl(sym, bse, tvUrls[tvIdx]);
        return tvUrls[tvIdx];
      }
    }
  }

  negativeLogoProbeCache.set(probeKey, Date.now());
  return null;
}

async function hydrateVisibleLiveQuotes(items: StockInstrument[], force: boolean): Promise<void> {
  const now = Date.now();
  const quoteCandidates = items
    .filter((s) => {
      const cached = liveQuoteHydrationCache.get(s.symbol);
      if (s.currentPrice === null) return !cached || now - cached.fetchedAt > 30_000;
      if (s.provenance.source.includes('Groww')) return false;
      if (force) return !cached || now - cached.fetchedAt > 20_000;
      return !cached;
    })
    .slice(0, 50);

  const logoCandidates = items.filter((s) => !s.logoUrl);

  await Promise.all([
    ...quoteCandidates.map(async (s) => {
      const hit = await fetchHydrationQuote(s);
      if (!hit || hit.quote.ltp === null) return;
      applyHydratedQuoteToStock(s, hit.quote, hit.sourceLabel);
    }),
    (async () => {
      for (let i = 0; i < logoCandidates.length; i += 25) {
        const chunk = logoCandidates.slice(i, i + 25);
        await Promise.all(
          chunk.map(async (s) => {
            const resolved = await probeAndCacheStockLogo({
              symbol: s.symbol,
              bseCode: s.bseCode,
              searchId: s.searchId,
              logoUrl: s.logoUrl,
              companyName: s.companyName,
            });
            if (resolved) s.logoUrl = resolved;
          })
        );
      }
    })(),
  ]);
}

export async function queryAllIndianStocks(opts: StockUniverseQueryOptions = {}): Promise<{
  stocks: StockInstrument[];
  total: number;
  totalUniverse: number;
  nseCount: number;
  bseCount: number;
  sectors: string[];
  liveFeedReachable: boolean;
  liveSyncedAt: string | null;
}> {
  const universe = await syncAllIndianStocks(Boolean(opts.refresh));
  const nseCount = universe.filter((s) => s.exchange.includes('NSE')).length;
  const bseCount = universe.filter((s) => s.exchange.includes('BSE')).length;
  const sectors = Array.from(new Set(universe.map((s) => s.sector))).sort();

  let filtered = universe;

  if (opts.exchange && opts.exchange !== 'All') {
    const ex = opts.exchange.toUpperCase();
    filtered = filtered.filter((s) => s.exchange.includes(ex));
  }
  if (opts.sector && opts.sector !== 'All') {
    const sec = opts.sector.toLowerCase();
    filtered = filtered.filter((s) => s.sector.toLowerCase() === sec);
  }
  if (opts.mcapTier && opts.mcapTier !== 'All') {
    if (opts.mcapTier === 'Large') {
      filtered = filtered.filter((s) => (s.marketCapCr ?? 0) >= 20000);
    } else if (opts.mcapTier === 'Mid') {
      filtered = filtered.filter(
        (s) => (s.marketCapCr ?? 0) >= 5000 && (s.marketCapCr ?? 0) < 20000
      );
    } else if (opts.mcapTier === 'Small') {
      filtered = filtered.filter((s) => (s.marketCapCr ?? 0) < 5000);
    }
  }
  if (opts.q && opts.q.trim()) {
    const needle = opts.q.trim().toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.symbol.toLowerCase().includes(needle) ||
        s.companyName.toLowerCase().includes(needle) ||
        s.bseCode.toLowerCase().includes(needle) ||
        s.isin.toLowerCase().includes(needle) ||
        s.sector.toLowerCase().includes(needle)
    );

    // Fallback: if a newly listed or uncommon stock wasn't in our merged index, query Groww global search directly
    if (filtered.length < 3 && needle.length >= 2) {
      const searchHits = await fetchGrowwSearch(needle);
      for (const hit of searchHits.slice(0, 6)) {
        const kiteBseHit = hit.bseCode ? zerodhaBseMap.get(hit.bseCode) : undefined;
        const bseBhavHit = hit.bseCode ? bseBhavByCode.get(hit.bseCode) : undefined;
        const alphaSym = pickCleanAlphaSymbol(
          [hit.nseSymbol, bseBhavHit?.symbol, kiteBseHit?.tradingsymbol],
          (hit.bseCode || '').toUpperCase()
        );
        const sym = (hit.nseSymbol || alphaSym || hit.bseCode || '').toUpperCase();
        if (!sym) continue;
        const already = filtered.some(
          (s) => s.symbol.toUpperCase() === sym || (hit.bseCode && s.bseCode === hit.bseCode)
        );
        if (already) continue;
        const existingInUni = findStockInUniverse(sym) || (hit.bseCode ? findStockInUniverse(hit.bseCode) : undefined);
        if (existingInUni) {
          filtered.push(existingInUni);
          continue;
        }
        const ex: StockInstrument['exchange'] =
          hit.nseSymbol && hit.bseCode ? 'NSE/BSE' : hit.nseSymbol ? 'NSE' : 'BSE';
        if (opts.exchange && opts.exchange !== 'All' && !ex.includes(opts.exchange.toUpperCase())) {
          continue;
        }
        const nseArchHit = nseArchiveMap.get(sym);
        const injected = buildRegistryEquityStock({
          symbol: sym,
          bseCode: hit.bseCode || 'N/A',
          isin: hit.isin || 'Available on Exchange',
          companyName: pickBestCompanyName({
            primary: hit.title,
            nseArch: nseArchHit?.companyName,
            kiteBse: kiteBseHit?.companyName,
            bhavName: bseBhavHit?.name,
            searchId: hit.searchId,
            symbol: sym,
            bseCode: hit.bseCode,
          }),
          exchange: ex,
          retrievedAtIso: new Date().toISOString(),
        });
        injected.searchId = hit.searchId;
        liveUniverseCache.push(injected);
        filtered.push(injected);
      }
    }
  }

  const getPct = (s: StockInstrument) => {
    if (s.currentPrice === null || s.previousClose === null || s.previousClose <= 0) return null;
    return ((s.currentPrice - s.previousClose) / s.previousClose) * 100;
  };

  if (opts.tab === 'gainers') {
    filtered = filtered
      .filter((s) => {
        const pct = getPct(s);
        return pct !== null && pct > 0;
      })
      .sort((a, b) => (getPct(b) ?? -999) - (getPct(a) ?? -999));
  } else if (opts.tab === 'losers') {
    filtered = filtered
      .filter((s) => {
        const pct = getPct(s);
        return pct !== null && pct < 0;
      })
      .sort((a, b) => (getPct(a) ?? 999) - (getPct(b) ?? 999));
  } else if (opts.tab === 'active') {
    filtered = [...filtered].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  } else if (opts.sortBy) {
    const asc = opts.sortDir === 'asc';
    filtered = [...filtered].sort((a, b) => {
      if (opts.sortBy === 'symbol') {
        return asc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      }
      const val = (s: StockInstrument) =>
        opts.sortBy === 'currentPrice'
          ? s.currentPrice ?? -1
          : opts.sortBy === 'changePct'
            ? getPct(s) ?? -999
            : opts.sortBy === 'volume'
              ? s.volume ?? -1
              : s.marketCapCr ?? -1;
      return asc ? val(a) - val(b) : val(b) - val(a);
    });
  }

  const total = filtered.length;
  const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 10000) : 100;
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  if (paged.length <= 100) {
    await hydrateVisibleLiveQuotes(paged, Boolean(opts.refresh));
  }

  return {
    stocks: paged,
    total,
    totalUniverse: universe.length,
    nseCount,
    bseCount,
    sectors,
    liveFeedReachable: liveUniverseReachable,
    liveSyncedAt: liveUniverseLastSynced ? new Date(liveUniverseLastSynced).toISOString() : null,
  };
}

export async function refreshIndicesFromProvider(force = false): Promise<{
  indices: MarketIndexInstrument[];
  liveFeedReachable: boolean;
}> {
  const db = getDb();
  const now = Date.now();
  const lastAll = lastFetchMap.get('__INDICES__') ?? 0;

  if (!force && now - lastAll < INDEX_CACHE_TTL_MS) {
    const sourceRow = db.dataSources.find((s) => s.id === 'src-nse-bse');
    return {
      indices: db.indices,
      liveFeedReachable: sourceRow?.status !== 'UNAVAILABLE',
    };
  }

  lastFetchMap.set('__INDICES__', now);
  let successCount = 0;

  await Promise.all(
    db.indices.map(async (idx) => {
      const data = await fetchYahooChart(idx.yahooSymbol, '5d', '1d');
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && typeof meta.regularMarketPrice === 'number') {
        successCount += 1;
        const prev =
          meta.chartPreviousClose ??
          meta.previousClose ??
          idx.previousClose ??
          meta.regularMarketPrice;
        const val = Number(meta.regularMarketPrice.toFixed(2));
        const chg = Number((val - prev).toFixed(2));
        const chgPct = prev > 0 ? Number(((chg / prev) * 100).toFixed(2)) : 0;
        const effectiveTs = meta.regularMarketTime
          ? new Date(meta.regularMarketTime * 1000).toISOString()
          : new Date().toISOString();

        idx.value = val;
        idx.previousClose = Number(prev.toFixed(2));
        idx.change = chg;
        idx.changePercent = chgPct;
        idx.provenance = {
          ...idx.provenance,
          source: 'Yahoo Finance Indian Index Feed',
          retrievedAt: new Date().toISOString(),
          effectiveDate: effectiveTs.slice(0, 10),
          qualityStatus: 'DELAYED',
          verificationStatus: 'Verified',
        };
      }
    })
  );

  saveDb();
  return { indices: db.indices, liveFeedReachable: successCount > 0 };
}

export async function refreshStockBySymbol(
  rawSymbol: string,
  range = '3mo'
): Promise<{ stock: StockInstrument | null; fromUpstream: boolean }> {
  const db = getDb();
  const cleanSymbol = rawSymbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '');

  if (liveUniverseCache.length === 0) {
    await syncAllIndianStocks();
  }

  const existing = findStockInUniverse(cleanSymbol);
  const cacheKey = `STK_${cleanSymbol}_${range}`;
  const lastCheck = lastFetchMap.get(cacheKey) ?? 0;
  if (
    existing &&
    existing.historicalSeries.length > 0 &&
    existing.companyProfile !== undefined &&
    existing.nseQuote !== undefined &&
    Date.now() - lastCheck < QUOTE_CACHE_TTL_MS
  ) {
    return { stock: existing, fromUpstream: false };
  }
  lastFetchMap.set(cacheKey, Date.now());

  let nseCode = existing
    ? existing.exchange.includes('NSE')
      ? existing.symbol
      : null
    : /^\d{6}$/.test(cleanSymbol)
      ? null
      : cleanSymbol;
  let bseCode =
    existing && existing.bseCode && /^\d{6}$/.test(existing.bseCode)
      ? existing.bseCode
      : /^\d{6}$/.test(cleanSymbol)
        ? cleanSymbol
        : null;
  let searchId = existing?.searchId || '';
  let resolvedName = existing?.companyName || cleanSymbol;
  let resolvedIsin = existing?.isin || 'Available via Exchange Filing';

  if (!searchId || (!nseCode && !bseCode)) {
    const searchMatches = await fetchGrowwSearch(cleanSymbol);
    const exactMatch =
      searchMatches.find(
        (m) =>
          m.nseSymbol?.toUpperCase() === cleanSymbol ||
          m.bseCode === cleanSymbol ||
          (bseCode && m.bseCode === bseCode)
      ) || (!existing ? searchMatches[0] : undefined);
    if (exactMatch) {
      nseCode = exactMatch.nseSymbol || nseCode;
      bseCode = exactMatch.bseCode || bseCode;
      searchId = exactMatch.searchId || searchId;
      resolvedName = exactMatch.title || resolvedName;
      resolvedIsin = exactMatch.isin || resolvedIsin;
    }
  }

  const yahooCandidate = nseCode
    ? `${nseCode}.NS`
    : bseCode
      ? `${bseCode}.BO`
      : existing?.yahooSymbol || `${cleanSymbol}.NS`;

  const interval = range === '1d' ? '15m' : range === '5d' ? '1h' : '1d';

  const [nseQuote, bseQuote, companyInfo, yahooChart] = await Promise.all([
    nseCode ? fetchGrowwLiveQuote('NSE', nseCode) : Promise.resolve(null),
    bseCode ? fetchGrowwLiveQuote('BSE', bseCode) : Promise.resolve(null),
    searchId ? fetchGrowwCompanyDetails(searchId) : Promise.resolve(null),
    fetchYahooChart(yahooCandidate, range, interval),
    syncOfficialRegistries(),
  ]);

  let finalYahoo = yahooChart;
  if (!finalYahoo && bseCode && !yahooCandidate.endsWith('.BO')) {
    finalYahoo = await fetchYahooChart(`${bseCode}.BO`, range, interval);
  }

  const primaryLive = nseQuote ?? bseQuote;
  const yahooResult = finalYahoo?.chart?.result?.[0];
  const yahooMeta = yahooResult?.meta;
  const candles = finalYahoo ? parseYahooCandles(finalYahoo) : [];

  if (!primaryLive && !yahooMeta && !existing) {
    return { stock: null, fromUpstream: false };
  }

  const finalNseCode = companyInfo?.header?.nseScriptCode || nseCode;
  const rawHeaderBse = companyInfo?.header?.bseScriptCode
    ? String(companyInfo.header.bseScriptCode).trim()
    : '';
  const finalBseCode = /^\d{6}$/.test(rawHeaderBse) ? rawHeaderBse : bseCode;

  // Cross-reference NSE Official CSV + Zerodha Kite + BSE Bhavcopy registries
  const nseArch = finalNseCode ? nseArchiveMap.get(finalNseCode.toUpperCase()) : undefined;
  const kiteNse = finalNseCode ? zerodhaNseMap.get(finalNseCode.toUpperCase()) : undefined;
  const kiteBse =
    (finalBseCode ? zerodhaBseMap.get(finalBseCode) : undefined) ||
    (finalNseCode ? zerodhaBseMap.get(finalNseCode.toUpperCase()) : undefined);
  const bseBhavMatch = finalBseCode ? bseBhavByCode.get(finalBseCode) : undefined;

  const finalSymbol = pickCleanAlphaSymbol(
    [
      finalNseCode,
      companyInfo?.header?.bseTradingSymbol,
      existing?.symbol,
      bseBhavMatch?.symbol,
      kiteBse?.tradingsymbol,
      cleanSymbol,
    ],
    (finalBseCode || cleanSymbol).toUpperCase()
  );

  const price =
    primaryLive?.ltp ??
    round2(yahooMeta?.regularMarketPrice) ??
    existing?.currentPrice ??
    null;
  const nseBhavMatch = finalNseCode ? nseBhavBySym.get(finalNseCode.toUpperCase()) : undefined;
  const secondLastCandleClose =
    candles.length >= 2 && candles[candles.length - 1]?.close === price
      ? round2(candles[candles.length - 2].close)
      : candles.length >= 1 && candles[candles.length - 1]?.close !== price
        ? round2(candles[candles.length - 1].close)
        : null;
  let prevClose =
    primaryLive?.previousClose ??
    round2(yahooMeta?.previousClose) ??
    existing?.previousClose ??
    price;
  if (prevClose === null || (prevClose === price && (!primaryLive?.dayChange || primaryLive.dayChange === 0))) {
    const candidatePrev =
      (existing?.previousClose && existing.previousClose !== price ? existing.previousClose : null) ??
      (nseBhavMatch?.prevClose && nseBhavMatch.prevClose !== price ? nseBhavMatch.prevClose : null) ??
      (bseBhavMatch?.prevClose && bseBhavMatch.prevClose !== price ? bseBhavMatch.prevClose : null) ??
      (round2(yahooMeta?.previousClose) && round2(yahooMeta?.previousClose) !== price
        ? round2(yahooMeta?.previousClose)
        : null) ??
      (secondLastCandleClose && secondLastCandleClose !== price ? secondLastCandleClose : null);
    if (candidatePrev !== null && price !== null && Math.abs(candidatePrev - price) / price < 0.35) {
      prevClose = round2(candidatePrev);
    }
  }
  const open =
    primaryLive?.open ??
    (candles.length > 0 ? candles[candles.length - 1].open : existing?.open ?? prevClose);
  const dayHigh =
    primaryLive?.high ??
    round2(yahooMeta?.regularMarketDayHigh) ??
    existing?.dayHigh ??
    price;
  const dayLow =
    primaryLive?.low ??
    round2(yahooMeta?.regularMarketDayLow) ??
    existing?.dayLow ??
    price;
  const volume =
    primaryLive?.volume ??
    (typeof yahooMeta?.regularMarketVolume === 'number'
      ? Math.round(yahooMeta.regularMarketVolume)
      : existing?.volume ?? null);

  const week52High =
    round2(companyInfo?.priceData?.nse?.yearHighPrice ?? companyInfo?.priceData?.bse?.yearHighPrice) ??
    round2(yahooMeta?.fiftyTwoWeekHigh) ??
    existing?.week52High ??
    null;
  const week52Low =
    round2(companyInfo?.priceData?.nse?.yearLowPrice ?? companyInfo?.priceData?.bse?.yearLowPrice) ??
    round2(yahooMeta?.fiftyTwoWeekLow) ??
    existing?.week52Low ??
    null;

  // Parse fundamentals from Groww company filings
  const fundMap = new Map<string, string>();
  for (const f of companyInfo?.fundamentals ?? []) {
    if (f.shortName && f.value) fundMap.set(f.shortName.toLowerCase(), f.value);
    if (f.name && f.value) fundMap.set(f.name.toLowerCase(), f.value);
  }

  const mcapParsed = parseNumericFundamental(fundMap.get('mkt cap') || fundMap.get('market cap'));
  const peParsed = parseNumericFundamental(fundMap.get('p/e ratio(ttm)'));
  const pbParsed = parseNumericFundamental(fundMap.get('p/b ratio'));
  const roeParsed = parseNumericFundamental(fundMap.get('roe'));
  const epsParsed = parseNumericFundamental(fundMap.get('eps(ttm)'));
  const bookValParsed = parseNumericFundamental(fundMap.get('book value'));
  const industryPeParsed = parseNumericFundamental(fundMap.get('industry p/e'));
  const faceValueParsed = parseNumericFundamental(fundMap.get('face value'));
  const divParsed = parseNumericFundamental(fundMap.get('div yield') || fundMap.get('dividend yield'));
  const debtParsed = parseNumericFundamental(fundMap.get('debt to equity'));

  const companyProfile: StockCompanyProfile | null = companyInfo
    ? {
        ceo: companyInfo.details?.ceo ?? null,
        managingDirector: companyInfo.details?.managingDirector ?? null,
        foundedYear: companyInfo.details?.foundedYear ?? null,
        businessSummary: companyInfo.details?.businessSummary ?? null,
        epsTtm: epsParsed,
        bookValue: bookValParsed,
        industryPe: industryPeParsed,
        faceValue: faceValueParsed ?? nseArch?.faceValue ?? null,
      }
    : existing?.companyProfile ?? null;

  const registry: StockRegistryMetadata = {
    nseSeries: nseArch?.series ?? existing?.registry?.nseSeries ?? null,
    nseListingDate: nseArch?.listingDate ?? existing?.registry?.nseListingDate ?? null,
    faceValue: faceValueParsed ?? nseArch?.faceValue ?? existing?.registry?.faceValue ?? null,
    marketLot: nseArch?.marketLot ?? kiteNse?.lotSize ?? existing?.registry?.marketLot ?? 1,
    tickSize: kiteNse?.tickSize ?? kiteBse?.tickSize ?? existing?.registry?.tickSize ?? 0.05,
    zerodhaNseToken: kiteNse?.instrumentToken ?? existing?.registry?.zerodhaNseToken ?? null,
    zerodhaBseToken: kiteBse?.instrumentToken ?? existing?.registry?.zerodhaBseToken ?? null,
    isFnoEnabled: Boolean(
      companyInfo?.header?.isFnoEnabled ||
        companyInfo?.header?.isNseFnoEnabled ||
        existing?.registry?.isFnoEnabled
    ),
  };

  // Shareholding pattern quarters
  const shareholding: StockShareholdingQuarter[] = companyInfo?.shareholdingPatternV2?.data
    ? Object.entries(companyInfo.shareholdingPatternV2.data).map(([quarter, vals]) => ({
        quarter,
        promoters: round2(vals.promoters),
        fii: round2(vals.fii),
        dii: round2(vals.dii),
        public: round2(vals.public),
        others: round2(vals.others),
      }))
    : existing?.shareholding || [];

  // Financial statements (Consolidated + Standalone)
  const financialStatements: StockFinancialSeries[] = [];
  const cons = parseFinancialSeries(companyInfo?.financialStatementV2?.CONSOLIDATED, 'CONSOLIDATED');
  const stnd = parseFinancialSeries(companyInfo?.financialStatementV2?.STANDALONE, 'STANDALONE');
  if (cons) financialStatements.push(cons);
  if (stnd) financialStatements.push(stnd);
  const finalFinancials =
    financialStatements.length > 0 ? financialStatements : existing?.financialStatements || [];

  // Peer comparisons (resolve alphabetical symbol where available instead of numeric BSE scrip code)
  const peers: StockPeerComparison[] = companyInfo?.similarAssets?.peerList
    ? companyInfo.similarAssets.peerList
        .map((p): StockPeerComparison | null => {
          const pBse = p.companyHeader?.bseScriptCode ? String(p.companyHeader.bseScriptCode).trim() : '';
          const pKiteBse = pBse ? zerodhaBseMap.get(pBse) : undefined;
          const pBhavBse = pBse ? bseBhavByCode.get(pBse) : undefined;
          const sym = pickCleanAlphaSymbol(
            [p.companyHeader?.nseScriptCode, pBhavBse?.symbol, pKiteBse?.tradingsymbol],
            pBse
          );
          if (!sym) return null;
          const matchedPeer = findStockInUniverse(sym);
          return {
            symbol: sym,
            companyName: p.companyHeader?.displayName || matchedPeer?.companyName || sym,
            logoUrl: matchedPeer?.logoUrl ?? null,
            marketCapCr: round2(p.marketCap),
            pe: round2(p.peRatio),
            pb: round2(p.pbRatio),
            yearHigh: round2(p.nseYearHigh ?? p.bseYearHigh),
            yearLow: round2(p.nseYearLow ?? p.bseYearLow),
          };
        })
        .filter((x): x is StockPeerComparison => x !== null)
    : existing?.peers || [];

  // Mutual Funds holding this equity
  const fundsInvested: StockMutualFundHolding[] = companyInfo?.fundsInvested
    ? companyInfo.fundsInvested.slice(0, 8).map((f) => ({
        name: f.name || 'Mutual Fund',
        investedAumPct: round2(f.investedAumPercent),
        rating: f.rating ?? null,
        return1y: round2(f.return1y),
        return3y: round2(f.return3y),
      }))
    : existing?.fundsInvested || [];

  const dataSourcesUsed: string[] = [];
  if (nseQuote || nseArch) dataSourcesUsed.push('NSE India');
  if (bseQuote || finalBseCode) dataSourcesUsed.push('BSE India');
  if (companyInfo || primaryLive) dataSourcesUsed.push('Groww Exchange & Filings');
  if (kiteNse || kiteBse) dataSourcesUsed.push('Zerodha Kite Registry');
  if (finalYahoo) dataSourcesUsed.push('Yahoo Finance Historical');

  const nowIso = new Date().toISOString();
  const lastTradeIso =
    primaryLive?.lastTradeTime ??
    toIsoFromEpochSec(yahooMeta?.regularMarketTime) ??
    existing?.lastTradeTime ??
    nowIso;

  const finalExchange: StockInstrument['exchange'] =
    finalNseCode && finalBseCode ? 'NSE/BSE' : finalNseCode ? 'NSE' : 'BSE';

  const validExistingBse =
    existing?.bseCode && /^\d{6}$/.test(existing.bseCode) ? existing.bseCode : null;

  // Compute YoY Revenue & Profit growth from latest yearly statements when available
  const extractYoYGrowth = (rows: GrowwFinRow[] | undefined, title: string): number | null => {
    const row = rows?.find((r) => (r.title || '').toLowerCase() === title.toLowerCase());
    if (!row?.yearly) return null;
    const vals = Object.entries(row.yearly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
    if (vals.length < 2) return null;
    const prev = vals[vals.length - 2];
    const curr = vals[vals.length - 1];
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || Math.abs(prev) < 0.01) return null;
    return Number((((curr - prev) / Math.abs(prev)) * 100).toFixed(2));
  };
  const stmtRows =
    companyInfo?.financialStatementV2?.CONSOLIDATED?.length
      ? companyInfo.financialStatementV2.CONSOLIDATED
      : companyInfo?.financialStatementV2?.STANDALONE;
  const revGrowthParsed = extractYoYGrowth(stmtRows, 'Revenue');
  const profGrowthParsed = extractYoYGrowth(stmtRows, 'Profit');

  const resolvedLogoUrl =
    normalizeGrowwLogoUrl(companyInfo?.header?.logoUrl) ??
    getCachedLogoUrl(finalSymbol, finalBseCode) ??
    existing?.logoUrl ??
    null;
  if (resolvedLogoUrl) {
    recordVerifiedLogoUrl(finalSymbol, finalBseCode, resolvedLogoUrl);
  }

  const sectorInfo = resolveSectorForStock({
    companyName: resolvedName,
    curatedSector: companyInfo?.header?.industryName || existing?.sector,
    curatedIndustry: companyInfo?.header?.industryName || existing?.industry,
    symbol: finalSymbol,
  });

  const resolvedFundamentals: StockInstrument['fundamentals'] = {
    pe: peParsed ?? existing?.fundamentals.pe ?? null,
    pb: pbParsed ?? existing?.fundamentals.pb ?? null,
    roePct: roeParsed ?? existing?.fundamentals.roePct ?? null,
    rocePct: existing?.fundamentals.rocePct ?? null,
    debtToEquity: debtParsed ?? existing?.fundamentals.debtToEquity ?? null,
    revenueGrowthPct: revGrowthParsed ?? existing?.fundamentals.revenueGrowthPct ?? null,
    profitGrowthPct: profGrowthParsed ?? existing?.fundamentals.profitGrowthPct ?? null,
    dividendYieldPct: divParsed ?? existing?.fundamentals.dividendYieldPct ?? null,
    reportingPeriod: companyInfo?.fundamentals?.length
      ? 'TTM Live Exchange Filings'
      : existing?.fundamentals.reportingPeriod || 'Exchange Quote Feed',
    source: companyInfo?.fundamentals?.length
      ? 'NSE/BSE Company Filings (via Groww)'
      : existing?.fundamentals.source || 'NSE/BSE Adapter',
  };

  const resolvedSector = normalizeSectorLabel(companyInfo?.header?.industryName || sectorInfo.sector);
  const resolvedIndustry = normalizeSectorLabel(companyInfo?.header?.industryName || sectorInfo.industry);

  if (companyInfo) {
    const store = getEnrichmentStore();
    store.details[finalSymbol] = {
      searchId: searchId || existing?.searchId,
      sector: resolvedSector,
      industry: resolvedIndustry,
      logoUrl: resolvedLogoUrl,
      marketCapCr: mcapParsed ?? existing?.marketCapCr ?? null,
      week52High,
      week52Low,
      fundamentals: resolvedFundamentals,
      companyProfile,
      updatedAt: nowIso,
    };
    scheduleEnrichmentSave();
  }

  const updated: StockInstrument = {
    id: existing?.id || createId('stk'),
    symbol: finalSymbol,
    bseCode: finalBseCode || validExistingBse || 'N/A',
    yahooSymbol: finalNseCode ? `${finalNseCode}.NS` : `${finalBseCode || cleanSymbol}.BO`,
    searchId: searchId || existing?.searchId,
    companyName: pickBestCompanyName({
      primary: companyInfo?.header?.displayName,
      curated: existing?.companyName,
      nseArch: nseArch?.companyName,
      kiteNse: kiteNse?.companyName,
      kiteBse: kiteBse?.companyName,
      bhavName: yahooMeta?.longName || yahooMeta?.shortName || resolvedName,
      searchId: searchId || existing?.searchId,
      symbol: finalSymbol,
      bseCode: finalBseCode || validExistingBse,
    }),
    logoUrl: resolvedLogoUrl,
    exchange: finalExchange,
    sector: resolvedSector,
    industry: resolvedIndustry,
    isin: nseArch?.isin || companyInfo?.header?.isin || existing?.isin || resolvedIsin,
    currentPrice: price,
    previousClose: prevClose,
    open,
    dayHigh,
    dayLow,
    week52High,
    week52Low,
    volume,
    marketCapCr: mcapParsed ?? existing?.marketCapCr ?? null,
    lastTradeTime: lastTradeIso,
    nseQuote,
    bseQuote,
    fundamentals: resolvedFundamentals,
    companyProfile,
    registry,
    shareholding,
    financialStatements: finalFinancials,
    peers,
    fundsInvested,
    dataSourcesUsed,
    sparkline:
      candles.length > 0
        ? candles.slice(-14).map((c) => c.close)
        : existing?.sparkline || [],
    historicalSeries:
      candles.length > 0 ? candles : existing?.historicalSeries || [],
    announcements: existing?.announcements || [],
    ipoHistorySlug: existing?.ipoHistorySlug,
    provenance: {
      source: dataSourcesUsed.length > 0 ? dataSourcesUsed.join(' · ') : `${finalExchange} Feed`,
      retrievedAt: nowIso,
      effectiveDate: lastTradeIso.slice(0, 10),
      verificationStatus: 'Verified',
      qualityStatus: primaryLive ? 'VERIFIED' : 'DELAYED',
      currency: 'INR',
      unit: 'INR per share',
      dataCategory: 'Equity Quote & Fundamentals',
    },
  };

  const dbIdx = db.stocks.findIndex(
    (s) => s.symbol.toUpperCase() === updated.symbol.toUpperCase()
  );
  if (dbIdx >= 0) {
    db.stocks[dbIdx] = updated;
  } else {
    db.stocks.push(updated);
  }

  const uniIdx = liveUniverseCache.findIndex(
    (s) => s.symbol.toUpperCase() === updated.symbol.toUpperCase()
  );
  if (uniIdx >= 0) {
    liveUniverseCache[uniIdx] = updated;
  } else if (liveUniverseCache.length > 0) {
    liveUniverseCache.unshift(updated);
  }

  const linkedIpo = db.ipos.find((i) => i.listing.stockSymbol === updated.symbol);
  if (linkedIpo) {
    linkedIpo.listing.currentMarketPrice = updated.currentPrice;
    linkedIpo.listing.previousClose = updated.previousClose;
    linkedIpo.listing.priceStatus = updated.provenance.qualityStatus;
    linkedIpo.listing.provenance = { ...updated.provenance };
  }

  saveDb();
  evaluatePriceAlerts();
  return { stock: updated, fromUpstream: Boolean(primaryLive || finalYahoo || companyInfo) };
}

export function evaluatePriceAlerts(): number {
  const db = getDb();
  let triggeredCount = 0;
  const now = new Date().toISOString();

  for (const alert of db.priceAlerts) {
    if (!alert.enabled || alert.status !== 'ACTIVE') continue;
    const stock = findStockInUniverse(alert.symbol);
    if (!stock || stock.currentPrice === null) continue;

    const current = stock.currentPrice;
    let shouldTrigger = false;
    let reason = '';

    if (alert.conditionType === 'PRICE_ABOVE' && current >= alert.targetValue) {
      shouldTrigger = true;
      reason = `${alert.symbol} reached ₹${current.toFixed(2)} (target ≥ ₹${alert.targetValue.toFixed(2)})`;
    } else if (alert.conditionType === 'PRICE_BELOW' && current <= alert.targetValue) {
      shouldTrigger = true;
      reason = `${alert.symbol} moved to ₹${current.toFixed(2)} (target ≤ ₹${alert.targetValue.toFixed(2)})`;
    } else if (
      alert.conditionType === 'PCT_CHANGE_UP' &&
      stock.previousClose &&
      stock.previousClose > 0
    ) {
      const pct = ((current - stock.previousClose) / stock.previousClose) * 100;
      if (pct >= alert.targetValue) {
        shouldTrigger = true;
        reason = `${alert.symbol} gained +${pct.toFixed(2)}% (target +${alert.targetValue}%)`;
      }
    } else if (
      alert.conditionType === 'PCT_CHANGE_DOWN' &&
      stock.previousClose &&
      stock.previousClose > 0
    ) {
      const pct = ((current - stock.previousClose) / stock.previousClose) * 100;
      if (pct <= -Math.abs(alert.targetValue)) {
        shouldTrigger = true;
        reason = `${alert.symbol} declined ${pct.toFixed(2)}% (target -${Math.abs(alert.targetValue)}%)`;
      }
    }

    if (shouldTrigger) {
      alert.status = 'TRIGGERED';
      alert.triggeredAt = now;
      alert.triggeredPrice = current;
      alert.updatedAt = now;
      alert.history.unshift({
        timestamp: now,
        event: `Triggered: ${reason}`,
        priceAtEvent: current,
      });
      db.notifications.unshift({
        id: createId('notif'),
        userId: alert.userId,
        category: 'PRICE_ALERT',
        title: `Price Alert Triggered: ${alert.symbol}`,
        message: reason,
        link: `/stock/${alert.symbol}`,
        read: false,
        createdAt: now,
      });
      triggeredCount += 1;
    }
  }

  if (triggeredCount > 0) {
    saveDb();
  }
  return triggeredCount;
}

const enrichmentAttemptedSymbols = new Set<string>();
const logoSweepAttemptedSymbols = new Set<string>();
const missingQuoteAttemptedSymbols = new Map<string, number>();

export async function runBackgroundMarketEnrichment(batchSize = 40): Promise<{
  mappedIndustries: number;
  enrichedDetails: number;
  probedLogos: number;
  hydratedQuotes: number;
}> {
  if (liveUniverseCache.length === 0) {
    await syncAllIndianStocks();
  }
  const store = getEnrichmentStore();
  let mappedIndustries = 0;
  let enrichedDetails = 0;
  let probedLogos = 0;
  let hydratedQuotes = 0;

  // 1. Discover official industryNames for unknown Groww industryCodes
  const unknownCodes = Array.from(industryCodeSamples.entries())
    .filter(([code]) => !store.industryCodes[String(code)])
    .slice(0, 35);
  if (unknownCodes.length > 0) {
    await Promise.all(
      unknownCodes.map(async ([code, sampleSearchId]) => {
        const info = await fetchGrowwCompanyDetails(sampleSearchId);
        const indName = info?.header?.industryName?.trim();
        if (indName) {
          store.industryCodes[String(code)] = normalizeSectorLabel(indName);
          mappedIndustries += 1;
        }
      })
    );
    if (mappedIndustries > 0) {
      scheduleEnrichmentSave();
      await syncAllIndianStocks(true).catch(() => []);
    }
  }

  // 2. Enrich top large/mid-cap stocks with P/E, P/B, ROE, growth, marketCap, profile, and official logos
  const detailTargets = liveUniverseCache
    .filter(
      (s) =>
        s.searchId &&
        !enrichmentAttemptedSymbols.has(s.symbol) &&
        (s.fundamentals.pe === null || !s.companyProfile?.businessSummary || !s.logoUrl)
    )
    .slice(0, batchSize);

  const detailChunkSize = 8;
  for (let i = 0; i < detailTargets.length; i += detailChunkSize) {
    const chunk = detailTargets.slice(i, i + detailChunkSize);
    await Promise.all(
      chunk.map(async (s) => {
        enrichmentAttemptedSymbols.add(s.symbol);
        const info = await fetchGrowwCompanyDetails(s.searchId!);
        if (!info) return;

        const fundMap = new Map<string, string>();
        for (const f of info.fundamentals ?? []) {
          if (f.shortName && f.value) fundMap.set(f.shortName.toLowerCase(), f.value);
          if (f.name && f.value) fundMap.set(f.name.toLowerCase(), f.value);
        }

        const extractYoY = (rows: GrowwFinRow[] | undefined, title: string): number | null => {
          const row = rows?.find((r) => (r.title || '').toLowerCase() === title.toLowerCase());
          if (!row?.yearly) return null;
          const vals = Object.entries(row.yearly)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => v);
          if (vals.length < 2) return null;
          const prev = vals[vals.length - 2];
          const curr = vals[vals.length - 1];
          if (!Number.isFinite(prev) || !Number.isFinite(curr) || Math.abs(prev) < 0.01) return null;
          return Number((((curr - prev) / Math.abs(prev)) * 100).toFixed(2));
        };
        const stRows = info.financialStatementV2?.CONSOLIDATED?.length
          ? info.financialStatementV2.CONSOLIDATED
          : info.financialStatementV2?.STANDALONE;

        const mcap = parseNumericFundamental(fundMap.get('mkt cap') || fundMap.get('market cap'));
        if (mcap && s.marketCapCr === null) s.marketCapCr = mcap;
        const yHigh = round2(info.priceData?.nse?.yearHighPrice ?? info.priceData?.bse?.yearHighPrice);
        const yLow = round2(info.priceData?.nse?.yearLowPrice ?? info.priceData?.bse?.yearLowPrice);
        if (yHigh && s.week52High === null) s.week52High = yHigh;
        if (yLow && s.week52Low === null) s.week52Low = yLow;

        const nextFund: StockInstrument['fundamentals'] = {
          pe: parseNumericFundamental(fundMap.get('p/e ratio(ttm)')) ?? s.fundamentals.pe,
          pb: parseNumericFundamental(fundMap.get('p/b ratio')) ?? s.fundamentals.pb,
          roePct: parseNumericFundamental(fundMap.get('roe')) ?? s.fundamentals.roePct,
          rocePct: s.fundamentals.rocePct,
          debtToEquity: parseNumericFundamental(fundMap.get('debt to equity')) ?? s.fundamentals.debtToEquity,
          revenueGrowthPct: extractYoY(stRows, 'Revenue') ?? s.fundamentals.revenueGrowthPct,
          profitGrowthPct: extractYoY(stRows, 'Profit') ?? s.fundamentals.profitGrowthPct,
          dividendYieldPct:
            parseNumericFundamental(fundMap.get('div yield') || fundMap.get('dividend yield')) ??
            s.fundamentals.dividendYieldPct,
          reportingPeriod: info.fundamentals?.length ? 'TTM Live Exchange Filings' : s.fundamentals.reportingPeriod,
          source: info.fundamentals?.length ? 'NSE/BSE Company Filings (via Groww)' : s.fundamentals.source,
        };

        const logo =
          normalizeGrowwLogoUrl(info.header?.logoUrl) ??
          (await probeAndCacheStockLogo({
            symbol: s.symbol,
            bseCode: s.bseCode,
            searchId: s.searchId,
            logoUrl: s.logoUrl,
            companyName: s.companyName,
          }));
        if (logo) {
          s.logoUrl = logo;
          recordVerifiedLogoUrl(s.symbol, s.bseCode, logo);
        }

        const indName = info.header?.industryName?.trim();
        if (indName) {
          const cleanSec = normalizeSectorLabel(indName);
          s.sector = cleanSec;
          s.industry = cleanSec;
        }
        s.fundamentals = nextFund;
        if (info.details) {
          s.companyProfile = {
            ceo: info.details.ceo ?? null,
            managingDirector: info.details.managingDirector ?? null,
            foundedYear: info.details.foundedYear ?? null,
            businessSummary: info.details.businessSummary ?? null,
            epsTtm: parseNumericFundamental(fundMap.get('eps(ttm)')),
            bookValue: parseNumericFundamental(fundMap.get('book value')),
            industryPe: parseNumericFundamental(fundMap.get('industry p/e')),
            faceValue: parseNumericFundamental(fundMap.get('face value')),
          };
        }
        store.details[s.symbol.toUpperCase()] = {
          searchId: s.searchId,
          sector: s.sector,
          industry: s.industry,
          logoUrl: s.logoUrl,
          marketCapCr: s.marketCapCr,
          week52High: s.week52High,
          week52Low: s.week52Low,
          fundamentals: s.fundamentals,
          companyProfile: s.companyProfile,
          updatedAt: new Date().toISOString(),
        };
        enrichedDetails += 1;
      })
    );
  }

  // 3. Dedicated fast company-logo sweep across top equities missing logoUrl
  const logoSweepTargets = liveUniverseCache
    .filter((s) => !s.logoUrl && !logoSweepAttemptedSymbols.has(s.symbol))
    .slice(0, 60);
  for (let i = 0; i < logoSweepTargets.length; i += 20) {
    const chunk = logoSweepTargets.slice(i, i + 20);
    await Promise.all(
      chunk.map(async (s) => {
        logoSweepAttemptedSymbols.add(s.symbol);
        const logo = await probeAndCacheStockLogo({
          symbol: s.symbol,
          bseCode: s.bseCode,
          searchId: s.searchId,
          logoUrl: s.logoUrl,
          companyName: s.companyName,
        });
        if (logo) {
          s.logoUrl = logo;
          probedLogos += 1;
        }
      })
    );
  }

  // 4. Hydrate missing live prices across remaining NSE/BSE equities in background
  const now = Date.now();
  const missingPriceTargets = liveUniverseCache
    .filter((s) => {
      if (s.currentPrice !== null) return false;
      const lastTry = missingQuoteAttemptedSymbols.get(s.symbol) ?? 0;
      return now - lastTry > 10 * 60_000;
    })
    .slice(0, 50);

  const quoteChunkSize = 10;
  for (let i = 0; i < missingPriceTargets.length; i += quoteChunkSize) {
    const chunk = missingPriceTargets.slice(i, i + quoteChunkSize);
    await Promise.all(
      chunk.map(async (s) => {
        missingQuoteAttemptedSymbols.set(s.symbol, Date.now());
        const hit = await fetchHydrationQuote(s);
        if (hit && hit.quote.ltp !== null) {
          applyHydratedQuoteToStock(s, hit.quote, hit.sourceLabel);
          hydratedQuotes += 1;
        }
        if (!s.logoUrl) {
          const logo = await probeAndCacheStockLogo({
            symbol: s.symbol,
            bseCode: s.bseCode,
            searchId: s.searchId,
            logoUrl: s.logoUrl,
            companyName: s.companyName,
          });
          if (logo) {
            s.logoUrl = logo;
            probedLogos += 1;
          }
        }
      })
    );
  }

  if (enrichedDetails > 0 || probedLogos > 0 || hydratedQuotes > 0) {
    scheduleEnrichmentSave();
  }
  return { mappedIndustries, enrichedDetails, probedLogos, hydratedQuotes };
}
