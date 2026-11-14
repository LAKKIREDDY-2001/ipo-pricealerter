import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { api } from '../services/api';
import type { IPOOffering } from '../types/financial';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs, EmptyState, ErrorRetryState, LoadingSkeleton } from '../components/common/StateViews';
import { IPOCard } from '../components/ipo/IPOCard';
import { IPOTable } from '../components/ipo/IPOTable';

interface IPOExplorerPageProps {
  presetCategory?: 'Mainboard' | 'SME';
  presetStatus?: 'Upcoming' | 'Open' | 'Closed' | 'Listed';
}

export function IPOExplorerPage({ presetCategory, presetStatus }: IPOExplorerPageProps) {
  const [ipos, setIpos] = useState<IPOOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [category, setCategory] = useState<string>(presetCategory || 'All');
  const [status, setStatus] = useState<string>(presetStatus || 'All');
  const [sector, setSector] = useState<string>('All');
  const [exchange, setExchange] = useState<string>('All');
  const [gmpFilter, setGmpFilter] = useState<'All' | 'Available' | 'Unavailable'>('All');
  const [minIssueCr, setMinIssueCr] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'gmp' | 'sub'>('date');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCategory(presetCategory || 'All');
    setStatus(presetStatus || 'All');
    setPage(1);
  }, [presetCategory, presetStatus]);

  const fetchIpos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getIpos();
      setIpos(res.ipos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch IPO registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpos();
  }, []);

  const sectors = useMemo(
    () => ['All', ...Array.from(new Set(ipos.map((i) => i.sector))).sort()],
    [ipos]
  );

  const filtered = useMemo(() => {
    const minSize = Number(minIssueCr);
    const list = ipos.filter((i) => {
      if (category !== 'All' && i.category !== category) return false;
      if (status !== 'All' && i.status !== status) return false;
      if (sector !== 'All' && i.sector !== sector) return false;
      if (exchange !== 'All' && !i.exchanges.includes(exchange as 'NSE' | 'BSE')) return false;
      if (gmpFilter !== 'All' && i.gmp.availability !== gmpFilter) return false;
      if (minIssueCr && Number.isFinite(minSize) && (i.issueSizeCr ?? 0) < minSize) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          i.companyName.toLowerCase().includes(q) ||
          i.sector.toLowerCase().includes(q) ||
          i.industry.toLowerCase().includes(q)
        );
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'size') return (b.issueSizeCr ?? 0) - (a.issueSizeCr ?? 0);
      if (sortBy === 'gmp') return (b.gmp.latestGmp ?? -9999) - (a.gmp.latestGmp ?? -9999);
      if (sortBy === 'sub') return (b.subscription.total ?? -1) - (a.subscription.total ?? -1);
      return (b.dates.openDate || '').localeCompare(a.dates.openDate || '');
    });
    return list;
  }, [ipos, category, status, sector, exchange, gmpFilter, minIssueCr, search, sortBy]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedCards = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const headingTitle = presetCategory
    ? `${presetCategory} IPOs in India`
    : presetStatus
      ? `${presetStatus} IPOs`
      : 'Indian IPO Explorer (Mainboard & SME)';

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <SEOHead
        title={headingTitle}
        description="Explore Mainboard and SME Indian IPOs with price bands, issue sizes, subscription status, allotment dates, and indicative GMP."
      />
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'IPO Explorer', to: '/ipo' },
          ...(presetCategory || presetStatus ? [{ label: headingTitle }] : []),
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
            {headingTitle}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Filter by board category, issue status, sector, exchange, issue size, and GMP availability.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-1 self-start">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                : 'text-[#64748B] dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                : 'text-[#64748B] dark:text-slate-400'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Table
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#152338] dark:text-slate-200">
          <span className="inline-flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" /> IPO Discovery Filters
          </span>
          <span className="font-data text-[#64748B] dark:text-slate-400">
            {filtered.length} matching offerings
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search company..."
            className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="IPO Type"
            className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
          >
            <option value="All">All Types</option>
            <option value="Mainboard">Mainboard</option>
            <option value="SME">SME</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="IPO Status"
            className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Closed">Closed</option>
            <option value="Listed">Listed</option>
          </select>
          <select
            value={sector}
            onChange={(e) => {
              setSector(e.target.value);
              setPage(1);
            }}
            aria-label="Sector"
            className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Sectors' : s}
              </option>
            ))}
          </select>
          <select
            value={exchange}
            onChange={(e) => {
              setExchange(e.target.value);
              setPage(1);
            }}
            aria-label="Exchange"
            className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
          >
            <option value="All">NSE &amp; BSE</option>
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
          </select>
          <select
            value={gmpFilter}
            onChange={(e) => {
              setGmpFilter(e.target.value as 'All' | 'Available' | 'Unavailable');
              setPage(1);
            }}
            aria-label="GMP Availability"
            className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
          >
            <option value="All">GMP: All</option>
            <option value="Available">GMP Available</option>
            <option value="Unavailable">GMP Unavailable</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'size' | 'gmp' | 'sub')}
            aria-label="Sort IPOs"
            className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
          >
            <option value="date">Sort: Latest Offer Date</option>
            <option value="size">Sort: Issue Size</option>
            <option value="sub">Sort: Subscription</option>
            <option value="gmp">Sort: Indicative GMP</option>
          </select>
        </div>

        {/* Official Registrar Allotment Quick Links */}
        <div className="pt-2.5 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#64748B]">
          <span className="font-semibold text-[#152338] dark:text-slate-200">
            Official Allotment Portals:
          </span>
          {[
            { name: 'MUFG Intime (Link Intime)', url: 'https://in.mpms.mufg.com/Initial_Offer/public-issues.html' },
            { name: 'KFinTech', url: 'https://kosmic.kfintech.com/ipostatus/' },
            { name: 'Bigshare Services', url: 'https://ipo.bigshareonline.com/IPO_Status.html' },
            { name: 'BSE Allotment', url: 'https://www.bseindia.com/investors/appli_check.aspx' },
            { name: 'NSE Bid Verification', url: 'https://www.nseindia.com/invest/check-trades-bids-verify-ipo-bids' },
          ].map((reg) => (
            <a
              key={reg.name}
              href={reg.url}
              target="_blank"
              rel="noreferrer"
              className="text-[#2563EB] dark:text-blue-400 hover:underline font-medium"
            >
              {reg.name} ↗
            </a>
          ))}
        </div>
      </section>

      {error && <ErrorRetryState message={error} onRetry={fetchIpos} />}

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No IPOs matched your filters"
          description="Try broadening your category, exchange, or issue size constraints."
          actionLabel="Clear All Filters"
          onAction={() => {
            setCategory('All');
            setStatus('All');
            setSector('All');
            setExchange('All');
            setGmpFilter('All');
            setMinIssueCr('');
            setSearch('');
          }}
        />
      ) : viewMode === 'table' ? (
        <IPOTable ipos={filtered} pageSize={10} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagedCards.map((ipo) => (
              <IPOCard key={ipo.id} ipo={ipo} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(idx + 1)}
                  className={`h-8 w-8 rounded-lg text-xs font-data font-semibold cursor-pointer ${
                    safePage === idx + 1
                      ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                      : 'border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] text-[#64748B]'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
