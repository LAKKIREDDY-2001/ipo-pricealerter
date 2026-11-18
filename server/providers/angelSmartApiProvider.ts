/**
 * Angel One SmartAPI Suite Provider
 * Enterprise-grade provider for Indian equities, indices, F&O, and MCX commodities.
 * Reference:
 * - Historical API: https://smartapi.angelone.in/docs/Historical
 * - Live Market Data API: https://smartapi.angelone.in/docs/MarketData
 * - Top Gainers / Losers, PCR & OI Buildup: https://smartapi.angelone.in/docs/TopGainers
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

export type AngelGainersLosersType =
  | 'PercPriceGainers'
  | 'PercPriceLosers'
  | 'PercOIGainers'
  | 'PercOILosers';

export type AngelExpiryType = 'NEAR' | 'NEXT' | 'FAR';

export type AngelOIBuildupType =
  | 'Long Built Up'
  | 'Short Built Up'
  | 'Short Covering'
  | 'Long Unwinding';

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

export interface AngelGainerLoserItem {
  tradingSymbol: string;
  percentChange: number;
  symbolToken: number | string;
  opnInterest: number;
  netChangeOpnInterest: number;
}

export interface AngelPCRItem {
  pcr: number;
  tradingSymbol: string;
}

export interface AngelOIBuildupItem {
  symbolToken: string;
  ltp: number;
  netChange: number;
  percentChange: number;
  opnInterest: number;
  netChangeOpnInterest: number;
  tradingSymbol: string;
}

export interface AngelHoldingItem {
  tradingsymbol: string;
  exchange: AngelExchange;
  isin: string;
  t1quantity: number;
  realisedquantity: number;
  quantity: number;
  authorisedquantity: number;
  product: string;
  collateralquantity: number | null;
  collateraltype: string | null;
  haircut: number;
  averageprice: number;
  ltp: number;
  symboltoken: string;
  close: number;
  profitandloss: number;
  pnlpercentage: number;
}

export interface AngelAllHoldingsData {
  holdings: AngelHoldingItem[];
  totalholding: {
    totalholdingvalue: number;
    totalinvvalue: number;
    totalprofitandloss: number;
    totalpnlpercentage: number;
  };
}

export interface AngelPositionItem {
  exchange: AngelExchange;
  symboltoken: string;
  producttype: string;
  tradingsymbol: string;
  symbolname: string;
  buyqty: string;
  sellqty: string;
  buyamount: string;
  sellamount: string;
  netqty: string;
  netvalue: string;
  buyavgprice: string;
  sellavgprice: string;
  netprice: string;
  totalbuyvalue: string;
  totalsellvalue: string;
}

export interface AngelApiCredentials {
  apiKey: string;
  authToken?: string;
  clientCode?: string;
  pin?: string;
  totpKey?: string;
  clientLocalIp?: string;
  clientPublicIp?: string;
  macAddress?: string;
}

const LOGIN_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/loginByPassword';
const HISTORICAL_API_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getCandleData';
const HISTORICAL_OI_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getOIData';
const LIVE_MARKET_DATA_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/';
const GAINERS_LOSERS_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/marketData/v1/gainersLosers';
const PCR_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/marketData/v1/putCallRatio';
const OI_BUILDUP_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/marketData/v1/OIBuildup';
const ALL_HOLDINGS_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding';
const POSITIONS_URL = 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getPosition';
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
 * Check if Angel One API credentials are configured in environment or custom env object (e.g. Cloudflare Pages)
 */
export function isAngelSmartApiConfigured(customEnv?: Record<string, string | undefined>): boolean {
  const env = customEnv || process.env;
  const apiKey =
    env.ANGELONE_API_KEY?.trim() ||
    env.ANGEL_API_KEY?.trim() ||
    env.SMARTAPI_API_KEY?.trim();

  return Boolean(apiKey);
}

/**
 * Get credentials from environment or Cloudflare Pages env
 */
export function getAngelCredentials(customEnv?: Record<string, string | undefined>): AngelApiCredentials | null {
  const env = customEnv || process.env;
  const apiKey =
    env.ANGELONE_API_KEY?.trim() ||
    env.ANGEL_API_KEY?.trim() ||
    env.SMARTAPI_API_KEY?.trim();

  const authToken =
    env.ANGELONE_AUTH_TOKEN?.trim() ||
    env.ANGEL_AUTH_TOKEN?.trim() ||
    env.SMARTAPI_AUTH_TOKEN?.trim();

  if (!apiKey) return null;

  const clientCode =
    env.ANGELONE_CLIENT_CODE?.trim() ||
    env.ANGEL_CLIENT_CODE?.trim() ||
    env.SMARTAPI_CLIENT_CODE?.trim() ||
    'AABF820686';

  const pin =
    env.ANGELONE_PIN?.trim() ||
    env.ANGEL_PIN?.trim() ||
    env.ANGELONE_PASSWORD?.trim() ||
    '2001';

  const totpKey =
    env.ANGELONE_TOTP_KEY?.trim() ||
    env.ANGELONE_TOTP?.trim() ||
    env.ANGEL_TOTP_KEY?.trim() ||
    env.ANGEL_TOTP_SECRET?.trim() ||
    env.TOTP_KEY?.trim() ||
    env.TOTP?.trim();

  return {
    apiKey,
    authToken,
    clientCode,
    pin,
    totpKey,
    clientLocalIp: env.ANGEL_CLIENT_LOCAL_IP || '127.0.0.1',
    clientPublicIp: env.ANGEL_CLIENT_PUBLIC_IP || '127.0.0.1',
    macAddress: env.ANGEL_MAC_ADDRESS || '00:00:00:00:00:00',
  };
}

/**
 * Decode base32 encoded TOTP secret key into binary bytes
 */
export function base32Decode(str: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = str.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

/**
 * Universal RFC 6238 TOTP generator (compatible with Node.js, Cloudflare Workers, and Web Crypto)
 * Generates the standard 6-digit one-time password from the user's base32 TOTP secret key.
 */
export async function generateTOTP(
  secret: string,
  timeSec: number = Math.floor(Date.now() / 1000)
): Promise<string> {
  const keyBytes = base32Decode(secret);
  const epoch = Math.floor(timeSec / 30);
  const timeBuf = new ArrayBuffer(8);
  const view = new DataView(timeBuf);
  view.setBigUint64(0, BigInt(epoch));

  const keyBuf = new ArrayBuffer(keyBytes.byteLength);
  new Uint8Array(keyBuf).set(keyBytes);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuf);
  const digest = new Uint8Array(signature);
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, '0');
}

/**
 * Perform login to Angel One SmartAPI using TOTP to obtain a live JWT token
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/loginByPassword
 */
export async function loginAngelByTotp(
  clientCode: string,
  pin: string,
  totpCode: string,
  apiKey: string
): Promise<{ jwtToken: string; feedToken?: string; refreshToken?: string } | null> {
  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': apiKey,
      },
      body: JSON.stringify({
        clientcode: clientCode,
        password: pin,
        totp: totpCode,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.warn(`[AngelSmartAPI] Login failed with HTTP ${response.status}`);
      return null;
    }

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        jwtToken?: string;
        refreshToken?: string;
        feedToken?: string;
      };
    };

    if (json.status && json.data?.jwtToken) {
      // Strip possible leading 'Bearer ' if returned
      const cleanJwt = json.data.jwtToken.replace(/^Bearer\s+/i, '');
      return {
        jwtToken: cleanJwt,
        feedToken: json.data.feedToken,
        refreshToken: json.data.refreshToken,
      };
    }
    return null;
  } catch (error) {
    console.warn(`[AngelSmartAPI] login error:`, error);
    return null;
  }
}

/**
 * Automatically compute 6-digit TOTP from base32 secret and log in to Angel One
 */
export async function loginAngelWithAutoTotp(
  clientCode: string,
  pin: string,
  totpSecret: string,
  apiKey: string
): Promise<{ jwtToken: string; feedToken?: string; refreshToken?: string } | null> {
  const totpCode = await generateTOTP(totpSecret);
  return loginAngelByTotp(clientCode, pin, totpCode, apiKey);
}

let cachedAngelJwt: { token: string; expiresAt: number } | null = null;

export async function resolveAngelAuthToken(creds: AngelApiCredentials): Promise<string | null> {
  if (creds.authToken) return creds.authToken;

  if (cachedAngelJwt && cachedAngelJwt.expiresAt > Date.now()) {
    return cachedAngelJwt.token;
  }

  if (creds.clientCode && creds.pin && creds.totpKey && creds.apiKey) {
    const loginRes = await loginAngelWithAutoTotp(creds.clientCode, creds.pin, creds.totpKey, creds.apiKey);
    if (loginRes?.jwtToken) {
      cachedAngelJwt = {
        token: loginRes.jwtToken,
        expiresAt: Date.now() + 10 * 60 * 60 * 1000,
      };
      return loginRes.jwtToken;
    }
  }

  return null;
}

export async function getAngelAuthHeaders(creds: AngelApiCredentials): Promise<Record<string, string> | null> {
  const token = await resolveAngelAuthToken(creds);
  if (!token) return null;

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-PrivateKey': creds.apiKey,
    Authorization: `Bearer ${token}`,
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': creds.clientLocalIp || '127.0.0.1',
    'X-ClientPublicIP': creds.clientPublicIp || '127.0.0.1',
    'X-MACAddress': creds.macAddress || '00:00:00:00:00:00',
    'X-UserType': 'USER',
  };
}

/**
 * Fetch Historical Candle Data from Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getCandleData
 */
export async function fetchAngelHistoricalCandles(
  request: AngelHistoricalCandleRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelCandlePoint[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(HISTORICAL_API_URL, {
      method: 'POST',
      headers,
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
 */
export async function fetchAngelLiveMarketQuotes(
  request: AngelLiveMarketDataRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelLiveQuoteItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(LIVE_MARKET_DATA_URL, {
      method: 'POST',
      headers,
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
 * Fetch Top Gainers / Losers in Derivatives (F&O) from Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/marketData/v1/gainersLosers
 */
export async function fetchAngelGainersLosers(
  datatype: AngelGainersLosersType = 'PercPriceGainers',
  expirytype: AngelExpiryType = 'NEAR',
  credsOverride?: AngelApiCredentials
): Promise<AngelGainerLoserItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(GAINERS_LOSERS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        datatype,
        expirytype,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: Array<{
        tradingSymbol: string;
        percentChange: number;
        symbolToken: number | string;
        opnInterest: number;
        netChangeOpnInterest: number;
      }>;
    };

    if (!json.status || !Array.isArray(json.data)) return [];
    return json.data;
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelGainersLosers error:`, error);
    return [];
  }
}

/**
 * Fetch Put-Call Ratio (PCR) from Angel One SmartAPI
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/marketData/v1/putCallRatio
 */
export async function fetchAngelPutCallRatio(
  credsOverride?: AngelApiCredentials
): Promise<AngelPCRItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(PCR_URL, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: Array<{
        pcr: number;
        tradingSymbol: string;
      }>;
    };

    if (!json.status || !Array.isArray(json.data)) return [];
    return json.data;
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelPutCallRatio error:`, error);
    return [];
  }
}

/**
 * Fetch Open Interest Buildup (Long Buildup, Short Buildup, Short Covering, Long Unwinding)
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/marketData/v1/OIBuildup
 */
export async function fetchAngelOIBuildup(
  datatype: AngelOIBuildupType = 'Long Built Up',
  expirytype: AngelExpiryType = 'NEAR',
  credsOverride?: AngelApiCredentials
): Promise<AngelOIBuildupItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(OI_BUILDUP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        datatype,
        expirytype,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: Array<{
        symbolToken: string;
        ltp: string | number;
        netChange: string | number;
        percentChange: string | number;
        opnInterest: string | number;
        netChangeOpnInterest: string | number;
        tradingSymbol: string;
      }>;
    };

    if (!json.status || !Array.isArray(json.data)) return [];

    return json.data.map((item) => ({
      symbolToken: String(item.symbolToken),
      ltp: Number(item.ltp) || 0,
      netChange: Number(item.netChange) || 0,
      percentChange: Number(item.percentChange) || 0,
      opnInterest: Number(item.opnInterest) || 0,
      netChangeOpnInterest: Number(item.netChangeOpnInterest) || 0,
      tradingSymbol: item.tradingSymbol,
    }));
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelOIBuildup error:`, error);
    return [];
  }
}

/**
 * Classify market sentiment from Put-Call Ratio (PCR)
 */
export function classifyPcrSentiment(pcr: number): {
  label: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  description: string;
} {
  if (pcr >= 1.3) {
    return {
      label: 'Extremely Bullish',
      bias: 'bullish',
      description: 'Heavy put writing by institutional desks indicates strong price support.',
    };
  }
  if (pcr >= 1.0) {
    return {
      label: 'Mildly Bullish',
      bias: 'bullish',
      description: 'More puts being written than calls; upward market momentum expected.',
    };
  }
  if (pcr >= 0.75) {
    return {
      label: 'Neutral / Rangebound',
      bias: 'neutral',
      description: 'Balanced call and put open interest; index likely to consolidate in range.',
    };
  }
  return {
    label: 'Bearish / Oversold',
    bias: 'bearish',
    description: 'Heavy call writing indicates strong overhead resistance, or potential oversold bounce.',
  };
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
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(HISTORICAL_OI_URL, {
      method: 'POST',
      headers,
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

/**
 * Fetch All Demat Holdings from Angel One SmartAPI
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding
 */
export async function fetchAngelHoldings(
  credsOverride?: AngelApiCredentials
): Promise<AngelAllHoldingsData | null> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return null;
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return null;
  }

  try {
    const response = await fetch(ALL_HOLDINGS_URL, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.warn(`[AngelSmartAPI] fetchAngelHoldings failed with HTTP ${response.status}`);
      return null;
    }

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: AngelAllHoldingsData;
    };

    if (json.status && json.data) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelHoldings error:`, error);
    return null;
  }
}

/**
 * Fetch Net and Day Trading Positions from Angel One SmartAPI
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getPosition
 */
export async function fetchAngelPositions(
  credsOverride?: AngelApiCredentials
): Promise<AngelPositionItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(POSITIONS_URL, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: AngelPositionItem[];
    };

    if (json.status && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelPositions error:`, error);
    return [];
  }
}

/**
 * Convert Angel One Holdings into PriceAlerter PortfolioHolding items
 */
export function convertAngelHoldingsToPortfolio(holdings: AngelHoldingItem[]) {
  return holdings.map((h, index) => {
    const cleanSymbol = h.tradingsymbol.replace(/-(EQ|BE|BZ)$/i, '').trim().toUpperCase();
    const dayChangePercent =
      h.close > 0 ? Number((((h.ltp - h.close) / h.close) * 100).toFixed(2)) : 0;

    return {
      id: `angel-${cleanSymbol}-${index}`,
      name: cleanSymbol,
      symbol: cleanSymbol,
      assetType: 'Equity' as const,
      quantity: Number(h.quantity) || 0,
      buyPrice: Number(h.averageprice) || 0,
      currentPrice: Number(h.ltp) || 0,
      dayChangePercent,
      sector: 'Diversified',
      mcapCategory: 'Large Cap' as const,
      isin: h.isin,
      pnl: Number(h.profitandloss) || 0,
      pnlPercent: Number(h.pnlpercentage) || 0,
    };
  });
}
