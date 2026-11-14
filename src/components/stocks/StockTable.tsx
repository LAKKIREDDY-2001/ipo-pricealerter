import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StockInstrument } from '../../types/financial';
import {
  formatCompactNumberIN,
  formatCrores,
  formatINR,
  formatStockTickerLabel,
  formatTimestampIN,
} from '../../utils/calculations';
import { CompanyLogo } from '../common/CompanyLogo';
import { DataQualityBadge } from '../common/DataQualityBadge';
import { Sparkline } from '../common/Sparkline';
import { WatchlistButton } from '../common/WatchlistButton';

type StockSortKey =
  | 'symbol'
  | 'currentPrice'
  | 'changePct'
  | 'volume'
  | 'marketCapCr';

interface StockTableProps {
  stocks: StockInstrument[];
  pageSize?: number;
  compact?: boolean;
  serverPagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (nextPage: number) => void;
  };
  onSortChange?: (sortKey: StockSortKey, sortAsc: boolean) => void;
}

export function StockTable({
  stocks,
  pageSize = 12,
  compact = false,
  serverPagination,
  onSortChange,
}: StockTableProps) {
  const [sortKey, setSortKey] = useState<StockSortKey>('marketCapCr');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const getChangePct = (s: StockInstrument) => {
    if (s.currentPrice === null || s.previousClose === null || s.previousClose <= 0) return -999;
    return ((s.currentPrice - s.previousClose) / s.previousClose) * 100;
  };

  const sorted = useMemo(() => {
    if (serverPagination && onSortChange) {
      return stocks;
    }
    const copy = [...stocks];
    copy.sort((a, b) => {
      if (sortKey === 'symbol') {
        return sortAsc
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      }
      const va =
        sortKey === 'currentPrice'
          ? a.currentPrice ?? -1
          : sortKey === 'changePct'
            ? getChangePct(a)
            : sortKey === 'volume'
              ? a.volume ?? -1
              : a.marketCapCr ?? -1;
      const vb =
        sortKey === 'currentPrice'
          ? b.currentPrice ?? -1
          : sortKey === 'changePct'
            ? getChangePct(b)
            : sortKey === 'volume'
              ? b.volume ?? -1
              : b.marketCapCr ?? -1;
      return sortAsc ? va - vb : vb - va;
    });
    return copy;
  }, [stocks, sortKey, sortAsc, serverPagination, onSortChange]);

  const effectivePageSize = serverPagination ? serverPagination.pageSize : pageSize;
  const effectiveTotal = serverPagination ? serverPagination.total : sorted.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / effectivePageSize));
  const safePage = serverPagination
    ? Math.min(serverPagination.page, totalPages)
    : Math.min(page, totalPages);
  const items = serverPagination
    ? sorted
    : sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (k: StockSortKey, forcedAsc?: boolean) => {
    const nextAsc = forcedAsc !== undefined ? forcedAsc : sortKey === k ? !sortAsc : false;
    setSortKey(k);
    setSortAsc(nextAsc);
    if (onSortChange) {
      onSortChange(k, nextAsc);
    }
    if (serverPagination) {
      serverPagination.onPageChange(1);
    } else {
      setPage(1);
    }
  };

  const goToPage = (next: number) => {
    if (serverPagination) {
      serverPagination.onPageChange(next);
    } else {
      setPage(next);
    }
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
      {/* Mobile Sort Controls */}
      <div className="md:hidden flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-xs">
        <span className="text-[#64748B] font-medium">Sort Stocks</span>
        <div className="flex items-center gap-1.5">
          <select
            value={sortKey}
            onChange={(e) => {
              const nextKey = e.target.value as StockSortKey;
              toggleSort(nextKey, nextKey === 'symbol');
            }}
            aria-label="Sort stocks on mobile"
            className="rounded-md border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-2.5 py-1 text-xs text-[#152338] dark:text-slate-100"
          >
            <option value="marketCapCr">Market Cap</option>
            <option value="changePct">Day Change %</option>
            <option value="currentPrice">LTP Price</option>
            <option value="volume">Volume</option>
            <option value="symbol">Symbol (A–Z)</option>
          </select>
          <button
            type="button"
            onClick={() => toggleSort(sortKey, !sortAsc)}
            aria-label="Toggle stock sort direction"
            className="rounded-md border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-2 py-1 text-xs font-data text-[#152338] dark:text-slate-100 cursor-pointer"
          >
            {sortAsc ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Mobile Cards (< md) */}
      <div className="md:hidden divide-y divide-[#E2E8F0] dark:divide-slate-800">
        {items.map((s) => {
          const hasPrice = s.currentPrice !== null && s.previousClose !== null;
          const absChg = hasPrice ? s.currentPrice! - s.previousClose! : null;
          const pctChg =
            hasPrice && s.previousClose! > 0
              ? (absChg! / s.previousClose!) * 100
              : null;
          const isPos = (absChg ?? 0) >= 0;

          return (
            <div key={s.id} className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CompanyLogo
                    size="sm"
                    companyName={s.companyName}
                    symbol={s.symbol}
                    bseCode={s.bseCode}
                    logoUrl={s.logoUrl}
                    searchId={s.searchId}
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/stock/${s.symbol}`}
                      className="text-sm font-bold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate"
                    >
                      {s.companyName}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                      <span className="font-data font-semibold text-[#14263F] dark:text-slate-300">
                        {formatStockTickerLabel(s.symbol, s.bseCode)}
                      </span>
                      <span>·</span>
                      <span>{s.exchange}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-data text-sm font-bold text-[#152338] dark:text-white">
                    {formatINR(s.currentPrice)}
                  </div>
                  {absChg !== null && pctChg !== null ? (
                    <div
                      className={`font-data text-xs font-semibold ${
                        isPos
                          ? 'text-[#16A34A] dark:text-emerald-400'
                          : 'text-[#DC2626] dark:text-red-400'
                      }`}
                    >
                      {isPos ? '+' : ''}
                      {absChg.toFixed(2)} ({isPos ? '+' : ''}
                      {pctChg.toFixed(2)}%)
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#94A3B8]">Unavailable</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E2E8F0]/70 dark:border-slate-800 text-[11px]">
                <div className="flex items-center gap-3 font-data text-[#64748B] dark:text-slate-400 min-w-0">
                  <span>M.Cap {formatCrores(s.marketCapCr)}</span>
                  <span>Vol {formatCompactNumberIN(s.volume)}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Sparkline data={s.sparkline} positive={isPos} />
                  <WatchlistButton
                    itemType="stock"
                    itemKey={s.symbol}
                    label={s.companyName}
                    compact
                  />
                  <Link
                    to={`/stock/${s.symbol}`}
                    className="rounded-md border border-[#E2E8F0] dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-[#152338] dark:text-slate-100 hover:bg-[#14263F] hover:text-white dark:hover:bg-[#2563EB] transition-colors"
                  >
                    Quote
                  </Link>
                </div>
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
                  onClick={() => toggleSort('symbol')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  Company / Symbol <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3">Exchange</th>
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('currentPrice')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  Price <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('changePct')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  Change <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              {!compact && (
                <>
                  <th className="py-3 px-3 text-right">Prev. Close</th>
                  <th className="py-3 px-3 text-right">Open</th>
                  <th className="py-3 px-3 text-right">Day Range</th>
                </>
              )}
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('volume')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  Volume <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('marketCapCr')}
                  className="inline-flex items-center gap-1 hover:text-[#152338] dark:hover:text-white cursor-pointer"
                >
                  M.Cap <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-center">Trend</th>
              <th className="py-3 px-3">Feed Status</th>
              <th className="py-3 px-4 text-right">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-xs">
            {items.map((s) => {
              const hasPrice = s.currentPrice !== null && s.previousClose !== null;
              const absChg = hasPrice ? s.currentPrice! - s.previousClose! : null;
              const pctChg =
                hasPrice && s.previousClose! > 0
                  ? (absChg! / s.previousClose!) * 100
                  : null;
              const isPos = (absChg ?? 0) >= 0;

              return (
                <tr
                  key={s.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <CompanyLogo
                        size="sm"
                        companyName={s.companyName}
                        symbol={s.symbol}
                        bseCode={s.bseCode}
                        logoUrl={s.logoUrl}
                        searchId={s.searchId}
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/stock/${s.symbol}`}
                          className="font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate max-w-[210px]"
                        >
                          {s.companyName}
                        </Link>
                        <div className="text-[11px] font-data text-[#64748B] dark:text-slate-400 truncate max-w-[210px]">
                          {formatStockTickerLabel(s.symbol, s.bseCode)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-[#64748B] dark:text-slate-300">
                    <div>
                      {s.exchange}
                      {s.bseCode && s.bseCode !== 'N/A' && (
                        <span className="ml-1 font-data text-[10px] text-[#94A3B8]">
                          ({s.bseCode})
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">{s.sector}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-data font-semibold whitespace-nowrap text-[#152338] dark:text-slate-100">
                    {formatINR(s.currentPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-data whitespace-nowrap">
                    {absChg !== null && pctChg !== null ? (
                      <span
                        className={`font-medium ${
                          isPos
                            ? 'text-[#16A34A] dark:text-emerald-400'
                            : 'text-[#DC2626] dark:text-red-400'
                        }`}
                      >
                        {isPos ? '+' : ''}
                        {absChg.toFixed(2)} ({isPos ? '+' : ''}
                        {pctChg.toFixed(2)}%)
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">Unavailable</span>
                    )}
                  </td>
                  {!compact && (
                    <>
                      <td className="py-3 px-3 text-right font-data whitespace-nowrap text-[#64748B] dark:text-slate-300">
                        {formatINR(s.previousClose)}
                      </td>
                      <td className="py-3 px-3 text-right font-data whitespace-nowrap text-[#64748B] dark:text-slate-300">
                        {formatINR(s.open)}
                      </td>
                      <td className="py-3 px-3 text-right font-data whitespace-nowrap text-[#64748B] dark:text-slate-300">
                        {s.dayLow !== null && s.dayHigh !== null
                          ? `₹${s.dayLow.toFixed(1)} – ₹${s.dayHigh.toFixed(1)}`
                          : 'Unavailable'}
                      </td>
                    </>
                  )}
                  <td className="py-3 px-3 text-right font-data whitespace-nowrap text-[#64748B] dark:text-slate-300">
                    {formatCompactNumberIN(s.volume)}
                  </td>
                  <td className="py-3 px-3 text-right font-data whitespace-nowrap text-[#152338] dark:text-slate-200">
                    {formatCrores(s.marketCapCr)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex justify-center">
                      <Sparkline data={s.sparkline} positive={isPos} />
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <DataQualityBadge status={s.provenance.qualityStatus} compact />
                    <div className="text-[10px] text-[#94A3B8] font-data mt-0.5">
                      {formatTimestampIN(s.provenance.retrievedAt)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <WatchlistButton
                      itemType="stock"
                      itemKey={s.symbol}
                      label={s.companyName}
                      compact
                    />
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
            Showing {(safePage - 1) * effectivePageSize + 1}–
            {Math.min(safePage * effectivePageSize, effectiveTotal)} of {effectiveTotal.toLocaleString('en-IN')} securities
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => goToPage(Math.max(1, safePage - 1))}
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
              onClick={() => goToPage(Math.min(totalPages, safePage + 1))}
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
