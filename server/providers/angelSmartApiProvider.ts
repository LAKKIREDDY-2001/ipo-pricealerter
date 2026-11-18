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
    ReturnURL?: string | null;
    DPId?: string | null;
    BOID?: string | null;
    TransDtls?: string | null;
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

export type AngelGttExchange = 'NSE' | 'BSE';
export type AngelGttProductType = 'DELIVERY' | 'MARGIN';
export type AngelGttTransactionType = 'BUY' | 'SELL';
export type AngelGttStatusType =
  | 'NEW'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'SENTTOEXCHANGE'
  | 'FORALL'
  | 'REJECTED'
  | 'TRIGGERED';

export interface AngelGttCreateRuleRequest {
  tradingsymbol: string;
  symboltoken: string;
  exchange: AngelGttExchange;
  transactiontype: AngelGttTransactionType;
  producttype: AngelGttProductType;
  price: string | number;
  qty: string | number;
  triggerprice: string | number;
  disclosedqty: string | number;
}

export interface AngelGttCreateRuleResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: {
    id?: string | number;
  } | null;
}

export interface AngelGttModifyRuleRequest {
  id: string | number;
  symboltoken: string;
  exchange: AngelGttExchange;
  price: string | number;
  qty: string | number;
  triggerprice: string | number;
  disclosedqty: string | number;
}

export interface AngelGttCancelRuleRequest {
  id: string | number;
  symboltoken: string;
  exchange: AngelGttExchange;
}

export interface AngelGttRuleDetailsItem {
  id?: string | number;
  status: string;
  createddate?: string;
  updateddate?: string;
  expirydate?: string;
  clientid?: string;
  tradingsymbol: string;
  symboltoken: string;
  exchange: AngelGttExchange;
  transactiontype: AngelGttTransactionType;
  producttype: AngelGttProductType;
  price: string | number;
  qty: string | number;
  triggerprice: string | number;
  disclosedqty: string | number;
}

export interface AngelGttRuleDetailsResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: AngelGttRuleDetailsItem | null;
}

export interface AngelGttRuleListRequest {
  status?: string[];
  page?: number;
  count?: number;
}

export interface AngelGttRuleListResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: AngelGttRuleDetailsItem[] | AngelGttRuleDetailsItem | null;
}

export const ANGEL_GTT_ERROR_CODES: Record<string, string> = {
  AB9000: 'Internal Server Error',
  AB9001: 'Invalid Parameters',
  AB9002: 'Method Not Allowed',
  AB9003: 'Invalid Client ID',
  AB9004: 'Invalid Status Array Size',
  AB9005: 'Invalid Session ID',
  AB9006: 'Invalid Order Quantity',
  AB9007: 'Invalid Disclosed Quantity',
  AB9008: 'Invalid Price',
  AB9009: 'Invalid Trigger Price',
  AB9010: 'Invalid Exchange Segment',
  AB9011: 'Invalid Symbol Token',
  AB9012: 'Invalid Trading Symbol',
  AB9013: 'Invalid Rule ID',
  AB9014: 'Invalid Order Side',
  AB9015: 'Invalid Product Type',
  AB9016: 'Invalid Time Period',
  AB9017: 'Invalid Page Value',
  AB9018: 'Invalid Count Value',
};

export type AngelOrderVariety = 'NORMAL' | 'STOPLOSS' | 'ROBO' | 'AMO';
export type AngelOrderTransactionType = 'BUY' | 'SELL';
export type AngelOrderType = 'MARKET' | 'LIMIT' | 'STOPLOSS_LIMIT' | 'STOPLOSS_MARKET';
export type AngelOrderProductType = 'DELIVERY' | 'CARRYFORWARD' | 'MARGIN' | 'INTRADAY' | 'BO';
export type AngelOrderDuration = 'DAY' | 'IOC';
export type AngelOrderExchange = 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'BFO';

export interface AngelPlaceOrderRequest {
  variety: AngelOrderVariety;
  tradingsymbol: string;
  symboltoken: string;
  transactiontype: AngelOrderTransactionType;
  exchange: AngelOrderExchange;
  ordertype: AngelOrderType;
  producttype: AngelOrderProductType;
  duration: AngelOrderDuration;
  price: string | number;
  quantity: string | number;
  squareoff?: string | number;
  stoploss?: string | number;
  trailingStopLoss?: string | number;
  disclosedquantity?: string | number;
  triggerprice?: string | number;
  ordertag?: string;
  scripconsent?: 'yes' | 'no';
}

export interface AngelPlaceOrderResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: {
    script?: string;
    orderid?: string;
    uniqueorderid?: string;
  } | null;
}

export interface AngelModifyOrderRequest {
  variety: AngelOrderVariety;
  orderid: string;
  ordertype: AngelOrderType;
  producttype: AngelOrderProductType;
  duration: AngelOrderDuration;
  price: string | number;
  quantity: string | number;
  tradingsymbol?: string;
  symboltoken?: string;
  exchange?: AngelOrderExchange;
}

export interface AngelModifyOrderResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: {
    orderid?: string;
    uniqueorderid?: string;
  } | null;
}

export interface AngelCancelOrderRequest {
  variety: AngelOrderVariety;
  orderid: string;
}

export interface AngelCancelOrderResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: {
    orderid?: string;
    uniqueorderid?: string;
  } | null;
}

export interface AngelOrderItem {
  variety: AngelOrderVariety;
  ordertype: AngelOrderType;
  producttype: AngelOrderProductType;
  duration: AngelOrderDuration;
  price: string | number;
  triggerprice: string | number;
  quantity: string | number;
  disclosedquantity: string | number;
  squareoff?: string | number;
  stoploss?: string | number;
  trailingstoploss?: string | number;
  tradingsymbol: string;
  transactiontype: AngelOrderTransactionType;
  exchange: AngelOrderExchange;
  symboltoken?: string | null;
  instrumenttype?: string;
  strikeprice?: string | number;
  optiontype?: string;
  expirydate?: string;
  lotsize?: string | number;
  cancelsize?: string | number;
  averageprice?: string | number;
  filledshares?: string | number;
  unfilledshares?: string | number;
  orderid: string | number;
  text?: string;
  status: string;
  orderstatus: string;
  updatetime?: string;
  exchtime?: string;
  exchorderupdatetime?: string;
  fillid?: string;
  filltime?: string;
  parentorderid?: string;
  uniqueorderid?: string;
  exchangeorderid?: string;
  ordertag?: string;
}

export interface AngelOrderBookResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: AngelOrderItem[] | AngelOrderItem | null;
}

export interface AngelTradeItem {
  exchange: AngelOrderExchange;
  producttype: AngelOrderProductType;
  tradingsymbol: string;
  instrumenttype?: string;
  symbolgroup?: string;
  strikeprice?: string | number;
  optiontype?: string;
  expirydate?: string;
  marketlot?: string | number;
  precision?: string | number;
  multiplier?: string | number;
  tradevalue?: string | number;
  transactiontype: AngelOrderTransactionType;
  fillprice: string | number;
  fillsize: string | number;
  orderid: string | number;
  fillid: string;
  filltime: string;
}

export interface AngelTradeBookResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: AngelTradeItem[] | AngelTradeItem | null;
}

export interface AngelIndividualOrderResponse {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: AngelOrderItem | null;
};

export type AngelPostbackStatusCategory =
  | 'COMPLETE'
  | 'PARTIALLY_EXECUTED'
  | 'OPEN'
  | 'CANCELLED'
  | 'REJECTED';

export interface AngelPostbackPayload {
  variety: string;
  ordertype: string;
  producttype: string;
  duration: string;
  price: number | string;
  triggerprice?: number | string;
  quantity: number | string;
  disclosedquantity?: number | string;
  squareoff?: number | string;
  stoploss?: number | string;
  trailingstoploss?: number | string;
  tradingsymbol: string;
  transactiontype: 'BUY' | 'SELL' | string;
  exchange: AngelExchange | string;
  symboltoken: string;
  ordertag?: string;
  instrumenttype?: string;
  strikeprice?: number | string;
  optiontype?: string;
  expirydate?: string;
  lotsize?: number | string;
  cancelsize?: number | string;
  averageprice?: number | string;
  filledshares?: number | string;
  unfilledshares?: number | string;
  orderid: string;
  text?: string;
  status: string;
  orderstatus?: string;
  updatetime?: string;
  exchtime?: string;
  exchorderupdatetime?: string;
  fillid?: string;
  filltime?: string;
  parentorderid?: string;
  clientcode?: string;
}

export interface AngelPostbackRecord extends AngelPostbackPayload {
  receivedAt: string;
  statusCategory: AngelPostbackStatusCategory;
  numericPrice: number;
  numericAvgPrice: number;
  numericQuantity: number;
  numericFilledShares: number;
  numericUnfilledShares: number;
  fillPercent: number;
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

export const ANGEL_GTT_CREATE_RULE_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/gtt/v1/createRule`;
export const ANGEL_GTT_MODIFY_RULE_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/gtt/v1/modifyRule`;
export const ANGEL_GTT_CANCEL_RULE_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/gtt/v1/cancelRule`;
export const ANGEL_GTT_RULE_DETAILS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/gtt/v1/ruleDetails`;
export const ANGEL_GTT_RULE_LIST_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/gtt/v1/ruleList`;

export const ANGEL_ORDER_PLACE_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/placeOrder`;
export const ANGEL_ORDER_MODIFY_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/modifyOrder`;
export const ANGEL_ORDER_CANCEL_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/cancelOrder`;
export const ANGEL_ORDER_BOOK_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/getOrderBook`;
export const ANGEL_TRADE_BOOK_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/getTradeBook`;
export const ANGEL_ORDER_LTP_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/getLtpData`;
export const ANGEL_ORDER_DETAILS_URL = `${ANGEL_SMARTAPI_ROOT_URL}/rest/secure/angelbroking/order/v1/details`;
export const ANGEL_POSTBACK_PATH = '/api/orders/angel/postback';
export const ANGEL_POSTBACK_DEFAULT_URL = 'https://pricealerter.com/api/orders/angel/postback';

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

  // Try primary Angel One Order LTP URL first, fallback to order-service URL if needed
  const urlsToTry = [ANGEL_ORDER_LTP_URL, LTP_DATA_URL];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          exchange,
          tradingsymbol,
          symboltoken,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) continue;

      const json = (await response.json()) as {
        status: boolean;
        message: string;
        data?: any;
      };

      if (json.status && json.data) {
        const d = Array.isArray(json.data) ? json.data[0] : json.data;
        if (!d) continue;

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
    } catch {
      // try next url
    }
  }
  return null;
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
 * Generate official CDSL eDIS form HTML payload for browser auto-submission
 */
export function generateAngelEdisHtmlForm(params: {
  dpId: string;
  reqId: string;
  transDtls: string;
  version?: string;
}): string {
  const version = params.version || '1.1';
  return `<!DOCTYPE html> <html> <script>window.onload= function() {submit()};function submit(){ document.getElementById("submitbtn").click(); } </script> <body onload="submit()"> <form name="frmDIS" method="post" action="${CDSL_EDIS_FORM_ACTION}" style=" text-align: center; margin-top: 35px; "> <input type="hidden" name="DPId" value="${params.dpId}"> <input type="hidden" name="ReqId" value="${params.reqId}"> <input type="hidden" name="Version" value="${version}"> <input type="hidden" name="TransDtls" value="${params.transDtls}"> <input style="display: none;" id="submitbtn" type="submit" value="Submit"> <noscript><input type="submit" value="Click here to proceed if not redirected automatically"></noscript> </form> </body> </html>`;
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
    const resStatus = String(json.data?.TransResDtls?.ResStatus || '');
    const isAuthorized = records.some((r) => String(r.Status) === '1') || resStatus === '1';

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

/**
 * Create a Good-Till-Triggered (GTT) Rule with Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/createRule
 * Supported exchange: NSE, BSE. Supported product types: DELIVERY, MARGIN.
 */
export async function createAngelGttRule(
  request: AngelGttCreateRuleRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelGttCreateRuleResponse> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured' };
  }

  const exchange = request.exchange.toUpperCase() === 'BSE' ? 'BSE' : 'NSE';
  const producttype = request.producttype.toUpperCase() === 'MARGIN' ? 'MARGIN' : 'DELIVERY';
  const transactiontype = request.transactiontype.toUpperCase() === 'SELL' ? 'SELL' : 'BUY';

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const response = await fetch(ANGEL_GTT_CREATE_RULE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tradingsymbol: request.tradingsymbol.trim().toUpperCase(),
        symboltoken: String(request.symboltoken).trim(),
        exchange,
        transactiontype,
        producttype,
        price: String(request.price),
        qty: String(request.qty),
        triggerprice: String(request.triggerprice),
        disclosedqty: String(request.disclosedqty ?? request.qty),
      }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as AngelGttCreateRuleResponse;
    if (!json.status && json.errorcode && ANGEL_GTT_ERROR_CODES[json.errorcode]) {
      json.message = `${json.message || 'GTT Creation Error'}: ${ANGEL_GTT_ERROR_CODES[json.errorcode]}`;
    }
    return json;
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error creating GTT rule',
    };
  }
}

/**
 * Modify an existing GTT Rule on Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/modifyRule
 */
export async function modifyAngelGttRule(
  request: AngelGttModifyRuleRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelGttCreateRuleResponse> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const response = await fetch(ANGEL_GTT_MODIFY_RULE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: String(request.id).trim(),
        symboltoken: String(request.symboltoken).trim(),
        exchange: request.exchange.toUpperCase() === 'BSE' ? 'BSE' : 'NSE',
        price: String(request.price),
        qty: String(request.qty),
        triggerprice: String(request.triggerprice),
        disclosedqty: String(request.disclosedqty ?? request.qty),
      }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as AngelGttCreateRuleResponse;
    if (!json.status && json.errorcode && ANGEL_GTT_ERROR_CODES[json.errorcode]) {
      json.message = `${json.message || 'GTT Modification Error'}: ${ANGEL_GTT_ERROR_CODES[json.errorcode]}`;
    }
    return json;
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error modifying GTT rule',
    };
  }
}

/**
 * Cancel an existing GTT Rule on Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/cancelRule
 */
export async function cancelAngelGttRule(
  request: AngelGttCancelRuleRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelGttCreateRuleResponse> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const response = await fetch(ANGEL_GTT_CANCEL_RULE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: String(request.id).trim(),
        symboltoken: String(request.symboltoken).trim(),
        exchange: request.exchange.toUpperCase() === 'BSE' ? 'BSE' : 'NSE',
      }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as AngelGttCreateRuleResponse;
    if (!json.status && json.errorcode && ANGEL_GTT_ERROR_CODES[json.errorcode]) {
      json.message = `${json.message || 'GTT Cancellation Error'}: ${ANGEL_GTT_ERROR_CODES[json.errorcode]}`;
    }
    return json;
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error cancelling GTT rule',
    };
  }
}

/**
 * Retrieve details of a specific GTT Rule from Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/ruleDetails
 */
export async function fetchAngelGttRuleDetails(
  ruleId: string | number,
  credsOverride?: AngelApiCredentials
): Promise<AngelGttRuleDetailsResponse> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const response = await fetch(ANGEL_GTT_RULE_DETAILS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: String(ruleId).trim() }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as AngelGttRuleDetailsResponse;
    return json;
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error fetching GTT rule details',
    };
  }
}

/**
 * Fetch List of GTT Rules from Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/ruleList
 */
export async function fetchAngelGttRuleList(
  request?: AngelGttRuleListRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelGttRuleDetailsItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(ANGEL_GTT_RULE_LIST_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        status:
          request?.status && request.status.length > 0
            ? request.status
            : ['NEW', 'CANCELLED', 'ACTIVE', 'SENTTOEXCHANGE', 'FORALL'],
        page: request?.page || 1,
        count: request?.count || 50,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as AngelGttRuleListResponse;
    if (json.status && json.data) {
      if (Array.isArray(json.data)) {
        return json.data;
      } else if (typeof json.data === 'object' && 'tradingsymbol' in json.data) {
        return [json.data as AngelGttRuleDetailsItem];
      }
    }
    return [];
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelGttRuleList error:`, error);
    return [];
  }
}

/**
 * Place Order on Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder
 * For users utilizing static IP-based API key, Angel One validates source IP against the registered static IP.
 * To execute cash orders for scrips under surveillance, keep "scripconsent" as "yes".
 */
export async function placeAngelOrder(
  request: AngelPlaceOrderRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelPlaceOrderResponse> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const payload: Record<string, any> = {
      variety: request.variety || 'NORMAL',
      tradingsymbol: String(request.tradingsymbol).trim(),
      symboltoken: String(request.symboltoken).trim(),
      transactiontype: request.transactiontype,
      exchange: request.exchange || 'NSE',
      ordertype: request.ordertype || 'MARKET',
      producttype: request.producttype || 'DELIVERY',
      duration: request.duration || 'DAY',
      price: String(request.price ?? '0'),
      quantity: String(request.quantity ?? '1'),
      squareoff: String(request.squareoff ?? '0'),
      stoploss: String(request.stoploss ?? '0'),
    };

    if (request.triggerprice !== undefined) {
      payload.triggerprice = String(request.triggerprice);
    }
    if (request.disclosedquantity !== undefined) {
      payload.disclosedquantity = String(request.disclosedquantity);
    }
    if (request.trailingStopLoss !== undefined) {
      payload.trailingStopLoss = String(request.trailingStopLoss);
    }
    if (request.ordertag) {
      payload.ordertag = String(request.ordertag).slice(0, 20);
    }
    if (request.scripconsent) {
      payload.scripconsent = request.scripconsent;
    }

    const response = await fetch(ANGEL_ORDER_PLACE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as AngelPlaceOrderResponse;
    return json;
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error placing order on Angel One SmartAPI',
    };
  }
}

/**
 * Modify Order on Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/modifyOrder
 */
export async function modifyAngelOrder(
  request: AngelModifyOrderRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelModifyOrderResponse> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const payload: Record<string, any> = {
      variety: request.variety || 'NORMAL',
      orderid: String(request.orderid).trim(),
      ordertype: request.ordertype,
      producttype: request.producttype,
      duration: request.duration || 'DAY',
      price: String(request.price),
      quantity: String(request.quantity),
    };

    if (request.tradingsymbol) {
      payload.tradingsymbol = String(request.tradingsymbol).trim();
    }
    if (request.symboltoken) {
      payload.symboltoken = String(request.symboltoken).trim();
    }
    if (request.exchange) {
      payload.exchange = request.exchange;
    }

    const response = await fetch(ANGEL_ORDER_MODIFY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as AngelModifyOrderResponse;
    return json;
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error modifying order on Angel One SmartAPI',
    };
  }
}

/**
 * Cancel Order on Angel One SmartAPI
 * Endpoint: POST https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder
 */
export async function cancelAngelOrder(
  request: AngelCancelOrderRequest,
  credsOverride?: AngelApiCredentials
): Promise<AngelCancelOrderResponse> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return { status: false, message: 'Angel One credentials not configured' };
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return { status: false, message: 'Authentication failed with Angel One SmartAPI' };
  }

  try {
    const response = await fetch(ANGEL_ORDER_CANCEL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        variety: request.variety || 'NORMAL',
        orderid: String(request.orderid).trim(),
      }),
      signal: AbortSignal.timeout(6000),
    });

    const json = (await response.json()) as AngelCancelOrderResponse;
    return json;
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Network error cancelling order on Angel One SmartAPI',
    };
  }
}

/**
 * Get Order Book from Angel One SmartAPI
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook
 */
export async function fetchAngelOrderBook(
  credsOverride?: AngelApiCredentials
): Promise<AngelOrderItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(ANGEL_ORDER_BOOK_URL, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as AngelOrderBookResponse;
    if (json.status && json.data) {
      if (Array.isArray(json.data)) {
        return json.data;
      } else if (typeof json.data === 'object' && 'orderid' in json.data) {
        return [json.data as AngelOrderItem];
      }
    }
    return [];
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelOrderBook error:`, error);
    return [];
  }
}

/**
 * Get Trade Book from Angel One SmartAPI
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook
 */
export async function fetchAngelTradeBook(
  credsOverride?: AngelApiCredentials
): Promise<AngelTradeItem[]> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return [];
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(ANGEL_TRADE_BOOK_URL, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];

    const json = (await response.json()) as AngelTradeBookResponse;
    if (json.status && json.data) {
      if (Array.isArray(json.data)) {
        return json.data;
      } else if (typeof json.data === 'object' && 'orderid' in json.data) {
        return [json.data as AngelTradeItem];
      }
    }
    return [];
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelTradeBook error:`, error);
    return [];
  }
}

/**
 * Get Individual Order Status from Angel One SmartAPI using uniqueorderid
 * Endpoint: GET https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/{UniqueOrderID}
 */
export async function fetchAngelIndividualOrderStatus(
  uniqueOrderId: string,
  credsOverride?: AngelApiCredentials
): Promise<AngelOrderItem | null> {
  const creds = credsOverride || getAngelCredentials();
  if (!creds || !creds.apiKey) {
    return null;
  }

  const headers = await getAngelAuthHeaders(creds);
  if (!headers) {
    return null;
  }

  try {
    const url = `${ANGEL_ORDER_DETAILS_URL}/${encodeURIComponent(uniqueOrderId.trim())}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as AngelIndividualOrderResponse;
    if (json.status && json.data) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.warn(`[AngelSmartAPI] fetchAngelIndividualOrderStatus error:`, error);
    return null;
  }
}

/**
 * ============================================================================
 * Angel One SmartAPI Postback / Webhook API Suite
 * Reference: https://smartapi.angelone.in/docs/Postback#
 *
 * Receives real-time order updates via HTTPS POST (Port 443).
 * Supports live market execution feeds and 9:00 AM AMO (After Market Orders).
 * ============================================================================
 */

export function classifyPostbackStatus(
  statusOrPayload: string | Partial<AngelPostbackPayload>,
  filled?: number | string,
  unfilled?: number | string
): AngelPostbackStatusCategory {
  let rawStatus = '';
  let filledQty = 0;
  let unfilledQty = 0;
  let totalQty = 0;

  if (typeof statusOrPayload === 'string') {
    rawStatus = statusOrPayload.toLowerCase();
    filledQty = Number(filled) || 0;
    unfilledQty = Number(unfilled) || 0;
  } else if (statusOrPayload && typeof statusOrPayload === 'object') {
    rawStatus = (statusOrPayload.orderstatus || statusOrPayload.status || '').toLowerCase();
    filledQty = Number(statusOrPayload.filledshares) || 0;
    unfilledQty = Number(statusOrPayload.unfilledshares) || 0;
    totalQty = Number(statusOrPayload.quantity) || 0;
  }

  if (rawStatus.includes('reject') || rawStatus.includes('rms') || rawStatus.includes('shortfall')) {
    return 'REJECTED';
  }
  if (rawStatus.includes('cancel')) {
    return 'CANCELLED';
  }
  if (rawStatus.includes('partial') || (filledQty > 0 && unfilledQty > 0)) {
    return 'PARTIALLY_EXECUTED';
  }
  if (
    rawStatus.includes('complete') ||
    rawStatus.includes('traded') ||
    rawStatus.includes('executed') ||
    (totalQty > 0 && filledQty >= totalQty)
  ) {
    return 'COMPLETE';
  }
  if (filledQty > 0 && unfilledQty > 0) {
    return 'PARTIALLY_EXECUTED';
  }
  if (
    rawStatus.includes('open') ||
    rawStatus.includes('pending') ||
    rawStatus.includes('trigger') ||
    rawStatus.includes('amo') ||
    rawStatus.includes('received')
  ) {
    if (filledQty > 0) {
      return 'PARTIALLY_EXECUTED';
    }
    return 'OPEN';
  }

  return 'OPEN';
}

const MAX_ANGEL_POSTBACKS = 200;
let angelPostbackStore: AngelPostbackRecord[] = [];

/**
 * Record an incoming Angel One SmartAPI postback webhook payload.
 * Normalizes numeric values, parses status category and timestamp, and retains latest 200 records.
 */
export function recordAngelPostback(payload: Partial<AngelPostbackPayload>): AngelPostbackRecord {
  const numericPrice = Number(payload.price) || 0;
  const numericAvgPrice = Number(payload.averageprice) || 0;
  const numericQuantity = Number(payload.quantity) || 0;
  const numericFilledShares = Number(payload.filledshares) || 0;
  const numericUnfilledShares =
    Number(payload.unfilledshares) || Math.max(0, numericQuantity - numericFilledShares);

  const statusCategory = classifyPostbackStatus(payload);
  const fillPercent =
    numericQuantity > 0
      ? Math.min(100, Math.round((numericFilledShares / numericQuantity) * 100))
      : statusCategory === 'COMPLETE'
      ? 100
      : 0;

  const nowIso = new Date().toISOString();

  const record: AngelPostbackRecord = {
    variety: payload.variety || 'NORMAL',
    ordertype: payload.ordertype || 'LIMIT',
    producttype: payload.producttype || 'DELIVERY',
    duration: payload.duration || 'DAY',
    price: payload.price ?? numericPrice,
    triggerprice: payload.triggerprice ?? 0,
    quantity: payload.quantity ?? numericQuantity,
    disclosedquantity: payload.disclosedquantity ?? 0,
    squareoff: payload.squareoff ?? 0,
    stoploss: payload.stoploss ?? 0,
    trailingstoploss: payload.trailingstoploss ?? 0,
    tradingsymbol: payload.tradingsymbol || 'UNKNOWN',
    transactiontype: (payload.transactiontype || 'BUY').toUpperCase(),
    exchange: (payload.exchange || 'NSE').toUpperCase(),
    symboltoken: String(payload.symboltoken || ''),
    ordertag: payload.ordertag || '',
    instrumenttype: payload.instrumenttype || '',
    strikeprice: payload.strikeprice ?? -1,
    optiontype: payload.optiontype || '',
    expirydate: payload.expirydate || '',
    lotsize: payload.lotsize ?? 1,
    cancelsize: payload.cancelsize ?? 0,
    averageprice: payload.averageprice ?? numericAvgPrice,
    filledshares: payload.filledshares ?? numericFilledShares,
    unfilledshares: payload.unfilledshares ?? numericUnfilledShares,
    orderid: String(payload.orderid || `SIM_${Date.now()}`),
    text: payload.text || (statusCategory === 'COMPLETE' ? 'Traded' : 'Order update received'),
    status: payload.status || (statusCategory === 'COMPLETE' ? 'complete' : 'open'),
    orderstatus: payload.orderstatus || payload.status || (statusCategory === 'COMPLETE' ? 'complete' : 'open'),
    updatetime: payload.updatetime || nowIso,
    exchtime: payload.exchtime || nowIso,
    exchorderupdatetime: payload.exchorderupdatetime || nowIso,
    fillid: payload.fillid || (numericFilledShares > 0 ? String(Math.floor(100000 + Math.random() * 900000)) : ''),
    filltime: payload.filltime || (numericFilledShares > 0 ? nowIso : ''),
    parentorderid: payload.parentorderid || '',
    clientcode: payload.clientcode || 'CLIENT01',
    receivedAt: nowIso,
    statusCategory,
    numericPrice,
    numericAvgPrice: numericAvgPrice > 0 ? numericAvgPrice : numericPrice,
    numericQuantity,
    numericFilledShares,
    numericUnfilledShares,
    fillPercent,
  };

  angelPostbackStore.unshift(record);
  if (angelPostbackStore.length > MAX_ANGEL_POSTBACKS) {
    angelPostbackStore = angelPostbackStore.slice(0, MAX_ANGEL_POSTBACKS);
  }

  return record;
}

/**
 * Retrieve recent Angel One SmartAPI postback events with optional filtering.
 */
export function getRecentAngelPostbacks(filter?: {
  clientcode?: string;
  orderid?: string;
  statusCategory?: AngelPostbackStatusCategory;
  limit?: number;
}): AngelPostbackRecord[] {
  let list = [...angelPostbackStore];
  if (filter?.clientcode) {
    const code = filter.clientcode.toLowerCase().trim();
    list = list.filter((r) => r.clientcode?.toLowerCase().includes(code));
  }
  if (filter?.orderid) {
    const oid = filter.orderid.toLowerCase().trim();
    list = list.filter((r) => r.orderid.toLowerCase().includes(oid));
  }
  if (filter?.statusCategory) {
    list = list.filter((r) => r.statusCategory === filter.statusCategory);
  }
  if (filter?.limit && filter.limit > 0) {
    list = list.slice(0, filter.limit);
  }
  return list;
}

/**
 * Clear all in-memory recorded postbacks.
 */
export function clearAngelPostbacks(): void {
  angelPostbackStore = [];
}

/**
 * Get count of in-memory recorded postbacks.
 */
export function getAngelPostbackCount(): number {
  return angelPostbackStore.length;
}

/**
 * Simulate an Angel One SmartAPI postback webhook event for local testing or UI verification.
 */
export function createSimulatedAngelPostback(options: {
  orderid?: string;
  tradingsymbol?: string;
  symboltoken?: string;
  exchange?: AngelExchange | string;
  transactiontype?: 'BUY' | 'SELL';
  producttype?: string;
  ordertype?: string;
  quantity?: number;
  price?: number;
  event?: 'COMPLETE' | 'PARTIAL' | 'OPEN' | 'CANCELLED' | 'REJECTED';
  clientcode?: string;
  rejectionReason?: string;
}): AngelPostbackRecord {
  const qty = options.quantity ?? 10;
  const price = options.price ?? 250.0;
  const event = options.event || 'COMPLETE';
  const orderid = options.orderid || `ORD${Date.now()}`;
  const nowStr = new Date().toISOString();

  let status = 'complete';
  let orderstatus = 'complete';
  let filledshares = qty;
  let unfilledshares = 0;
  let avgPrice = price;
  let text = 'Traded';

  if (event === 'PARTIAL') {
    status = 'open';
    orderstatus = 'partially executed';
    filledshares = Math.max(1, Math.floor(qty / 2));
    unfilledshares = qty - filledshares;
    avgPrice = price;
    text = `Partially executed: ${filledshares} / ${qty} shares filled`;
  } else if (event === 'OPEN') {
    status = 'open';
    orderstatus = 'open';
    filledshares = 0;
    unfilledshares = qty;
    avgPrice = 0;
    text = 'Order received and put to exchange pending execution';
  } else if (event === 'CANCELLED') {
    status = 'cancelled';
    orderstatus = 'cancelled';
    filledshares = 0;
    unfilledshares = qty;
    avgPrice = 0;
    text = 'Order cancelled by user';
  } else if (event === 'REJECTED') {
    status = 'rejected';
    orderstatus = 'rejected';
    filledshares = 0;
    unfilledshares = qty;
    avgPrice = 0;
    text = options.rejectionReason || 'RMS:Rule: Check Margin failed. Insufficient funds in trading account';
  }

  return recordAngelPostback({
    variety: 'NORMAL',
    ordertype: options.ordertype || 'LIMIT',
    producttype: options.producttype || 'DELIVERY',
    duration: 'DAY',
    price,
    triggerprice: 0,
    quantity: qty,
    disclosedquantity: 0,
    squareoff: 0,
    stoploss: 0,
    trailingstoploss: 0,
    tradingsymbol: options.tradingsymbol || 'SBIN-EQ',
    transactiontype: options.transactiontype || 'BUY',
    exchange: (options.exchange || 'NSE') as AngelExchange,
    symboltoken: options.symboltoken || '3045',
    ordertag: 'simulated_postback',
    instrumenttype: '',
    strikeprice: -1,
    optiontype: '',
    expirydate: '',
    lotsize: 1,
    cancelsize: event === 'CANCELLED' ? qty : 0,
    averageprice: avgPrice,
    filledshares,
    unfilledshares,
    orderid,
    text,
    status,
    orderstatus,
    updatetime: nowStr,
    exchtime: nowStr,
    exchorderupdatetime: nowStr,
    fillid: filledshares > 0 ? `FILL${Date.now()}` : '',
    filltime: filledshares > 0 ? nowStr : '',
    parentorderid: '',
    clientcode: options.clientcode || 'DEMO_USER',
  });
}
