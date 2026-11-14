import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  appendAuditLog,
  createId,
  getDb,
  sanitizeUser,
  saveDb,
  type StoredUser,
} from './server/db/database.ts';
import {
  evaluatePriceAlerts,
  findStockInUniverse,
  getLiveUniverseSnapshot,
  normalizeGrowwLogoUrl,
  queryAllIndianStocks,
  refreshIndicesFromProvider,
  refreshStockBySymbol,
  resolveGrowwLogoBySearchId,
  syncAllIndianStocks,
} from './server/providers/marketDataProvider.ts';
import {
  getIpoBySlugLive,
  refreshIposFromProvider,
} from './server/providers/ipoDataProvider.ts';
import {
  getAutomationStatus,
  registerSseClient,
  startAutomationEngine,
} from './server/services/automationEngine.ts';
import type { IPOOffering, PriceAlertRule } from './src/types/financial.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const SESSION_COOKIE = 'pa_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET?.trim() && process.env.NODE_ENV === 'production') {
  console.warn(
    '[Security] SESSION_SECRET environment variable is not set; using ephemeral in-memory secret.'
  );
}

interface SessionPayload {
  uid: string;
  role: 'user' | 'admin';
  exp: number;
}

function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifySession(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  try {
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.uid || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  currentUser?: StoredUser;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const session = verifySession(token);
  if (session) {
    const db = getDb();
    const user = db.users.find((u) => u.id === session.uid);
    if (user) {
      req.currentUser = user;
    }
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    return;
  }
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required.' });
    return;
  }
  next();
}

function sanitizeText(input: unknown, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function sanitizeHttpUrl(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) return '';
  try {
    const parsed = new URL(input.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isHttpsRequest(req: Request): boolean {
  const xfProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  return req.secure || xfProto === 'https';
}

function getRequestHost(req: Request): string {
  const xfHost = String(req.headers['x-forwarded-host'] || '')
    .split(',')[0]
    .trim();
  return (xfHost || req.get('host') || '').trim();
}

function isPreviewOrLocalHost(host: string): boolean {
  const hostname = host.split(':')[0].toLowerCase();
  return (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.run.app')
  );
}

function resolveSiteBaseUrl(req: Request): string {
  const explicitPublic = process.env.PUBLIC_SITE_URL?.trim();
  if (explicitPublic && /^https?:\/\/[^/\s]+/i.test(explicitPublic)) {
    return explicitPublic.replace(/\/+$/, '');
  }
  const reqHost = getRequestHost(req);
  const proto = isHttpsRequest(req) ? 'https' : req.protocol || 'http';
  if (reqHost && !isPreviewOrLocalHost(reqHost)) {
    return `${proto}://${reqHost}`;
  }
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl && /^https?:\/\/[^/\s]+/i.test(appUrl)) {
    return appUrl.replace(/\/+$/, '');
  }
  return reqHost ? `${proto}://${reqHost}` : 'https://pricealerter.in';
}

// Bounded sliding-window rate limiter (prevents unbounded IP map growth)
function createRateLimiter(maxRequests: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  const MAX_TRACKED_IPS = 5000;
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    if (hits.size > MAX_TRACKED_IPS) {
      for (const [key, times] of hits.entries()) {
        if (times.every((t) => now - t >= windowMs)) {
          hits.delete(key);
        }
      }
      if (hits.size > MAX_TRACKED_IPS) {
        hits.clear();
      }
    }
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
      return;
    }
    recent.push(now);
    hits.set(ip, recent);
    next();
  };
}

const authRateLimit = createRateLimiter(25, 60_000);
const apiRateLimit = createRateLimiter(300, 60_000);
const logoRateLimit = createRateLimiter(600, 60_000);

function setSessionCookie(req: Request, res: Response, user: StoredUser): void {
  const token = signSession({
    uid: user.id,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const secureCookie = isHttpsRequest(req) && process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function buildProductionCsp(isHttps: boolean): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://*.adtrafficquality.google https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://ajax.cloudflare.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://pagead2.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google https://www.google-analytics.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
    "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.adtrafficquality.google https://www.google.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self' https://aistudio.google.com https://*.google.com",
  ];
  if (isHttps) {
    directives.push('upgrade-insecure-requests');
  }
  return directives.join('; ');
}

function getExtraCorsOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(req: Request, originHeader: string): boolean {
  try {
    const originUrl = new URL(originHeader);
    const originHost = originUrl.host.toLowerCase();
    const reqHost = getRequestHost(req).toLowerCase();
    if (reqHost && originHost === reqHost) return true;
    for (const candidate of [
      process.env.PUBLIC_SITE_URL,
      process.env.APP_URL,
      ...getExtraCorsOrigins(),
    ]) {
      if (candidate) {
        try {
          if (new URL(candidate).host.toLowerCase() === originHost) return true;
        } catch {
          // ignore malformed env url
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Block accidental direct requests to backend/config source paths before Vite/static middleware
  app.use((req, res, next) => {
    const p = req.path.toLowerCase();
    if (
      p.startsWith('/server') ||
      p.startsWith('/tests') ||
      p.startsWith('/.env') ||
      p.startsWith('/.git') ||
      p === '/package.json' ||
      p === '/package-lock.json' ||
      p === '/tsconfig.json' ||
      p === '/metadata.json' ||
      p === '/vite.config.ts'
    ) {
      res.status(404).end();
      return;
    }
    next();
  });

  // Security, HSTS, CSP & privacy headers
  app.use((req, res, next) => {
    const https = isHttpsRequest(req);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    );
    res.setHeader('X-DNS-Prefetch-Control', 'on');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    if (https && process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api/')) {
      res.setHeader('Content-Security-Policy', buildProductionCsp(https));
    }
    next();
  });

  // CORS & CSRF Origin verification on API requests (supports same-origin + optional CORS_ALLOWED_ORIGINS)
  app.use('/api', (req, res, next) => {
    const origin = req.get('origin');
    if (origin && isAllowedOrigin(req, origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
    }
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      if (origin && !isAllowedOrigin(req, origin)) {
        res.status(403).json({ error: 'Cross-origin request blocked by security policy.' });
        return;
      }
    }
    if (
      req.path !== '/health' &&
      req.path !== '/stream/market' &&
      req.path !== '/company-logo'
    ) {
      apiRateLimit(req, res, next);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(attachUser);

  // Initialize database on startup and warm up live IPO & equity feeds
  getDb();
  void refreshIposFromProvider().catch(() => {});

  // --- Health & Automation Telemetry ---
  app.get('/api/health', (_req, res) => {
    const db = getDb();
    const uni = getLiveUniverseSnapshot();
    const auto = getAutomationStatus();
    res.json({
      status: 'ok',
      platform: 'PriceAlerter',
      timestamp: new Date().toISOString(),
      automation: {
        running: auto.running,
        marketSession: auto.marketSession,
        istTimeLabel: auto.istTimeLabel,
      },
      counts: {
        ipos: db.ipos.filter((i) => !i.archived).length,
        stocks: uni.stocks.length,
        indices: db.indices.length,
        blogs: db.blogs.length,
      },
    });
  });

  app.get('/api/public-config', (req, res) => {
    const rawId = (
      process.env.VITE_ADSENSE_CLIENT_ID ||
      process.env.ADSENSE_PUBLISHER_ID ||
      ''
    ).trim();
    const match = rawId.match(/^(?:ca-)?(pub-\d{10,20})$/);
    const validClient = match ? `ca-${match[1]}` : null;
    res.json({
      adsenseClientId: validClient,
      appUrl: process.env.APP_URL || null,
      siteUrl: resolveSiteBaseUrl(req),
    });
  });

  app.get('/api/automation/status', (_req, res) => {
    res.json(getAutomationStatus());
  });

  app.get('/api/stream/market', (req, res) => {
    const cleanup = registerSseClient(res);
    req.on('close', cleanup);
  });

  // --- Google AdSense ads.txt, SEO Sitemap & Robots ---
  app.get('/ads.txt', (_req, res) => {
    const rawPub = (
      process.env.ADSENSE_PUBLISHER_ID ||
      process.env.VITE_ADSENSE_CLIENT_ID ||
      ''
    ).trim();
    const pubMatch = rawPub.match(/(?:ca-)?(pub-\d{10,20})/);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (pubMatch) {
      res.type('text/plain').send(`google.com, ${pubMatch[1]}, DIRECT, f08c47fec0942fa0\n`);
      return;
    }
    res
      .type('text/plain')
      .send(
        '# PriceAlerter ads.txt\n# Set ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX in deployment environment variables after AdSense approval.\n'
      );
  });

  app.get('/robots.txt', (req, res) => {
    const base = resolveSiteBaseUrl(req);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type('text/plain').send(
      [
        'User-agent: Mediapartners-Google',
        'Allow: /',
        '',
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /api/',
        `Sitemap: ${base}/sitemap.xml`,
        '',
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const db = getDb();
    const uni = getLiveUniverseSnapshot();
    const base = resolveSiteBaseUrl(req);
    const today = new Date().toISOString().slice(0, 10);
    const staticRoutes = [
      '/',
      '/ipo',
      '/ipo/mainboard',
      '/ipo/sme',
      '/ipo/upcoming',
      '/ipo/open',
      '/ipo/closed',
      '/ipo/listed',
      '/gmp',
      '/live-prices',
      '/nse-stocks',
      '/bse-stocks',
      '/listed',
      '/stock-screener',
      '/calendar',
      '/market-insights',
      '/blog',
      '/calculators',
      '/about',
      '/contact',
      '/privacy',
      '/cookies',
      '/terms',
      '/disclaimer',
      '/editorial-policy',
    ];
    const stockPaths = Array.from(
      new Set([
        ...db.stocks.map((s) => s.symbol),
        ...uni.stocks.slice(0, 500).map((s) => s.symbol),
      ])
    ).map((sym) => `/stock/${encodeURIComponent(sym)}`);

    const dynamicRoutes = [
      ...db.ipos.filter((i) => !i.archived).map((i) => `/ipo/${encodeURIComponent(i.slug)}`),
      ...db.ipos.filter((i) => !i.archived).map((i) => `/gmp/${encodeURIComponent(i.slug)}`),
      ...stockPaths,
      ...db.insights.map((m) => `/market-insights/${encodeURIComponent(m.slug)}`),
      ...db.blogs.map((b) => `/blog/${encodeURIComponent(b.slug)}`),
    ];
    const uniqueRoutes = Array.from(new Set([...staticRoutes, ...dynamicRoutes]));
    const urls = uniqueRoutes
      .map((u) => {
        const priority =
          u === '/' ? '1.0' : staticRoutes.includes(u) ? '0.8' : '0.7';
        return `  <url><loc>${escapeXml(`${base}${u}`)}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>${priority}</priority></url>`;
      })
      .join('\n');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
    );
  });

  // --- Contact & Grievance Desk ---
  app.post('/api/contact', authRateLimit, (req, res) => {
    const { name, email, topic, message } = req.body as {
      name?: string;
      email?: string;
      topic?: string;
      message?: string;
    };
    const cleanName = sanitizeText(name, 80);
    const cleanEmail = sanitizeText(email, 120).toLowerCase();
    const cleanMessage = sanitizeText(message, 2000);
    const validTopics = [
      'Data Correction',
      'IPO Verification',
      'Privacy & Cookie Request',
      'Advertising',
      'General',
    ] as const;
    const cleanTopic = validTopics.includes(topic as (typeof validTopics)[number])
      ? (topic as (typeof validTopics)[number])
      : 'General';

    if (cleanName.length < 2) {
      res.status(400).json({ error: 'Please enter your name (at least 2 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (cleanMessage.length < 10) {
      res.status(400).json({ error: 'Please enter a message of at least 10 characters.' });
      return;
    }

    const db = getDb();
    const ticket = {
      id: createId('msg'),
      name: cleanName,
      email: cleanEmail,
      topic: cleanTopic,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      status: 'RECEIVED' as const,
    };
    db.contactMessages.unshift(ticket);
    if (db.contactMessages.length > 500) {
      db.contactMessages = db.contactMessages.slice(0, 500);
    }
    saveDb();
    res.status(201).json({
      ticketId: ticket.id,
      receivedAt: ticket.createdAt,
      message: 'Your inquiry has been logged with our editorial and compliance desk.',
    });
  });

  // --- Market Indices ---
  app.get('/api/market/indices', async (req, res) => {
    const force = req.query.refresh === '1';
    const result = await refreshIndicesFromProvider(force);
    res.json({
      indices: result.indices,
      liveFeedReachable: result.liveFeedReachable,
      retrievedAt: new Date().toISOString(),
    });
  });

  // --- IPOs (Live Real Indian Mainboard & SME Registry) ---
  app.get('/api/ipos', async (req, res) => {
    const force = req.query.refresh === '1';
    const allIpos = await refreshIposFromProvider(force);
    const { category, status, q, includeArchived } = req.query;
    let items = allIpos.filter((i) => (includeArchived === '1' ? true : !i.archived));

    if (typeof category === 'string' && category && category !== 'All') {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }
    if (typeof status === 'string' && status && status !== 'All') {
      items = items.filter((i) => i.status.toLowerCase() === status.toLowerCase());
    }
    if (typeof q === 'string' && q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.companyName.toLowerCase().includes(needle) ||
          i.shortName.toLowerCase().includes(needle) ||
          i.sector.toLowerCase().includes(needle) ||
          i.industry.toLowerCase().includes(needle) ||
          i.slug.toLowerCase().includes(needle)
      );
    }

    res.json({ ipos: items, total: items.length });
  });

  app.get('/api/ipos/:slug', async (req, res) => {
    const ipo = await getIpoBySlugLive(req.params.slug);
    if (!ipo) {
      res.status(404).json({ error: 'IPO record not found.' });
      return;
    }
    res.json({ ipo });
  });

  // --- Stocks (All NSE & BSE Live Universe) ---
  app.get('/api/stocks', async (req, res) => {
    const {
      exchange,
      sector,
      q,
      mcapTier,
      tab,
      sortBy,
      sortDir,
      page,
      limit,
      refresh,
    } = req.query;

    const result = await queryAllIndianStocks({
      exchange: typeof exchange === 'string' ? exchange : undefined,
      sector: typeof sector === 'string' ? sector : undefined,
      q: typeof q === 'string' ? q : undefined,
      mcapTier:
        mcapTier === 'Large' || mcapTier === 'Mid' || mcapTier === 'Small'
          ? mcapTier
          : 'All',
      tab: typeof tab === 'string' ? tab : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      sortDir: sortDir === 'asc' ? 'asc' : 'desc',
      page: typeof page === 'string' ? Math.max(1, parseInt(page, 10) || 1) : 1,
      limit: typeof limit === 'string' ? Math.max(1, parseInt(limit, 10) || 100) : 100,
      refresh: refresh === '1',
    });

    res.json(result);
  });

  app.get('/api/stocks/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const range = typeof req.query.range === 'string' ? req.query.range : '3mo';
    const { stock, fromUpstream } = await refreshStockBySymbol(symbol, range);
    if (!stock) {
      res.status(404).json({
        error: `Security "${symbol.toUpperCase()}" is unavailable from the connected NSE/BSE feed right now.`,
      });
      return;
    }
    const db = getDb();
    const linkedIpo = stock.ipoHistorySlug
      ? db.ipos.find((i) => i.slug === stock.ipoHistorySlug) ?? null
      : db.ipos.find(
          (i) =>
            i.listing.stockSymbol?.toUpperCase() === stock.symbol.toUpperCase() ||
            (stock.bseCode && stock.bseCode !== 'N/A' && i.listing.stockSymbol === stock.bseCode)
        ) ?? null;
    res.json({ stock, fromUpstream, linkedIpo });
  });

  // --- Cached Company Logo Proxy & Monogram Emblem Generator (Zero 404s) ---
  const LOGO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const LOGO_FALLBACK_TTL_MS = 6 * 60 * 60 * 1000;
  const MAX_LOGO_CACHE = 2500;
  const companyLogoCache = new Map<
    string,
    { contentType: string; data: Buffer; fetchedAt: number; isFallback: boolean }
  >();
  const ALLOWED_LOGO_HOSTS = new Set([
    'assets-netstorage.groww.in',
    'groww.in',
    'static.tickertape.in',
    'images.dhan.co',
    'cdn.zerodha.com',
  ]);
  const LOGO_STOP_WORDS = new Set([
    'LTD',
    'LIMITED',
    'PVT',
    'PRIVATE',
    'INDIA',
    'THE',
    'AND',
    'OF',
    'CO',
    'CORP',
    'IPO',
    'PLC',
    'INC',
  ]);
  const LOGO_PALETTE = [
    '#14263F',
    '#0F4C81',
    '#059669',
    '#1D4ED8',
    '#334155',
    '#0E7490',
    '#4338CA',
    '#1E3A5F',
  ];

  function computeMonogramAndColor(name: string, symbol: string, colorHint?: string): {
    initials: string;
    bg: string;
  } {
    const cleanSource = (name || symbol || 'IN').replace(/[^A-Za-z0-9\s&.-]/g, ' ').trim();
    const words = cleanSource
      .split(/\s+/)
      .filter((w) => w && !LOGO_STOP_WORDS.has(w.toUpperCase()));
    let initials = '';
    if (words.length >= 2) {
      initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      initials = words[0].slice(0, 2).toUpperCase();
    } else {
      const alpha = (symbol && !/^\d+$/.test(symbol) ? symbol : cleanSource).replace(/[^A-Za-z0-9]/g, '');
      initials = (alpha.slice(0, 2) || 'EQ').toUpperCase();
    }

    const validHex = colorHint && /^#[0-9a-fA-F]{6}$/.test(colorHint) ? colorHint : null;
    let hash = 0;
    const seed = cleanSource || symbol || 'IN';
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const bg = validHex || LOGO_PALETTE[hash % LOGO_PALETTE.length];
    return { initials, bg };
  }

  function escapeSvgText(txt: string): string {
    return txt.replace(/[<>&'"]/g, '');
  }

  function buildLogoSvgBuffer(initials: string, bg: string): Buffer {
    const safeInitials = escapeSvgText(initials.slice(0, 2) || 'EQ');
    const safeBg = /^#[0-9a-fA-F]{6}$/.test(bg) ? bg : '#14263F';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" role="img" aria-label="${safeInitials}"><rect width="80" height="80" rx="16" fill="${safeBg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="30" font-weight="700" letter-spacing="0.5">${safeInitials}</text></svg>`;
    return Buffer.from(svg, 'utf8');
  }

  async function tryFetchUpstreamLogo(candidateUrl: string): Promise<{
    contentType: string;
    data: Buffer;
  } | null> {
    try {
      const parsed = new URL(candidateUrl);
      if (parsed.protocol !== 'https:' || !ALLOWED_LOGO_HOSTS.has(parsed.hostname)) {
        return null;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2800);
      try {
        const upstream = await fetch(parsed.toString(), {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PriceAlerter/1.0)',
            Accept: 'image/webp,image/png,image/jpeg,image/svg+xml,image/*;q=0.8',
          },
        });
        if (!upstream.ok) return null;
        const ct = (upstream.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
        if (!ct.startsWith('image/')) return null;
        const arr = Buffer.from(await upstream.arrayBuffer());
        if (arr.length < 80) return null;
        return { contentType: ct, data: arr };
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return null;
    }
  }

  app.get('/api/company-logo', logoRateLimit, async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    const rawSym = typeof req.query.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : '';
    const rawBse = typeof req.query.bseCode === 'string' ? req.query.bseCode.trim() : '';
    const rawSearchId = typeof req.query.searchId === 'string' ? req.query.searchId.trim() : '';
    const rawName = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    const rawColor = typeof req.query.color === 'string' ? req.query.color.trim() : '';

    const alphaSym =
      rawSym && !/^\d+$/.test(rawSym) && /^[A-Z0-9&-]{1,24}$/.test(rawSym) ? rawSym : '';
    const bse6 = /^\d{6}$/.test(rawBse)
      ? rawBse
      : /^\d{6}$/.test(rawSym)
        ? rawSym
        : '';

    const { initials, bg } = computeMonogramAndColor(rawName, alphaSym || rawSym, rawColor);
    const cacheKey = `${rawUrl}|${alphaSym}|${bse6}|${rawSearchId}|${initials}|${bg}`;

    const cached = companyLogoCache.get(cacheKey);
    if (cached) {
      const ttl = cached.isFallback ? LOGO_FALLBACK_TTL_MS : LOGO_CACHE_TTL_MS;
      if (Date.now() - cached.fetchedAt < ttl) {
        res.setHeader('Cache-Control', `public, max-age=${cached.isFallback ? 21600 : 86400}`);
        res.setHeader('X-Logo-Fallback', cached.isFallback ? '1' : '0');
        res.type(cached.contentType).send(cached.data);
        return;
      }
    }

    const candidates: string[] = [];
    const normalizedExplicit = normalizeGrowwLogoUrl(rawUrl);
    if (normalizedExplicit) candidates.push(normalizedExplicit);
    if (alphaSym) {
      candidates.push(
        `https://assets-netstorage.groww.in/stock-assets/logos2/${encodeURIComponent(alphaSym)}.webp`
      );
    }
    if (bse6) {
      candidates.push(`https://assets-netstorage.groww.in/stock-assets/logos/GSTK${bse6}.png`);
    }

    let resolved: { contentType: string; data: Buffer } | null = null;
    for (const url of candidates) {
      resolved = await tryFetchUpstreamLogo(url);
      if (resolved) break;
    }

    if (!resolved && rawSearchId) {
      const searchLogo = await resolveGrowwLogoBySearchId(rawSearchId);
      if (searchLogo && !candidates.includes(searchLogo)) {
        resolved = await tryFetchUpstreamLogo(searchLogo);
      }
    }

    const entry = resolved
      ? {
          contentType: resolved.contentType,
          data: resolved.data,
          fetchedAt: Date.now(),
          isFallback: false,
        }
      : {
          contentType: 'image/svg+xml',
          data: buildLogoSvgBuffer(initials, bg),
          fetchedAt: Date.now(),
          isFallback: true,
        };

    if (companyLogoCache.size >= MAX_LOGO_CACHE) {
      const firstKey = companyLogoCache.keys().next().value;
      if (firstKey) companyLogoCache.delete(firstKey);
    }
    companyLogoCache.set(cacheKey, entry);

    res.setHeader('Cache-Control', `public, max-age=${entry.isFallback ? 21600 : 86400}`);
    res.setHeader('X-Logo-Fallback', entry.isFallback ? '1' : '0');
    res.type(entry.contentType).send(entry.data);
  });

  // --- Global Search ---
  app.get('/api/search', async (req, res) => {
    const db = getDb();
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    if (!q) {
      res.json({ ipos: [], stocks: [], blogs: [], insights: [], sectors: [] });
      return;
    }
    const [universe, allIpos] = await Promise.all([
      syncAllIndianStocks(),
      refreshIposFromProvider(),
    ]);
    const ipos = allIpos
      .filter(
        (i) =>
          !i.archived &&
          (i.companyName.toLowerCase().includes(q) ||
            i.shortName.toLowerCase().includes(q) ||
            i.sector.toLowerCase().includes(q) ||
            i.slug.toLowerCase().includes(q))
      )
      .slice(0, 6);
    const stocks = universe
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          s.bseCode.toLowerCase().includes(q) ||
          s.isin.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
      )
      .slice(0, 12);
    const blogs = db.blogs
      .filter(
        (b) => b.title.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
      )
      .slice(0, 4);
    const insights = db.insights
      .filter(
        (m) => m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      )
      .slice(0, 4);
    const sectors = Array.from(new Set(universe.map((s) => s.sector)))
      .filter((sec) => sec.toLowerCase().includes(q))
      .slice(0, 4);

    res.json({ ipos, stocks, blogs, insights, sectors });
  });

  // --- Insights & Education ---
  app.get('/api/insights', (_req, res) => {
    const db = getDb();
    res.json({ insights: db.insights });
  });

  app.get('/api/insights/:slug', (req, res) => {
    const db = getDb();
    const insight = db.insights.find((m) => m.slug === req.params.slug);
    if (!insight) {
      res.status(404).json({ error: 'Market insight not found.' });
      return;
    }
    res.json({ insight });
  });

  app.get('/api/blogs', (_req, res) => {
    const db = getDb();
    res.json({ articles: db.blogs });
  });

  app.get('/api/blogs/:slug', (req, res) => {
    const db = getDb();
    const article = db.blogs.find((b) => b.slug === req.params.slug);
    if (!article) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    const related = db.blogs.filter((b) => article.relatedSlugs.includes(b.slug));
    res.json({ article, related });
  });

  // --- Authentication ---
  app.post('/api/auth/register', authRateLimit, async (req, res) => {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };
    const cleanName = sanitizeText(name, 80);
    const cleanEmail = sanitizeText(email, 120).toLowerCase();
    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({ error: 'Please provide your full name (at least 2 characters).' });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const db = getDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser: StoredUser = {
      id: createId('usr'),
      name: cleanName,
      email: cleanEmail,
      role: 'user',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      preferences: {
        emailAlerts: true,
        browserNotifications: false,
        ipoReminders: true,
        gmpAlerts: true,
      },
    };
    db.users.push(newUser);
    saveDb();
    setSessionCookie(req, res, newUser);
    res.status(201).json({ user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', authRateLimit, async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    setSessionCookie(req, res, user);
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttpsRequest(req) && process.env.NODE_ENV === 'production',
      path: '/',
    });
    res.json({ ok: true });
  });

  app.post('/api/auth/forgot-password', authRateLimit, (req, res) => {
    const { email } = req.body as { email?: string };
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Enter a valid registered email address.' });
      return;
    }
    // Never reveal whether email exists; record honest message
    res.json({
      message:
        'If an account matches this email, password reset instructions have been queued for verification.',
    });
  });

  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      res.json({ user: null });
      return;
    }
    res.json({ user: sanitizeUser(req.currentUser) });
  });

  app.patch('/api/auth/preferences', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { name, preferences } = req.body as {
      name?: string;
      preferences?: Partial<StoredUser['preferences']>;
    };
    const safeName = sanitizeText(name, 80);
    if (safeName.length >= 2) {
      user.name = safeName;
    }
    if (preferences && typeof preferences === 'object') {
      user.preferences = {
        emailAlerts:
          typeof preferences.emailAlerts === 'boolean'
            ? preferences.emailAlerts
            : user.preferences.emailAlerts,
        browserNotifications:
          typeof preferences.browserNotifications === 'boolean'
            ? preferences.browserNotifications
            : user.preferences.browserNotifications,
        ipoReminders:
          typeof preferences.ipoReminders === 'boolean'
            ? preferences.ipoReminders
            : user.preferences.ipoReminders,
        gmpAlerts:
          typeof preferences.gmpAlerts === 'boolean'
            ? preferences.gmpAlerts
            : user.preferences.gmpAlerts,
      };
    }
    saveDb();
    res.json({ user: sanitizeUser(user) });
  });

  // --- Watchlist ---
  app.get('/api/watchlist', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const items = db.watchlists.filter((w) => w.userId === req.currentUser!.id);
    res.json({ items });
  });

  app.post('/api/watchlist', requireAuth, (req: AuthedRequest, res) => {
    const { itemType, itemKey, label } = req.body as {
      itemType?: 'ipo' | 'stock';
      itemKey?: string;
      label?: string;
    };
    const cleanKey = sanitizeText(itemKey, 80);
    const cleanLabel = sanitizeText(label, 120);
    if (!itemType || !['ipo', 'stock'].includes(itemType) || !cleanKey) {
      res.status(400).json({ error: 'Invalid watchlist item payload.' });
      return;
    }
    const db = getDb();
    const existing = db.watchlists.find(
      (w) =>
        w.userId === req.currentUser!.id &&
        w.itemType === itemType &&
        w.itemKey.toLowerCase() === cleanKey.toLowerCase()
    );
    if (existing) {
      res.json({ item: existing, alreadyExists: true });
      return;
    }
    const entry = {
      id: createId('wl'),
      userId: req.currentUser!.id,
      itemType,
      itemKey: cleanKey,
      label: cleanLabel || cleanKey,
      createdAt: new Date().toISOString(),
    };
    db.watchlists.unshift(entry);
    saveDb();
    res.status(201).json({ item: entry });
  });

  app.delete('/api/watchlist/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const idx = db.watchlists.findIndex(
      (w) =>
        w.userId === req.currentUser!.id &&
        (w.id === req.params.id || w.itemKey.toLowerCase() === req.params.id.toLowerCase())
    );
    if (idx === -1) {
      res.status(404).json({ error: 'Watchlist item not found.' });
      return;
    }
    db.watchlists.splice(idx, 1);
    saveDb();
    res.json({ ok: true });
  });

  // --- Price Alerts ---
  app.get('/api/alerts', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const alerts = db.priceAlerts.filter((a) => a.userId === req.currentUser!.id);
    res.json({ alerts });
  });

  app.post('/api/alerts', requireAuth, async (req: AuthedRequest, res) => {
    const { symbol, conditionType, targetValue } = req.body as {
      symbol?: string;
      conditionType?: PriceAlertRule['conditionType'];
      targetValue?: number;
    };
    const cleanSymbol = typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';
    const numTarget = Number(targetValue);
    if (
      !cleanSymbol ||
      !conditionType ||
      !['PRICE_ABOVE', 'PRICE_BELOW', 'PCT_CHANGE_UP', 'PCT_CHANGE_DOWN'].includes(conditionType) ||
      !Number.isFinite(numTarget) ||
      numTarget <= 0
    ) {
      res.status(400).json({ error: 'Provide a valid stock symbol, condition, and positive target value.' });
      return;
    }

    await syncAllIndianStocks();
    let stock = findStockInUniverse(cleanSymbol);
    if (!stock) {
      const fetched = await refreshStockBySymbol(cleanSymbol, '1mo');
      stock = fetched.stock ?? undefined;
    }
    if (!stock) {
      res.status(404).json({ error: `Stock symbol "${cleanSymbol}" was not found on NSE or BSE.` });
      return;
    }

    const db = getDb();
    const now = new Date().toISOString();
    const rule: PriceAlertRule = {
      id: createId('alrt'),
      userId: req.currentUser!.id,
      symbol: stock.symbol,
      companyName: stock.companyName,
      conditionType,
      targetValue: Number(numTarget.toFixed(2)),
      baselinePrice: stock.currentPrice,
      enabled: true,
      status: 'ACTIVE',
      triggeredAt: null,
      triggeredPrice: null,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          timestamp: now,
          event: `Alert created (${conditionType.replace(/_/g, ' ')} ${numTarget})`,
          priceAtEvent: stock.currentPrice,
        },
      ],
    };

    db.priceAlerts.unshift(rule);
    saveDb();
    evaluatePriceAlerts();
    const fresh = db.priceAlerts.find((a) => a.id === rule.id) ?? rule;
    res.status(201).json({ alert: fresh });
  });

  app.patch('/api/alerts/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const alert = db.priceAlerts.find(
      (a) => a.id === req.params.id && a.userId === req.currentUser!.id
    );
    if (!alert) {
      res.status(404).json({ error: 'Price alert not found.' });
      return;
    }
    const { enabled, targetValue, conditionType } = req.body as {
      enabled?: boolean;
      targetValue?: number;
      conditionType?: PriceAlertRule['conditionType'];
    };
    const now = new Date().toISOString();
    if (typeof enabled === 'boolean') {
      alert.enabled = enabled;
      alert.status = enabled ? 'ACTIVE' : 'PAUSED';
      alert.history.unshift({
        timestamp: now,
        event: enabled ? 'Alert enabled' : 'Alert paused',
        priceAtEvent: null,
      });
    }
    if (typeof targetValue === 'number' && Number.isFinite(targetValue) && targetValue > 0) {
      alert.targetValue = Number(targetValue.toFixed(2));
      alert.status = alert.enabled ? 'ACTIVE' : 'PAUSED';
      alert.history.unshift({
        timestamp: now,
        event: `Target updated to ${alert.targetValue}`,
        priceAtEvent: null,
      });
    }
    if (
      conditionType &&
      ['PRICE_ABOVE', 'PRICE_BELOW', 'PCT_CHANGE_UP', 'PCT_CHANGE_DOWN'].includes(conditionType)
    ) {
      alert.conditionType = conditionType;
    }
    alert.updatedAt = now;
    saveDb();
    evaluatePriceAlerts();
    res.json({ alert });
  });

  app.delete('/api/alerts/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const idx = db.priceAlerts.findIndex(
      (a) => a.id === req.params.id && a.userId === req.currentUser!.id
    );
    if (idx === -1) {
      res.status(404).json({ error: 'Price alert not found.' });
      return;
    }
    db.priceAlerts.splice(idx, 1);
    saveDb();
    res.json({ ok: true });
  });

  app.post('/api/alerts/evaluate', requireAuth, async (_req, res) => {
    await syncAllIndianStocks(true);
    const triggered = evaluatePriceAlerts();
    res.json({ triggered });
  });

  // --- Notifications ---
  app.get('/api/notifications', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const notifications = db.notifications.filter((n) => n.userId === req.currentUser!.id);
    res.json({ notifications });
  });

  app.post('/api/notifications/:id/read', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const n = db.notifications.find(
      (item) => item.id === req.params.id && item.userId === req.currentUser!.id
    );
    if (!n) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }
    n.read = true;
    saveDb();
    res.json({ notification: n });
  });

  app.post('/api/notifications/read-all', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    db.notifications
      .filter((n) => n.userId === req.currentUser!.id)
      .forEach((n) => {
        n.read = true;
      });
    saveDb();
    res.json({ ok: true });
  });

  // --- Admin Protected Routes ---
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const db = getDb();
    res.json({
      stats: {
        totalIpos: db.ipos.length,
        activeIpos: db.ipos.filter((i) => !i.archived && i.status === 'Open').length,
        totalStocks: db.stocks.length,
        totalUsers: db.users.length,
        activeAlerts: db.priceAlerts.filter((a) => a.enabled && a.status === 'ACTIVE').length,
        auditLogCount: db.auditLogs.length,
      },
      dataSources: db.dataSources,
      importLogs: db.importLogs.slice(0, 20),
      users: db.users.map(sanitizeUser),
    });
  });

  app.post('/api/admin/ipos', requireAdmin, (req: AuthedRequest, res) => {
    const body = req.body as Partial<IPOOffering>;
    const cleanCompanyName = sanitizeText(body.companyName, 140);
    if (
      !cleanCompanyName ||
      !body.category ||
      !['Mainboard', 'SME'].includes(body.category) ||
      !body.status ||
      !['Upcoming', 'Open', 'Closed', 'Listed'].includes(body.status)
    ) {
      res.status(400).json({ error: 'Valid companyName, category, and status are required.' });
      return;
    }
    const db = getDb();
    const slug =
      sanitizeText(body.slug, 100)
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '') ||
      cleanCompanyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    if (db.ipos.some((i) => i.slug === slug)) {
      res.status(409).json({ error: 'An IPO with this slug already exists.' });
      return;
    }
    const now = new Date().toISOString();
    const priceHigh = body.priceBandHigh ?? null;
    const lotSize = body.lotSize ?? null;
    const newIpo: IPOOffering = {
      id: createId('ipo'),
      slug,
      companyName: cleanCompanyName,
      shortName:
        sanitizeText(body.shortName, 60) ||
        cleanCompanyName.split(' ').slice(0, 2).join(' '),
      logoMonogram: cleanCompanyName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join(''),
      logoColor: '#14263F',
      sector: sanitizeText(body.sector, 60) || 'Diversified',
      industry: sanitizeText(body.industry, 60) || 'General',
      category: body.category,
      status: body.status,
      exchanges: body.exchanges?.length ? body.exchanges : ['NSE', 'BSE'],
      website: sanitizeHttpUrl(body.website),
      registrar: sanitizeText(body.registrar, 100) || 'KFin Technologies Ltd',
      registrarUrl:
        sanitizeHttpUrl(body.registrarUrl) || 'https://ris.kfintech.com/ipostatus/',
      issueSizeCr: body.issueSizeCr ?? null,
      freshIssueCr: body.freshIssueCr ?? null,
      ofsCr: body.ofsCr ?? null,
      priceBandLow: body.priceBandLow ?? null,
      priceBandHigh: priceHigh,
      lotSize,
      minInvestment: priceHigh && lotSize ? priceHigh * lotSize : null,
      dates: body.dates || {
        openDate: null,
        closeDate: null,
        allotmentDate: null,
        refundDate: null,
        dematCreditDate: null,
        listingDate: null,
      },
      subscription: {
        qib: null,
        nii: null,
        retail: null,
        employee: null,
        shareholder: null,
        total: null,
        isFinal: false,
        dailyBreakdown: [],
        provenance: {
          source: 'Admin Entry',
          retrievedAt: now,
          effectiveDate: now.slice(0, 10),
          verificationStatus: 'Provisional',
          qualityStatus: 'UNAVAILABLE',
          currency: 'PTS',
          unit: 'Times Subscribed (x)',
          dataCategory: 'IPO Subscription',
        },
      },
      gmp: {
        latestGmp: null,
        previousGmp: null,
        lastUpdated: null,
        availability: 'Unavailable',
        source: 'Unavailable',
        history: [],
      },
      listing: {
        issuePrice: priceHigh,
        actualListingPrice: null,
        listingExchange: null,
        stockSymbol: null,
        currentMarketPrice: null,
        previousClose: null,
        listingDate: body.dates?.listingDate ?? null,
        priceStatus: 'UNAVAILABLE',
        provenance: {
          source: 'Pending Listing',
          retrievedAt: now,
          effectiveDate: now.slice(0, 10),
          verificationStatus: 'Unverified',
          qualityStatus: 'UNAVAILABLE',
          currency: 'INR',
          unit: 'INR per share',
          dataCategory: 'IPO Listing',
        },
      },
      financials: { reportingBasis: 'RHP Restated Financials', years: [] },
      valuation: {
        peRatio: null,
        pbRatio: null,
        marketCapCr: null,
        eps: null,
        industryAvgPe: null,
        reportingPeriod: 'Pending Filing',
        calculationBasis: 'Pending final RHP data',
        peers: [],
      },
      profile: {
        overview: body.profile?.overview || 'Offer document overview pending editorial verification.',
        productsAndServices: 'Pending verification',
        businessModel: 'Pending verification',
        industryOverview: 'Pending verification',
        competitivePosition: 'Pending verification',
        promoters: [],
        growthOpportunities: [],
        strengths: [],
        risks: [],
      },
      documents: {
        drhpUrl: null,
        rhpUrl: null,
        prospectusUrl: null,
        anchorUrl: null,
        allotmentUrl: null,
        exchangeNoticeUrl: null,
      },
      provenance: {
        source: 'Admin Console Entry',
        retrievedAt: now,
        effectiveDate: now.slice(0, 10),
        verificationStatus: 'Provisional',
        qualityStatus: 'UNDER_REVIEW',
        currency: 'INR',
        unit: 'INR / Crores',
        dataCategory: `${body.category} IPO`,
      },
    };
    db.ipos.unshift(newIpo);
    saveDb();
    appendAuditLog({
      actorEmail: req.currentUser!.email,
      actorRole: req.currentUser!.role,
      entityType: 'IPO',
      entityId: newIpo.slug,
      action: 'CREATE_IPO',
      previousValue: 'None',
      newValue: `${newIpo.companyName} (${newIpo.category} / ${newIpo.status})`,
      source: 'Admin Console',
      verificationStatus: 'Provisional',
    });
    res.status(201).json({ ipo: newIpo });
  });

  app.patch('/api/admin/ipos/:id', requireAdmin, (req: AuthedRequest, res) => {
    const db = getDb();
    const ipo = db.ipos.find((i) => i.id === req.params.id || i.slug === req.params.id);
    if (!ipo) {
      res.status(404).json({ error: 'IPO not found.' });
      return;
    }
    const prevStatus = ipo.status;
    const prevBand = `${ipo.priceBandLow ?? '-'}-${ipo.priceBandHigh ?? '-'}`;
    const updates = req.body as Partial<IPOOffering>;
    if (updates.status) ipo.status = updates.status;
    if (updates.priceBandLow !== undefined) ipo.priceBandLow = updates.priceBandLow;
    if (updates.priceBandHigh !== undefined) {
      ipo.priceBandHigh = updates.priceBandHigh;
      ipo.listing.issuePrice = updates.priceBandHigh;
      if (ipo.lotSize && updates.priceBandHigh) {
        ipo.minInvestment = ipo.lotSize * updates.priceBandHigh;
      }
    }
    if (updates.issueSizeCr !== undefined) ipo.issueSizeCr = updates.issueSizeCr;
    saveDb();
    appendAuditLog({
      actorEmail: req.currentUser!.email,
      actorRole: req.currentUser!.role,
      entityType: 'IPO',
      entityId: ipo.slug,
      action: 'UPDATE_IPO',
      previousValue: `status=${prevStatus}, band=${prevBand}`,
      newValue: `status=${ipo.status}, band=${ipo.priceBandLow ?? '-'}-${ipo.priceBandHigh ?? '-'}`,
      source: 'Admin Console',
      verificationStatus: 'Verified',
    });
    res.json({ ipo });
  });

  app.post('/api/admin/ipos/:id/archive', requireAdmin, (req: AuthedRequest, res) => {
    const db = getDb();
    const ipo = db.ipos.find((i) => i.id === req.params.id || i.slug === req.params.id);
    if (!ipo) {
      res.status(404).json({ error: 'IPO not found.' });
      return;
    }
    const prev = Boolean(ipo.archived);
    ipo.archived = !prev;
    saveDb();
    appendAuditLog({
      actorEmail: req.currentUser!.email,
      actorRole: req.currentUser!.role,
      entityType: 'IPO',
      entityId: ipo.slug,
      action: ipo.archived ? 'ARCHIVE_IPO' : 'RESTORE_IPO',
      previousValue: String(prev),
      newValue: String(ipo.archived),
      source: 'Admin Console',
      verificationStatus: 'Verified',
    });
    res.json({ ipo });
  });

  app.post('/api/admin/ipos/:id/gmp', requireAdmin, (req: AuthedRequest, res) => {
    const db = getDb();
    const ipo = db.ipos.find((i) => i.id === req.params.id || i.slug === req.params.id);
    if (!ipo) {
      res.status(404).json({ error: 'IPO not found.' });
      return;
    }
    const { gmpValue, source, note } = req.body as {
      gmpValue?: number | null;
      source?: string;
      note?: string;
    };
    const prev = ipo.gmp.latestGmp === null ? 'Unavailable' : `₹${ipo.gmp.latestGmp}`;
    const now = new Date().toISOString();

    if (gmpValue === null || gmpValue === undefined) {
      ipo.gmp.previousGmp = ipo.gmp.latestGmp;
      ipo.gmp.latestGmp = null;
      ipo.gmp.availability = 'Unavailable';
      ipo.gmp.lastUpdated = now;
      ipo.gmp.source = source || 'Marked Unavailable by Admin';
    } else {
      const parsed = Number(gmpValue);
      if (!Number.isFinite(parsed)) {
        res.status(400).json({ error: 'Invalid GMP value.' });
        return;
      }
      ipo.gmp.previousGmp = ipo.gmp.latestGmp;
      ipo.gmp.latestGmp = parsed;
      ipo.gmp.availability = 'Available';
      ipo.gmp.lastUpdated = now;
      ipo.gmp.source = source || 'Unofficial Grey Market Trackers (Indicative)';
      ipo.gmp.history.push({
        date: now.slice(0, 10),
        gmp: parsed,
        note: note || undefined,
      });
    }
    saveDb();
    appendAuditLog({
      actorEmail: req.currentUser!.email,
      actorRole: req.currentUser!.role,
      entityType: 'GMP',
      entityId: ipo.slug,
      action: 'UPDATE_GMP',
      previousValue: prev,
      newValue: ipo.gmp.latestGmp === null ? 'Unavailable' : `₹${ipo.gmp.latestGmp}`,
      source: ipo.gmp.source,
      verificationStatus: 'Provisional',
    });
    res.json({ ipo });
  });

  app.post('/api/admin/ipos/:id/listing', requireAdmin, (req: AuthedRequest, res) => {
    const db = getDb();
    const ipo = db.ipos.find((i) => i.id === req.params.id || i.slug === req.params.id);
    if (!ipo) {
      res.status(404).json({ error: 'IPO not found.' });
      return;
    }
    const { actualListingPrice, listingExchange, stockSymbol, currentMarketPrice } = req.body as {
      actualListingPrice?: number;
      listingExchange?: 'NSE' | 'BSE';
      stockSymbol?: string;
      currentMarketPrice?: number;
    };
    if (typeof actualListingPrice !== 'number' || !Number.isFinite(actualListingPrice) || actualListingPrice <= 0) {
      res.status(400).json({ error: 'Valid positive actualListingPrice is required.' });
      return;
    }
    const prev = ipo.listing.actualListingPrice === null ? 'Unavailable' : `₹${ipo.listing.actualListingPrice}`;
    const now = new Date().toISOString();
    ipo.status = 'Listed';
    ipo.listing.actualListingPrice = Number(actualListingPrice.toFixed(2));
    ipo.listing.listingExchange = listingExchange || ipo.exchanges[0] || 'NSE';
    ipo.listing.stockSymbol = stockSymbol?.trim().toUpperCase() || ipo.listing.stockSymbol;
    if (typeof currentMarketPrice === 'number' && Number.isFinite(currentMarketPrice)) {
      ipo.listing.currentMarketPrice = Number(currentMarketPrice.toFixed(2));
    } else if (ipo.listing.currentMarketPrice === null) {
      ipo.listing.currentMarketPrice = ipo.listing.actualListingPrice;
    }
    ipo.listing.priceStatus = 'VERIFIED';
    ipo.listing.provenance = {
      source: `${ipo.listing.listingExchange} Official Listing Circular (Admin Verified)`,
      retrievedAt: now,
      effectiveDate: ipo.listing.listingDate || now.slice(0, 10),
      verificationStatus: 'Verified',
      qualityStatus: 'VERIFIED',
      currency: 'INR',
      unit: 'INR per share',
      dataCategory: 'Verified Listing Price',
    };
    saveDb();
    appendAuditLog({
      actorEmail: req.currentUser!.email,
      actorRole: req.currentUser!.role,
      entityType: 'IPO',
      entityId: ipo.slug,
      action: 'VERIFY_LISTING_PRICE',
      previousValue: prev,
      newValue: `₹${ipo.listing.actualListingPrice} (${ipo.listing.listingExchange})`,
      source: ipo.listing.provenance.source,
      verificationStatus: 'Verified',
    });
    res.json({ ipo });
  });

  app.get('/api/admin/audit-logs', requireAdmin, (_req, res) => {
    const db = getDb();
    res.json({ logs: db.auditLogs });
  });

  app.get('/api/admin/data-sources', requireAdmin, (_req, res) => {
    const db = getDb();
    res.json({ dataSources: db.dataSources });
  });

  app.post('/api/admin/data-sources/refresh', requireAdmin, async (req: AuthedRequest, res) => {
    const [idxResult, universe, ipos] = await Promise.all([
      refreshIndicesFromProvider(true),
      syncAllIndianStocks(true),
      refreshIposFromProvider(true),
    ]);
    const db = getDb();
    appendAuditLog({
      actorEmail: req.currentUser!.email,
      actorRole: req.currentUser!.role,
      entityType: 'DATA_SOURCE',
      entityId: 'src-nse-bse',
      action: 'MANUAL_FEED_REFRESH',
      previousValue: 'Cached',
      newValue: `${universe.length} NSE/BSE stocks · ${ipos.length} live IPOs · Indices ${
        idxResult.liveFeedReachable ? 'Live' : 'Cached'
      }`,
      source: 'Admin Console',
      verificationStatus: 'Verified',
    });
    res.json({
      liveFeedReachable: idxResult.liveFeedReachable || universe.length > 0 || ipos.length > 0,
      dataSources: db.dataSources,
    });
  });

  app.get('/api/admin/export', requireAdmin, (_req, res) => {
    const db = getDb();
    res.json({
      exportedAt: new Date().toISOString(),
      ipos: db.ipos,
      stocks: db.stocks.map(({ historicalSeries: _h, ...rest }) => rest),
      auditLogs: db.auditLogs,
    });
  });

  app.post('/api/admin/import', requireAdmin, (req: AuthedRequest, res) => {
    const { importType, records } = req.body as {
      importType?: string;
      records?: Array<{ slug: string; latestGmp?: number }>;
    };
    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: 'Provide a non-empty records array.' });
      return;
    }
    const db = getDb();
    let updated = 0;
    const now = new Date().toISOString();
    for (const rec of records) {
      const ipo = db.ipos.find((i) => i.slug === rec.slug);
      if (ipo && typeof rec.latestGmp === 'number' && Number.isFinite(rec.latestGmp)) {
        ipo.gmp.previousGmp = ipo.gmp.latestGmp;
        ipo.gmp.latestGmp = rec.latestGmp;
        ipo.gmp.availability = 'Available';
        ipo.gmp.lastUpdated = now;
        ipo.gmp.history.push({ date: now.slice(0, 10), gmp: rec.latestGmp, note: 'Batch import' });
        updated += 1;
      }
    }
    db.importLogs.unshift({
      id: createId('imp'),
      actorEmail: req.currentUser!.email,
      timestamp: now,
      importType: importType || 'GMP_BATCH_JSON',
      recordsProcessed: updated,
      status: updated > 0 ? 'SUCCESS' : 'FAILED',
      notes: `Processed ${updated} matching IPO records out of ${records.length} submitted.`,
    });
    saveDb();
    appendAuditLog({
      actorEmail: req.currentUser!.email,
      actorRole: req.currentUser!.role,
      entityType: 'GMP',
      entityId: 'batch-import',
      action: 'BATCH_IMPORT',
      previousValue: '0',
      newValue: `${updated} records updated`,
      source: 'Admin Batch Import',
      verificationStatus: 'Provisional',
    });
    res.json({ updated, importLog: db.importLogs[0] });
  });

  function injectSeoHtml(rawHtml: string, req: Request): string {
    const base = resolveSiteBaseUrl(req);
    const cleanPath = req.path === '/' ? '/' : req.path.replace(/\/+$/, '');
    const canonicalUrl = `${base}${cleanPath}`;
    const db = getDb();
    const uni = getLiveUniverseSnapshot();

    let pageTitle = 'PriceAlerter – Indian IPO, GMP & NSE/BSE Market Intelligence';
    let pageDesc =
      'Discover upcoming Indian IPOs, track Grey Market Premium (GMP) history, monitor NSE and BSE listed companies, and analyse listing gains with PriceAlerter.';
    let noIndex = false;

    const noIndexPrefixes = ['/login', '/register', '/profile', '/watchlist', '/alerts', '/admin'];
    if (noIndexPrefixes.some((prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`))) {
      noIndex = true;
    } else if (cleanPath.startsWith('/ipo/')) {
      const slug = cleanPath.slice(5);
      const ipo = db.ipos.find((i) => i.slug === slug);
      if (ipo) {
        pageTitle = `${ipo.companyName} IPO – Price Band, GMP, Subscription & Valuation | PriceAlerter`;
        pageDesc = `Complete IPO research for ${ipo.companyName}: price band, issue size, subscription trend, 3-year financials, peer valuation, and official RHP links.`;
      }
    } else if (cleanPath.startsWith('/stock/')) {
      const sym = decodeURIComponent(cleanPath.slice(7)).toUpperCase();
      const stk =
        uni.stocks.find(
          (s) => s.symbol.toUpperCase() === sym || (s.bseCode && s.bseCode === sym)
        ) || db.stocks.find((s) => s.symbol.toUpperCase() === sym);
      if (stk) {
        pageTitle = `${stk.companyName} (${stk.symbol}) Live Share Price & Financials | PriceAlerter`;
        pageDesc = `Live NSE & BSE share price, circuit limits, financials, shareholding pattern, and peer comparison for ${stk.companyName}.`;
      }
    } else if (cleanPath.startsWith('/blog/')) {
      const slug = cleanPath.slice(6);
      const art = db.blogs.find((b) => b.slug === slug);
      if (art) {
        pageTitle = `${art.title} | PriceAlerter`;
        pageDesc = art.metaDescription;
      }
    } else if (cleanPath.startsWith('/market-insights/')) {
      const slug = cleanPath.slice('/market-insights/'.length);
      const ins = db.insights.find((m) => m.slug === slug);
      if (ins) {
        pageTitle = `${ins.title} | PriceAlerter`;
        pageDesc = ins.summary;
      }
    }

    const robotsContent = noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    const verificationToken = process.env.GOOGLE_SITE_VERIFICATION?.trim();
    const verificationMeta =
      verificationToken && /^[A-Za-z0-9_-]{8,128}$/.test(verificationToken)
        ? `<meta name="google-site-verification" content="${escapeHtmlAttr(verificationToken)}" />`
        : '';

    let html = rawHtml;
    html = html.replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${escapeHtmlAttr(pageTitle)}</title>`
    );
    html = html.replace(
      /<meta\s+name="description"[\s\S]*?\/>/i,
      `<meta name="description" content="${escapeHtmlAttr(pageDesc)}" />`
    );
    html = html.replace(
      /<meta\s+name="robots"[\s\S]*?\/>/i,
      `<meta name="robots" content="${robotsContent}" />`
    );
    html = html.replace(
      /<link\s+rel="canonical"[\s\S]*?\/>/i,
      `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:url"[\s\S]*?\/>/i,
      `<meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:title"[\s\S]*?\/>/i,
      `<meta property="og:title" content="${escapeHtmlAttr(pageTitle)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:description"[\s\S]*?\/>/i,
      `<meta property="og:description" content="${escapeHtmlAttr(pageDesc)}" />`
    );
    html = html.replace(
      /<meta\s+name="twitter:url"[\s\S]*?\/>/i,
      `<meta name="twitter:url" content="${escapeHtmlAttr(canonicalUrl)}" />`
    );
    html = html.replace(
      /<meta\s+name="twitter:title"[\s\S]*?\/>/i,
      `<meta name="twitter:title" content="${escapeHtmlAttr(pageTitle)}" />`
    );
    html = html.replace(
      /<meta\s+name="twitter:description"[\s\S]*?\/>/i,
      `<meta name="twitter:description" content="${escapeHtmlAttr(pageDesc)}" />`
    );
    html = html.replace('<!--GOOGLE_SITE_VERIFICATION_META-->', verificationMeta);
    html = html.replace(
      /<script id="pa-ld-json" type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script id="pa-ld-json" type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'PriceAlerter',
        url: base,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: pageDesc,
      }).replace(/</g, '\\u003c')}</script>`
    );
    return html;
  }

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // --- Vite / Production Static Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        index: false,
        maxAge: '7d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.setHeader('CDN-Cache-Control', 'no-store');
            res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      // Never return index.html for missing JS/CSS/font/image asset requests (prevents MIME white screen behind CDN)
      if (
        req.path.startsWith('/assets/') ||
        /\.(?:js|mjs|css|map|svg|png|jpe?g|webp|ico|woff2?|ttf|json|webmanifest|xml|txt)$/i.test(
          req.path
        )
      ) {
        res.status(404).end();
        return;
      }
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        const rawHtml = fs.readFileSync(indexFile, 'utf8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('CDN-Cache-Control', 'no-store');
        res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store');
        res.type('text/html').send(injectSeoHtml(rawHtml, req));
      } else {
        res.status(404).send('Build output missing. Run npm run build.');
      }
    });
  }

  // Safe global error handler (never leaks stack traces to clients)
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled API error:', err instanceof Error ? err.message : err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An internal server error occurred. Please try again.' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PriceAlerter server running on http://0.0.0.0:${PORT}`);
    startAutomationEngine();
  });
}

startServer();
