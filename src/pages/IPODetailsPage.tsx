import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, FileText, Globe } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import type { IPOOffering } from '../types/financial';
import {
  calculateCurrentReturnPct,
  calculateGMPEstimate,
  calculateListingGainPct,
  formatCrores,
  formatDateIN,
  formatINR,
  formatPercent,
  formatStockTickerLabel,
  formatTimestampIN,
} from '../utils/calculations';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { SEOHead } from '../components/common/SEOHead';
import {
  Breadcrumbs,
  DisclaimerBanner,
  ErrorRetryState,
  LoadingSkeleton,
} from '../components/common/StateViews';
import { DataQualityBadge, IPOStatusBadge } from '../components/common/DataQualityBadge';
import { WatchlistButton } from '../components/common/WatchlistButton';
import { GMPChart } from '../components/gmp/GMPChart';

type DetailTab =
  | 'overview'
  | 'gmp'
  | 'subscription'
  | 'financials'
  | 'valuation'
  | 'profile'
  | 'risks'
  | 'documents';

export function IPODetailsPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [ipo, setIpo] = useState<IPOOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const fetchDetail = async () => {
    if (!companySlug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getIpoBySlug(companySlug);
      setIpo(res.ipo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load IPO research profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    setActiveTab('overview');
  }, [companySlug]);

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <LoadingSkeleton rows={8} />
      </main>
    );
  }

  if (error || !ipo) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'IPO Explorer', to: '/ipo' }]} />
        <ErrorRetryState message={error || 'IPO record not found.'} onRetry={fetchDetail} />
      </main>
    );
  }

  const { estimatedListingPrice, estimatedGainPct } = calculateGMPEstimate(
    ipo.priceBandHigh,
    ipo.gmp.latestGmp
  );
  const listingGainPct = calculateListingGainPct(
    ipo.listing.issuePrice,
    ipo.listing.actualListingPrice
  );
  const currentReturnPct = calculateCurrentReturnPct(
    ipo.listing.issuePrice,
    ipo.listing.currentMarketPrice
  );

  const hasEbitda = ipo.financials.years.some((y) => y.ebitdaCr !== null);
  const financialMetricRows = [
    { label: 'Revenue (₹ Cr)', key: 'revenueCr' as const },
    { label: 'EBITDA (₹ Cr)', key: 'ebitdaCr' as const },
    { label: 'Profit After Tax (₹ Cr)', key: 'patCr' as const },
    { label: 'Total Assets (₹ Cr)', key: 'assetsCr' as const },
    { label: 'Net Worth (₹ Cr)', key: 'netWorthCr' as const },
    { label: 'Total Borrowings (₹ Cr)', key: 'borrowingsCr' as const },
    { label: 'Basic EPS (₹)', key: 'eps' as const },
    { label: 'ROE (%)', key: 'roePct' as const },
    { label: 'ROCE (%)', key: 'rocePct' as const },
    { label: 'Debt-to-Equity (x)', key: 'debtToEquity' as const },
  ].filter((row) => ipo.financials.years.some((y) => y[row.key] !== null));

  const subCategories = [
    { label: 'QIB', val: ipo.subscription.qib },
    { label: 'NII (HNI)', val: ipo.subscription.nii },
    { label: 'Retail', val: ipo.subscription.retail },
    ...(ipo.subscription.employee !== null ? [{ label: 'Employee', val: ipo.subscription.employee }] : []),
    ...(ipo.subscription.shareholder !== null ? [{ label: 'Shareholder', val: ipo.subscription.shareholder }] : []),
    { label: 'Total', val: ipo.subscription.total },
  ];

  const effectiveUpperPrice = ipo.priceBandHigh ?? ipo.listing.issuePrice;
  const priceDisplay =
    effectiveUpperPrice !== null
      ? ipo.priceBandLow && ipo.priceBandLow !== effectiveUpperPrice
        ? `₹${ipo.priceBandLow} – ₹${effectiveUpperPrice}`
        : `₹${effectiveUpperPrice}`
      : 'TBA';

  const minLots =
    ipo.minBidQuantity && ipo.lotSize && ipo.minBidQuantity > ipo.lotSize
      ? Math.round(ipo.minBidQuantity / ipo.lotSize)
      : 1;

  const docMainUrl = ipo.documents.prospectusUrl || ipo.documents.rhpUrl || ipo.documents.drhpUrl;

  return (
    <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6">
      <SEOHead
        title={`${ipo.companyName} IPO – Price Band, GMP, Subscription, Financials & Valuation`}
        description={`Complete IPO research for ${ipo.companyName}: price band, issue size, subscription trend, 3-year financials, peer valuation, risks, and official RHP links.`}
      />

      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'IPO Explorer', to: '/ipo' },
          { label: ipo.companyName },
        ]}
      />

      {/* Header */}
      <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <CompanyLogo
              size="lg"
              companyName={ipo.companyName}
              symbol={ipo.listing.stockSymbol}
              logoUrl={ipo.logoUrl}
              logoColor={ipo.logoColor}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                <span>{ipo.category} IPO</span>
                <span>·</span>
                <span>{ipo.sector}</span>
                <span>·</span>
                <span>{ipo.exchanges.join(' / ')}</span>
                <IPOStatusBadge status={ipo.status} />
                <DataQualityBadge status={ipo.provenance.qualityStatus} compact />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white mt-1">
                {ipo.companyName}
              </h1>
              <div className="mt-1.5 text-xs text-[#64748B] dark:text-slate-400">
                Source: {ipo.provenance.source} · Effective {formatDateIN(ipo.provenance.effectiveDate)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <WatchlistButton itemType="ipo" itemKey={ipo.slug} label={ipo.companyName} />
            {ipo.status === 'Listed' && ipo.listing.stockSymbol && (
              <Link
                to={`/stock/${ipo.listing.stockSymbol}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#059669] px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 whitespace-nowrap"
              >
                Live Stock Quote ({ipo.listing.stockSymbol}) →
              </Link>
            )}
            {ipo.website && (
              <a
                href={ipo.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] dark:border-slate-700 px-3 py-2 text-xs font-medium text-[#152338] dark:text-slate-200 hover:border-[#14263F]"
              >
                <Globe className="w-3.5 h-3.5" /> Official Site
              </a>
            )}
            {ipo.registrarUrl && (
              <a
                href={ipo.registrarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] dark:border-slate-700 px-3 py-2 text-xs font-medium text-[#152338] dark:text-slate-200 hover:border-[#14263F]"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Registrar Allotment
              </a>
            )}
            {docMainUrl && (
              <a
                href={docMainUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#14263F] dark:bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                <FileText className="w-3.5 h-3.5" /> {ipo.documents.rhpUrl ? 'Official RHP' : 'Official DRHP'}
              </a>
            )}
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Issue Size</div>
            <div className="font-data text-sm font-bold text-[#152338] dark:text-white mt-0.5">
              {formatCrores(ipo.issueSizeCr)}
            </div>
            <div className="text-[11px] text-[#94A3B8] font-data">
              {ipo.freshIssueCr !== null || ipo.ofsCr !== null
                ? `Fresh ${formatCrores(ipo.freshIssueCr)} · OFS ${formatCrores(ipo.ofsCr)}`
                : ipo.faceValue
                  ? `Face Value ₹${ipo.faceValue} · ${ipo.category}`
                  : `${ipo.category} Equity Issue`}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">
              {ipo.status === 'Listed' && ipo.listing.issuePrice ? 'Issue Price' : 'Price Band'}
            </div>
            <div className="font-data text-sm font-bold text-[#152338] dark:text-white mt-0.5">
              {priceDisplay}
            </div>
            <div className="text-[11px] text-[#94A3B8] font-data">
              Lot: {ipo.lotSize ?? 'TBA'}
              {minLots > 1 ? ` (${minLots} lots min)` : ''} · Min{' '}
              {ipo.minInvestment ? formatINR(ipo.minInvestment, 0) : 'TBA'}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Offer Window</div>
            <div className="font-data text-sm font-semibold text-[#152338] dark:text-white mt-0.5">
              {formatDateIN(ipo.dates.openDate)}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-data">
              Closes {formatDateIN(ipo.dates.closeDate)}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Allotment &amp; Listing</div>
            <div className="font-data text-sm font-semibold text-[#152338] dark:text-white mt-0.5">
              {formatDateIN(ipo.dates.listingDate)}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-data">
              Allot: {formatDateIN(ipo.dates.allotmentDate)}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Subscription</div>
            <div className="font-data text-sm font-bold text-[#152338] dark:text-white mt-0.5">
              {ipo.subscription.total !== null
                ? `${ipo.subscription.total.toFixed(2)}x`
                : ipo.status === 'Upcoming'
                  ? 'Not Open'
                  : 'Unavailable'}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400">
              {ipo.subscription.total !== null
                ? ipo.subscription.isFinal
                  ? 'Final Bid Book'
                  : 'Live Bid Book'
                : ipo.status === 'Upcoming'
                  ? 'Bidding not started'
                  : 'Bid summary pending'}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">
              {ipo.status === 'Listed' && ipo.listing.actualListingPrice !== null
                ? 'Listed Price / GMP'
                : 'Indicative GMP'}
            </div>
            {ipo.status === 'Listed' && ipo.listing.actualListingPrice !== null ? (
              <>
                <div
                  className={`font-data text-sm font-bold mt-0.5 ${
                    (listingGainPct ?? 0) >= 0
                      ? 'text-[#16A34A] dark:text-emerald-400'
                      : 'text-[#DC2626] dark:text-red-400'
                  }`}
                >
                  {formatINR(ipo.listing.actualListingPrice)} ({formatPercent(listingGainPct)})
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-data">
                  {ipo.gmp.latestGmp !== null
                    ? `Last GMP: ${ipo.gmp.latestGmp >= 0 ? '+' : ''}₹${ipo.gmp.latestGmp}`
                    : `CMP: ${formatINR(ipo.listing.currentMarketPrice)}`}
                </div>
              </>
            ) : (
              <>
                <div
                  className={`font-data text-sm font-bold mt-0.5 ${
                    ipo.gmp.latestGmp === null
                      ? 'text-[#94A3B8]'
                      : ipo.gmp.latestGmp >= 0
                        ? 'text-[#16A34A] dark:text-emerald-400'
                        : 'text-[#DC2626] dark:text-red-400'
                  }`}
                >
                  {ipo.gmp.latestGmp !== null
                    ? `${ipo.gmp.latestGmp >= 0 ? '+' : ''}₹${ipo.gmp.latestGmp}`
                    : 'Unavailable'}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-data">
                  {estimatedListingPrice !== null
                    ? `Est: ₹${estimatedListingPrice} (${formatPercent(estimatedGainPct)})`
                    : 'No active GMP quote'}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#E2E8F0] dark:border-slate-800 pb-1">
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'gmp', label: 'GMP' },
            { id: 'subscription', label: 'Subscription' },
            { id: 'financials', label: 'Financials' },
            { id: 'valuation', label: 'Valuation' },
            { id: 'profile', label: 'Company Profile' },
            { id: 'risks', label: 'Risks' },
            { id: 'documents', label: 'Documents' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#152338] dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3">
              <h2 className="text-base font-semibold text-[#152338] dark:text-white">
                Offer Summary &amp; Business Snapshot
              </h2>
              <p className="text-sm text-[#64748B] dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {ipo.profile.overview}
              </p>
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-[#F6F8FB] dark:bg-slate-900 p-3">
                  <div className="text-[#64748B] dark:text-slate-400">Registrar</div>
                  <div className="font-semibold text-[#152338] dark:text-slate-100 mt-0.5">
                    {ipo.registrar}
                  </div>
                </div>
                <div className="rounded-lg bg-[#F6F8FB] dark:bg-slate-900 p-3">
                  <div className="text-[#64748B] dark:text-slate-400">Leadership / Promoters</div>
                  <div className="font-semibold text-[#152338] dark:text-slate-100 mt-0.5">
                    {ipo.profile.promoters.length > 0 ? ipo.profile.promoters.join(', ') : 'Disclosed in Offer Document'}
                  </div>
                </div>
              </div>
            </div>

            {ipo.status === 'Listed' && (
              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-[#152338] dark:text-white">
                    Exchange Listing Performance
                  </h2>
                  {ipo.listing.stockSymbol && (
                    <Link
                      to={`/stock/${ipo.listing.stockSymbol}`}
                      className="text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      View Live Quote ({ipo.listing.stockSymbol}) →
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-[#64748B]">Issue Price</div>
                    <div className="font-data font-bold text-sm mt-0.5">{formatINR(ipo.listing.issuePrice)}</div>
                  </div>
                  <div>
                    <div className="text-[#64748B]">Actual Listing Price</div>
                    <div className="font-data font-bold text-sm mt-0.5">{formatINR(ipo.listing.actualListingPrice)}</div>
                  </div>
                  <div>
                    <div className="text-[#64748B]">Listing Gain</div>
                    <div className={`font-data font-bold text-sm mt-0.5 ${(listingGainPct ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {formatPercent(listingGainPct)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#64748B]">Current Return ({formatINR(ipo.listing.currentMarketPrice)})</div>
                    <div className={`font-data font-bold text-sm mt-0.5 ${(currentReturnPct ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {formatPercent(currentReturnPct)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5">
            <h2 className="text-base font-semibold text-[#152338] dark:text-white mb-4">
              IPO Schedule &amp; Milestones
            </h2>
            <dl className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-xs">
              {[
                { label: 'IPO Open Date', value: formatDateIN(ipo.dates.openDate) },
                { label: 'IPO Close Date', value: formatDateIN(ipo.dates.closeDate) },
                { label: 'Basis of Allotment', value: formatDateIN(ipo.dates.allotmentDate) },
                ...(ipo.dates.refundDate ? [{ label: 'Initiation of Refunds', value: formatDateIN(ipo.dates.refundDate) }] : []),
                ...(ipo.dates.dematCreditDate ? [{ label: 'Credit of Shares to Demat', value: formatDateIN(ipo.dates.dematCreditDate) }] : []),
                { label: 'Listing Date', value: formatDateIN(ipo.dates.listingDate) },
              ].map((row) => (
                <div key={row.label} className="py-2.5 flex items-center justify-between">
                  <dt className="text-[#64748B] dark:text-slate-400">{row.label}</dt>
                  <dd className="font-data font-semibold text-[#152338] dark:text-slate-100">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'gmp' && (
        <div className="space-y-5">
          <DisclaimerBanner
            title="Unofficial GMP Notice"
            text="Grey Market Premium is an unofficial speculative indicator and not published by NSE or BSE. Estimated listing price = Issue Upper Price + GMP."
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <GMPChart history={ipo.gmp.history} companyName={ipo.companyName} />
            </div>
            <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4">
              <h2 className="text-base font-semibold text-[#152338] dark:text-white">
                Recorded GMP Observations
              </h2>
              {ipo.gmp.history.length === 0 ? (
                <p className="text-xs text-[#64748B]">No historical GMP observations available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] dark:border-slate-800 text-[#64748B]">
                        <th className="py-2">Date</th>
                        <th className="py-2 text-right">GMP</th>
                        <th className="py-2 text-right">Est. Listing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                      {[...ipo.gmp.history].reverse().map((pt) => {
                        const est = calculateGMPEstimate(ipo.priceBandHigh, pt.gmp);
                        return (
                          <tr key={pt.date}>
                            <td className="py-2 font-data whitespace-nowrap">{formatDateIN(pt.date)}</td>
                            <td className={`py-2 text-right font-data font-semibold whitespace-nowrap ${pt.gmp >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                              {pt.gmp >= 0 ? '+' : ''}₹{pt.gmp}
                            </td>
                            <td className="py-2 text-right font-data whitespace-nowrap">
                              {est.estimatedListingPrice !== null ? formatINR(est.estimatedListingPrice, 0) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {subCategories.map((cat) => (
              <div
                key={cat.label}
                className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4"
              >
                <div className="text-xs text-[#64748B] dark:text-slate-400">{cat.label}</div>
                <div className="mt-1 font-data text-lg font-bold text-[#152338] dark:text-white">
                  {cat.val !== null ? `${cat.val.toFixed(2)}x` : 'Unavailable'}
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  {cat.val !== null
                    ? ipo.subscription.isFinal
                      ? 'Final Figure'
                      : 'Provisional'
                    : ipo.status === 'Upcoming'
                      ? 'Not Open'
                      : 'Not Reported'}
                </div>
              </div>
            ))}
          </div>

          {ipo.subscription.dailyBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5">
                <h2 className="text-sm font-semibold text-[#152338] dark:text-white mb-4">
                  Daily Subscription Trend (x)
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ipo.subscription.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="qib" name="QIB" fill="#14263F" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="nii" name="NII" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="retail" name="Retail" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 overflow-x-auto">
                <h2 className="text-sm font-semibold text-[#152338] dark:text-white mb-4">
                  Day-wise Bid Book Breakdown
                </h2>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-slate-800 text-[#64748B]">
                      <th className="py-2">Day</th>
                      <th className="py-2 text-right">QIB</th>
                      <th className="py-2 text-right">NII</th>
                      <th className="py-2 text-right">Retail</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 font-data">
                    {ipo.subscription.dailyBreakdown.map((d) => (
                      <tr key={d.day}>
                        <td className="py-2.5 font-sans font-medium">{d.day} ({formatDateIN(d.date)})</td>
                        <td className="py-2.5 text-right">{d.qib !== null ? `${d.qib}x` : '—'}</td>
                        <td className="py-2.5 text-right">{d.nii !== null ? `${d.nii}x` : '—'}</td>
                        <td className="py-2.5 text-right">{d.retail !== null ? `${d.retail}x` : '—'}</td>
                        <td className="py-2.5 text-right font-bold">{d.total !== null ? `${d.total}x` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 text-[11px] text-[#64748B]">
                  Source: {ipo.subscription.provenance.source} · Updated {formatTimestampIN(ipo.subscription.provenance.retrievedAt)}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 text-xs text-[#64748B]">
              {ipo.subscription.total !== null
                ? `Consolidated category-wise subscription totals are displayed above (${ipo.subscription.total.toFixed(2)}x overall). Day-by-day tranche history is not provided in the exchange summary.`
                : ipo.status === 'Upcoming'
                  ? 'Subscription bid data is not yet available because bidding has not opened yet.'
                  : 'Subscription bid data is currently unavailable from the connected exchange feed.'}
            </div>
          )}
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-semibold text-[#152338] dark:text-white">
                3-Year Restated Financial Performance (₹ Crores)
              </h2>
              <span className="text-xs text-[#64748B] dark:text-slate-400">
                Basis: {ipo.financials.reportingBasis}
              </span>
            </div>

            {ipo.financials.years.length > 0 && financialMetricRows.length > 0 ? (
              <>
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ipo.financials.years}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="revenueCr" name="Revenue (₹ Cr)" fill="#14263F" radius={[4, 4, 0, 0]} />
                      {hasEbitda ? (
                        <Bar dataKey="ebitdaCr" name="EBITDA (₹ Cr)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      ) : (
                        <Bar dataKey="assetsCr" name="Total Assets (₹ Cr)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      )}
                      <Bar dataKey="patCr" name="PAT (₹ Cr)" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[#64748B]">
                        <th className="py-2.5 px-3">Metric</th>
                        {ipo.financials.years.map((y) => (
                          <th key={y.year} className="py-2.5 px-3 text-right">
                            {y.year}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 font-data">
                      {financialMetricRows.map((row) => (
                        <tr key={row.label}>
                          <td className="py-2.5 px-3 font-sans font-medium text-[#152338] dark:text-slate-200">
                            {row.label}
                          </td>
                          {ipo.financials.years.map((y) => (
                            <td key={y.year} className="py-2.5 px-3 text-right">
                              {y[row.key] !== null ? y[row.key] : 'Unavailable'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#64748B]">Historical restated financials pending DRHP/RHP extraction.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'valuation' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'P/E Ratio', value: ipo.valuation.peRatio ? `${ipo.valuation.peRatio}x` : 'Unavailable' },
              { label: 'P/B Ratio', value: ipo.valuation.pbRatio ? `${ipo.valuation.pbRatio}x` : 'Unavailable' },
              { label: 'Market Cap', value: formatCrores(ipo.valuation.marketCapCr) },
              { label: 'EPS', value: ipo.valuation.eps ? formatINR(ipo.valuation.eps) : 'Unavailable' },
              { label: 'Industry Avg P/E', value: ipo.valuation.industryAvgPe ? `${ipo.valuation.industryAvgPe}x` : 'Unavailable' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4"
              >
                <div className="text-xs text-[#64748B]">{item.label}</div>
                <div className="font-data text-lg font-bold text-[#152338] dark:text-white mt-1">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B] dark:text-slate-400">
              <div>
                <strong className="text-[#152338] dark:text-slate-200">Calculation Basis ({ipo.valuation.reportingPeriod}):</strong>{' '}
                {ipo.valuation.calculationBasis}
              </div>
              {ipo.listing.stockSymbol && (
                <Link
                  to={`/stock/${ipo.listing.stockSymbol}`}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  Open Full Live Equity Dossier ({ipo.listing.stockSymbol}) →
                </Link>
              )}
            </div>
            <h2 className="text-base font-semibold text-[#152338] dark:text-white pt-2">
              Listed Peer Comparison
            </h2>
            {ipo.valuation.peers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-slate-800 text-[#64748B]">
                      <th className="py-2">Company</th>
                      <th className="py-2">Symbol</th>
                      <th className="py-2 text-right">P/E</th>
                      <th className="py-2 text-right">P/B</th>
                      <th className="py-2 text-right">ROE %</th>
                      <th className="py-2 text-right">Market Cap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 font-data">
                    {ipo.valuation.peers.map((peer) => (
                      <tr key={peer.symbol || peer.name}>
                        <td className="py-2.5 font-sans font-medium">
                          <div className="flex items-center gap-2 min-w-0">
                            <CompanyLogo
                              size="xs"
                              companyName={peer.name}
                              symbol={peer.symbol}
                            />
                            <span className="truncate">{peer.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5">
                          {peer.symbol ? (
                            <Link to={`/stock/${peer.symbol}`} className="text-[#2563EB] hover:underline">
                              {formatStockTickerLabel(peer.symbol)}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 text-right">{peer.pe ? `${peer.pe}x` : 'N/A'}</td>
                        <td className="py-2.5 text-right">{peer.pb ? `${peer.pb}x` : 'N/A'}</td>
                        <td className="py-2.5 text-right">{peer.roePct ? `${peer.roePct}%` : 'N/A'}</td>
                        <td className="py-2.5 text-right">{formatCrores(peer.marketCapCr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#64748B]">No direct listed peers reported in the offer document summary.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 text-sm text-[#64748B] dark:text-slate-300">
            <div>
              <h3 className="text-sm font-semibold text-[#152338] dark:text-white">Business Overview</h3>
              <p className="mt-1 leading-relaxed whitespace-pre-line">{ipo.profile.overview}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#152338] dark:text-white">Offer Proceeds &amp; Operations</h3>
              <p className="mt-1 leading-relaxed whitespace-pre-line">{ipo.profile.productsAndServices}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#152338] dark:text-white">Issue Structure</h3>
              <p className="mt-1 leading-relaxed">{ipo.profile.businessModel}</p>
            </div>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 text-sm text-[#64748B] dark:text-slate-300">
            <div>
              <h3 className="text-sm font-semibold text-[#152338] dark:text-white">Industry Context &amp; Position</h3>
              <p className="mt-1 leading-relaxed">{ipo.profile.industryOverview}</p>
              <p className="mt-2 leading-relaxed">{ipo.profile.competitivePosition}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#152338] dark:text-white">Key Strengths (RHP Highlights)</h3>
              {ipo.profile.strengths.length > 0 ? (
                <ul className="mt-1.5 list-disc pl-5 space-y-1.5">
                  {ipo.profile.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs">Detailed strengths are listed in the filed RHP / DRHP.</p>
              )}
            </div>
            {ipo.profile.growthOpportunities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#152338] dark:text-white">Objects / Growth Plans</h3>
                <ul className="mt-1.5 list-disc pl-5 space-y-1">
                  {ipo.profile.growthOpportunities.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'risks' && (
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 space-y-3">
          <h2 className="text-base font-semibold text-[#152338] dark:text-white">
            Offer Document Risk Factors
          </h2>
          {ipo.profile.risks.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#64748B] dark:text-slate-300">
              {ipo.profile.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#64748B]">
              Refer to the Risk Factors section in the official DRHP/RHP filing for company-specific risk disclosures.
            </p>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6">
          <h2 className="text-base font-semibold text-[#152338] dark:text-white mb-4">
            Official Regulatory &amp; Registrar Documents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { label: 'Draft Red Herring Prospectus (DRHP)', url: ipo.documents.drhpUrl },
              { label: 'Red Herring Prospectus (RHP)', url: ipo.documents.rhpUrl },
              { label: 'Final Prospectus', url: ipo.documents.prospectusUrl },
              { label: 'Anchor Investor Allocation', url: ipo.documents.anchorUrl },
              { label: `Basis of Allotment (${ipo.registrar})`, url: ipo.documents.allotmentUrl || ipo.registrarUrl },
              { label: 'Exchange Listing Notices', url: ipo.documents.exchangeNoticeUrl },
            ].map((doc) => (
              <div
                key={doc.label}
                className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 p-3.5 flex items-center justify-between gap-2"
              >
                <span className="font-medium text-[#152338] dark:text-slate-200">{doc.label}</span>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#2563EB] font-semibold hover:underline shrink-0"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[#94A3B8]">Unavailable</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
