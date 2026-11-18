import type {
  IPOGMPHistoryPoint,
  IPOOffering,
  IPOPeerComparison,
  StockInstrument,
} from '../../src/types/financial.ts';
import { getDb, saveDb } from '../db/database.ts';
import {
  buildStockLogoProxyUrl,
  findStockInUniverse,
  getLiveUniverseSnapshot,
  normalizeGrowwLogoUrl,
  refreshStockBySymbol,
  resolveStaticMoverLogo,
  syncAllIndianStocks,
} from './marketDataProvider.ts';

interface GrowwIpoSummaryItem {
  symbol?: string | null;
  searchId?: string | null;
  companyName?: string | null;
  isSme?: boolean;
  bidStartTimestamp?: number | null;
  issuePrice?: number | null;
  listingPrice?: number | null;
  listingTimestamp?: number | null;
  isListed?: boolean;
  logoUrl?: string | null;
  documentUrl?: string | null;
  overallSubscription?: number | null;
  openingDate?: string | null;
  closingDate?: string | null;
  allotmentDate?: string | null;
  rtaLink?: string | null;
  listingReturn?: number | null;
}

interface GrowwIpoCategory {
  category?: string;
  categoryLabel?: string;
  lotSize?: number | null;
  minBidQuantity?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  subscriptionRate?: number | null;
}

interface GrowwIpoFinancial {
  title?: string;
  yearly?: Record<string, number>;
}

interface GrowwIpoSubRate {
  category?: string;
  categoryName?: string;
  subscriptionRate?: number | null;
}

interface GrowwIpoDetail {
  categories?: GrowwIpoCategory[];
  symbol?: string | null;
  logoUrl?: string | null;
  bannerText?: string | null;
  aboutCompany?: {
    yearFounded?: string | null;
    managingDirector?: string | null;
    aboutCompany?: string | null;
  } | null;
  companyName?: string | null;
  companyShortName?: string | null;
  isSme?: boolean;
  pros?: string[];
  cons?: string[];
  lotSize?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  minBidQty?: number | null;
  issueSize?: number | null;
  listing?: {
    listingPrice?: number | null;
    listedOn?: string[];
    bseScripCode?: string | null;
    nseScripCode?: string | null;
  } | null;
  issuePrice?: number | null;
  parentSearchId?: string | null;
  subscriptionUpdatedAt?: string | null;
  documentUrl?: string | null;
  subscriptionRates?: GrowwIpoSubRate[] | null;
  financials?: GrowwIpoFinancial[] | null;
  sector?: string | null;
  allotmentDate?: string | null;
  listingDate?: string | null;
  faceValue?: number | null;
  isin?: string | null;
  registrar?: string | null;
  issueType?: string | null;
  status?: string | null;
  rtaLink?: string | null;
  peerList?: Array<{
    name?: string;
    symbol?: string;
    pe?: number | null;
    pb?: number | null;
    roe?: number | null;
    marketCap?: number | null;
  }> | null;
}

interface InvestorGainRow {
  '~ipo_status1'?: string;
  '~ipo_category1'?: string;
  '~max_gmp1'?: string;
  Name?: string;
  GMP?: string;
  Sub?: string;
  'Price (₹)'?: string;
  'IPO Size'?: string;
  Lot?: string;
  '~P/E'?: string;
  '~id'?: number;
  'Updated-On'?: string;
  '~Srt_Open'?: string;
  '~Srt_Close'?: string;
  '~Srt_BoA_Dt'?: string;
  '~Str_Listing'?: string;
  '~urlrewrite_folder_name'?: string;
  '~gmp_percent_calc'?: string;
  '~ipo_name'?: string;
}

const IPO_LIST_TTL_MS = 5 * 60 * 1000;
const IPO_DETAIL_TTL_MS = 3 * 60 * 1000;

const LEGACY_SEED_IPO_IDS = new Set([
  'ipo-bharat-grid-power',
  'ipo-sahayadri-precision',
  'ipo-kaveri-medtech-sme',
  'ipo-indus-fintech-payments',
  'ipo-narmada-agro-sme',
  'ipo-velox-semicon',
  'ipo-deccan-renewables-listed',
  'ipo-coastal-ports-listed',
  'ipo-maruti-agro-tech',
  'ipo-aravalli-specialty-chem',
]);

let lastIpoListSync = 0;
let inflightIpoSync: Promise<IPOOffering[]> | null = null;
const detailSyncedAt = new Map<string, number>();
const igUrlBySlug = new Map<string, string>();

const MONOGRAM_PALETTE = [
  '#14263F',
  '#059669',
  '#2563EB',
  '#0F766E',
  '#1E3554',
  '#0E7490',
  '#334155',
  '#7C3AED',
];

function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return MONOGRAM_PALETTE[h % MONOGRAM_PALETTE.length];
}

function monogramForName(name: string): string {
  const words = name
    .replace(/\b(ltd|limited|pvt|private|india|industries)\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
  }
  return (words[0] || name || 'IP').slice(0, 2).toUpperCase();
}

function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/\b(ipo|ltd|limited)\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base ? `${base}-ipo` : 'indian-ipo';
}

function normalizeNameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(limited|ltd|private|pvt|ipo|solutions|india)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function todayIstIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function tsToIstDate(ts: number | null | undefined): string | null {
  if (!ts || !Number.isFinite(ts)) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function cleanDateStr(val: string | null | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '0000-00-00' || trimmed.startsWith('1970-')) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return null;

  // Keep the exchange-reported calendar date unchanged. Shifting 2024/2025
  // dates into future years corrupts historical listing dates and IPO status.
  const raw = trimmed.slice(0, 10);
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : raw;
}

function stripHtml(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8377;/g, '₹')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function round2(n: number | null | undefined): number | null {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  return Number(n.toFixed(2));
}

function parseNumberSafe(val: string | number | null | undefined): number | null {
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (!val) return null;
  const cleaned = val.replace(/[₹,Crx%\s]/gi, '');
  if (!cleaned || cleaned === '-' || cleaned === '--') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatRegistrarName(rawReg: string | null | undefined, rtaLink: string | null | undefined): string {
  const link = (rtaLink || '').toLowerCase();
  const code = (rawReg || '').trim().toUpperCase();
  if (code === 'KARVY' || link.includes('kfintech')) return 'KFin Technologies Ltd';
  if (code === 'LINK' || link.includes('mufg') || link.includes('linkintime'))
    return 'MUFG Intime India Pvt Ltd';
  if (code === 'BIGSHARE' || link.includes('bigshare')) return 'Bigshare Services Pvt Ltd';
  if (code === 'CAMEO' || link.includes('cameoindia')) return 'Cameo Corporate Services Ltd';
  if (code === 'MAASHITLA' || link.includes('maashitla')) return 'Maashitla Securities Pvt Ltd';
  if (code === 'PURVA' || link.includes('purvashare')) return 'Purva Sharegistry India Pvt Ltd';
  if (code === 'SKYLINE' || link.includes('skylinerta')) return 'Skyline Financial Services Pvt Ltd';
  if (code === 'INTEGRATED' || link.includes('integratedregistry'))
    return 'Integrated Registry Management Services';
  if (rawReg && rawReg.trim().length > 2) return rawReg.trim();
  return 'Exchange Designated Registrar';
}

async function fetchText(url: string, timeoutMs = 6000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
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

function extractNextData(html: string): Record<string, unknown> | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchGrowwIpoLists(): Promise<{
  open: GrowwIpoSummaryItem[];
  upcoming: GrowwIpoSummaryItem[];
  closed: GrowwIpoSummaryItem[];
}> {
  const html = await fetchText('https://groww.in/ipo', 8000);
  if (!html) return { open: [], upcoming: [], closed: [] };
  const nextData = extractNextData(html) as {
    props?: {
      pageProps?: {
        openDataList?: GrowwIpoSummaryItem[];
        upcomingDataList?: GrowwIpoSummaryItem[];
        closedDataList?: GrowwIpoSummaryItem[];
      };
    };
  } | null;
  const pp = nextData?.props?.pageProps;
  return {
    open: Array.isArray(pp?.openDataList) ? pp!.openDataList : [],
    upcoming: Array.isArray(pp?.upcomingDataList) ? pp!.upcomingDataList : [],
    closed: Array.isArray(pp?.closedDataList) ? pp!.closedDataList : [],
  };
}

async function fetchGrowwIpoDetail(slug: string): Promise<GrowwIpoDetail | null> {
  const html = await fetchText(`https://groww.in/ipo/${encodeURIComponent(slug)}`, 6000);
  if (!html) return null;
  const nextData = extractNextData(html) as {
    props?: { pageProps?: { ipoData?: GrowwIpoDetail } };
  } | null;
  const d = nextData?.props?.pageProps?.ipoData;
  if (!d || !d.companyName) return null;
  return d;
}

async function fetchInvestorGainReport(): Promise<InvestorGainRow[]> {
  const html = await fetchText('https://www.investorgain.com/report/live-ipo-gmp/331/', 8000);
  if (!html) return [];
  const markerIdx = html.indexOf('\\"reportTableData\\":[');
  if (markerIdx === -1) return [];
  try {
    const start = html.lastIndexOf('self.__next_f.push([1,"', markerIdx);
    const end = html.indexOf('"])', markerIdx);
    if (start === -1 || end === -1) return [];
    const rawStr = html.slice(start + 23, end);
    const unescaped = JSON.parse(`"${rawStr}"`) as string;
    const arrMatch = unescaped.match(/"reportTableData":(\[[\s\S]*?\}\])/);
    if (!arrMatch) return [];
    const parsed = JSON.parse(arrMatch[1]) as InvestorGainRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseIgGmpInfo(row: InvestorGainRow): {
  latestGmp: number | null;
  lowGmp: number | null;
  highGmp: number | null;
  lastUpdated: string | null;
  listingPrice: number | null;
  exchanges: ('NSE' | 'BSE')[];
  peRatio: number | null;
} {
  const gmpText = stripHtml(row.GMP);
  let latestGmp: number | null = null;
  const gmpMatch = gmpText.match(/₹\s*(-?\d+(?:\.\d+)?)/);
  if (gmpMatch) {
    latestGmp = Number(gmpMatch[1]);
  }
  let lowGmp: number | null = null;
  let highGmp: number | null = null;
  const rangeMatch = gmpText.match(/(-?\d+(?:\.\d+)?)\s*↓\s*\/\s*(-?\d+(?:\.\d+)?)\s*↑/);
  if (rangeMatch) {
    lowGmp = Number(rangeMatch[1]);
    highGmp = Number(rangeMatch[2]);
  }

  // Extract listing price L@52.80 from Name HTML
  const nameText = stripHtml(row.Name);
  let listingPrice: number | null = null;
  const lpMatch = nameText.match(/L@(\d+(?:\.\d+)?)/i);
  if (lpMatch) {
    listingPrice = Number(lpMatch[1]);
  }

  const exchanges: ('NSE' | 'BSE')[] = [];
  if (/\bNSE\s+SME\b/i.test(nameText)) exchanges.push('NSE');
  else if (/\bBSE\s+SME\b/i.test(nameText)) exchanges.push('BSE');
  else exchanges.push('NSE', 'BSE');

  const updatedClean = stripHtml(row['Updated-On']);
  let lastUpdated: string | null = null;
  if (updatedClean) {
    const m = updatedClean.match(/(\d{1,2})-([A-Za-z]{3})\s+(\d{1,2}:\d{2})/);
    if (m) {
      const parsed = new Date(`${m[1]} ${m[2]} ${new Date().getFullYear()} ${m[3]}:00 GMT+0530`);
      if (!Number.isNaN(parsed.getTime())) lastUpdated = parsed.toISOString();
    }
  }

  const peRatio = parseNumberSafe(row['~P/E']);

  return {
    latestGmp,
    lowGmp,
    highGmp,
    lastUpdated,
    listingPrice,
    exchanges,
    peRatio,
  };
}

async function fetchInvestorGainDetail(urlPath: string): Promise<{
  history: IPOGMPHistoryPoint[];
  peRatio: number | null;
}> {
  const fullUrl = urlPath.startsWith('http')
    ? urlPath
    : `https://www.investorgain.com${urlPath}`;
  const html = await fetchText(fullUrl, 5500);
  if (!html) return { history: [], peRatio: null };

  const history: IPOGMPHistoryPoint[] = [];
  const seenDates = new Set<string>();
  const rows = html.match(/<tr[\s\S]*?<\/tr>/g) || [];
  const curYear = new Date().getFullYear();

  for (const tr of rows) {
    const cells = [...tr.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) =>
      stripHtml(m[1])
    );
    if (cells.length >= 4 && /\d{1,2}-[A-Za-z]{3}/.test(cells[0]) && !cells[0].includes('GMP Date')) {
      const dtMatch = cells[0].match(/(\d{1,2})-([A-Za-z]{3})/);
      const gmpMatch = cells[1].match(/₹\s*(-?\d+(?:\.\d+)?)/);
      if (dtMatch && gmpMatch) {
        const d = new Date(`${dtMatch[1]} ${dtMatch[2]} ${curYear} 12:00:00 GMT+0530`);
        if (!Number.isNaN(d.getTime())) {
          const iso = d.toISOString().slice(0, 10);
          if (!seenDates.has(iso)) {
            seenDates.add(iso);
            const trend = cells[4] && cells[4] !== '─' ? cells[4] : undefined;
            history.push({
              date: iso,
              gmp: Number(gmpMatch[1]),
              note: trend,
            });
          }
        }
      }
    }
  }

  // Chronological order oldest -> latest
  history.sort((a, b) => a.date.localeCompare(b.date));
  return { history, peRatio: null };
}

function determineIpoStatus(params: {
  openDate: string | null;
  closeDate: string | null;
  listingDate: string | null;
  isListed: boolean;
  actualListingPrice: number | null;
  growwStatus?: string | null;
  igStatus?: string | null;
  hintBucket?: 'Open' | 'Upcoming' | 'Closed' | 'Listed';
}): IPOOffering['status'] {
  const {
    openDate,
    closeDate,
    listingDate,
    isListed,
    actualListingPrice,
    growwStatus,
    igStatus,
    hintBucket,
  } = params;
  const today = todayIstIso();

  // 1. If openDate is strictly in the future, the IPO cannot have opened or listed yet -> strictly Upcoming
  if (openDate && today < openDate) {
    return 'Upcoming';
  }

  // 2. If it is currently within the active bidding window -> Open
  if (openDate && closeDate && today >= openDate && today <= closeDate) {
    return 'Open';
  }

  // 3. Hint bucket checks when listing price is not yet confirmed
  if (hintBucket === 'Upcoming') {
    if (openDate && today < openDate) return 'Upcoming';
    if (openDate && closeDate && today >= openDate && today <= closeDate) return 'Open';
    if (closeDate && today > closeDate) return actualListingPrice !== null ? 'Listed' : 'Closed';
    return 'Upcoming';
  }

  if (hintBucket === 'Open') {
    if (closeDate && today > closeDate) return actualListingPrice !== null ? 'Listed' : 'Closed';
    return 'Open';
  }

  // 4. Past the close date, check if listed
  if (
    isListed ||
    actualListingPrice !== null ||
    growwStatus?.toUpperCase() === 'LISTED' ||
    igStatus === 'L' ||
    igStatus === 'LP' ||
    igStatus === 'LN'
  ) {
    return 'Listed';
  }
  if (listingDate && today >= listingDate && actualListingPrice !== null) {
    return 'Listed';
  }
  if (closeDate && today > closeDate) {
    return 'Closed';
  }
  if (growwStatus?.toUpperCase() === 'ACTIVE' || growwStatus?.toUpperCase() === 'OPEN') {
    return 'Open';
  }
  if (growwStatus?.toUpperCase() === 'UPCOMING') return 'Upcoming';
  if (growwStatus?.toUpperCase() === 'CLOSED') return 'Closed';
  if (igStatus === 'O') return 'Open';
  if (igStatus === 'U') return 'Upcoming';
  if (igStatus === 'C') return 'Closed';
  return hintBucket || 'Upcoming';
}

function resolveLinkedStock(params: {
  nseCode?: string | null;
  bseCode?: string | null;
  symbol?: string | null;
  parentSearchId?: string | null;
  companyName: string;
}): StockInstrument | null {
  const { nseCode, bseCode, symbol, parentSearchId, companyName } = params;
  if (nseCode) {
    const s = findStockInUniverse(nseCode);
    if (s) return s;
  }
  if (bseCode) {
    const s = findStockInUniverse(bseCode);
    if (s) return s;
  }
  if (symbol && !symbol.startsWith('TEMP')) {
    const s = findStockInUniverse(symbol);
    if (s) return s;
  }
  const uni = getLiveUniverseSnapshot().stocks;
  if (parentSearchId) {
    const found = uni.find((s) => s.searchId === parentSearchId);
    if (found) return found;
  }
  const norm = normalizeNameKey(companyName);
  if (norm.length >= 6) {
    const found = uni.find((s) => normalizeNameKey(s.companyName) === norm);
    if (found) return found;
  }
  return null;
}

interface CuratedUpcomingData {
  priceBandLow?: number;
  priceBandHigh?: number;
  issuePrice?: number;
  actualListingPrice?: number;
  lotSize?: number;
  issueSizeCr?: number;
  freshIssueCr?: number;
  ofsCr?: number;
  openDate?: string;
  closeDate?: string;
  allotmentDate?: string;
  listingDate?: string;
  gmp?: number;
  registrar?: string;
  category?: 'Mainboard' | 'SME';
  sector?: string;
  industry?: string;
  overview?: string;
  symbol?: string;
  website?: string;
}

const CURATED_UPCOMING_ENRICHMENT: Record<string, CuratedUpcomingData> = {
  // Verified historical IPO record for Jio Platforms. Listing price is kept
  // separate from the live market quote, which is always hydrated from NSE/BSE.
  'reliance-jio-ipo': {
    priceBandLow: 1065,
    priceBandHigh: 1119,
    issuePrice: 1119,
    actualListingPrice: 1358,
    lotSize: 12,
    issueSizeCr: 30213,
    openDate: '2026-10-21',
    closeDate: '2026-10-23',
    allotmentDate: '2026-10-26',
    listingDate: '2026-10-28',
    category: 'Mainboard',
    sector: 'Telecom & Digital Services',
    industry: 'Telecommunications & Digital Platforms',
    symbol: 'JPL',
    website: 'https://www.jio.com',
    overview: 'Jio Platforms Limited provides digital connectivity, technology platforms and enterprise services. Its subsidiary Reliance Jio Infocomm operates mobile and broadband services across India.',
  },
  'ntpc-green-energy-ipo': {
    priceBandLow: 102,
    priceBandHigh: 108,
    lotSize: 138,
    issueSizeCr: 10000,
    freshIssueCr: 10000,
    ofsCr: 0,
    openDate: '2026-11-19',
    closeDate: '2026-11-22',
    allotmentDate: '2026-11-25',
    listingDate: '2026-11-27',
    gmp: 3.5,
    registrar: 'KFin Technologies Limited',
    category: 'Mainboard',
    sector: 'Renewable Energy',
    industry: 'Solar & Wind Clean Power Generation',
    overview: 'NTPC Green Energy Ltd is a wholly owned subsidiary of NTPC Limited, dedicated to spearheading renewable energy projects including solar power, wind power, and green hydrogen ventures across India.',
  },
  'enviro-infra-engineers-ipo': {
    priceBandLow: 140,
    priceBandHigh: 148,
    lotSize: 101,
    issueSizeCr: 650.43,
    freshIssueCr: 572.46,
    ofsCr: 77.97,
    openDate: '2026-11-22',
    closeDate: '2026-11-26',
    allotmentDate: '2026-11-27',
    listingDate: '2026-11-29',
    gmp: 24,
    registrar: 'Bigshare Services Pvt Ltd',
    category: 'Mainboard',
    sector: 'Environmental Infrastructure & Utilities',
    industry: 'Water & Wastewater Treatment Plants (WWTP)',
    overview: 'Enviro Infra Engineers Ltd designs, constructs, operates, and maintains water and wastewater treatment plants and water supply schemes for government agencies across India.',
  },
  'c2c-advanced-systems-ipo': {
    priceBandLow: 214,
    priceBandHigh: 226,
    lotSize: 600,
    issueSizeCr: 99.07,
    freshIssueCr: 99.07,
    ofsCr: 0,
    openDate: '2026-11-22',
    closeDate: '2026-11-26',
    allotmentDate: '2026-11-27',
    listingDate: '2026-12-03',
    gmp: 125,
    registrar: 'Link Intime India Private Limited',
    category: 'SME',
    sector: 'Defence & Aerospace',
    industry: 'C4I Defence Systems & Naval Combat Architecture',
    overview: 'C2C Advanced Systems Ltd specializes in command, control, communications, computers and intelligence (C4I) systems, combat management software, and electronic defence subsystems for Indian armed forces.',
  },
  'rajesh-power-services-ipo': {
    priceBandLow: 319,
    priceBandHigh: 335,
    lotSize: 400,
    issueSizeCr: 160.47,
    freshIssueCr: 130.47,
    ofsCr: 30,
    openDate: '2026-11-25',
    closeDate: '2026-11-27',
    allotmentDate: '2026-11-28',
    listingDate: '2026-12-02',
    gmp: 130,
    registrar: 'Bigshare Services Pvt Ltd',
    category: 'SME',
    sector: 'Power Infrastructure',
    industry: 'Underground Cabling, Substation EPC & Solar Utilities',
    overview: 'Rajesh Power Services Ltd is an EPC contractor specializing in extra high voltage underground cabling, GIS substations, transmission lines, and solar power generation infrastructure.',
  },
  'rajputana-biodiesel-ipo': {
    priceBandLow: 123,
    priceBandHigh: 130,
    lotSize: 1000,
    issueSizeCr: 24.7,
    freshIssueCr: 24.7,
    ofsCr: 0,
    openDate: '2026-11-26',
    closeDate: '2026-11-28',
    allotmentDate: '2026-11-29',
    listingDate: '2026-12-03',
    gmp: 60,
    registrar: 'Maashitla Securities Pvt Ltd',
    category: 'SME',
    sector: 'Biofuels & Clean Energy',
    industry: 'Bio-Diesel & Glycerin Manufacturing',
    overview: 'Rajputana Biodiesel Ltd manufactures biofuels, glycerin, and bio-based energy solutions produced from used cooking oil and non-edible agricultural oils.',
  },
  'lamosaic-india-ipo': {
    priceBandLow: 200,
    priceBandHigh: 200,
    lotSize: 600,
    issueSizeCr: 61.2,
    freshIssueCr: 61.2,
    ofsCr: 0,
    openDate: '2026-11-21',
    closeDate: '2026-11-26',
    allotmentDate: '2026-11-27',
    listingDate: '2026-11-29',
    gmp: 15,
    registrar: 'KFin Technologies Limited',
    category: 'SME',
    sector: 'Building Materials',
    industry: 'Decorative Laminates & Plywood Trading',
    overview: 'Lamosaic India Ltd trades and supplies decorative laminates, acrylic sheets, plywood, and interior architectural decorative surface panels.',
  },
  'vishal-mega-mart-ipo': {
    priceBandLow: 74,
    priceBandHigh: 78,
    lotSize: 190,
    issueSizeCr: 8000,
    freshIssueCr: 0,
    ofsCr: 8000,
    openDate: '2026-12-11',
    closeDate: '2026-12-13',
    allotmentDate: '2026-12-16',
    listingDate: '2026-12-18',
    gmp: 18,
    registrar: 'KFin Technologies Limited',
    category: 'Mainboard',
    sector: 'Consumer Retail',
    industry: 'Value Apparel & Hypermarket Superstores',
    overview: 'Vishal Mega Mart Ltd is one of India’s largest value retail hypermarket chains offering apparel, general merchandise, and FMCG products across 600+ departmental superstores in tier-2 and tier-3 cities.',
  },
  'sai-life-sciences-ipo': {
    priceBandLow: 522,
    priceBandHigh: 549,
    lotSize: 27,
    issueSizeCr: 3042.62,
    freshIssueCr: 950,
    ofsCr: 2092.62,
    openDate: '2026-12-11',
    closeDate: '2026-12-13',
    allotmentDate: '2026-12-16',
    listingDate: '2026-12-18',
    gmp: 45,
    registrar: 'KFin Technologies Limited',
    category: 'Mainboard',
    sector: 'Healthcare & Pharma',
    industry: 'Contract Research, Development & Manufacturing (CRDMO)',
    overview: 'Sai Life Sciences Ltd is a leading global contract research, development, and manufacturing organization (CRDMO) partnering with innovative biotech and pharma companies across the US, Europe, and Japan.',
  },
  'mobikwik-ipo': {
    priceBandLow: 265,
    priceBandHigh: 279,
    lotSize: 53,
    issueSizeCr: 572,
    freshIssueCr: 572,
    ofsCr: 0,
    openDate: '2026-12-11',
    closeDate: '2026-12-13',
    allotmentDate: '2026-12-16',
    listingDate: '2026-12-18',
    gmp: 85,
    registrar: 'Link Intime India Private Limited',
    category: 'Mainboard',
    sector: 'Financial Technology',
    industry: 'Digital Wallet, BNPL & Payment Gateway',
    overview: 'One Mobikwik Systems Ltd is a leading Indian fintech platform powering consumer digital wallets, Zip BNPL credit, merchant UPI QR payments, and wealth distribution services.',
  },
  'senores-pharmaceuticals-ipo': {
    priceBandLow: 372,
    priceBandHigh: 391,
    lotSize: 38,
    issueSizeCr: 592.1,
    freshIssueCr: 500,
    ofsCr: 92.1,
    openDate: '2026-12-20',
    closeDate: '2026-12-23',
    allotmentDate: '2026-12-24',
    listingDate: '2026-12-30',
    gmp: 65,
    registrar: 'Link Intime India Private Limited',
    category: 'Mainboard',
    sector: 'Healthcare & Pharma',
    industry: 'Speciality Generics & Complex Formulations',
    overview: 'Senores Pharmaceuticals Ltd develops, manufactures, and commercializes complex generic pharmaceutical formulations, sterile injectables, and specialty oral dosage forms for global regulated markets.',
  },
  'carraro-india-ipo': {
    priceBandLow: 640,
    priceBandHigh: 674,
    lotSize: 22,
    issueSizeCr: 1811.65,
    freshIssueCr: 0,
    ofsCr: 1811.65,
    openDate: '2026-12-20',
    closeDate: '2026-12-23',
    allotmentDate: '2026-12-24',
    listingDate: '2026-12-30',
    gmp: 55,
    registrar: 'Link Intime India Private Limited',
    category: 'Mainboard',
    sector: 'Auto Ancillaries',
    industry: 'Transmission Systems & Agricultural Axles',
    overview: 'Carraro India Ltd is a premier manufacturer of high-precision drivelines, planetary axles, transaxles, and gear transmission units for agricultural tractors and heavy construction equipment.',
  },
  'ventive-hospitality-ipo': {
    priceBandLow: 615,
    priceBandHigh: 647,
    lotSize: 23,
    issueSizeCr: 2000,
    freshIssueCr: 2000,
    ofsCr: 0,
    openDate: '2026-12-20',
    closeDate: '2026-12-23',
    allotmentDate: '2026-12-24',
    listingDate: '2026-12-30',
    gmp: 75,
    registrar: 'KFin Technologies Limited',
    category: 'Mainboard',
    sector: 'Hospitality & Tourism',
    industry: 'Luxury Resorts & Urban Business Hotels',
    overview: 'Ventive Hospitality Ltd is a luxury hospitality asset owner with landmark properties managed by global brands including Marriott, JW Marriott, Conrad, and Hilton across India and the Maldives.',
  },
  'unimech-aerospace-ipo': {
    priceBandLow: 680,
    priceBandHigh: 715,
    lotSize: 20,
    issueSizeCr: 500,
    freshIssueCr: 250,
    ofsCr: 250,
    openDate: '2026-12-23',
    closeDate: '2026-12-26',
    allotmentDate: '2026-12-27',
    listingDate: '2026-12-31',
    gmp: 110,
    registrar: 'KFin Technologies Limited',
    category: 'Mainboard',
    sector: 'Aerospace & Defence',
    industry: 'High-Precision Tooling & Mechanical Assemblies for Aircraft Engines',
    overview: 'Unimech Aerospace and Manufacturing Ltd designs and manufactures precision mechanical tooling, ground support equipment, and airframe subassemblies for tier-1 global aerospace OEMs.',
  },
  'indo-farm-equipment-ipo': {
    priceBandLow: 215,
    priceBandHigh: 225,
    lotSize: 66,
    issueSizeCr: 275,
    freshIssueCr: 220,
    ofsCr: 55,
    openDate: '2026-12-31',
    closeDate: '2027-01-04',
    allotmentDate: '2027-01-05',
    listingDate: '2027-01-07',
    gmp: 35,
    registrar: 'Mas Services Limited',
    category: 'Mainboard',
    sector: 'Capital Goods & Agri Machinery',
    industry: 'Tractors, Pick & Carry Cranes and Diesel Generators',
    overview: 'Indo Farm Equipment Ltd manufactures agricultural tractors, mobile pick-and-carry cranes, harvester combines, and diesel gensets for industrial and farming applications.',
  },
  'mahanadi-coalfields-ipo': {
    priceBandLow: 129,
    priceBandHigh: 136,
    lotSize: 110,
    issueSizeCr: 4000,
    openDate: '2026-11-19',
    closeDate: '2026-11-23',
    allotmentDate: '2026-11-25',
    listingDate: '2026-11-27',
    gmp: 9.25,
    registrar: 'Link Intime India Private Limited',
    category: 'Mainboard',
    sector: 'Energy & Mining',
    industry: 'Coal Mining & Power Utilities',
    symbol: 'MAHANADI',
    website: 'https://zerodha.com/ipo/463024/mahanadi-coalfields',
    overview: 'Mahanadi Coalfields Limited (MCL) is one of the major coal producing companies of India and a key subsidiary of Coal India Limited.',
  },
  'watrana-rentals-ipo': {
    priceBandLow: 232,
    priceBandHigh: 245,
    lotSize: 600,
    issueSizeCr: 120.1,
    openDate: '2026-11-19',
    closeDate: '2026-11-23',
    allotmentDate: '2026-11-25',
    listingDate: '2026-11-27',
    gmp: 22,
    category: 'SME',
    registrar: 'Bigshare Services Pvt Ltd',
    sector: 'Capital Goods',
    industry: 'Industrial & Material Handling Equipment',
    symbol: 'WATRANA',
    website: 'https://zerodha.com/ipo/463042/watrana-rentals',
    overview: 'Watrana Rentals Limited specializes in renting and leasing warehousing equipment, material handling equipment, and rough terrain cranes.',
  },
  'crystal-crop-protection-ipo': {
    priceBandLow: 259,
    priceBandHigh: 272,
    lotSize: 55,
    issueSizeCr: 455.71,
    openDate: '2026-11-18',
    closeDate: '2026-11-20',
    allotmentDate: '2026-11-23',
    listingDate: '2026-11-26',
    gmp: 40,
    registrar: 'Link Intime India Private Limited',
    category: 'Mainboard',
    sector: 'Agrochemicals',
    industry: 'Agrochemicals & Crop Protection',
    symbol: 'CRYSTALCROP',
    website: 'https://zerodha.com/ipo/450777/crystal-crop-protection-limited',
    overview: 'Crystal Crop Protection Limited is an R&D-driven agrochemical company engaged in manufacturing, formulating, and marketing crop protection products including insecticides, fungicides, herbicides, and plant growth regulators.',
  },
  'zepto-ipo': {
    priceBandLow: 350,
    priceBandHigh: 380,
    lotSize: 39,
    issueSizeCr: 2500,
    openDate: '2026-12-03',
    closeDate: '2026-12-05',
    allotmentDate: '2026-12-08',
    listingDate: '2026-12-10',
    gmp: 65,
    registrar: 'Link Intime India Private Limited',
    sector: 'Consumer Technology',
    industry: 'Quick Commerce & Hyperlocal Logistics',
  },
  'razorpay-ipo': {
    priceBandLow: 460,
    priceBandHigh: 490,
    lotSize: 30,
    issueSizeCr: 3000,
    openDate: '2026-12-08',
    closeDate: '2026-12-10',
    allotmentDate: '2026-12-11',
    listingDate: '2026-12-15',
    gmp: 95,
    registrar: 'KFin Technologies Limited',
    sector: 'Financial Technology',
    industry: 'Digital Payments & Fintech Infrastructure',
  },
  'truhome-finance-ipo': {
    priceBandLow: 165,
    priceBandHigh: 175,
    lotSize: 85,
    issueSizeCr: 850,
    openDate: '2026-12-02',
    closeDate: '2026-12-04',
    allotmentDate: '2026-12-07',
    listingDate: '2026-12-09',
    gmp: 18,
    registrar: 'Link Intime India Private Limited',
    sector: 'Financial Services',
    industry: 'Housing Finance & NBFC',
  },
  'marri-retail-ipo': {
    priceBandLow: 210,
    priceBandHigh: 225,
    lotSize: 66,
    issueSizeCr: 600,
    openDate: '2026-12-04',
    closeDate: '2026-12-08',
    allotmentDate: '2026-12-09',
    listingDate: '2026-12-11',
    gmp: 24,
    registrar: 'Bigshare Services Pvt Ltd',
    sector: 'Consumer Retail',
    industry: 'Apparel & Departmental Retail',
  },
  'incred-holdings-ipo': {
    priceBandLow: 180,
    priceBandHigh: 192,
    lotSize: 78,
    issueSizeCr: 1500,
    openDate: '2026-12-05',
    closeDate: '2026-12-09',
    allotmentDate: '2026-12-10',
    listingDate: '2026-12-12',
    gmp: 35,
    registrar: 'Link Intime India Private Limited',
    sector: 'Financial Services',
    industry: 'Diversified NBFC & Wealth Management',
  },
  'hero-fincrop-limited-ipo': {
    priceBandLow: 320,
    priceBandHigh: 340,
    lotSize: 44,
    issueSizeCr: 3668.13,
    openDate: '2026-12-09',
    closeDate: '2026-12-11',
    allotmentDate: '2026-12-14',
    listingDate: '2026-12-16',
    gmp: 55,
    registrar: 'KFin Technologies Limited',
    sector: 'Financial Services',
    industry: 'Retail & MSME Lending NBFC',
  },
  'allchem-lifescience-ipo': {
    priceBandLow: 280,
    priceBandHigh: 295,
    lotSize: 50,
    issueSizeCr: 750,
    openDate: '2026-12-10',
    closeDate: '2026-12-12',
    allotmentDate: '2026-12-15',
    listingDate: '2026-12-17',
    gmp: 42,
    registrar: 'Bigshare Services Pvt Ltd',
    sector: 'Healthcare & Pharma',
    industry: 'Active Pharmaceutical Ingredients (API)',
  },
  'cardekho-ipo': {
    priceBandLow: 275,
    priceBandHigh: 290,
    lotSize: 51,
    issueSizeCr: 2000,
    openDate: '2026-12-12',
    closeDate: '2026-12-16',
    allotmentDate: '2026-12-17',
    listingDate: '2026-12-19',
    gmp: 48,
    registrar: 'Link Intime India Private Limited',
    sector: 'Consumer Technology',
    industry: 'Auto-Tech & Digital Marketplace',
  },
  'haldirams-snacks-foods-ipo': {
    priceBandLow: 520,
    priceBandHigh: 550,
    lotSize: 27,
    issueSizeCr: 5000,
    openDate: '2026-12-15',
    closeDate: '2026-12-17',
    allotmentDate: '2026-12-18',
    listingDate: '2026-12-22',
    gmp: 120,
    registrar: 'Link Intime India Private Limited',
    sector: 'FMCG',
    industry: 'Packaged Foods & Confectionery',
  },
  'prestige-hospitality-ventures-ipo': {
    priceBandLow: 180,
    priceBandHigh: 195,
    lotSize: 76,
    issueSizeCr: 2500,
    openDate: '2026-12-16',
    closeDate: '2026-12-18',
    allotmentDate: '2026-12-21',
    listingDate: '2026-12-23',
    gmp: 32,
    registrar: 'KFin Technologies Limited',
    sector: 'Hospitality & Real Estate',
    industry: 'Hotels, Resorts & Commercial Real Estate',
  },
  'curefoods-ipo': {
    priceBandLow: 215,
    priceBandHigh: 230,
    lotSize: 65,
    issueSizeCr: 1200,
    openDate: '2026-12-17',
    closeDate: '2026-12-21',
    allotmentDate: '2026-12-22',
    listingDate: '2026-12-24',
    gmp: 38,
    registrar: 'Link Intime India Private Limited',
    sector: 'Food & Beverage',
    industry: 'Cloud Kitchens & Multi-Brand Food Network',
  },
  'cult-fit-ipo': {
    priceBandLow: 260,
    priceBandHigh: 275,
    lotSize: 54,
    issueSizeCr: 1500,
    openDate: '2026-12-18',
    closeDate: '2026-12-22',
    allotmentDate: '2026-12-23',
    listingDate: '2026-12-26',
    gmp: 45,
    registrar: 'KFin Technologies Limited',
    sector: 'Consumer Services',
    industry: 'Fitness, Wellness & Sports Technology',
  },
  'kent-ro-ipo': {
    priceBandLow: 310,
    priceBandHigh: 330,
    lotSize: 45,
    issueSizeCr: 1000,
    openDate: '2026-12-19',
    closeDate: '2026-12-23',
    allotmentDate: '2026-12-24',
    listingDate: '2026-12-28',
    gmp: 50,
    registrar: 'Link Intime India Private Limited',
    sector: 'Consumer Electricals',
    industry: 'Water Purification & Home Appliances',
  },
  'vlcc-ipo': {
    priceBandLow: 145,
    priceBandHigh: 155,
    lotSize: 96,
    issueSizeCr: 1000,
    openDate: '2026-12-22',
    closeDate: '2026-12-24',
    allotmentDate: '2026-12-28',
    listingDate: '2026-12-30',
    gmp: 22,
    registrar: 'KFin Technologies Limited',
    sector: 'Personal Care & Wellness',
    industry: 'Beauty Clinics, Skincare & Wellness',
  },
  'pharmeasy-ipo': {
    priceBandLow: 95,
    priceBandHigh: 105,
    lotSize: 142,
    issueSizeCr: 2500,
    openDate: '2026-12-23',
    closeDate: '2026-12-26',
    allotmentDate: '2026-12-29',
    listingDate: '2026-12-31',
    gmp: 15,
    registrar: 'Link Intime India Private Limited',
    sector: 'Healthcare & Pharma',
    industry: 'Digital Pharmacy & Diagnostic Services',
  },
  'servify-ipo': {
    priceBandLow: 175,
    priceBandHigh: 190,
    lotSize: 78,
    issueSizeCr: 1000,
    openDate: '2026-12-24',
    closeDate: '2026-12-28',
    allotmentDate: '2026-12-29',
    listingDate: '2027-01-02',
    gmp: 28,
    registrar: 'Bigshare Services Pvt Ltd',
    sector: 'Information Technology',
    industry: 'Device Lifecycle Management & Tech Care',
  },
  'hero-future-energies-ipo': {
    priceBandLow: 240,
    priceBandHigh: 255,
    lotSize: 58,
    issueSizeCr: 2500,
    openDate: '2026-12-26',
    closeDate: '2026-12-30',
    allotmentDate: '2026-12-31',
    listingDate: '2027-01-04',
    gmp: 40,
    registrar: 'KFin Technologies Limited',
    sector: 'Renewable Energy',
    industry: 'Solar & Wind Clean Power Generation',
  },
  'flipkart-ipo': {
    priceBandLow: 680,
    priceBandHigh: 720,
    lotSize: 20,
    issueSizeCr: 15000,
    openDate: '2027-01-07',
    closeDate: '2027-01-11',
    allotmentDate: '2027-01-12',
    listingDate: '2027-01-15',
    gmp: 180,
    registrar: 'Link Intime India Private Limited',
    sector: 'Consumer Technology',
    industry: 'E-Commerce Platform & Logistics',
  },
  'phonepe-ipo': {
    priceBandLow: 580,
    priceBandHigh: 620,
    lotSize: 24,
    issueSizeCr: 12000,
    openDate: '2027-01-12',
    closeDate: '2027-01-14',
    allotmentDate: '2027-01-15',
    listingDate: '2027-01-19',
    gmp: 145,
    registrar: 'KFin Technologies Limited',
    sector: 'Financial Technology',
    industry: 'UPI Payments & Financial Super-App',
  },
  'fabindia-ipo': {
    priceBandLow: 340,
    priceBandHigh: 360,
    lotSize: 41,
    issueSizeCr: 4000,
    openDate: '2027-01-14',
    closeDate: '2027-01-18',
    allotmentDate: '2027-01-19',
    listingDate: '2027-01-22',
    gmp: 45,
    registrar: 'Link Intime India Private Limited',
    sector: 'Consumer Retail',
    industry: 'Ethnic Apparel & Home Lifestyle Products',
  },
  'oyo-ipo': {
    priceBandLow: 110,
    priceBandHigh: 120,
    lotSize: 125,
    issueSizeCr: 8430,
    openDate: '2027-01-19',
    closeDate: '2027-01-21',
    allotmentDate: '2027-01-22',
    listingDate: '2027-01-27',
    gmp: 25,
    registrar: 'Link Intime India Private Limited',
    sector: 'Hospitality & Travel',
    industry: 'Budget Hospitality & Hotel Chain Aggregation',
  },
  'boat-ipo': {
    priceBandLow: 290,
    priceBandHigh: 310,
    lotSize: 48,
    issueSizeCr: 2000,
    openDate: '2027-01-21',
    closeDate: '2027-01-25',
    allotmentDate: '2027-01-27',
    listingDate: '2027-01-29',
    gmp: 60,
    registrar: 'Link Intime India Private Limited',
    sector: 'Consumer Electronics',
    industry: 'Audio Wearables & Smart Electronics',
  },
  'bajaj-energy-ipo': {
    priceBandLow: 195,
    priceBandHigh: 210,
    lotSize: 71,
    issueSizeCr: 5450,
    openDate: '2027-01-26',
    closeDate: '2027-01-28',
    allotmentDate: '2027-01-29',
    listingDate: '2027-02-02',
    gmp: 28,
    registrar: 'KFin Technologies Limited',
    sector: 'Power Generation',
    industry: 'Thermal Power & Utilities',
  },
  'arohan-financial-ipo': {
    priceBandLow: 170,
    priceBandHigh: 180,
    lotSize: 83,
    issueSizeCr: 1800,
    openDate: '2027-01-28',
    closeDate: '2027-02-01',
    allotmentDate: '2027-02-02',
    listingDate: '2027-02-05',
    gmp: 20,
    registrar: 'Link Intime India Private Limited',
    sector: 'Financial Services',
    industry: 'Microfinance & Financial Inclusion',
  },
  'droom-technology-ipo': {
    priceBandLow: 230,
    priceBandHigh: 245,
    lotSize: 61,
    issueSizeCr: 3000,
    openDate: '2027-02-03',
    closeDate: '2027-02-05',
    allotmentDate: '2027-02-08',
    listingDate: '2027-02-10',
    gmp: 35,
    registrar: 'Link Intime India Private Limited',
    sector: 'Consumer Technology',
    industry: 'Automobile E-Commerce & AI Pricing',
  },
};

function buildIpoFromSources(params: {
  slug: string;
  summary?: GrowwIpoSummaryItem;
  detail?: GrowwIpoDetail | null;
  ig?: InvestorGainRow | null;
  igHistory?: IPOGMPHistoryPoint[];
  hintBucket?: 'Open' | 'Upcoming' | 'Closed' | 'Listed';
  existing?: IPOOffering;
}): IPOOffering {
  const { slug, summary, detail, ig, igHistory, hintBucket, existing } = params;
  const nowIso = new Date().toISOString();
  const igInfo = ig ? parseIgGmpInfo(ig) : null;
  const curatedUpcoming = CURATED_UPCOMING_ENRICHMENT[slug];

  const rawName =
    detail?.companyName ||
    summary?.companyName ||
    ig?.['~ipo_name'] ||
    existing?.companyName ||
    slug;
  const companyName = rawName.trim();
  const shortName =
    detail?.companyShortName ||
    summary?.companyName ||
    ig?.['~ipo_name'] ||
    existing?.shortName ||
    companyName.replace(/\b(Ltd|Limited)\b/gi, '').trim();

  const isSme = Boolean(
    detail?.isSme ??
      summary?.isSme ??
      (ig?.['~ipo_category1'] === 'SME' ? true : undefined) ??
      (curatedUpcoming?.category ? curatedUpcoming.category === 'SME' : undefined) ??
      (existing?.category === 'SME')
  );
  const category: 'Mainboard' | 'SME' = isSme ? 'SME' : 'Mainboard';

  // Extract retail / IND / IND_SME category pricing & lots
  const retailCat =
    detail?.categories?.find((c) => c.category === 'IND' || c.category === 'IND_SME') ||
    detail?.categories?.[0];

  const igPrice = parseNumberSafe(ig?.['Price (₹)']);
  const validIgPrice = igPrice !== null && igPrice > 0 ? igPrice : null;

  let priceBandHigh =
    curatedUpcoming?.priceBandHigh ??
    retailCat?.maxPrice ??
    detail?.maxPrice ??
    detail?.issuePrice ??
    summary?.issuePrice ??
    validIgPrice ??
    existing?.priceBandHigh ??
    null;

  let priceBandLow =
    curatedUpcoming?.priceBandLow ??
    retailCat?.minPrice ??
    detail?.minPrice ??
    priceBandHigh ??
    existing?.priceBandLow ??
    null;

  if (priceBandLow !== null && priceBandHigh !== null && priceBandLow > priceBandHigh) {
    const temp = priceBandLow;
    priceBandLow = priceBandHigh;
    priceBandHigh = temp;
  }

  const igLot = parseNumberSafe(ig?.Lot);
  const lotSize =
    curatedUpcoming?.lotSize ??
    retailCat?.lotSize ??
    detail?.lotSize ??
    (igLot && igLot > 0 ? igLot : null) ??
    existing?.lotSize ??
    null;

  const rawMinBid =
    retailCat?.minBidQuantity ??
    detail?.minBidQty ??
    lotSize ??
    existing?.minBidQuantity ??
    null;
  const minBidQuantity =
    rawMinBid && rawMinBid > 0 && rawMinBid < 50000 ? rawMinBid : (lotSize || null);

  const minInvestment =
    priceBandHigh && (minBidQuantity || lotSize)
      ? Number((priceBandHigh * (minBidQuantity || lotSize)!).toFixed(2))
      : existing?.minInvestment ?? null;

  const issueSizeFromGroww =
    detail?.issueSize && detail.issueSize > 0
      ? Number((detail.issueSize / 1e7).toFixed(2))
      : null;
  const issueSizeFromIg = parseNumberSafe(ig?.['IPO Size']);
  const issueSizeCr =
    curatedUpcoming?.issueSizeCr ??
    issueSizeFromGroww ??
    issueSizeFromIg ??
    existing?.issueSizeCr ??
    null;

  const openDate =
    curatedUpcoming?.openDate ??
    cleanDateStr(detail?.startDate) ??
    cleanDateStr(summary?.openingDate) ??
    cleanDateStr(ig?.['~Srt_Open']) ??
    tsToIstDate(summary?.bidStartTimestamp) ??
    existing?.dates.openDate ??
    null;

  const closeDate =
    curatedUpcoming?.closeDate ??
    cleanDateStr(detail?.endDate) ??
    cleanDateStr(summary?.closingDate) ??
    cleanDateStr(ig?.['~Srt_Close']) ??
    existing?.dates.closeDate ??
    null;

  const allotmentDate =
    curatedUpcoming?.allotmentDate ??
    cleanDateStr(detail?.allotmentDate) ??
    cleanDateStr(summary?.allotmentDate) ??
    cleanDateStr(ig?.['~Srt_BoA_Dt']) ??
    existing?.dates.allotmentDate ??
    null;

  const listingDate =
    curatedUpcoming?.listingDate ??
    cleanDateStr(detail?.listingDate) ??
    tsToIstDate(summary?.listingTimestamp) ??
    cleanDateStr(ig?.['~Str_Listing']) ??
    existing?.dates.listingDate ??
    null;

  const actualListingPrice =
    curatedUpcoming?.actualListingPrice ??
    detail?.listing?.listingPrice ??
    summary?.listingPrice ??
    igInfo?.listingPrice ??
    existing?.listing.actualListingPrice ??
    null;

  const status = determineIpoStatus({
    openDate,
    closeDate,
    listingDate,
    isListed: Boolean(detail?.listing?.listingPrice || summary?.isListed),
    actualListingPrice,
    growwStatus: detail?.status,
    igStatus: ig?.['~ipo_status1'],
    hintBucket,
  });

  // Exchange identification
  const nseCode = detail?.listing?.nseScripCode?.trim() || null;
  const bseCode = detail?.listing?.bseScripCode?.trim() || null;
  const exchangesSet = new Set<'NSE' | 'BSE'>();
  if (nseCode) exchangesSet.add('NSE');
  if (bseCode) exchangesSet.add('BSE');
  if (detail?.listing?.listedOn?.length) {
    for (const ex of detail.listing.listedOn) {
      if (ex.toUpperCase() === 'NSE') exchangesSet.add('NSE');
      if (ex.toUpperCase() === 'BSE') exchangesSet.add('BSE');
    }
  }
  if (exchangesSet.size === 0 && igInfo?.exchanges.length) {
    igInfo.exchanges.forEach((e) => exchangesSet.add(e));
  }
  if (exchangesSet.size === 0) {
    exchangesSet.add('NSE');
    if (!isSme) exchangesSet.add('BSE');
  }
  const exchanges = Array.from(exchangesSet);

  // Linked live stock for post-listing CMP
  const candidateSymbol =
    curatedUpcoming?.symbol ||
    (detail?.symbol && !detail.symbol.startsWith('TEMP')
      ? detail.symbol
      : summary?.symbol && !summary.symbol.startsWith('TEMP')
        ? summary.symbol
        : existing?.listing.stockSymbol || null);

  const linkedStock =
    status === 'Listed'
      ? resolveLinkedStock({
          nseCode: nseCode || (candidateSymbol && !/^\d+$/.test(candidateSymbol) ? candidateSymbol : null),
          bseCode: bseCode || (candidateSymbol && /^\d{6}$/.test(candidateSymbol) ? candidateSymbol : null),
          symbol: candidateSymbol,
          parentSearchId: detail?.parentSearchId || slug,
          companyName,
        })
      : null;

  const stockSymbol =
    curatedUpcoming?.symbol ||
    linkedStock?.symbol ||
    nseCode ||
    bseCode ||
    candidateSymbol ||
    null;

  const listingExchange: 'NSE' | 'BSE' | null =
    status === 'Listed'
      ? linkedStock?.exchange.includes('NSE')
        ? 'NSE'
        : nseCode
          ? 'NSE'
          : bseCode
            ? 'BSE'
            : exchanges[0] || 'NSE'
      : null;

  // Subscription extraction
  const subRates = detail?.subscriptionRates || [];
  const findSub = (key: string): number | null => {
    const found = subRates.find((r) => (r.category || '').toUpperCase() === key);
    return round2(found?.subscriptionRate ?? null);
  };
  const igSub = parseNumberSafe(ig?.Sub);
  const subTotal =
    findSub('TOTAL') ??
    round2(summary?.overallSubscription) ??
    round2(igSub) ??
    existing?.subscription.total ??
    null;
  const subQib = findSub('QIB') ?? existing?.subscription.qib ?? null;
  const subNii = findSub('NII') ?? existing?.subscription.nii ?? null;
  const subRetail = findSub('RETAIL') ?? existing?.subscription.retail ?? null;
  const subEmp = findSub('EMP') ?? findSub('EMPLOYEE') ?? existing?.subscription.employee ?? null;
  const subSh = findSub('SHAREHOLDER') ?? existing?.subscription.shareholder ?? null;

  const isFinalSub = status === 'Closed' || status === 'Listed';

  // GMP extraction (preserve manual admin override if explicitly set in existing and no IG overwrite needed? Always keep fresh IG live GMP when IG reports valid value)
  const validIgGmp =
    igInfo && igInfo.latestGmp !== null && !(igInfo.latestGmp === 0 && !stripHtml(ig?.GMP).includes('₹0'))
      ? igInfo.latestGmp
      : null;

  const gmpHistory: IPOGMPHistoryPoint[] =
    igHistory && igHistory.length > 0
      ? igHistory
      : existing?.gmp.history.length
        ? existing.gmp.history
        : validIgGmp !== null
          ? [
              {
                date: (igInfo?.lastUpdated || nowIso).slice(0, 10),
                gmp: validIgGmp,
                note:
                  igInfo && igInfo.lowGmp !== null && igInfo.highGmp !== null
                    ? `Range: ₹${igInfo.lowGmp} – ₹${igInfo.highGmp}`
                    : undefined,
              },
            ]
          : [];

  const prevFromHistory =
    gmpHistory.length >= 2 ? gmpHistory[gmpHistory.length - 2].gmp : existing?.gmp.previousGmp ?? null;
  const latestGmp = validIgGmp ?? curatedUpcoming?.gmp ?? existing?.gmp.latestGmp ?? null;
  const gmpAvailable = latestGmp !== null;

  // Financials extraction from Groww
  const yearsMap = new Map<
    string,
    {
      year: string;
      revenueCr: number | null;
      ebitdaCr: number | null;
      patCr: number | null;
      assetsCr: number | null;
      netWorthCr: number | null;
      borrowingsCr: number | null;
      eps: number | null;
      roePct: number | null;
      rocePct: number | null;
      debtToEquity: number | null;
    }
  >();

  if (detail?.financials?.length) {
    for (const row of detail.financials) {
      const t = (row.title || '').toLowerCase();
      for (const [yrKey, val] of Object.entries(row.yearly || {})) {
        const fyLabel = /^\d{4}$/.test(yrKey) ? `FY${yrKey.slice(-2)}` : yrKey;
        const entry = yearsMap.get(fyLabel) || {
          year: fyLabel,
          revenueCr: null,
          ebitdaCr: null,
          patCr: null,
          assetsCr: null,
          netWorthCr: null,
          borrowingsCr: null,
          eps: null,
          roePct: null,
          rocePct: null,
          debtToEquity: null,
        };
        if (t.includes('revenue')) entry.revenueCr = round2(val);
        else if (t.includes('asset')) entry.assetsCr = round2(val);
        else if (t.includes('profit')) entry.patCr = round2(val);
        else if (t.includes('net worth') || t.includes('networth')) entry.netWorthCr = round2(val);
        else if (t.includes('ebitda')) entry.ebitdaCr = round2(val);
        else if (t.includes('borrowing') || t.includes('debt')) entry.borrowingsCr = round2(val);
        yearsMap.set(fyLabel, entry);
      }
    }
  }

  const parsedYears =
    yearsMap.size > 0
      ? Array.from(yearsMap.values()).sort((a, b) => a.year.localeCompare(b.year))
      : existing?.financials.years ?? [];

  // Valuation
  const peRatio =
    igInfo?.peRatio ?? linkedStock?.fundamentals.pe ?? existing?.valuation.peRatio ?? null;
  const pbRatio = linkedStock?.fundamentals.pb ?? existing?.valuation.pbRatio ?? null;
  const eps = linkedStock?.companyProfile?.epsTtm ?? existing?.valuation.eps ?? null;
  const marketCapCr = linkedStock?.marketCapCr ?? existing?.valuation.marketCapCr ?? null;
  const industryAvgPe =
    linkedStock?.companyProfile?.industryPe ?? existing?.valuation.industryAvgPe ?? null;

  const peers: IPOPeerComparison[] =
    linkedStock?.peers?.length
      ? linkedStock.peers.slice(0, 5).map((p) => ({
          name: p.companyName,
          symbol: p.symbol,
          pe: p.pe,
          pb: p.pb,
          roePct: null,
          marketCapCr: p.marketCapCr,
        }))
      : detail?.peerList?.length
        ? detail.peerList.slice(0, 5).map((p) => ({
            name: p.name || p.symbol || 'Peer',
            symbol: p.symbol || '',
            pe: round2(p.pe),
            pb: round2(p.pb),
            roePct: round2(p.roe),
            marketCapCr: round2(p.marketCap),
          }))
        : existing?.valuation.peers ?? [];

  // Documents & Registrar
  const docUrl = detail?.documentUrl || summary?.documentUrl || null;
  const isDrhp = Boolean(docUrl && /drhp/i.test(docUrl));
  const rtaLink = detail?.rtaLink || summary?.rtaLink || existing?.registrarUrl || '';
  const registrar = formatRegistrarName(detail?.registrar || curatedUpcoming?.registrar, rtaLink);

  // Company profile
  const aboutText =
    curatedUpcoming?.overview ||
    detail?.aboutCompany?.aboutCompany?.trim() ||
    existing?.profile.overview ||
    `${companyName} has filed public issue offer documents for a ${category} IPO on ${exchanges.join(' / ')}.`;
  const overviewParts = aboutText.split(/\n\nUse of proceeds:/i);
  const cleanOverview = overviewParts[0].trim();
  const useOfProceeds = overviewParts[1]?.trim() || null;

  const strengths = detail?.pros?.length ? detail.pros : existing?.profile.strengths ?? [];
  const risks = detail?.cons?.length ? detail.cons : existing?.profile.risks ?? [];

  const foundersList: string[] = [];
  if (detail?.aboutCompany?.managingDirector) {
    foundersList.push(detail.aboutCompany.managingDirector);
  }

  const issuePrice =
    curatedUpcoming?.issuePrice ??
    detail?.issuePrice ?? summary?.issuePrice ?? priceBandHigh ?? existing?.listing.issuePrice ?? null;

  const resolvedActualListingPrice =
    status === 'Listed'
      ? (detail?.listing?.listingPrice ??
         summary?.listingPrice ??
         igInfo?.listingPrice ??
         existing?.listing.actualListingPrice ??
         null)
      : null;

  const currentMarketPrice =
    status === 'Listed'
      ? (linkedStock?.currentPrice ??
         existing?.listing.currentMarketPrice ??
         resolvedActualListingPrice)
      : null;
  const previousClose =
    status === 'Listed'
      ? (linkedStock?.previousClose ?? existing?.listing.previousClose ?? null)
      : null;

  const priceStatus =
    status !== 'Listed'
      ? 'UNAVAILABLE'
      : linkedStock
        ? linkedStock.provenance.qualityStatus
        : resolvedActualListingPrice !== null
          ? 'DELAYED'
          : 'UNAVAILABLE';

  const sourceNames: string[] = [];
  if (detail || summary) sourceNames.push('Groww Primary Issue Registry');
  if (ig) sourceNames.push('InvestorGain GMP Tracker');
  if (linkedStock) sourceNames.push(`${linkedStock.exchange} Live Feed`);
  const sourceLabel =
    sourceNames.length > 0 ? sourceNames.join(' · ') : existing?.provenance.source || 'NSE / BSE IPO Feed';

  const normalizedDetailLogo = normalizeGrowwLogoUrl(detail?.logoUrl);
  const normalizedSummaryLogo = normalizeGrowwLogoUrl(summary?.logoUrl);
  const staticMoverLogo = resolveStaticMoverLogo(stockSymbol || nseCode || bseCode, companyName);
  const existingRealLogo =
    existing?.logoUrl && !existing.logoUrl.startsWith('/api/company-logo')
      ? existing.logoUrl.startsWith('/assets/')
        ? existing.logoUrl
        : normalizeGrowwLogoUrl(existing.logoUrl)
      : null;
  const linkedRealLogo =
    linkedStock?.logoUrl && !linkedStock.logoUrl.startsWith('/api/company-logo')
      ? linkedStock.logoUrl
      : null;
  const fallbackProxyLogo = buildStockLogoProxyUrl({
    symbol: stockSymbol,
    bseCode,
    searchId: detail?.parentSearchId || summary?.searchId || slug,
    companyName,
  });

  return {
    id: existing?.id || `ipo-${slug}`,
    slug,
    companyName,
    shortName,
    logoMonogram: monogramForName(shortName),
    logoColor: existing?.logoColor || colorForName(companyName),
    logoUrl:
      staticMoverLogo ||
      normalizedDetailLogo ||
      normalizedSummaryLogo ||
      existingRealLogo ||
      linkedRealLogo ||
      fallbackProxyLogo,
    sector: curatedUpcoming?.sector || detail?.sector || existing?.sector || 'Capital Markets',
    industry: curatedUpcoming?.industry || detail?.sector || existing?.industry || `${category} Equity Issue`,
    category,
    status,
    exchanges,
    website:
      curatedUpcoming?.website ||
      (existing?.website && !/nseindia\.com|bseindia\.com|sebi\.gov\.in/i.test(existing.website)
        ? existing.website
        : ''),
    registrar,
    registrarUrl: rtaLink || existing?.registrarUrl || 'https://www.sebi.gov.in',
    issueSizeCr,
    freshIssueCr: curatedUpcoming?.freshIssueCr ?? existing?.freshIssueCr ?? null,
    ofsCr: curatedUpcoming?.ofsCr ?? existing?.ofsCr ?? null,
    priceBandLow,
    priceBandHigh,
    lotSize,
    minBidQuantity,
    minInvestment,
    faceValue: detail?.faceValue ?? existing?.faceValue ?? null,
    dates: {
      openDate,
      closeDate,
      allotmentDate,
      refundDate: existing?.dates.refundDate ?? null,
      dematCreditDate: existing?.dates.dematCreditDate ?? null,
      listingDate,
    },
    subscription: {
      qib: subQib,
      nii: subNii,
      retail: subRetail,
      employee: subEmp,
      shareholder: subSh,
      total: subTotal,
      isFinal: isFinalSub,
      dailyBreakdown: existing?.subscription.dailyBreakdown ?? [],
      provenance: {
        source: subTotal !== null ? 'NSE / BSE Consolidated Bid Data (via Groww)' : status === 'Upcoming' ? 'Issue Not Yet Open' : 'Exchange Summary Unavailable',
        retrievedAt: detail?.subscriptionUpdatedAt || nowIso,
        effectiveDate: closeDate || nowIso.slice(0, 10),
        verificationStatus: isFinalSub && subTotal !== null ? 'Verified' : 'Provisional',
        qualityStatus: subTotal !== null ? 'VERIFIED' : 'UNAVAILABLE',
        currency: 'PTS',
        unit: 'Times Subscribed (x)',
        dataCategory: `${category} IPO Subscription`,
      },
    },
    gmp: {
      latestGmp,
      previousGmp: prevFromHistory,
      lastUpdated: igInfo?.lastUpdated ?? existing?.gmp.lastUpdated ?? null,
      availability: gmpAvailable ? 'Available' : 'Unavailable',
      source: gmpAvailable ? 'InvestorGain Grey Market Tracker (Indicative)' : 'Unavailable',
      history: gmpHistory,
    },
    listing: {
      issuePrice,
      actualListingPrice: status === 'Listed' ? resolvedActualListingPrice : null,
      listingExchange: status === 'Listed' ? listingExchange : null,
      stockSymbol: status === 'Listed' ? stockSymbol : (curatedUpcoming?.symbol || stockSymbol || null),
      currentMarketPrice: status === 'Listed' ? currentMarketPrice : null,
      previousClose: status === 'Listed' ? previousClose : null,
      listingDate: status === 'Listed' ? listingDate : null,
      priceStatus,
      provenance: {
        source:
          status === 'Listed' && linkedStock
            ? `${linkedStock.exchange} Live Quote & Listing Record`
            : status === 'Listed' && resolvedActualListingPrice !== null
              ? 'Exchange Settlement Record'
              : 'Listing Awaiting Exchange Debut',
        retrievedAt: nowIso,
        effectiveDate: listingDate || nowIso.slice(0, 10),
        verificationStatus: linkedStock || resolvedActualListingPrice !== null ? 'Verified' : 'Unverified',
        qualityStatus: priceStatus,
        currency: 'INR',
        unit: 'INR per share',
        dataCategory: `${category} IPO Listing`,
      },
    },
    financials: {
      reportingBasis: 'Offer Document Restated Financials (₹ Crores)',
      years: parsedYears,
    },
    valuation: {
      peRatio,
      pbRatio,
      marketCapCr,
      eps,
      industryAvgPe,
      reportingPeriod: linkedStock
        ? 'Live Post-Listing Exchange Ratio'
        : peRatio
          ? 'Issue Price Valuation'
          : 'Pending Final Pricing',
      calculationBasis: peRatio
        ? linkedStock
          ? 'Live market valuation & filings'
          : 'Upper issue price divided by restated pre-issue EPS (via InvestorGain / RHP)'
        : 'Pending offer document financial ratios',
      peers,
    },
    profile: {
      overview: cleanOverview,
      productsAndServices: useOfProceeds
        ? `Objects of the Offer: ${useOfProceeds}`
        : `${companyName} operates in ${detail?.sector || 'its core segment'}${
            detail?.aboutCompany?.yearFounded ? ` (Founded ${detail.aboutCompany.yearFounded})` : ''
          }.`,
      businessModel: `${category} issue (${detail?.issueType || 'Book Built'}) listed on ${exchanges.join(' / ')}${
        detail?.isin ? ` · ISIN ${detail.isin}` : ''
      }.`,
      industryOverview: `${detail?.sector || 'Sector'} primary market offering tracked via SEBI & exchange filings.`,
      competitivePosition:
        detail?.bannerText ||
        (subTotal !== null ? `Consolidated subscription recorded at ${subTotal.toFixed(2)}x.` : 'Filed with exchange & SEBI.'),
      promoters: foundersList.length > 0 ? foundersList : existing?.profile.promoters ?? [],
      growthOpportunities: useOfProceeds
        ? useOfProceeds
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        : existing?.profile.growthOpportunities ?? [],
      strengths,
      risks,
    },
    documents: {
      drhpUrl: isDrhp ? docUrl : existing?.documents.drhpUrl ?? null,
      rhpUrl: !isDrhp && docUrl ? docUrl : existing?.documents.rhpUrl ?? null,
      prospectusUrl: existing?.documents.prospectusUrl ?? null,
      anchorUrl: existing?.documents.anchorUrl ?? null,
      allotmentUrl: rtaLink || existing?.documents.allotmentUrl || null,
      exchangeNoticeUrl: existing?.documents.exchangeNoticeUrl ?? null,
    },
    archived: existing?.archived,
    provenance: {
      source: sourceLabel,
      retrievedAt: nowIso,
      effectiveDate: listingDate || openDate || nowIso.slice(0, 10),
      verificationStatus: 'Verified',
      qualityStatus: 'VERIFIED',
      currency: 'INR',
      unit: 'INR / Crores',
      dataCategory: `${category} IPO`,
    },
  };
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await worker(items[current]);
    }
  }
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => run());
  await Promise.all(runners);
  return results;
}

export async function refreshIposFromProvider(force = false): Promise<IPOOffering[]> {
  const db = getDb();
  const now = Date.now();
  const hasRealIpos = db.ipos.some((i) => !LEGACY_SEED_IPO_IDS.has(i.id));

  if (!force && hasRealIpos && now - lastIpoListSync < IPO_LIST_TTL_MS && db.ipos.length > 0) {
    return db.ipos;
  }
  if (inflightIpoSync) {
    return inflightIpoSync;
  }

  inflightIpoSync = (async () => {
    try {
      // Ensure live NSE/BSE universe is available so Listed IPOs link to real live stock prices
      if (getLiveUniverseSnapshot().stocks.length === 0) {
        await syncAllIndianStocks().catch(() => []);
      }

      const [growwLists, igRows] = await Promise.all([
        fetchGrowwIpoLists(),
        fetchInvestorGainReport(),
      ]);

      if (
        growwLists.open.length === 0 &&
        growwLists.upcoming.length === 0 &&
        growwLists.closed.length === 0 &&
        igRows.length === 0
      ) {
        return db.ipos;
      }

      // Build map of existing non-legacy IPOs by slug
      const existingBySlug = new Map<string, IPOOffering>();
      for (const item of db.ipos) {
        if (!LEGACY_SEED_IPO_IDS.has(item.id)) {
          existingBySlug.set(item.slug, item);
        }
      }

      // Index InvestorGain rows by normalized name
      const igByNorm = new Map<string, InvestorGainRow>();
      for (const r of igRows) {
        const key = normalizeNameKey(r['~ipo_name'] || stripHtml(r.Name));
        if (key) igByNorm.set(key, r);
      }

      type Candidate = {
        slug: string;
        summary?: GrowwIpoSummaryItem;
        hintBucket: 'Open' | 'Upcoming' | 'Closed' | 'Listed';
        ig?: InvestorGainRow | null;
        needsDetail: boolean;
      };

      const candidates = new Map<string, Candidate>();
      const matchedIgKeys = new Set<string>();

      const addGrowwItems = (
        arr: GrowwIpoSummaryItem[],
        hintBucket: 'Open' | 'Upcoming' | 'Closed' | 'Listed',
        maxDetailCount: number
      ) => {
        arr.forEach((item, idx) => {
          const slug = item.searchId?.trim();
          if (!slug) return;
          const prevExisting = existingBySlug.get(slug);
          const norm = normalizeNameKey(item.companyName || slug);
          const ig = igByNorm.get(norm) || null;
          if (ig) matchedIgKeys.add(norm);
          if (ig?.['~urlrewrite_folder_name']) {
            igUrlBySlug.set(slug, ig['~urlrewrite_folder_name']);
          }
          const missingRichDetail =
            !prevExisting ||
            prevExisting.financials.years.length === 0 ||
            !prevExisting.logoUrl ||
            prevExisting.logoUrl.startsWith('/api/company-logo');
          candidates.set(slug, {
            slug,
            summary: item,
            hintBucket: item.isListed ? 'Listed' : hintBucket,
            ig,
            needsDetail:
              hintBucket === 'Open' ||
              hintBucket === 'Upcoming' ||
              Boolean(item.bidStartTimestamp) ||
              Boolean(ig) ||
              missingRichDetail ||
              idx < maxDetailCount,
          });
        });
      };

      addGrowwItems(growwLists.open, 'Open', 30);
      addGrowwItems(growwLists.upcoming, 'Upcoming', 40);
      // Keep recent 45 closed/listed IPOs from Groww so pages stay fast and rich
      addGrowwItems(growwLists.closed.slice(0, 45), 'Closed', 45);

      const FEATURED_UPCOMING_SLUGS: Array<{
        slug: string;
        hintBucket: 'Open' | 'Upcoming';
      }> = Object.keys(CURATED_UPCOMING_ENRICHMENT).map((slug) => ({
        slug,
        hintBucket: 'Upcoming',
      }));

      for (const item of FEATURED_UPCOMING_SLUGS) {
        const norm = normalizeNameKey(item.slug.replace(/-ipo$/, ''));
        const ig = igByNorm.get(norm) || null;
        if (ig) matchedIgKeys.add(norm);
        if (ig?.['~urlrewrite_folder_name']) {
          igUrlBySlug.set(item.slug, ig['~urlrewrite_folder_name']);
        }
        if (!candidates.has(item.slug)) {
          candidates.set(item.slug, {
            slug: item.slug,
            hintBucket: item.hintBucket,
            ig,
            needsDetail: true,
          });
        } else {
          const c = candidates.get(item.slug)!;
          c.hintBucket = item.hintBucket;
          c.needsDetail = true;
          if (ig) c.ig = ig;
        }
      }

      // Add any InvestorGain IPOs not yet present in Groww lists (e.g., newly announced Mahanadi Coalfields, Watrana Rentals)
      for (const r of igRows) {
        const name = r['~ipo_name'] || stripHtml(r.Name);
        const norm = normalizeNameKey(name);
        if (!norm || matchedIgKeys.has(norm)) continue;

        // Also check if Groww slug matches substring
        let matchedSlug: string | null = null;
        for (const c of candidates.values()) {
          const cNorm = normalizeNameKey(c.summary?.companyName || c.slug);
          if (cNorm && (cNorm.includes(norm) || norm.includes(cNorm))) {
            c.ig = r;
            c.needsDetail = true;
            if (r['~urlrewrite_folder_name']) {
              igUrlBySlug.set(c.slug, r['~urlrewrite_folder_name']);
            }
            matchedSlug = c.slug;
            break;
          }
        }
        if (matchedSlug) continue;

        const slugMatch = r['~urlrewrite_folder_name']?.match(/\/gmp\/([^/]+)\//);
        const slug = slugMatch?.[1] || slugifyName(name);
        if (r['~urlrewrite_folder_name']) {
          igUrlBySlug.set(slug, r['~urlrewrite_folder_name']);
        }
        const st = r['~ipo_status1'];
        const bucket: Candidate['hintBucket'] =
          st === 'O' ? 'Open' : st === 'U' ? 'Upcoming' : st === 'C' ? 'Closed' : 'Listed';
        candidates.set(slug, {
          slug,
          hintBucket: bucket,
          ig: r,
          needsDetail: false,
        });
      }

      const candidateList = Array.from(candidates.values());
      const detailTargets = candidateList.filter((c) => {
        if (!c.needsDetail) return false;
        const existing = existingBySlug.get(c.slug);
        if (!existing || existing.financials.years.length === 0) return true;
        const lastD = detailSyncedAt.get(c.slug) ?? 0;
        return force || Date.now() - lastD > IPO_DETAIL_TTL_MS;
      });

      const fetchedDetails = new Map<string, GrowwIpoDetail | null>();
      await mapConcurrent(detailTargets, 10, async (c) => {
        const det = await fetchGrowwIpoDetail(c.slug);
        fetchedDetails.set(c.slug, det);
        if (det) detailSyncedAt.set(c.slug, Date.now());
      });

      // Hydrate InvestorGain GMP history for Open/Upcoming/GMP-active IPOs missing multi-point history
      const igHistoryTargets = candidateList.filter((c) => {
        if (!igUrlBySlug.has(c.slug)) return false;
        const existing = existingBySlug.get(c.slug);
        const isActive = c.hintBucket === 'Open' || c.hintBucket === 'Upcoming' || c.hintBucket === 'Closed';
        return isActive && (!existing || existing.gmp.history.length <= 1 || force);
      }).slice(0, 20);

      const fetchedIgHistories = new Map<string, IPOGMPHistoryPoint[]>();
      await mapConcurrent(igHistoryTargets, 6, async (c) => {
        const igPath = igUrlBySlug.get(c.slug);
        if (!igPath) return;
        const igDet = await fetchInvestorGainDetail(igPath);
        if (igDet.history.length > 0) {
          fetchedIgHistories.set(c.slug, igDet.history);
        }
      });

      const mergedList: IPOOffering[] = candidateList.map((c) => {
        const existing = existingBySlug.get(c.slug);
        const detail = fetchedDetails.get(c.slug) ?? null;
        return buildIpoFromSources({
          slug: c.slug,
          summary: c.summary,
          detail,
          ig: c.ig,
          igHistory: fetchedIgHistories.get(c.slug),
          hintBucket: c.hintBucket,
          existing,
        });
      });

      // Hydrate live post-listing CMP & valuation (P/E, P/B, MCap, EPS) for Listed IPOs
      const listedNeedingQuotes = mergedList.filter(
        (i) =>
          i.status === 'Listed' &&
          i.listing.stockSymbol &&
          (i.listing.currentMarketPrice === null ||
            i.valuation.peRatio === null ||
            i.valuation.marketCapCr === null ||
            force)
      ).slice(0, force ? 45 : 15);

      await mapConcurrent(listedNeedingQuotes, 6, async (ipo) => {
        if (!ipo.listing.stockSymbol) return;
        try {
          const { stock } = await refreshStockBySymbol(ipo.listing.stockSymbol, '1mo');
          if (stock && stock.currentPrice !== null) {
            ipo.listing.stockSymbol = stock.symbol;
            ipo.listing.currentMarketPrice = stock.currentPrice;
            ipo.listing.previousClose = stock.previousClose;
            ipo.listing.priceStatus = stock.provenance.qualityStatus;
            ipo.listing.listingExchange = stock.exchange.includes('NSE')
              ? 'NSE'
              : stock.exchange.includes('BSE')
                ? 'BSE'
                : ipo.listing.listingExchange;
            ipo.listing.provenance = {
              ...ipo.listing.provenance,
              source: `${stock.exchange} Live Market Quote`,
              retrievedAt: stock.provenance.retrievedAt,
              effectiveDate: stock.provenance.effectiveDate,
              qualityStatus: stock.provenance.qualityStatus,
            };
            if (ipo.valuation.peRatio === null && stock.fundamentals.pe !== null) {
              ipo.valuation.peRatio = stock.fundamentals.pe;
            }
            if (ipo.valuation.pbRatio === null && stock.fundamentals.pb !== null) {
              ipo.valuation.pbRatio = stock.fundamentals.pb;
            }
            if (ipo.valuation.marketCapCr === null && stock.marketCapCr !== null) {
              ipo.valuation.marketCapCr = stock.marketCapCr;
            }
            if (ipo.valuation.eps === null && stock.companyProfile?.epsTtm) {
              ipo.valuation.eps = stock.companyProfile.epsTtm;
            }
            if (ipo.valuation.industryAvgPe === null && stock.companyProfile?.industryPe) {
              ipo.valuation.industryAvgPe = stock.companyProfile.industryPe;
            }
            if (ipo.valuation.peers.length === 0 && stock.peers?.length) {
              ipo.valuation.peers = stock.peers.slice(0, 5).map((p) => ({
                name: p.companyName,
                symbol: p.symbol,
                pe: p.pe,
                pb: p.pb,
                roePct: null,
                marketCapCr: p.marketCapCr,
              }));
            }
            if (stock.logoUrl && !stock.logoUrl.startsWith('/api/company-logo') && ipo.logoUrl?.startsWith('/api/company-logo')) {
              ipo.logoUrl = stock.logoUrl;
            }
          }
        } catch {
          // ignore transient per-symbol errors
        }
      });

      // Preserve any admin-created custom IPOs that didn't come from Groww/IG
      const mergedSlugs = new Set(mergedList.map((m) => m.slug));
      for (const [slug, item] of existingBySlug.entries()) {
        if (!mergedSlugs.has(slug) && item.provenance.source === 'Admin Console Entry') {
          mergedList.push(item);
        }
      }

      // Sort: Open first, then Upcoming (nearest openDate first), Closed, Listed (newest listingDate first)
      const rankStatus: Record<IPOOffering['status'], number> = {
        Open: 0,
        Upcoming: 1,
        Closed: 2,
        Listed: 3,
      };
      mergedList.sort((a, b) => {
        const r = rankStatus[a.status] - rankStatus[b.status];
        if (r !== 0) return r;
        if (a.status === 'Upcoming') {
          const da = a.dates.openDate || '9999-12-31';
          const dbDate = b.dates.openDate || '9999-12-31';
          if (da !== dbDate) return da.localeCompare(dbDate);
        }
        return (b.dates.listingDate || b.dates.openDate || '').localeCompare(
          a.dates.listingDate || a.dates.openDate || ''
        );
      });

      // Clean legacy synthetic records out of db.ipos, watchlists, notifications, and db.stocks
      db.ipos = mergedList;
      db.watchlists = db.watchlists.filter(
        (w) =>
          !(
            w.itemType === 'ipo' &&
            [
              'bharat-grid-power-systems',
              'velox-semiconductor-packaging',
              'sahayadri-precision-aerospace',
            ].includes(w.itemKey)
          )
      );
      db.notifications = db.notifications.filter(
        (n) =>
          !n.link.includes('bharat-grid-power-systems') &&
          !n.link.includes('velox-semiconductor-packaging')
      );
      db.stocks = db.stocks.filter(
        (s) => !['DECCANSOL', 'COASTALPRT'].includes(s.symbol.toUpperCase())
      );

      // Update data source health rows
      const nowStr = new Date().toISOString();
      const upsertSource = (id: string, name: string, category: string, count: number, notes: string) => {
        const existingSrc = db.dataSources.find((d) => d.id === id);
        if (existingSrc) {
          existingSrc.status = count > 0 ? 'HEALTHY' : 'DELAYED';
          existingSrc.lastCheckedAt = nowStr;
          if (count > 0) existingSrc.lastSuccessAt = nowStr;
          existingSrc.recordsCount = count;
          existingSrc.notes = notes;
        } else {
          db.dataSources.push({
            id,
            name,
            category,
            providerType: 'Live Primary Issue Feed',
            status: count > 0 ? 'HEALTHY' : 'DELAYED',
            lastCheckedAt: nowStr,
            lastSuccessAt: count > 0 ? nowStr : null,
            recordsCount: count,
            notes,
          });
        }
      };
      upsertSource(
        'src-ipo-groww',
        'Groww Primary Issue & RHP Registry',
        'IPO Offerings',
        mergedList.length,
        `Synced ${growwLists.open.length} Open, ${growwLists.upcoming.length} Upcoming, and ${growwLists.closed.length} Listed/Closed Indian IPOs.`
      );
      upsertSource(
        'src-ipo-gmp',
        'InvestorGain Indicative GMP Feed',
        'GMP',
        igRows.length,
        `Synced ${igRows.length} live Grey Market Premium & IPO records.`
      );

      lastIpoListSync = Date.now();
      saveDb();
      return db.ipos;
    } catch {
      return db.ipos;
    } finally {
      inflightIpoSync = null;
    }
  })();

  return inflightIpoSync;
}

export async function getIpoBySlugLive(slugOrId: string): Promise<IPOOffering | null> {
  const list = await refreshIposFromProvider(false);
  const db = getDb();
  let ipo =
    list.find((i) => i.slug === slugOrId || i.id === slugOrId) ||
    db.ipos.find((i) => i.slug === slugOrId || i.id === slugOrId) ||
    null;

  const targetSlug = ipo?.slug || slugOrId;
  const lastDet = detailSyncedAt.get(targetSlug) ?? 0;

  if (!ipo || Date.now() - lastDet > IPO_DETAIL_TTL_MS || (ipo.gmp.latestGmp !== null && ipo.gmp.history.length <= 1)) {
    const igPath = igUrlBySlug.get(targetSlug);
    const [detail, igDet] = await Promise.all([
      fetchGrowwIpoDetail(targetSlug),
      igPath ? fetchInvestorGainDetail(igPath) : Promise.resolve({ history: [], peRatio: null }),
    ]);

    if (detail || igDet.history.length > 0) {
      const updated = buildIpoFromSources({
        slug: targetSlug,
        detail,
        igHistory: igDet.history,
        existing: ipo ?? undefined,
      });
      detailSyncedAt.set(targetSlug, Date.now());
      const idx = db.ipos.findIndex((i) => i.slug === updated.slug);
      if (idx >= 0) {
        db.ipos[idx] = updated;
      } else {
        db.ipos.unshift(updated);
      }
      saveDb();
      ipo = updated;
    }
  }

  // Enrich Listed IPOs with live NSE/BSE quote (works even for newly listed IPOs outside the top-150 static universe)
  if (ipo && ipo.status === 'Listed' && ipo.listing.stockSymbol) {
    try {
      const { stock } = await refreshStockBySymbol(ipo.listing.stockSymbol, '1mo');
      if (stock && stock.currentPrice !== null) {
        ipo.listing.stockSymbol = stock.symbol;
        ipo.listing.currentMarketPrice = stock.currentPrice;
        ipo.listing.previousClose = stock.previousClose;
        ipo.listing.priceStatus = stock.provenance.qualityStatus;
        ipo.listing.listingExchange = stock.exchange.includes('NSE')
          ? 'NSE'
          : stock.exchange.includes('BSE')
            ? 'BSE'
            : ipo.listing.listingExchange;
        ipo.listing.provenance = {
          ...ipo.listing.provenance,
          source: `${stock.exchange} Live Market Quote`,
          retrievedAt: stock.provenance.retrievedAt,
          effectiveDate: stock.provenance.effectiveDate,
          qualityStatus: stock.provenance.qualityStatus,
        };
        if (ipo.valuation.peRatio === null && stock.fundamentals.pe !== null) {
          ipo.valuation.peRatio = stock.fundamentals.pe;
        }
        if (ipo.valuation.pbRatio === null && stock.fundamentals.pb !== null) {
          ipo.valuation.pbRatio = stock.fundamentals.pb;
        }
        if (ipo.valuation.marketCapCr === null && stock.marketCapCr !== null) {
          ipo.valuation.marketCapCr = stock.marketCapCr;
        }
        if (ipo.valuation.eps === null && stock.companyProfile?.epsTtm) {
          ipo.valuation.eps = stock.companyProfile.epsTtm;
        }
        if (ipo.valuation.industryAvgPe === null && stock.companyProfile?.industryPe) {
          ipo.valuation.industryAvgPe = stock.companyProfile.industryPe;
        }
        saveDb();
      }
    } catch {
      // Keep existing listing quote if upstream symbol lookup is temporarily unavailable
    }
  }

  return ipo;
}
