import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function cloudflareRocketLoaderSafePlugin(): Plugin {
  return {
    name: 'cloudflare-rocket-loader-safe',
    transformIndexHtml(html) {
      return html.replace(
        /<script\b(?![^>]*\bdata-cfasync=)([^>]*\btype="module"[^>]*)>/gi,
        '<script data-cfasync="false"$1>'
      );
    },
  };
}

function apiDevServerPlugin(): Plugin {
  const middleware = (req: any, res: any, next: any) => {
    if (!req.url || (!req.url.startsWith('/api/') && req.url !== '/api')) {
      return next();
    }

    const urlObj = new URL(req.url, 'http://localhost');
    const pathname = urlObj.pathname;
    const dbPath = path.resolve(__dirname, 'server', 'data', 'db.json');
    const livePath = path.resolve(__dirname, 'public', 'data', 'live-market-data.json');

    const readDb = () => {
      if (fs.existsSync(dbPath)) {
        try {
          return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch {
          // ignore
        }
      }
      if (fs.existsSync(livePath)) {
        try {
          return JSON.parse(fs.readFileSync(livePath, 'utf8'));
        } catch {
          // ignore
        }
      }
      return null;
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (pathname === '/api/market/indices') {
      const db = readDb();
      res.end(
        JSON.stringify({
          indices: db?.indices || [],
          liveFeedReachable: true,
          retrievedAt: new Date().toISOString(),
        })
      );
      return;
    }

    if (pathname === '/api/stocks') {
      const db = readDb();
      let stocks = db?.stocks || db?.allLiveStocks || [];
      const exchange = urlObj.searchParams.get('exchange');
      const sector = urlObj.searchParams.get('sector');
      const mcapTier = urlObj.searchParams.get('mcapTier');
      const q = urlObj.searchParams.get('q')?.toLowerCase();
      const tab = urlObj.searchParams.get('tab');
      const page = Number(urlObj.searchParams.get('page')) || 1;
      const limit = Number(urlObj.searchParams.get('limit')) || 50;

      if (exchange && exchange !== 'All') {
        stocks = stocks.filter((s: any) => s.exchange === exchange || s.exchange === 'NSE/BSE');
      }
      if (sector && sector !== 'All') {
        stocks = stocks.filter((s: any) => s.sector?.toLowerCase() === sector.toLowerCase());
      }
      if (mcapTier && mcapTier !== 'All') {
        stocks = stocks.filter((s: any) => {
          const cap = s.marketCapCr || 0;
          if (mcapTier === 'Large') return cap >= 20000;
          if (mcapTier === 'Mid') return cap >= 5000 && cap < 20000;
          if (mcapTier === 'Small') return cap < 5000;
          return true;
        });
      }
      if (q) {
        stocks = stocks.filter(
          (s: any) =>
            s.symbol?.toLowerCase().includes(q) ||
            s.companyName?.toLowerCase().includes(q)
        );
      }
      const calcPct = (s: any) =>
        s.currentPrice && s.previousClose
          ? ((s.currentPrice - s.previousClose) / s.previousClose) * 100
          : 0;
      if (tab === 'gainers') {
        stocks = stocks.filter((s: any) => calcPct(s) > 0).sort((a: any, b: any) => calcPct(b) - calcPct(a));
      } else if (tab === 'losers') {
        stocks = stocks.filter((s: any) => calcPct(s) < 0).sort((a: any, b: any) => calcPct(a) - calcPct(b));
      }
      const total = stocks.length;
      const paginated = stocks.slice((page - 1) * limit, page * limit);
      const allDbStocks = db?.stocks || [];
      const sectors = Array.from(new Set(allDbStocks.map((s: any) => s.sector))).filter(Boolean).sort();
      res.end(
        JSON.stringify({
          stocks: paginated,
          total,
          totalUniverse: allDbStocks.length || total,
          nseCount: allDbStocks.filter((s: any) => s.exchange === 'NSE' || s.exchange === 'NSE/BSE').length,
          bseCount: allDbStocks.filter((s: any) => s.exchange === 'BSE' || s.exchange === 'NSE/BSE').length,
          sectors,
          liveFeedReachable: true,
          liveSyncedAt: new Date().toISOString(),
        })
      );
      return;
    }

    if (pathname.startsWith('/api/stocks/')) {
      const sym = decodeURIComponent(pathname.replace('/api/stocks/', '')).toLowerCase();
      const db = readDb();
      const stock = (db?.stocks || []).find(
        (s: any) => s.symbol?.toLowerCase() === sym || s.bseCode === sym
      );
      if (stock) {
        const linkedIpo =
          (db?.ipos || []).find(
            (i: any) =>
              i.listing?.stockSymbol?.toLowerCase() === sym || i.slug === stock.ipoHistorySlug
          ) || null;
        res.end(JSON.stringify({ stock, fromUpstream: false, linkedIpo }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `Stock symbol "${sym}" not found.` }));
      return;
    }

    if (pathname === '/api/ipos') {
      const db = readDb();
      let ipos = db?.ipos || [];
      const cat = urlObj.searchParams.get('category');
      const status = urlObj.searchParams.get('status');
      const q = urlObj.searchParams.get('q')?.toLowerCase();
      if (cat && cat !== 'All') ipos = ipos.filter((i: any) => i.category === cat);
      if (status && status !== 'All') {
        ipos = ipos.filter((i: any) => i.status?.toLowerCase() === status.toLowerCase());
      }
      if (q) ipos = ipos.filter((i: any) => i.companyName?.toLowerCase().includes(q));
      res.end(JSON.stringify({ ipos, total: ipos.length }));
      return;
    }

    if (pathname.startsWith('/api/ipos/')) {
      const slug = decodeURIComponent(pathname.replace('/api/ipos/', '')).toLowerCase();
      const db = readDb();
      const ipo = (db?.ipos || []).find((i: any) => i.slug?.toLowerCase() === slug);
      if (ipo) {
        res.end(JSON.stringify({ ipo }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `IPO "${slug}" not found.` }));
      return;
    }

    if (pathname === '/api/insights') {
      const db = readDb();
      res.end(JSON.stringify({ insights: db?.insights || [] }));
      return;
    }

    if (pathname.startsWith('/api/insights/')) {
      const slug = decodeURIComponent(pathname.replace('/api/insights/', '')).toLowerCase();
      const db = readDb();
      const insight = (db?.insights || []).find((item: any) => item.slug?.toLowerCase() === slug);
      if (insight) {
        res.end(JSON.stringify({ insight }));
        return;
      }
      res.end(JSON.stringify({ insight: db?.insights?.[0] || null }));
      return;
    }

    if (pathname === '/api/blogs') {
      const db = readDb();
      res.end(JSON.stringify({ articles: db?.blogs || [] }));
      return;
    }

    if (pathname.startsWith('/api/blogs/')) {
      const slug = decodeURIComponent(pathname.replace('/api/blogs/', '')).toLowerCase();
      const db = readDb();
      const blogs = db?.blogs || [];
      const article = blogs.find((item: any) => item.slug?.toLowerCase() === slug) || blogs[0] || null;
      const related = blogs.filter((item: any) => item.slug?.toLowerCase() !== slug).slice(0, 3);
      res.end(JSON.stringify({ article, related }));
      return;
    }

    if (pathname === '/api/search') {
      const q = urlObj.searchParams.get('q')?.toLowerCase() || '';
      const db = readDb();
      const stocks = (db?.stocks || [])
        .filter(
          (s: any) =>
            s.symbol?.toLowerCase().includes(q) || s.companyName?.toLowerCase().includes(q)
        )
        .slice(0, 10);
      const ipos = (db?.ipos || [])
        .filter((i: any) => i.companyName?.toLowerCase().includes(q))
        .slice(0, 10);
      const blogs = (db?.blogs || [])
        .filter((b: any) => b.title?.toLowerCase().includes(q))
        .slice(0, 5);
      const insights = (db?.insights || [])
        .filter((m: any) => m.title?.toLowerCase().includes(q))
        .slice(0, 5);
      res.end(JSON.stringify({ ipos, stocks, blogs, insights, sectors: [] }));
      return;
    }

    if (pathname === '/api/public-config') {
      res.end(JSON.stringify({ adsenseClientId: null, appUrl: null }));
      return;
    }

    if (pathname === '/api/automation/status') {
      res.end(
        JSON.stringify({
          running: true,
          startedAt: new Date().toISOString(),
          marketSession: 'POST_CLOSE',
          istTimeLabel: 'IST Market Intelligence Mode',
          liveClients: 1,
          pollIntervalsSec: { indices: 10, equitiesAndAlerts: 15, iposAndGmp: 60 },
          cycles: { indices: 100, equities: 50, ipos: 25, alertsEvaluated: 10, alertsTriggeredTotal: 0 },
          lastRunAt: {
            indices: new Date().toISOString(),
            equities: new Date().toISOString(),
            ipos: new Date().toISOString(),
            alerts: null,
          },
          lastError: null,
        })
      );
      return;
    }

    if (pathname === '/api/auth/me') {
      res.end(JSON.stringify({ user: null }));
      return;
    }

    if (pathname === '/api/auth/login' || pathname === '/api/auth/register') {
      res.end(
        JSON.stringify({
          user: {
            id: 'u-guest',
            email: 'investor@pricealerter.in',
            name: 'Market Intelligence Investor',
            role: 'user',
          },
          token: 'guest-preview-token',
        })
      );
      return;
    }

    if (pathname === '/api/auth/logout') {
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (pathname === '/api/watchlist') {
      res.end(JSON.stringify({ items: [] }));
      return;
    }

    if (pathname === '/api/alerts') {
      res.end(JSON.stringify({ alerts: [] }));
      return;
    }

    if (pathname === '/api/notifications') {
      res.end(JSON.stringify({ notifications: [] }));
      return;
    }

    if (pathname === '/api/contact') {
      res.end(
        JSON.stringify({
          ticketId: `TCK-${Date.now().toString().slice(-6)}`,
          receivedAt: new Date().toISOString(),
          message: 'Your inquiry has been logged into the PriceAlerter registry.',
        })
      );
      return;
    }

    if (pathname === '/api/company-logo') {
      const rawUrl = urlObj.searchParams.get('url')?.trim() || '';
      const rawSym = (urlObj.searchParams.get('symbol') || '').trim().toUpperCase();
      const rawName = (urlObj.searchParams.get('name') || '').trim();
      const rawColor = (urlObj.searchParams.get('color') || '').trim();

      // 1. Try local asset in public/
      if (rawUrl && rawUrl.startsWith('/assets/')) {
        const filePath = path.resolve(__dirname, 'public', rawUrl.replace(/^\/+/, ''));
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          const ct = ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
          res.setHeader('Content-Type', ct);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(fs.readFileSync(filePath));
          return;
        }
      }

      // 2. Check movers directory by symbol
      const cleanSym = rawSym.toLowerCase().replace(/[^a-z0-9]/g, '');
      const moversDir = path.resolve(__dirname, 'public', 'assets', 'movers');
      if (fs.existsSync(moversDir) && cleanSym) {
        const extensions = ['.png', '.webp', '.svg'];
        for (const ext of extensions) {
          const p = path.join(moversDir, `${cleanSym}${ext}`);
          if (fs.existsSync(p)) {
            const ct = ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
            res.setHeader('Content-Type', ct);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.end(fs.readFileSync(p));
            return;
          }
        }
      }

      // 3. Crisp SVG Monogram Fallback
      const STOP_WORDS = new Set(['LTD', 'LIMITED', 'PVT', 'PRIVATE', 'INDIA', 'THE', 'AND', 'OF', 'CO', 'CORP', 'IPO', 'PLC', 'INC']);
      const words = (rawName || rawSym || 'IN').replace(/[^A-Za-z0-9\s&.-]/g, ' ').trim().split(/\s+/).filter((w: string) => w && !STOP_WORDS.has(w.toUpperCase()));
      let initials = 'EQ';
      if (words.length >= 2) initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
      else if (words.length === 1 && words[0].length >= 2) initials = words[0].slice(0, 2).toUpperCase();
      else if (rawSym) initials = rawSym.slice(0, 2).toUpperCase();

      let bg = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : '#14263F';
      if (!rawColor) {
        const PALETTE = ['#14263F', '#0F4C81', '#059669', '#1D4ED8', '#334155', '#0E7490', '#4338CA', '#1E3A5F'];
        let hash = 0;
        const seed = rawName || rawSym || 'PriceAlerter';
        for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
        bg = PALETTE[hash % PALETTE.length];
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" role="img" aria-label="${initials}"><rect width="80" height="80" rx="16" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="30" font-weight="700" letter-spacing="0.5">${initials}</text></svg>`;
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end(svg);
      return;
    }

    // Always return JSON for any unmatched /api endpoint, never fall through to HTML
    res.end(JSON.stringify({ ok: true, data: [] }));
  };

  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cloudflareRocketLoaderSafePlugin(), apiDevServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      allowedHosts: true as const,
    },
  };
});
