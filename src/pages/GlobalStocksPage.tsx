import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  ExternalLink,
  Globe2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { GlobalStockInstrument } from '../types/financial';
import { SEOHead } from '../components/common/SEOHead';
import {
  Breadcrumbs,
  DisclaimerBanner,
  EmptyState,
  ErrorRetryState,
  LoadingSkeleton,
} from '../components/common/StateViews';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { WatchlistButton } from '../components/common/WatchlistButton';

export function GlobalStocksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stocks, setStocks] = useState<GlobalStockInstrument[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [usdInrRate, setUsdInrRate] = useState<number>(84.45);
  const [sourceUrl, setSourceUrl] = useState<string>(
    'https://www.indmoney.com/investments/us-stocks/explore-all'
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const initialCategory = searchParams.get('category') || 'all';
  const [categoryTab, setCategoryTab] = useState<string>(initialCategory);
  const [exchangeFilter, setExchangeFilter] = useState<'All' | 'NASDAQ' | 'NYSE' | 'AMEX'>('All');
  const [mcapTier, setMcapTier] = useState<'All' | 'Mega' | 'Large' | 'Mid'>('All');
  const [currencyMode, setCurrencyMode] = useState<'BOTH' | 'USD' | 'INR'>('BOTH');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [directSymbol, setDirectSymbol] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.getIndmoneyUsExplore();
      if (res && res.stocks) {
        setStocks(res.stocks);
        setUsdInrRate(res.usdInrRate || 84.45);
        setSourceUrl(res.sourceUrl || 'https://www.indmoney.com/investments/us-stocks/explore-all');
        setTotalMatches(res.totalUniverse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve US stocks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering & sorting for zero-latency interactions
  const filteredStocks = useMemo(() => {
    let list = [...stocks];

    // Category Tabs
    if (categoryTab === 'mag7') {
      list = list.filter((s) => s.indmoneyCategory.includes('Magnificent 7'));
    } else if (categoryTab === 'ai') {
      list = list.filter((s) => s.indmoneyCategory.includes('Semiconductors'));
    } else if (categoryTab === 'saas') {
      list = list.filter((s) => s.indmoneyCategory.includes('SaaS'));
    } else if (categoryTab === 'fintech') {
      list = list.filter((s) => s.indmoneyCategory.includes('Wall Street'));
    } else if (categoryTab === 'buffett') {
      list = list.filter((s) => s.indmoneyCategory.includes('Buffett'));
    } else if (categoryTab === 'healthcare') {
      list = list.filter((s) => s.indmoneyCategory.includes('Healthcare'));
    } else if (categoryTab === 'consumer') {
      list = list.filter((s) => s.indmoneyCategory.includes('Consumer'));
    } else if (categoryTab === 'energy') {
      list = list.filter((s) => s.indmoneyCategory.includes('Energy'));
    } else if (categoryTab === 'etfs') {
      list = list.filter((s) => s.isEtf);
    } else if (categoryTab === 'gainers') {
      list = list.filter((s) => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
    } else if (categoryTab === 'losers') {
      list = list.filter((s) => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
    }

    // Exchange filter
    if (exchangeFilter !== 'All') {
      list = list.filter((s) => s.exchange === exchangeFilter);
    }

    // Market Cap Tier
    if (mcapTier === 'Mega') {
      list = list.filter((s) => s.marketCapUsd >= 200_000_000_000);
    } else if (mcapTier === 'Large') {
      list = list.filter(
        (s) => s.marketCapUsd >= 10_000_000_000 && s.marketCapUsd < 200_000_000_000
      );
    } else if (mcapTier === 'Mid') {
      list = list.filter((s) => s.marketCapUsd < 10_000_000_000);
    }

    // Search query
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q) ||
          s.industry.toLowerCase().includes(q) ||
          s.indmoneyCategory.toLowerCase().includes(q)
      );
    }

    return list;
  }, [stocks, categoryTab, exchangeFilter, mcapTier, debouncedSearch]);

  const paginatedStocks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStocks.slice(start, start + pageSize);
  }, [filteredStocks, page]);

  const totalPages = Math.ceil(filteredStocks.length / pageSize) || 1;

  const handleExportCsv = () => {
    if (filteredStocks.length === 0) return;
    const header = [
      'Symbol',
      'Company Name',
      'Exchange',
      'Price (USD)',
      'Price (INR)',
      'Day Change (USD)',
      'Day Change (%)',
      'Market Cap (USD)',
      'P/E Ratio',
      'Dividend Yield (%)',
      'Category',
    ];
    const rows = filteredStocks.map((s) => [
      s.symbol,
      `"${s.companyName.replace(/"/g, '""')}"`,
      s.exchange,
      s.priceUsd,
      s.priceInInr,
      s.changeUsd,
      s.changePercent,
      `"${s.marketCapFormatted}"`,
      s.peRatio ?? 'N/A',
      s.dividendYieldPct ? `${s.dividendYieldPct}%` : 'N/A',
      `"${s.indmoneyCategory}"`,
    ]);
    const blob = new Blob([[header.join(','), ...rows.map((r) => r.join(','))].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricealerter-us-stocks-${categoryTab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDirectLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = directSymbol.trim().toUpperCase();
    if (!sym) return;
    setSearchInput(sym);
    setCategoryTab('all');
    setDirectSymbol('');
  };

  const title = 'US & Global Stocks Terminal';

  return (
    <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6">
      <SEOHead
        title="Live US Stocks Terminal - NASDAQ, NYSE & US ETFs"
        description="Track live US stocks, Magnificent 7, S&P 500 leaders, and top US ETFs with live prices in USD ($) and converted INR (₹) powered by INDmoney explore directory."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: title }]} />

      {/* Header & Direct Lookup */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-900 mb-2">
            <Globe2 className="w-3.5 h-3.5" />
            INDmoney US Stocks Directory
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Real-time tracking of top global companies and ETFs across NASDAQ, NYSE, and AMEX with live
            USD to INR valuation ($1 = ₹{usdInrRate.toFixed(2)}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <form onSubmit={handleDirectLookup} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={directSymbol}
                onChange={(e) => setDirectSymbol(e.target.value)}
                placeholder="Find US ticker (e.g. AAPL, NVDA)..."
                className="w-full sm:w-60 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] pl-8 pr-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
            >
              Filter Ticker
            </button>
          </form>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 min-h-[38px] text-xs font-semibold text-[#152338] dark:text-slate-100 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Feed
          </button>

          {filteredStocks.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 min-h-[38px] text-xs font-semibold text-[#152338] dark:text-slate-100 hover:border-[#2563EB] cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          )}
        </div>
      </div>

      {/* Global Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3.5 py-2.5">
          <div className="text-[#64748B]">Active US Equities & ETFs</div>
          <div className="font-data text-base font-bold text-[#14263F] dark:text-white mt-0.5">
            {stocks.length} Global Leaders
          </div>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3.5 py-2.5">
          <div className="text-[#64748B]">USD / INR Reference Rate</div>
          <div className="font-data text-base font-bold text-[#059669] mt-0.5">
            ₹{usdInrRate.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3.5 py-2.5">
          <div className="text-[#64748B]">Exchanges Covered</div>
          <div className="font-data text-base font-bold text-[#2563EB] mt-0.5">
            NASDAQ · NYSE · AMEX
          </div>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3.5 py-2.5">
          <div className="text-[#64748B]">Fractional Ownership</div>
          <div className="font-data text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            Supported from $1 / ₹85
          </div>
        </div>
      </div>

      <DisclaimerBanner
        title="INDmoney US Stocks & Global Markets Data Provenance"
        text={`Equities and ETF quotations are curated from the official INDmoney US Stocks explore directory (${sourceUrl}) and real-time NASDAQ / NYSE exchange pricing feeds. Indian Rupee (INR) valuations are computed at the live USD/INR reference rate of ₹${usdInrRate.toFixed(2)}.`}
      />

      {/* Curated INDmoney Category Tabs */}
      <div className="flex md:flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'All US Stocks & ETFs' },
          { id: 'mag7', label: 'Magnificent 7' },
          { id: 'ai', label: 'AI & Semiconductors' },
          { id: 'saas', label: 'Enterprise SaaS' },
          { id: 'fintech', label: 'Fintech & Wall St' },
          { id: 'etfs', label: 'Top US ETFs' },
          { id: 'buffett', label: 'Warren Buffett Portfolio' },
          { id: 'healthcare', label: 'Healthcare' },
          { id: 'consumer', label: 'Consumer & Retail' },
          { id: 'energy', label: 'Energy & Defense' },
          { id: 'gainers', label: 'Top Gainers' },
          { id: 'losers', label: 'Top Losers' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setCategoryTab(t.id);
              setPage(1);
            }}
            className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              categoryTab === t.id
                ? 'bg-[#14263F] text-white border-[#14263F] dark:bg-[#2563EB] dark:border-[#2563EB]'
                : 'bg-white dark:bg-[#111C2E] text-[#64748B] dark:text-slate-300 border-[#E2E8F0] dark:border-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 text-xs">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Filter by symbol, company, or sector..."
          className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100 w-full sm:w-72"
        />

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <select
            value={exchangeFilter}
            onChange={(e) => {
              setExchangeFilter(e.target.value as 'All' | 'NASDAQ' | 'NYSE' | 'AMEX');
              setPage(1);
            }}
            aria-label="Filter Exchange"
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
          >
            <option value="All">All Exchanges</option>
            <option value="NASDAQ">NASDAQ</option>
            <option value="NYSE">NYSE</option>
            <option value="AMEX">AMEX (NYSE Arca)</option>
          </select>

          <select
            value={mcapTier}
            onChange={(e) => {
              setMcapTier(e.target.value as 'All' | 'Mega' | 'Large' | 'Mid');
              setPage(1);
            }}
            aria-label="Filter Market Cap"
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
          >
            <option value="All">All Market Caps</option>
            <option value="Mega">Mega Cap (≥ $200B)</option>
            <option value="Large">Large Cap ($10B – $200B)</option>
            <option value="Mid">Mid Cap (&lt; $10B)</option>
          </select>
        </div>

        {/* Currency Display Toggle */}
        <div className="inline-flex rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-0.5 bg-white dark:bg-[#111C2E]">
          <button
            type="button"
            onClick={() => setCurrencyMode('BOTH')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
              currencyMode === 'BOTH'
                ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                : 'text-[#64748B] dark:text-slate-300'
            }`}
          >
            Both ($ / ₹)
          </button>
          <button
            type="button"
            onClick={() => setCurrencyMode('USD')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
              currencyMode === 'USD'
                ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                : 'text-[#64748B] dark:text-slate-300'
            }`}
          >
            USD ($)
          </button>
          <button
            type="button"
            onClick={() => setCurrencyMode('INR')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
              currencyMode === 'INR'
                ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                : 'text-[#64748B] dark:text-slate-300'
            }`}
          >
            INR (₹)
          </button>
        </div>

        <span className="font-data text-[#64748B] sm:ml-auto">
          {filteredStocks.length} matching securities
        </span>
      </div>

      {error && <ErrorRetryState message={error} onRetry={() => loadData(true)} />}

      {loading ? (
        <LoadingSkeleton rows={10} />
      ) : filteredStocks.length === 0 ? (
        <EmptyState
          title="No US stocks matched your filters"
          description="Try broadening your category, exchange, or search term to discover global equities."
          actionLabel="Reset Filters"
          onAction={() => {
            setCategoryTab('all');
            setExchangeFilter('All');
            setMcapTier('All');
            setSearchInput('');
            setPage(1);
          }}
        />
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Company / Symbol</th>
                  <th className="py-3 px-3">Exchange</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Day Change</th>
                  <th className="py-3 px-3">52W Range</th>
                  <th className="py-3 px-3">Market Cap</th>
                  <th className="py-3 px-3">P/E Ratio</th>
                  <th className="py-3 px-3">Div Yield</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-4 text-right">Watchlist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                {paginatedStocks.map((s) => {
                  const isUp = s.changePercent >= 0;
                  return (
                    <tr
                      key={s.symbol}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <CompanyLogo
                            companyName={s.companyName}
                            symbol={s.symbol}
                            logoUrl={s.logoUrl}
                            size="sm"
                          />
                          <div>
                            <div className="font-semibold text-[#14263F] dark:text-white flex items-center gap-1.5">
                              <span>{s.symbol}</span>
                              {s.isEtf && (
                                <span className="text-[10px] uppercase font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded">
                                  ETF
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#64748B] dark:text-slate-400 line-clamp-1 max-w-[220px]">
                              {s.companyName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-data font-semibold text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-300">
                          {s.exchange}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {currencyMode === 'USD' ? (
                          <div className="font-data font-bold text-sm text-[#14263F] dark:text-white">
                            ${s.priceUsd.toFixed(2)}
                          </div>
                        ) : currencyMode === 'INR' ? (
                          <div className="font-data font-bold text-sm text-[#14263F] dark:text-white">
                            ₹{s.priceInInr.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <div>
                            <div className="font-data font-bold text-sm text-[#14263F] dark:text-white">
                              ${s.priceUsd.toFixed(2)}
                            </div>
                            <div className="font-data text-[11px] text-[#64748B] dark:text-slate-400">
                              ₹{s.priceInInr.toLocaleString('en-IN')}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div
                          className={`inline-flex items-center gap-0.5 font-data font-semibold text-xs ${
                            isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isUp ? (
                            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>
                            {isUp ? '+' : ''}
                            {s.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="font-data text-[11px] text-[#94A3B8]">
                          {isUp ? '+' : ''}${s.changeUsd.toFixed(2)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-data text-[11px] text-[#64748B] dark:text-slate-400">
                          ${s.week52LowUsd.toFixed(1)} – ${s.week52HighUsd.toFixed(1)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-data font-semibold text-[#14263F] dark:text-white">
                          {s.marketCapFormatted}
                        </div>
                        <div className="font-data text-[11px] text-[#94A3B8]">
                          ≈ ₹{Math.round((s.marketCapUsd * usdInrRate) / 10_000_000).toLocaleString('en-IN')} Cr
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-data text-[#152338] dark:text-slate-300">
                          {s.peRatio ? s.peRatio.toFixed(1) : '—'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-data text-[#152338] dark:text-slate-300">
                          {s.dividendYieldPct ? `${s.dividendYieldPct.toFixed(2)}%` : '—'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-300 truncate max-w-[150px]">
                          {s.indmoneyCategory}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <WatchlistButton
                          itemType="stock"
                          itemKey={s.symbol}
                          label={s.symbol}
                          compact
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-xs text-[#64748B]">
              <div>
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, filteredStocks.length)} of {filteredStocks.length} US securities
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <span className="px-2 font-data font-semibold text-[#14263F] dark:text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
