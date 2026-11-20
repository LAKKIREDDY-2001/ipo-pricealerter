import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Calculator,
  ExternalLink,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type {
  BlogArticle,
  IPOOffering,
  MarketIndexInstrument,
  MarketInsight,
  StockInstrument,
} from '../types/financial';
import {
  calculateCurrentReturnPct,
  calculateGMPEstimate,
  calculateListingGainPct,
  formatDateIN,
  formatINR,
  formatNumberIN,
  formatPercent,
  formatStockTickerLabel,
  formatTimestampIN,
} from '../utils/calculations';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { SEOHead } from '../components/common/SEOHead';
import { IPOTable } from '../components/ipo/IPOTable';
import { GMPChart } from '../components/gmp/GMPChart';
import { StockTable } from '../components/stocks/StockTable';
import { SectorHeatmap } from '../components/stocks/SectorHeatmap';
import { MacroCommoditiesBar } from '../components/market/MacroCommoditiesBar';
import { FreeAlertsLeadMagnet } from '../components/marketing/FreeAlertsLeadMagnet';
import {
  DisclaimerBanner,
  EmptyState,
  ErrorRetryState,
  LoadingSkeleton,
} from '../components/common/StateViews';
import { DataQualityBadge } from '../components/common/DataQualityBadge';
import { AdSlot } from '../components/ads/AdSlot';
import { useLiveMarketStream } from '../hooks/useLiveMarketStream';

export function HomePage() {
  const navigate = useNavigate();
  const { user, watchlist } = useAuth();

  const [indices, setIndices] = useState<MarketIndexInstrument[]>(() => api.getInitialIndices());
  const [ipos, setIpos] = useState<IPOOffering[]>(() => api.getInitialIpos());
  const [stocks, setStocks] = useState<StockInstrument[]>(() => api.getInitialStocks());
  const [heatmapStocks, setHeatmapStocks] = useState<StockInstrument[]>(() => api.getInitialStocks().slice(0, 16));
  const [topGainers, setTopGainers] = useState<StockInstrument[]>(() => {
    const init = api.getInitialStocks();
    const calcPct = (s: StockInstrument) => s.currentPrice && s.previousClose ? ((s.currentPrice - s.previousClose) / s.previousClose) * 100 : 0;
    return [...init].sort((a, b) => calcPct(b) - calcPct(a)).slice(0, 5);
  });
  const [topLosers, setTopLosers] = useState<StockInstrument[]>(() => {
    const init = api.getInitialStocks();
    const calcPct = (s: StockInstrument) => s.currentPrice && s.previousClose ? ((s.currentPrice - s.previousClose) / s.previousClose) * 100 : 0;
    return [...init].sort((a, b) => calcPct(a) - calcPct(b)).slice(0, 5);
  });
  const [allSectors, setAllSectors] = useState<string[]>([]);
  const [totalUniverse, setTotalUniverse] = useState(() => api.getInitialStocks().length || 7172);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMarketOpen = useMemo(() => {
    const now = new Date();
    const localString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const local = new Date(localString);
    const day = local.getDay();
    if (day === 0 || day === 6) return false;
    const minutes = local.getHours() * 60 + local.getMinutes();
    return minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 30;
  }, []);

  const [marketSessionLabel, setMarketSessionLabel] = useState<string>(() =>
    isMarketOpen ? 'Live Session · NSE/BSE Feed' : 'Market Closed · Session Closed: 20 Nov, 03:30 pm IST'
  );

  // Interactive dashboard states
  const [heroSearch, setHeroSearch] = useState('');
  const [ipoTab, setIpoTab] = useState<'Open' | 'Upcoming' | 'Closed' | 'Listed'>('Open');
  const ipoTabTouchedRef = useRef(false);
  const [ipoSearch, setIpoSearch] = useState('');
  const [ipoCatFilter, setIpoCatFilter] = useState<'All' | 'Mainboard' | 'SME'>('All');
  const [selectedGmpSlug, setSelectedGmpSlug] = useState<string>('');
  const [stockTab, setStockTab] = useState<'All' | 'NSE' | 'BSE' | 'Watchlist'>('All');
  const [stockSearch, setStockSearch] = useState('');
  const [debouncedStockSearch, setDebouncedStockSearch] = useState('');
  const [stockSector, setStockSector] = useState('All');
  const [stockMoverFilter, setStockMoverFilter] = useState<'All' | 'Gainers' | 'Losers'>('All');
  const [stockPage, setStockPage] = useState(1);
  const [stockTotal, setStockTotal] = useState(0);
  const [stockSortBy, setStockSortBy] = useState<string>('marketCapCr');
  const [stockSortDir, setStockSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedStockSearch(stockSearch.trim());
      setStockPage(1);
    }, 200);
    return () => clearTimeout(t);
  }, [stockSearch]);

  const loadDashboard = async (background = false) => {
    if (!background && stocks.length === 0) setLoading(true);
    setError(null);

    // Keep the first paint dependent only on the three core dashboard datasets.
    // Movers, insights and articles are non-blocking and can fill in afterwards.
    const corePromise = Promise.allSettled([
      api.getIndices(background),
      api.getIpos(),
      api.getStocks({ limit: 60, refresh: background }),
    ] as const);

    const secondaryPromise = Promise.allSettled([
      api.getStocks({ tab: 'gainers', limit: 5 }),
      api.getStocks({ tab: 'losers', limit: 5 }),
      api.getInsights(),
      api.getBlogs(),
    ] as const);

    try {
      const results = await corePromise;
      const idxRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const ipoRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const stkRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const nextIndices = Array.isArray(idxRes?.indices) ? idxRes.indices : [];
      const nextIpos = Array.isArray(ipoRes?.ipos) ? ipoRes.ipos : [];
      const nextStocks = Array.isArray(stkRes?.stocks) ? stkRes.stocks : [];

      setIndices(nextIndices);
      setIpos(nextIpos);
      setHeatmapStocks(nextStocks);
      setAllSectors(Array.isArray(stkRes?.sectors) ? stkRes.sectors : []);
      setTotalUniverse(stkRes?.totalUniverse || stkRes?.total || nextStocks.length);

      if (!ipoTabTouchedRef.current && nextIpos.length > 0) {
        const hasOpen = nextIpos.some((i) => i.status === 'Open');
        const hasUpcoming = nextIpos.some((i) => i.status === 'Upcoming');
        const hasListed = nextIpos.some((i) => i.status === 'Listed');
        if (hasOpen) setIpoTab('Open');
        else if (hasUpcoming) setIpoTab('Upcoming');
        else if (hasListed) setIpoTab('Listed');
        else setIpoTab('Closed');
      }

      if (!selectedGmpSlug) {
        const firstWithGmp = nextIpos.find((i) => i.gmp.history.length > 0);
        if (firstWithGmp) setSelectedGmpSlug(firstWithGmp.slug);
      }

      if (!background && results.every((r) => r.status === 'rejected')) {
        setError('Dashboard data is temporarily unavailable. Please retry.');
      }

      // Release the dashboard's main loading state before optional widgets finish.
      if (!background) setLoading(false);

      void secondaryPromise.then((secondary) => {
        const gainers = secondary[0].status === 'fulfilled' ? secondary[0].value : null;
        const losers = secondary[1].status === 'fulfilled' ? secondary[1].value : null;
        const insightRes = secondary[2].status === 'fulfilled' ? secondary[2].value : null;
        const blogRes = secondary[3].status === 'fulfilled' ? secondary[3].value : null;
        if (gainers && Array.isArray(gainers.stocks)) setTopGainers(gainers.stocks.slice(0, 5));
        if (losers && Array.isArray(losers.stocks)) setTopLosers(losers.stocks.slice(0, 5));
        if (insightRes && Array.isArray(insightRes.insights)) setInsights(insightRes.insights);
        if (blogRes && Array.isArray(blogRes.articles)) setBlogs(blogRes.articles);
      });
    } catch (err) {
      if (!background) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard intelligence.');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard(stocks.length > 0);
    api
      .getAutomationStatus()
      .then((st) => {
        const label =
          st.marketSession === 'MARKET_OPEN'
            ? `NSE/BSE Live Session (${st.istTimeLabel})`
            : st.marketSession === 'PRE_OPEN'
              ? `Pre-Open Session (${st.istTimeLabel})`
              : `Market Closed · Session Closed: 20 Nov, 03:30 pm IST`;
        setMarketSessionLabel(label);
      })
      .catch(() => {});
    const intervalTime = isMarketOpen ? 30_000 : 180_000;
    const timer = setInterval(() => {
      loadDashboard(true);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isMarketOpen]);

  useLiveMarketStream({
    onIndices: () => {
      void api.getIndices(false).then((r) => setIndices(r.indices)).catch(() => {});
    },
    onIpos: () => {
      void api.getIpos().then((r) => setIpos(r.ipos)).catch(() => {});
    },
    onHeartbeat: (hb) => {
      if (hb.istTimeLabel) {
        const prefix =
          hb.session === 'MARKET_OPEN'
            ? 'NSE/BSE Live Session'
            : hb.session === 'PRE_OPEN'
              ? 'Pre-Open Session'
              : 'Auto-Sync Active';
        setMarketSessionLabel(`${prefix} (${hb.istTimeLabel})`);
      }
    },
  });

  useEffect(() => {
    let active = true;
    if (stockTab === 'Watchlist') {
      const savedSymbols = watchlist
        .filter((w) => w.itemType === 'stock')
        .map((w) => w.itemKey.toUpperCase());
      if (savedSymbols.length === 0) {
        setStocks([]);
        setStockTotal(0);
        return () => { active = false; };
      }
      setStocksLoading(true);
      Promise.allSettled(savedSymbols.map((sym) => api.getStockBySymbol(sym, '1mo')))
        .then((res) => {
          if (!active) return;
          const list = res
            .filter(
              (r): r is PromiseFulfilledResult<{
                stock: StockInstrument;
                fromUpstream: boolean;
                linkedIpo: null;
              }> => r.status === 'fulfilled'
            )
            .map((r) => r.value.stock);
          setStocks(list);
          setStockTotal(list.length);
        })
        .finally(() => {
          if (active) setStocksLoading(false);
        });
      return () => { active = false; };
    }

    setStocksLoading(true);
    const tabParam =
      stockMoverFilter === 'Gainers'
        ? 'gainers'
        : stockMoverFilter === 'Losers'
          ? 'losers'
          : undefined;
    api
      .getStocks({
        exchange: stockTab === 'NSE' || stockTab === 'BSE' ? stockTab : 'All',
        sector: stockSector !== 'All' ? stockSector : undefined,
        q: debouncedStockSearch || undefined,
        tab: tabParam,
        sortBy: tabParam ? undefined : stockSortBy,
        sortDir: tabParam ? undefined : stockSortDir,
        page: stockPage,
        limit: 20,
      })
      .then((res) => {
        if (!active) return;
        setStocks(res.stocks);
        setStockTotal(res.total);
        if (res.sectors.length > 0) setAllSectors(res.sectors);
        if (res.totalUniverse) setTotalUniverse(res.totalUniverse);
      })
      .finally(() => {
        if (active) setStocksLoading(false);
      });
    return () => { active = false; };
  }, [stockTab, stockSector, stockMoverFilter, debouncedStockSearch, stockPage, stockSortBy, stockSortDir, watchlist]);

  // Derived Overview Metrics from actual records
  const metrics = useMemo(() => {
    const active = ipos.filter((i) => i.status === 'Open').length;
    const upcoming = ipos.filter((i) => i.status === 'Upcoming').length;
    const closed = ipos.filter((i) => i.status === 'Closed').length;
    const listedThisYear = ipos.filter((i) => i.status === 'Listed').length;
    const gmpAvailable = ipos.filter((i) => i.gmp.availability === 'Available').length;
    return {
      active,
      upcoming,
      closed,
      listedThisYear,
      totalStocks: totalUniverse || stocks.length,
      gmpAvailable,
    };
  }, [ipos, stocks, totalUniverse]);

  const filteredIpos = useMemo(() => {
    return ipos.filter((i) => {
      if (i.status !== ipoTab) return false;
      if (ipoCatFilter !== 'All' && i.category !== ipoCatFilter) return false;
      if (ipoSearch.trim()) {
        const q = ipoSearch.trim().toLowerCase();
        return (
          i.companyName.toLowerCase().includes(q) ||
          i.sector.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ipos, ipoTab, ipoCatFilter, ipoSearch]);

  const gmpRankedIpos = useMemo(() => {
    return [...ipos].sort((a, b) => (b.gmp.latestGmp ?? -9999) - (a.gmp.latestGmp ?? -9999));
  }, [ipos]);

  const selectedGmpIpo = useMemo(
    () => ipos.find((i) => i.slug === selectedGmpSlug) ?? gmpRankedIpos[0] ?? null,
    [ipos, selectedGmpSlug, gmpRankedIpos]
  );

  const stockSectors = useMemo(
    () => ['All', ...allSectors],
    [allSectors]
  );

  const filteredStocks = stocks;

  const listedIpos = useMemo(
    () => ipos.filter((i) => i.status === 'Listed'),
    [ipos]
  );

  const upcomingSpotlights = useMemo(() => {
    const symbols = ['CRYSTALCROP', 'MAHANADI', 'WATRANA'];
    return ipos.filter((i) => symbols.includes(i.listing?.stockSymbol || ''));
  }, [ipos]);

  const handleHeroSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroSearch.trim();
    if (!q) return;
    const qLower = q.toLowerCase().trim();
    // 1. Exact match on symbol or BSE code first to prevent collision
    const exactStk = stocks.find(
      (s) => s.symbol.toLowerCase() === qLower || s.bseCode === q
    );
    if (exactStk) {
      navigate(`/stock/${exactStk.symbol}`);
      return;
    }
    // 2. Exact match on companyName
    const exactNameStk = stocks.find(
      (s) => s.companyName.toLowerCase() === qLower
    );
    if (exactNameStk) {
      navigate(`/stock/${exactNameStk.symbol}`);
      return;
    }
    // 3. Exact IPO match
    const matchedIpo = ipos.find(
      (i) => i.companyName.toLowerCase() === qLower || i.slug.toLowerCase() === qLower
    );
    if (matchedIpo) {
      navigate(`/ipo/${matchedIpo.slug}`);
      return;
    }
    try {
      const searchRes = await api.globalSearch(q);
      if (searchRes?.ipos && searchRes.ipos.length > 0) {
        navigate(`/ipo/${searchRes.ipos[0].slug}`);
        return;
      }
      if (searchRes?.stocks && searchRes.stocks.length > 0) {
        navigate(`/stock/${searchRes.stocks[0].symbol}`);
        return;
      }
    } catch {
      // fall through to direct ticker lookup
    }
    navigate(`/stock/${q.toUpperCase().replace(/[^A-Z0-9-]/g, '')}`);
  };

  const nifty = indices.find((i) => i.id === 'nifty50');
  const sensex = indices.find((i) => i.id === 'sensex');

  return (
    <div className="min-h-screen">
      <SEOHead
        title="PriceAlerter – Indian IPO, GMP & NSE/BSE Market Intelligence"
        description="Discover upcoming Indian IPOs, analyse Grey Market Premium trends, monitor NSE & BSE listed equities, and track listing performance on PriceAlerter."
        canonicalPath="/"
      />

      {/* Section 2: Compact Dashboard Hero */}
      <section className="bg-white dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#059669] dark:text-emerald-400">
                PriceAlerter · Smarter IPO &amp; Market Intelligence · <span className="font-data text-[#64748B] dark:text-slate-400">{marketSessionLabel}</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#14263F] dark:text-white leading-tight [text-wrap:balance]">
                Indian IPO &amp; Stock Market Intelligence
              </h1>
              <p className="text-sm sm:text-base text-[#64748B] dark:text-slate-300 max-w-2xl leading-relaxed">
                Discover upcoming IPOs, analyse grey market trends, explore listed companies and
                track market movements in one place.
              </p>

              <form onSubmit={handleHeroSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-xl pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Enter NSE/BSE symbol (e.g. RELIANCE, TCS) or IPO name..."
                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-[#111C2E] pl-10 pr-3 py-2.5 text-sm text-[#152338] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                >
                  Search Market
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Link
                  to="/ipo"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  Explore IPOs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/live-prices"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-4 py-2 text-xs font-semibold text-[#152338] dark:text-slate-100 hover:border-[#14263F] transition-colors whitespace-nowrap"
                >
                  View Stock Market
                </Link>
                <Link
                  to="/gmp"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-4 py-2 text-xs font-semibold text-[#152338] dark:text-slate-100 hover:border-[#14263F] transition-colors whitespace-nowrap"
                >
                  Explore GMP
                </Link>
              </div>
            </div>

            {/* Section 3: Market Overview 6-card Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
              {[
                { label: 'Active IPOs', value: metrics.active, sub: 'Open for bidding', to: '/ipo/open' },
                { label: 'Upcoming IPOs', value: metrics.upcoming, sub: 'Scheduled issues', to: '/ipo/upcoming' },
                { label: 'Recently Closed', value: metrics.closed, sub: 'Awaiting allotment / listing', to: '/ipo/closed' },
                { label: 'Listed Debuts', value: metrics.listedThisYear, sub: 'Exchange debuts tracked', to: '/listed' },
                { label: 'Tracked Stocks', value: metrics.totalStocks.toLocaleString('en-IN'), sub: 'Live NSE & BSE universe', to: '/live-prices' },
                { label: 'GMP Updates', value: metrics.gmpAvailable, sub: 'Indicative records', to: '/gmp' },
              ].map((card) => (
                <Link
                  key={card.label}
                  to={card.to}
                  className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-[#111C2E] p-3.5 hover:border-[#2563EB]/60 transition-colors"
                >
                  <div className="text-xs text-[#64748B] dark:text-slate-400">{card.label}</div>
                  <div className="mt-1 font-data text-2xl font-bold text-[#14263F] dark:text-white">
                    {loading ? '—' : card.value}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#64748B] dark:text-slate-400">
                    {card.sub}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Jump to dashboard section" className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 overflow-x-auto px-3.5 py-3 sm:px-6 no-scrollbar">
          <span className="mr-1 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Explore</span>
          {[
            ['IPOs', 'ipo-activity-heading'],
            ['GMP Tracker', 'gmp-widget-heading'],
            ['Live Stocks', 'live-stocks-heading'],
            ['Mutual Funds', '/mutual-funds'],
            ['Listed IPOs', 'listed-ipos-heading'],
            ['SIP Calculator', '/calculators'],
            ['Market Insights', 'market-intel-heading'],
            ['Learn Hub', 'education-heading'],
          ].map(([label, target]) =>
            target.startsWith('/') ? (
              <Link
                key={target}
                to={target}
                className="shrink-0 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition-colors hover:border-emerald-500"
              >
                {label}
              </Link>
            ) : (
              <a
                key={target}
                href={`#${target}`}
                className="shrink-0 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                {label}
              </a>
            )
          )}
        </div>
      </nav>

      {/* Quick Tools & Modern FinTech Strip */}
      <section className="max-w-[1440px] mx-auto px-3.5 sm:px-6 pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/mutual-funds"
            className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 shadow-sm hover:border-[#00D09C] transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00D09C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#14263F] dark:text-white group-hover:text-[#00D09C] transition-colors">Mutual Funds Hub</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400">Direct funds &amp; SIP returns</div>
            </div>
          </Link>


          <Link
            to="/calculators"
            className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 shadow-sm hover:border-amber-500 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#14263F] dark:text-white group-hover:text-amber-500 transition-colors">SIP &amp; Lumpsum Calc</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400">Wealth growth projection</div>
            </div>
          </Link>

          <Link
            to="/stock-screener"
            className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 shadow-sm hover:border-purple-500 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#14263F] dark:text-white group-hover:text-purple-500 transition-colors">Stock Screener</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400">7,000+ NSE &amp; BSE filter</div>
            </div>
          </Link>
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-10 sm:space-y-12">
        {error && <ErrorRetryState message={error} onRetry={loadDashboard} />}

        {/* Global Macro & Commodities Live Feed */}
        <MacroCommoditiesBar />

        {/* Free Live Alerts Lead Magnet */}
        <FreeAlertsLeadMagnet
          source="home_hero"
          title="Get Instant WhatsApp & Email Alerts for Live IPOs & GMP Surges"
          description="Never miss an IPO opening, GMP surge >15%, or allotment result. Join over 45,000 retail traders receiving verified market alerts with zero spam."
        />

        {/* Section 4: Interactive IPO Activity Dashboard */}
        <section aria-labelledby="ipo-activity-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2
                id="ipo-activity-heading"
                className="scroll-mt-28 font-display text-xl font-bold text-[#14263F] dark:text-white"
              >
                IPO Activity Dashboard
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Mainboard and SME primary market offerings with offer dates, subscription, and indicative GMP
              </p>
            </div>
            <Link
              to="/ipo"
              className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              Open Full IPO Explorer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Current & Upcoming IPO Spotlight (Crystal Crop, Mahanadi Coalfields, Watrana Rentals) */}
          {upcomingSpotlights.length > 0 && (
            <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50/70 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-slate-900/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                    Current &amp; Scheduled IPO Spotlight · Official SEBI &amp; Exchange Issue Calendar
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                  Open for Bidding &amp; Scheduled Issues (Nov 2026)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {upcomingSpotlights.map((item) => (
                  <Link
                    key={item.id}
                    to={`/ipo/${item.slug}`}
                    className="rounded-lg border border-white/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111C2E]/95 p-3 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-xs flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CompanyLogo
                        companyName={item.companyName}
                        symbol={item.listing?.stockSymbol}
                        logoUrl={item.logoUrl}
                        logoColor={item.logoColor}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#14263F] dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.companyName}
                        </div>
                        <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-data">
                          {item.dates.openDate ? formatDateIN(item.dates.openDate) : 'Nov 2026'} – {item.dates.closeDate ? formatDateIN(item.dates.closeDate) : 'Nov 2026'} · <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{item.priceBandLow} – ₹{item.priceBandHigh}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                      item.status === 'Open'
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    }`}>
                      {item.status === 'Open' ? 'CURRENT / OPEN' : item.category}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-slate-800 p-1">
              {(
                [
                  { id: 'Open', label: 'Current IPOs' },
                  { id: 'Upcoming', label: 'Upcoming IPOs' },
                  { id: 'Closed', label: 'Recently Closed' },
                  { id: 'Listed', label: 'Recently Listed' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    ipoTabTouchedRef.current = true;
                    setIpoTab(t.id);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    ipoTab === t.id
                      ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                      : 'text-[#64748B] dark:text-slate-400 hover:text-[#152338] dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={ipoSearch}
                onChange={(e) => setIpoSearch(e.target.value)}
                placeholder="Filter company or sector..."
                className="w-full sm:w-52 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 sm:py-1.5 text-sm sm:text-xs text-[#152338] dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
              />
              <select
                value={ipoCatFilter}
                onChange={(e) => setIpoCatFilter(e.target.value as 'All' | 'Mainboard' | 'SME')}
                aria-label="Filter IPO category"
                className="w-full sm:w-auto rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 sm:py-1.5 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
              >
                <option value="All">All Categories</option>
                <option value="Mainboard">Mainboard</option>
                <option value="SME">SME</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : filteredIpos.length === 0 ? (
            <EmptyState
              title={`No ${ipoTab} IPOs match your filters`}
              description="Try clearing your search filter or switching to another IPO status tab."
              actionLabel="Reset Filters"
              onAction={() => {
                setIpoSearch('');
                setIpoCatFilter('All');
              }}
            />
          ) : (
            <IPOTable ipos={filteredIpos} pageSize={6} />
          )}
        </section>

        {/* Section 5: GMP Tracker Intelligence Widget */}
        <section aria-labelledby="gmp-widget-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2
                id="gmp-widget-heading"
                className="scroll-mt-28 font-display text-xl font-bold text-[#14263F] dark:text-white"
              >
                GMP Tracker &amp; Historical Trend
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Unofficial indicative grey market premium ranking and recorded daily observations
              </p>
            </div>
            <Link
              to="/gmp"
              className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              Open Full GMP Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DisclaimerBanner
            title="Unofficial GMP Disclaimer"
            text="Grey Market Premium (GMP) figures are unofficial, speculative indicators not published or regulated by SEBI, NSE, or BSE. Estimated listing prices are strictly hypothetical calculations (Issue Upper Price + GMP) and never guaranteed returns."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              {/* Mobile GMP Cards */}
              <div className="md:hidden space-y-2.5">
                {gmpRankedIpos.slice(0, 6).map((ipo) => {
                  const avail = ipo.gmp.availability === 'Available' && ipo.gmp.latestGmp !== null;
                  const pos = (ipo.gmp.latestGmp ?? 0) >= 0;
                  const { estimatedListingPrice, estimatedGainPct } = calculateGMPEstimate(
                    ipo.priceBandHigh,
                    ipo.gmp.latestGmp
                  );
                  const isSelected = selectedGmpIpo?.slug === ipo.slug;
                  return (
                    <button
                      key={ipo.id}
                      type="button"
                      onClick={() => setSelectedGmpSlug(ipo.slug)}
                      className={`w-full text-left rounded-xl border p-3.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-950/30'
                          : 'border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CompanyLogo
                            size="xs"
                            companyName={ipo.companyName}
                            symbol={ipo.listing.stockSymbol}
                            logoUrl={ipo.logoUrl}
                            logoColor={ipo.logoColor}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#152338] dark:text-slate-100 truncate">
                              {ipo.shortName}
                            </div>
                            <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                              {ipo.category} · {ipo.status} · Band {ipo.priceBandHigh ? formatINR(ipo.priceBandHigh, 0) : 'TBA'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-data shrink-0">
                          <div className="text-sm font-bold">
                            {avail ? (
                              <span className={pos ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#DC2626] dark:text-red-400'}>
                                {pos ? '+' : ''}₹{ipo.gmp.latestGmp}
                              </span>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">Unavailable</span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            Est: {estimatedListingPrice !== null ? formatINR(estimatedListingPrice, 0) : '—'}{' '}
                            {estimatedGainPct !== null ? `(${formatPercent(estimatedGainPct)})` : ''}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Desktop GMP Table */}
              <div className="hidden md:block rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                        <th className="py-2.5 px-4">Company</th>
                        <th className="py-2.5 px-3 text-right">Issue Price</th>
                        <th className="py-2.5 px-3 text-right">Latest GMP</th>
                        <th className="py-2.5 px-3 text-right">Est. Listing</th>
                        <th className="py-2.5 px-3 text-right">Est. Gain</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                      {gmpRankedIpos.slice(0, 6).map((ipo) => {
                        const avail = ipo.gmp.availability === 'Available' && ipo.gmp.latestGmp !== null;
                        const pos = (ipo.gmp.latestGmp ?? 0) >= 0;
                        const { estimatedListingPrice, estimatedGainPct } = calculateGMPEstimate(
                          ipo.priceBandHigh,
                          ipo.gmp.latestGmp
                        );
                        const isSelected = selectedGmpIpo?.slug === ipo.slug;
                        return (
                          <tr
                            key={ipo.id}
                            onClick={() => setSelectedGmpSlug(ipo.slug)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/70 dark:bg-blue-950/30'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <CompanyLogo
                                  size="xs"
                                  companyName={ipo.companyName}
                                  symbol={ipo.listing.stockSymbol}
                                  logoUrl={ipo.logoUrl}
                                  logoColor={ipo.logoColor}
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-[#152338] dark:text-slate-100 truncate">
                                    {ipo.shortName}
                                  </div>
                                  <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                                    {ipo.category} · {ipo.status}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-data text-[#152338] dark:text-slate-200">
                              {ipo.priceBandHigh ? formatINR(ipo.priceBandHigh, 0) : 'TBA'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-data font-semibold">
                              {avail ? (
                                <span
                                  className={
                                    pos
                                      ? 'text-[#16A34A] dark:text-emerald-400'
                                      : 'text-[#DC2626] dark:text-red-400'
                                  }
                                >
                                  {pos ? '+' : ''}₹{ipo.gmp.latestGmp}
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]">Unavailable</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-data text-[#152338] dark:text-slate-200">
                              {estimatedListingPrice !== null
                                ? formatINR(estimatedListingPrice, 0)
                                : 'Unavailable'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-data">
                              {estimatedGainPct !== null ? (
                                <span
                                  className={
                                    estimatedGainPct >= 0
                                      ? 'text-[#16A34A] dark:text-emerald-400'
                                      : 'text-[#DC2626] dark:text-red-400'
                                  }
                                >
                                  {formatPercent(estimatedGainPct)}
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right text-[11px] text-[#64748B] dark:text-slate-400">
                              {avail ? 'Indicative' : 'Unavailable'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              {selectedGmpIpo ? (
                <GMPChart
                  history={selectedGmpIpo.gmp.history}
                  companyName={selectedGmpIpo.shortName}
                />
              ) : (
                <LoadingSkeleton rows={3} />
              )}
            </div>
          </div>
        </section>

        {/* Section 6: Live Stock Market Dashboard */}
        <section aria-labelledby="live-stocks-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2
                id="live-stocks-heading"
                className="scroll-mt-28 font-display text-xl font-bold text-[#14263F] dark:text-white"
              >
                Live Stock Market (NSE &amp; BSE)
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                {stockTotal > 0
                  ? `Showing ${stockTotal.toLocaleString('en-IN')} matching equities across ${totalUniverse.toLocaleString('en-IN')} active NSE & BSE stocks.`
                  : 'Track exchange quotes, volume, market cap, and day ranges across all NSE & BSE listed equities.'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/us-stocks"
                className="text-xs font-semibold text-[#059669] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>US &amp; Global Equities</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/live-prices"
                className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                Open Stock Terminal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-slate-800 p-1">
              {(['All', 'NSE', 'BSE', 'Watchlist'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setStockTab(tab);
                    setStockPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    stockTab === tab
                      ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                      : 'text-[#64748B] dark:text-slate-400 hover:text-[#152338] dark:hover:text-white'
                  }`}
                >
                  {tab === 'All' ? 'All Stocks' : tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 w-full lg:w-auto">
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Search symbol or company..."
                className="w-full sm:w-52 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 sm:py-1.5 text-sm sm:text-xs text-[#152338] dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
              />
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <select
                  value={stockSector}
                  onChange={(e) => {
                    setStockSector(e.target.value);
                    setStockPage(1);
                  }}
                  aria-label="Filter stock sector"
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 sm:py-1.5 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
                >
                  {stockSectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec === 'All' ? 'All Sectors' : sec}
                    </option>
                  ))}
                </select>
                <select
                  value={stockMoverFilter}
                  onChange={(e) => {
                    setStockMoverFilter(e.target.value as 'All' | 'Gainers' | 'Losers');
                    setStockPage(1);
                  }}
                  aria-label="Filter gainers or losers"
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 sm:py-1.5 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
                >
                  <option value="All">All Movers</option>
                  <option value="Gainers">Gainers Only</option>
                  <option value="Losers">Losers Only</option>
                </select>
              </div>
            </div>
          </div>

          {loading || stocksLoading ? (
            <LoadingSkeleton rows={6} />
          ) : stockTab === 'Watchlist' && !user ? (
            <EmptyState
              title="Sign in to view your Watchlist"
              description="Save NSE and BSE companies to your personal watchlist and configure target price alerts."
              actionLabel="Sign In"
              onAction={() => navigate('/login')}
            />
          ) : filteredStocks.length === 0 ? (
            <EmptyState
              title="No matching stocks found"
              description="Adjust your exchange, sector, or mover filters to see matching equities."
              actionLabel="Reset Stock Filters"
              onAction={() => {
                setStockSearch('');
                setStockSector('All');
                setStockMoverFilter('All');
                setStockTab('All');
                setStockPage(1);
              }}
            />
          ) : (
            <StockTable
              stocks={filteredStocks}
              pageSize={20}
              compact
              serverPagination={
                stockTab === 'Watchlist'
                  ? undefined
                  : {
                      page: stockPage,
                      pageSize: 20,
                      total: stockTotal,
                      onPageChange: (next) => setStockPage(next),
                    }
              }
              onSortChange={
                stockTab === 'Watchlist'
                  ? undefined
                  : (key, asc) => {
                      setStockSortBy(key);
                      setStockSortDir(asc ? 'asc' : 'desc');
                    }
              }
            />
          )}
        </section>

        {/* Section 7: Recently Listed IPOs */}
        <section aria-labelledby="listed-ipos-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2
                id="listed-ipos-heading"
                className="scroll-mt-28 font-display text-xl font-bold text-[#14263F] dark:text-white"
              >
                Recently Listed IPOs &amp; Listing Gains
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Separating IPO issue price, verified exchange listing-day price, and current market price
              </p>
            </div>
            <Link
              to="/listed"
              className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              View All Listed Performance <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Listed IPO Cards */}
          <div className="md:hidden space-y-2.5">
            {listedIpos.slice(0, 6).map((ipo) => {
              const listGain = calculateListingGainPct(
                ipo.listing.issuePrice,
                ipo.listing.actualListingPrice
              );
              const curReturn = calculateCurrentReturnPct(
                ipo.listing.issuePrice,
                ipo.listing.currentMarketPrice
              );
              return (
                <Link
                  key={ipo.id}
                  to={`/ipo/${ipo.slug}`}
                  className="block rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-3.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CompanyLogo
                        size="sm"
                        companyName={ipo.companyName}
                        symbol={ipo.listing.stockSymbol}
                        logoUrl={ipo.logoUrl}
                        logoColor={ipo.logoColor}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#152338] dark:text-slate-100 truncate">
                          {ipo.companyName}
                        </div>
                        <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                          {ipo.category} · Listed {formatDateIN(ipo.listing.listingDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-data shrink-0">
                      <div
                        className={`text-sm font-bold ${
                          (listGain ?? 0) >= 0 ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#DC2626] dark:text-red-400'
                        }`}
                      >
                        {formatPercent(listGain)}
                      </div>
                      <div className="text-[10px] text-[#64748B]">Listing Gain</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px] font-data">
                    <div>
                      <div className="text-[#64748B] font-sans">Issue</div>
                      <div className="font-semibold text-[#152338] dark:text-slate-200">{formatINR(ipo.listing.issuePrice)}</div>
                    </div>
                    <div>
                      <div className="text-[#64748B] font-sans">Listed At</div>
                      <div className="font-semibold text-[#152338] dark:text-slate-200">{formatINR(ipo.listing.actualListingPrice)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#64748B] font-sans">CMP ({formatPercent(curReturn)})</div>
                      <div className="font-semibold text-[#152338] dark:text-slate-200">{formatINR(ipo.listing.currentMarketPrice)}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:block rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-3">Exchange</th>
                    <th className="py-3 px-3">Listing Date</th>
                    <th className="py-3 px-3 text-right">Issue Price</th>
                    <th className="py-3 px-3 text-right">Actual Listing</th>
                    <th className="py-3 px-3 text-right">Current Price</th>
                    <th className="py-3 px-3 text-right">Listing Gain</th>
                    <th className="py-3 px-4 text-right">Current Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {listedIpos.slice(0, 10).map((ipo) => {
                    const listGain = calculateListingGainPct(
                      ipo.listing.issuePrice,
                      ipo.listing.actualListingPrice
                    );
                    const curReturn = calculateCurrentReturnPct(
                      ipo.listing.issuePrice,
                      ipo.listing.currentMarketPrice
                    );
                    return (
                      <tr key={ipo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CompanyLogo
                              size="sm"
                              companyName={ipo.companyName}
                              symbol={ipo.listing.stockSymbol}
                              logoUrl={ipo.logoUrl}
                              logoColor={ipo.logoColor}
                            />
                            <div className="min-w-0">
                              <Link
                                to={`/ipo/${ipo.slug}`}
                                className="font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate"
                              >
                                {ipo.companyName}
                              </Link>
                              <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                                {ipo.category} · {ipo.sector}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#64748B] dark:text-slate-300">
                          {ipo.listing.listingExchange || ipo.exchanges.join('/')}
                        </td>
                        <td className="py-3 px-3 font-data text-[#64748B] dark:text-slate-300">
                          {formatDateIN(ipo.listing.listingDate)}
                        </td>
                        <td className="py-3 px-3 text-right font-data text-[#152338] dark:text-slate-200">
                          {formatINR(ipo.listing.issuePrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-data font-semibold text-[#152338] dark:text-slate-100">
                          {formatINR(ipo.listing.actualListingPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-data text-[#152338] dark:text-slate-200">
                          <div>{formatINR(ipo.listing.currentMarketPrice)}</div>
                          <div className="mt-0.5">
                            <DataQualityBadge status={ipo.listing.priceStatus} compact />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-data font-semibold">
                          <span
                            className={
                              (listGain ?? 0) >= 0
                                ? 'text-[#16A34A] dark:text-emerald-400'
                                : 'text-[#DC2626] dark:text-red-400'
                            }
                          >
                            {formatPercent(listGain)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-data font-semibold">
                          <span
                            className={
                              (curReturn ?? 0) >= 0
                                ? 'text-[#16A34A] dark:text-emerald-400'
                                : 'text-[#DC2626] dark:text-red-400'
                            }
                          >
                            {formatPercent(curReturn)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 8: Market Intelligence */}
        <section aria-labelledby="market-intel-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2
                id="market-intel-heading"
                className="scroll-mt-28 font-display text-xl font-bold text-[#14263F] dark:text-white"
              >
                Market Intelligence &amp; Sector Breadth
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Benchmark overview, sector heatmap, movers, and sourced financial developments
              </p>
            </div>
            <Link
              to="/market-insights"
              className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              All Market Insights <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Benchmarks + Gainers/Losers */}
            <div className="lg:col-span-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[nifty, sensex].filter(Boolean).map((idx) => {
                  if (!idx) return null;
                  const up = (idx.change ?? 0) >= 0;
                  return (
                    <div
                      key={idx.id}
                      className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4"
                    >
                      <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
                        {idx.symbol}
                      </div>
                      <div className="mt-1 font-data text-lg font-bold text-[#152338] dark:text-white">
                        {formatNumberIN(idx.value)}
                      </div>
                      <div
                        className={`mt-0.5 font-data text-xs font-medium ${
                          up ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#DC2626] dark:text-red-400'
                        }`}
                      >
                        {up ? '+' : ''}
                        {typeof idx.change === 'number' && Number.isFinite(idx.change) ? idx.change.toFixed(2) : '—'} ({formatPercent(idx.changePercent)})
                      </div>
                      <div className="mt-2 text-[10px] text-[#94A3B8]">
                        {idx.provenance.source}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] dark:text-emerald-400 mb-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Top Gainers</span>
                  </div>
                  <div className="space-y-2">
                    {topGainers.map((g) => {
                      const pct = ((g.currentPrice! - g.previousClose!) / g.previousClose!) * 100;
                      return (
                        <Link
                          key={g.id}
                          to={`/stock/${g.symbol}`}
                          className="flex items-center justify-between gap-2 text-xs hover:text-[#2563EB] group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CompanyLogo
                              size="xs"
                              companyName={g.companyName}
                              symbol={g.symbol}
                              bseCode={g.bseCode}
                              logoUrl={g.logoUrl}
                              searchId={g.searchId}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-[#152338] dark:text-slate-200 group-hover:text-[#2563EB] truncate">
                                {g.companyName}
                              </div>
                              <div className="text-[10px] font-data text-[#64748B] dark:text-slate-400 truncate">
                                {formatStockTickerLabel(g.symbol, g.bseCode)}
                              </div>
                            </div>
                          </div>
                          <span className="font-data text-[#16A34A] dark:text-emerald-400 font-semibold shrink-0">
                            {formatPercent(pct)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] dark:text-red-400 mb-2">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Top Losers</span>
                  </div>
                  <div className="space-y-2">
                    {topLosers.map((l) => {
                      const pct = ((l.currentPrice! - l.previousClose!) / l.previousClose!) * 100;
                      return (
                        <Link
                          key={l.id}
                          to={`/stock/${l.symbol}`}
                          className="flex items-center justify-between gap-2 text-xs hover:text-[#2563EB] group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CompanyLogo
                              size="xs"
                              companyName={l.companyName}
                              symbol={l.symbol}
                              bseCode={l.bseCode}
                              logoUrl={l.logoUrl}
                              searchId={l.searchId}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-[#152338] dark:text-slate-200 group-hover:text-[#2563EB] truncate">
                                {l.companyName}
                              </div>
                              <div className="text-[10px] font-data text-[#64748B] dark:text-slate-400 truncate">
                                {formatStockTickerLabel(l.symbol, l.bseCode)}
                              </div>
                            </div>
                          </div>
                          <span className="font-data text-[#DC2626] dark:text-red-400 font-semibold shrink-0">
                            {formatPercent(pct)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Sector Heatmap & Insights */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4">
                <div className="text-xs font-semibold text-[#152338] dark:text-slate-100 mb-3">
                  Sector Breadth Heatmap (Tracked NSE/BSE Equities)
                </div>
                <SectorHeatmap stocks={heatmapStocks.length > 0 ? heatmapStocks : stocks} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.slice(0, 2).map((ins) => (
                  <Link
                    key={ins.id}
                    to={`/market-insights/${ins.slug}`}
                    className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 hover:border-[#2563EB]/60 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                        {ins.category} · {formatTimestampIN(ins.publishedAt)}
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-[#152338] dark:text-slate-100 line-clamp-2">
                        {ins.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-[#64748B] dark:text-slate-400 line-clamp-2">
                        {ins.summary}
                      </p>
                    </div>
                    <div className="mt-3 text-[11px] font-medium text-[#2563EB] dark:text-blue-400 inline-flex items-center gap-1">
                      Source: {ins.source} <ExternalLink className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <AdSlot slotId="home-mid-leaderboard" format="horizontal" />

        {/* Section 9: Investor Education */}
        <section aria-labelledby="education-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2
                id="education-heading"
                className="scroll-mt-28 font-display text-xl font-bold text-[#14263F] dark:text-white"
              >
                Investor Education &amp; Research Guides
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Structured primers on IPO mechanics, ASBA/UPI applications, GMP limits, and financial ratios
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/calculators"
                className="text-xs font-semibold text-[#059669] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5" /> Financial Calculators
              </Link>
              <Link
                to="/blog"
                className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                Explore Library <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.slice(0, 6).map((article) => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 hover:border-[#2563EB]/60 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                    {article.category} · {article.readMinutes} min read · Updated {formatDateIN(article.updatedAt)}
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold text-[#152338] dark:text-slate-100 leading-snug">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#64748B] dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] dark:text-blue-400">
                  <BookOpen className="w-3.5 h-3.5" /> Read Guide
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
