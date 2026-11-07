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
const os = require('os');

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
    console.log(`[HTTP INCOMING] ${req.method} ${req.url}`);
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
        console.error(`[HTTP 404] ${req.method} ${req.url} -> File not found: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end(`404 Not Found: ${reqPath}`);
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          console.error(`[HTTP 500] Read error on ${filePath}`);
          res.writeHead(500);
          return res.end('Read error');
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': data.length,
          'Cache-Control': 'no-cache'
        });
        res.end(data);
      });
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-smoke-'));

  try {
    server = await startServer();
    const chromePath = getChromeBinary();
    console.log(`[SmokeTest] Launching Chrome executable: ${chromePath}`);

    chromeProc = spawn(chromePath, [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${tmpDir}`,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-proxy-server',
      '--proxy-bypass-list=<-loopback>',
      '--disable-web-security',
      'about:blank'
    ]);

    chromeProc.on('error', (err) => {
      throw new Error(`Failed to launch Chrome: ${err.message}`);
    });

    chromeProc.stderr?.on('data', (d) => {
      const text = d.toString();
      if (!text.includes('Fontconfig') && !text.includes('alsa')) {
        console.warn(`[Chrome stderr]: ${text.trim()}`);
      }
    });

    // Wait for CDP port to open (up to 25s)
    let listRes = null;
    let targetPage = null;
    for (let i = 0; i < 50; i++) {
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
        targetPage = listRes?.find(t => t.type === 'page' && !t.url?.startsWith('chrome-extension://')) ||
                     listRes?.find(t => t.type === 'page') ||
                     listRes?.[0];
        if (!targetPage) {
          try {
            targetPage = await new Promise((resolve, reject) => {
              const req = http.get(`http://127.0.0.1:${CDP_PORT}/json/new`, (res) => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => {
                  try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
                });
              });
              req.on('error', reject);
              req.setTimeout(800, () => req.destroy());
            });
          } catch (e) {}
        }
        if (targetPage && targetPage.webSocketDebuggerUrl) break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    if (!targetPage || !targetPage.webSocketDebuggerUrl) {
      throw new Error('CDP target page not available from Chrome');
    }

    console.log(`[SmokeTest] Connected to target page: [${targetPage.type}] ${targetPage.url || targetPage.title}`);
    const wsUrl = targetPage.webSocketDebuggerUrl;
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
      if (msg.method === 'Console.messageAdded') {
        const text = msg.params.message?.text;
        const level = msg.params.message?.level;
        if (level === 'error') console.error(`[Console ${level}]:`, text);
        else console.log(`[Console ${level}]:`, text);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const args = (msg.params.args || []).map(a => a.value || a.description || '').join(' ');
        console.log(`[Console ${msg.params.type}]:`, args);
      }
      if (msg.method === 'Network.responseReceived') {
        const status = msg.params.response?.status;
        const url = msg.params.response?.url;
        if (status >= 400 && !url.includes('infolinks') && !url.includes('google')) {
          console.error(`[Network ${status}]:`, url);
        }
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
    await send('Console.enable');
    await send('Network.enable');

    console.log('[SmokeTest] Initializing application at root URL...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });

    // Wait until application completes initialization
    let appReady = false;
    let lastState = {};
    for (let i = 0; i < 40; i++) {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            return {
              hasIpoApp: typeof window.IpoApp === "object",
              readyState: document.readyState,
              appHtmlLen: document.getElementById("app") ? document.getElementById("app").innerHTML.length : 0,
              url: window.location.href,
              title: document.title
            };
          })()
        `,
        returnByValue: true
      });
      lastState = res?.result?.value || {};
      if (lastState.hasIpoApp && lastState.appHtmlLen > 50) {
        appReady = true;
        break;
      }
      await new Promise(r => setTimeout(r, 350));
    }

    if (!appReady) {
      throw new Error(`Application failed to initialize within 14 seconds: ${JSON.stringify(lastState)}`);
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
            const cardNodes = Array.from(document.querySelectorAll(".live-stock-card"));
            const cards = cardNodes.length;
            const names = cardNodes.map(card => (card.querySelector(".live-card-name")?.textContent || "").trim()).filter(Boolean);
            const uniqueNames = new Set(names.map(name => name.toLowerCase())).size;
            const searchInput = !!document.querySelector(".live-search-box input");
            return { cards, uniqueNames, sampleNames: names.slice(0, 5), searchInput };
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

    console.log(`[SmokeTest] #/live-prices result: Cards = ${liveData.cards || 0}, Unique names = ${liveData.uniqueNames || 0}, SearchBox = ${liveData.searchInput || false}`);
    if (!livePassed || liveData.cards === 0) {
      throw new Error('CRITICAL FAIL: #/live-prices rendered 0 stock cards!');
    }
    if ((liveData.uniqueNames || 0) < Math.min(3, liveData.cards || 0)) {
      throw new Error('CRITICAL FAIL: Live Prices is repeating one company name instead of mapping distinct securities.');
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
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
