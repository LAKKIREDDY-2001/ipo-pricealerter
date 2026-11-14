import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { getIstMarketSession, getAutomationStatus } from '../server/services/automationEngine.ts';
import { getDb, sanitizeUser, type StoredUser } from '../server/db/database.ts';
import { SEED_BLOG_ARTICLES } from '../server/data/seedData.ts';

describe('PriceAlerter Compliance, Security & Automation', () => {
  it('detects IST market sessions deterministically across weekday & weekend', () => {
    // 2026-11-13 is a Friday. 04:00 UTC = 09:30 IST -> MARKET_OPEN
    const marketOpenUtc = new Date('2026-11-13T04:00:00.000Z');
    const openRes = getIstMarketSession(marketOpenUtc);
    assert.equal(openRes.session, 'MARKET_OPEN');
    assert.equal(openRes.istTimeLabel, '09:30 IST');
    assert.equal(openRes.isActiveTradingWindow, true);

    // 2026-11-13 03:35 UTC = 09:05 IST -> PRE_OPEN
    const preOpenUtc = new Date('2026-11-13T03:35:00.000Z');
    assert.equal(getIstMarketSession(preOpenUtc).session, 'PRE_OPEN');

    // 2026-11-13 11:30 UTC = 17:00 IST -> POST_CLOSE
    const postCloseUtc = new Date('2026-11-13T11:30:00.000Z');
    const postRes = getIstMarketSession(postCloseUtc);
    assert.equal(postRes.session, 'POST_CLOSE');
    assert.equal(postRes.isActiveTradingWindow, false);

    // 2026-11-14 is Saturday -> WEEKEND
    const satUtc = new Date('2026-11-14T06:00:00.000Z');
    const satRes = getIstMarketSession(satUtc);
    assert.equal(satRes.session, 'WEEKEND');
    assert.equal(satRes.isActiveTradingWindow, false);
  });

  it('strips passwordHash cleanly in sanitizeUser without mutating source record', () => {
    const mockUser: StoredUser = {
      id: 'usr-test-1',
      name: 'Test Investor',
      email: 'test@pricealerter.in',
      role: 'user',
      emailVerified: true,
      createdAt: '2026-11-14T00:00:00.000Z',
      passwordHash: bcrypt.hashSync('StrongPass@2026', 6),
      preferences: {
        emailAlerts: true,
        browserNotifications: false,
        ipoReminders: true,
        gmpAlerts: true,
      },
    };
    const safe = sanitizeUser(mockUser) as unknown as Record<string, unknown>;
    assert.equal(safe.email, 'test@pricealerter.in');
    assert.equal('passwordHash' in safe, false);
    assert.ok(mockUser.passwordHash.startsWith('$2'));
  });

  it('maintains rich original educational articles and official references for AdSense quality', () => {
    assert.ok(SEED_BLOG_ARTICLES.length >= 8, 'Expected at least 8 original investor guides');
    for (const article of SEED_BLOG_ARTICLES) {
      assert.ok(article.title.length >= 25);
      assert.ok(article.metaDescription.length >= 80);
      assert.ok(article.sections.length >= 3);
      assert.ok(article.officialReferences.length >= 1);
      const wordCount = article.sections
        .flatMap((s) => [...s.paragraphs, ...(s.bullets || [])])
        .join(' ')
        .split(/\s+/).length;
      assert.ok(wordCount >= 70, `Article ${article.slug} should have substantive body content`);
    }
  });

  it('initializes database schema cleanly with blogs, insights, and contactMessages', () => {
    const db = getDb();
    assert.ok(Array.isArray(db.blogs));
    assert.ok(db.blogs.length >= 8);
    assert.ok(Array.isArray(db.insights));
    assert.ok(Array.isArray(db.contactMessages));
  });

  it('exposes valid automation telemetry shape', () => {
    const status = getAutomationStatus();
    assert.equal(typeof status.running, 'boolean');
    assert.ok(['PRE_OPEN', 'MARKET_OPEN', 'POST_CLOSE', 'WEEKEND'].includes(status.marketSession));
    assert.ok(status.pollIntervalsSec.indices > 0);
    assert.ok(status.pollIntervalsSec.equitiesAndAlerts > 0);
    assert.ok(status.pollIntervalsSec.iposAndGmp > 0);
  });

  it('removes hardcoded credentials from client auth bundle and configures AdSense + Consent Mode + manifest cleanly', () => {
    const root = process.cwd();
    const authPages = fs.readFileSync(path.join(root, 'src', 'pages', 'AuthPages.tsx'), 'utf8');
    assert.equal(authPages.includes('Admin@PriceAlerter2026'), false);
    assert.equal(authPages.includes('Investor@2026'), false);

    const dbSource = fs.readFileSync(path.join(root, 'server', 'db', 'database.ts'), 'utf8');
    assert.equal(dbSource.includes('Admin@PriceAlerter2026'), false);
    assert.equal(dbSource.includes('Investor@2026'), false);

    const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.ok(indexHtml.includes("gtag('consent', 'default'"));
    assert.ok(indexHtml.includes('adsbygoogle.js?client=ca-pub-'));
    assert.ok(indexHtml.includes('rel="canonical"'));
    assert.ok(indexHtml.includes('rel="manifest"'));
    assert.ok(indexHtml.includes('id="pa-ld-json"'));

    const manifestRaw = fs.readFileSync(path.join(root, 'public', 'manifest.webmanifest'), 'utf8');
    const manifest = JSON.parse(manifestRaw) as {
      name?: string;
      short_name?: string;
      start_url?: string;
    };
    assert.equal(manifest.short_name, 'PriceAlerter');
    assert.ok(manifest.name?.startsWith('PriceAlerter'));
    assert.equal(manifest.start_url, '/');
  });

  it('prevents Cloudflare Rocket Loader script rewriting and stale-cache white screens', () => {
    const root = process.cwd();
    const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.ok(indexHtml.includes('<script data-cfasync="false"'));
    assert.ok(indexHtml.includes('<noscript>'));

    const headersFile = fs.readFileSync(path.join(root, 'public', '_headers'), 'utf8');
    assert.ok(headersFile.includes('CDN-Cache-Control: no-store'));
    assert.ok(headersFile.includes('/assets/*'));

    const appSource = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');
    assert.ok(appSource.includes('<ErrorBoundary>'));

    const errorBoundarySource = fs.readFileSync(
      path.join(root, 'src', 'components', 'common', 'ErrorBoundary.tsx'),
      'utf8'
    );
    assert.ok(errorBoundarySource.includes('Failed to fetch dynamically imported module'));
  });
});

