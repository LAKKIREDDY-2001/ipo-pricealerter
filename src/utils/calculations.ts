export function formatINR(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Unavailable';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumberIN(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Unavailable';
  }
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompactNumberIN(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Unavailable';
  }
  if (value >= 1e7) {
    return `${(value / 1e7).toFixed(2)} Cr`;
  }
  if (value >= 1e5) {
    return `${(value / 1e5).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatCrores(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Unavailable';
  }
  return `₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} Cr`;
}

export function formatPercent(value: number | null | undefined, showPlus = true): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Unavailable';
  }
  const sign = showPlus && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDateIN(isoDate: string | null | undefined): string {
  if (!isoDate) return 'TBA';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimestampIN(isoString: string | null | undefined): string {
  if (!isoString) return 'Unavailable';
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return isoString;
  return (
    parsed.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }) + ' IST'
  );
}

/**
 * Hypothetical GMP estimation formula:
 * Estimated listing price = IPO upper price + GMP
 * Estimated gain % = (GMP / IPO upper price) * 100
 */
export function calculateGMPEstimate(
  upperIssuePrice: number | null | undefined,
  gmp: number | null | undefined
): {
  estimatedListingPrice: number | null;
  estimatedGainPct: number | null;
} {
  if (
    upperIssuePrice === null ||
    upperIssuePrice === undefined ||
    upperIssuePrice <= 0 ||
    gmp === null ||
    gmp === undefined
  ) {
    return { estimatedListingPrice: null, estimatedGainPct: null };
  }
  const estimatedListingPrice = Number((upperIssuePrice + gmp).toFixed(2));
  const estimatedGainPct = Number(((gmp / upperIssuePrice) * 100).toFixed(2));
  return { estimatedListingPrice, estimatedGainPct };
}

/**
 * Listing Gain % = ((Actual listing price - IPO issue price) / IPO issue price) * 100
 */
export function calculateListingGainPct(
  issuePrice: number | null | undefined,
  actualListingPrice: number | null | undefined
): number | null {
  if (
    issuePrice === null ||
    issuePrice === undefined ||
    issuePrice <= 0 ||
    actualListingPrice === null ||
    actualListingPrice === undefined
  ) {
    return null;
  }
  return Number((((actualListingPrice - issuePrice) / issuePrice) * 100).toFixed(2));
}

/**
 * Current Return % = ((Current market price - IPO issue price) / IPO issue price) * 100
 */
export function calculateCurrentReturnPct(
  issuePrice: number | null | undefined,
  currentMarketPrice: number | null | undefined
): number | null {
  if (
    issuePrice === null ||
    issuePrice === undefined ||
    issuePrice <= 0 ||
    currentMarketPrice === null ||
    currentMarketPrice === undefined
  ) {
    return null;
  }
  return Number((((currentMarketPrice - issuePrice) / issuePrice) * 100).toFixed(2));
}

export function calculateIPOInvestment(
  ipoPrice: number,
  lotSize: number,
  lots: number
): { sharesApplied: number; totalAmount: number } {
  const safePrice = Math.max(0, Number.isFinite(ipoPrice) ? ipoPrice : 0);
  const safeLot = Math.max(0, Math.floor(Number.isFinite(lotSize) ? lotSize : 0));
  const safeLots = Math.max(0, Math.floor(Number.isFinite(lots) ? lots : 0));
  const sharesApplied = safeLot * safeLots;
  const totalAmount = Number((safePrice * sharesApplied).toFixed(2));
  return { sharesApplied, totalAmount };
}

export function calculateStockReturn(
  buyPrice: number,
  quantity: number,
  currentPrice: number
): {
  investment: number;
  currentValue: number;
  profitLoss: number;
  returnPct: number | null;
} {
  const safeBuy = Math.max(0, Number.isFinite(buyPrice) ? buyPrice : 0);
  const safeQty = Math.max(0, Number.isFinite(quantity) ? quantity : 0);
  const safeCurrent = Math.max(0, Number.isFinite(currentPrice) ? currentPrice : 0);
  const investment = Number((safeBuy * safeQty).toFixed(2));
  const currentValue = Number((safeCurrent * safeQty).toFixed(2));
  const profitLoss = Number((currentValue - investment).toFixed(2));
  const returnPct = investment > 0 ? Number(((profitLoss / investment) * 100).toFixed(2)) : null;
  return { investment, currentValue, profitLoss, returnPct };
}

/**
 * Formats a stock's trading ticker cleanly so an unresolved BSE 6-digit numeric scrip code
 * displays explicitly as "BSE 5xxxxx" instead of appearing as a bare number.
 */
export function formatStockTickerLabel(
  symbol: string | null | undefined,
  bseCode?: string | null
): string {
  const cleanSym = (symbol || '').trim();
  if (!cleanSym) {
    return bseCode && bseCode !== 'N/A' ? `BSE ${bseCode}` : 'Equity';
  }
  if (/^\d+$/.test(cleanSym)) {
    return `BSE ${cleanSym}`;
  }
  return cleanSym;
}

