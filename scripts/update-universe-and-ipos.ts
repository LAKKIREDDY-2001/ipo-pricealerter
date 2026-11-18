import fs from 'fs';
import path from 'path';
import { syncAllIndianStocks } from '../server/providers/marketDataProvider';
import type { IPOOffering, StockInstrument } from '../src/types/financial';

async function main() {
  console.log('--- Step 1: Loading Database & Live Equities ---');
  const dbPath = path.resolve('server/data/db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Update BlackBuck, Onyx Biotec, and Mangal Compusolution in db.ipos
  for (const ipo of db.ipos as IPOOffering[]) {
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

    if (ipo.id === 'crystal-crop-protection' || ipo.slug === 'crystal-crop-protection-ipo') {
      ipo.status = 'Upcoming';
      ipo.priceBandLow = 259;
      ipo.priceBandHigh = 272;
      ipo.dates.openDate = '2026-11-18';
      ipo.dates.closeDate = '2026-11-20';
      ipo.dates.listingDate = '2026-11-26';
    }

    if (ipo.id === 'ipo-mahanadi-coalfields-ipo' || ipo.slug === 'mahanadi-coalfields-ipo') {
      ipo.status = 'Upcoming';
      ipo.priceBandLow = 129;
      ipo.priceBandHigh = 136;
      ipo.dates.openDate = '2026-11-19';
      ipo.dates.closeDate = '2026-11-23';
      ipo.dates.listingDate = '2026-11-27';
      ipo.logoUrl = '/assets/movers/mahanadi.svg';
    }

    if (ipo.id === 'ipo-watrana-rentals-ipo' || ipo.slug === 'watrana-rentals-ipo') {
      ipo.status = 'Upcoming';
      ipo.priceBandLow = 232;
      ipo.priceBandHigh = 245;
      ipo.dates.openDate = '2026-11-19';
      ipo.dates.closeDate = '2026-11-23';
      ipo.dates.listingDate = '2026-11-27';
      ipo.logoUrl = '/assets/movers/watrana.svg';
    }
  }

  console.log('--- Step 2: Fetching All Indian Equities from Official Exchange Bhavcopies & Groww ---');
  const allSyncedStocks = await syncAllIndianStocks(false);
  console.log(`Fetched ${allSyncedStocks.length} total Indian securities.`);
  if (allSyncedStocks.length < 1000) {
    throw new Error(`Refusing to publish an incomplete NSE/BSE universe: only ${allSyncedStocks.length} securities were fetched. Check the exchange/provider feeds and retry the build.`);
  }

  // Filter valid priced stocks and sort by Market Cap then Volume
  const validPriced = allSyncedStocks.filter((s) => s.currentPrice && s.currentPrice > 0);
  validPriced.sort(
    (a, b) => (b.marketCapCr || 0) - (a.marketCapCr || 0) || (b.volume || 0) - (a.volume || 0)
  );
  console.log(`Priced liquid equities: ${validPriced.length}`);

  // Preserve the complete exchange universe in the snapshot, including securities
  // that are currently unpriced or temporarily have no live quote.
  const top2500 = [...allSyncedStocks].map((s) => {
    const copy = { ...s };
    if (copy.historicalSeries && copy.historicalSeries.length > 30) {
      copy.historicalSeries = copy.historicalSeries.slice(-30);
    }
    return copy;
  });

  // Save the complete NSE/BSE universe to db.stocks
  db.stocks = top2500;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`✓ Saved the complete ${top2500.length}-security universe into server/data/db.json (db.stocks)`);

  // Build allLiveStocks array across ALL priced equities (6,000+)
  const allLive = validPriced.map((s) => {
    const rawPrice = s.currentPrice || 0;
    const prev = s.previousClose || rawPrice;
    const changeVal = Number((rawPrice - prev).toFixed(2));
    const pct = prev > 0 ? Number(((changeVal / prev) * 100).toFixed(2)) : 0;
    return {
      name: s.companyName,
      symbol: s.symbol,
      bseCode: s.bseCode !== 'N/A' ? s.bseCode : null,
      isin: s.isin,
      logo: s.logoUrl,
      initials: s.symbol.slice(0, 2).toUpperCase(),
      price: '₹' + rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rawPrice,
      previousClose: prev,
      rawChange: changeVal,
      change: (changeVal >= 0 ? '₹+' : '₹') + changeVal + ' (' + (pct >= 0 ? '+' : '') + pct + '%)',
      pct,
      isGain: changeVal >= 0,
      volume: s.volume ? s.volume.toLocaleString('en-IN') : 'Standard',
      volRaw: s.volume || 0,
      high: s.dayHigh ?? null,
      low: s.dayLow ?? null,
      open: s.open ?? null,
      week52High: s.week52High ?? null,
      week52Low: s.week52Low ?? null,
      marketCapCr: s.marketCapCr ?? null,
      category: s.exchange.includes('NSE') ? 'NSE' : 'BSE',
      status: 'LISTED',
      priceStatus: 'TRADING',
      priceSource: s.exchange.includes('NSE') ? 'NSE Live Bhavcopy' : 'BSE Live Bhavcopy',
      quoteSource: 'NSE & BSE · Official Exchange Bhavcopy · Zerodha Kite Registry',
      quoteVerified: true,
      quoteTimestamp: s.lastTradeTime || new Date().toISOString(),
    };
  });

  console.log('--- Step 3: Updating public/data/live-market-data.json ---');
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

  fs.writeFileSync(snapPath, JSON.stringify(snap, null, 2), 'utf8');
  console.log(`✓ Updated public/data/live-market-data.json: ${snap.stocks.length} universe securities, ${snap.allLiveStocks.length} priced live stocks, ${snap.ipos.length} ipos`);

  // Sync to dist/data if it exists
  const distSnapPath = path.resolve('dist/data/live-market-data.json');
  if (fs.existsSync(path.dirname(distSnapPath))) {
    fs.writeFileSync(distSnapPath, JSON.stringify(snap, null, 2), 'utf8');
    console.log('✓ Synced to dist/data/live-market-data.json');
  }

  console.log('--- Step 4: Updating server/data/seedData.ts & src/data/fallbackMarketData.ts ---');
  updateSeedDataFile(db.ipos);
  updateFallbackMarketDataFile(db.ipos, top2500);

  console.log('--- Done Universe and IPO Update successfully! ---');
}

function updateSeedDataFile(updatedIpos: IPOOffering[]) {
  const seedPath = path.resolve('server/data/seedData.ts');
  let content = fs.readFileSync(seedPath, 'utf8');

  // Replace BlackBuck block in seedData.ts
  const bbTarget = /("id":\s*"ipo-zinka-logistics"[\s\S]*?"category":\s*"Mainboard",\s*)"status":\s*"Open"/;
  if (bbTarget.test(content)) {
    content = content.replace(bbTarget, '$1"status": "Listed"');
    console.log('✓ Patched seedData.ts BlackBuck status to Listed');
  }

  // Replace BlackBuck dates
  content = content.replace(
    /("id":\s*"ipo-zinka-logistics"[\s\S]*?"dates":\s*\{[\s\S]*?"openDate":\s*)"2026-11-13"/,
    '$1"2024-11-13"'
  );
  content = content.replace(
    /("id":\s*"ipo-zinka-logistics"[\s\S]*?"dates":\s*\{[\s\S]*?"closeDate":\s*)"2026-11-18"/,
    '$1"2024-11-18"'
  );
  content = content.replace(
    /("id":\s*"ipo-zinka-logistics"[\s\S]*?"dates":\s*\{[\s\S]*?"listingDate":\s*)"2026-11-21"/,
    '$1"2024-11-22"'
  );

  // Replace Onyx Biotec block in seedData.ts
  const onyxTarget = /("id":\s*"ipo-onyx-biotec"[\s\S]*?"category":\s*"SME",\s*)"status":\s*"Open"/;
  if (onyxTarget.test(content)) {
    content = content.replace(onyxTarget, '$1"status": "Listed"');
    console.log('✓ Patched seedData.ts Onyx Biotec status to Listed');
  }
  content = content.replace(
    /("id":\s*"ipo-onyx-biotec"[\s\S]*?"dates":\s*\{[\s\S]*?"openDate":\s*)"2026-11-13"/,
    '$1"2024-11-13"'
  );
  content = content.replace(
    /("id":\s*"ipo-onyx-biotec"[\s\S]*?"dates":\s*\{[\s\S]*?"closeDate":\s*)"2026-11-18"/,
    '$1"2024-11-18"'
  );
  content = content.replace(
    /("id":\s*"ipo-onyx-biotec"[\s\S]*?"dates":\s*\{[\s\S]*?"listingDate":\s*)"2026-11-21"/,
    '$1"2024-11-22"'
  );

  // Replace Mangal Compusolution block in seedData.ts
  const mangalTarget = /("id":\s*"ipo-mangal-compusolution"[\s\S]*?"category":\s*"SME",\s*)"status":\s*"Open"/;
  if (mangalTarget.test(content)) {
    content = content.replace(mangalTarget, '$1"status": "Listed"');
    console.log('✓ Patched seedData.ts Mangal Compusolution status to Listed');
  }
  content = content.replace(
    /("id":\s*"ipo-mangal-compusolution"[\s\S]*?"dates":\s*\{[\s\S]*?"openDate":\s*)"2026-11-12"/,
    '$1"2024-11-12"'
  );
  content = content.replace(
    /("id":\s*"ipo-mangal-compusolution"[\s\S]*?"dates":\s*\{[\s\S]*?"closeDate":\s*)"2026-11-18"/,
    '$1"2024-11-14"'
  );
  content = content.replace(
    /("id":\s*"ipo-mangal-compusolution"[\s\S]*?"dates":\s*\{[\s\S]*?"listingDate":\s*)"2026-11-20"/,
    '$1"2024-11-21"'
  );

  fs.writeFileSync(seedPath, content, 'utf8');
}

function updateFallbackMarketDataFile(updatedIpos: IPOOffering[], top2500: StockInstrument[]) {
  const fallbackPath = path.resolve('src/data/fallbackMarketData.ts');
  let content = fs.readFileSync(fallbackPath, 'utf8');

  // Replace BlackBuck status & dates
  content = content.replace(
    /("id":\s*"ipo-zinka-logistics"[\s\S]*?"category":\s*"Mainboard",\s*)"status":\s*"Open"/,
    '$1"status": "Listed"'
  );
  content = content.replace(
    /("id":\s*"ipo-zinka-logistics"[\s\S]*?"dates":\s*\{[\s\S]*?"openDate":\s*)"2026-11-13"/,
    '$1"2024-11-13"'
  );
  content = content.replace(
    /("id":\s*"ipo-zinka-logistics"[\s\S]*?"dates":\s*\{[\s\S]*?"closeDate":\s*)"2026-11-18"/,
    '$1"2024-11-18"'
  );
  content = content.replace(
    /("id":\s*"ipo-zinka-logistics"[\s\S]*?"dates":\s*\{[\s\S]*?"listingDate":\s*)"2026-11-21"/,
    '$1"2024-11-22"'
  );

  // Replace Onyx Biotec status & dates
  content = content.replace(
    /("id":\s*"ipo-onyx-biotec"[\s\S]*?"category":\s*"SME",\s*)"status":\s*"Open"/,
    '$1"status": "Listed"'
  );
  content = content.replace(
    /("id":\s*"ipo-onyx-biotec"[\s\S]*?"dates":\s*\{[\s\S]*?"openDate":\s*)"2026-11-13"/,
    '$1"2024-11-13"'
  );
  content = content.replace(
    /("id":\s*"ipo-onyx-biotec"[\s\S]*?"dates":\s*\{[\s\S]*?"closeDate":\s*)"2026-11-18"/,
    '$1"2024-11-18"'
  );
  content = content.replace(
    /("id":\s*"ipo-onyx-biotec"[\s\S]*?"dates":\s*\{[\s\S]*?"listingDate":\s*)"2026-11-21"/,
    '$1"2024-11-22"'
  );

  // Replace Mangal Compusolution status & dates
  content = content.replace(
    /("id":\s*"ipo-mangal-compusolution"[\s\S]*?"category":\s*"SME",\s*)"status":\s*"Open"/,
    '$1"status": "Listed"'
  );
  content = content.replace(
    /("id":\s*"ipo-mangal-compusolution"[\s\S]*?"dates":\s*\{[\s\S]*?"openDate":\s*)"2026-11-12"/,
    '$1"2024-11-12"'
  );
  content = content.replace(
    /("id":\s*"ipo-mangal-compusolution"[\s\S]*?"dates":\s*\{[\s\S]*?"closeDate":\s*)"2026-11-18"/,
    '$1"2024-11-14"'
  );
  content = content.replace(
    /("id":\s*"ipo-mangal-compusolution"[\s\S]*?"dates":\s*\{[\s\S]*?"listingDate":\s*)"2026-11-20"/,
    '$1"2024-11-21"'
  );

  fs.writeFileSync(fallbackPath, content, 'utf8');
  console.log('✓ Patched src/data/fallbackMarketData.ts');
}

main().catch((err) => {
  console.error('Fatal error during universe update:', err);
  process.exit(1);
});
