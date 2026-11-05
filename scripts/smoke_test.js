#!/usr/bin/env node
/**
 * Automated Production Smoke Test for pricealerter.in
 * Validates that #/listed and #/live-prices render correctly with > 0 rows/cards
 * and 0 uncaught JavaScript runtime exceptions before deployment.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8089;
const CDP_PORT = 9225;
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Zero-dependency static HTTP server
function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
    let reqPath = parsedUrl.pathname;
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

    const filePath = path.join(ROOT_DIR, reqPath);
    if (!filePath.startsWith(ROOT_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end(`404 Not Found: ${reqPath}`);
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[SmokeTest] Static HTTP server active at http://127.0.0.1:${PORT}`);
      resolve(server);
    }).on('error', reject);
  });
}

// 2. Discover Chrome / Chromium binary across OS environments
function getChromeBinary() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'google-chrome',
    'chromium'
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'google-chrome';
}

async function run() {
  let server = null;
  let chromeProc = null;
  const uncaughtExceptions = [];

  try {
    server = await startServer();
    const chromePath = getChromeBinary();
    console.log(`[SmokeTest] Launching Chrome executable: ${chromePath}`);

    chromeProc = spawn(chromePath, [
      '--headless',
      `--remote-debugging-port=${CDP_PORT}`,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      'about:blank'
    ]);

    chromeProc.on('error', (err) => {
      throw new Error(`Failed to launch Chrome: ${err.message}`);
    });

    // Wait for CDP port to open
    let listRes = null;
    for (let i = 0; i < 20; i++) {
      try {
        listRes = await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${CDP_PORT}/json/list`, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
              try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
            });
          });
          req.on('error', reject);
          req.setTimeout(800, () => req.destroy());
        });
        if (listRes && listRes.length && listRes[0].webSocketDebuggerUrl) break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 400));
      }
    }

    if (!listRes || !listRes[0] || !listRes[0].webSocketDebuggerUrl) {
      throw new Error('CDP target page not available from Chrome');
    }

    const wsUrl = listRes[0].webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);

    let id = 1;
    const callbacks = {};

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks[msg.id]) {
        callbacks[msg.id](msg.result);
        delete callbacks[msg.id];
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
        uncaughtExceptions.push(desc);
        console.error('[Browser Exception]:', desc);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks[reqId] = resolve;
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('[SmokeTest] Initializing application at root URL...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });

    // Wait until application completes initialization
    let appReady = false;
    for (let i = 0; i < 30; i++) {
      const res = await send('Runtime.evaluate', {
        expression: 'document.readyState === "complete" && typeof window.IpoApp === "object"',
        returnByValue: true
      });
      if (res?.result?.value === true) {
        appReady = true;
        break;
      }
      await new Promise(r => setTimeout(r, 400));
    }

    if (!appReady) {
      throw new Error('Application failed to initialize within 12 seconds');
    }
    console.log('[SmokeTest] Application initialized successfully.');

    console.log('\n--- Test 1: Validate #/listed Route ---');
    await send('Runtime.evaluate', { expression: 'window.location.hash = "#/listed";' });

    let listedPassed = false;
    let listedData = {};
    for (let i = 0; i < 30; i++) {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const rows = document.querySelectorAll("#listed-table-body tr").length;
            const cards = document.querySelectorAll("#listed-cards-body .mobile-open-card").length;
            const kpi = document.getElementById("listed-kpi-total-val")?.innerText?.trim() || "";
            return { rows, cards, kpi };
          })()
        `,
        returnByValue: true
      });
      listedData = res?.result?.value || {};
      if (listedData.rows > 0) {
        listedPassed = true;
        break;
      }
      await new Promise(r => setTimeout(r, 400));
    }

    console.log(`[SmokeTest] #/listed result: Rows = ${listedData.rows || 0}, Cards = ${listedData.cards || 0}, KPI = ${listedData.kpi || 'N/A'}`);
    if (!listedPassed || listedData.rows === 0) {
      throw new Error('CRITICAL FAIL: #/listed rendered 0 table rows!');
    }

    console.log('\n--- Test 2: Validate #/live-prices Route ---');
    await send('Runtime.evaluate', { expression: 'window.location.hash = "#/live-prices";' });

    let livePassed = false;
    let liveData = {};
    for (let i = 0; i < 30; i++) {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const cards = document.querySelectorAll(".live-stock-card").length;
            const searchInput = !!document.querySelector(".live-search-box input");
            return { cards, searchInput };
          })()
        `,
        returnByValue: true
      });
      liveData = res?.result?.value || {};
      if (liveData.cards > 0) {
        livePassed = true;
        break;
      }
      await new Promise(r => setTimeout(r, 400));
    }

    console.log(`[SmokeTest] #/live-prices result: Cards = ${liveData.cards || 0}, SearchBox = ${liveData.searchInput || false}`);
    if (!livePassed || liveData.cards === 0) {
      throw new Error('CRITICAL FAIL: #/live-prices rendered 0 stock cards!');
    }

    console.log('\n--- Test 3: Validate Home Page & Performance Widget ---');
    await send('Runtime.evaluate', { expression: 'window.location.hash = "#/";' });

    let homePassed = false;
    let homeData = {};
    for (let i = 0; i < 30; i++) {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const hasOpenSection = !!document.getElementById("dashboard-open-ipos-section");
            const hasPerfSection = !!document.getElementById("recently-listed-performance-section");
            return { hasOpenSection, hasPerfSection };
          })()
        `,
        returnByValue: true
      });
      homeData = res?.result?.value || {};
      if (homeData.hasOpenSection) {
        homePassed = true;
        break;
      }
      await new Promise(r => setTimeout(r, 400));
    }

    console.log(`[SmokeTest] Home result: OpenSection = ${homeData.hasOpenSection || false}, PerfSection = ${homeData.hasPerfSection || false}`);
    if (!homePassed || !homeData.hasOpenSection) {
      throw new Error('CRITICAL FAIL: Home page did not render open IPOs section!');
    }

    if (uncaughtExceptions.length > 0) {
      throw new Error(`CRITICAL FAIL: Caught ${uncaughtExceptions.length} uncaught exceptions during route test!`);
    }

    console.log('\n======================================================');
    console.log('✅ ALL SMOKE TESTS PASSED: #/listed and #/live-prices render flawlessly with zero runtime exceptions!');
    console.log('======================================================');

    ws.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ SMOKE TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    if (chromeProc) chromeProc.kill();
    if (server) server.close();
  }
}

run();
