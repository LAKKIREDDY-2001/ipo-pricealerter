/**
 * Angel One SmartAPI Suite Provider
 * Enterprise-grade provider for Indian equities, indices, F&O, and MCX commodities.
 * Reference:
 * - Historical API: https://smartapi.angelone.in/docs/Historical
 * - Live Market Data API: https://smartapi.angelone.in/docs/MarketData
 */

export type AngelExchange = 'NSE' | 'BSE' | 'NFO' | 'BFO' | 'MCX' | 'CDS';

export type AngelInterval =
  | 'ONE_MINUTE'
  | 'THREE_MINUTE'
  | 'FIVE_MINUTE'
  | 'TEN_MINUTE'
  | 'FIFTEEN_MINUTE'
  | 'THIRTY_MINUTE'
  | 'ONE_HOUR'
  | 'ONE_DAY';

export type AngelQuoteMode = 'LTP' | 'OHLC' | 'FULL';

export interface AngelCandlePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AngelHistoricalCandleRequest {
  exchange: AngelExchange;
  symboltoken: string;
  interval: AngelInterval;
  fromdate: string; // 'yyyy-MM-dd HH:mm'
  todate: string;   // 'yyyy-MM-dd HH:mm'
}

export interface AngelHistoricalOIRequest {
  exchange: 'NFO' | 'MCX';
  symboltoken: string;
  interval: AngelInterval;
  fromdate: string;
  todate: string;
}

export interface AngelOIPoint {
  time: string;
  oi: number;
}

export interface AngelMarketDepthLevel {
  price: number;
  quantity: number;
  orders: number;
}

export interface AngelMarketDepth {
  buy: AngelMarketDepthLevel[];
  sell: AngelMarketDepthLevel[];
}

export interface AngelLiveQuoteItem {
  exchange: AngelExchange;
  tradingSymbol: string;
  symbolToken: string;
  ltp: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  lastTradeQty?: number;
  exchFeedTime?: string;
  exchTradeTime?: string;
  netChange?: number;
  percentChange?: number;
  avgPrice?: number;
  tradeVolume?: number;
  opnInterest?: number;
  lowerCircuit?: number;
  upperCircuit?: number;
  totBuyQuan?: number;
  totSellQuan?: number;
  week52High?: number;
  week52Low?: number;
  depth?: AngelMarketDepth;
}

export interface AngelLiveMarketDataRequest {
  mode: AngelQuoteMode;
  exchangeTokens: Partial<Record<AngelExchange, string[]>>;
}

export interface AngelApiCredentials {
  apiKey: string;
  authToken?: string;
  clientCode?: string;
  clientLocalIp?: string;
  clientPublicIp?: string;
  macAddress?: string;
}

const HISTORICAL_API_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getCandleData';
const HISTORICAL_OI_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getOIData';
const LIVE_MARKET_DATA_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/';
export const SCRIP_MASTER_URL = 'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';

// Interval max days lookup per Angel One documentation
export const ANGEL_INTERVAL_MAX_DAYS: Record<AngelInterval, number> = {
  ONE_MINUTE: 30,
  THREE_MINUTE: 60,
  FIVE_MINUTE: 100,
  TEN_MINUTE: 100,
  FIFTEEN_MINUTE: 200,
  THIRTY_MINUTE: 200,
  ONE_HOUR: 400,
  ONE_DAY: 2000,
};

// Popular Angel One Index & Commodity Token mappings for immediate zero-config lookup
export const KNOWN_ANGEL_TOKENS: Record<string, { exchange: AngelExchange; token: string }> = {
  // Indices (NSE)
  NIFTY: { exchange: 'NSE', token: '99926000' },
  'NIFTY 50': { exchange: 'NSE', token: '99926000' },
  BANKNIFTY: { exchange: 'NSE', token: '99926009' },
  'BANK NIFTY': { exchange: 'NSE', token: '99926009' },
  FINNIFTY: { exchange: 'NSE', token: '99926037' },
  INDIAVIX: { exchange: 'NSE', token: '99926017' },
  'INDIA VIX': { exchange: 'NSE', token: '99926017' },
  // Indices (BSE)
  SENSEX: { exchange: 'BSE', token: '99919000' },
  // Key Liquid Equities (NSE)
  RELIANCE: { exchange: 'NSE', token: '2885' },
  TCS: { exchange: 'NSE', token: '11536' },
  HDFCBANK: { exchange: 'NSE', token: '1333' },
  INFY: { exchange: 'NSE', token: '1594' },
  ICICIBANK: { exchange: 'NSE', token: '4963' },
  SBIN: { exchange: 'NSE', token: '3045' },
  ITC: { exchange: 'NSE', token: '1660' },
  BHARTIARTL: { exchange: 'NSE', token: '10604' },
  LT: { exchange: 'NSE', token: '11483' },
  TATAMOTORS: { exchange: 'NSE', token: '3456' },
  ZOMATO: { exchange: 'NSE', token: '5097' },
  SWIGGY: { exchange: 'NSE', token: '25251' },
  // MCX Commodities
  CRUDEOIL: { exchange: 'MCX', token: '243328' },
  GOLD: { exchange: 'MCX', token: '243330' },
  SILVER: { exchange: 'MCX', token: '243332' },
  // CDS Currency
  USDINR: { exchange: 'CDS', token: '2001' },
};

/**
 * Format dates to Angel One SmartAPI requirement: 'yyyy-MM-dd HH:mm'
 */
export function formatAngelDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
}

/**
 * Map user timeframe (1D, 1W, 1M, 1Y, 5Y) to Angel One Interval and date boundaries
 */
export function mapTimeframeToAngelRequest(
  symbol: string,
  timeframe: '1D' | '1W' | '1M' | '1Y' | '5Y' | 'ALL',
  exchange: AngelExchange = 'NSE'
): { interval: AngelInterval; fromDate: string; toDate: string; symboltoken: string } | null {
  const cleanSymbol = symbol.replace(/^(NSE_|BSE_)/i, '').replace(/(\.NS|\.BO)$/i, '').trim().toUpperCase();
  const known = KNOWN_ANGEL_TOKENS[cleanSymbol];
  const token = known ? known.token : '';

  const now = new Date();
  const toDate = formatAngelDateTime(now);
  const from = new Date(now.getTime());

  let interval: AngelInterval = 'ONE_DAY';

  switch (timeframe) {
    case '1D':
      interval = 'FIVE_MINUTE';
      // From 9:00 AM today (or previous day if early morning)
      from.setHours(9, 15, 0, 0);
      if (now.getHours() < 9) {
        from.setDate(from.getDate() - 1);
      }
      break;
    case '1W':
      interval = 'FIFTEEN_MINUTE';
      from.setDate(from.getDate() - 7);
      break;
    case '1M':
      interval = 'ONE_HOUR';
      from.setDate(from.getDate() - 30);
      break;
    case '1Y':
      interval = 'ONE_DAY';
      from.setDate(from.getDate() - 365);
      break;
    case '5Y':
    case 'ALL':
      interval = 'ONE_DAY';
      from.setDate(from.getDate() - 1825);
      break;
  }

  const fromDate = formatAngelDateTime(from);

  return {
    interval,
    fromDate,
    toDate,
    symboltoken: token,
  };
}

/**
 * Check if Angel One API credentials are configured in environment
 */
export function isAngelSmartApiConfigured(): boolean {
  return Boolean(
    (process.env.ANGEL_API_KEY?.trim() || process.env.SMARTAPI_API_KEY?.trim()) &&
    (process.env.ANGEL_AUTH_TOKEN?.trim() || process.env.SMARTAPI_AUTH_TOKEN?.trim())
  );
}

/**
 * Get credentials from environment
 */
export function getAngelCredentials(): AngelApiCredentials | null {
  const apiKey = process.env.ANGEL_API_KEY?.trim() || process.env.SMARTAPI_API_KEY?.trim();
  const authToken = process.env.ANGEL_AUTH_TOKEN?.trim() || process.env.SMARTAPI_AUTH_TOKEN?.trim();

  if (!apiKey) return null;

  return {
    apiKey,
    authToken,
    clientCode: process.env.ANGEL_CLIENT_CODE?.trim() || process.env.SMARTAPI_CLIENT_CODE?.trim(),
    clientLocalIp: process.env.ANGEL_CLIENT_LOCAL_IP || '127.0.0.1',
    clientPublicIp: process.env.ANGEL_CLIENT_PUBLIC_IP || '127.0.0.1',
    macAddress: process.env.ANGEL_MAC_ADDRESS || '00:00:00:00:00:00',
  };
}

/**
 * Fetch Historical Candle Data from Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getCandleData
 * Output: parsed array of { timestamp, open, high, low, close, volume }
 */
export async function fetchAngelHistoricalCandles(
  request: AngelHistoricalCandleRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelCandlePoint[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey || !creds.authToken) {
    return [];
  }

  try {
    const response = await fetch(HISTORICAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-PrivateKey': creds.apiKey,
        Authorization: `Bearer ${creds.authToken}`,
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': creds.clientLocalIp || '127.0.0.1',
        'X-ClientPublicIP': creds.clientPublicIp || '127.0.0.1',
        'X-MACAddress': creds.macAddress || '00:00:00:00:00:00',
        'X-UserType': 'USER',
      },
      body: JSON.stringify({
        exchange: request.exchange,
        symboltoken: request.symboltoken,
        interval: request.interval,
        fromdate: request.fromdate,
        todate: request.todate,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.warn(`[AngelSmartAPI] Historical API failed with HTTP ${response.status}`);
      return [];
    }

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      errorcode?: string;
      data?: Array<[string, number, number, number, number, number]>;
    };

    if (!json.status || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    }));
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelHistoricalCandles error:`, error);
    return [];
  }
}

/**
 * Fetch Live Market Data (LTP, OHLC, or FULL mode) from Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/
 * Allows fetching up to 50 symbols across NSE, BSE, MCX, CDS in 1 request.
 */
export async function fetchAngelLiveMarketQuotes(
  request: AngelLiveMarketDataRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelLiveQuoteItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey || !creds.authToken) {
    return [];
  }

  try {
    const response = await fetch(LIVE_MARKET_DATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-PrivateKey': creds.apiKey,
        Authorization: `Bearer ${creds.authToken}`,
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': creds.clientLocalIp || '127.0.0.1',
        'X-ClientPublicIP': creds.clientPublicIp || '127.0.0.1',
        'X-MACAddress': creds.macAddress || '00:00:00:00:00:00',
        'X-UserType': 'USER',
      },
      body: JSON.stringify({
        mode: request.mode,
        exchangeTokens: request.exchangeTokens,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`[AngelSmartAPI] Live Market Data failed with HTTP ${response.status}`);
      return [];
    }

    const json = (await response.json()) as {
      status?: boolean;
      success?: boolean;
      message?: string;
      data?: {
        fetched?: Array<{
          exchange: AngelExchange;
          tradingSymbol: string;
          symbolToken: string;
          ltp: number;
          open?: number;
          high?: number;
          low?: number;
          close?: number;
          lastTradeQty?: number;
          exchFeedTime?: string;
          exchTradeTime?: string;
          netChange?: number;
          percentChange?: number;
          avgPrice?: number;
          tradeVolume?: number;
          opnInterest?: number;
          lowerCircuit?: number;
          upperCircuit?: number;
          totBuyQuan?: number;
          totSellQuan?: number;
          '52WeekHigh'?: number;
          '52WeekLow'?: number;
          depth?: AngelMarketDepth;
        }>;
      };
    };

    const isOk = json.status === true || json.success === true;
    if (!isOk || !json.data?.fetched || !Array.isArray(json.data.fetched)) {
      return [];
    }

    return json.data.fetched.map((item) => ({
      exchange: item.exchange,
      tradingSymbol: item.tradingSymbol,
      symbolToken: item.symbolToken,
      ltp: item.ltp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      lastTradeQty: item.lastTradeQty,
      exchFeedTime: item.exchFeedTime,
      exchTradeTime: item.exchTradeTime,
      netChange: item.netChange,
      percentChange: item.percentChange,
      avgPrice: item.avgPrice,
      tradeVolume: item.tradeVolume,
      opnInterest: item.opnInterest,
      lowerCircuit: item.lowerCircuit,
      upperCircuit: item.upperCircuit,
      totBuyQuan: item.totBuyQuan,
      totSellQuan: item.totSellQuan,
      week52High: item['52WeekHigh'],
      week52Low: item['52WeekLow'],
      depth: item.depth,
    }));
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelLiveMarketQuotes error:`, error);
    return [];
  }
}

/**
 * Fetch Historical Open Interest (OI) from Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getOIData
 */
export async function fetchAngelHistoricalOI(
  request: AngelHistoricalOIRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelOIPoint[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey || !creds.authToken) {
    return [];
  }

  try {
    const response = await fetch(HISTORICAL_OI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-PrivateKey': creds.apiKey,
        Authorization: `Bearer ${creds.authToken}`,
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': creds.clientLocalIp || '127.0.0.1',
        'X-ClientPublicIP': creds.clientPublicIp || '127.0.0.1',
        'X-MACAddress': creds.macAddress || '00:00:00:00:00:00',
        'X-UserType': 'USER',
      },
      body: JSON.stringify({
        exchange: request.exchange,
        symboltoken: request.symboltoken,
        interval: request.interval,
        fromdate: request.fromdate,
        todate: request.todate,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: Array<{ time: string; oi: number }>;
    };

    if (!json.status || !Array.isArray(json.data)) {
      return [];
    }

    return json.data;
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelHistoricalOI error:`, error);
    return [];
  }
}

/**
 * Convert AngelCandlePoint array to standard PriceAlerter chart format
 */
export function formatAngelCandlesForChart(candles: AngelCandlePoint[]) {
  return candles.map((c) => ({
    time: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    value: c.close,
  }));
}

/**
 * Convert AngelLiveQuoteItem to PriceAlerter standard quote representation
 */
export function convertAngelQuoteToStandard(item: AngelLiveQuoteItem) {
  const cleanSymbol = item.tradingSymbol.replace(/-EQ$/i, '').trim();
  return {
    symbol: cleanSymbol,
    exchange: item.exchange,
    currentPrice: item.ltp,
    dayChange: item.netChange ?? 0,
    dayChangePercent: item.percentChange ?? 0,
    open: item.open ?? item.ltp,
    high: item.high ?? item.ltp,
    low: item.low ?? item.ltp,
    close: item.close ?? item.ltp,
    volume: item.tradeVolume ?? 0,
    vwap: item.avgPrice,
    upperCircuit: item.upperCircuit,
    lowerCircuit: item.lowerCircuit,
    week52High: item.week52High,
    week52Low: item.week52Low,
    lastTradeTime: item.exchFeedTime || item.exchTradeTime || new Date().toISOString(),
    depth: item.depth,
  };
}
