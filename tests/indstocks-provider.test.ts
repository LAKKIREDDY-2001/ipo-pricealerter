import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapToIndstocksInterval,
  computeRangeTimestamps,
  formatCandleTimestamp,
  getIndstocksExploreFeed,
} from '../server/providers/indstocksProvider';
import type { StockInstrument } from '../src/types/financial';

test('INDstocks API Suite - Historical Data & Explore All Provider', async (t) => {
  await t.test('maps intervals to exact INDstocks API values', () => {
    assert.equal(mapToIndstocksInterval('1d'), '1day');
    assert.equal(mapToIndstocksInterval('1day'), '1day');
    assert.equal(mapToIndstocksInterval('15m'), '15minute');
    assert.equal(mapToIndstocksInterval('15minute'), '15minute');
    assert.equal(mapToIndstocksInterval('5m'), '5minute');
    assert.equal(mapToIndstocksInterval('1h'), '60minute');
    assert.equal(mapToIndstocksInterval('60m'), '60minute');
    assert.equal(mapToIndstocksInterval('1w'), '1week');
    assert.equal(mapToIndstocksInterval('1mo'), '1month');
  });

  await t.test('computes valid epoch millisecond range boundaries', () => {
    const { startTime, endTime } = computeRangeTimestamps('1mo');
    assert.ok(startTime > 0);
    assert.ok(endTime > startTime);
    const diffDays = Math.round((endTime - startTime) / (24 * 60 * 60 * 1000));
    assert.equal(diffDays, 30);
  });

  await t.test('formats candle open timestamps properly', () => {
    const ts = 1782877500;
    const daily = formatCandleTimestamp(ts, '1day');
    assert.match(daily, /^\d{4}-\d{2}-\d{2}$/);

    const intraday = formatCandleTimestamp(ts, '5minute');
    assert.match(intraday, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  await t.test('generates INDstocks explore-all categorized feed matching live URL', () => {
    const mockStocks: StockInstrument[] = [
      {
        id: 'stk-rel',
        symbol: 'RELIANCE',
        bseCode: '500325',
        yahooSymbol: 'RELIANCE.NS',
        companyName: 'Reliance Industries Limited',
        logoUrl: '/assets/movers/reliance.png',
        exchange: 'NSE/BSE',
        sector: 'Energy',
        industry: 'Oil',
        isin: 'INE002A01018',
        currentPrice: 1344.8,
        previousClose: 1339.7,
        open: 1339.7,
        dayHigh: 1347.3,
        dayLow: 1333.8,
        week52High: 1611.8,
        week52Low: 1152.2,
        volume: 7653528,
        marketCapCr: 1812818,
        lastTradeTime: '2026-11-16T10:28:45.000Z',
        sparkline: [1330, 1340, 1344.8],
        historicalSeries: [],
        announcements: [],
        fundamentals: {
          pe: 18.96,
          pb: 1.92,
          roePct: 8.69,
          rocePct: 10.4,
          debtToEquity: 0.43,
          revenueGrowthPct: 10.53,
          profitGrowthPct: 18.35,
          dividendYieldPct: 0.45,
          reportingPeriod: 'TTM',
          source: 'INDstocks Feed',
        },
        provenance: {
          source: 'INDstocks Live Market Feed',
          retrievedAt: '2026-11-16T15:00:00Z',
          effectiveDate: '2026-11-16',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'Equities',
        },
      },
      {
        id: 'stk-small',
        symbol: 'SMALLCO',
        bseCode: '544000',
        yahooSymbol: 'SMALLCO.NS',
        companyName: 'Small Enterprise Ltd',
        logoUrl: null,
        exchange: 'BSE',
        sector: 'Technology',
        industry: 'Software',
        isin: 'INE999A01019',
        currentPrice: 55.0,
        previousClose: 50.0,
        open: 51.0,
        dayHigh: 56.0,
        dayLow: 49.0,
        week52High: 57.0,
        week52Low: 30.0,
        volume: 120000,
        marketCapCr: 450,
        lastTradeTime: '2026-11-16T10:28:45.000Z',
        sparkline: [48, 52, 55],
        historicalSeries: [],
        announcements: [],
        fundamentals: {
          pe: 18.2,
          pb: 2.1,
          roePct: 11.5,
          rocePct: 13.2,
          debtToEquity: 0.12,
          revenueGrowthPct: 14.2,
          profitGrowthPct: 22.1,
          dividendYieldPct: 1.1,
          reportingPeriod: 'TTM',
          source: 'INDstocks Feed',
        },
        provenance: {
          source: 'INDstocks Live Market Feed',
          retrievedAt: '2026-11-16T15:00:00Z',
          effectiveDate: '2026-11-16',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'Equities',
        },
      },
    ];

    const feed = getIndstocksExploreFeed(mockStocks);
    assert.equal(feed.sourceUrl, 'https://www.indstocks.com/investments/stocks/explore-all');
    assert.equal(feed.totalUniverse, 2);
    assert.equal(feed.marketCapTiers.largeCap.length, 1);
    assert.equal(feed.marketCapTiers.largeCap[0].symbol, 'RELIANCE');
    assert.equal(feed.marketCapTiers.smallCap.length, 1);
    assert.equal(feed.marketCapTiers.smallCap[0].symbol, 'SMALLCO');
    assert.equal(feed.highlights.topGainers[0].symbol, 'SMALLCO'); // +10% gain
  });
});
