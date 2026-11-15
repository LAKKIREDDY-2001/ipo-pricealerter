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
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
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
          res.end(JSON.stringify({ ipos, stocks, blogs: [], insights: [], sectors: [] }));
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
              istTimeLabel: 'IST Baseline Mode',
              liveClients: 1,
              pollIntervalsSec: { indices: 10, equitiesAndAlerts: 15, iposAndGmp: 60 },
              cycles: { indices: 1, equities: 1, ipos: 1, alertsEvaluated: 0, alertsTriggeredTotal: 0 },
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

        res.statusCode = 404;
        res.end(JSON.stringify({ error: `API route "${pathname}" not found.` }));
      });
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
  };
});
