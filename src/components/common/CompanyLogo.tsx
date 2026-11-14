import React, { useMemo, useState } from 'react';
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
  RELIANCE: '/assets/movers/reliance.png',
  TCS: '/assets/movers/tcs.png',
  HDFCBANK: '/assets/movers/hdfc-bank.png',
  ICICIBANK: '/assets/movers/icici-bank.png',
  INFY: '/assets/movers/infosys.png',
  BHARTIARTL: '/assets/movers/airtel.png',
  SBIN: '/assets/movers/sbi.png',
  LT: '/assets/movers/lt.png',
  ITC: '/assets/movers/itc.png',
  SUNPHARMA: '/assets/movers/sun-pharma.png',
  TATAMOTORS: '/assets/movers/tatamotors.png',
  HINDUNILVR: '/assets/movers/hul.png',
  BAJFINANCE: '/assets/movers/bajaj-finance.png',
  KOTAKBANK: '/assets/movers/kotak-bank.png',
  AXISBANK: '/assets/movers/axis-bank.png',
  NTPC: '/assets/movers/ntpc.png',
  NTPCGREEN: '/assets/movers/ntpc-green.png',
  ONGC: '/assets/movers/ongc.png',
  TITAN: '/assets/movers/titan.png',
  MARUTI: '/assets/movers/maruti.png',
  ADANIENT: '/assets/movers/adani-enterprises.png',
  ADANIPORTS: '/assets/movers/adani-ports.png',
  ADANIPOWER: '/assets/movers/adani-power.png',
  ADANIGREEN: '/assets/movers/adani-green.png',
  COALINDIA: '/assets/movers/coal-india.png',
  TATASTEEL: '/assets/movers/tata-steel.png',
  WIPRO: '/assets/movers/wipro.png',
  CIPLA: '/assets/movers/cipla.png',
  ULTRACEMCO: '/assets/movers/ultratech.png',
  ASIANPAINT: '/assets/movers/asian-paints.png',
  ZOMATO: '/assets/movers/zomato.png',
  SWIGGY: '/assets/movers/swiggy.png',
  TRENT: '/assets/movers/trent.png',
  JIOFIN: '/assets/movers/jio-fin.png',
  IRFC: '/assets/movers/irfc.png',
  RVNL: '/assets/movers/rvnl.png',
  SUZLON: '/assets/movers/suzlon.png',
  HAL: '/assets/movers/hal.png',
  MAZDOCK: '/assets/movers/mazdock.png',
  COCHINSHIP: '/assets/movers/cochin-shipyard.png',
  BHEL: '/assets/movers/bhel.png',
  REC: '/assets/movers/rec.png',
  PFC: '/assets/movers/pfc.png',
  TATAPOWER: '/assets/movers/tata-power.png',
  DLF: '/assets/movers/dlf.png',
  POLYCAB: '/assets/movers/polycab.png',
  HAVELLS: '/assets/movers/havells.png',
  DIXON: '/assets/movers/dixon.png',
  CDSL: '/assets/movers/cdsl.png',
  BSE: '/assets/movers/bse.png',
  MCX: '/assets/movers/mcx.png',
  ANGELONE: '/assets/movers/angel-one.png',
  DMART: '/assets/movers/dmart.png',
  WAAREEENER: '/assets/movers/waaree.png',
  HYUNDAI: '/assets/movers/hyundai.png',
  PREMIERENE: '/assets/movers/premier-energies.png',
  BAJAJHFL: '/assets/movers/bajaj-housing.png',
  OLAELEC: '/assets/movers/ola-electric.png',
  FIRSTCRY: '/assets/movers/firstcry.png',
  UNICOMMERCE: '/assets/movers/unicommerce.png',
  KRN: '/assets/movers/krn.png',
  MANBA: '/assets/movers/manba.png',
  ORIENTTECH: '/assets/movers/orient-tech.png',
  TATATECH: '/assets/movers/tata-tech.png',
  KAYNES: '/assets/movers/kaynes.png',
  TEJASNET: '/assets/movers/tejas.png',
  JYOTICNC: '/assets/movers/jyoti-cnc.png',
  EXIDEIND: '/assets/movers/exide.png',
  ANTALA: '/assets/movers/antala.png',
  VEDL: '/assets/movers/vedanta.png',
  CRYSTAL: '/assets/movers/crystal-crop.png',
  CRYSTALCRO: '/assets/movers/crystal-crop.png',
  ENVIRO: '/assets/movers/enviro-infra.png',
  C2C: '/assets/movers/c2c-advanced.png',
  LAMOSAIC: '/assets/movers/lamosaic.png',
  RAJESH: '/assets/movers/rajesh-power.png',
  RAJPUTANA: '/assets/movers/rajputana.png',
  BOMBAY: '/assets/movers/bombay-coated.png',
};

export function buildCompanyLogoUrl(opts: {
  companyName: string;
  symbol?: string | null;
  bseCode?: string | null;
  logoUrl?: string | null;
  searchId?: string | null;
  logoColor?: string | null;
}): string {
  if (opts.logoUrl && (opts.logoUrl.startsWith('/') || opts.logoUrl.startsWith('http'))) {
    return opts.logoUrl;
  }
  const sym = (opts.symbol || '').toUpperCase().trim();
  if (sym && KNOWN_STATIC_LOGOS[sym]) {
    return KNOWN_STATIC_LOGOS[sym];
  }
  const nameUpper = (opts.companyName || '').toUpperCase();
  for (const [key, path] of Object.entries(KNOWN_STATIC_LOGOS)) {
    if (nameUpper.includes(key)) {
      return path;
    }
  }
  const params = new URLSearchParams();
  if (sym) {
    params.set('symbol', sym);
  }
  if (opts.bseCode && opts.bseCode !== 'N/A' && /^\d{6}$/.test(opts.bseCode.trim())) {
    params.set('bseCode', opts.bseCode.trim());
  }
  if (opts.companyName) {
    params.set('name', opts.companyName.slice(0, 60));
  }
  if (opts.logoColor && /^#[0-9a-fA-F]{6}$/.test(opts.logoColor)) {
    params.set('color', opts.logoColor);
  }
  return resolveApiUrl(`/api/company-logo?${params.toString()}`);
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
  const [errored, setErrored] = useState(false);

  const src = useMemo(
    () => buildCompanyLogoUrl({ companyName, symbol, bseCode, logoUrl, searchId, logoColor }),
    [companyName, symbol, bseCode, logoUrl, searchId, logoColor]
  );

  const sizeClass = SIZE_CLASSES[size];
  const initials = useMemo(() => getInitials(companyName, symbol), [companyName, symbol]);
  const bg = useMemo(() => getFallbackColor(companyName, logoColor), [companyName, logoColor]);

  if (errored) {
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

  return (
    <div
      className={`${sizeClass} bg-white border border-[#E2E8F0] dark:border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center ${className}`}
    >
      <img
        src={src}
        alt={`${companyName} logo`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
        className="h-full w-full object-contain p-0.5"
      />
    </div>
  );
}
