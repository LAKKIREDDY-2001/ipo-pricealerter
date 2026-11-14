import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ExternalLink,
  Search,
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

  const [indices, setIndices] = useState<MarketIndexInstrument[]>([]);
  const [ipos, setIpos] = useState<IPOOffering[]>([]);
  const [stocks, setStocks] = useState<StockInstrument[]>([]);
  const [heatmapStocks, setHeatmapStocks] = useState<StockInstrument[]>([]);
  const [topGainers, setTopGainers] = useState<StockInstrument[]>([]);
  const [topLosers, setTopLosers] = useState<StockInstrument[]>([]);
  const [allSectors, setAllSectors] = useState<string[]>([]);
  const [totalUniverse, setTotalUniverse] = useState(0);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketSessionLabel, setMarketSessionLabel] = useState<string>('IST Auto-Sync Active');

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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedStockSearch(stockSearch.trim()), 200);
    return () => clearTimeout(t);
  }, [stockSearch]);

  const loadDashboard = async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const [idxRes, ipoRes, stkRes, gRes, lRes, insRes, blogRes] = await Promise.all([
        api.getIndices(background),
        api.getIpos(),
        api.getStocks({ limit: 100, refresh: background }),
        api.getStocks({ tab: 'gainers', limit: 5 }),
        api.getStocks({ tab: 'losers', limit: 5 }),
        api.getInsights(),
        api.getBlogs(),
      ]);
      const nextIndices = Array.isArray(idxRes?.indices) ? idxRes.indices : [];
      const nextIpos = Array.isArray(ipoRes?.ipos) ? ipoRes.ipos : [];
      const nextStocks = Array.isArray(stkRes?.stocks) ? stkRes.stocks : [];
      const nextGainers = Array.isArray(gRes?.stocks) ? gRes.stocks : [];
      const nextLosers = Array.isArray(lRes?.stocks) ? lRes.stocks : [];
      const nextSectors = Array.isArray(stkRes?.sectors) ? stkRes.sectors : [];
      const nextInsights = Array.isArray(insRes?.insights) ? insRes.insights : [];
      const nextBlogs = Array.isArray(blogRes?.articles) ? blogRes.articles : [];

      setIndices(nextIndices);
      setIpos(nextIpos);
      setHeatmapStocks(nextStocks);
      if (!debouncedStockSearch && stockTab === 'All' && stockSector === 'All' && stockMoverFilter === 'All') {
        setStocks(nextStocks);
      }
      setTopGainers(nextGainers.slice(0, 5));
      setTopLosers(nextLosers.slice(0, 5));
      setAllSectors(nextSectors);
      setTotalUniverse(stkRes?.totalUniverse || stkRes?.total || nextStocks.length);
      setInsights(nextInsights);
      setBlogs(nextBlogs);

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
    } catch (err) {
      if (!background) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard intelligence.');
      }
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(false);
    api
      .getAutomationStatus()
      .then((st) => {
        const label =
          st.marketSession === 'MARKET_OPEN'
            ? `NSE/BSE Live Session (${st.istTimeLabel})`
            : st.marketSession === 'PRE_OPEN'
              ? `Pre-Open Session (${st.istTimeLabel})`
              : `Auto-Sync Active (${st.istTimeLabel})`;
        setMarketSessionLabel(label);
      })
      .catch(() => {});
    const timer = setInterval(() => {
      loadDashboard(true);
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  useLiveMarketStream({
    onIndices: () => {
      void api.getIndices(false).then((r) => setIndices(r.indices)).catch(() => {});
    },
    onStocks: () => {
      void loadDashboard(true);
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
    if (stockTab === 'Watchlist') {
      const savedSymbols = watchlist
        .filter((w) => w.itemType === 'stock')
        .map((w) => w.itemKey.toUpperCase());
      if (savedSymbols.length === 0) {
        setStocks([]);
        return;
      }
      setStocksLoading(true);
      Promise.allSettled(savedSymbols.map((sym) => api.getStockBySymbol(sym, '1mo')))
        .then((res) => {
          setStocks(
            res
              .filter(
                (r): r is PromiseFulfilledResult<{
                  stock: StockInstrument;
                  fromUpstream: boolean;
                  linkedIpo: null;
                }> => r.status === 'fulfilled'
              )
              .map((r) => r.value.stock)
          );
        })
        .finally(() => setStocksLoading(false));
      return;
    }

    setStocksLoading(true);
    api
      .getStocks({
        exchange: stockTab === 'NSE' || stockTab === 'BSE' ? stockTab : 'All',
        sector: stockSector !== 'All' ? stockSector : undefined,
        q: debouncedStockSearch || undefined,
        tab:
          stockMoverFilter === 'Gainers'
            ? 'gainers'
            : stockMoverFilter === 'Losers'
              ? 'losers'
              : undefined,
        limit: 60,
      })
      .then((res) => {
        setStocks(res.stocks);
        if (res.sectors.length > 0) setAllSectors(res.sectors);
        if (res.totalUniverse) setTotalUniverse(res.totalUniverse);
      })
      .finally(() => setStocksLoading(false));
  }, [stockTab, stockSector, stockMoverFilter, debouncedStockSearch, watchlist]);

  // Derived Overview Metrics from actual records
  const metrics = useMemo(() => {
    const active = ipos.filter((i) => i.status === 'Open').length;
    const upcoming = ipos.filter((i) => i.status === 'Upcoming').length;
    const closed = ipos.filter((i) => i.status === 'Closed').length;
    const listedThisYear = ipos.filter(
      (i) => i.status === 'Listed' && (i.listing.listingDate || '').startsWith('2026')
    ).length;
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

  const handleHeroSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroSearch.trim();
    if (!q) return;
    const matchedIpo = ipos.find((i) => i.companyName.toLowerCase().includes(q.toLowerCase()));
    if (matchedIpo) {
      navigate(`/ipo/${matchedIpo.slug}`);
      return;
    }
    const matchedStk = stocks.find(
      (s) =>
        s.symbol.toLowerCase() === q.toLowerCase() ||
        s.bseCode === q ||
        s.companyName.toLowerCase().includes(q.toLowerCase())
    );
    if (matchedStk) {
      navigate(`/stock/${matchedStk.symbol}`);
      return;
    }
    try {
      const searchRes = await api.globalSearch(q);
      if (searchRes.ipos.length > 0) {
        navigate(`/ipo/${searchRes.ipos[0].slug}`);
        return;
      }
      if (searchRes.stocks.length > 0) {
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
                { label: 'Listed This Year', value: metrics.listedThisYear, sub: '2026 debuts tracked', to: '/listed' },
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

      <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-10 sm:space-y-12">
        {error && <ErrorRetryState message={error} onRetry={loadDashboard} />}

        {/* Section 4: Interactive IPO Activity Dashboard */}
        <section aria-labelledby="ipo-activity-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2
                id="ipo-activity-heading"
                className="font-display text-xl font-bold text-[#14263F] dark:text-white"
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
                className="font-display text-xl font-bold text-[#14263F] dark:text-white"
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
                className="font-display text-xl font-bold text-[#14263F] dark:text-white"
              >
                Live Stock Market (NSE &amp; BSE)
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Track exchange quotes, volume, market cap, and day ranges. Search any NSE/BSE ticker via global search.
              </p>
            </div>
            <Link
              to="/live-prices"
              className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              Open Full Stock Terminal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-slate-800 p-1">
              {(['All', 'NSE', 'BSE', 'Watchlist'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStockTab(tab)}
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
                  onChange={(e) => setStockSector(e.target.value)}
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
                  onChange={(e) =>
                    setStockMoverFilter(e.target.value as 'All' | 'Gainers' | 'Losers')
                  }
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
              }}
            />
          ) : (
            <StockTable stocks={filteredStocks} pageSize={10} compact />
          )}
        </section>

        {/* Section 7: Recently Listed IPOs */}
        <section aria-labelledby="listed-ipos-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2
                id="listed-ipos-heading"
                className="font-display text-xl font-bold text-[#14263F] dark:text-white"
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
                className="font-display text-xl font-bold text-[#14263F] dark:text-white"
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
                        {idx.change?.toFixed(2)} ({formatPercent(idx.changePercent)})
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
                className="font-display text-xl font-bold text-[#14263F] dark:text-white"
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
