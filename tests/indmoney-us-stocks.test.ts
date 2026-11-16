import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGlobalStockInstruments,
  getIndmoneyUsExploreSnapshot,
  getLiveUsdInrRate,
  globalStockToStockInstrument,
  US_STOCKS_DATA,
} from '../server/providers/indmoneyUsStocksProvider.ts';

test('INDmoney US Stocks & Global Markets Provider', async (t) => {
  await t.test('reads valid live or fallback USD/INR reference rate', () => {
    const rate = getLiveUsdInrRate();
    assert.ok(rate > 70, `Rate ${rate} should be greater than 70 INR/USD`);
    assert.ok(rate < 150, `Rate ${rate} should be reasonable INR/USD`);
  });

  await t.test('builds rich GlobalStockInstrument records with exact INR conversion', () => {
    const testRate = 85.0;
    const instruments = buildGlobalStockInstruments(US_STOCKS_DATA, testRate);
    assert.ok(instruments.length >= 40, 'Should load comprehensive US stocks dataset');

    const nvda = instruments.find((s) => s.symbol === 'NVDA');
    assert.ok(nvda, 'NVIDIA should be present');
    assert.equal(nvda.exchange, 'NASDAQ');
    assert.equal(nvda.priceInInr, Number((nvda.priceUsd * testRate).toFixed(2)));
    assert.equal(nvda.provenance.currency, 'USD');
    assert.equal(nvda.fractionalAllowed, true);

    const spy = instruments.find((s) => s.symbol === 'SPY');
    assert.ok(spy, 'SPY ETF should be present');
    assert.equal(spy.isEtf, true);
    assert.equal(spy.exchange, 'AMEX');
  });

  await t.test('generates INDmoney explore snapshot with curated collections and tiers', () => {
    const snapshot = getIndmoneyUsExploreSnapshot();
    assert.equal(snapshot.sourceUrl, 'https://www.indmoney.com/investments/us-stocks/explore-all');
    assert.ok(snapshot.totalUniverse >= 40);
    assert.ok(snapshot.categories.length >= 8);

    // Verify key categories exist
    const catIds = snapshot.categories.map((c) => c.id);
    assert.ok(catIds.includes('tech-titans'));
    assert.ok(catIds.includes('ai-chips'));
    assert.ok(catIds.includes('enterprise-saas'));
    assert.ok(catIds.includes('top-us-etfs'));

    // Verify market cap tiers
    assert.ok(snapshot.marketCapTiers.megaCap.length > 0);
    assert.ok(snapshot.marketCapTiers.megaCap.every((s) => s.marketCapUsd >= 200_000_000_000));
    assert.ok(snapshot.marketCapTiers.largeCap.length > 0);

    // Verify highlights
    assert.ok(snapshot.highlights.topGainers.length > 0);
    assert.ok(snapshot.highlights.mostPopular.length > 0);
  });

  await t.test('converts GlobalStockInstrument to StockInstrument cleanly', () => {
    const testRate = 85.0;
    const instruments = buildGlobalStockInstruments(US_STOCKS_DATA, testRate);
    const apple = instruments.find((s) => s.symbol === 'AAPL')!;
    const converted = globalStockToStockInstrument(apple);

    assert.equal(converted.symbol, 'AAPL');
    assert.equal(converted.exchange, 'NASDAQ');
    assert.equal(converted.currentPrice, apple.priceUsd);
    assert.equal(converted.currency, 'USD');
    assert.equal(converted.priceInInr, apple.priceInInr);
    assert.equal(converted.isUsStock, true);
    assert.ok((converted.marketCapCr ?? 0) > 10_000_000); // AAPL market cap in Cr INR is tens of millions
    assert.equal(converted.fundamentals.pe, apple.peRatio);
  });
});
