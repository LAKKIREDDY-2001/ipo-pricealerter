import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { IPOOffering } from '../types/financial';
import {
  calculateCurrentReturnPct,
  calculateListingGainPct,
  formatDateIN,
  formatINR,
  formatPercent,
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
import { DataQualityBadge } from '../components/common/DataQualityBadge';

export function ListedPerformancePage() {
  const [ipos, setIpos] = useState<IPOOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [yearFilter, setYearFilter] = useState('All');
  const [catFilter, setCatFilter] = useState<'All' | 'Mainboard' | 'SME'>('All');
  const [exFilter, setExFilter] = useState<'All' | 'NSE' | 'BSE'>('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'listingGain' | 'currentReturn'>('date');

  const fetchListed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getIpos({ status: 'Listed' });
      setIpos(res.ipos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load listed IPO performance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListed();
  }, []);

  const years = useMemo(
    () =>
      ['All', ...Array.from(new Set(ipos.map((i) => (i.listing.listingDate || '').slice(0, 4)).filter(Boolean))).sort().reverse()],
    [ipos]
  );

  const sectors = useMemo(
    () => ['All', ...Array.from(new Set(ipos.map((i) => i.sector))).sort()],
    [ipos]
  );

  const filtered = useMemo(() => {
    const list = ipos.filter((i) => {
      if (yearFilter !== 'All' && !(i.listing.listingDate || '').startsWith(yearFilter)) return false;
      if (catFilter !== 'All' && i.category !== catFilter) return false;
      if (exFilter !== 'All' && i.listing.listingExchange !== exFilter && !i.exchanges.includes(exFilter)) return false;
      if (sectorFilter !== 'All' && i.sector !== sectorFilter) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'listingGain') {
        const ga = calculateListingGainPct(a.listing.issuePrice, a.listing.actualListingPrice) ?? -999;
        const gb = calculateListingGainPct(b.listing.issuePrice, b.listing.actualListingPrice) ?? -999;
        return gb - ga;
      }
      if (sortBy === 'currentReturn') {
        const ca = calculateCurrentReturnPct(a.listing.issuePrice, a.listing.currentMarketPrice) ?? -999;
        const cb = calculateCurrentReturnPct(b.listing.issuePrice, b.listing.currentMarketPrice) ?? -999;
        return cb - ca;
      }
      return (b.listing.listingDate || '').localeCompare(a.listing.listingDate || '');
    });
    return list;
  }, [ipos, yearFilter, catFilter, exFilter, sectorFilter, sortBy]);

  const analytics = useMemo(() => {
    const withGains = ipos
      .map((i) => ({
        ipo: i,
        listGain: calculateListingGainPct(i.listing.issuePrice, i.listing.actualListingPrice),
        curReturn: calculateCurrentReturnPct(i.listing.issuePrice, i.listing.currentMarketPrice),
      }))
      .filter((x) => x.listGain !== null);

    const highestList = [...withGains].sort((a, b) => (b.listGain ?? -999) - (a.listGain ?? -999))[0];
    const lowestList = [...withGains].sort((a, b) => (a.listGain ?? 999) - (b.listGain ?? 999))[0];
    const bestCur = [...withGains].sort((a, b) => (b.curReturn ?? -999) - (a.curReturn ?? -999))[0];
    const avgMain = withGains.filter((x) => x.ipo.category === 'Mainboard');
    const avgMainVal =
      avgMain.length > 0
        ? avgMain.reduce((acc, c) => acc + (c.listGain ?? 0), 0) / avgMain.length
        : null;

    return { highestList, lowestList, bestCur, avgMainVal };
  }, [ipos]);

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <SEOHead
        title="Listed IPO Performance – 2025 & 2026 Listing Gains & Post-IPO Returns"
        description="Analyse Indian IPO listing performance on NSE and BSE comparing issue price, actual listing day price, and current market return."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Listed IPO Performance' }]} />

      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
          Listed Stocks &amp; Historical IPO Performance
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Tracks verified exchange listing-day prices separately from issue price and current market price.
        </p>
      </div>

      <DisclaimerBanner
        title="Calculation Methodology"
        text="Listing Gain % = ((Actual Exchange Listing Price − IPO Issue Price) / IPO Issue Price) × 100. Current Return % = ((Current Market Price − IPO Issue Price) / IPO Issue Price) × 100."
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4">
          <div className="text-xs text-[#64748B]">Highest Listing Gain</div>
          <div className="font-data text-lg font-bold text-[#16A34A] mt-1">
            {analytics.highestList ? formatPercent(analytics.highestList.listGain) : '—'}
          </div>
          <div className="text-xs text-[#152338] dark:text-slate-200 truncate">
            {analytics.highestList?.ipo.companyName || '—'}
          </div>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4">
          <div className="text-xs text-[#64748B]">Lowest Listing Gain</div>
          <div className="font-data text-lg font-bold text-[#DC2626] mt-1">
            {analytics.lowestList ? formatPercent(analytics.lowestList.listGain) : '—'}
          </div>
          <div className="text-xs text-[#152338] dark:text-slate-200 truncate">
            {analytics.lowestList?.ipo.companyName || '—'}
          </div>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4">
          <div className="text-xs text-[#64748B]">Best Overall Post-IPO Return</div>
          <div className="font-data text-lg font-bold text-[#16A34A] mt-1">
            {analytics.bestCur ? formatPercent(analytics.bestCur.curReturn) : '—'}
          </div>
          <div className="text-xs text-[#152338] dark:text-slate-200 truncate">
            {analytics.bestCur?.ipo.companyName || '—'}
          </div>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4">
          <div className="text-xs text-[#64748B]">Mainboard Avg Listing Gain</div>
          <div className="font-data text-lg font-bold text-[#14263F] dark:text-white mt-1">
            {analytics.avgMainVal !== null ? formatPercent(analytics.avgMainVal) : '—'}
          </div>
          <div className="text-xs text-[#64748B]">Across tracked listings</div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 text-xs">
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          aria-label="Listing Year"
          className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y === 'All' ? 'All Years' : `Year ${y}`}
            </option>
          ))}
        </select>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as 'All' | 'Mainboard' | 'SME')}
          aria-label="Board Type"
          className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2"
        >
          <option value="All">Mainboard &amp; SME</option>
          <option value="Mainboard">Mainboard</option>
          <option value="SME">SME</option>
        </select>
        <select
          value={exFilter}
          onChange={(e) => setExFilter(e.target.value as 'All' | 'NSE' | 'BSE')}
          aria-label="Exchange"
          className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2"
        >
          <option value="All">NSE &amp; BSE</option>
          <option value="NSE">NSE</option>
          <option value="BSE">BSE</option>
        </select>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          aria-label="Sector"
          className="min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2"
        >
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All Sectors' : s}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'listingGain' | 'currentReturn')}
          aria-label="Sort Listed IPOs"
          className="col-span-2 sm:col-span-1 min-h-[38px] rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2"
        >
          <option value="date">Sort: Listing Date</option>
          <option value="listingGain">Sort: Listing Gain %</option>
          <option value="currentReturn">Sort: Current Return %</option>
        </select>
      </div>

      {error && <ErrorRetryState message={error} onRetry={fetchListed} />}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No listed IPOs match your filters"
          description="Reset year or board filters to see all tracked listings."
          actionLabel="Reset Filters"
          onAction={() => {
            setYearFilter('All');
            setCatFilter('All');
            setExFilter('All');
            setSectorFilter('All');
          }}
        />
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
          {/* Mobile Cards (< md) */}
          <div className="md:hidden divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {filtered.map((ipo) => {
              const listGain = calculateListingGainPct(
                ipo.listing.issuePrice,
                ipo.listing.actualListingPrice
              );
              const curRet = calculateCurrentReturnPct(
                ipo.listing.issuePrice,
                ipo.listing.currentMarketPrice
              );
              return (
                <div key={ipo.id} className="p-3.5 space-y-2.5">
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
                          className="text-sm font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate"
                        >
                          {ipo.companyName}
                        </Link>
                        <div className="text-[11px] text-[#64748B]">
                          {ipo.category} · {ipo.listing.listingExchange || 'NSE/BSE'} · Listed {formatDateIN(ipo.listing.listingDate)}
                        </div>
                      </div>
                    </div>
                    <DataQualityBadge status={ipo.listing.priceStatus} compact />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <div className="text-[10px] text-[#64748B]">Issue Price</div>
                      <div className="font-data font-medium">{formatINR(ipo.listing.issuePrice)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#64748B]">Listing Price</div>
                      <div className="font-data font-bold">{formatINR(ipo.listing.actualListingPrice)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[#64748B]">Current Price</div>
                      <div className="font-data font-semibold">{formatINR(ipo.listing.currentMarketPrice)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]/70 dark:border-slate-800 text-xs font-data">
                    <span>
                      Listing:{' '}
                      <strong className={(listGain ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {formatPercent(listGain)}
                      </strong>
                    </span>
                    <span>
                      Current:{' '}
                      <strong className={(curRet ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {formatPercent(curRet)}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-3">Listing Date</th>
                  <th className="py-3 px-3">Exchange</th>
                  <th className="py-3 px-3 text-right">Issue Price</th>
                  <th className="py-3 px-3 text-right">Actual Listing</th>
                  <th className="py-3 px-3 text-right">Current Price</th>
                  <th className="py-3 px-3 text-right">Prev. Close</th>
                  <th className="py-3 px-3 text-right">Listing Gain %</th>
                  <th className="py-3 px-4 text-right">Current Return %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                {filtered.map((ipo) => {
                  const listGain = calculateListingGainPct(
                    ipo.listing.issuePrice,
                    ipo.listing.actualListingPrice
                  );
                  const curRet = calculateCurrentReturnPct(
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
                            <div className="text-[11px] text-[#64748B]">
                              {ipo.category} · {ipo.sector}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-data">{formatDateIN(ipo.listing.listingDate)}</td>
                      <td className="py-3 px-3">{ipo.listing.listingExchange || 'NSE/BSE'}</td>
                      <td className="py-3 px-3 text-right font-data">{formatINR(ipo.listing.issuePrice)}</td>
                      <td className="py-3 px-3 text-right font-data font-bold">
                        {formatINR(ipo.listing.actualListingPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-data">
                        <div>{formatINR(ipo.listing.currentMarketPrice)}</div>
                        <div className="mt-0.5">
                          <DataQualityBadge status={ipo.listing.priceStatus} compact />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-data text-[#64748B]">
                        {formatINR(ipo.listing.previousClose)}
                      </td>
                      <td className="py-3 px-3 text-right font-data font-bold">
                        <span className={(listGain ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                          {formatPercent(listGain)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-data font-bold">
                        <span className={(curRet ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                          {formatPercent(curRet)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
