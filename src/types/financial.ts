export type DataQualityStatus =
  | 'VERIFIED'
  | 'DELAYED'
  | 'STALE'
  | 'ESTIMATED'
  | 'UNAVAILABLE'
  | 'UNDER_REVIEW';

export type VerificationStatus = 'Verified' | 'Provisional' | 'Unverified';

export interface ProvenanceMetadata {
  source: string;
  retrievedAt: string;
  effectiveDate: string;
  verificationStatus: VerificationStatus;
  qualityStatus: DataQualityStatus;
  currency: 'INR' | 'USD' | 'PTS' | 'PCT';
  unit: string;
  dataCategory: string;
}

export interface MarketIndexInstrument {
  id: string;
  symbol: string;
  yahooSymbol: string;
  name: string;
  value: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  unit: string;
  provenance: ProvenanceMetadata;
}

export interface IPODailySubscription {
  day: string;
  date: string;
  qib: number | null;
  nii: number | null;
  retail: number | null;
  total: number | null;
}

export interface IPOGMPHistoryPoint {
  date: string;
  gmp: number;
  note?: string;
}

export interface IPOFinancialYear {
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

export interface IPOPeerComparison {
  name: string;
  symbol: string;
  pe: number | null;
  pb: number | null;
  roePct: number | null;
  marketCapCr: number | null;
}

export interface IPOOffering {
  id: string;
  slug: string;
  companyName: string;
  shortName: string;
  logoMonogram: string;
  logoColor: string;
  logoUrl?: string | null;
  sector: string;
  industry: string;
  category: 'Mainboard' | 'SME';
  status: 'Open' | 'Upcoming' | 'Closed' | 'Listed';
  exchanges: ('NSE' | 'BSE')[];
  website: string;
  registrar: string;
  registrarUrl: string;
  issueSizeCr: number | null;
  freshIssueCr: number | null;
  ofsCr: number | null;
  priceBandLow: number | null;
  priceBandHigh: number | null;
  lotSize: number | null;
  minBidQuantity?: number | null;
  minInvestment: number | null;
  faceValue?: number | null;
  dates: {
    openDate: string | null;
    closeDate: string | null;
    allotmentDate: string | null;
    refundDate: string | null;
    dematCreditDate: string | null;
    listingDate: string | null;
  };
  subscription: {
    qib: number | null;
    nii: number | null;
    retail: number | null;
    employee: number | null;
    shareholder: number | null;
    total: number | null;
    isFinal: boolean;
    dailyBreakdown: IPODailySubscription[];
    provenance: ProvenanceMetadata;
  };
  gmp: {
    latestGmp: number | null;
    previousGmp: number | null;
    lastUpdated: string | null;
    availability: 'Available' | 'Unavailable';
    source: string;
    history: IPOGMPHistoryPoint[];
  };
  listing: {
    issuePrice: number | null;
    actualListingPrice: number | null;
    listingExchange: 'NSE' | 'BSE' | null;
    stockSymbol: string | null;
    currentMarketPrice: number | null;
    previousClose: number | null;
    listingDate: string | null;
    priceStatus: DataQualityStatus;
    provenance: ProvenanceMetadata;
  };
  financials: {
    reportingBasis: string;
    years: IPOFinancialYear[];
  };
  valuation: {
    peRatio: number | null;
    pbRatio: number | null;
    marketCapCr: number | null;
    eps: number | null;
    industryAvgPe: number | null;
    reportingPeriod: string;
    calculationBasis: string;
    peers: IPOPeerComparison[];
  };
  profile: {
    overview: string;
    productsAndServices: string;
    businessModel: string;
    industryOverview: string;
    competitivePosition: string;
    promoters: string[];
    growthOpportunities: string[];
    strengths: string[];
    risks: string[];
  };
  documents: {
    drhpUrl: string | null;
    rhpUrl: string | null;
    prospectusUrl: string | null;
    anchorUrl: string | null;
    allotmentUrl: string | null;
    exchangeNoticeUrl: string | null;
  };
  archived?: boolean;
  provenance: ProvenanceMetadata;
}

export interface StockHistoricalPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockAnnouncement {
  id: string;
  date: string;
  title: string;
  category: string;
  source: string;
}

export interface ExchangeLiveQuote {
  ltp: number | null;
  previousClose: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  dayChange: number | null;
  dayChangePct: number | null;
  volume: number | null;
  lastTradeTime: string | null;
  lastTradeQty?: number | null;
  totalBuyQty?: number | null;
  totalSellQty?: number | null;
  upperCircuit?: number | null;
  lowerCircuit?: number | null;
}

export interface StockShareholdingQuarter {
  quarter: string;
  promoters: number | null;
  fii: number | null;
  dii: number | null;
  public: number | null;
  others: number | null;
}

export interface StockFinancialSeries {
  basis: 'CONSOLIDATED' | 'STANDALONE';
  revenueYearly: Array<{ period: string; valueCr: number }>;
  profitYearly: Array<{ period: string; valueCr: number }>;
  netWorthYearly: Array<{ period: string; valueCr: number }>;
  revenueQuarterly: Array<{ period: string; valueCr: number }>;
  profitQuarterly: Array<{ period: string; valueCr: number }>;
}

export interface StockPeerComparison {
  symbol: string;
  companyName: string;
  logoUrl?: string | null;
  marketCapCr: number | null;
  pe: number | null;
  pb: number | null;
  yearHigh: number | null;
  yearLow: number | null;
}

export interface StockMutualFundHolding {
  name: string;
  investedAumPct: number | null;
  rating: number | null;
  return1y: number | null;
  return3y: number | null;
}

export interface StockRegistryMetadata {
  nseSeries: string | null;
  nseListingDate: string | null;
  faceValue: number | null;
  marketLot: number | null;
  tickSize: number | null;
  zerodhaNseToken: number | null;
  zerodhaBseToken: number | null;
  isFnoEnabled: boolean;
}

export interface StockCompanyProfile {
  ceo: string | null;
  managingDirector: string | null;
  foundedYear: string | null;
  businessSummary: string | null;
  epsTtm: number | null;
  bookValue: number | null;
  industryPe: number | null;
  faceValue: number | null;
}

export interface StockInstrument {
  id: string;
  symbol: string;
  bseCode: string;
  yahooSymbol: string;
  searchId?: string;
  companyName: string;
  logoUrl?: string | null;
  exchange: 'NSE' | 'BSE' | 'NSE/BSE';
  sector: string;
  industry: string;
  isin: string;
  currentPrice: number | null;
  previousClose: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  week52High: number | null;
  week52Low: number | null;
  volume: number | null;
  marketCapCr: number | null;
  lastTradeTime?: string | null;
  nseQuote?: ExchangeLiveQuote | null;
  bseQuote?: ExchangeLiveQuote | null;
  fundamentals: {
    pe: number | null;
    pb: number | null;
    roePct: number | null;
    rocePct: number | null;
    debtToEquity: number | null;
    revenueGrowthPct: number | null;
    profitGrowthPct: number | null;
    dividendYieldPct: number | null;
    reportingPeriod: string;
    source: string;
  };
  companyProfile?: StockCompanyProfile | null;
  registry?: StockRegistryMetadata | null;
  shareholding?: StockShareholdingQuarter[];
  financialStatements?: StockFinancialSeries[];
  peers?: StockPeerComparison[];
  fundsInvested?: StockMutualFundHolding[];
  dataSourcesUsed?: string[];
  sparkline: number[];
  historicalSeries: StockHistoricalPoint[];
  announcements: StockAnnouncement[];
  ipoHistorySlug?: string;
  provenance: ProvenanceMetadata;
}

export interface MarketInsight {
  id: string;
  slug: string;
  title: string;
  category: 'Market Overview' | 'IPO Update' | 'Commodities & FX' | 'Sector & Macro';
  publishedAt: string;
  source: string;
  sourceUrl: string;
  summary: string;
  facts: string[];
  analysis: string;
  instruments: string[];
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  category:
    | 'IPO Basics'
    | 'IPO Application'
    | 'IPO Allotment'
    | 'GMP'
    | 'Stock Market'
    | 'Fundamental Analysis'
    | 'Technical Analysis'
    | 'Financial Ratios'
    | 'Mutual Funds'
    | 'Investment Risk'
    | 'Financial Literacy';
  author: string;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  excerpt: string;
  toc: Array<{ id: string; title: string }>;
  sections: Array<{
    id: string;
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  officialReferences: Array<{ label: string; url: string }>;
  relatedSlugs: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  createdAt: string;
  preferences: {
    emailAlerts: boolean;
    browserNotifications: boolean;
    ipoReminders: boolean;
    gmpAlerts: boolean;
  };
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  itemType: 'ipo' | 'stock';
  itemKey: string;
  label: string;
  createdAt: string;
}

export interface PriceAlertRule {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  conditionType: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PCT_CHANGE_UP' | 'PCT_CHANGE_DOWN';
  targetValue: number;
  baselinePrice: number | null;
  enabled: boolean;
  status: 'ACTIVE' | 'TRIGGERED' | 'PAUSED';
  triggeredAt: string | null;
  triggeredPrice: number | null;
  createdAt: string;
  updatedAt: string;
  history: Array<{
    timestamp: string;
    event: string;
    priceAtEvent: number | null;
  }>;
}

export interface NotificationItem {
  id: string;
  userId: string;
  category: 'IPO_REMINDER' | 'GMP_CHANGE' | 'PRICE_ALERT' | 'MARKET_UPDATE';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  actorEmail: string;
  actorRole: string;
  timestamp: string;
  entityType: 'IPO' | 'GMP' | 'STOCK' | 'BLOG' | 'DATA_SOURCE' | 'USER';
  entityId: string;
  action: string;
  previousValue: string;
  newValue: string;
  source: string;
  verificationStatus: VerificationStatus;
}

export interface DataSourceStatus {
  id: string;
  name: string;
  category: string;
  providerType: string;
  status: 'HEALTHY' | 'DELAYED' | 'RATE_LIMITED' | 'UNAVAILABLE';
  lastCheckedAt: string;
  lastSuccessAt: string | null;
  recordsCount: number;
  notes: string;
}
