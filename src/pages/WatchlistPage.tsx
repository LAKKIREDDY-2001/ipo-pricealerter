import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellPlus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { IPOOffering, StockInstrument } from '../types/financial';
import { formatINR, formatPercent, formatStockTickerLabel } from '../utils/calculations';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs, EmptyState, LoadingSkeleton } from '../components/common/StateViews';
import { IPOStatusBadge } from '../components/common/DataQualityBadge';

export function WatchlistPage() {
  const { user, loading: authLoading, watchlist, toggleWatchlist } = useAuth();
  const navigate = useNavigate();
  const [ipos, setIpos] = useState<IPOOffering[]>([]);
  const [stocks, setStocks] = useState<StockInstrument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getIpos(), api.getStocks()])
      .then(([iRes, sRes]) => {
        setIpos(iRes.ipos);
        setStocks(sRes.stocks);
      })
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-8">
        <LoadingSkeleton rows={5} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-8 space-y-4">
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Watchlist' }]} />
        <EmptyState
          title="Login required to access your Watchlist"
          description="Sign in or create an account to save IPO offerings and NSE/BSE listed equities."
          actionLabel="Sign In"
          onAction={() => navigate('/login')}
        />
      </main>
    );
  }

  const savedIpos = watchlist.filter((w) => w.itemType === 'ipo');
  const savedStocks = watchlist.filter((w) => w.itemType === 'stock');

  return (
    <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-8">
      <SEOHead
        title="My Watchlist – Saved IPOs & NSE/BSE Stocks"
        description="Monitor your saved Mainboard/SME IPOs and NSE/BSE listed equities in one place."
        noIndex
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Watchlist' }]} />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
            My Watchlist
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Tracking {savedIpos.length} saved IPOs and {savedStocks.length} listed equities.
          </p>
        </div>
        <Link
          to="/alerts"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white hover:opacity-90 self-start sm:self-auto"
        >
          <BellPlus className="w-3.5 h-3.5" /> Configure Price Alerts
        </Link>
      </div>

      {/* Saved IPOs */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[#14263F] dark:text-white">Saved IPOs</h2>
        {savedIpos.length === 0 ? (
          <EmptyState
            title="No IPOs saved yet"
            description="Bookmark any Mainboard or SME IPO from the IPO Explorer to track its dates and subscription here."
            actionLabel="Explore IPOs"
            onAction={() => navigate('/ipo')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {savedIpos.map((entry) => {
              const ipo = ipos.find((i) => i.slug === entry.itemKey);
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <CompanyLogo
                      size="sm"
                      companyName={ipo?.companyName || entry.label}
                      symbol={ipo?.listing.stockSymbol}
                      logoUrl={ipo?.logoUrl}
                      logoColor={ipo?.logoColor}
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/ipo/${entry.itemKey}`}
                        className="text-sm font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] truncate block"
                      >
                        {ipo?.companyName || entry.label}
                      </Link>
                      {ipo && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                          <IPOStatusBadge status={ipo.status} />
                          <span className="font-data">
                            GMP:{' '}
                            {ipo.gmp.latestGmp !== null ? `₹${ipo.gmp.latestGmp}` : 'Unavailable'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist('ipo', entry.itemKey, entry.label)}
                    aria-label="Remove from watchlist"
                    className="p-2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-md text-[#94A3B8] hover:text-[#DC2626] cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Saved Stocks */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[#14263F] dark:text-white">Saved Stocks</h2>
        {savedStocks.length === 0 ? (
          <EmptyState
            title="No equities saved yet"
            description="Bookmark NSE or BSE listed stocks to monitor prices and set alerts."
            actionLabel="Browse Live Stocks"
            onAction={() => navigate('/live-prices')}
          />
        ) : (
          <>
            {/* Mobile Saved Stocks Cards */}
            <div className="md:hidden space-y-2.5">
              {savedStocks.map((entry) => {
                const stk = stocks.find(
                  (s) => s.symbol.toUpperCase() === entry.itemKey.toUpperCase()
                );
                const pct =
                  stk && stk.currentPrice !== null && stk.previousClose
                    ? ((stk.currentPrice - stk.previousClose) / stk.previousClose) * 100
                    : null;
                return (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CompanyLogo
                          size="sm"
                          companyName={stk?.companyName || entry.label}
                          symbol={stk?.symbol || entry.itemKey}
                          bseCode={stk?.bseCode}
                          logoUrl={stk?.logoUrl}
                          searchId={stk?.searchId}
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/stock/${entry.itemKey}`}
                            className="text-sm font-bold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate"
                          >
                            {stk?.companyName || entry.label}
                          </Link>
                          <div className="text-[11px] font-data text-[#64748B] truncate">
                            {formatStockTickerLabel(stk?.symbol || entry.itemKey, stk?.bseCode)} · {stk?.exchange || 'NSE/BSE'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-data shrink-0">
                        <div className="text-sm font-bold text-[#152338] dark:text-white">
                          {formatINR(stk?.currentPrice)}
                        </div>
                        <div
                          className={`text-xs font-semibold ${
                            (pct ?? 0) >= 0 ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#DC2626] dark:text-red-400'
                          }`}
                        >
                          {formatPercent(pct)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-xs">
                      <Link
                        to={`/stock/${entry.itemKey}`}
                        className="font-semibold text-[#2563EB] hover:underline"
                      >
                        Open Quote &amp; Set Alert →
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleWatchlist('stock', entry.itemKey, entry.label)}
                        aria-label="Remove stock"
                        className="inline-flex items-center gap-1 px-2 py-1 text-[#94A3B8] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Saved Stocks Table */}
            <div className="hidden md:block rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[#64748B]">
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-3">Exchange</th>
                      <th className="py-3 px-3 text-right">Current Price</th>
                      <th className="py-3 px-3 text-right">Change %</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                    {savedStocks.map((entry) => {
                      const stk = stocks.find(
                        (s) => s.symbol.toUpperCase() === entry.itemKey.toUpperCase()
                      );
                      const pct =
                        stk && stk.currentPrice !== null && stk.previousClose
                          ? ((stk.currentPrice - stk.previousClose) / stk.previousClose) * 100
                          : null;
                      return (
                        <tr key={entry.id}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CompanyLogo
                                size="sm"
                                companyName={stk?.companyName || entry.label}
                                symbol={stk?.symbol || entry.itemKey}
                                bseCode={stk?.bseCode}
                                logoUrl={stk?.logoUrl}
                                searchId={stk?.searchId}
                              />
                              <div className="min-w-0">
                                <Link
                                  to={`/stock/${entry.itemKey}`}
                                  className="font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate"
                                >
                                  {stk?.companyName || entry.label}
                                </Link>
                                <div className="text-[11px] font-data text-[#64748B]">
                                  {formatStockTickerLabel(stk?.symbol || entry.itemKey, stk?.bseCode)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">{stk?.exchange || 'NSE/BSE'}</td>
                          <td className="py-3 px-3 text-right font-data font-semibold">
                            {formatINR(stk?.currentPrice)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-data font-semibold ${
                              (pct ?? 0) >= 0 ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#DC2626] dark:text-red-400'
                            }`}
                          >
                            {formatPercent(pct)}
                          </td>
                          <td className="py-3 px-4 text-right space-x-3">
                            <Link
                              to={`/stock/${entry.itemKey}`}
                              className="text-xs font-semibold text-[#2563EB] hover:underline"
                            >
                              Quote →
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleWatchlist('stock', entry.itemKey, entry.label)}
                              aria-label="Remove stock"
                              className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] cursor-pointer align-middle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
