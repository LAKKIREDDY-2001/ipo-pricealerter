import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
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

export function IPOCard({ ipo }: { ipo: IPOOffering }) {
  const { estimatedListingPrice, estimatedGainPct } = calculateGMPEstimate(
    ipo.priceBandHigh,
    ipo.gmp.latestGmp
  );
  const hasGmp = ipo.gmp.availability === 'Available' && ipo.gmp.latestGmp !== null;
  const gmpPositive = (ipo.gmp.latestGmp ?? 0) >= 0;

  return (
    <article className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 flex flex-col justify-between hover:border-[#2563EB]/60 dark:hover:border-blue-500/50 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo
              size="md"
              companyName={ipo.companyName}
              symbol={ipo.listing.stockSymbol}
              logoUrl={ipo.logoUrl}
              logoColor={ipo.logoColor}
            />
            <div className="min-w-0">
              <div className="text-xs text-[#64748B] dark:text-slate-400 truncate">
                {ipo.category} · {ipo.exchanges.join(' / ')} · {ipo.sector}
              </div>
              <Link
                to={`/ipo/${ipo.slug}`}
                className="block text-sm font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] truncate mt-0.5"
              >
                {ipo.companyName}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <IPOStatusBadge status={ipo.status} />
            <WatchlistButton itemType="ipo" itemKey={ipo.slug} label={ipo.companyName} compact />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 text-xs">
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Price Band</div>
            <div className="font-data font-semibold text-[#152338] dark:text-slate-100 mt-0.5">
              {ipo.priceBandHigh
                ? ipo.priceBandLow && ipo.priceBandLow !== ipo.priceBandHigh
                  ? `₹${ipo.priceBandLow} – ₹${ipo.priceBandHigh}`
                  : `₹${ipo.priceBandHigh}`
                : 'TBA'}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Issue Size</div>
            <div className="font-data font-semibold text-[#152338] dark:text-slate-100 mt-0.5">
              {formatCrores(ipo.issueSizeCr)}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Lot Size / Min Inv.</div>
            <div className="font-data font-medium text-[#152338] dark:text-slate-200 mt-0.5">
              {ipo.minBidQuantity && ipo.lotSize && ipo.minBidQuantity > ipo.lotSize
                ? `${ipo.minBidQuantity} sh (${Math.round(ipo.minBidQuantity / ipo.lotSize)} lots)`
                : ipo.lotSize
                  ? `${ipo.lotSize} sh`
                  : 'TBA'}{' '}
              · {ipo.minInvestment ? formatINR(ipo.minInvestment, 0) : 'TBA'}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Subscription</div>
            <div className="font-data font-semibold text-[#152338] dark:text-slate-100 mt-0.5">
              {ipo.subscription.total !== null
                ? `${ipo.subscription.total.toFixed(2)}x${ipo.subscription.isFinal ? ' (Final)' : ''}`
                : ipo.status === 'Upcoming'
                  ? 'Not Open'
                  : 'Unavailable'}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Offer Dates</div>
            <div className="font-data text-[#152338] dark:text-slate-200 mt-0.5">
              {formatDateIN(ipo.dates.openDate)} – {formatDateIN(ipo.dates.closeDate)}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] dark:text-slate-400">Listing Date</div>
            <div className="font-data text-[#152338] dark:text-slate-200 mt-0.5">
              {formatDateIN(ipo.dates.listingDate)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="text-xs">
          <span className="text-[#64748B] dark:text-slate-400">Indicative GMP: </span>
          {hasGmp ? (
            <span
              className={`font-data font-semibold ${
                gmpPositive
                  ? 'text-[#16A34A] dark:text-emerald-400'
                  : 'text-[#DC2626] dark:text-red-400'
              }`}
            >
              {gmpPositive ? '+' : ''}₹{ipo.gmp.latestGmp}{' '}
              {estimatedGainPct !== null && `(${formatPercent(estimatedGainPct)})`}
            </span>
          ) : (
            <span className="font-data text-[#94A3B8]">Unavailable</span>
          )}
          {estimatedListingPrice !== null && (
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-data">
              Est. Listing: {formatINR(estimatedListingPrice, 0)} (Hypothetical)
            </div>
          )}
        </div>

        <Link
          to={`/ipo/${ipo.slug}`}
          className="inline-flex items-center gap-1 rounded-lg bg-[#F6F8FB] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-[#14263F] dark:text-slate-100 hover:bg-[#14263F] hover:text-white dark:hover:bg-[#2563EB] transition-colors shrink-0 whitespace-nowrap"
        >
          <span>Research</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
