import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, X, ExternalLink } from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/StateViews';

interface MutualFundScheme {
  schemeCode: number;
  schemeName: string;
  isinGrowth?: string | null;
  isinDivReinvestment?: string | null;
}

interface MutualFundDetail {
  meta?: {
    scheme_code?: number;
    scheme_name?: string;
    fund_house?: string;
    scheme_type?: string;
    scheme_category?: string;
    isin_growth?: string | null;
    isin_div_reinvestment?: string | null;
  };
  data?: Array<{ date: string; nav: string }>;
  status?: string;
  source?: string;
}

const PAGE_SIZE = 100;

async function requestSchemes(query: string, offset: number) {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (query.trim()) params.set('q', query.trim());
  const response = await fetch(`/api/mutual-funds/schemes?${params.toString()}`, {
    headers: { accept: 'application/json' },
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'Unable to load mutual fund schemes.');
  return payload as { schemes: MutualFundScheme[]; count: number; offset: number; searched: boolean; source: string };
}

async function requestSchemeDetail(schemeCode: number) {
  const response = await fetch(`/api/mutual-funds/schemes/${schemeCode}`, {
    headers: { accept: 'application/json' },
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'Latest NAV is not available.');
  return payload as MutualFundDetail & { ok: boolean; retrievedAt?: string };
}

export function MutualFundsPage() {
  const [schemes, setSchemes] = useState<MutualFundScheme[]>([]);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MutualFundScheme | null>(null);
  const [detail, setDetail] = useState<MutualFundDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await requestSchemes(search, 0);
        if (cancelled) return;
        setSchemes(result.schemes);
        setOffset(result.schemes.length);
        setHasMore(!search.trim() && result.schemes.length === PAGE_SIZE);
      } catch (err) {
        if (!cancelled) {
          setSchemes([]);
          setHasMore(false);
          setError(err instanceof Error ? err.message : 'Unable to load mutual fund schemes.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search.trim() ? 350 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    if (!selected) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    setDetailLoading(true);
    setDetailError(null);
    requestSchemeDetail(selected.schemeCode)
      .then((result) => { if (!cancelled) setDetail(result); })
      .catch((err) => { if (!cancelled) setDetailError(err instanceof Error ? err.message : 'Unable to load NAV.'); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selected]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || search.trim()) return;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await requestSchemes('', offset);
      setSchemes((current) => {
        const seen = new Set(current.map((item) => item.schemeCode));
        return [...current, ...result.schemes.filter((item) => !seen.has(item.schemeCode))];
      });
      setOffset((current) => current + result.schemes.length);
      setHasMore(result.schemes.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load more schemes.');
    } finally {
      setLoadingMore(false);
    }
  };

  const latestNav = detail?.data?.[0];
  const latestNavNumber = latestNav ? Number(latestNav.nav) : NaN;

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <SEOHead
        title="Indian Mutual Fund Directory & Latest NAV | PriceAlerter"
        description="Search Indian mutual fund schemes, view scheme identifiers and retrieve the latest published NAV from the mutual fund data feed."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Mutual Funds', to: '/mutual-funds' }]} />

      <section className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="space-y-2">
            <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Indian Mutual Fund Scheme Registry
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#14263F] dark:text-white">
              Mutual Funds
            </h1>
            <p className="text-sm text-[#64748B] dark:text-slate-300 max-w-2xl">
              Search the wider Indian scheme directory. Select a scheme to retrieve its latest published NAV and scheme details. NAVs update when the source publishes them; they are not intraday market prices.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {loading ? 'Loading directory…' : `${schemes.length.toLocaleString('en-IN')} schemes loaded`}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search fund or AMC name (e.g. HDFC, SBI, Nifty 50)…"
            className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-4 py-3 text-sm text-[#14263F] dark:text-white outline-none focus:border-emerald-500"
          />
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : schemes.length ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {schemes.map((scheme) => (
            <button
              type="button"
              key={scheme.schemeCode}
              onClick={() => setSelected(scheme)}
              className="text-left rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 hover:border-emerald-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Scheme {scheme.schemeCode}</span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">View latest NAV</span>
              </div>
              <h2 className="mt-2 text-sm font-semibold text-[#14263F] dark:text-white leading-snug">{scheme.schemeName}</h2>
              {scheme.isinGrowth && <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">Growth ISIN: {scheme.isinGrowth}</p>}
            </button>
          ))}
        </section>
      ) : !error ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-8 text-center text-sm text-slate-500">
          No schemes found. Try another fund or AMC name.
        </div>
      ) : null}

      {hasMore && !search.trim() && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111C2E] px-5 py-2.5 text-sm font-semibold text-[#14263F] dark:text-white disabled:opacity-60"
          >
            {loadingMore && <RefreshCw className="w-4 h-4 animate-spin" />}
            {loadingMore ? 'Loading schemes…' : 'Load more schemes'}
          </button>
        </div>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Scheme directory and NAV information are supplied by MFapi.in. Historical, merged or discontinued schemes may also appear in the full registry. Verify the latest factsheet and scheme documents before investing.
      </p>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Mutual fund scheme details"
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-700 p-5 shadow-2xl space-y-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Scheme {selected.schemeCode}</p>
                <h2 className="mt-1 text-base font-bold text-[#14263F] dark:text-white">{detail?.meta?.scheme_name || selected.schemeName}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close scheme details" className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-sm text-slate-500"><RefreshCw className="w-4 h-4 animate-spin" /> Loading latest NAV…</div>
            ) : detailError ? (
              <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">{detailError}</p>
            ) : detail?.meta ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Latest published NAV</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-[#14263F] dark:text-white">
                    {Number.isFinite(latestNavNumber) ? `₹${latestNavNumber.toFixed(4)}` : 'Unavailable'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">NAV date: {latestNav?.date || 'Not provided'}</p>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div><dt className="text-slate-500">Fund house</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{detail.meta.fund_house || 'Not provided'}</dd></div>
                  <div><dt className="text-slate-500">Category</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{detail.meta.scheme_category || 'Not provided'}</dd></div>
                  <div><dt className="text-slate-500">Scheme type</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{detail.meta.scheme_type || 'Not provided'}</dd></div>
                  <div><dt className="text-slate-500">Growth ISIN</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{detail.meta.isin_growth || 'Not provided'}</dd></div>
                </dl>
                <a href="https://www.amfiindia.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                  Verify with AMFI <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Scheme details are unavailable.</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
