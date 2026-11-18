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

export interface AngelScripItem {
  exchange: AngelExchange;
  tradingsymbol: string;
  symboltoken: string;
}

export interface AngelLtpQuote {
  exchange: AngelExchange;
  tradingsymbol: string;
  symboltoken: string;
  open: number;
  high: number;
  low: number;
  close: number;
  ltp: number;
}

export interface AngelIntradayScrip {
  exchange: 'NSE' | 'BSE';
  SymbolName: string;
  Multiplier: string;
}

export interface AngelCautionaryScrip {
  token: string;
  symbol: string;
  message: string;
  category: 'ASM' | 'GSM' | 'TRADE_FOR_TRADE' | 'CAUTIONARY';
}

export interface AngelConvertPositionRequest {
  exchange: AngelExchange;
  symboltoken: string;
  oldproducttype: string;
  newproducttype: string;
  tradingsymbol: string;
  symbolname: string;
  instrumenttype?: string;
  priceden?: string;
  pricenum?: string;
  genden?: string;
  gennum?: string;
  precision?: string;
  multiplier?: string;
  boardlotsize?: string;
  buyqty: string;
  sellqty: string;
  buyamount: string;
  sellamount: string;
  transactiontype: 'BUY' | 'SELL';
  quantity: number;
  type: 'DAY' | 'NET';
}

export interface AngelEdisVerifyResponse {
  status: boolean;
  message: string;
  alreadyRegistered?: boolean;
  data?: {
    ReqId?: string;
    ReturnURL?: string;
    DPId?: string;
    BOID?: string;
    TransDtls?: string;
    version?: string;
  } | null;
}

export interface AngelEdisTranStatusResponse {
  status: boolean;
  message: string;
  authorized: boolean;
  reqId?: string;
  details?: any;
}

export interface AngelLoginRequest {
  clientcode: string;
  password: string;
  totp: string;
  state?: string;
}

export interface AngelLoginResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: {
    jwtToken?: string;
    refreshToken?: string;
    feedToken?: string;
    state?: string;
  } | null;
}

export interface AngelGenerateTokenRequest {
  refreshToken: string;
}

export interface AngelGenerateTokenResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: {
    jwtToken?: string;
    refreshToken?: string;
    feedToken?: string;
  } | null;
}

export interface AngelUserProfile {
  clientcode: string;
  name: string;
  email: string;
  mobileno: string;
  exchanges: string[];
  products: string[];
  lastlogintime: string;
  brokerid: string;
}

export interface AngelRMSFunds {
  net: string;
  availablecash: string;
  availableintradaypayin: string;
  availablelimitmargin: string;
  collateral: string;
  m2munrealized: string;
  m2mrealized: string;
  utiliseddebits: string;
  utilisedspan: string;
  utilisedoptionpremium: string;
  utilisedholdingsales: string;
  utilisedexposure: string;
  utilisedturnover: string;
  utilisedpayout: string;
}

export interface AngelLogoutResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: string;
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

export const ANGEL_SMARTAPI_ROOT_URL = 'https://apiconnect.angelone.in';

export const ANGEL_LOGIN_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/auth/angelbroking/user/v1/loginByPassword`;
export const ANGEL_GENERATE_TOKENS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/auth/angelbroking/jwt/v1/generateTokens`;
export const ANGEL_GET_PROFILE_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/user/v1/getProfile`;
export const ANGEL_GET_RMS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/user/v1/getRMS`;
export const ANGEL_LOGOUT_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/user/v1/logout`;

const LOGIN_URL = ANGEL_LOGIN_URL;
const HISTORICAL_API_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/historical/v1/getCandleData`;
const HISTORICAL_OI_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/historical/v1/getOIData`;
const LIVE_MARKET_DATA_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/market/v1/quote/`;
const GAINERS_LOSERS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/marketData/v1/gainersLosers`;
const PCR_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/marketData/v1/putCallRatio`;
const OI_BUILDUP_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/marketData/v1/OIBuildup`;
const ALL_HOLDINGS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/portfolio/v1/getAllHolding`;
const BASIC_HOLDINGS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/portfolio/v1/getHolding`;
const POSITIONS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/getPosition`;
const CONVERT_POSITION_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/convertPosition`;
const EDIS_VERIFY_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/edis/v1/verifyDis`;
const EDIS_GENERATE_TPIN_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/edis/v1/generateTPIN`;
const EDIS_TRAN_STATUS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/edis/v1/getTranStatus`;
export const CDSL_EDIS_FORM_ACTION = 'https://edis.cdslindia.com/eDIS/VerifyDIS/';
export const SCRIP_MASTER_URL = 'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';
const SEARCH_SCRIP_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/searchScrip`;
const LTP_DATA_URL = `${ANGEL_SMARTAPI_ROOT_URL}/order-service/rest/secure/angelbroking/order/v1/getLtpData`;
const NSE_INTRADAY_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/marketData/v1/nseIntraday`;
const BSE_INTRADAY_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/marketData/v1/bseIntraday`;
const CAUTIONARY_SCRIPS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/securities/v1/cautionaryScrips`;

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

export interface CachedAngelSession {
  jwtToken: string;
  refreshToken?: string;
  feedToken?: string;
  state?: string;
  expiresAt: number;
}

let cachedAngelSession: CachedAngelSession | null = null;
let cachedAngelJwt: { token: string; expiresAt: number } | null = null;

/**
 * Get current in-memory cached Angel session (if active and not expired)
 */
export function getCachedAngelSession(): CachedAngelSession | null {
  if (cachedAngelSession && cachedAngelSession.expiresAt > Date.now()) {
    return cachedAngelSession;
  }
  return null;
}

/**
 * Clear cached in-memory Angel One session tokens
 */
export function clearCachedAngelSession(): void {
  cachedAngelJwt = null;
  cachedAngelSession = null;
}

/**
 * Authenticate with Angel Login Credentials
 * Endpoint: POST https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword
 */
export async function loginAngelByPassword(
  clientCode: string,
  pin: string,
  totpCode: string,
  apiKey: string,
  state?: string
): Promise<AngelLoginResponse> {
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '127.0.0.1',
    'X-MACAddress': '00:00:00:00:00:00',
    'X-PrivateKey': apiKey,
  };

  const payload: Record<string, string> = {
    clientcode: clientCode.trim(),
    password: pin.trim(),
    totp: totpCode.trim(),
  };
  if (state) payload.state = state;

  try {
    let response = await fetch(ANGEL_LOGIN_URL, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok && (response.status === 404 || response.status === 400)) {
      // Fallback to legacy endpoint if auth path returns 404
      const fallbackUrl = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/user/v1/loginByPassword`;
      const fallbackResp = await fetch(fallbackUrl, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      }).catch(() => null);
      if (fallbackResp && fallbackResp.ok) {
        response = fallbackResp;
      }
    }

    const json = (await response.json()) as AngelLoginResponse;
    if (json.status && json.data?.jwtToken) {
      const cleanJwt = json.data.jwtToken.replace(/^Bearer\s+/i, '');
      json.data.jwtToken = cleanJwt;
      cachedAngelSession = {
        jwtToken: cleanJwt,
        refreshToken: json.data.refreshToken,
        feedToken: json.data.feedToken,
        state: json.data.state,
        expiresAt: Date.now() + 10 * 60 * 60 * 1000,
      };
      cachedAngelJwt = {
        token: cleanJwt,
        expiresAt: Date.now() + 10 * 60 * 60 * 1000,
      };
    }
    return json;
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Login failed with Angel One',
      errorcode: 'NETWORK_ERROR',
      data: null,
    };
  }
}

/**
 * Perform login to Angel One SmartAPI using TOTP to obtain a live JWT token
 * Endpoint: POST https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword
 */
export async function loginAngelByTotp(
  clientCode: string,
  pin: string,
  totpCode: string,
  apiKey: string,
  state?: string
): Promise<{ jwtToken: string; feedToken?: string; refreshToken?: string; state?: string } | null> {
  const res = await loginAngelByPassword(clientCode, pin, totpCode, apiKey, state);
  if (res.status && res.data?.jwtToken) {
    return {
      jwtToken: res.data.jwtToken,
      feedToken: res.data.feedToken,
      refreshToken: res.data.refreshToken,
      state: res.data.state,
    };
  }
  return null;
}

/**
 * Automatically compute 6-digit TOTP from base32 secret and log in to Angel One
 */
export async function loginAngelWithAutoTotp(
  clientCode: string,
  pin: string,
  totpSecret: string,
  apiKey: string,
  state?: string
): Promise<{ jwtToken: string; feedToken?: string; refreshToken?: string; state?: string } | null> {
  const totpCode = await generateTOTP(totpSecret);
  return loginAngelByTotp(clientCode, pin, totpCode, apiKey, state);
}

/**
 * Renew JWT token using refresh token on expiration
 * Endpoint: POST https://apiconnect.angelone.in/rest/auth/angelbroking/jwt/v1/generateTokens
 */
export async function generateAngelTokens(
  refreshToken: string,
  apiKey: string,
  authToken?: string
): Promise<AngelGenerateTokenResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '127.0.0.1',
    'X-MACAddress': '00:00:00:00:00:00',
    'X-PrivateKey': apiKey,
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken.replace(/^Bearer\s+/i, '')}`;
  }

  try {
    const response = await fetch(ANGEL_GENERATE_TOKENS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as AngelGenerateTokenResponse;
    if (json.status && json.data?.jwtToken) {
      const cleanJwt = json.data.jwtToken.replace(/^Bearer\s+/i, '');
      json.data.jwtToken = cleanJwt;
      cachedAngelSession = {
        jwtToken: cleanJwt,
        refreshToken: json.data.refreshToken || refreshToken,
        feedToken: json.data.feedToken,
        expiresAt: Date.now() + 10 * 60 * 60 * 1000,
      };
      cachedAngelJwt = {
        token: cleanJwt,
        expiresAt: Date.now() + 10 * 60 * 60 * 1000,
      };
    }
    return json;
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Generate token failed',
      errorcode: 'NETWORK_ERROR',
      data: null,
    };
  }
}

/**
 * Retrieve user profile from Angel One SmartAPI
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile
 */
export async function fetchAngelUserProfile(
  credsOverride?: AngelApiCredentials
): Promise<AngelUserProfile | null> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds?.apiKey) return null;

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) return null;

  try {
    const response = await fetch(ANGEL_GET_PROFILE_URL, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: any;
    };

    if (json.status && json.data) {
      const d = json.data;
      let exchanges: string[] = [];
      let products: string[] = [];

      try {
        exchanges = typeof d.exchanges === 'string' ? JSON.parse(d.exchanges) : Array.isArray(d.exchanges) ? d.exchanges : [];
      } catch {
        exchanges = ['NSE', 'BSE'];
      }

      try {
        products = typeof d.products === 'string' ? JSON.parse(d.products) : Array.isArray(d.products) ? d.products : [];
      } catch {
        products = ['DELIVERY', 'INTRADAY', 'MARGIN'];
      }

      return {
        clientcode: String(d.clientcode || creds.clientCode || ''),
        name: String(d.name || ''),
        email: String(d.email || ''),
        mobileno: String(d.mobileno || ''),
        exchanges,
        products,
        lastlogintime: String(d.lastlogintime || ''),
        brokerid: String(d.brokerid || 'B2C'),
      };
    }
    return null;
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelUserProfile error:`, error);
    return null;
  }
}

/**
 * Retrieve RMS funds, cash, and margin information from Angel One SmartAPI
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS
 */
export async function fetchAngelRMSFunds(
  credsOverride?: AngelApiCredentials
): Promise<AngelRMSFunds | null> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds?.apiKey) return null;

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) return null;

  try {
    const response = await fetch(ANGEL_GET_RMS_URL, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: any;
    };

    if (json.status && json.data) {
      const d = json.data;
      return {
        net: String(d.net ?? '0'),
        availablecash: String(d.availablecash ?? '0'),
        availableintradaypayin: String(d.availableintradaypayin ?? '0'),
        availablelimitmargin: String(d.availablelimitmargin ?? '0'),
        collateral: String(d.collateral ?? '0'),
        m2munrealized: String(d.m2munrealized ?? '0'),
        m2mrealized: String(d.m2mrealized ?? '0'),
        utiliseddebits: String(d.utiliseddebits ?? '0'),
        utilisedspan: String(d.utilisedspan ?? '0'),
        utilisedoptionpremium: String(d.utilisedoptionpremium ?? '0'),
        utilisedholdingsales: String(d.utilisedholdingsales ?? '0'),
        utilisedexposure: String(d.utilisedexposure ?? '0'),
        utilisedturnover: String(d.utilisedturnover ?? '0'),
        utilisedpayout: String(d.utilisedpayout ?? '0'),
      };
    }
    return null;
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelRMSFunds error:`, error);
    return null;
  }
}

/**
 * Invalidate session and destroy access token on Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/logout
 */
export async function logoutAngelSession(
  clientCode?: string,
  credsOverride?: AngelApiCredentials
): Promise<AngelLogoutResponse> {
  const creds = credsOverride || getAngelCredentials();
  const code = clientCode || creds?.clientCode || '';

  // Clear in-memory session cache immediately
  clearCachedAngelSession();

  if (!creds?.apiKey) {
    return { status: true, message: 'Session cleared locally', data: '' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: true, message: 'Session cleared locally', data: '' };
  }

  try {
    const response = await fetch(ANGEL_LOGOUT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ clientcode: code }),
      signal: AbortSignal.timeout(5000),
    });

    const json = (await response.json()) as AngelLogoutResponse;
    return {
      status: Boolean(json.status),
      message: json.message || 'SUCCESS',
      errorcode: json.errorcode || '',
      data: json.data || '',
    };
  } catch (error) {
    return {
      status: true,
      message: 'Logged out locally',
      data: '',
    };
  }
}

export async function resolveAngelAuthToken(creds: AngelApiCredentials): Promise<string | null> {
  if (creds.authToken) return creds.authToken;

  if (cachedAngelSession && cachedAngelSession.expiresAt > Date.now()) {
    return cachedAngelSession.jwtToken;
  }
  if (cachedAngelJwt && cachedAngelJwt.expiresAt > Date.now()) {
    return cachedAngelJwt.token;
  }

  // If we have a cached refresh token and API key, attempt renewal first
  if (cachedAngelSession?.refreshToken && creds.apiKey) {
    const renewed = await generateAngelTokens(
      cachedAngelSession.refreshToken,
      creds.apiKey,
      cachedAngelSession.jwtToken
    );
    if (renewed.status && renewed.data?.jwtToken) {
      return renewed.data.jwtToken;
    }
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
 * Fetch Basic Demat Holdings list from Angel One SmartAPI
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getHolding
 */
export async function fetchAngelBasicHoldings(
  credsOverride?: AngelApiCredentials
): Promise<AngelHoldingItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) return [];

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) return [];

  try {
    const response = await fetch(BASIC_HOLDINGS_URL, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: AngelHoldingItem[] | { holdings?: AngelHoldingItem[] };
    };

    if (json.status && json.data) {
      if (Array.isArray(json.data)) return json.data;
      if (Array.isArray((json.data as any).holdings)) return (json.data as any).holdings;
    }
    return [];
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelBasicHoldings error:`, error);
    return [];
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
 * Convert product type of an open position (e.g. DELIVERY to INTRADAY, or INTRADAY to DELIVERY)
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/convertPosition
 */
export async function convertAngelPosition(
  request: AngelConvertPositionRequest,
  credsOverride?: AngelApiCredentials
): Promise<{ success: boolean; message: string }> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { success: false, message: 'Angel One credentials not configured' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { success: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const response = await fetch(CONVERT_POSITION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        exchange: request.exchange,
        symboltoken: request.symboltoken,
        oldproducttype: request.oldproducttype,
        newproducttype: request.newproducttype,
        tradingsymbol: request.tradingsymbol,
        symbolname: request.symbolname,
        instrumenttype: request.instrumenttype ?? '',
        priceden: request.priceden ?? '1',
        pricenum: request.pricenum ?? '1',
        genden: request.genden ?? '1',
        gennum: request.gennum ?? '1',
        precision: request.precision ?? '2',
        multiplier: request.multiplier ?? '-1',
        boardlotsize: request.boardlotsize ?? '1',
        buyqty: request.buyqty,
        sellqty: request.sellqty,
        buyamount: request.buyamount,
        sellamount: request.sellamount,
        transactiontype: request.transactiontype,
        quantity: request.quantity,
        type: request.type,
      }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      errorcode?: string;
    };

    return {
      success: Boolean(json.status),
      message: json.message || (json.status ? 'Position converted successfully' : 'Position conversion failed'),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error during position conversion',
    };
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

/**
 * Classify exchange surveillance and cautionary messages into actionable risk tiers
 */
export function classifyCautionaryMessage(
  message: string
): 'ASM' | 'GSM' | 'TRADE_FOR_TRADE' | 'CAUTIONARY' {
  const upper = String(message || '').toUpperCase();
  if (upper.includes('ASM')) return 'ASM';
  if (upper.includes('GSM')) return 'GSM';
  if (upper.includes('TRADE FOR TRADE') || upper.includes('GROSS SETTLEMENT') || upper.includes('T2T')) {
    return 'TRADE_FOR_TRADE';
  }
  return 'CAUTIONARY';
}

const dynamicTokenCache = new Map<string, string>();

/**
 * Search scrip tokens dynamically using Angel One SmartAPI Search Scrip
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/searchScrip
 */
export async function searchAngelScrip(
  exchange: AngelExchange = 'NSE',
  searchscrip: string,
  credsOverride?: AngelApiCredentials
): Promise<AngelScripItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  const query = searchscrip.trim().toUpperCase();
  if (!query) return [];

  try {
    const response = await fetch(SEARCH_SCRIP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        exchange,
        searchscrip: query,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: any[];
    };

    if (json.status && Array.isArray(json.data)) {
      return json.data.map((item) => ({
        exchange: item.exchange || exchange,
        tradingsymbol: String(item.tradingsymbol || item['tradingsymb{ol'] || ''),
        symboltoken: String(item.symboltoken || ''),
      })).filter((item) => item.tradingsymbol && item.symboltoken);
    }
    return [];
  } catch (error) {
    console.warn(`[AngelSmartAPI] searchAngelScrip error for ${query}:`, error);
    return [];
  }
}

/**
 * Resolve Angel One symbol token with fallback cascade:
 * 1. Known dictionary lookup
 * 2. Memory cache lookup
 * 3. Dynamic searchScrip lookup from Angel One SmartAPI
 */
export async function resolveAngelSymbolToken(
  symbol: string,
  exchange: AngelExchange = 'NSE',
  credsOverride?: AngelApiCredentials
): Promise<string | null> {
  const cleanSymbol = symbol.replace(/^(NSE_|BSE_)/i, '').replace(/(\.NS|\.BO)$/i, '').replace(/-(EQ|BE|BZ)$/i, '').trim().toUpperCase();
  if (!cleanSymbol) return null;

  // 1. Known lookup
  if (KNOWN_ANGEL_TOKENS[cleanSymbol]) {
    return KNOWN_ANGEL_TOKENS[cleanSymbol].token;
  }

  // 2. Dynamic cache lookup
  const cacheKey = `${exchange}:${cleanSymbol}`;
  if (dynamicTokenCache.has(cacheKey)) {
    return dynamicTokenCache.get(cacheKey) || null;
  }

  // 3. Search Scrip query
  const results = await searchAngelScrip(exchange, cleanSymbol, credsOverride);
  if (!results.length) return null;

  // Prioritize -EQ equity scrip, otherwise exact match or first result
  const exactEq = results.find((r) => r.tradingsymbol === `${cleanSymbol}-EQ`);
  const exact = results.find((r) => r.tradingsymbol === cleanSymbol);
  const match = exactEq || exact || results[0];

  if (match?.symboltoken) {
    dynamicTokenCache.set(cacheKey, match.symboltoken);
    return match.symboltoken;
  }

  return null;
}

/**
 * Fetch Last Traded Price (LTP) quote for a single instrument
 * Endpoint: POST https://apiconnect.angelone.in/order-service/rest/secure/angelbroking/order/v1/getLtpData
 */
export async function fetchAngelLtpQuote(
  exchange: AngelExchange,
  tradingsymbol: string,
  symboltoken: string,
  credsOverride?: AngelApiCredentials
): Promise<AngelLtpQuote | null> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return null;
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return null;
  }

  try {
    const response = await fetch(LTP_DATA_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        exchange,
        tradingsymbol,
        symboltoken,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: any;
    };

    if (json.status && json.data) {
      const d = Array.isArray(json.data) ? json.data[0] : json.data;
      if (!d) return null;

      return {
        exchange: d.exchange || exchange,
        tradingsymbol: d.tradingsymbol || tradingsymbol,
        symboltoken: String(d.symboltoken || symboltoken),
        open: Number(d.open) || 0,
        high: Number(d.high) || 0,
        low: Number(d.low) || 0,
        close: Number(d.close) || 0,
        ltp: Number(d.ltp) || 0,
      };
    }
    return null;
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelLtpQuote error for ${tradingsymbol}:`, error);
    return null;
  }
}

/**
 * Fetch Scrips Allowed for Intraday trading with margin multipliers
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/marketData/v1/nseIntraday (or bseIntraday)
 */
export async function fetchAngelIntradayScrips(
  exchange: 'NSE' | 'BSE' = 'NSE',
  credsOverride?: AngelApiCredentials
): Promise<AngelIntradayScrip[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  const targetUrl = exchange === 'BSE' ? BSE_INTRADAY_URL : NSE_INTRADAY_URL;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: any[];
    };

    if (json.status && Array.isArray(json.data)) {
      return json.data.map((item) => ({
        exchange,
        SymbolName: String(item.SymbolName || item.symbolName || ''),
        Multiplier: String(item.Multiplier || item.multiplier || '1.0'),
      })).filter((item) => item.SymbolName);
    }
    return [];
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelIntradayScrips error:`, error);
    return [];
  }
}

/**
 * Fetch Scrips under cautionary messages (ASM / GSM / Gross settlement / Surveillance)
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/securities/v1/cautionaryScrips
 */
export async function fetchAngelCautionaryScrips(
  credsOverride?: AngelApiCredentials
): Promise<AngelCautionaryScrip[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    let response = await fetch(CAUTIONARY_SCRIPS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ scripconsent: 'yes' }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok && response.status === 405) {
      // Fallback to GET method if POST is rejected by server
      response = await fetch(CAUTIONARY_SCRIPS_URL, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(6000),
      });
    }

    if (!response.ok) return [];

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: any[];
    };

    if (json.status && Array.isArray(json.data)) {
      return json.data.map((item) => {
        const msg = String(item.message || '');
        return {
          token: String(item.token || ''),
          symbol: String(item.symbol || '').trim().toUpperCase(),
          message: msg,
          category: classifyCautionaryMessage(msg),
        };
      }).filter((item) => item.symbol && item.message);
    }
    return [];
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelCautionaryScrips error:`, error);
    return [];
  }
}

/**
 * Initiate CDSL eDIS verification to authorize equity holdings for selling
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/edis/v1/verifyDis
 */
export async function initiateAngelEdisVerification(
  isin: string,
  quantity: number | string = 1,
  credsOverride?: AngelApiCredentials
): Promise<AngelEdisVerifyResponse> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const response = await fetch(EDIS_VERIFY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        isin: isin.trim().toUpperCase(),
        quantity: String(quantity),
      }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      errorcode?: string;
      data?: any;
    };

    if (json.errorcode === 'AG1000' || String(json.message).toLowerCase().includes('already')) {
      return {
        status: true,
        alreadyRegistered: true,
        message: 'You have already been registered with CDSL for today.',
        data: json.data || null,
      };
    }

    return {
      status: Boolean(json.status),
      message: json.message || (json.status ? 'eDIS verification initiated' : 'eDIS verification failed'),
      alreadyRegistered: false,
      data: json.data || null,
    };
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error during eDIS verification',
    };
  }
}

/**
 * Generate TPIN for CDSL eDIS authorization
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/edis/v1/generateTPIN
 */
export async function generateAngelEdisTPIN(
  dpId: string,
  reqId: string,
  boid: string,
  pan: string,
  credsOverride?: AngelApiCredentials
): Promise<{ status: boolean; message: string }> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const response = await fetch(EDIS_GENERATE_TPIN_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dpId: dpId.trim(),
        ReqId: reqId.trim(),
        boid: boid.trim(),
        pan: pan.trim().toUpperCase(),
      }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      errorcode?: string;
    };

    return {
      status: Boolean(json.status),
      message: json.message || (json.status ? 'TPIN generated successfully' : 'TPIN generation failed'),
    };
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error during TPIN generation',
    };
  }
}

/**
 * Check eDIS transaction status to verify if security is authorized for sale
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/edis/v1/getTranStatus
 */
export async function checkAngelEdisTranStatus(
  reqId: string,
  credsOverride?: AngelApiCredentials
): Promise<AngelEdisTranStatusResponse> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured', authorized: false };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI', authorized: false };
  }

  try {
    const response = await fetch(EDIS_TRAN_STATUS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ReqId: reqId.trim() }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        TransResDtls?: {
          ReqId?: string;
          ResStatus?: string;
          RecordResDtls?: Array<{ TxnReqId?: string; Status?: string; Errorcode?: string }>;
        };
      };
    };

    const records = json.data?.TransResDtls?.RecordResDtls || [];
    const isAuthorized = records.some((r) => r.Status === '1');

    return {
      status: Boolean(json.status),
      message: json.message || 'SUCCESS',
      authorized: isAuthorized,
      reqId,
      details: json.data?.TransResDtls || null,
    };
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error checking eDIS status',
      authorized: false,
      reqId,
    };
  }
}
