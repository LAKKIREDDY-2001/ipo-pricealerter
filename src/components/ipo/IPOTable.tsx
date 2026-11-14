import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { IPOOffering } from '../../types/financial';
import {
  calculateGMPEstimate,
  formatCrores,
  formatDateIN,
  formatINR,
  formatPercent,
} from '../../utils/calculations';
import { CompanyLogo } from '../common/CompanyLogo';
import { IPOStatusBadge } from '../common/DataQualityBadge';
import { WatchlistButton } from '../common/WatchlistButton';

type SortKey = 'companyName' | 'issueSizeCr' | 'priceBandHigh' | 'subscription' | 'gmp';

interface IPOTableProps {
  ipos: IPOOffering[];
  pageSize?: number;
}

export function IPOTable({ ipos, pageSize = 8 }: IPOTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('issueSizeCr');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const copy = [...ipos];
    copy.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortKey) {
        case 'companyName':
          va = a.companyName;
          vb = b.companyName;
          return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'issueSizeCr':
          va = a.issueSizeCr ?? -1;
          vb = b.issueSizeCr ?? -1;
          break;
        case 'priceBandHigh':
          va = a.priceBandHigh ?? -1;
          vb = b.priceBandHigh ?? -1;
          break;
        case 'subscription':
          va = a.subscription.total ?? -1;
          vb = b.subscription.total ?? -1;
          break;
        case 'gmp':
          va = a.gmp.latestGmp ?? -9999;
          vb = b.gmp.latestGmp ?? -9999;
          break;
      }
      return sortAsc ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });
    return copy;
  }, [ipos, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((p) => !p);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(1);
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
      {/* Mobile Sort Bar */}
      <div className="md:hidden flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-xs">
        <span className="text-[#64748B] font-medium">Sort IPOs</span>
        <div className="flex items-center gap-1.5">
          <select
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as SortKey);
              setSortAsc(e.target.value === 'companyName');
              setPage(1);
            }}
            aria-label="Sort IPOs on mobile"
            className="rounded-md border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-2.5 py-1 text-xs text-[#152338] dark:text-slate-100"
          >
            <option value="issueSizeCr">Issue Size</option>
            <option value="gmp">GMP</option>
            <option value="subscription">Subscription</option>
            <option value="priceBandHigh">Price Band</option>
            <option value="companyName">Company Name</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSortAsc((p) => !p);
              setPage(1);
            }}
            aria-label="Toggle sort order"
            className="rounded-md border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-2 py-1 text-xs font-data text-[#152338] dark:text-slate-100 cursor-pointer"
          >
            {sortAsc ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Mobile Cards (< md) */}
      <div className="md:hidden divide-y divide-[#E2E8F0] dark:divide-slate-800">
        {pageItems.map((ipo) => {
          const { estimatedListingPrice, estimatedGainPct } = calculateGMPEstimate(
            ipo.priceBandHigh,
            ipo.gmp.latestGmp
          );
          const gmpPos = (ipo.gmp.latestGmp ?? 0) >= 0;
          const lotText =
            ipo.minBidQuantity && ipo.lotSize && ipo.minBidQuantity > ipo.lotSize
              ? `${ipo.minBidQuantity} (${Math.round(ipo.minBidQuantity / ipo.lotSize)}L)`
              : (ipo.lotSize ?? 'TBA');

          return (
            <div key={ipo.id} className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2.5">
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
                    <div className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                      {ipo.category} · {ipo.exchanges.join('/')} · {ipo.sector}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <IPOStatusBadge status={ipo.status} />
                  <WatchlistButton
                    itemType="ipo"
                    itemKey={ipo.slug}
                    label={ipo.companyName}
                    compact
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <div className="text-[10px] text-[#64748B]">Price Band</div>
                  <div className="font-data font-semibold text-[#152338] dark:text-slate-100">
                    {ipo.priceBandHigh
                      ? ipo.priceBandLow && ipo.priceBandLow !== ipo.priceBandHigh
                        ? `₹${ipo.priceBandLow}–₹${ipo.priceBandHigh}`
                        : `₹${ipo.priceBandHigh}`
                      : 'TBA'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B]">Issue Size</div>
                  <div className="font-data font-semibold text-[#152338] dark:text-slate-100">
                    {formatCrores(ipo.issueSizeCr)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#64748B]">Subscription</div>
                  <div className="font-data font-semibold text-[#152338] dark:text-slate-100">
                    {ipo.subscription.total !== null ? `${ipo.subscription.total.toFixed(2)}x` : '—'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]/70 dark:border-slate-800 text-xs">
                <div className="min-w-0">
                  <div className="font-data text-[11px] text-[#64748B] dark:text-slate-400">
                    Offer: {formatDateIN(ipo.dates.openDate)} – {formatDateIN(ipo.dates.closeDate)} · Lot {lotText}
                  </div>
                  <div className="font-data text-xs mt-0.5">
                    <span className="text-[#64748B]">GMP: </span>
                    {ipo.gmp.availability === 'Available' && ipo.gmp.latestGmp !== null ? (
                      <span
                        className={`font-semibold ${
                          gmpPos ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#DC2626] dark:text-red-400'
                        }`}
                      >
                        {gmpPos ? '+' : ''}₹{ipo.gmp.latestGmp}
                        {estimatedGainPct !== null ? ` (${formatPercent(estimatedGainPct)})` : ''}
                        {estimatedListingPrice !== null ? ` · Est ${formatINR(estimatedListingPrice, 0)}` : ''}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">Unavailable</span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/ipo/${ipo.slug}`}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-[#152338] dark:text-slate-100 hover:bg-[#14263F] hover:text-white dark:hover:bg-[#2563EB] transition-colors shrink-0 whitespace-nowrap"
                >
                  Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop & Tablet Table (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
              <th className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('companyName')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  Company <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3">Type / Status</th>
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('priceBandHigh')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  Price Band <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-right">Lot Size</th>
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('issueSizeCr')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  Issue Size <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3">Offer Dates</th>
              <th className="py-3 px-3">Listing</th>
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('subscription')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  Sub. <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('gmp')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  GMP (Est.) <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-xs">
            {pageItems.map((ipo) => {
              const { estimatedListingPrice, estimatedGainPct } = calculateGMPEstimate(
                ipo.priceBandHigh,
                ipo.gmp.latestGmp
              );
              const gmpPos = (ipo.gmp.latestGmp ?? 0) >= 0;
              return (
                <tr
                  key={ipo.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
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
                          className="font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate max-w-[200px]"
                        >
                          {ipo.companyName}
                        </Link>
                        <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                          {ipo.sector} · {ipo.exchanges.join('/')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <IPOStatusBadge status={ipo.status} />
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                        {ipo.category}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-data whitespace-nowrap text-[#152338] dark:text-slate-100">
                    {ipo.priceBandHigh
                      ? ipo.priceBandLow && ipo.priceBandLow !== ipo.priceBandHigh
                        ? `₹${ipo.priceBandLow}–₹${ipo.priceBandHigh}`
                        : `₹${ipo.priceBandHigh}`
                      : 'TBA'}
                  </td>
                  <td className="py-3 px-3 text-right font-data whitespace-nowrap text-[#64748B] dark:text-slate-300">
                    {ipo.minBidQuantity && ipo.lotSize && ipo.minBidQuantity > ipo.lotSize
                      ? `${ipo.minBidQuantity} (${Math.round(ipo.minBidQuantity / ipo.lotSize)}L)`
                      : (ipo.lotSize ?? 'TBA')}
                  </td>
                  <td className="py-3 px-3 text-right font-data whitespace-nowrap font-medium text-[#152338] dark:text-slate-100">
                    {formatCrores(ipo.issueSizeCr)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-data text-[#64748B] dark:text-slate-300">
                    {formatDateIN(ipo.dates.openDate)} – {formatDateIN(ipo.dates.closeDate)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-data text-[#64748B] dark:text-slate-300">
                    {formatDateIN(ipo.dates.listingDate)}
                  </td>
                  <td className="py-3 px-3 text-right font-data whitespace-nowrap font-semibold text-[#152338] dark:text-slate-100">
                    {ipo.subscription.total !== null
                      ? `${ipo.subscription.total.toFixed(2)}x`
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-data whitespace-nowrap">
                    {ipo.gmp.availability === 'Available' && ipo.gmp.latestGmp !== null ? (
                      <div>
                        <span
                          className={`font-semibold ${
                            gmpPos
                              ? 'text-[#16A34A] dark:text-emerald-400'
                              : 'text-[#DC2626] dark:text-red-400'
                          }`}
                        >
                          {gmpPos ? '+' : ''}₹{ipo.gmp.latestGmp}{' '}
                          {estimatedGainPct !== null && `(${formatPercent(estimatedGainPct)})`}
                        </span>
                        {estimatedListingPrice !== null && (
                          <div className="text-[10px] text-[#94A3B8]">
                            Est: {formatINR(estimatedListingPrice, 0)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#94A3B8]">Unavailable</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <WatchlistButton
                        itemType="ipo"
                        itemKey={ipo.slug}
                        label={ipo.companyName}
                        compact
                      />
                      <Link
                        to={`/ipo/${ipo.slug}`}
                        className="rounded-md border border-[#E2E8F0] dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-[#14263F] hover:text-white dark:hover:bg-[#2563EB] transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-3.5 sm:px-4 py-3 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-[#64748B] dark:text-slate-400">
          <span>
            Showing {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, sorted.length)} of {sorted.length} IPOs
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center p-1.5 rounded border border-[#E2E8F0] dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-data px-2">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center p-1.5 rounded border border-[#E2E8F0] dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
