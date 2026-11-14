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

export function buildCompanyLogoUrl(opts: {
  companyName: string;
  symbol?: string | null;
  bseCode?: string | null;
  logoUrl?: string | null;
  searchId?: string | null;
  logoColor?: string | null;
}): string {
  const params = new URLSearchParams();
  if (opts.symbol && opts.symbol.trim()) {
    params.set('symbol', opts.symbol.trim().toUpperCase());
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
