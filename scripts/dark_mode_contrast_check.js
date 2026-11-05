#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const PORT = 8092;
const CDP_PORT = 9226;
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-dm-test-'));

  try {
    server = await startServer();
    chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
      '--headless',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${tmpDir}`,
      '--window-size=1280,900',
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
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });

    await new Promise(r => setTimeout(r, 2000));

    // Turn on Dark Mode
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      `
    });

    const routes = [
      '#/',
      '#/gmp',
      '#/allotment',
      '#/calculator',
      '#/live-prices',
      '#/listed',
      '#/upcoming',
      '#/guide',
      '#/ipo/bombay-coated-and-special-steels-ipo'
    ];
    let allViolations = [];

    for (const route of routes) {
      await send('Runtime.evaluate', {
        expression: `window.location.hash = '${route}';`
      });
      await new Promise(r => setTimeout(r, 1000));

      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const issues = [];
            const parseRgb = (str) => {
              if (!str) return null;
              const match = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
              if (!match) return null;
              return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: match[4] !== undefined ? parseFloat(match[4]) : 1
              };
            };

            const getEffectiveBg = (el) => {
              let cur = el;
              while (cur && cur !== document.documentElement) {
                const style = window.getComputedStyle(cur);
                const bg = parseRgb(style.backgroundColor);
                if (bg && bg.a > 0.1) return bg;
                cur = cur.parentElement;
              }
              return { r: 11, g: 15, b: 25, a: 1 }; // default dark background
            };

            const allElements = document.querySelectorAll('#app *');
            for (const el of allElements) {
              if (el.children.length === 0 && el.textContent.trim().length > 0) {
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) continue;
                const style = window.getComputedStyle(el);
                if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue;

                const fg = parseRgb(style.color);
                const bg = getEffectiveBg(el);
                if (!fg || !bg) continue;

                // Check for White text on White/Light background
                const fgIsLight = fg.r > 230 && fg.g > 230 && fg.b > 230;
                const bgIsLight = bg.r > 210 && bg.g > 210 && bg.b > 210;

                if (fgIsLight && bgIsLight) {
                  issues.push({
                    type: 'WHITE_ON_WHITE',
                    tag: el.tagName,
                    text: el.textContent.trim().slice(0, 40),
                    className: el.className,
                    fg: style.color,
                    bg: \`rgb(\${bg.r}, \${bg.g}, \${bg.b})\`
                  });
                }

                // Check for Dark text on Dark background
                const fgIsDark = fg.r < 50 && fg.g < 50 && fg.b < 50;
                const bgIsDark = bg.r < 50 && bg.g < 50 && bg.b < 50;
                if (fgIsDark && bgIsDark) {
                  issues.push({
                    type: 'DARK_ON_DARK',
                    tag: el.tagName,
                    text: el.textContent.trim().slice(0, 40),
                    className: el.className,
                    fg: style.color,
                    bg: \`rgb(\${bg.r}, \${bg.g}, \${bg.b})\`
                  });
                }
              }
            }
            return issues;
          })()
        `,
        returnByValue: true
      });

      const routeIssues = evalRes?.result?.value || [];
      console.log(`Route ${route}: found ${routeIssues.length} contrast issues`);
      if (routeIssues.length > 0) {
        console.log(routeIssues.slice(0, 5));
        allViolations.push(...routeIssues.map(i => ({ route, ...i })));
      }
    }

    // Now test Search Modal in Dark Mode
    await send('Runtime.evaluate', {
      expression: `
        if (window.IpoApp && window.IpoApp.toggleSearchModal) {
          window.IpoApp.toggleSearchModal(true);
          const inp = document.getElementById('global-search-input');
          if (inp) {
            inp.value = 'steel';
            inp.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const modalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const issues = [];
          const parseRgb = (str) => {
            if (!str) return null;
            const match = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
            if (!match) return null;
            return {
              r: parseInt(match[1], 10),
              g: parseInt(match[2], 10),
              b: parseInt(match[3], 10),
              a: match[4] !== undefined ? parseFloat(match[4]) : 1
            };
          };

          const getEffectiveBg = (el) => {
            let cur = el;
            while (cur && cur !== document.documentElement) {
              const style = window.getComputedStyle(cur);
              const bg = parseRgb(style.backgroundColor);
              if (bg && bg.a > 0.1) return bg;
              cur = cur.parentElement;
            }
            return { r: 11, g: 15, b: 25, a: 1 };
          };

          const allElements = document.querySelectorAll('#search-dialog-wrap *');
          for (const el of allElements) {
            if (el.children.length === 0 && el.textContent.trim().length > 0) {
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) continue;
              const style = window.getComputedStyle(el);
              if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue;

              const fg = parseRgb(style.color);
              const bg = getEffectiveBg(el);
              if (!fg || !bg) continue;

              const fgIsLight = fg.r > 230 && fg.g > 230 && fg.b > 230;
              const bgIsLight = bg.r > 210 && bg.g > 210 && bg.b > 210;

              if (fgIsLight && bgIsLight) {
                issues.push({
                  type: 'WHITE_ON_WHITE',
                  tag: el.tagName,
                  text: el.textContent.trim().slice(0, 40),
                  fg: style.color,
                  bg: \`rgb(\${bg.r}, \${bg.g}, \${bg.b})\`
                });
              }

              const fgIsDark = fg.r < 50 && fg.g < 50 && fg.b < 50;
              const bgIsDark = bg.r < 50 && bg.g < 50 && bg.b < 50;
              if (fgIsDark && bgIsDark) {
                issues.push({
                  type: 'DARK_ON_DARK',
                  tag: el.tagName,
                  text: el.textContent.trim().slice(0, 40),
                  fg: style.color,
                  bg: \`rgb(\${bg.r}, \${bg.g}, \${bg.b})\`
                });
              }
            }
          }
          return issues;
        })()
      `,
      returnByValue: true
    });

    const modalIssues = modalRes?.result?.value || [];
    console.log(`Search Modal: found ${modalIssues.length} contrast issues`);
    if (modalIssues.length > 0) {
      console.log(modalIssues);
      allViolations.push(...modalIssues.map(i => ({ route: 'SearchModal', ...i })));
    }

    if (allViolations.length === 0) {
      console.log('✅ ZERO white-on-white or dark-on-dark contrast violations detected in Dark Mode across all routes!');
    } else {
      console.error(`❌ Found ${allViolations.length} total contrast violations in Dark Mode!`);
    }

    ws.close();
  } catch (err) {
    console.error('Error during contrast check:', err);
  } finally {
    if (chromeProc) chromeProc.kill();
    if (server) server.close();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
