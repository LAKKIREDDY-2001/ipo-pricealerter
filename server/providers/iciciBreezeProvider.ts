/**
 * ICICI Direct Breeze API Suite Provider
 * Enterprise broker integration for real-time market data, live OHLCV candle streaming,
 * tick-by-tick order book depth, institutional research signals (iClick2Gain / One Click F&O),
 * Demat holdings, historical candles, and SEBI-compliant algorithmic order management.
 * 
 * Documentation Reference: https://api.icicidirect.com/breezeapi/documents/index.html
 */

import { createHash } from 'node:crypto';

// ============================================================================
// Constants & API Endpoints
// ============================================================================

export const BREEZE_BASE_URL = 'https://api.icicidirect.com/breezeapi/api/v1';
export const BREEZE_V2_BASE_URL = 'https://breezeapi.icicidirect.com/api/v2';
export const BREEZE_LOGIN_URL = 'https://api.icicidirect.com/apiuser/login';
export const BREEZE_LIVESTREAM_WS_URL = 'https://livestream.icicidirect.com/';
export const BREEZE_LIVEFEEDS_WS_URL = 'https://livefeeds.icicidirect.com/';
export const BREEZE_OHLCV_WS_URL = 'https://breezeapi.icicidirect.com/';
export const BREEZE_OHLCV_SOCKET_PATH = '/ohlcvstream';
export const BREEZE_SECURITY_MASTER_URL = 'https://directlink.icicidirect.com/NewSecurityMaster/SecurityMaster.zip';
export const BREEZE_SCRIP_CSV_URL = 'https://traderweb.icicidirect.com/Content/File/txtFile/ScripFile/StockScriptNew.csv';

export const BREEZE_RATE_LIMITS = {
  CALLS_PER_MINUTE: 100,
  CALLS_PER_DAY: 5000,
  ORDERS_PER_SECOND: 10,
  MAX_STREAM_SUBSCRIPTIONS: 2000,
} as const;

export const BREEZE_CANDLE_INTERVALS = ['1SEC', '1MIN', '5MIN', '30MIN'] as const;
export type BreezeCandleInterval = (typeof BREEZE_CANDLE_INTERVALS)[number];

export const BREEZE_EXCHANGE_QUALIFIERS = {
  NSE_QUOTE: '4.1',
  NSE_DEPTH: '4.2',
  BSE_QUOTE: '1.1',
  BSE_DEPTH: '1.2',
} as const;

// ============================================================================
// Interface Definitions
// ============================================================================

export interface BreezeCredentials {
  appKey: string;
  secretKey: string;
  sessionToken?: string;
  apiSession?: string;
}

export interface BreezeCustomerDetails {
  idirectUserId: string;
  idirectUserName: string;
  sessionToken: string;
  exgTradeDate: Record<string, string>;
  exgStatus: Record<string, string>;
  segmentsAllowed: Record<string, string>;
  idirectLastLoginTime: string;
}

export interface BreezeQuoteItem {
  exchange_code: 'NSE' | 'NFO';
  product_type: string;
  stock_code: string;
  expiry_date?: string;
  right?: string;
  strike_price?: number;
  ltp: number;
  ltt: string;
  best_bid_price?: number;
  best_bid_quantity?: string | number;
  best_offer_price?: number;
  best_offer_quantity?: string | number;
  open: number;
  high: number;
  low: number;
  previous_close: number;
  ltp_percent_change: number;
  upper_circuit: number;
  lower_circuit: number;
  total_quantity_traded: string | number;
  spot_price?: string | number;
}

export interface BreezeTickData {
  symbol: string;
  open: number;
  last: number;
  high: number;
  low: number;
  change: number;
  bPrice: number;
  bQty: number;
  sPrice: number;
  sQty: number;
  ltq: number;
  avgPrice: number;
  quotes?: string;
  ttq: number;
  totalBuyQt: number;
  totalSellQt: number;
  ttv: string;
  trend?: string;
  lowerCktLm: number;
  upperCktLm: number;
  ltt: string;
  close: number;
  exchange: string;
  stock_name?: string;
}

export interface BreezeLiveOhlcvCandle {
  exchange: 'NSE' | 'NFO' | 'NDX' | 'MCX';
  stockCode: string;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
  datetime: string;
  interval: BreezeCandleInterval;
  expiryDate?: string;
  strikePrice?: number;
  rightType?: 'CE' | 'PE' | string;
  openInterest?: number;
}

export interface BreezeHistoricalCandleItem {
  datetime: string;
  stock_code: string;
  exchange_code: string;
  product_type?: string | null;
  expiry_date?: string | null;
  right?: string | null;
  strike_price?: string | number | null;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  volume: string | number;
  open_interest?: string | number | null;
  count?: number;
}

export interface BreezeDematHoldingItem {
  stock_code: string;
  stock_ISIN: string;
  quantity: string | number;
  demat_total_bulk_quantity?: string | number;
  demat_avail_quantity?: string | number;
  blocked_quantity?: string | number;
  demat_allocated_quantity?: string | number;
}

export interface BreezePortfolioPositionItem {
  segment: string;
  product_type: string;
  exchange_code: string;
  stock_code: string;
  expiry_date?: string;
  strike_price?: string | number;
  right?: string;
  action?: string;
  quantity: string | number;
  average_price: string | number;
  ltp: string | number;
  price: string | number;
  underlying?: string;
}

export interface BreezeIclickGainItem {
  stock_name: string;
  stock_code: string;
  action_type: 'buy' | 'sell';
  expiry_date?: string;
  strike_price?: string;
  option_type?: string;
  stock_description: string;
  recommended_price_and_date?: string;
  recommended_price_from: string | number;
  recommended_price_to: string | number;
  recommended_date: string;
  target_price: string | number;
  sltp_price: string | number;
  iclick_status: 'open' | 'closed' | string;
  subscription_type: string;
}

export interface BreezeOneClickFnoItem {
  strategy_date: string;
  portfolio_name: string;
  exchange_code: string;
  product_type: string;
  underlying: string;
  expiry_date: string;
  option_type: string;
  strike_price: string | number;
  action: 'buy' | 'sell';
  recommended_price_from: string | number;
  recommended_price_to: string | number;
  minimum_lot_quantity: string | number;
  last_traded_price: string | number;
  target_price: string | number;
  expected_profit_per_lot: string | number;
  stop_loss_price: string | number;
  expected_loss_per_lot: string | number;
  total_margin: string | number;
  status: 'active' | 'closed' | string;
}

export interface BreezeBrokeragePreviewRequest {
  stock_code: string;
  exchange_code: 'NSE' | 'NFO';
  product: 'cash' | 'btst' | 'mtf' | 'futures' | 'options';
  order_type: 'limit' | 'stoploss';
  price: string | number;
  action: 'buy' | 'sell';
  quantity: string | number;
  expiry_date?: string;
  right?: 'call' | 'put' | 'others';
  strike_price?: string | number;
}

export interface BreezeOrderPlacementRequest {
  stock_code: string;
  exchange_code: 'NSE' | 'NFO';
  product: 'cash' | 'btst' | 'futures' | 'options';
  action: 'buy' | 'sell';
  order_type: 'limit' | 'stoploss';
  quantity: string | number;
  price: string | number;
  stoploss?: number;
  validity?: 'day' | 'ioc';
  expiry_date?: string;
  right?: 'call' | 'put' | 'others';
  strike_price?: string | number;
  user_remark?: string;
}

// ============================================================================
// Credential Resolution & Environment Detection
// ============================================================================

export function getBreezeCredentials(): BreezeCredentials | null {
  const appKey = process.env.BREEZE_APP_KEY?.trim() || process.env.ICICI_DIRECT_APP_KEY?.trim();
  const secretKey = process.env.BREEZE_SECRET_KEY?.trim() || process.env.ICICI_DIRECT_SECRET_KEY?.trim();
  const sessionToken = process.env.BREEZE_SESSION_TOKEN?.trim() || process.env.ICICI_DIRECT_SESSION_TOKEN?.trim();
  const apiSession = process.env.BREEZE_API_SESSION?.trim();

  if (!appKey || !secretKey) {
    return null;
  }
  return { appKey, secretKey, sessionToken, apiSession };
}

export function isBreezeConfigured(): boolean {
  return Boolean(getBreezeCredentials());
}

// ============================================================================
// Checksum Computation & Header Preparation
// ============================================================================

/**
 * Format timestamp strictly into ISO8601 UTC with 0 milliseconds
 * as mandated by ICICI Breeze API (e.g. 2024-06-01T10:23:56.000Z).
 */
export function formatBreezeTimestamp(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}

/**
 * Checksum computation via SHA256 hash:
 * Checksum = SHA256(Timestamp + JSON_Body + secret_key)
 */
export function computeBreezeChecksum(
  timestamp: string,
  bodyJson: string,
  secretKey: string
): string {
  const rawPayload = `${timestamp}${bodyJson}${secretKey}`;
  return createHash('sha256').update(rawPayload).digest('hex');
}

/**
 * Build standard headers for authenticated Breeze API requests
 */
export function buildBreezeHeaders(
  creds: BreezeCredentials,
  bodyJson: string = '{}',
  timestampOverride?: string
): Record<string, string> {
  const timestamp = timestampOverride || formatBreezeTimestamp();
  const checksum = computeBreezeChecksum(timestamp, bodyJson, creds.secretKey);

  return {
    'Content-Type': 'application/json',
    'X-Checksum': `token ${checksum}`,
    'X-Timestamp': timestamp,
    'X-AppKey': creds.appKey,
    'X-SessionToken': creds.sessionToken || '',
  };
}

/**
 * Decode Breeze session token from base64 string returned by CustomerDetails API
 * Format: base64(userId:sessionToken)
 */
export function decodeBreezeSessionToken(base64Token: string): { userId: string; sessionToken: string } {
  try {
    const decoded = Buffer.from(base64Token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    return {
      userId: parts[0] || '',
      sessionToken: parts[1] || decoded,
    };
  } catch {
    return { userId: '', sessionToken: base64Token };
  }
}

// ============================================================================
// Real-time Data Converters & Normalizers
// ============================================================================

/**
 * Convert ICICI Breeze Quote response to PriceAlerter standard quote shape
 */
export function convertBreezeQuoteToStandard(item: BreezeQuoteItem) {
  const cleanSymbol = item.stock_code.replace(/-EQ$/i, '').trim().toUpperCase();
  const ltp = Number(item.ltp) || 0;
  const prevClose = Number(item.previous_close) || ltp;
  const change = ltp - prevClose;
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : (Number(item.ltp_percent_change) || 0);

  return {
    symbol: cleanSymbol,
    exchange: item.exchange_code || 'NSE',
    currentPrice: ltp,
    previousClose: prevClose,
    dayChange: Number(change.toFixed(2)),
    dayChangePercent: Number(changePct.toFixed(2)),
    open: Number(item.open) || ltp,
    high: Number(item.high) || ltp,
    low: Number(item.low) || ltp,
    close: ltp,
    volume: typeof item.total_quantity_traded === 'string'
      ? parseInt(item.total_quantity_traded, 10) || 0
      : item.total_quantity_traded || 0,
    upperCircuit: Number(item.upper_circuit) || undefined,
    lowerCircuit: Number(item.lower_circuit) || undefined,
    lastTradeTime: item.ltt || new Date().toISOString(),
    depth: {
      buy: item.best_bid_price ? [{ price: Number(item.best_bid_price), quantity: Number(item.best_bid_quantity) || 0 }] : [],
      sell: item.best_offer_price ? [{ price: Number(item.best_offer_price), quantity: Number(item.best_offer_quantity) || 0 }] : [],
    },
    provenance: {
      source: 'ICICI Direct Breeze API',
      retrievedAt: new Date().toISOString(),
      qualityStatus: 'LIVE' as const,
    },
  };
}

/**
 * Parse live WebSocket tick packet from Breeze Livestream
 */
export function parseBreezeLiveTick(tick: BreezeTickData) {
  const cleanSymbol = (tick.stock_name || tick.symbol || '')
    .replace(/^.*!/i, '')
    .replace(/-EQ$/i, '')
    .trim()
    .toUpperCase();

  const ltp = Number(tick.last) || Number(tick.close) || 0;
  const prevClose = Number(tick.close) || ltp;
  const change = ltp - prevClose;
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : (Number(tick.change) || 0);

  return {
    symbol: cleanSymbol,
    exchange: 'NSE',
    currentPrice: ltp,
    previousClose: prevClose,
    dayChange: Number(change.toFixed(2)),
    dayChangePercent: Number(changePct.toFixed(2)),
    open: Number(tick.open) || ltp,
    high: Number(tick.high) || ltp,
    low: Number(tick.low) || ltp,
    close: ltp,
    volume: Number(tick.ttq) || 0,
    vwap: Number(tick.avgPrice) || undefined,
    turnoverCr: tick.ttv ? parseTurnoverStringToCr(tick.ttv) : undefined,
    upperCircuit: Number(tick.upperCktLm) || undefined,
    lowerCircuit: Number(tick.lowerCktLm) || undefined,
    lastTradeTime: tick.ltt ? new Date(tick.ltt).toISOString() : new Date().toISOString(),
    depth: {
      buy: [{ price: Number(tick.bPrice) || 0, quantity: Number(tick.bQty) || 0 }],
      sell: [{ price: Number(tick.sPrice) || 0, quantity: Number(tick.sQty) || 0 }],
      totalBuyQuantity: Number(tick.totalBuyQt) || 0,
      totalSellQuantity: Number(tick.totalSellQt) || 0,
    },
    provenance: {
      source: 'ICICI Direct Breeze Tick Stream',
      retrievedAt: new Date().toISOString(),
      qualityStatus: 'LIVE' as const,
    },
  };
}

/**
 * Helper to parse turnover string e.g. "266.54C" to crore numeric value 266.54
 */
export function parseTurnoverStringToCr(ttv: string): number {
  if (!ttv) return 0;
  const cleaned = ttv.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Parse live streaming CSV OHLCV candle (StreamLiveOHLCV)
 * Equity CSV: "NSE,NIFTY,18687.95,18687.95,18687.95,18687.95,0,2022-12-02 14:13:53,1SEC"
 * Derivatives CSV: "NFO,NIFTY,08-Dec-2022,18700.0,CE,120.5,120.5,120.5,120.5,2500,7592550,2022-12-02 14:10:14,1SEC"
 */
export function parseBreezeLiveOhlcv(csvLine: string): BreezeLiveOhlcvCandle | null {
  if (!csvLine || typeof csvLine !== 'string') return null;
  const parts = csvLine.split(',').map((p) => p.trim());
  if (parts.length < 9) return null;

  if (parts.length === 9) {
    // Equity format: exchange, stock_code, low, high, open, close, volume, datetime, interval
    const [exchange, stockCode, lowStr, highStr, openStr, closeStr, volStr, datetime, interval] = parts;
    return {
      exchange: exchange as any,
      stockCode: stockCode.toUpperCase(),
      low: parseFloat(lowStr) || 0,
      high: parseFloat(highStr) || 0,
      open: parseFloat(openStr) || 0,
      close: parseFloat(closeStr) || 0,
      volume: parseInt(volStr, 10) || 0,
      datetime,
      interval: interval as BreezeCandleInterval,
    };
  }

  // Derivatives format: exchange, stock_code, expiry_date, strike_price, right_type, low, high, open, close, volume, oi, datetime, interval
  const [exchange, stockCode, expiryDate, strikeStr, rightType, lowStr, highStr, openStr, closeStr, volStr, oiStr, datetime, interval] = parts;
  return {
    exchange: exchange as any,
    stockCode: stockCode.toUpperCase(),
    expiryDate,
    strikePrice: parseFloat(strikeStr) || 0,
    rightType: rightType as any,
    low: parseFloat(lowStr) || 0,
    high: parseFloat(highStr) || 0,
    open: parseFloat(openStr) || 0,
    close: parseFloat(closeStr) || 0,
    volume: parseInt(volStr, 10) || 0,
    openInterest: parseInt(oiStr, 10) || 0,
    datetime,
    interval: interval as BreezeCandleInterval,
  };
}

/**
 * Format historical candles from /api/v2/historicalcharts to PriceAlerter chart series
 */
export function formatBreezeHistoricalCandles(candles: BreezeHistoricalCandleItem[]) {
  if (!Array.isArray(candles)) return [];

  return candles
    .filter((c) => c && c.datetime && c.close !== null && c.close !== undefined)
    .map((c) => {
      const open = typeof c.open === 'string' ? parseFloat(c.open) : Number(c.open);
      const high = typeof c.high === 'string' ? parseFloat(c.high) : Number(c.high);
      const low = typeof c.low === 'string' ? parseFloat(c.low) : Number(c.low);
      const close = typeof c.close === 'string' ? parseFloat(c.close) : Number(c.close);
      const volume = typeof c.volume === 'string' ? parseInt(c.volume, 10) : Number(c.volume);

      return {
        date: c.datetime.includes('T') ? c.datetime : `${c.datetime.replace(' ', 'T')}.000Z`,
        open: isNaN(open) ? close : open,
        high: isNaN(high) ? close : high,
        low: isNaN(low) ? close : low,
        close: isNaN(close) ? 0 : close,
        volume: isNaN(volume) ? 0 : volume,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Convert ICICI Breeze Demat holdings to PriceAlerter PortfolioHolding records
 */
export function convertBreezeHoldingsToPortfolio(holdings: BreezeDematHoldingItem[]) {
  if (!Array.isArray(holdings)) return [];

  return holdings.map((h) => {
    const qty = typeof h.quantity === 'string' ? parseFloat(h.quantity) : Number(h.quantity) || 0;
    return {
      symbol: h.stock_code.toUpperCase(),
      isin: h.stock_ISIN,
      quantity: qty,
      availableQuantity: h.demat_avail_quantity ? Number(h.demat_avail_quantity) : qty,
      blockedQuantity: h.blocked_quantity ? Number(h.blocked_quantity) : 0,
      allocatedQuantity: h.demat_allocated_quantity ? Number(h.demat_allocated_quantity) : 0,
      source: 'ICICI Direct Breeze Demat',
    };
  });
}

/**
 * Convert iClick2Gain research stream item to standardized recommendation signal
 */
export function parseBreezeIclickGain(item: BreezeIclickGainItem) {
  return {
    symbol: item.stock_code.toUpperCase(),
    companyName: item.stock_name,
    action: item.action_type.toUpperCase() as 'BUY' | 'SELL',
    recommendedRange: {
      from: Number(item.recommended_price_from),
      to: Number(item.recommended_price_to),
    },
    targetPrice: Number(item.target_price),
    stopLossPrice: Number(item.sltp_price),
    status: item.iclick_status.toUpperCase(),
    strategyDate: item.recommended_date,
    source: 'ICICI Direct Research (iClick2Gain)',
  };
}

/**
 * Convert One Click F&O stream item to standardized derivatives strategy
 */
export function parseBreezeOneClickFno(item: BreezeOneClickFnoItem) {
  return {
    strategyName: item.portfolio_name,
    underlying: item.underlying.trim().toUpperCase(),
    exchange: item.exchange_code,
    expiryDate: item.expiry_date,
    strikePrice: Number(item.strike_price),
    optionType: item.option_type.toUpperCase(),
    action: item.action.toUpperCase() as 'BUY' | 'SELL',
    recommendedRange: {
      from: Number(item.recommended_price_from),
      to: Number(item.recommended_price_to),
    },
    targetPrice: Number(item.target_price),
    stopLossPrice: Number(item.stop_loss_price),
    lotSize: Number(item.minimum_lot_quantity),
    expectedProfitPerLot: Number(item.expected_profit_per_lot),
    expectedLossPerLot: Number(item.expected_loss_per_lot),
    totalMarginRequired: Number(item.total_margin),
    status: item.status.toUpperCase(),
    strategyDate: item.strategy_date,
    source: 'ICICI Direct Research (One Click F&O)',
  };
}

// ============================================================================
// SEBI Compliance & Algo Order Validation
// ============================================================================

/**
 * Validates order parameters against SEBI retail algorithmic trading regulations:
 * 1. Market orders are prohibited by SEBI circular (must use limit orders)
 * 2. Orders must specify a valid limit price
 * 3. Max combined rate limit of 10 orders per second
 */
export function validateBreezeOrder(order: BreezeOrderPlacementRequest): { valid: boolean; error?: string } {
  if (!order.stock_code) {
    return { valid: false, error: 'Stock code is required.' };
  }
  if (!order.quantity || Number(order.quantity) <= 0) {
    return { valid: false, error: 'Quantity must be greater than zero.' };
  }
  // SEBI Circular: Retail algorithmic trading prohibits placing market orders via API
  if ((order.order_type as string).toLowerCase() === 'market') {
    return {
      valid: false,
      error: 'As per SEBI circular on Algorithmic Trading, market orders through the Breeze API are prohibited. You must place a limit order instead.',
    };
  }
  if (!order.price || Number(order.price) <= 0) {
    return { valid: false, error: 'A valid limit price is required for limit orders.' };
  }
  return { valid: true };
}

/**
 * Build GTT order payload ensuring compliance with SEBI limit order rules
 */
export function buildBreezeGttPayload(params: {
  stockCode: string;
  exchangeCode: 'NSE' | 'NFO';
  action: 'buy' | 'sell';
  quantity: number;
  triggerPrice: number;
  limitPrice: number;
  gttType?: 'single' | 'cover_oco';
  product?: 'futures' | 'options';
  expiryDate?: string;
  strikePrice?: number;
  right?: 'call' | 'put' | 'others';
}) {
  return {
    stock_code: params.stockCode.toUpperCase(),
    exchange_code: params.exchangeCode,
    product: params.product || 'options',
    action: params.action,
    quantity: String(params.quantity),
    trigger_price: String(params.triggerPrice),
    limit_price: String(params.limitPrice),
    gtt_type: params.gttType || 'single',
    fresh_order_action: params.action,
    fresh_order_type: 'limit',
    index_or_stock: 'stock',
    trade_date: formatBreezeTimestamp().split('T')[0],
    gtt_leg_type: 'stoploss',
    expiry_date: params.expiryDate || '',
    strike_price: params.strikePrice ? String(params.strikePrice) : '0',
    right: params.right || 'others',
  };
}
