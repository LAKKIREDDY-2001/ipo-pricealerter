import fs from 'fs';
import path from 'path';
import { syncAllIndianStocks } from '../server/providers/marketDataProvider';
import type { IPOOffering, StockInstrument } from '../src/types/financial';
import { enrichAllStocks } from './enrich-stock-details';
import { getDb, flushDbSync } from '../server/db/database';

async function main() {
  console.log('--- Step 1: Loading Database & Live Equities ---');
  const dbPath = path.resolve('server/data/db.json');
  const db = getDb();

  // Add Crystal Crop Protection while its IPO is open (18–20 Nov 2026).
  const crystalId = 'crystal-crop-protection';
  if (!(db.ipos as IPOOffering[]).some((ipo) => ipo.id === crystalId || ipo.slug === 'crystal-crop-protection-ipo')) {
    const provenance = {
      source: 'Moneycontrol IPO details; cross-checked with Economic Times and Upstox',
      retrievedAt: '2026-11-18T00:00:00.000Z',
      effectiveDate: '2026-11-18',
      verificationStatus: 'Verified' as const,
      qualityStatus: 'VERIFIED' as const,
      currency: 'INR' as const,
      unit: 'INR per share / INR crore as applicable',
      dataCategory: 'IPO offer terms',
    };
    (db.ipos as IPOOffering[]).push({
      id: crystalId,
      slug: 'crystal-crop-protection-ipo',
      companyName: 'Crystal Crop Protection Limited',
      shortName: 'Crystal Crop',
      logoMonogram: 'CCP',
      logoColor: '#287A52',
      sector: 'Agriculture',
      industry: 'Agrochemicals, crop protection and seeds',
      category: 'Mainboard',
      status: 'Open',
      exchanges: ['NSE', 'BSE'],
      website: 'https://www.crystalcropprotection.com/',
      registrar: 'MUFG Intime India Pvt. Ltd.',
      registrarUrl: 'https://in.mpms.mufg.com/',
      issueSizeCr: 455.72,
      freshIssueCr: 354.77,
      ofsCr: 100.71,
      priceBandLow: 259,
      priceBandHigh: 272,
      lotSize: 55,
      minBidQuantity: 55,
      minInvestment: 14960,
      faceValue: 10,
      dates: { openDate: '2026-11-18', closeDate: '2026-11-20', allotmentDate: '2026-11-23', refundDate: '2026-11-25', dematCreditDate: '2026-11-25', listingDate: '2026-11-26' },
      subscription: { qib: null, nii: null, retail: null, employee: null, shareholder: null, total: null, isFinal: false, dailyBreakdown: [], provenance: { ...provenance, qualityStatus: 'UNAVAILABLE', verificationStatus: 'Provisional', dataCategory: 'IPO subscription' } },
      gmp: { latestGmp: null, previousGmp: null, lastUpdated: null, availability: 'Unavailable', source: 'Not officially published; GMP is unofficial', history: [] },
      listing: { issuePrice: null, actualListingPrice: null, listingExchange: null, stockSymbol: null, currentMarketPrice: null, previousClose: null, listingDate: null, priceStatus: 'UNAVAILABLE', provenance: { ...provenance, qualityStatus: 'UNAVAILABLE', verificationStatus: 'Provisional', dataCategory: 'Post-listing quote' } },
      financials: { reportingBasis: 'Consolidated', years: [] },
      valuation: { peRatio: null, pbRatio: null, marketCapCr: null, eps: null, industryAvgPe: null, reportingPeriod: 'FY2026', calculationBasis: 'Not populated; verify against RHP', peers: [] },
      profile: {
        overview: 'Indian crop-solutions company operating in crop protection products and seeds.',
        productsAndServices: 'Herbicides, fungicides, insecticides, natural crop solutions and seeds.',
        businessModel: 'Develops, manufactures and distributes crop-protection products and seeds.',
        industryOverview: 'Agricultural inputs and crop-science products.',
        competitivePosition: 'Established crop-solutions portfolio and distribution network.',
        promoters: ['Aggarwal family'],
        growthOpportunities: [],
        strengths: ['Diversified crop-protection and seeds portfolio'],
        risks: ['Agricultural demand and weather dependence', 'Regulatory and working-capital risks'],
      },
      documents: { drhpUrl: null, rhpUrl: null, prospectusUrl: null, anchorUrl: null, allotmentUrl: null, exchangeNoticeUrl: null },
      provenance,
    });
    console.log('✓ Added Crystal Crop Protection IPO to db.ipos');
  }

  // Update BlackBuck, Onyx Biotec, and Mangal Compusolution in db.ipos
  for (const ipo of db.ipos as IPOOffering[]) {
    if (ipo.subscription?.dailyBreakdown) {
      ipo.subscription.dailyBreakdown = ipo.subscription.dailyBreakdown.map((d: any, idx: number) => ({
        ...d,
        day: d.day || `Day ${idx + 1}`,
      }));
    }

    if (ipo.id === 'ipo-zinka-logistics' || ipo.slug === 'zinka-logistics-ipo') {
      ipo.status = 'Listed';
      ipo.dates = {
        openDate: '2024-11-13',
        closeDate: '2024-11-18',
        allotmentDate: '2024-11-19',
        refundDate: '2024-11-20',
        dematCreditDate: '2024-11-21',
        listingDate: '2024-11-22',
      };
      ipo.listing = {
        issuePrice: 273,
        actualListingPrice: 280.9,
        listingExchange: 'NSE',
        stockSymbol: 'BLACKBUCK',
        currentMarketPrice: 280.9,
        previousClose: 280.9,
        listingDate: '2024-11-22',
        priceStatus: 'DELAYED',
        provenance: {
          source: 'NSE & BSE Official Listing Report',
          retrievedAt: '2024-11-22T15:30:00.000Z',
          effectiveDate: '2024-11-22',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'Mainboard Listing',
        },
      };
      console.log('✓ Updated BlackBuck (Zinka Logistics) to Listed (Nov 22, 2024 @ ₹280.90)');
    }

    if (ipo.id === 'ipo-onyx-biotec' || ipo.slug === 'onyx-biotec-ipo') {
      ipo.status = 'Listed';
      ipo.dates = {
        openDate: '2024-11-13',
        closeDate: '2024-11-18',
        allotmentDate: '2024-11-19',
        refundDate: '2024-11-20',
        dematCreditDate: '2024-11-21',
        listingDate: '2024-11-22',
      };
      ipo.listing = {
        issuePrice: 61,
        actualListingPrice: 54.05,
        listingExchange: 'NSE',
        stockSymbol: 'ONYX',
        currentMarketPrice: 54.05,
        previousClose: 54.05,
        listingDate: '2024-11-22',
        priceStatus: 'DELAYED',
        provenance: {
          source: 'NSE SME Official Listing Report',
          retrievedAt: '2024-11-22T15:30:00.000Z',
          effectiveDate: '2024-11-22',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'SME Listing',
        },
      };
      console.log('✓ Updated Onyx Biotec to Listed (Nov 22, 2024 @ ₹54.05)');
    }

    if (ipo.id === 'ipo-mangal-compusolution' || ipo.slug === 'mangal-compusolution-ipo') {
      ipo.status = 'Listed';
      ipo.dates = {
        openDate: '2024-11-12',
        closeDate: '2024-11-14',
        allotmentDate: '2024-11-18',
        refundDate: '2024-11-19',
        dematCreditDate: '2024-11-20',
        listingDate: '2024-11-21',
      };
      ipo.listing = {
        issuePrice: 45,
        actualListingPrice: 45.0,
        listingExchange: 'BSE',
        stockSymbol: 'MANGAL',
        currentMarketPrice: 45.0,
        previousClose: 45.0,
        listingDate: '2024-11-21',
        priceStatus: 'DELAYED',
        provenance: {
          source: 'BSE SME Official Listing Report',
          retrievedAt: '2024-11-21T15:30:00.000Z',
          effectiveDate: '2024-11-21',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'SME Listing',
        },
      };
      console.log('✓ Updated Mangal Compusolution to Listed (Nov 21, 2024 @ ₹45.00)');
    }

    // 2024 Late Listings: update from false "Upcoming" to "Listed" with official 2024 dates and prices
    if (ipo.id === 'ipo-ntpc-green-energy-ipo' || ipo.slug === 'ntpc-green-energy-ipo') {
      ipo.status = 'Listed';
      ipo.dates = {
        openDate: '2024-11-19',
        closeDate: '2024-11-22',
        allotmentDate: '2024-11-25',
        refundDate: '2024-11-25',
        dematCreditDate: '2024-11-26',
        listingDate: '2024-11-27',
      };
      ipo.listing = {
        issuePrice: 108,
        actualListingPrice: 111.6,
        listingExchange: 'NSE',
        stockSymbol: 'NTPCGREEN',
        currentMarketPrice: 82.38,
        previousClose: 82.99,
        listingDate: '2024-11-27',
        priceStatus: 'DELAYED',
        provenance: {
          source: 'NSE/BSE Official Listing Report',
          retrievedAt: '2024-11-27T15:30:00.000Z',
          effectiveDate: '2024-11-27',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'Mainboard Listing',
        },
      };
      if (ipo.subscription) ipo.subscription.isFinal = true;
      console.log('✓ Updated NTPC Green Energy to Listed (Nov 27, 2024 @ ₹111.60)');
    }

    if (ipo.id === 'ipo-lamosaic-india-ipo' || ipo.slug === 'lamosaic-india-ipo') {
      ipo.status = 'Listed';
      ipo.dates = {
        openDate: '2024-11-21',
        closeDate: '2024-11-26',
        allotmentDate: '2024-11-27',
        refundDate: '2024-11-28',
        dematCreditDate: '2024-11-28',
        listingDate: '2024-11-29',
      };
      ipo.listing = {
        issuePrice: 200,
        actualListingPrice: 175.0,
        listingExchange: 'NSE',
        stockSymbol: 'LAMOSAIC',
        currentMarketPrice: 49.85,
        previousClose: 49.7,
        listingDate: '2024-11-29',
        priceStatus: 'DELAYED',
        provenance: {
          source: 'NSE SME Official Listing Report',
          retrievedAt: '2024-11-29T15:30:00.000Z',
          effectiveDate: '2024-11-29',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'SME Listing',
        },
      };
      if (ipo.subscription) ipo.subscription.isFinal = true;
      console.log('✓ Updated Lamosaic India to Listed (Nov 29, 2024 @ ₹175.00)');
    }

    if (ipo.id === 'ipo-c2c-advanced-systems-ipo' || ipo.slug === 'c2c-advanced-systems-ipo') {
      ipo.status = 'Listed';
      ipo.dates = {
        openDate: '2024-11-22',
        closeDate: '2024-11-26',
        allotmentDate: '2024-11-27',
        refundDate: '2024-11-28',
        dematCreditDate: '2024-11-29',
        listingDate: '2024-12-03',
      };
      ipo.listing = {
        issuePrice: 226,
        actualListingPrice: 240.0,
        listingExchange: 'NSE',
        stockSymbol: 'C2C',
        currentMarketPrice: 131.95,
        previousClose: 130.6,
        listingDate: '2024-12-03',
        priceStatus: 'DELAYED',
        provenance: {
          source: 'NSE SME Official Listing Report',
          retrievedAt: '2024-12-03T15:30:00.000Z',
          effectiveDate: '2024-12-03',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'SME Listing',
        },
      };
      if (ipo.subscription) ipo.subscription.isFinal = true;
      console.log('✓ Updated C2C Advanced Systems to Listed (Dec 03, 2024 @ ₹240.00)');
    }

    if (ipo.id === 'ipo-enviro-infra-engineers-ipo' || ipo.slug === 'enviro-infra-engineers-ipo') {
      ipo.status = 'Listed';
      ipo.dates = {
        openDate: '2024-11-22',
        closeDate: '2024-11-26',
        allotmentDate: '2024-11-27',
        refundDate: '2024-11-28',
        dematCreditDate: '2024-11-28',
        listingDate: '2024-11-29',
      };
      ipo.listing = {
        issuePrice: 148,
        actualListingPrice: 218.0,
        listingExchange: 'NSE',
        stockSymbol: 'EIEL',
        currentMarketPrice: 165.99,
        previousClose: 168.23,
        listingDate: '2024-11-29',
        priceStatus: 'DELAYED',
        provenance: {
          source: 'NSE/BSE Official Listing Report',
          retrievedAt: '2024-11-29T15:30:00.000Z',
          effectiveDate: '2024-11-29',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'Mainboard Listing',
        },
      };
      if (ipo.subscription) ipo.subscription.isFinal = true;
      console.log('✓ Updated Enviro Infra Engineers to Listed (Nov 29, 2024 @ ₹218.00)');
    }

    if (ipo.id === 'ipo-rajesh-power-services-ipo' || ipo.slug === 'rajesh-power-services-ipo') {
      ipo.status = 'Listed';
      ipo.dates = {
        openDate: '2024-11-25',
        closeDate: '2024-11-27',
        allotmentDate: '2024-11-28',
        refundDate: '2024-11-29',
        dematCreditDate: '2024-11-29',
        listingDate: '2024-12-02',
      };
      ipo.listing = {
        issuePrice: 335,
        actualListingPrice: 635.0,
        listingExchange: 'BSE',
        stockSymbol: 'RAJESHPOWER',
        currentMarketPrice: 803.0,
        previousClose: 811.35,
        listingDate: '2024-12-02',
        priceStatus: 'DELAYED',
        provenance: {
          source: 'BSE SME Official Listing Report',
          retrievedAt: '2024-12-02T15:30:00.000Z',
          effectiveDate: '2024-12-02',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'SME Listing',
        },
      };
      if (ipo.subscription) ipo.subscription.isFinal = true;
      console.log('✓ Updated Rajesh Power Services to Listed (Dec 02, 2024 @ ₹635.00)');
    }

    if (ipo.id === 'ipo-rajputana-biodiesel-ipo' || ipo.slug === 'rajputana-biodiesel-ipo') {
      ipo.status = 'Listed';
      ipo.dates = {
        openDate: '2024-11-26',
        closeDate: '2024-11-28',
        allotmentDate: '2024-11-29',
        refundDate: '2024-11-29',
        dematCreditDate: '2024-12-02',
        listingDate: '2024-12-03',
      };
      ipo.listing = {
        issuePrice: 130,
        actualListingPrice: 247.0,
        listingExchange: 'NSE',
        stockSymbol: 'RAJPUTANA',
        currentMarketPrice: 27.0,
        previousClose: 26.61,
        listingDate: '2024-12-03',
        priceStatus: 'DELAYED',
        provenance: {
          source: 'NSE SME Official Listing Report',
          retrievedAt: '2024-12-03T15:30:00.000Z',
          effectiveDate: '2024-12-03',
          verificationStatus: 'Verified',
          qualityStatus: 'VERIFIED',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'SME Listing',
        },
      };
      if (ipo.subscription) ipo.subscription.isFinal = true;
      console.log('✓ Updated Rajputana Biodiesel to Listed (Dec 03, 2024 @ ₹247.00)');
    }

    // Crystal Crop Protection has confirmed dates (open Nov 18–20, 2026)
    if (ipo.id === 'crystal-crop-protection' || ipo.slug === 'crystal-crop-protection-ipo') {
      ipo.status = 'Open';
      ipo.priceBandLow = 259;
      ipo.priceBandHigh = 272;
      ipo.dates.openDate = '2026-11-18';
      ipo.dates.closeDate = '2026-11-20';
      ipo.dates.allotmentDate = '2026-11-23';
      ipo.dates.refundDate = '2026-11-25';
      ipo.dates.dematCreditDate = '2026-11-25';
      ipo.dates.listingDate = '2026-11-26';
    }

    // For all other upcoming IPOs: their exchange/SEBI dates are NOT confirmed yet.
    // Set dates to null so calendar and tables display "Dates To Be Announced" rather than unverified fake dates.
    if (ipo.status === 'Upcoming' && ipo.id !== 'crystal-crop-protection' && ipo.slug !== 'crystal-crop-protection-ipo') {
      ipo.dates = {
        openDate: null,
        closeDate: null,
        allotmentDate: null,
        refundDate: null,
        dematCreditDate: null,
        listingDate: null,
      };
    }
  }

  console.log('--- Step 2: Fetching All Indian Equities from Official Exchange Bhavcopies & Groww ---');
  const allSyncedStocks = await syncAllIndianStocks(false);
  console.log(`Fetched ${allSyncedStocks.length} total Indian securities.`);
  if (allSyncedStocks.length < 1000) {
    throw new Error(`Refusing to publish an incomplete NSE/BSE universe: only ${allSyncedStocks.length} securities were fetched. Check the exchange/provider feeds and retry the build.`);
  }

  console.log('--- Step 2b: Enriching Stock Details (Fundamentals, Profiles, Shareholding, Financial Statements) ---');
  const enrichedStocks = enrichAllStocks(allSyncedStocks);
  console.log(`✓ Enriched complete corporate and fundamental details for all ${enrichedStocks.length} securities`);

  // Filter valid priced stocks and sort by Market Cap then Volume
  const validPriced = enrichedStocks.filter((s) => s.currentPrice && s.currentPrice > 0);
  validPriced.sort(
    (a, b) => (b.marketCapCr || 0) - (a.marketCapCr || 0) || (b.volume || 0) - (a.volume || 0)
  );
  console.log(`Priced liquid equities: ${validPriced.length}`);

  // Preserve the complete exchange universe in the snapshot, including securities
  // that are currently unpriced or temporarily have no live quote.
  const top2500 = [...enrichedStocks].map((s) => {
    const copy = { ...s };
    if (copy.historicalSeries && copy.historicalSeries.length > 30) {
      copy.historicalSeries = copy.historicalSeries.slice(-30);
    }
    return copy;
  });

  // Save the complete NSE/BSE universe to db.stocks and flush database
  db.stocks = top2500;
  flushDbSync();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`✓ Saved the complete ${top2500.length}-security universe into server/data/db.json (db.stocks)`);

  // Build allLiveStocks array across ALL priced equities (6,000+)
  const allLive = validPriced.map((s) => {
    const rawPrice = s.currentPrice || 0;
    const prev = typeof s.previousClose === 'number' && s.previousClose > 0 ? s.previousClose : null;
    const changeVal = prev !== null ? Number((rawPrice - prev).toFixed(2)) : null;
    const pct = prev !== null ? Number(((changeVal! / prev) * 100).toFixed(2)) : null;
    return {
      name: s.companyName,
      symbol: s.symbol,
      bseCode: s.bseCode !== 'N/A' ? s.bseCode : null,
      isin: s.isin,
      logo: s.logoUrl,
      searchId: s.searchId || null,
      initials: s.symbol.slice(0, 2).toUpperCase(),
      price: '₹' + rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rawPrice,
      previousClose: prev,
      rawChange: changeVal,
      change: changeVal === null || pct === null ? 'Unavailable' : (changeVal >= 0 ? '₹+' : '₹') + changeVal + ' (' + (pct >= 0 ? '+' : '') + pct + '%)',
      pct,
      isGain: changeVal === null ? null : changeVal >= 0,
      volume: s.volume ? s.volume.toLocaleString('en-IN') : 'Unavailable',
      volRaw: s.volume || 0,
      high: s.dayHigh ?? null,
      low: s.dayLow ?? null,
      open: s.open ?? null,
      week52High: s.week52High ?? null,
      week52Low: s.week52Low ?? null,
      marketCapCr: s.marketCapCr ?? null,
      category: s.exchange.includes('NSE') ? 'NSE' : 'BSE',
      status: 'LISTED',
      priceStatus: s.lastTradeTime
        ? (new Date(s.lastTradeTime).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) ? 'DELAYED' : 'STALE')
        : 'STALE',
      priceSource: s.exchange.includes('NSE') ? 'NSE exchange data' : 'BSE exchange data',
      quoteSource: 'Market data feed',
      quoteVerified: Boolean(s.lastTradeTime),
      quoteTimestamp: s.lastTradeTime || null,
    };
  });

  console.log('--- Step 3: Updating public/data/live-market-data.json & market-summary.json ---');
  const snapPath = path.resolve('public/data/live-market-data.json');
  let snap: any = {};
  if (fs.existsSync(snapPath)) {
    snap = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
  }
  snap.lastSyncTime = new Date().toISOString();
  snap.lastSyncFormatted = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
  snap.totalTrackedUniverse = allSyncedStocks.length;
  snap.allLiveStocks = allLive;
  snap.stocks = top2500;
  snap.ipos = db.ipos;

  // Save full minified universe (preserves all 7,110 securities without bloated whitespace)
  fs.writeFileSync(snapPath, JSON.stringify(snap), 'utf8');
  console.log(`✓ Updated public/data/live-market-data.json: ${snap.stocks.length} universe securities, ${snap.allLiveStocks.length} priced live stocks, ${snap.ipos.length} ipos`);

  // Create lightweight initial market summary for instant (<50ms) page loads
  const summaryStocks = (snap.stocks || []).slice(0, 60).map((s: any) => ({
    id: s.id,
    symbol: s.symbol,
    companyName: s.companyName,
    currentPrice: s.currentPrice,
    previousClose: s.previousClose,
    dayHigh: s.dayHigh,
    dayLow: s.dayLow,
    volume: s.volume,
    marketCapCr: s.marketCapCr,
    sector: s.sector,
    exchange: s.exchange,
    bseCode: s.bseCode,
    logoUrl: s.logoUrl,
    sparkline: s.sparkline,
    lastTradeTime: s.lastTradeTime,
    provenance: s.provenance,
  }));

  const summarySnap = {
    lastSyncTime: snap.lastSyncTime,
    lastSyncFormatted: snap.lastSyncFormatted,
    totalTrackedUniverse: snap.totalTrackedUniverse,
    indices: snap.indices || [],
    ipos: snap.ipos || [],
    stocks: summaryStocks,
    insights: snap.insights || [],
    blogs: snap.blogs || [],
    benchmarks: snap.benchmarks || null,
  };
  const summaryPath = path.resolve('public/data/market-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summarySnap), 'utf8');
  console.log(`✓ Generated public/data/market-summary.json for ultra-fast initial page loads`);

  // Sync to dist/data if it exists
  const distSnapPath = path.resolve('dist/data/live-market-data.json');
  if (fs.existsSync(path.dirname(distSnapPath))) {
    fs.writeFileSync(distSnapPath, JSON.stringify(snap), 'utf8');
    fs.writeFileSync(path.resolve('dist/data/market-summary.json'), JSON.stringify(summarySnap), 'utf8');
    console.log('✓ Synced to dist/data/live-market-data.json & market-summary.json');
  }

  console.log('--- Step 4: Updating server/data/seedData.ts & src/data/fallbackMarketData.ts ---');
  updateSeedDataFile(db.ipos);
  updateFallbackMarketDataFile(db.ipos, top2500);

  console.log('--- Done Universe and IPO Update successfully! ---');
}

function updateSeedDataFile(updatedIpos: IPOOffering[]) {
  const seedPath = path.resolve('server/data/seedData.ts');
  let content = fs.readFileSync(seedPath, 'utf8');

  const startMarker = 'export const SEED_IPOS: IPOOffering[] = [';
  const posStart = content.indexOf(startMarker);
  const endMarker = '];\n\nfunction makeDeterministicHistory';
  const posEnd = content.indexOf(endMarker, posStart);

  if (posStart !== -1 && posEnd !== -1) {
    content =
      content.slice(0, posStart) +
      'export const SEED_IPOS: IPOOffering[] = ' +
      JSON.stringify(updatedIpos, null, 2) +
      ';\n\nfunction makeDeterministicHistory' +
      content.slice(posEnd + endMarker.length);
    console.log(`✓ Synchronized SEED_IPOS in seedData.ts with ${updatedIpos.length} official IPOs`);
  }

  fs.writeFileSync(seedPath, content, 'utf8');
}

function updateFallbackMarketDataFile(updatedIpos: IPOOffering[], top2500: StockInstrument[]) {
  const fallbackPath = path.resolve('src/data/fallbackMarketData.ts');
  let content = fs.readFileSync(fallbackPath, 'utf8');

  const posIpos = content.indexOf('"ipos": [');
  const posInsights = content.indexOf('"insights": [');
  if (posIpos !== -1 && posInsights !== -1) {
    content =
      content.slice(0, posIpos) +
      '"ipos": ' +
      JSON.stringify(updatedIpos, null, 2) +
      ',\n  ' +
      content.slice(posInsights);
    console.log(`✓ Replaced ipos array in fallbackMarketData.ts with ${updatedIpos.length} official IPOs`);
  }

  fs.writeFileSync(fallbackPath, content, 'utf8');
  console.log('✓ Patched src/data/fallbackMarketData.ts');
}

main().catch((err) => {
  console.error('Fatal error during universe update:', err);
  process.exit(1);
});
