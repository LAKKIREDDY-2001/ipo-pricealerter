import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FALLBACK_MARKET_DATA } from '../src/data/fallbackMarketData.ts';

const outputDir = resolve(process.cwd(), 'public/data');
await mkdir(outputDir, { recursive: true });
const snapshot = {
  ...FALLBACK_MARKET_DATA,
  generatedAt: new Date().toISOString(),
  lastSyncTime: FALLBACK_MARKET_DATA.lastSyncTime || null,
  lastSyncFormatted: FALLBACK_MARKET_DATA.lastSyncFormatted || null,
  dataMode: 'build-time-fallback-snapshot',
};
await writeFile(resolve(outputDir, 'live-market-data.json'), JSON.stringify(snapshot), 'utf8');
const summarySnapshot = {
  ...snapshot,
  stocks: (snapshot.stocks || []).slice(0, 150),
};
await writeFile(resolve(outputDir, 'market-summary.json'), JSON.stringify(summarySnapshot), 'utf8');
console.log(
  `Generated market snapshot: ${snapshot.stocks?.length || 0} stocks, ${snapshot.ipos?.length || 0} IPOs, ${snapshot.indices?.length || 0} indices`,
);
