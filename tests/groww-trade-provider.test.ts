import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatGrowwSymbol,
  isGrowwConfigured,
  type GrowwLiveQuote,
} from '../server/providers/growwTradeProvider.ts';

test('Groww Trade API Suite Provider', async (t) => {
  await t.test('formats trading symbols to Groww exchange symbol format cleanly', () => {
    assert.equal(formatGrowwSymbol('RELIANCE', 'NSE'), 'NSE_RELIANCE');
    assert.equal(formatGrowwSymbol('SENSEX', 'BSE'), 'BSE_SENSEX');
    assert.equal(formatGrowwSymbol('NSE_INFY'), 'NSE_INFY');
    assert.equal(formatGrowwSymbol('TCS.NS', 'NSE'), 'NSE_TCS');
    assert.equal(formatGrowwSymbol('500325.BO', 'BSE'), 'BSE_500325');
  });

  await t.test('detects configuration status reliably', () => {
    const original = process.env.GROWW_ACCESS_TOKEN;
    try {
      delete process.env.GROWW_ACCESS_TOKEN;
      delete process.env.GROWW_API_TOKEN;
      assert.equal(isGrowwConfigured(), false);

      process.env.GROWW_ACCESS_TOKEN = 'test_token_123';
      assert.equal(isGrowwConfigured(), true);
    } finally {
      if (original) process.env.GROWW_ACCESS_TOKEN = original;
      else delete process.env.GROWW_ACCESS_TOKEN;
    }
  });

  await t.test('validates GrowwLiveQuote shape adheres to real-time feed contracts', () => {
    const sampleQuote: GrowwLiveQuote = {
      tradingSymbol: 'RELIANCE',
      exchange: 'NSE',
      lastPrice: 1367.0,
      dayChange: 22.2,
      dayChangePercent: 1.65,
      open: 1350.0,
      high: 1372.5,
      low: 1348.0,
      close: 1344.8,
      volume: 15900000,
      lastTradeTime: new Date().toISOString(),
      upperCircuitLimit: 1479.2,
      lowerCircuitLimit: 1210.3,
    };

    assert.equal(sampleQuote.tradingSymbol, 'RELIANCE');
    assert.equal(sampleQuote.exchange, 'NSE');
    assert.equal(sampleQuote.lastPrice, 1367.0);
    assert.ok(sampleQuote.lastPrice > sampleQuote.low!);
    assert.ok(sampleQuote.lastPrice < sampleQuote.high!);
  });
});
