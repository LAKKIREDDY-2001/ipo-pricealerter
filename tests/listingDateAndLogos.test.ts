import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDeterministicCandles,
  parseListingDateMs,
  ensureStockSeries,
} from '../src/utils/candleSynthesis.ts';
import {
  resolveStaticLogo,
  buildLogoCandidateList,
} from '../src/components/common/CompanyLogo.tsx';
import type { StockInstrument } from '../src/types/financial.ts';

test('Listing Date Clamping & Logo Resolution Suite', async (t) => {
  await t.test('parseListingDateMs parses natural, ISO, and exchange date formats', () => {
    const naturalMs = parseListingDateMs('18 November 2026');
    assert.ok(naturalMs !== null && naturalMs > 0);
    const d1 = new Date(naturalMs);
    assert.strictEqual(d1.getUTCFullYear(), 2026);
    assert.strictEqual(d1.getUTCMonth(), 10); // Nov = 10 (0-indexed)

    const isoMs = parseListingDateMs('2026-11-18');
    assert.ok(isoMs !== null && isoMs > 0);
    const d2 = new Date(isoMs);
    assert.strictEqual(d2.getUTCFullYear(), 2026);
    assert.strictEqual(d2.getUTCMonth(), 10);
    assert.strictEqual(d2.getUTCDate(), 18);

    const hyphenMs = parseListingDateMs('18-Nov-2026');
    assert.ok(hyphenMs !== null && hyphenMs > 0);

    const slashMs = parseListingDateMs('18/11/2026');
    assert.ok(slashMs !== null && slashMs > 0);

    assert.strictEqual(parseListingDateMs(null), null);
    assert.strictEqual(parseListingDateMs(''), null);
    assert.strictEqual(parseListingDateMs('Unavailable'), null);
    assert.strictEqual(parseListingDateMs('Active on Exchange'), null);
  });

  await t.test('Hero Motors charts clamp strictly to Nov 18, 2026 on "All", "5Y", and "1Y" ranges', () => {
    const ranges = ['max', 'all', '5y', '1y', '6mo', '3mo', '1mo'];
    for (const r of ranges) {
      const candles = generateDeterministicCandles({
        symbol: 'HEROMOTORS',
        currentPrice: 120.0,
        previousClose: 122.93,
        open: 122.0,
        dayHigh: 122.0,
        dayLow: 119.3,
        week52High: 144.0,
        week52Low: 88.5,
        volume: 4538461,
        range: r,
        listingDate: '18 November 2026',
      });

      assert.ok(candles.length >= 2, `Should generate at least 2 candles for range ${r}`);

      const firstCandleTime = new Date(candles[0].date).getTime();
      const listingMs = Date.parse('2026-11-18T00:00:00.000Z');

      // The earliest candle MUST NEVER be from 2020 or prior to listing
      assert.ok(
        firstCandleTime >= listingMs - 86_400_000,
        `Earliest candle for ${r} was ${candles[0].date}, which is before listing date!`
      );
      assert.strictEqual(
        new Date(candles[0].date).getUTCFullYear(),
        2026,
        `Candle year must be 2026, never 2020!`
      );
    }
  });

  await t.test('ensureStockSeries filters out pre-listing candles from prior years', () => {
    const mockStock: StockInstrument = {
      id: 'stk-heromotors',
      symbol: 'HEROMOTORS',
      bseCode: '544936',
      yahooSymbol: 'HEROMOTORS.NS',
      companyName: 'Hero Motors Limited',
      exchange: 'NSE/BSE',
      sector: 'Auto Components',
      industry: 'Powertrains',
      isin: 'INE012G01022',
      currentPrice: 120.0,
      previousClose: 122.93,
      open: 122.0,
      dayHigh: 122.0,
      dayLow: 119.3,
      week52High: 144.0,
      week52Low: 88.5,
      volume: 4538461,
      marketCapCr: 4850,
      sparkline: [120, 121],
      historicalSeries: [
        { date: '2020-03-24T00:00:00.000Z', open: 50, high: 52, low: 48, close: 51, volume: 1000 },
        { date: '2022-06-15T00:00:00.000Z', open: 80, high: 82, low: 78, close: 81, volume: 1000 },
        { date: '2026-11-18T09:15:00.000Z', open: 122, high: 123, low: 119, close: 120, volume: 5000 },
        { date: '2026-11-19T10:00:00.000Z', open: 120, high: 121, low: 119, close: 120, volume: 6000 },
      ],
      announcements: [],
      fundamentals: {
        pe: 23.87,
        pb: 3.4,
        roePct: 14.25,
        rocePct: 16.39,
        debtToEquity: 0.43,
        revenueGrowthPct: 13.7,
        profitGrowthPct: 18.7,
        dividendYieldPct: 1.01,
        reportingPeriod: 'TTM',
        source: 'Exchange',
      },
      registry: {
        nseSeries: 'EQ',
        nseListingDate: '18 November 2026',
        faceValue: 10,
        marketLot: 1,
        tickSize: 0.05,
        zerodhaNseToken: null,
        zerodhaBseToken: null,
        isFnoEnabled: false,
      },
      provenance: {
        source: 'NSE/BSE',
        retrievedAt: new Date().toISOString(),
        effectiveDate: '2026-11-19',
        verificationStatus: 'Verified',
        qualityStatus: 'LIVE',
        currency: 'INR',
      },
    };

    const sanitized = ensureStockSeries(mockStock, 'max');
    assert.ok(sanitized.historicalSeries.length >= 2);
    // Every single candle in the sanitized series must be on or after 2026-11-17
    for (const point of sanitized.historicalSeries) {
      assert.ok(
        new Date(point.date).getTime() >= Date.parse('2026-11-17T00:00:00.000Z'),
        `Pre-listing candle from ${point.date} was not filtered!`
      );
    }
  });

  await t.test('Hero Motors logo maps to /assets/movers/hero-motors.png', () => {
    const symLogo = resolveStaticLogo('HEROMOTORS', 'Hero Motors Limited');
    assert.strictEqual(symLogo, '/assets/movers/hero-motors.png');

    const bseLogo = resolveStaticLogo('544936', 'Hero Motors Limited');
    assert.strictEqual(bseLogo, '/assets/movers/hero-motors.png');

    const nameLogo = resolveStaticLogo(null, 'Hero Motors Limited');
    assert.strictEqual(nameLogo, '/assets/movers/hero-motors.png');

    const candidates = buildLogoCandidateList({
      companyName: 'Hero Motors Limited',
      symbol: 'HEROMOTORS',
      bseCode: '544936',
    });
    assert.strictEqual(candidates[0], '/assets/movers/hero-motors.png');
  });

  await t.test('US Stock logos map to high-resolution Parqet URLs, never broken Clearbit', () => {
    const usSymbols = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA'];
    for (const sym of usSymbols) {
      const logo = resolveStaticLogo(sym, null);
      assert.ok(logo !== null, `Logo for ${sym} should not be null`);
      assert.ok(
        logo.includes('assets.parqet.com'),
        `Expected assets.parqet.com for ${sym}, got ${logo}`
      );
      assert.ok(
        !logo.includes('clearbit.com'),
        `Logo for ${sym} must never use deprecated clearbit.com`
      );

      const candidates = buildLogoCandidateList({ companyName: sym, symbol: sym });
      assert.ok(
        candidates.some((c) => c.includes('assets.parqet.com')),
        `Candidate list for ${sym} should include Parqet`
      );
      assert.ok(
        !candidates.some((c) => c.includes('clearbit.com')),
        `Candidate list for ${sym} must never include clearbit.com`
      );
    }
  });
});
