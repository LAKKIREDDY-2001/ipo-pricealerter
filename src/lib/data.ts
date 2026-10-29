export type IpoStatus = "OPEN" | "UPCOMING" | "CLOSED" | "LISTED";
export type IpoIssueType = "FRESH" | "OFS" | "FRESH_AND_OFS" | "UNKNOWN";
export type IpoBoard = "MAINBOARD" | "SME" | "UNKNOWN";
export type IpoExchange = "NSE" | "BSE" | "BOTH" | "UNKNOWN";
export type DataFreshness = "fresh" | "cached" | "stale" | "manual";
export type IpoFeed = {
  records: Ipo[];
  freshness: DataFreshness | "unavailable";
  lastSuccessfulUpdate?: string;
  refreshSeconds: number;
  errorCode?: string;
};

export type GmpObservation = {
  gmp: number;
  date: string;
  /** Exact observation time when the source provides one. */
  timestamp?: string;
};

export type SubscriptionSnapshot = {
  day: number;
  retail?: number;
  nii?: number;
  qib?: number;
  total?: number;
  timestamp?: string;
};

export type Ipo = {
  id: string;
  slug: string;
  companyName: string;
  shortName: string;
  initials: string;
  color: string;
  logoUrl?: string;
  status: IpoStatus;
  issueType?: IpoIssueType;
  board: IpoBoard;
  exchange?: IpoExchange;
  priceBandLow?: number;
  priceBandHigh?: number;
  issuePrice?: number;
  issueSizeCr?: number;
  freshIssueCr?: number;
  ofsCr?: number;
  lotSize?: number;
  minimumInvestment?: number;
  openDate: string;
  closeDate: string;
  allotDate?: string;
  listingDate?: string;
  gmp?: number;
  gmpPercentage?: number;
  gmpPercentBasis?: "priceBandHigh";
  gmpUpdatedAt?: string;
  gmpHistory?: GmpObservation[];
  subscriptionTotal?: number;
  subscriptionSummary?: {
    retail?: number;
    nii?: number;
    qib?: number;
    total?: number;
    updatedAt?: string;
  };
  subscriptionSource?: string;
  subscription?: SubscriptionSnapshot[];
  subscriptionUpdatedAt?: string;
  source?: string;
  gmpSource?: string;
  sourceUrl?: string;
  providerUrl?: string;
  officialLinks?: { label: string; url: string }[];
  registrarName?: string;
  registrarUrl?: string;
  prospectusUrl?: string;
  lastUpdated?: string;
  sourceFreshness?: DataFreshness;
  sector?: string;
  business?: string;
  review?: string;
  listingPrice?: number;
  listingGain?: number;
  currentPrice?: number;
  applyUrl?: string;
  financials?: { year: string; revenue?: number; profit?: number; ebitda?: number; netWorth?: number; eps?: number; peRatio?: number }[];
  promoters?: { name: string; holding?: number; notes?: string }[];
  peers?: string[];
};
