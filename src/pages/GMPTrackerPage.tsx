import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import { api } from '../services/api';
import type { IPOOffering } from '../types/financial';
import {
  calculateGMPEstimate,
  formatINR,
  formatPercent,
  formatTimestampIN,
} from '../utils/calculations';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { SEOHead } from '../components/common/SEOHead';
import {
  Breadcrumbs,
  DisclaimerBanner,
  EmptyState,
  ErrorRetryState,
  LoadingSkeleton,
} from '../components/common/StateViews';
import { GMPChart } from '../components/gmp/GMPChart';

export function GMPTrackerPage() {
  const { companySlug } = useParams<{ companySlug?: string }>();
  const [ipos, setIpos] = useState<IPOOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    'All' | 'Mainboard' | 'SME' | 'Upcoming' | 'Open' | 'Positive' | 'Negative'
  >('All');
  const [selectedSlug, setSelectedSlug] = useState<string>(companySlug || '');

  // Hypothetical GMP calculator state
  const [calcUpperPrice, setCalcUpperPrice] = useState('435');
  const [calcGmp, setCalcGmp] = useState('68');
  const [search, setSearch] = useState('');

  const fetchIpos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getIpos();
      setIpos(res.ipos);
      if (companySlug) {
        setSelectedSlug(companySlug);
      } else {
        const first = res.ipos.find((i) => i.gmp.history.length > 0);
        if (first) setSelectedSlug(first.slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load GMP data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpos();
  }, [companySlug]);

  const metrics = useMemo(() => {
    const withGmp = ipos.filter(
      (i) => i.gmp.availability === 'Available' && i.gmp.latestGmp !== null
    );
    const highestGmp = withGmp.reduce<IPOOffering | null>(
      (best, cur) =>
        !best || (cur.gmp.latestGmp ?? -9999) > (best.gmp.latestGmp ?? -9999) ? cur : best,
      null
    );
    const highestPct = withGmp.reduce<{ ipo: IPOOffering | null; pct: number }>(
      (best, cur) => {
        const { estimatedGainPct } = calculateGMPEstimate(cur.priceBandHigh, cur.gmp.latestGmp);
        if (estimatedGainPct !== null && estimatedGainPct > best.pct) {
          return { ipo: cur, pct: estimatedGainPct };
        }
        return best;
      },
      { ipo: null, pct: -9999 }
    );
    const latestUpdated = [...withGmp].sort((a, b) =>
      (b.gmp.lastUpdated || '').localeCompare(a.gmp.lastUpdated || '')
    )[0];

    return {
      totalAvailable: withGmp.length,
      highestGmp,
      highestPct,
      latestUpdated,
      positiveCount: withGmp.filter((i) => (i.gmp.latestGmp ?? 0) > 0).length,
      negativeCount: withGmp.filter((i) => (i.gmp.latestGmp ?? 0) < 0).length,
    };
  }, [ipos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ipos.filter((i) => {
      if (q && !i.companyName.toLowerCase().includes(q) && !i.sector.toLowerCase().includes(q)) {
        return false;
      }
      if (filter === 'Mainboard') return i.category === 'Mainboard';
      if (filter === 'SME') return i.category === 'SME';
      if (filter === 'Upcoming') return i.status === 'Upcoming';
      if (filter === 'Open') return i.status === 'Open';
      if (filter === 'Positive')
        return i.gmp.availability === 'Available' && (i.gmp.latestGmp ?? 0) > 0;
      if (filter === 'Negative')
        return i.gmp.availability === 'Available' && (i.gmp.latestGmp ?? 0) < 0;
      return true;
    });
  }, [ipos, filter, search]);

  const activeIpo = useMemo(
    () => ipos.find((i) => i.slug === selectedSlug) ?? filtered[0] ?? null,
    [ipos, selectedSlug, filtered]
  );

  const handleSelectIpo = (ipo: IPOOffering) => {
    setSelectedSlug(ipo.slug);
    if (ipo.priceBandHigh !== null) setCalcUpperPrice(String(ipo.priceBandHigh));
    if (ipo.gmp.latestGmp !== null) setCalcGmp(String(ipo.gmp.latestGmp));
  };

  const calcResult = calculateGMPEstimate(Number(calcUpperPrice), Number(calcGmp));

  return (
    <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6">
      <SEOHead
        title="IPO GMP Tracker – Grey Market Premium, Historical Trend & Calculator"
        description="Track unofficial Indian IPO Grey Market Premium (GMP), daily changes, hypothetical listing price estimates, and historical GMP charts."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'GMP Tracker' }]} />

      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
          IPO Grey Market Premium (GMP) Analytics
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Track recorded unofficial GMP movements, historical ranges, and hypothetical listing calculations.
        </p>
      </div>

      <DisclaimerBanner
        title="Important GMP Data Policy"
        text="GMP is unofficial, unregulated, and NOT published by NSE, BSE, or SEBI. PriceAlerter never invents missing GMP values—unavailable quotes are shown explicitly as Unavailable. Calculations below are strictly hypothetical, not guaranteed listing returns."
      />

      {/* Metrics Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Available GMPs', val: String(metrics.totalAvailable), sub: 'Tracked issues' },
          {
            label: 'Highest GMP',
            val: metrics.highestGmp?.gmp.latestGmp !== undefined ? `₹${metrics.highestGmp.gmp.latestGmp}` : 'Unavailable',
            sub: metrics.highestGmp?.shortName || '—',
          },
          {
            label: 'Highest GMP %',
            val: metrics.highestPct.pct > -999 ? formatPercent(metrics.highestPct.pct) : 'Unavailable',
            sub: metrics.highestPct.ipo?.shortName || '—',
          },
          {
            label: 'Latest Updated',
            val: metrics.latestUpdated?.shortName || '—',
            sub: metrics.latestUpdated?.gmp.latestGmp !== null ? `₹${metrics.latestUpdated?.gmp.latestGmp}` : '—',
          },
          { label: 'Positive GMP', val: String(metrics.positiveCount), sub: 'Premium above issue' },
          { label: 'Negative GMP', val: String(metrics.negativeCount), sub: 'Discount to issue' },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-3.5 sm:p-4"
          >
            <div className="text-xs text-[#64748B] dark:text-slate-400">{m.label}</div>
            <div className="font-data text-lg font-bold text-[#152338] dark:text-white mt-1 truncate">
              {loading ? '—' : m.val}
            </div>
            <div className="text-[11px] text-[#94A3B8] truncate">{m.sub}</div>
          </div>
        ))}
      </section>

      {error && <ErrorRetryState message={error} onRetry={fetchIpos} />}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['All', 'Mainboard', 'SME', 'Open', 'Upcoming', 'Positive', 'Negative'] as const).map(
            (f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  filter === f
                    ? 'bg-[#14263F] text-white border-[#14263F] dark:bg-[#2563EB] dark:border-[#2563EB]'
                    : 'bg-white dark:bg-[#111C2E] text-[#64748B] dark:text-slate-300 border-[#E2E8F0] dark:border-slate-800'
                }`}
              >
                {f === 'Positive' ? 'Positive GMP' : f === 'Negative' ? 'Negative GMP' : f}
              </button>
            )
          )}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter IPO by company or sector..."
          className="w-full md:w-64 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
        />
      </div>

      {/* Main Table + Chart Split */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No GMP records match this filter"
          description="Select All or switch between Mainboard and SME filters."
          actionLabel="Show All"
          onAction={() => {
            setFilter('All');
            setSearch('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* GMP List: Mobile Cards (< md) & Desktop Table (md+) */}
          <div className="lg:col-span-7 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[#E2E8F0] dark:divide-slate-800">
              {filtered.map((ipo) => {
                const avail = ipo.gmp.availability === 'Available' && ipo.gmp.latestGmp !== null;
                const pos = (ipo.gmp.latestGmp ?? 0) >= 0;
                const gmpDiff =
                  avail && ipo.gmp.previousGmp !== null
                    ? ipo.gmp.latestGmp! - ipo.gmp.previousGmp
                    : null;
                const { estimatedListingPrice, estimatedGainPct } = calculateGMPEstimate(
                  ipo.priceBandHigh,
                  ipo.gmp.latestGmp
                );
                const active = activeIpo?.slug === ipo.slug;

                return (
                  <div
                    key={ipo.id}
                    onClick={() => handleSelectIpo(ipo)}
                    className={`p-3.5 space-y-2 cursor-pointer transition-colors ${
                      active ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                    }`}
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
                          <Link
                            to={`/ipo/${ipo.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate"
                          >
                            {ipo.companyName}
                          </Link>
                          <div className="text-[11px] text-[#64748B]">
                            {ipo.category} · {ipo.status} · Price {ipo.priceBandHigh ? formatINR(ipo.priceBandHigh, 0) : 'TBA'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-data shrink-0">
                        {avail ? (
                          <>
                            <div className={`text-sm font-bold ${pos ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                              {pos ? '+' : ''}₹{ipo.gmp.latestGmp}
                            </div>
                            <div className="text-[11px] text-[#64748B]">
                              {estimatedGainPct !== null ? formatPercent(estimatedGainPct) : '—'}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-[#94A3B8]">Unavailable</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] font-data text-[#64748B] pt-1 border-t border-[#E2E8F0]/70 dark:border-slate-800">
                      <span>
                        Est: {estimatedListingPrice !== null ? formatINR(estimatedListingPrice, 0) : '—'}
                        {gmpDiff !== null ? ` · Δ ${gmpDiff >= 0 ? '+' : ''}₹${gmpDiff}` : ''}
                      </span>
                      <span className="font-sans font-semibold text-[#2563EB]">
                        {active ? 'Chart Selected' : 'Tap for Chart'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-3 text-right">IPO Price</th>
                    <th className="py-3 px-3 text-right">GMP</th>
                    <th className="py-3 px-3 text-right">Change</th>
                    <th className="py-3 px-3 text-right">GMP %</th>
                    <th className="py-3 px-3 text-right">Est. Listing</th>
                    <th className="py-3 px-3">Last Updated</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {filtered.map((ipo) => {
                    const avail = ipo.gmp.availability === 'Available' && ipo.gmp.latestGmp !== null;
                    const pos = (ipo.gmp.latestGmp ?? 0) >= 0;
                    const gmpDiff =
                      avail && ipo.gmp.previousGmp !== null
                        ? ipo.gmp.latestGmp! - ipo.gmp.previousGmp
                        : null;
                    const { estimatedListingPrice, estimatedGainPct } = calculateGMPEstimate(
                      ipo.priceBandHigh,
                      ipo.gmp.latestGmp
                    );
                    const active = activeIpo?.slug === ipo.slug;

                    return (
                      <tr
                        key={ipo.id}
                        onClick={() => handleSelectIpo(ipo)}
                        className={`cursor-pointer transition-colors ${
                          active
                            ? 'bg-blue-50/70 dark:bg-blue-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
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
                                onClick={(e) => e.stopPropagation()}
                                className="font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate"
                              >
                                {ipo.companyName}
                              </Link>
                              <div className="text-[11px] text-[#64748B]">
                                {ipo.category} · {ipo.status}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-data">
                          {ipo.priceBandHigh ? formatINR(ipo.priceBandHigh, 0) : 'TBA'}
                        </td>
                        <td className="py-3 px-3 text-right font-data font-bold">
                          {avail ? (
                            <span className={pos ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                              {pos ? '+' : ''}₹{ipo.gmp.latestGmp}
                            </span>
                          ) : (
                            <span className="text-[#94A3B8] font-normal">Unavailable</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-data">
                          {gmpDiff !== null ? (
                            <span className={gmpDiff >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                              {gmpDiff >= 0 ? '+' : ''}₹{gmpDiff}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-data">
                          {estimatedGainPct !== null ? (
                            <span className={estimatedGainPct >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                              {formatPercent(estimatedGainPct)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-data">
                          {estimatedListingPrice !== null ? formatINR(estimatedListingPrice, 0) : 'Unavailable'}
                        </td>
                        <td className="py-3 px-3 font-data text-[11px] text-[#64748B]">
                          {ipo.gmp.lastUpdated ? formatTimestampIN(ipo.gmp.lastUpdated) : 'Unavailable'}
                        </td>
                        <td className="py-3 px-4 text-right text-[11px]">
                          {avail ? 'Indicative' : 'Unavailable'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            {activeIpo && (
              <GMPChart history={activeIpo.gmp.history} companyName={activeIpo.companyName} />
            )}

            {/* Embedded Hypothetical GMP Calculator */}
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#059669]" />
                <h2 className="text-sm font-semibold text-[#152338] dark:text-white">
                  GMP Listing Estimate Calculator (Hypothetical)
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="block">
                  <span className="text-[#64748B] dark:text-slate-400">Issue Upper Price (₹)</span>
                  <input
                    type="number"
                    value={calcUpperPrice}
                    onChange={(e) => setCalcUpperPrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm text-[#152338] dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-[#64748B] dark:text-slate-400">Unofficial GMP (₹)</span>
                  <input
                    type="number"
                    value={calcGmp}
                    onChange={(e) => setCalcGmp(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm text-[#152338] dark:text-white"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
                <div>
                  <div className="text-[11px] text-[#64748B]">Hypothetical Listing Price</div>
                  <div className="font-data text-lg font-bold text-[#14263F] dark:text-white">
                    {formatINR(calcResult.estimatedListingPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#64748B]">Hypothetical Gain / Loss</div>
                  <div
                    className={`font-data text-lg font-bold ${
                      (calcResult.estimatedGainPct ?? 0) >= 0
                        ? 'text-[#16A34A] dark:text-emerald-400'
                        : 'text-[#DC2626] dark:text-red-400'
                    }`}
                  >
                    {formatPercent(calcResult.estimatedGainPct)}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                Arithmetic formula only: Issue Upper Price + GMP. Not an investment prediction.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
