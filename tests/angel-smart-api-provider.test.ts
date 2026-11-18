import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAngelDateTime,
  mapTimeframeToAngelRequest,
  isAngelSmartApiConfigured,
  formatAngelCandlesForChart,
  KNOWN_ANGEL_TOKENS,
  ANGEL_INTERVAL_MAX_DAYS,
  type AngelCandlePoint,
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

  await t.test('detects Angel SmartAPI configuration reliably', () => {
    const originalKey = process.env.ANGEL_API_KEY;
    const originalToken = process.env.ANGEL_AUTH_TOKEN;
    try {
      delete process.env.ANGEL_API_KEY;
      delete process.env.SMARTAPI_API_KEY;
      delete process.env.ANGEL_AUTH_TOKEN;
      delete process.env.SMARTAPI_AUTH_TOKEN;
      assert.equal(isAngelSmartApiConfigured(), false);

      process.env.ANGEL_API_KEY = 'test_angel_key';
      process.env.ANGEL_AUTH_TOKEN = 'test_jwt_token';
      assert.equal(isAngelSmartApiConfigured(), true);
    } finally {
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
});
