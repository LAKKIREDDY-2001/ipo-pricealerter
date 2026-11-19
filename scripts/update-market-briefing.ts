import fs from 'node:fs';
import path from 'node:path';
import type { IPOOffering, MarketInsight, ProvenanceMetadata } from '../src/types/financial';
import { getDb, flushDbSync } from '../server/db/database';

const EFFECTIVE_DATE = '2026-11-19';
const RETRIEVED_AT = new Date().toISOString();
const db = getDb();

const marketSource = 'Reuters; NDTV Profit; Business Standard';
const marketUrl = 'https://www.reuters.com/world/india/indian-shares-set-lower-open-foreign-inflows-easing-crude-lend-support-2026-11-18/';
const ipoSource = 'Moneycontrol IPO; Economic Times IPO';
const ipoUrl = 'https://www.moneycontrol.com/ipo?classic=true';
const verified = (dataCategory: string): ProvenanceMetadata => ({
  source: ipoSource,
  retrievedAt: RETRIEVED_AT,
  effectiveDate: EFFECTIVE_DATE,
  verificationStatus: 'Verified',
  qualityStatus: 'VERIFIED',
  currency: 'INR',
  unit: 'INR per share / INR crore as applicable',
  dataCategory,
});

function upsertInsight(insight: MarketInsight) {
  const index = db.insights.findIndex((item) => item.slug === insight.slug);
  if (index >= 0) db.insights[index] = insight;
  else db.insights.unshift(insight);
}

upsertInsight({
  id: 'market-overview-2026-11-19',
  slug: 'indian-market-overview-2026-11-19',
  title: 'Indian Market Overview: 19 November 2026',
  category: 'Market Overview',
  publishedAt: '2026-11-19T01:00:00.000Z',
  source: marketSource,
  sourceUrl: marketUrl,
  summary: 'Pre-market briefing using the latest completed Indian session (18 November). Sensex and Nifty ended lower after a two-session rise, while November foreign inflows and lower crude prices remain supportive. Figures below are previous-session closes, not live 19 November quotes.',
  facts: [
    'Latest completed session: Wednesday, 18 November 2026.',
    'BSE Sensex closed at 82,031.81, down 500.38 points (-0.61%).',
    'Nifty 50 closed at 25,227.95, down 159.45 points (-0.63%).',
    'Nifty MidCap 100 fell 1.22%; Nifty SmallCap 100 fell 0.35%.',
    'Metals, consumer durables and auto shares weighed on benchmarks; PSU banks and media showed relative resilience.',
    'Brent crude was reported at $91.90 per barrel, down 1.3% on the session.',
    'The 19 November cash-market session had not yet opened when this briefing was prepared; live prices must be loaded from the exchange feed after market open.'
  ],
  analysis: 'The previous session showed profit-taking after recent gains rather than a confirmed trend reversal. Reuters reported strong November foreign portfolio inflows, supportive corporate earnings and lower oil prices, but also noted that the recent rally had left key indices technically stretched. Treat the 18 November closes as reference levels only. Refresh benchmark values, breadth, sector performance, FII/DII flows and commodity prices from timestamped exchange or primary-source feeds during the 19 November session; do not carry previous closes forward as live prices.',
  instruments: ['SENSEX', 'NIFTY 50', 'NIFTY MIDCAP 100', 'NIFTY SMALLCAP 100', 'BRENT CRUDE']
});

upsertInsight({
  id: 'ipo-update-2026-11-19',
  slug: 'indian-ipo-update-2026-11-19',
  title: 'India IPO Update: 19 November 2026',
  category: 'IPO Update',
  publishedAt: '2026-11-19T01:05:00.000Z',
  source: ipoSource,
  sourceUrl: ipoUrl,
  summary: 'Two issues open on 19 November: Mahanadi Coalfields (mainboard) and Watrana Rentals (NSE SME). Crystal Crop Protection remains open through 20 November. Subscription and GMP figures must carry their own timestamps; grey-market indications are unofficial.',
  facts: [
    'Mahanadi Coalfields IPO: 19–23 November; price band ₹129–₹136; lot size 110 shares; minimum application at the upper band ₹14,960; expected listing 27 November.',
    'Mahanadi Coalfields is an offer for sale by Coal India; proceeds go to the selling shareholder, not the company.',
    'Watrana Rentals IPO (NSE SME): 19–23 November; price band ₹232–₹245; lot size 600 shares; minimum application at the upper band ₹2,94,000; issue size about ₹120.10 crore; expected listing 27 November.',
    'Crystal Crop Protection IPO: 18–20 November; price band ₹259–₹272; lot size 55 shares; minimum application at the upper band ₹14,960; expected listing 26 November.',
    'Crystal Crop Protection subscription was reported at about 1.4x in the latest available 18 November update; this is not a live 19 November subscription figure.',
    'GMP is an unofficial grey-market indication and is not an exchange-confirmed price or guaranteed listing return.'
  ],
  analysis: 'Prioritize the issuer RHP and NSE/BSE issue notices for offer terms and dates. Update subscription by investor category only when the exchange bid data has a timestamp. Do not infer subscription from news headlines or display an old figure as live. Keep GMP separate from official issue data and mark it unofficial with source and observation time. Expected allotment and listing dates can change and should be checked against registrar and exchange notices.',
  instruments: ['MAHANADI COALFIELDS', 'WATRANA RENTALS', 'CRYSTAL CROP PROTECTION']
});

const mahanadi = db.ipos.find((ipo) =>
  ipo.slug === 'mahanadi-coalfields-ipo' || ipo.id === 'mahanadi-coalfields-ipo' || ipo.id === 'ipo-mahanadi-coalfields-ipo'
);
if (mahanadi) {
  mahanadi.status = 'Open';
  mahanadi.dates = {
    openDate: '2026-11-19', closeDate: '2026-11-23',
    allotmentDate: '2026-11-25', refundDate: '2026-11-26',
    dematCreditDate: '2026-11-26', listingDate: '2026-11-27'
  };
  mahanadi.priceBandLow = 129;
  mahanadi.priceBandHigh = 136;
  mahanadi.lotSize = 110;
  mahanadi.minBidQuantity = 110;
  mahanadi.minInvestment = 14960;
  mahanadi.freshIssueCr = 0;
  mahanadi.ofsCr = mahanadi.issueSizeCr;
  mahanadi.subscription = {
    qib: null, nii: null, retail: null, employee: null, shareholder: null, total: null,
    isFinal: false, dailyBreakdown: [],
    provenance: { ...verified('IPO subscription'), qualityStatus: 'UNAVAILABLE', verificationStatus: 'Provisional' }
  };
  mahanadi.gmp = {
    latestGmp: null, previousGmp: null, lastUpdated: null, availability: 'Unavailable',
    source: 'No independently verified official GMP; grey-market indications are unofficial', history: []
  };
}

const watranaSlug = 'watrana-rentals-ipo';
let watrana = db.ipos.find((ipo) => ipo.slug === watranaSlug || ipo.id === 'watrana-rentals');
if (!watrana) {
  watrana = {
    id: 'watrana-rentals',
    slug: watranaSlug,
    companyName: 'Watrana Rentals Limited',
    shortName: 'Watrana Rentals',
    logoMonogram: 'WR',
    logoColor: '#287A52',
    sector: 'Services',
    industry: 'Equipment rental services',
    category: 'SME',
    status: 'Open',
    exchanges: ['NSE'],
    website: '',
    registrar: 'Refer to the official RHP',
    registrarUrl: '',
    issueSizeCr: 120.10,
    freshIssueCr: null,
    ofsCr: null,
    priceBandLow: 232,
    priceBandHigh: 245,
    lotSize: 600,
    minBidQuantity: 1200,
    minInvestment: 294000,
    faceValue: null,
    dates: {
      openDate: '2026-11-19', closeDate: '2026-11-23',
      allotmentDate: '2026-11-25', refundDate: '2026-11-26',
      dematCreditDate: '2026-11-26', listingDate: '2026-11-27'
    },
    subscription: {
      qib: null, nii: null, retail: null, employee: null, shareholder: null, total: null,
      isFinal: false, dailyBreakdown: [],
      provenance: { ...verified('IPO subscription'), qualityStatus: 'UNAVAILABLE', verificationStatus: 'Provisional' }
    },
    gmp: {
      latestGmp: null, previousGmp: null, lastUpdated: null, availability: 'Unavailable',
      source: 'Unofficial grey-market data not independently verified', history: []
    },
    listing: {
      issuePrice: null, actualListingPrice: null, listingExchange: null, stockSymbol: null,
      currentMarketPrice: null, previousClose: null, listingDate: null, priceStatus: 'UNAVAILABLE',
      provenance: { ...verified('Post-listing quote'), qualityStatus: 'UNAVAILABLE', verificationStatus: 'Provisional' }
    },
    financials: { reportingBasis: 'As stated in RHP', years: [] },
    valuation: {
      peRatio: null, pbRatio: null, marketCapCr: null, eps: null, industryAvgPe: null,
      reportingPeriod: 'RHP', calculationBasis: 'Not populated; verify against official RHP', peers: []
    },
    profile: {
      overview: 'SME public issue. Review the official offer document for the company profile and business details.',
      productsAndServices: 'Refer to the official RHP.',
      businessModel: 'Refer to the official RHP.',
      industryOverview: 'Refer to the official RHP.',
      competitivePosition: 'Not independently verified.',
      promoters: [], growthOpportunities: [],
      strengths: [], risks: ['SME IPO liquidity and price-volatility risk', 'Verify financials, objects of the issue and promoter details in the RHP']
    },
    documents: { drhpUrl: null, rhpUrl: null, prospectusUrl: null, anchorUrl: null, allotmentUrl: null, exchangeNoticeUrl: null },
    provenance: verified('IPO offer terms')
  } satisfies IPOOffering;
  db.ipos.push(watrana);
} else {
  watrana.status = 'Open';
  watrana.category = 'SME';
  watrana.exchanges = ['NSE'];
  watrana.issueSizeCr = 120.10;
  watrana.priceBandLow = 232;
  watrana.priceBandHigh = 245;
  watrana.lotSize = 600;
  watrana.minBidQuantity = 1200;
  watrana.minInvestment = 294000;
  watrana.dates = {
    openDate: '2026-11-19', closeDate: '2026-11-23',
    allotmentDate: '2026-11-25', refundDate: '2026-11-26',
    dematCreditDate: '2026-11-26', listingDate: '2026-11-27'
  };
  watrana.subscription = {
    qib: null, nii: null, retail: null, employee: null, shareholder: null, total: null,
    isFinal: false, dailyBreakdown: [],
    provenance: { ...verified('IPO subscription'), qualityStatus: 'UNAVAILABLE', verificationStatus: 'Provisional' }
  };
  watrana.gmp = {
    latestGmp: null, previousGmp: null, lastUpdated: null, availability: 'Unavailable',
    source: 'Unofficial grey-market data not independently verified', history: []
  };
}

db.insights.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
flushDbSync();

const livePath = path.resolve('public/data/live-market-data.json');
if (fs.existsSync(livePath)) {
  const snapshot = JSON.parse(fs.readFileSync(livePath, 'utf8'));
  snapshot.ipos = db.ipos;
  snapshot.insights = db.insights;
  fs.writeFileSync(livePath, JSON.stringify(snapshot), 'utf8');
}
const summaryPath = path.resolve('public/data/market-summary.json');
if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  summary.ipos = db.ipos;
  summary.insights = db.insights;
  fs.writeFileSync(summaryPath, JSON.stringify(summary), 'utf8');
}
console.log('Updated dated market overview, IPO briefing and current IPO records (19 Nov 2026).');
