import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateIpoReportHtml,
  generateStockReportHtml,
} from '../functions/lib/report-generator.ts';
import {
  sendIpoDigestEmail,
  sendHighSubscriptionAlertEmail,
} from '../server/services/mailerService.ts';
import { playAlertChime } from '../src/hooks/usePriceAlertWatcher.ts';

describe('Price Alerts, Printable PDF Reports & Email Automation Suite', () => {
  test('generateIpoReportHtml generates institutional report with PriceAlerter branding and >20x bumper alert', () => {
    const html = generateIpoReportHtml({
      id: 'crystal-crop-protection',
      slug: 'crystal-crop-protection-ipo',
      companyName: 'Crystal Crop Protection Ltd',
      sector: 'Agrochemicals',
      category: 'Mainboard',
      status: 'Closed',
      priceBandLow: 259,
      priceBandHigh: 272,
      issueSizeCr: 455.71,
      freshIssueCr: 318.84,
      ofsCr: 136.65,
      lotSize: 55,
      minInvestment: 14960,
      subscription: {
        qib: 24.12,
        nii: 19.45,
        retail: 7.82,
        total: 16.63,
        isFinal: true,
      },
      gmp: {
        latestGmp: 68,
        expectedListingPrice: 340,
        estimatedListingGainPercent: 25.0,
        fireRating: 5,
      },
    });

    assert.ok(html.includes('Price<span style="color:#059669;">Alerter</span>'), 'Must contain PriceAlerter logo typography');
    assert.ok(html.includes('Crystal Crop Protection Ltd'), 'Must display company name');
    assert.ok(html.includes('🔥 High Demand: Subscribed 24.12x') || html.includes('Subscribed 24.12x'), 'Must highlight >20x bumper subscription');
    assert.ok(html.includes('QIB (Qualified Institutional Buyers)'), 'Must include QIB breakdown table');
    assert.ok(html.includes('24.12x'), 'Must include 24.12x QIB multiple');
    assert.ok(html.includes('₹259 – ₹272'), 'Must include price band');
    assert.ok(html.includes('₹455.71 Cr'), 'Must include issue size');
    assert.ok(html.includes('window.print()'), 'Must contain PDF print button');
    assert.ok(html.includes('invest strictly based on your personal risk profile'), 'Must contain investor guidance notice');
    assert.ok(html.includes('@page {'), 'Must include A4 print stylesheet');
  });

  test('generateStockReportHtml generates clean equity factsheet with valuation and ratios', () => {
    const html = generateStockReportHtml({
      symbol: 'HEROMOTOCO',
      companyName: 'Hero MotoCorp Limited',
      exchange: 'NSE / BSE',
      isin: 'INE158A01026',
      currentPrice: 5556.0,
      previousClose: 5253.0,
      dayChangePercent: 5.77,
      week52Low: 4671.5,
      week52High: 6388.5,
      peRatio: 19.8,
      industryPe: 24.2,
      pbRatio: 3.1,
      bookValue: 1716.67,
      dividendYield: 0.94,
      roe: 15.4,
      debtToEquity: 0.31,
      eps: 264.77,
    });

    assert.ok(html.includes('HEROMOTOCO'), 'Must contain ticker symbol');
    assert.ok(html.includes('Hero MotoCorp Limited'), 'Must contain company name');
    assert.ok(html.includes('₹5,556'), 'Must contain current price in INR');
    assert.ok(html.includes('+5.77%'), 'Must contain day change percentage');
    assert.ok(html.includes('19.8x'), 'Must contain P/E ratio');
    assert.ok(html.includes('window.print()'), 'Must contain print trigger');
    assert.ok(html.includes('Price<span style="color:#059669;">Alerter</span>'), 'Must contain PriceAlerter branding');
  });

  test('sendIpoDigestEmail includes logo, open IPOs, gainers, advisory, and website links', async () => {
    let capturedOptions: any = null;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      if (String(url).includes('resend.com')) {
        capturedOptions = JSON.parse(String(init?.body || '{}'));
        return new Response(JSON.stringify({ id: 'res_test_123' }), { status: 200 });
      }
      return originalFetch(url, init);
    }) as typeof fetch;

    const prevKey = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = 're_test_dummy_key';

    try {
      const sent = await sendIpoDigestEmail({
        to: 'investor@example.com',
        name: 'Rahul Sharma',
        openedIpos: [
          {
            companyName: 'Mahanadi Coalfields Ltd',
            slug: 'mahanadi-coalfields-ipo',
            category: 'Mainboard',
            priceBand: '₹185 – ₹195',
            issueSize: '₹1,200 Cr',
            closeDate: '2026-11-25',
            gmp: '+₹35 (+18%)',
          },
          {
            companyName: 'Watrana Rentals Ltd',
            slug: 'watrana-rentals-ipo',
            category: 'SME',
            priceBand: '₹115 – ₹120',
            issueSize: '₹45 Cr',
            closeDate: '2026-11-24',
            gmp: '+₹22 (+18.3%)',
          },
        ],
        gainers: [
          {
            symbol: 'HEROMOTOCO',
            companyName: 'Hero MotoCorp Ltd',
            price: 5556.0,
            changePercent: 5.77,
          },
        ],
        siteBaseUrl: 'https://pricealerter.in',
      });

      assert.ok(sent, 'sendIpoDigestEmail must succeed with mock transport');
      assert.ok(capturedOptions != null, 'Must have dispatched to Resend endpoint');
      assert.equal(capturedOptions.to[0], 'investor@example.com');
      assert.ok(capturedOptions.subject.includes('PriceAlerter Market Digest'));

      const html = capturedOptions.html;
      assert.ok(html.includes('Price<span style="color:#059669;">Alerter</span>'), 'Email must contain PriceAlerter logo branding');
      assert.ok(html.includes('Rahul Sharma'), 'Email must greet recipient by name');
      assert.ok(html.includes('Mahanadi Coalfields Ltd'), 'Email must list open IPO');
      assert.ok(html.includes('Watrana Rentals Ltd'), 'Email must list SME IPO');
      assert.ok(html.includes('HEROMOTOCO'), 'Email must list top gainer');
      assert.ok(html.includes('personal interest'), 'Email must instruct user to invest based on personal interest');
      assert.ok(html.includes('https://pricealerter.in/ipo'), 'Email must link to website');
    } finally {
      process.env.RESEND_API_KEY = prevKey;
      globalThis.fetch = originalFetch;
    }
  });

  test('sendHighSubscriptionAlertEmail formats >20x demand multiple, PDF report link, and disclaimer', async () => {
    let capturedOptions: any = null;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      if (String(url).includes('resend.com')) {
        capturedOptions = JSON.parse(String(init?.body || '{}'));
        return new Response(JSON.stringify({ id: 'res_bumper_123' }), { status: 200 });
      }
      return originalFetch(url, init);
    }) as typeof fetch;

    const prevKey = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = 're_test_dummy_key';

    try {
      const sent = await sendHighSubscriptionAlertEmail({
        to: 'vip.investor@example.com',
        name: 'Priya Patel',
        ipo: {
          companyName: 'Crystal Crop Protection Ltd',
          slug: 'crystal-crop-protection-ipo',
          category: 'Mainboard',
          priceBand: '₹259 – ₹272',
          issueSize: '₹455.71 Cr',
          qibSubscription: 24.12,
          niiSubscription: 19.45,
          retailSubscription: 7.82,
          totalSubscription: 16.63,
          latestGmp: 68,
          expectedGainPercent: 25.0,
        },
        subscriptionX: 24.12,
        siteBaseUrl: 'https://pricealerter.in',
      });

      assert.ok(sent, 'sendHighSubscriptionAlertEmail must succeed');
      assert.ok(capturedOptions.subject.includes('24.12x'));
      assert.ok(capturedOptions.subject.includes('Detailed PDF Report'));

      const html = capturedOptions.html;
      assert.ok(html.includes('Price<span style="color:#059669;">Alerter</span>'), 'Email must have full logo');
      assert.ok(html.includes('24.12x Oversubscribed'), 'Email must highlight >20x subscription');
      assert.ok(html.includes('/api/ipo/crystal-crop-protection-ipo/report'), 'Email must include direct link to PDF research report');
      assert.ok(html.includes('invest strictly based on your personal interest'), 'Email must include advisory notice');
    } finally {
      process.env.RESEND_API_KEY = prevKey;
      globalThis.fetch = originalFetch;
    }
  });

  test('playAlertChime executes safely without throwing errors in runtime', () => {
    assert.doesNotThrow(() => {
      playAlertChime();
    });
  });
});
