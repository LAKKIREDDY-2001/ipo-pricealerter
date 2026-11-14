import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, RefreshCw, Search } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { StockInstrument } from '../types/financial';
import { formatTimestampIN } from '../utils/calculations';
import { SEOHead } from '../components/common/SEOHead';
import {
  Breadcrumbs,
  DisclaimerBanner,
  EmptyState,
  ErrorRetryState,
  LoadingSkeleton,
} from '../components/common/StateViews';
import { StockTable } from '../components/stocks/StockTable';
import { SectorHeatmap } from '../components/stocks/SectorHeatmap';
import { useLiveMarketStream } from '../hooks/useLiveMarketStream';

interface LiveStocksPageProps {
  presetExchange?: 'NSE' | 'BSE';
}

const PAGE_SIZE = 50;

export function LiveStocksPage({ presetExchange }: LiveStocksPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, watchlist } = useAuth();

  const initialTab = searchParams.get('tab');
  const initialSector = searchParams.get('sector') || 'All';

  const [stocks, setStocks] = useState<StockInstrument[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalUniverse, setTotalUniverse] = useState(0);
  const [nseCount, setNseCount] = useState(0);
  const [bseCount, setBseCount] = useState(0);
  const [liveSyncedAt, setLiveSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [section, setSection] = useState<
    'all' | 'nse' | 'bse' | 'gainers' | 'losers' | 'active' | 'sectors' | 'watchlist'
  >(
    presetExchange === 'NSE'
      ? 'nse'
      : presetExchange === 'BSE'
        ? 'bse'
        : initialTab === 'gainers'
          ? 'gainers'
          : initialTab === 'losers'
            ? 'losers'
            : initialTab === 'sectors'
              ? 'sectors'
              : 'all'
  );

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sector, setSector] = useState(initialSector);
  const [mcapTier, setMcapTier] = useState<'All' | 'Large' | 'Mid' | 'Small'>('All');
  const [sortBy, setSortBy] = useState<string>('marketCapCr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [directLookup, setDirectLookup] = useState('');

  useEffect(() => {
    if (presetExchange === 'NSE') setSection('nse');
    else if (presetExchange === 'BSE') setSection('bse');
    setPage(1);
  }, [presetExchange]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadStocks = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) setRefreshing(true);
      else if (stocks.length === 0) setLoading(true);
      setError(null);

      try {
        if (section === 'watchlist') {
          if (!user) {
            setStocks([]);
            setTotalMatches(0);
            setLoading(false);
            setRefreshing(false);
            return;
          }
          const wlSymbols = watchlist
            .filter((w) => w.itemType === 'stock')
            .map((w) => w.itemKey.toUpperCase());
          if (wlSymbols.length === 0) {
            setStocks([]);
            setTotalMatches(0);
            setLoading(false);
            setRefreshing(false);
            return;
          }
          const settled = await Promise.allSettled(
            wlSymbols.map((sym) => api.getStockBySymbol(sym, '1mo'))
          );
          const wlStocks = settled
            .filter(
              (r): r is PromiseFulfilledResult<{
                stock: StockInstrument;
                fromUpstream: boolean;
                linkedIpo: null;
              }> => r.status === 'fulfilled'
            )
            .map((r) => r.value.stock);
          setStocks(wlStocks);
          setTotalMatches(wlStocks.length);
          setLiveSyncedAt(new Date().toISOString());
          return;
        }

        const exchangeParam =
          section === 'nse'
            ? 'NSE'
            : section === 'bse'
              ? 'BSE'
              : presetExchange || 'All';
        const tabParam =
          section === 'gainers' || section === 'losers' || section === 'active'
            ? section
            : undefined;

        const res = await api.getStocks({
          exchange: exchangeParam,
          sector: sector !== 'All' ? sector : undefined,
          q: debouncedSearch || undefined,
          mcapTier,
          tab: tabParam,
          sortBy: tabParam ? undefined : sortBy,
          sortDir: tabParam ? undefined : sortDir,
          page: section === 'sectors' ? 1 : page,
          limit: section === 'sectors' ? 100 : PAGE_SIZE,
          refresh: forceRefresh,
        });

        setStocks(res.stocks);
        setTotalMatches(res.total);
        setTotalUniverse(res.totalUniverse);
        setNseCount(res.nseCount);
        setBseCount(res.bseCount);
        setSectors(res.sectors);
        setLiveSyncedAt(res.liveSyncedAt || new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load NSE/BSE live equity feed.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [section, user, watchlist, presetExchange, sector, debouncedSearch, mcapTier, sortBy, sortDir, page]
  );

  useEffect(() => {
    loadStocks(false);
  }, [loadStocks]);

  useEffect(() => {
    if (!autoRefresh || section === 'sectors') return;
    const timer = setInterval(() => {
      loadStocks(true);
    }, 30_000);
    return () => clearInterval(timer);
  }, [autoRefresh, section, loadStocks]);

  useLiveMarketStream({
    enabled: autoRefresh && section !== 'sectors',
    onStocks: () => {
      void loadStocks(false);
    },
  });

  const handleDirectLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = directLookup.trim().toUpperCase();
    if (sym) {
      navigate(`/stock/${encodeURIComponent(sym)}`);
    }
  };

  const handleExportCsv = () => {
    if (stocks.length === 0) return;
    const header = ['Symbol', 'Company', 'Exchange', 'BSE_Code', 'Sector', 'LTP_INR', 'PrevClose_INR', 'Change_Pct', 'Volume', 'MarketCap_Cr'];
    const rows = stocks.map((s) => {
      const pct =
        s.currentPrice !== null && s.previousClose
          ? (((s.currentPrice - s.previousClose) / s.previousClose) * 100).toFixed(2)
          : '';
      return [
        s.symbol,
        `"${s.companyName.replace(/"/g, '""')}"`,
        s.exchange,
        s.bseCode || '',
        `"${s.sector}"`,
        s.currentPrice ?? '',
        s.previousClose ?? '',
        pct,
        s.volume ?? '',
        s.marketCapCr ?? '',
      ].join(',');
    });
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricealerter-stocks-${section}-p${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const title =
    presetExchange === 'NSE'
      ? 'Live NSE Listed Stocks Terminal'
      : presetExchange === 'BSE'
        ? 'Live BSE Listed Stocks Terminal'
        : 'Live NSE & BSE All Indian Stocks Terminal';

  return (
    <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6">
      <SEOHead
        title={title}
        description="Track live share prices across all NSE and BSE listed Indian equities with LTP, day change, volume, market cap, and real-time alert integration."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: title }]} />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Live coverage across {totalUniverse > 0 ? totalUniverse.toLocaleString('en-IN') : '5,500+'} active Indian equities
            ({nseCount > 0 ? `${nseCount.toLocaleString('en-IN')} NSE` : 'NSE'} · {bseCount > 0 ? `${bseCount.toLocaleString('en-IN')} BSE` : 'BSE'}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <form onSubmit={handleDirectLookup} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={directLookup}
                onChange={(e) => setDirectLookup(e.target.value)}
                placeholder="Open symbol or BSE code..."
                className="w-full sm:w-56 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] pl-8 pr-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
            >
              Open Stock
            </button>
          </form>

          <button
            type="button"
            onClick={() => setAutoRefresh((p) => !p)}
            className={`rounded-lg border px-3 py-2 min-h-[38px] text-xs font-semibold cursor-pointer whitespace-nowrap ${
              autoRefresh
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400'
                : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] text-[#64748B]'
            }`}
          >
            Auto-Refresh: {autoRefresh ? 'ON (30s)' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => loadStocks(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 min-h-[38px] text-xs font-semibold text-[#152338] dark:text-slate-100 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Live
          </button>

          {section !== 'sectors' && stocks.length > 0 && (
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

      {/* Live Feed Metadata Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3.5 py-2.5">
          <div className="text-[#64748B]">All Active Indian Stocks</div>
          <div className="font-data text-base font-bold text-[#14263F] dark:text-white mt-0.5">
            {totalUniverse > 0 ? totalUniverse.toLocaleString('en-IN') : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3.5 py-2.5">
          <div className="text-[#64748B]">NSE Equities</div>
          <div className="font-data text-base font-bold text-[#059669] mt-0.5">
            {nseCount > 0 ? nseCount.toLocaleString('en-IN') : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3.5 py-2.5">
          <div className="text-[#64748B]">BSE Equities</div>
          <div className="font-data text-base font-bold text-[#2563EB] mt-0.5">
            {bseCount > 0 ? bseCount.toLocaleString('en-IN') : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3.5 py-2.5">
          <div className="text-[#64748B]">Last Feed Sync (IST)</div>
          <div className="font-data text-xs font-semibold text-[#152338] dark:text-slate-200 mt-1">
            {formatTimestampIN(liveSyncedAt)}
          </div>
        </div>
      </div>

      <DisclaimerBanner
        title="Live NSE & BSE Exchange Data Provenance"
        text="Quotes reflect the latest traded price (LTP), day change, OHLC, and volume synced from the connected NSE/BSE market adapter with IST timestamps. Outside market hours (9:15 AM – 3:30 PM IST) or on weekends, prices reflect the latest settled session."
      />

      {/* Tabs */}
      <div className="flex md:flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { id: 'all', label: 'All India (NSE & BSE)' },
            { id: 'nse', label: 'NSE Stocks' },
            { id: 'bse', label: 'BSE Stocks' },
            { id: 'gainers', label: 'Top Gainers' },
            { id: 'losers', label: 'Top Losers' },
            { id: 'active', label: 'Most Active' },
            { id: 'sectors', label: 'Sector Heatmap' },
            { id: 'watchlist', label: 'Watchlist' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSection(t.id);
              setPage(1);
            }}
            className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              section === t.id
                ? 'bg-[#14263F] text-white border-[#14263F] dark:bg-[#2563EB] dark:border-[#2563EB]'
                : 'bg-white dark:bg-[#111C2E] text-[#64748B] dark:text-slate-300 border-[#E2E8F0] dark:border-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section !== 'sectors' && section !== 'watchlist' && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 text-xs">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Search all ${totalUniverse > 0 ? totalUniverse.toLocaleString('en-IN') : '5,500+'} NSE/BSE stocks by symbol, BSE code, ISIN, or name...`}
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100 w-full sm:w-80"
          />
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <select
              value={sector}
              onChange={(e) => {
                setSector(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Sector"
              className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
            >
              <option value="All">All Sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={mcapTier}
              onChange={(e) => {
                setMcapTier(e.target.value as 'All' | 'Large' | 'Mid' | 'Small');
                setPage(1);
              }}
              aria-label="Market Cap Tier"
              className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
            >
              <option value="All">All Market Caps</option>
              <option value="Large">Large Cap (≥ ₹20,000 Cr)</option>
              <option value="Mid">Mid Cap (₹5,000 – ₹20,000 Cr)</option>
              <option value="Small">Small Cap (&lt; ₹5,000 Cr)</option>
            </select>
          </div>
          <span className="font-data text-[#64748B] sm:ml-auto">
            {totalMatches.toLocaleString('en-IN')} matching equities
          </span>
        </div>
      )}

      {error && <ErrorRetryState message={error} onRetry={() => loadStocks(true)} />}

      {loading ? (
        <LoadingSkeleton rows={10} />
      ) : section === 'sectors' ? (
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5">
          <h2 className="text-base font-semibold text-[#152338] dark:text-white mb-4">
            Sector Performance Overview (Top Equities)
          </h2>
          <SectorHeatmap stocks={stocks} />
        </div>
      ) : section === 'watchlist' && !user ? (
        <EmptyState
          title="Sign in to view your stock watchlist"
          description="Authenticate to save NSE & BSE stocks and configure price alerts."
          actionLabel="Sign In"
          onAction={() => navigate('/login')}
        />
      ) : stocks.length === 0 ? (
        <EmptyState
          title="No securities matched your filters"
          description="Try resetting your sector, exchange, or market capitalization filters, or look up any symbol directly above."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchInput('');
            setDebouncedSearch('');
            setSector('All');
            setMcapTier('All');
            setPage(1);
          }}
        />
      ) : (
        <StockTable
          stocks={stocks}
          pageSize={PAGE_SIZE}
          serverPagination={
            section === 'watchlist'
              ? undefined
              : {
                  page,
                  pageSize: PAGE_SIZE,
                  total: totalMatches,
                  onPageChange: (next) => setPage(next),
                }
          }
          onSortChange={
            section === 'watchlist'
              ? undefined
              : (key, asc) => {
                  setSortBy(key);
                  setSortDir(asc ? 'asc' : 'desc');
                }
          }
        />
      )}
    </main>
  );
}
