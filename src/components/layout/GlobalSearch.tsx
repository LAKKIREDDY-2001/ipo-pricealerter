import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Building2, Clock, Newspaper, Search, TrendingUp, X } from 'lucide-react';
import { api } from '../../services/api';
import type { BlogArticle, IPOOffering, MarketInsight, StockInstrument } from '../../types/financial';
import { formatINR, formatStockTickerLabel } from '../../utils/calculations';
import { CompanyLogo } from '../common/CompanyLogo';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  { label: 'Crystal Crop Protection IPO', to: '/ipo/crystal-crop-protection-ipo' },
  { label: 'RELIANCE', to: '/stock/RELIANCE' },
  { label: 'TCS', to: '/stock/TCS' },
  { label: 'HDFCBANK', to: '/stock/HDFCBANK' },
  { label: 'Zepto IPO', to: '/ipo/zepto-ipo' },
  { label: 'IPO GMP Explained', to: '/blog/ipo-gmp-explained-what-grey-market-premium-means' },
];

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    ipos: IPOOffering[];
    stocks: StockInstrument[];
    blogs: BlogArticle[];
    insights: MarketInsight[];
    sectors: string[];
  }>({ ipos: [], stocks: [], blogs: [], insights: [], sectors: [] });
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pa_recent_searches') || '[]') as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ ipos: [], stocks: [], blogs: [], insights: [], sectors: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSearch(trimmed);
        setResults(res);
      } catch {
        // ignore transient search errors
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const saveRecent = (term: string) => {
    const next = [term, ...recentSearches.filter((r) => r !== term)].slice(0, 5);
    setRecentSearches(next);
    try {
      localStorage.setItem('pa_recent_searches', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const goTo = (path: string, recordTerm?: string) => {
    if (recordTerm) saveRecent(recordTerm);
    onClose();
    navigate(path);
  };

  const cleanTickerCandidate = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const hasAnyResults =
    results.ipos.length > 0 ||
    results.stocks.length > 0 ||
    results.blogs.length > 0 ||
    results.insights.length > 0 ||
    results.sectors.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#14263F]/60 backdrop-blur-xs flex items-start justify-center pt-4 sm:pt-20 px-3 sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Financial Search"
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 border-b border-[#E2E8F0] dark:border-slate-800">
          <Search className="w-4 h-4 text-[#64748B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                if (results.ipos[0]) {
                  goTo(`/ipo/${results.ipos[0].slug}`, results.ipos[0].companyName);
                } else if (results.stocks[0]) {
                  goTo(`/stock/${results.stocks[0].symbol}`, results.stocks[0].symbol);
                } else if (cleanTickerCandidate.length >= 2) {
                  goTo(`/stock/${cleanTickerCandidate}`, cleanTickerCandidate);
                }
              }
            }}
            placeholder="Search IPOs, NSE/BSE tickers (RELIANCE, TCS)..."
            className="flex-1 min-w-0 bg-transparent text-base sm:text-sm text-[#152338] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-md text-[#64748B] hover:text-[#152338] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-5">
          {!query.trim() && (
            <>
              {recentSearches.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Recent Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="rounded-md border border-[#E2E8F0] dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-2">
                  Popular Queries
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_SEARCHES.map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => goTo(item.to, item.label)}
                      className="flex items-center justify-between rounded-lg border border-[#E2E8F0] dark:border-slate-800 px-3 py-2 text-left text-xs font-medium text-[#152338] dark:text-slate-200 hover:border-[#2563EB] dark:hover:border-blue-500 transition-colors cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {query.trim() && loading && (
            <div className="text-xs text-[#64748B] py-4 text-center">Searching PriceAlerter index...</div>
          )}

          {query.trim() && !loading && (
            <>
              {results.ipos.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>IPO Offerings</span>
                  </div>
                  <div className="space-y-1">
                    {results.ipos.map((ipo) => (
                      <button
                        key={ipo.id}
                        type="button"
                        onClick={() => goTo(`/ipo/${ipo.slug}`, ipo.companyName)}
                        className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CompanyLogo
                            size="sm"
                            companyName={ipo.companyName}
                            symbol={ipo.listing.stockSymbol}
                            logoUrl={ipo.logoUrl}
                            logoColor={ipo.logoColor}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[#152338] dark:text-slate-100 truncate">
                              {ipo.companyName}
                            </div>
                            <div className="text-xs text-[#64748B] dark:text-slate-400 truncate">
                              {ipo.category} · {ipo.status} · {ipo.sector}
                            </div>
                          </div>
                        </div>
                        <span className="font-data text-xs font-semibold text-[#152338] dark:text-slate-200 shrink-0">
                          {ipo.priceBandHigh
                            ? ipo.priceBandLow && ipo.priceBandLow !== ipo.priceBandHigh
                              ? `₹${ipo.priceBandLow}–₹${ipo.priceBandHigh}`
                              : `₹${ipo.priceBandHigh}`
                            : 'TBA'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.stocks.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Listed Stocks (NSE / BSE)</span>
                  </div>
                  <div className="space-y-1">
                    {results.stocks.map((stk) => (
                      <button
                        key={stk.id}
                        type="button"
                        onClick={() => goTo(`/stock/${stk.symbol}`, stk.companyName)}
                        className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CompanyLogo
                            size="sm"
                            companyName={stk.companyName}
                            symbol={stk.symbol}
                            bseCode={stk.bseCode}
                            logoUrl={stk.logoUrl}
                            searchId={stk.searchId}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[#152338] dark:text-slate-100 truncate">
                              {stk.companyName}{' '}
                              <span className="font-data text-xs font-normal text-[#64748B] dark:text-slate-400">
                                ({formatStockTickerLabel(stk.symbol, stk.bseCode)})
                              </span>
                            </div>
                            <div className="text-xs text-[#64748B] dark:text-slate-400 truncate">
                              {stk.exchange}
                              {stk.bseCode && stk.bseCode !== 'N/A' ? ` · BSE ${stk.bseCode}` : ''} · {stk.sector}
                            </div>
                          </div>
                        </div>
                        <span className="font-data text-xs font-semibold text-[#152338] dark:text-slate-200 shrink-0">
                          {formatINR(stk.currentPrice)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.sectors.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-2">
                    Sectors
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.sectors.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => goTo(`/live-prices?sector=${encodeURIComponent(sec)}`, sec)}
                        className="rounded-md border border-[#E2E8F0] dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-[#2563EB] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                      >
                        {sec} Stocks →
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.insights.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5" />
                    <span>Market Insights</span>
                  </div>
                  <div className="space-y-1">
                    {results.insights.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => goTo(`/market-insights/${m.slug}`, m.title)}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer"
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.blogs.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Investor Education</span>
                  </div>
                  <div className="space-y-1">
                    {results.blogs.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => goTo(`/blog/${b.slug}`, b.title)}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer"
                      >
                        {b.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {cleanTickerCandidate.length >= 2 && (
                <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => goTo(`/stock/${cleanTickerCandidate}`, cleanTickerCandidate)}
                    className="w-full flex items-center justify-between rounded-lg bg-[#F6F8FB] dark:bg-slate-800/60 px-3 py-2.5 text-xs font-medium text-[#2563EB] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span>
                      Look up NSE/BSE symbol &ldquo;{cleanTickerCandidate}&rdquo; directly from exchange feed
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!hasAnyResults && cleanTickerCandidate.length < 2 && (
                <div className="py-6 text-center text-xs text-[#64748B] dark:text-slate-400">
                  No matching IPOs, stocks, sectors, or guides found for &ldquo;{query}&rdquo;.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
