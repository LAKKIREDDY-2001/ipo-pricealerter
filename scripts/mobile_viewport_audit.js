#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const PORT = 8096;
const CDP_PORT = 9230;
const ROOT_DIR = path.resolve(__dirname, '..');

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

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => resolve(server)).on('error', reject);
  });
}

async function run() {
  let server = null;
  let chromeProc = null;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-mobile-test-'));

  try {
    server = await startServer();
    chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
      '--headless',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${tmpDir}`,
      '--window-size=390,844',
      '--no-sandbox',
      '--disable-gpu',
      'about:blank'
    ]);

    let targetPage = null;
    for (let i = 0; i < 30; i++) {
      try {
        const listRes = await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${CDP_PORT}/json/list`, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
          });
          req.on('error', reject);
        });
        targetPage = listRes?.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || listRes?.[0];
        if (targetPage?.webSocketDebuggerUrl) break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = {};

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks[msg.id]) {
        callbacks[msg.id](msg.result);
        delete callbacks[msg.id];
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true
    });

    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await new Promise(r => setTimeout(r, 3500));

    const routes = [
      '#/',
      '#/dashboard',
      '#/ipo',
      '#/gmp',
      '#/allotment',
      '#/calculator',
      '#/stocks',
      '#/listed',
      '#/insights',
      '#/learn',
      '#/calendar',
      '#/ipo/zinka-logistics-solutions-ipo',
      '#/stocks/NSE-IND'
    ];

    let overflowIssues = [];

    for (const route of routes) {
      await send('Runtime.evaluate', {
        expression: `window.location.hash = '${route}';`
      });
      await new Promise(r => setTimeout(r, 800));

      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const bodyWidth = document.body.scrollWidth;
            const winWidth = window.innerWidth;
            const overflowingElements = [];

            // Find elements that bleed past window.innerWidth
            const all = document.querySelectorAll('*');
            for (const el of all) {
              if (typeof el.getBoundingClientRect !== 'function') continue;
              const r = el.getBoundingClientRect();
              if (r.right > winWidth + 2 && (!el.closest || (!el.closest('.table-scroll') && !el.closest('.market-row') && !el.closest('.tabs')))) {
                overflowingElements.push({
                  tag: el.tagName,
                  id: el.id,
                  cls: (typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '')).slice(0, 50),
                  right: Math.round(r.right),
                  winWidth
                });
              }
            }

            return {
              docWidth,
              bodyWidth,
              winWidth,
              overflow: docWidth > winWidth || bodyWidth > winWidth,
              overflowCount: overflowingElements.length,
              sample: overflowingElements.slice(0, 3)
            };
          })()
        `,
        returnByValue: true
      });

      const res = evalRes?.result?.value;
      if (!res) console.log(`evalRes for ${route}:`, evalRes);
      console.log(`Mobile Viewport Check ${route}: winWidth=${res?.winWidth}, docWidth=${res?.docWidth}, bodyWidth=${res?.bodyWidth}, overflow=${res?.overflow}`);
      if (res?.overflow || (res?.overflowCount && res.overflowCount > 0)) {
        console.warn(`  ⚠️ Bleed elements found:`, res?.sample);
        overflowIssues.push({ route, ...res });
      }
    }

    if (overflowIssues.length === 0) {
      console.log('\n✅ PERFECT MOBILE RESPONSIVENESS: Zero horizontal overflow on 390px phone viewport across all routes!');
    } else {
      console.error(`\n❌ Found ${overflowIssues.length} routes with mobile layout overflow.`);
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Error during mobile test:', err);
    process.exitCode = 1;
  } finally {
    if (chromeProc) chromeProc.kill('SIGKILL');
    if (server) server.close();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
