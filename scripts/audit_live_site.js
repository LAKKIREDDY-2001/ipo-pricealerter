const { spawn } = require('child_process');
const http = require('http');

async function run() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  const listRes = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json/list', (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
  });

  const page = listRes[0];
  console.log('Target Page WS URL:', page.webSocketDebuggerUrl);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = {};

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks[msg.id]) {
      callbacks[msg.id](msg.result);
      delete callbacks[msg.id];
    }
    if (msg.method === 'Console.messageAdded') {
      console.log('CONSOLE:', msg.params.message.level, msg.params.message.text);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value || a.description).join(' ');
      console.log('BROWSER CONSOLE [' + msg.params.type + ']:', args);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('BROWSER EXCEPTION:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
    if (msg.method === 'Network.responseReceived') {
      const resp = msg.params.response;
      if (resp.status >= 400) {
        console.error('NETWORK ERROR:', resp.status, resp.url);
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
  await send('Network.enable');

  console.log('\n========================================');
  console.log('1. Navigating to https://pricealerter.in/#/listed');
  console.log('========================================');
  await send('Page.navigate', { url: 'https://pricealerter.in/#/listed' });
  await new Promise(r => setTimeout(r, 4500));

  const evalListed = `
    (() => {
      const app = document.getElementById("app");
      return {
        hash: window.location.hash,
        tbodyRows: document.querySelectorAll("tbody tr").length,
        appHtmlLen: app?.innerHTML.length || 0,
        appTextPreview: (app?.innerText || "").slice(0, 300),
        hasSecuritiesMaster: !!window.SecuritiesMaster,
        securitiesCount: window.SecuritiesMaster?.records?.length || 0,
        hasListedGains: !!window.ListedGainsData,
        listedGainsCount: window.ListedGainsData?.records?.length || 0,
        hasIpoData: !!window.IpoData,
        ipoCount: window.IpoData?.records?.length || 0
      };
    })()
  `;

  let res = await send('Runtime.evaluate', { expression: evalListed, returnByValue: true });
  console.log('#/listed DOM Inspection:', JSON.stringify(res?.result?.value, null, 2));

  console.log('\n========================================');
  console.log('2. Navigating to https://pricealerter.in/#/live-prices');
  console.log('========================================');
  await send('Page.navigate', { url: 'https://pricealerter.in/#/live-prices' });
  await new Promise(r => setTimeout(r, 4500));

  const evalLive = `
    (() => {
      const app = document.getElementById("app");
      return {
        hash: window.location.hash,
        cardCount: document.querySelectorAll(".live-stock-card").length,
        appHtmlLen: app?.innerHTML.length || 0,
        appTextPreview: (app?.innerText || "").slice(0, 300),
        filterActive: document.querySelector(".live-filter-btn.active")?.innerText || ""
      };
    })()
  `;

  res = await send('Runtime.evaluate', { expression: evalLive, returnByValue: true });
  console.log('#/live-prices DOM Inspection:', JSON.stringify(res?.result?.value, null, 2));

  chrome.kill();
  process.exit(0);
}

run().catch(e => { console.error('Error:', e); process.exit(1); });
