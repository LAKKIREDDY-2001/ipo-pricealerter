import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAngelDateTime,
  mapTimeframeToAngelRequest,
  isAngelSmartApiConfigured,
  formatAngelCandlesForChart,
  convertAngelQuoteToStandard,
  classifyPcrSentiment,
  KNOWN_ANGEL_TOKENS,
  ANGEL_INTERVAL_MAX_DAYS,
  type AngelCandlePoint,
  type AngelLiveQuoteItem,
  type AngelGainerLoserItem,
  type AngelOIBuildupItem,
} from '../server/providers/angelSmartApiProvider.ts';

test('Angel One SmartAPI Suite Provider', async (t) => {
  await t.test('formats dates strictly to yyyy-MM-dd HH:mm as required by SmartAPI', () => {
    const fixedDate = new Date(2023, 8, 6, 11, 15); // Sept 6, 2023, 11:15
    const formatted = formatAngelDateTime(fixedDate);
    assert.equal(formatted, '2023-09-06 11:15');
  });

  await t.test('maps known tokens for Indian indices, commodities and liquid stocks', () => {
    assert.equal(KNOWN_ANGEL_TOKENS['NIFTY'].token, '99926000');
    assert.equal(KNOWN_ANGEL_TOKENS['BANKNIFTY'].token, '99926009');
    assert.equal(KNOWN_ANGEL_TOKENS['SENSEX'].token, '99919000');
    assert.equal(KNOWN_ANGEL_TOKENS['RELIANCE'].token, '2885');
    assert.equal(KNOWN_ANGEL_TOKENS['GOLD'].exchange, 'MCX');
    assert.equal(KNOWN_ANGEL_TOKENS['CRUDEOIL'].exchange, 'MCX');
    assert.equal(KNOWN_ANGEL_TOKENS['USDINR'].exchange, 'CDS');
  });

  await t.test('maps timeframe ranges to valid intervals within Angel max limits', () => {
    const req1D = mapTimeframeToAngelRequest('RELIANCE', '1D');
    assert.ok(req1D);
    assert.equal(req1D.interval, 'FIVE_MINUTE');
    assert.equal(req1D.symboltoken, '2885');

    const req1Y = mapTimeframeToAngelRequest('NIFTY', '1Y');
    assert.ok(req1Y);
    assert.equal(req1Y.interval, 'ONE_DAY');
    assert.equal(req1Y.symboltoken, '99926000');

    // Confirm interval maximum days lookup matches Angel One documentation
    assert.equal(ANGEL_INTERVAL_MAX_DAYS['ONE_MINUTE'], 30);
    assert.equal(ANGEL_INTERVAL_MAX_DAYS['FIVE_MINUTE'], 100);
    assert.equal(ANGEL_INTERVAL_MAX_DAYS['ONE_HOUR'], 400);
    assert.equal(ANGEL_INTERVAL_MAX_DAYS['ONE_DAY'], 2000);
  });

  await t.test('detects Angel SmartAPI configuration reliably with ANGELONE_API_KEY', () => {
    const originalOne = process.env.ANGELONE_API_KEY;
    const originalKey = process.env.ANGEL_API_KEY;
    const originalToken = process.env.ANGEL_AUTH_TOKEN;
    try {
      delete process.env.ANGELONE_API_KEY;
      delete process.env.ANGEL_API_KEY;
      delete process.env.SMARTAPI_API_KEY;
      delete process.env.ANGEL_AUTH_TOKEN;
      delete process.env.SMARTAPI_AUTH_TOKEN;
      assert.equal(isAngelSmartApiConfigured(), false);

      // Cloudflare Pages secret format
      process.env.ANGELONE_API_KEY = 'test_cloudflare_encrypted_key';
      assert.equal(isAngelSmartApiConfigured(), true);

      // Custom Cloudflare env object
      assert.equal(isAngelSmartApiConfigured({ ANGELONE_API_KEY: 'cf_key_123' }), true);
      assert.equal(isAngelSmartApiConfigured({}), false);
    } finally {
      if (originalOne) process.env.ANGELONE_API_KEY = originalOne;
      else delete process.env.ANGELONE_API_KEY;
      if (originalKey) process.env.ANGEL_API_KEY = originalKey;
      else delete process.env.ANGEL_API_KEY;
      if (originalToken) process.env.ANGEL_AUTH_TOKEN = originalToken;
      else delete process.env.ANGEL_AUTH_TOKEN;
    }
  });

  await t.test('formats raw candle data into PriceAlerter chart series', () => {
    const rawCandles: AngelCandlePoint[] = [
      {
        timestamp: '2023-09-06T11:15:00+05:30',
        open: 19571.2,
        high: 19573.35,
        low: 19534.4,
        close: 19552.05,
        volume: 125000,
      },
    ];

    const chartPoints = formatAngelCandlesForChart(rawCandles);
    assert.equal(chartPoints.length, 1);
    assert.equal(chartPoints[0].time, '2023-09-06T11:15:00+05:30');
    assert.equal(chartPoints[0].open, 19571.2);
    assert.equal(chartPoints[0].high, 19573.35);
    assert.equal(chartPoints[0].low, 19534.4);
    assert.equal(chartPoints[0].close, 19552.05);
    assert.equal(chartPoints[0].value, 19552.05);
  });

  await t.test('converts full live market data quote into standard PriceAlerter format with depth and circuits', () => {
    const sampleFullQuote: AngelLiveQuoteItem = {
      exchange: 'NSE',
      tradingSymbol: 'SBIN-EQ',
      symbolToken: '3045',
      ltp: 568.2,
      open: 567.4,
      high: 569.35,
      low: 566.1,
      close: 567.4,
      lastTradeQty: 1,
      exchFeedTime: '21-Jun-2023 10:46:10',
      exchTradeTime: '21-Jun-2023 10:46:09',
      netChange: 0.8,
      percentChange: 0.14,
      avgPrice: 567.83,
      tradeVolume: 3556150,
      opnInterest: 0,
      lowerCircuit: 510.7,
      upperCircuit: 624.1,
      totBuyQuan: 839549,
      totSellQuan: 1284767,
      week52High: 629.55,
      week52Low: 430.7,
      depth: {
        buy: [
          { price: 568.2, quantity: 511, orders: 2 },
          { price: 568.15, quantity: 411, orders: 2 },
        ],
        sell: [{ price: 568.25, quantity: 3348, orders: 5 }],
      },
    };

    const standard = convertAngelQuoteToStandard(sampleFullQuote);
    assert.equal(standard.symbol, 'SBIN');
    assert.equal(standard.exchange, 'NSE');
    assert.equal(standard.currentPrice, 568.2);
    assert.equal(standard.dayChange, 0.8);
    assert.equal(standard.dayChangePercent, 0.14);
    assert.equal(standard.vwap, 567.83);
    assert.equal(standard.upperCircuit, 624.1);
    assert.equal(standard.lowerCircuit, 510.7);
    assert.equal(standard.week52High, 629.55);
    assert.equal(standard.week52Low, 430.7);
    assert.equal(standard.lastTradeTime, '21-Jun-2023 10:46:10');
    assert.ok(standard.depth);
    assert.equal(standard.depth.buy.length, 2);
    assert.equal(standard.depth.sell.length, 1);
  });

  await t.test('classifies Put-Call Ratio (PCR) market sentiment accurately', () => {
    assert.equal(classifyPcrSentiment(1.45).label, 'Extremely Bullish');
    assert.equal(classifyPcrSentiment(1.45).bias, 'bullish');

    assert.equal(classifyPcrSentiment(1.12).label, 'Mildly Bullish');
    assert.equal(classifyPcrSentiment(1.12).bias, 'bullish');

    assert.equal(classifyPcrSentiment(0.85).label, 'Neutral / Rangebound');
    assert.equal(classifyPcrSentiment(0.85).bias, 'neutral');

    assert.equal(classifyPcrSentiment(0.62).label, 'Bearish / Oversold');
    assert.equal(classifyPcrSentiment(0.62).bias, 'bearish');
  });

  await t.test('validates shapes of OI Gainers and OI Buildup contracts', () => {
    const sampleGainer: AngelGainerLoserItem = {
      tradingSymbol: 'HDFCBANK25JAN24FUT',
      percentChange: 20.02,
      symbolToken: 55394,
      opnInterest: 118861600,
      netChangeOpnInterest: 19825300,
    };
    assert.equal(sampleGainer.tradingSymbol, 'HDFCBANK25JAN24FUT');
    assert.ok(sampleGainer.percentChange > 0);

    const sampleBuildup: AngelOIBuildupItem = {
      symbolToken: '55424',
      ltp: 723.8,
      netChange: -28.25,
      percentChange: -3.76,
      opnInterest: 24982.5,
      netChangeOpnInterest: -76.25,
      tradingSymbol: 'JINDALSTEL25JAN24FUT',
    };
    assert.equal(sampleBuildup.tradingSymbol, 'JINDALSTEL25JAN24FUT');
    assert.equal(sampleBuildup.ltp, 723.8);
  });
});
