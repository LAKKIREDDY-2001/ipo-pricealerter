import React, { useEffect, useMemo, useState } from 'react';
import { resolveApiUrl } from '../../services/api';

export interface CompanyLogoProps {
  companyName: string;
  symbol?: string | null;
  bseCode?: string | null;
  logoUrl?: string | null;
  searchId?: string | null;
  logoColor?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CompanyLogoProps['size']>, string> = {
  xs: 'h-6 w-6 rounded-md text-[10px]',
  sm: 'h-8 w-8 rounded-lg text-xs',
  md: 'h-10 w-10 rounded-lg text-sm',
  lg: 'h-14 w-14 rounded-xl text-lg',
};

const STOP_WORDS = new Set([
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

const PALETTE = [
  '#14263F',
  '#0F4C81',
  '#059669',
  '#1D4ED8',
  '#334155',
  '#0E7490',
  '#4338CA',
  '#1E3A5F',
];

function getInitials(name: string, symbol?: string | null): string {
  const cleaned = (name || symbol || 'IN').replace(/[^A-Za-z0-9\s&.-]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter((w) => w && !STOP_WORDS.has(w.toUpperCase()));
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }
  const alpha = (symbol && !/^\d+$/.test(symbol) ? symbol : cleaned).replace(/[^A-Za-z0-9]/g, '');
  return (alpha.slice(0, 2) || 'EQ').toUpperCase();
}

function getFallbackColor(name: string, colorHint?: string | null): string {
  if (colorHint && /^#[0-9a-fA-F]{6}$/.test(colorHint)) {
    return colorHint;
  }
  let hash = 0;
  const seed = name || 'PriceAlerter';
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

const KNOWN_STATIC_LOGOS: Record<string, string> = {
  NSE: 'https://nsearchives.nseindia.in/web/sites/default/files/2019-07/NSE%404x-100.jpg',
  ABB: '/assets/movers/abb.webp',
  ADANIENSOL: '/assets/movers/adaniensol.webp',
  ADANIENT: '/assets/movers/adani-enterprises.png',
  ADANIGREEN: '/assets/movers/adani-green.png',
  ADANIPORTS: '/assets/movers/adani-ports.png',
  ADANIPOWER: '/assets/movers/adani-power.png',
  ALEMBICLTD: '/assets/movers/alembic-pharma.png',
  ANGELONE: '/assets/movers/angel-one.png',
  ANTALA: '/assets/movers/antala.png',
  APLLTD: '/assets/movers/alembic-pharma.png',
  APOLLOHOSP: '/assets/movers/apollo-hosp.png',
  ARAVALLILF: '/assets/movers/aravallilf.svg',
  ASIANPAINT: '/assets/movers/asian-paints.png',
  AVENUE: '/assets/movers/avenue-supermarts.png',
  AVENUESUPER: '/assets/movers/avenue-supermarts.png',
  AWFIS: '/assets/movers/awfis.png',
  AXISBANK: '/assets/movers/axis-bank.png',
  BAJAJAUTO: '/assets/movers/bajaj-auto.webp',
  'BAJAJ-AUTO': '/assets/movers/bajaj-auto.webp',
  BAJAJ_AUTO: '/assets/movers/bajaj-auto.webp',
  BAJAJFINSV: '/assets/movers/bajajfinsv.webp',
  BAJAJHFL: '/assets/movers/bajaj-housing.png',
  BAJFINANCE: '/assets/movers/bajaj-finance.png',
  BANKBARODA: '/assets/movers/bank-baroda.png',
  BCSSL: '/assets/movers/bombay-coated-steels.png',
  BEL: '/assets/movers/bel.png',
  BHARTIARTL: '/assets/movers/airtel.png',
  BHEL: '/assets/movers/bhel.png',
  BLACKBUCK: '/assets/movers/blackbuck.png',
  BOB: '/assets/movers/bank-baroda.png',
  BOMBAY: '/assets/movers/bombay-coated.png',
  BOSCHLTD: '/assets/movers/boschltd.webp',
  BPCL: '/assets/movers/bpcl.png',
  BRITANNIA: '/assets/movers/britannia.png',
  BSE: '/assets/movers/bse.png',
  C2C: '/assets/movers/c2c-advanced.png',
  C2CADVANCED: '/assets/movers/c2c-advanced-systems.png',
  CANARABANK: '/assets/movers/canara-bank.png',
  CANBK: '/assets/movers/canara-bank.png',
  CDSL: '/assets/movers/cdsl.png',
  CHOLAFIN: '/assets/movers/cholafin.webp',
  CIPLA: '/assets/movers/cipla.png',
  COALINDIA: '/assets/movers/coal-india.png',
  COASTALPRT: '/assets/movers/coastalprt.svg',
  COCHINSHIP: '/assets/movers/cochin-shipyard.png',
  CONCOR: '/assets/movers/concor.png',
  CRYSTAL: '/assets/movers/crystal-crop.png',
  CRYSTALCRO: '/assets/movers/crystal-crop.png',
  CRYSTALCROP: '/assets/movers/crystal-crop-protection.png',
  DECCANSOL: '/assets/movers/deccansol.svg',
  DIVISLAB: '/assets/movers/divislab.webp',
  DIXON: '/assets/movers/dixon.png',
  DLF: '/assets/movers/dlf.png',
  DMART: '/assets/movers/dmart.png',
  EICHERMOT: '/assets/movers/eichermot.webp',
  ENVIRO: '/assets/movers/enviro-infra.png',
  ENVIROINFRA: '/assets/movers/enviro-infra-engineers.png',
  ETERNAL: '/assets/movers/zomato.png',
  EXIDE: '/assets/movers/exide.png',
  EXIDEIND: '/assets/movers/exide.png',
  FAZE3Q: '/assets/movers/faze-three.png',
  FEDERALBNK: '/assets/movers/federal-bank.png',
  FIRSTCRY: '/assets/movers/firstcry.png',
  FLIPKART: '/assets/movers/flipkart.png',
  FRACTAL: '/assets/movers/fractal-analytics.png',
  GAIL: '/assets/movers/gail.png',
  GRASIM: '/assets/movers/grasim.png',
  HAL: '/assets/movers/hal.png',
  HALDIRAM: '/assets/movers/haldiram.png',
  HAVELLS: '/assets/movers/havells.png',
  HCLTECH: '/assets/movers/hcltech.webp',
  HDFCBANK: '/assets/movers/hdfc-bank.png',
  HDFCLIFE: '/assets/movers/hdfc-life.png',
  HEROMOTORS: 'https://assets-netstorage.groww.in/stock-assets/logos2/GSTK544936.webp',
  HEROMOTOCO: 'https://assets-netstorage.groww.in/stock-assets/logos2/HEROMOTOCO.webp',
  NVDA: 'https://logo.clearbit.com/nvidia.com',
  AAPL: 'https://logo.clearbit.com/apple.com',
  MSFT: 'https://logo.clearbit.com/microsoft.com',
  GOOG: 'https://logo.clearbit.com/abc.xyz',
  GOOGL: 'https://logo.clearbit.com/abc.xyz',
  AMZN: 'https://logo.clearbit.com/amazon.com',
  META: 'https://logo.clearbit.com/meta.com',
  TSLA: 'https://logo.clearbit.com/tesla.com',
  AVGO: 'https://logo.clearbit.com/broadcom.com',
  ORCL: 'https://logo.clearbit.com/oracle.com',
  AMD: 'https://logo.clearbit.com/amd.com',
  NFLX: 'https://logo.clearbit.com/netflix.com',
  INTC: 'https://logo.clearbit.com/intel.com',
  QCOM: 'https://logo.clearbit.com/qualcomm.com',
  ADBE: 'https://logo.clearbit.com/adobe.com',
  CRM: 'https://logo.clearbit.com/salesforce.com',
  IBM: 'https://logo.clearbit.com/ibm.com',
  UBER: 'https://logo.clearbit.com/uber.com',
  COIN: 'https://logo.clearbit.com/coinbase.com',
  PLTR: 'https://logo.clearbit.com/palantir.com',
  ARM: 'https://logo.clearbit.com/arm.com',
  HINDALCO: '/assets/movers/hindalco.png',
  HINDUNILVR: '/assets/movers/hul.png',
  HINDZINC: '/assets/movers/hindustan-zinc.png',
  HITACHI: '/assets/movers/hitachi-energy.png',
  HYUNDAI: '/assets/movers/hyundai.png',
  ICICIAMC: '/assets/movers/icici-bank.png',
  ICICIBANK: '/assets/movers/icici-bank.png',
  IDFCFIRSTB: '/assets/movers/idfc-first.png',
  INDIGO: '/assets/movers/indigo.webp',
  INFY: '/assets/movers/infosys.png',
  IOC: '/assets/movers/ioc.png',
  IRFC: '/assets/movers/irfc.png',
  ITC: '/assets/movers/itc.png',
  JIOFIN: '/assets/movers/jio-fin.png',
  JSWSTEEL: '/assets/movers/jsw-steel.png',
  JYOTICNC: '/assets/movers/jyoti-cnc.png',
  KAYNES: '/assets/movers/kaynes.png',
  KOTAKBANK: '/assets/movers/kotak-bank.png',
  KRN: '/assets/movers/krn.png',
  LAMOSAIC: '/assets/movers/lamosaic.png',
  LAMOSAICIND: '/assets/movers/lamosaic-india.png',
  LIC: '/assets/movers/lic.webp',
  LICI: '/assets/movers/lici.webp',
  LT: '/assets/movers/lt.png',
  MAHANADI: '/assets/movers/mahanadi.svg',
  MANGAL: '/assets/movers/mangal.svg',
  MANGALCOMP: '/assets/movers/mangal.svg',
  MM: '/assets/movers/mm.png',
  'M&M': '/assets/movers/mm.png',
  MANBA: '/assets/movers/manba.png',
  MANYAVAR: '/assets/movers/vedant.png',
  MARUTI: '/assets/movers/maruti.png',
  MAZDOCK: '/assets/movers/mazdock.png',
  MCX: '/assets/movers/mcx.png',
  MERIDIANCL: '/assets/movers/meridiancl.svg',
  MOTHERSON: '/assets/movers/motherson.webp',
  MUTHOOTFIN: '/assets/movers/muthoot-finance.png',
  NESTLEIND: '/assets/movers/nestle.png',
  NTPC: '/assets/movers/ntpc.png',
  NTPCGREEN: '/assets/movers/ntpc-green.png',
  OLAELEC: '/assets/movers/ola-electric.png',
  ONGC: '/assets/movers/ongc.png',
  ONYX: '/assets/movers/onyx.svg',
  ONYXBIOTEC: '/assets/movers/onyx.svg',
  ORIENTTECH: '/assets/movers/orient-tech.png',
  PFC: '/assets/movers/pfc.png',
  PHONEPE: '/assets/movers/phonepe.png',
  PIDILITE: '/assets/movers/pidilitind.webp',
  PIDILITIND: '/assets/movers/pidilitind.webp',
  PNB: '/assets/movers/pnb.png',
  POLYCAB: '/assets/movers/polycab.png',
  POWERGRID: '/assets/movers/power-grid.png',
  POWERINDIA: '/assets/movers/hitachi-energy.png',
  PREMIERENE: '/assets/movers/premier-energies.png',
  RAJESH: '/assets/movers/rajesh-power.png',
  RAJESHPOW: '/assets/movers/rajesh-power-services.png',
  RAJPUTANA: '/assets/movers/rajputana.png',
  RAJPUTANABIO: '/assets/movers/rajputana-biodiesel.png',
  RAZORPAY: '/assets/movers/razorpay.png',
  REC: '/assets/movers/rec.png',
  RELIANCE: '/assets/movers/reliance.png',
  RSYSTEMS: '/assets/movers/r-systems.png',
  RVNL: '/assets/movers/rvnl.png',
  SAREGAMA: '/assets/movers/saregama.png',
  SBILIFE: '/assets/movers/sbi-life.png',
  SBIN: '/assets/movers/sbi.png',
  SHRIRAMFIN: '/assets/movers/shriramfin.webp',
  SIEMENS: '/assets/movers/siemens-energy.png',
  SOLARINDS: '/assets/movers/solarinds.png',
  SUNPHARMA: '/assets/movers/sun-pharma.png',
  SUZLON: '/assets/movers/suzlon.png',
  SWIGGY: '/assets/movers/swiggy.png',
  TATACAP: '/assets/movers/tatamotors.png',
  TATACONSUM: '/assets/movers/tata-consumer.png',
  TATAMOTORS: '/assets/movers/tatamotors.png',
  TATAPOWER: '/assets/movers/tata-power.png',
  TATASTEEL: '/assets/movers/tata-steel.png',
  TATATECH: '/assets/movers/tata-tech.png',
  TCS: '/assets/movers/tcs.png',
  TECHM: '/assets/movers/techm.png',
  TEJAS: '/assets/movers/tejas.png',
  TEJASNET: '/assets/movers/tejas.png',
  TITAN: '/assets/movers/titan.png',
  TMCV: '/assets/movers/tatamotors.png',
  TMPV: '/assets/movers/tatamotors.png',
  TORNTPHARM: '/assets/movers/torntpharm.png',
  TRENT: '/assets/movers/trent.png',
  TVSMOTOR: '/assets/movers/tvsmotor.webp',
  ULTRACEMCO: '/assets/movers/ultratech.png',
  UNICOMMERCE: '/assets/movers/unicommerce.png',
  UNIONBANK: '/assets/movers/union-bank.png',
  VAML: '/assets/movers/vedanta.png',
  VEDANT: '/assets/movers/vedant.png',
  VEDANTA: '/assets/movers/vedanta.png',
  VEDL: '/assets/movers/vedanta.png',
  WAAREE: '/assets/movers/waaree.png',
  WAAREEENER: '/assets/movers/waaree.png',
  WATRANA: '/assets/movers/watrana.svg',
  WIPRO: '/assets/movers/wipro.png',
  ZEPTO: '/assets/movers/zepto.png',
  ZINKA: '/assets/movers/blackbuck.png',
  ZOMATO: '/assets/movers/zomato.png',
};

const BRAND_NAME_LOGOS: Array<[RegExp, string]> = [
  [/\\bnational\\s+stock\\s+exchange\\s+of\\s+india\\b/i, 'https://nsearchives.nseindia.in/web/sites/default/files/2019-07/NSE%404x-100.jpg'],
  [/\blarsen\s*&?\s*toubro\b/i, '/assets/movers/lt.png'],
  [/\bmahindra\s*&?\s*mahindra\b/i, '/assets/movers/mm.png'],
  [/\bindian\s*oil\b/i, '/assets/movers/ioc.png'],
  [/\bhindustan\s*unilever\b/i, '/assets/movers/hul.png'],
  [/\bhindustan\s*aeronautics\b/i, '/assets/movers/hal.png'],
  [/\bbharat\s*electronics\b/i, '/assets/movers/bel.png'],
  [/\bbharat\s*heavy\s*electricals\b/i, '/assets/movers/bhel.png'],
  [/\bbharat\s*petroleum\b/i, '/assets/movers/bpcl.png'],
  [/\bstate\s*bank\s*of\s*india\b/i, '/assets/movers/sbi.png'],
  [/\bpunjab\s*national\s*bank\b/i, '/assets/movers/pnb.png'],
  [/\bbank\s*of\s*baroda\b/i, '/assets/movers/bank-baroda.png'],
  [/\bhdfc\s*bank\b/i, '/assets/movers/hdfc-bank.png'],
  [/\bicici\s*bank\b/i, '/assets/movers/icici-bank.png'],
  [/\baxis\s*bank\b/i, '/assets/movers/axis-bank.png'],
  [/\bkotak\s*mahindra\b/i, '/assets/movers/kotak-bank.png'],
  [/\btata\s*consultancy\b/i, '/assets/movers/tcs.png'],
  [/\btata\s*motors\b/i, '/assets/movers/tatamotors.png'],
  [/\bpower\s*finance\b/i, '/assets/movers/pfc.png'],
  [/\brec\s+limited\b/i, '/assets/movers/rec.png'],
  [/\bmulti\s*commodity\s*exchange\b/i, '/assets/movers/mcx.png'],
  [/\bbombay\s*stock\s*exchange\b|\bbse\s+limited\b/i, '/assets/movers/bse.png'],
  [/\babb\s+india\b/i, '/assets/movers/abb.webp'],
  [/\bdlf\s+limited\b/i, '/assets/movers/dlf.png'],
  [/\bgail\s+\(?india\)?/i, '/assets/movers/gail.png'],
  [/\bitc\s+limited\b/i, '/assets/movers/itc.png'],
  [/\bntpc\s+green\b/i, '/assets/movers/ntpc-green.png'],
  [/\benviro\s+infra\b/i, '/assets/movers/enviro-infra.png'],
  [/\bc2c\s+advanced\b/i, '/assets/movers/c2c-advanced.png'],
  [/\brajesh\s+power\b/i, '/assets/movers/rajesh-power.png'],
  [/\brajputana\s+biodiesel\b/i, '/assets/movers/rajputana.png'],
  [/\blamosaic\b/i, '/assets/movers/lamosaic.png'],
  [/\bcrystal\s+crop\b/i, '/assets/movers/crystal-crop.png'],
  [/\bbombay\s+coated\b/i, '/assets/movers/bombay-coated.png'],
  [/\bantala\b/i, '/assets/movers/antala.png'],
  [/\bvedant\s+poly\b/i, '/assets/movers/vedant.png'],
  [/\bntpc\s+limited\b/i, '/assets/movers/ntpc.png'],
  [/\bongc\b/i, '/assets/movers/ongc.png'],
  [/\bfirstcry\b/i, '/assets/movers/firstcry.png'],
  [/\bflipkart\b/i, '/assets/movers/flipkart.png'],
  [/\bhaldiram\b/i, '/assets/movers/haldiram.png'],
  [/\bhyundai\b/i, '/assets/movers/hyundai.png'],
  [/\bola\s+electric\b/i, '/assets/movers/ola-electric.png'],
  [/\borient\s+tech/i, '/assets/movers/orient-tech.png'],
  [/\bphonepe\b/i, '/assets/movers/phonepe.png'],
  [/\bpremier\s+energies\b/i, '/assets/movers/premier-energies.png'],
  [/\brazorpay\b/i, '/assets/movers/razorpay.png'],
  [/\bswiggy\b/i, '/assets/movers/swiggy.png'],
  [/\bzepto\b/i, '/assets/movers/zepto.png'],
  [/\bzomato\b/i, '/assets/movers/zomato.png'],
  [/\bwaaree\b/i, '/assets/movers/waaree.png'],
  [/\bbajaj\s+housing\b/i, '/assets/movers/bajaj-housing.png'],
  [/\bunicommerce\b/i, '/assets/movers/unicommerce.png'],
  [/\bawfis\b/i, '/assets/movers/awfis.png'],
  [/\bmahanadi\b/i, '/assets/movers/mahanadi.svg'],
  [/\bwatrana\b/i, '/assets/movers/watrana.svg'],
  [/\bblackbuck\b|\bzinka\s*logistics\b/i, '/assets/movers/blackbuck.png'],
  [/\bonyx\s*biotec\b/i, '/assets/movers/onyx.svg'],
  [/\bmangal\s*compusolution\b/i, '/assets/movers/mangal.svg'],
  [/\bhero\s+motors\b/i, 'https://assets-netstorage.groww.in/stock-assets/logos2/GSTK544936.webp'],
  [/\bhero\s+motocorp\b/i, 'https://assets-netstorage.groww.in/stock-assets/logos2/HEROMOTOCO.webp'],
  [/\bnvidia\b/i, 'https://logo.clearbit.com/nvidia.com'],
  [/\bapple\b/i, 'https://logo.clearbit.com/apple.com'],
  [/\bmicrosoft\b/i, 'https://logo.clearbit.com/microsoft.com'],
  [/\balphabet\b|\bgoogle\b/i, 'https://logo.clearbit.com/abc.xyz'],
  [/\bamazon\b/i, 'https://logo.clearbit.com/amazon.com'],
  [/\bmeta\s+platforms\b|\bfacebook\b/i, 'https://logo.clearbit.com/meta.com'],
  [/\btesla\b/i, 'https://logo.clearbit.com/tesla.com'],
];

function normalizeStockSymbol(value?: string | null): string {
  return (value || '')
    .toUpperCase()
    .trim()
    // Accept common formats returned by exchanges and market-data providers.
    .replace(/^(?:(?:NSE|BSE)(?:_EQ|_BE)?)[\s:|_-]+/, '')
    .replace(/\.(?:NS|BO)$/, '')
    .replace(/-(?:EQ|BE|BZ)$/, '')
    .replace(/\s+/g, '');
}

export function resolveStaticLogo(symbol?: string | null, companyName?: string | null): string | null {
  const sym = normalizeStockSymbol(symbol);
  if (sym && KNOWN_STATIC_LOGOS[sym]) {
    return KNOWN_STATIC_LOGOS[sym];
  }
  const cleanSym = sym.replace(/[^A-Za-z0-9]/g, '');
  if (cleanSym && KNOWN_STATIC_LOGOS[cleanSym]) {
    return KNOWN_STATIC_LOGOS[cleanSym];
  }
  const name = (companyName || '').trim();
  if (!name) return null;
  for (const [pattern, path] of BRAND_NAME_LOGOS) {
    if (pattern.test(name)) return path;
  }
  const nameUpper = name.toUpperCase();
  for (const [key, path] of Object.entries(KNOWN_STATIC_LOGOS)) {
    if (key.length < 4) continue;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`).test(nameUpper)) {
      return path;
    }
  }
  return null;
}

function buildCompanyLogoProxyUrl(opts: {
  companyName: string;
  symbol?: string | null;
  bseCode?: string | null;
  logoUrl?: string | null;
  searchId?: string | null;
  logoColor?: string | null;
}): string {
  const sym = normalizeStockSymbol(opts.symbol);
  const params = new URLSearchParams();
  if (sym) {
    params.set('symbol', sym);
  }
  if (opts.bseCode && opts.bseCode !== 'N/A' && /^\d{6}$/.test(opts.bseCode.trim())) {
    params.set('bseCode', opts.bseCode.trim());
  }
  if (opts.logoUrl && opts.logoUrl.trim()) {
    params.set('url', opts.logoUrl.trim());
  }
  if (opts.searchId && opts.searchId.trim()) {
    params.set('searchId', opts.searchId.trim());
  }
  if (opts.companyName) {
    params.set('name', opts.companyName.slice(0, 60));
  }
  if (opts.logoColor && /^#[0-9a-fA-F]{6}$/.test(opts.logoColor)) {
    params.set('color', opts.logoColor);
  }
  return resolveApiUrl(`/api/company-logo?${params.toString()}`);
}

export function buildLogoCandidateList(opts: {
  companyName: string;
  symbol?: string | null;
  bseCode?: string | null;
  logoUrl?: string | null;
  searchId?: string | null;
  logoColor?: string | null;
}): string[] {
  const candidates: string[] = [];
  const sym = normalizeStockSymbol(opts.symbol);
  const cleanSym = sym.replace(/[^A-Z0-9]/g, '');
  const bse6 = (opts.bseCode || '').trim();

  // 1. Static mapped local asset
  const staticLogo = resolveStaticLogo(opts.symbol, opts.companyName);
  if (staticLogo && !candidates.includes(staticLogo)) {
    candidates.push(staticLogo);
  }

  // 2. Explicit logoUrl if specified
  if (opts.logoUrl && opts.logoUrl.trim()) {
    const trimmed = opts.logoUrl.trim();
    if (trimmed.startsWith('/assets/')) {
      if (!candidates.includes(trimmed)) candidates.push(trimmed);
    } else if (trimmed.startsWith('http')) {
      if (!candidates.includes(trimmed)) candidates.push(trimmed);
    } else if (trimmed.startsWith('/api/')) {
      const resolved = resolveApiUrl(trimmed);
      if (!candidates.includes(resolved)) candidates.push(resolved);
    }
  }

  // 3. Groww WebP CDN (covers a broad range of Indian equities directly in browser)
  // Try the exchange symbol and provider search ID: some small-cap listings use
  // a provider asset key that differs from their trading symbol.
  const cleanSearchId = String(opts.searchId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanSearchId && cleanSearchId !== cleanSym && !/^\d+$/.test(cleanSearchId)) {
    const searchLogo = `https://assets-netstorage.groww.in/stock-assets/logos2/${cleanSearchId}.webp`;
    if (!candidates.includes(searchLogo)) candidates.push(searchLogo);
    const searchPng = `https://assets-netstorage.groww.in/stock-assets/logos/${cleanSearchId}.png`;
    if (!candidates.includes(searchPng)) candidates.push(searchPng);
  }
  if (cleanSym && !/^\d+$/.test(cleanSym)) {
    const growwWebp = `https://assets-netstorage.groww.in/stock-assets/logos2/${cleanSym}.webp`;
    if (!candidates.includes(growwWebp)) candidates.push(growwWebp);

    // 4. Upstox CDN
    const upstoxPng = `https://assets.upstox.com/market-quote/symbols/logos/${cleanSym}.png`;
    if (!candidates.includes(upstoxPng)) candidates.push(upstoxPng);

    // 5. Dhan PNG CDN
    const dhanPng = `https://images.dhan.co/symbol/${cleanSym}.png`;
    if (!candidates.includes(dhanPng)) candidates.push(dhanPng);

    // 6. Groww PNG CDN
    const growwPng = `https://assets-netstorage.groww.in/stock-assets/logos/${cleanSym}.png`;
    if (!candidates.includes(growwPng)) candidates.push(growwPng);

    // 7. TradingView CDN (Vector SVGs)
    const tvSvgBig = `https://s3-symbol-logo.tradingview.com/${cleanSym.toLowerCase()}--big.svg`;
    if (!candidates.includes(tvSvgBig)) candidates.push(tvSvgBig);
    const tvSvg = `https://s3-symbol-logo.tradingview.com/${cleanSym.toLowerCase()}.svg`;
    if (!candidates.includes(tvSvg)) candidates.push(tvSvg);

    // 8. Global/US Ticker CDNs (Parqet & Nvstly)
    const parqetPng = `https://assets.parqet.com/logos/symbol/${cleanSym}?format=png`;
    if (!candidates.includes(parqetPng)) candidates.push(parqetPng);
    const nvstlyPng = `https://cdn.jsdelivr.net/gh/nvstly/icons@main/ticker_icons/${cleanSym}.png`;
    if (!candidates.includes(nvstlyPng)) candidates.push(nvstlyPng);

    // 9. Clearbit & Google Favicon high-res fallback for Global/US tickers
    const clearbitUrl = `https://logo.clearbit.com/${cleanSym.toLowerCase()}.com`;
    if (!candidates.includes(clearbitUrl)) candidates.push(clearbitUrl);
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${cleanSym.toLowerCase()}.com&sz=128`;
    if (!candidates.includes(googleFaviconUrl)) candidates.push(googleFaviconUrl);
  }

  // 6. BSE GSTK CDN if 6-digit BSE code (WebP and PNG variants)
  if (bse6 && /^\d{6}$/.test(bse6)) {
    const bseWebp = `https://assets-netstorage.groww.in/stock-assets/logos2/GSTK${bse6}.webp`;
    if (!candidates.includes(bseWebp)) candidates.push(bseWebp);
    const bseUrl = `https://assets-netstorage.groww.in/stock-assets/logos/GSTK${bse6}.png`;
    if (!candidates.includes(bseUrl)) candidates.push(bseUrl);
  }

  // 7. Broad Indian listed-company logo directory, including BSE-only listings.
  // Use exchange-qualified symbols so a BSE-only security is not mistaken for an NSE ticker.
  if (cleanSym && !/^\d+$/.test(cleanSym)) {
    const listedLogo = `https://api.dharun.dev/v1/logos/NSE:${encodeURIComponent(cleanSym)}`;
    if (!candidates.includes(listedLogo)) candidates.push(listedLogo);
  }
  if (bse6 && /^\d{6}$/.test(bse6)) {
    const bseListedLogo = `https://api.dharun.dev/v1/logos/BSE:${bse6}`;
    if (!candidates.includes(bseListedLogo)) candidates.push(bseListedLogo);
  }

  // 8. Alpha Vantage CDN
  if (cleanSym && !/^\d+$/.test(cleanSym)) {
    const avPng = `https://cdn.alphavantage.co/logos/${cleanSym}.png`;
    if (!candidates.includes(avPng)) candidates.push(avPng);
  }

  // 8. Backend proxy endpoint
  const proxyUrl = buildCompanyLogoProxyUrl(opts);
  if (!candidates.includes(proxyUrl)) candidates.push(proxyUrl);

  return candidates;
}

export function buildCompanyLogoUrl(opts: {
  companyName: string;
  symbol?: string | null;
  bseCode?: string | null;
  logoUrl?: string | null;
  searchId?: string | null;
  logoColor?: string | null;
}): string {
  const list = buildLogoCandidateList(opts);
  return list[0] || buildCompanyLogoProxyUrl(opts);
}

export function CompanyLogo({
  companyName,
  symbol,
  bseCode,
  logoUrl,
  searchId,
  logoColor,
  size = 'sm',
  className = '',
}: CompanyLogoProps) {
  const candidates = useMemo(
    () => buildLogoCandidateList({ companyName, symbol, bseCode, logoUrl, searchId, logoColor }),
    [companyName, symbol, bseCode, logoUrl, searchId, logoColor]
  );

  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  const sizeClass = SIZE_CLASSES[size];
  const initials = useMemo(() => getInitials(companyName, symbol), [companyName, symbol]);
  const bg = useMemo(() => getFallbackColor(companyName, logoColor), [companyName, logoColor]);

  if (candidateIndex >= candidates.length) {
    return (
      <div
        className={`${sizeClass} flex items-center justify-center text-white font-display font-bold shrink-0 select-none ${className}`}
        style={{ backgroundColor: bg }}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }

  const activeSrc = candidates[candidateIndex];

  return (
    <div
      className={`${sizeClass} bg-white border border-[#E2E8F0] dark:border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center ${className}`}
    >
      <img
        key={activeSrc}
        src={activeSrc}
        alt={`${companyName} logo`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          setCandidateIndex((prev) => prev + 1);
        }}
        className="h-full w-full object-contain p-0.5"
      />
    </div>
  );
}
