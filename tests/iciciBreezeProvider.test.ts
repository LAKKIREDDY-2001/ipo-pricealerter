import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBreezeTimestamp,
  computeBreezeChecksum,
  buildBreezeHeaders,
  decodeBreezeSessionToken,
  convertBreezeQuoteToStandard,
  parseBreezeLiveTick,
  parseBreezeLiveOhlcv,
  formatBreezeHistoricalCandles,
  convertBreezeHoldingsToPortfolio,
  parseBreezeIclickGain,
  parseBreezeOneClickFno,
  validateBreezeOrder,
  buildBreezeGttPayload,
  parseTurnoverStringToCr,
  BREEZE_RATE_LIMITS,
  BREEZE_CANDLE_INTERVALS,
  type BreezeQuoteItem,
  type BreezeTickData,
  type BreezeIclickGainItem,
  type BreezeOneClickFnoItem,
} from '../server/providers/iciciBreezeProvider.ts';

test('ICICI Direct Breeze API Suite Provider', async (t) => {
  await t.test('formats timestamp strictly in ISO8601 UTC with 0 milliseconds', () => {
    const fixedDate = new Date('2024-06-01T10:23:56.789Z');
    const formatted = formatBreezeTimestamp(fixedDate);
    assert.strictEqual(formatted, '2024-06-01T10:23:56.000Z');
  });

  await t.test('computes deterministic SHA256 checksum matching Breeze specification', () => {
    const timestamp = '2024-06-01T10:23:56.000Z';
    const body = JSON.stringify({ stock_code: 'ITC', exchange_code: 'NSE' });
    const secretKey = 'test_secret_key_123';

    const checksum = computeBreezeChecksum(timestamp, body, secretKey);
    assert.strictEqual(typeof checksum, 'string');
    assert.strictEqual(checksum.length, 64); // Valid SHA256 hex string
  });

  await t.test('builds valid authenticated request headers with X-Checksum and X-Timestamp', () => {
    const creds = {
      appKey: 'my_breeze_app_key',
      secretKey: 'my_secret_key',
      sessionToken: 'session_token_xyz',
    };
    const body = JSON.stringify({ interval: '1day' });
    const headers = buildBreezeHeaders(creds, body, '2024-06-01T10:23:56.000Z');

    assert.strictEqual(headers['Content-Type'], 'application/json');
    assert.strictEqual(headers['X-AppKey'], 'my_breeze_app_key');
    assert.strictEqual(headers['X-SessionToken'], 'session_token_xyz');
    assert.strictEqual(headers['X-Timestamp'], '2024-06-01T10:23:56.000Z');
    assert.ok(headers['X-Checksum'].startsWith('token '));
  });

  await t.test('decodes base64 session token into userId and clean session token', () => {
    // base64 for "AG570549:session_token_secure_456"
    const rawBase64 = Buffer.from('AG570549:session_token_secure_456').toString('base64');
    const decoded = decodeBreezeSessionToken(rawBase64);

    assert.strictEqual(decoded.userId, 'AG570549');
    assert.strictEqual(decoded.sessionToken, 'session_token_secure_456');
  });

  await t.test('converts ICICI Breeze Quote response to standard PriceAlerter quote format', () => {
    const sampleQuote: BreezeQuoteItem = {
      exchange_code: 'NSE',
      product_type: 'cash',
      stock_code: 'RELIANCE',
      ltp: 1250.5,
      previous_close: 1240.0,
      open: 1242.0,
      high: 1255.0,
      low: 1238.0,
      ltp_percent_change: 0.85,
      upper_circuit: 1364.0,
      lower_circuit: 1116.0,
      total_quantity_traded: 2500000,
      best_bid_price: 1250.4,
      best_bid_quantity: 1500,
      best_offer_price: 1250.6,
      best_offer_quantity: 1200,
      ltt: '2025-02-05T09:36:56.000Z',
    };

    const standard = convertBreezeQuoteToStandard(sampleQuote);
    assert.strictEqual(standard.symbol, 'RELIANCE');
    assert.strictEqual(standard.exchange, 'NSE');
    assert.strictEqual(standard.currentPrice, 1250.5);
    assert.strictEqual(standard.previousClose, 1240.0);
    assert.strictEqual(standard.dayChange, 10.5);
    assert.strictEqual(standard.dayChangePercent, 0.85);
    assert.strictEqual(standard.upperCircuit, 1364.0);
    assert.strictEqual(standard.lowerCircuit, 1116.0);
    assert.strictEqual(standard.depth.buy[0].price, 1250.4);
    assert.strictEqual(standard.depth.sell[0].price, 1250.6);
  });

  await t.test('parses live WebSocket tick packet with order book depth and turnover', () => {
    const sampleTick: BreezeTickData = {
      symbol: '4.1!12885',
      stock_name: 'RELIANCE',
      open: 1240,
      last: 1236.2,
      high: 1244.8,
      low: 1229.75,
      change: -0.18,
      bPrice: 1236.2,
      bQty: 63,
      sPrice: 1236.55,
      sQty: 18,
      ltq: 100,
      avgPrice: 1235.13,
      ttq: 2158026,
      totalBuyQt: 237149,
      totalSellQt: 370391,
      ttv: '266.54C',
      lowerCktLm: 1114.6,
      upperCktLm: 1362.2,
      ltt: 'Tue Mar 11 09:38:22 2025',
      close: 1238.4,
      exchange: 'NSE Equity',
    };

    const parsed = parseBreezeLiveTick(sampleTick);
    assert.strictEqual(parsed.symbol, 'RELIANCE');
    assert.strictEqual(parsed.currentPrice, 1236.2);
    assert.strictEqual(parsed.previousClose, 1238.4);
    assert.strictEqual(parsed.vwap, 1235.13);
    assert.strictEqual(parsed.upperCircuit, 1362.2);
    assert.strictEqual(parsed.lowerCircuit, 1114.6);
    assert.strictEqual(parsed.depth.totalBuyQuantity, 237149);
    assert.strictEqual(parsed.depth.totalSellQuantity, 370391);
    assert.strictEqual(parsed.turnoverCr, 266.54);
  });

  await t.test('parses turnover string "266.54C" accurately to numeric crore value', () => {
    assert.strictEqual(parseTurnoverStringToCr('266.54C'), 266.54);
    assert.strictEqual(parseTurnoverStringToCr('15.20 Cr'), 15.2);
    assert.strictEqual(parseTurnoverStringToCr(''), 0);
  });

  await t.test('parses live streaming Equity OHLCV candle (StreamLiveOHLCV)', () => {
    const rawEquityCsv = 'NSE,NIFTY,18687.95,18720.50,18690.00,18715.30,145000,2022-12-02 14:13:53,1SEC';
    const parsed = parseBreezeLiveOhlcv(rawEquityCsv);

    assert.ok(parsed);
    assert.strictEqual(parsed.exchange, 'NSE');
    assert.strictEqual(parsed.stockCode, 'NIFTY');
    assert.strictEqual(parsed.open, 18690.00);
    assert.strictEqual(parsed.high, 18720.50);
    assert.strictEqual(parsed.low, 18687.95);
    assert.strictEqual(parsed.close, 18715.30);
    assert.strictEqual(parsed.volume, 145000);
    assert.strictEqual(parsed.interval, '1SEC');
  });

  await t.test('parses live streaming Derivatives OHLCV candle with Open Interest', () => {
    const rawDerivativesCsv = 'NFO,NIFTY,08-Dec-2022,18700.0,CE,120.5,125.0,121.0,124.5,2500,7592550,2022-12-02 14:10:14,5MIN';
    const parsed = parseBreezeLiveOhlcv(rawDerivativesCsv);

    assert.ok(parsed);
    assert.strictEqual(parsed.exchange, 'NFO');
    assert.strictEqual(parsed.stockCode, 'NIFTY');
    assert.strictEqual(parsed.expiryDate, '08-Dec-2022');
    assert.strictEqual(parsed.strikePrice, 18700.0);
    assert.strictEqual(parsed.rightType, 'CE');
    assert.strictEqual(parsed.openInterest, 7592550);
    assert.strictEqual(parsed.interval, '5MIN');
  });

  await t.test('formats historical candles from Breeze API to PriceAlerter chart format', () => {
    const rawCandles = [
      {
        datetime: '2025-02-03 09:21:00',
        stock_code: 'RELIND',
        exchange_code: 'NSE',
        open: '1249.85',
        high: '1250.75',
        low: '1248.95',
        close: '1249.95',
        volume: '1951',
      },
      {
        datetime: '2025-02-03 09:22:00',
        stock_code: 'RELIND',
        exchange_code: 'NSE',
        open: '1249.75',
        high: '1250.50',
        low: '1247.95',
        close: '1249.00',
        volume: '1810',
      },
    ];

    const formatted = formatBreezeHistoricalCandles(rawCandles);
    assert.strictEqual(formatted.length, 2);
    assert.strictEqual(formatted[0].close, 1249.95);
    assert.strictEqual(formatted[0].volume, 1951);
    assert.ok(formatted[0].date.includes('2025-02-03'));
  });

  await t.test('converts ICICI Breeze Demat Holdings to portfolio format', () => {
    const holdings = [
      {
        stock_code: 'TCS',
        stock_ISIN: 'INE467B01029',
        quantity: '50',
        demat_avail_quantity: '50',
        blocked_quantity: '0',
        demat_allocated_quantity: '50',
      },
    ];

    const portfolio = convertBreezeHoldingsToPortfolio(holdings);
    assert.strictEqual(portfolio.length, 1);
    assert.strictEqual(portfolio[0].symbol, 'TCS');
    assert.strictEqual(portfolio[0].isin, 'INE467B01029');
    assert.strictEqual(portfolio[0].quantity, 50);
    assert.strictEqual(portfolio[0].availableQuantity, 50);
  });

  await t.test('parses ICICI iClick2Gain institutional equity research signal', () => {
    const sampleSignal: BreezeIclickGainItem = {
      stock_name: 'MAHINDRA & MAHINDRA LIMITED(MAHMAH)Margin-Buy',
      stock_code: 'MAHMAH',
      action_type: 'buy',
      stock_description: 'Margin',
      recommended_price_from: '3065',
      recommended_price_to: '3068',
      recommended_date: '2025-01-02 08:55:02',
      target_price: '3098',
      sltp_price: '3050',
      iclick_status: 'open',
      subscription_type: 'iclick_2_gain',
    };

    const parsed = parseBreezeIclickGain(sampleSignal);
    assert.strictEqual(parsed.symbol, 'MAHMAH');
    assert.strictEqual(parsed.action, 'BUY');
    assert.strictEqual(parsed.recommendedRange.from, 3065);
    assert.strictEqual(parsed.recommendedRange.to, 3068);
    assert.strictEqual(parsed.targetPrice, 3098);
    assert.strictEqual(parsed.stopLossPrice, 3050);
    assert.strictEqual(parsed.status, 'OPEN');
  });

  await t.test('parses ICICI One Click F&O institutional strategy signal', () => {
    const sampleFno: BreezeOneClickFnoItem = {
      strategy_date: '2025-02-07 14:29:29',
      portfolio_name: 'Index Long Call',
      exchange_code: 'NFO',
      product_type: 'options',
      underlying: 'NIFTY ',
      expiry_date: '2025-02-13 00:00:00',
      option_type: 'call',
      strike_price: '23450',
      action: 'buy',
      recommended_price_from: '175',
      recommended_price_to: '178',
      minimum_lot_quantity: '75',
      last_traded_price: '181.45',
      target_price: '240',
      expected_profit_per_lot: '4762.5',
      stop_loss_price: '144.9',
      expected_loss_per_lot: '2370',
      total_margin: '13350',
      status: 'active',
    };

    const parsed = parseBreezeOneClickFno(sampleFno);
    assert.strictEqual(parsed.underlying, 'NIFTY');
    assert.strictEqual(parsed.strikePrice, 23450);
    assert.strictEqual(parsed.optionType, 'CALL');
    assert.strictEqual(parsed.action, 'BUY');
    assert.strictEqual(parsed.lotSize, 75);
    assert.strictEqual(parsed.targetPrice, 240);
    assert.strictEqual(parsed.totalMarginRequired, 13350);
  });

  await t.test('enforces SEBI market order prohibition strictly', () => {
    const marketOrder = {
      stock_code: 'INFY',
      exchange_code: 'NSE' as const,
      product: 'cash' as const,
      action: 'buy' as const,
      order_type: 'market' as any,
      quantity: 10,
      price: 0,
    };

    const validation = validateBreezeOrder(marketOrder);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.error?.includes('SEBI circular'));

    const validLimitOrder = {
      stock_code: 'INFY',
      exchange_code: 'NSE' as const,
      product: 'cash' as const,
      action: 'buy' as const,
      order_type: 'limit' as const,
      quantity: 10,
      price: 1850.50,
    };
    const validResult = validateBreezeOrder(validLimitOrder);
    assert.strictEqual(validResult.valid, true);
  });

  await t.test('builds compliant GTT order payload with stoploss trigger', () => {
    const payload = buildBreezeGttPayload({
      stockCode: 'NIFTY',
      exchangeCode: 'NFO',
      action: 'buy',
      quantity: 75,
      triggerPrice: 23800,
      limitPrice: 23820,
      product: 'options',
      strikePrice: 24000,
      expiryDate: '27-Feb-2025',
      right: 'call',
    });

    assert.strictEqual(payload.stock_code, 'NIFTY');
    assert.strictEqual(payload.exchange_code, 'NFO');
    assert.strictEqual(payload.quantity, '75');
    assert.strictEqual(payload.trigger_price, '23800');
    assert.strictEqual(payload.limit_price, '23820');
    assert.strictEqual(payload.fresh_order_type, 'limit');
  });

  await t.test('verifies official Breeze rate limits and intervals', () => {
    assert.strictEqual(BREEZE_RATE_LIMITS.CALLS_PER_MINUTE, 100);
    assert.strictEqual(BREEZE_RATE_LIMITS.CALLS_PER_DAY, 5000);
    assert.strictEqual(BREEZE_RATE_LIMITS.ORDERS_PER_SECOND, 10);
    assert.strictEqual(BREEZE_RATE_LIMITS.MAX_STREAM_SUBSCRIPTIONS, 2000);
    assert.deepStrictEqual([...BREEZE_CANDLE_INTERVALS], ['1SEC', '1MIN', '5MIN', '30MIN']);
  });
});
