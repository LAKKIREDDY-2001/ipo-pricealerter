import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import type { MarketIndexInstrument, MarketInsight } from '../types/financial';
import { formatNumberIN, formatPercent, formatTimestampIN } from '../utils/calculations';
import { SEOHead } from '../components/common/SEOHead';
import { AdSlot } from '../components/ads/AdSlot';
import { Breadcrumbs, ErrorRetryState, LoadingSkeleton } from '../components/common/StateViews';

export function MarketInsightsPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [activeInsight, setActiveInsight] = useState<MarketInsight | null>(null);
  const [indices, setIndices] = useState<MarketIndexInstrument[]>([]);
  const [catFilter, setCatFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [insRes, idxRes] = await Promise.all([api.getInsights(), api.getIndices()]);
      setInsights(insRes.insights);
      setIndices(idxRes.indices);
      if (slug) {
        const found = insRes.insights.find((m) => m.slug === slug) ?? null;
        setActiveInsight(found);
      } else {
        setActiveInsight(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load market intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <LoadingSkeleton rows={6} />
      </main>
    );
  }

  if (slug && activeInsight) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <SEOHead title={activeInsight.title} description={activeInsight.summary} />
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: 'Market Insights', to: '/market-insights' },
            { label: activeInsight.category },
          ]}
        />

        <article className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 sm:p-8 space-y-6">
          <div>
            <div className="text-xs text-[#64748B] dark:text-slate-400">
              {activeInsight.category} · {formatTimestampIN(activeInsight.publishedAt)} · Source:{' '}
              {activeInsight.source}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white mt-2">
              {activeInsight.title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#64748B] dark:text-slate-300 leading-relaxed">
              {activeInsight.summary}
            </p>
          </div>

          <div className="rounded-lg bg-[#F6F8FB] dark:bg-slate-900/70 border border-[#E2E8F0] dark:border-slate-800 p-5 space-y-2.5">
            <h2 className="text-sm font-semibold text-[#14263F] dark:text-white">
              Verified Market Facts
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#152338] dark:text-slate-200">
              {activeInsight.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-[#14263F] dark:text-white">
              Editorial Context &amp; Analysis
            </h2>
            <p className="text-sm text-[#64748B] dark:text-slate-300 leading-relaxed">
              {activeInsight.analysis}
            </p>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <a
              href={activeInsight.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:underline"
            >
              Reference Source ({activeInsight.source}) <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/market-insights"
              className="inline-flex items-center gap-1 font-semibold text-[#152338] dark:text-slate-200 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Market Insights
            </Link>
          </div>
        </article>

        <AdSlot slotId="market-insight-bottom" format="horizontal" />
      </main>
    );
  }

  const visibleInsights =
    catFilter === 'All'
      ? insights
      : insights.filter((m) => m.category === catFilter);

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <SEOHead
        title="Indian Market Insights – NIFTY, SENSEX, Commodities & IPO Briefings"
        description="Track Indian equity benchmarks, bullion, crude oil, USD/INR, and primary market developments with clearly separated facts and editorial analysis."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Market Insights' }]} />

      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
          Market Intelligence Centre
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Sourced macroeconomic, benchmark, commodity, and primary market briefings separating verified facts from editorial commentary.
        </p>
      </div>

      {error && <ErrorRetryState message={error} onRetry={loadData} />}

      {/* Macro & Benchmarks Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {indices.map((idx) => {
          const up = (idx.change ?? 0) >= 0;
          return (
            <div
              key={idx.id}
              className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-3"
            >
              <div className="text-[11px] font-semibold text-[#64748B] truncate">{idx.symbol}</div>
              <div className="font-data text-sm font-bold text-[#152338] dark:text-white mt-0.5">
                {formatNumberIN(idx.value)}
              </div>
              <div
                className={`font-data text-[11px] font-medium ${
                  up ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                {formatPercent(idx.changePercent)}
              </div>
            </div>
          );
        })}
      </section>

      <div className="flex flex-wrap items-center gap-1.5">
        {['All', 'Market Overview', 'IPO Update', 'Commodities & FX', 'Sector & Macro'].map(
          (cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                catFilter === cat
                  ? 'bg-[#14263F] text-white border-[#14263F] dark:bg-[#2563EB] dark:border-[#2563EB]'
                  : 'bg-white dark:bg-[#111C2E] text-[#64748B] border-[#E2E8F0] dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleInsights.map((ins) => (
          <Link
            key={ins.id}
            to={`/market-insights/${ins.slug}`}
            className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 hover:border-[#2563EB]/60 transition-colors flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="text-xs text-[#64748B] dark:text-slate-400">
                {ins.category} · {formatTimestampIN(ins.publishedAt)}
              </div>
              <h2 className="mt-1.5 text-base font-bold text-[#152338] dark:text-white leading-snug">
                {ins.title}
              </h2>
              <p className="mt-2 text-xs text-[#64748B] dark:text-slate-300 leading-relaxed">
                {ins.summary}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
              <span className="text-[#64748B]">Source: {ins.source}</span>
              <span className="font-semibold text-[#2563EB]">Read Briefing →</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
