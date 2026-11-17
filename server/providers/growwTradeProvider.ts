/**
 * Groww Trade API Suite Provider
 * High-performance live market data, batch LTP, OHLC, and option chains for NSE & BSE instruments.
 * Reference: https://groww.in/trade-api/docs/curl/live-data
 */

export interface GrowwLiveQuote {
  tradingSymbol: string;
  exchange: 'NSE' | 'BSE';
  lastPrice: number;
  dayChange: number;
  dayChangePercent: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number;
  averagePrice?: number;
  marketCap?: number;
  week52High?: number;
  week52Low?: number;
  upperCircuitLimit?: number;
  lowerCircuitLimit?: number;
  lastTradeTime: string;
  depth?: {
    buy: Array<{ price: number; quantity: number }>;
    sell: Array<{ price: number; quantity: number }>;
  };
}

export interface GrowwBatchLtpResult {
  [exchangeSymbol: string]: number;
}

export interface GrowwOhlcPoint {
  open: number;
  high: number;
  low: number;
  close: number;
}

const BASE_URL = 'https://api.groww.in/v1';

export function getGrowwAccessToken(): string | null {
  return (
    process.env.GROWW_ACCESS_TOKEN?.trim() ||
    process.env.GROWW_API_TOKEN?.trim() ||
    null
  );
}

export function isGrowwConfigured(): boolean {
  return Boolean(getGrowwAccessToken());
}

/**
 * Format symbols to Groww format: NSE_RELIANCE, BSE_SENSEX, etc.
 */
export function formatGrowwSymbol(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): string {
  const clean = symbol.replace(/^(NSE_|BSE_)/i, '').replace(/(\.NS|\.BO)$/i, '').trim().toUpperCase();
  return `${exchange}_${clean}`;
}

/**
 * Fetch real-time LTP for up to 50 instruments at once
 * Endpoint: GET https://api.groww.in/v1/live-data/ltp?segment=CASH&exchange_symbols=...
 */
export async function fetchGrowwBatchLtp(
  symbols: Array<{ symbol: string; exchange?: 'NSE' | 'BSE' }>,
  tokenOverride?: string
): Promise<Record<string, number>> {
  const token = tokenOverride || getGrowwAccessToken();
  if (!token || symbols.length === 0) return {};

  const exchangeSymbols = symbols
    .slice(0, 50)
    .map((s) => formatGrowwSymbol(s.symbol, s.exchange || 'NSE'))
    .join(',');

  try {
    const url = new URL(`${BASE_URL}/live-data/ltp`);
    url.searchParams.set('segment', 'CASH');
    url.searchParams.set('exchange_symbols', exchangeSymbols);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-API-VERSION': '1.0',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      console.warn(`[Groww] Batch LTP failed (${res.status})`);
      return {};
    }

    const json = (await res.json()) as { status: string; payload?: Record<string, number> };
    if (json.status === 'SUCCESS' && json.payload) {
      return json.payload;
    }
  } catch (err: any) {
    console.error(`[Groww] Batch LTP error: ${err.message}`);
  }
  return {};
}

/**
 * Fetch full live quote snapshot for a single instrument
 * Endpoint: GET https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=...
 */
export async function fetchGrowwQuote(
  symbol: string,
  exchange: 'NSE' | 'BSE' = 'NSE',
  tokenOverride?: string
): Promise<GrowwLiveQuote | null> {
  const token = tokenOverride || getGrowwAccessToken();
  const cleanSymbol = symbol.replace(/^(NSE_|BSE_)/i, '').replace(/(\.NS|\.BO)$/i, '').trim().toUpperCase();
  if (!token || !cleanSymbol) return null;

  try {
    const url = new URL(`${BASE_URL}/live-data/quote`);
    url.searchParams.set('exchange', exchange);
    url.searchParams.set('segment', 'CASH');
    url.searchParams.set('trading_symbol', cleanSymbol);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-API-VERSION': '1.0',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { status: string; payload?: any };
    if (data.status !== 'SUCCESS' || !data.payload) return null;

    const p = data.payload;
    let ohlc: GrowwOhlcPoint | null = null;
    if (typeof p.ohlc === 'string') {
      try {
        // format is "{open: 149.50,high: 150.50,low: 148.50,close: 149.50}"
        const parsed = JSON.parse(
          p.ohlc.replace(/([{,]\s*)([a-zA-Z_]+)\s*:/g, '$1"$2":')
        );
        ohlc = {
          open: Number(parsed.open) || 0,
          high: Number(parsed.high) || 0,
          low: Number(parsed.low) || 0,
          close: Number(parsed.close) || 0,
        };
      } catch {}
    } else if (p.ohlc && typeof p.ohlc === 'object') {
      ohlc = {
        open: Number(p.ohlc.open) || 0,
        high: Number(p.ohlc.high) || 0,
        low: Number(p.ohlc.low) || 0,
        close: Number(p.ohlc.close) || 0,
      };
    }

    return {
      tradingSymbol: cleanSymbol,
      exchange,
      lastPrice: Number(p.last_price) || 0,
      dayChange: Number(p.day_change) || 0,
      dayChangePercent: Number(p.day_change_perc) || 0,
      open: ohlc?.open ?? null,
      high: ohlc?.high ?? null,
      low: ohlc?.low ?? null,
      close: ohlc?.close ?? null,
      volume: Number(p.volume) || 0,
      averagePrice: p.average_price ? Number(p.average_price) : undefined,
      marketCap: p.market_cap ? Number(p.market_cap) : undefined,
      week52High: p.week_52_high ? Number(p.week_52_high) : undefined,
      week52Low: p.week_52_low ? Number(p.week_52_low) : undefined,
      upperCircuitLimit: p.upper_circuit_limit ? Number(p.upper_circuit_limit) : undefined,
      lowerCircuitLimit: p.lower_circuit_limit ? Number(p.lower_circuit_limit) : undefined,
      lastTradeTime: p.last_trade_time
        ? new Date(p.last_trade_time).toISOString()
        : new Date().toISOString(),
      depth: p.depth,
    };
  } catch (err: any) {
    console.error(`[Groww] Quote error for ${cleanSymbol}: ${err.message}`);
    return null;
  }
}

/**
 * Fetch full Option Chain and Greeks for F&O instruments
 * Endpoint: GET https://api.groww.in/v1/option-chain/exchange/{exchange}/underlying/{underlying}?expiry_date={expiry_date}
 */
export async function fetchGrowwOptionChain(
  underlying: string,
  expiryDate: string,
  exchange: 'NSE' | 'BSE' = 'NSE',
  tokenOverride?: string
): Promise<any | null> {
  const token = tokenOverride || getGrowwAccessToken();
  const cleanUnderlying = underlying.trim().toUpperCase();
  if (!token || !cleanUnderlying || !expiryDate) return null;

  try {
    const url = `${BASE_URL}/option-chain/exchange/${exchange}/underlying/${encodeURIComponent(cleanUnderlying)}?expiry_date=${encodeURIComponent(expiryDate)}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-API-VERSION': '1.0',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { status: string; payload?: any };
    return json.status === 'SUCCESS' ? json.payload : null;
  } catch {
    return null;
  }
}
