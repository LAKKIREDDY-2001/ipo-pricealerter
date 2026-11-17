import React, { useEffect, useState } from 'react';
import { DollarSign, Flame, Globe2, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import type { GlobalMacroSnapshot } from '../../types/financial';
import { formatNumberIN } from '../../utils/calculations';

export function MacroCommoditiesBar() {
  const [macro, setMacro] = useState<GlobalMacroSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const data = await api.getMacro();
      if (data) {
        setMacro(data);
      }
    } catch {
      // Fallback kept
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const usdInr = macro?.usdInr?.rate;
  const gold = macro?.gold?.price;
  const silver = macro?.silver?.price;
  const crude = macro?.brentCrude?.price;
  const us10y = macro?.us10yYield?.rate;
  const formatValue = (value: unknown, digits = 2) =>
    typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : 'Unavailable';
  const sourceLabel = macro?.liveFeedReachable
    ? 'Yahoo Finance · delayed / latest'
    : 'Snapshot / last available';

  return (
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#F1F5F9] dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-[#14263F] dark:text-white">
                Global Macro &amp; Commodities Feed
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <span className={`w-1.5 h-1.5 rounded-full ${macro?.liveFeedReachable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {sourceLabel}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
              Latest available forex, bullion, Brent energy and sovereign-yield indicators. Third-party prices may be delayed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] text-[#94A3B8] font-data">
            {macro?.retrievedAt ? `Updated ${new Date(macro.retrievedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST` : 'Update time unavailable'}
          </span>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh global macro indicators"
            className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-[#111C2E] px-2.5 py-1 text-[11px] font-semibold text-[#152338] dark:text-slate-200 hover:bg-[#EEF2F6] dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3.5">
        {/* USD / INR */}
        <div className="rounded-xl border border-[#E2E8F0]/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 hover:border-blue-400 dark:hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
            <span>USD / INR</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-1.5 font-data text-base sm:text-lg font-bold text-[#14263F] dark:text-white">
            {loading ? '—' : usdInr == null ? 'Unavailable' : `₹${formatValue(usdInr)}`}
          </div>
          <div className="mt-0.5 text-[10px] text-[#64748B] dark:text-slate-400 font-data">
            FX spot reference · USD / INR
          </div>
        </div>

        {/* Gold Spot */}
        <div className="rounded-xl border border-[#E2E8F0]/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 hover:border-amber-400 dark:hover:border-amber-500/50 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
            <span>Gold Spot (XAU)</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-1.5 font-data text-base sm:text-lg font-bold text-[#14263F] dark:text-white">
            {loading ? '—' : gold == null ? 'Unavailable' : `${formatNumberIN(gold)}/oz`}
          </div>
          <div className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
            Bullion Spot Benchmark
          </div>
        </div>

        {/* Silver Spot */}
        <div className="rounded-xl border border-[#E2E8F0]/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 hover:border-slate-400 dark:hover:border-slate-500/50 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
            <span>Silver Spot (XAG)</span>
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 font-data text-base sm:text-lg font-bold text-[#14263F] dark:text-white">
            {loading ? '—' : silver == null ? 'Unavailable' : `${formatValue(silver)}/oz`}
          </div>
          <div className="mt-0.5 text-[10px] text-[#64748B] dark:text-slate-400 font-semibold">
            Industrial &amp; Jewellery
          </div>
        </div>

        {/* Brent Crude */}
        <div className="rounded-xl border border-[#E2E8F0]/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 hover:border-rose-400 dark:hover:border-rose-500/50 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
            <span>Brent Crude Oil</span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="mt-1.5 font-data text-base sm:text-lg font-bold text-[#14263F] dark:text-white">
            {loading ? '—' : crude == null ? 'Unavailable' : `${formatValue(crude)}/bbl`}
          </div>
          <div className="mt-0.5 text-[10px] text-[#64748B] dark:text-slate-400">
            Energy Input Cost
          </div>
        </div>

        {/* US 10Y Yield */}
        <div className="rounded-xl border border-[#E2E8F0]/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
            <span>US 10Y Treasury</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-1.5 font-data text-base sm:text-lg font-bold text-[#14263F] dark:text-white">
            {loading ? '—' : us10y == null ? 'Unavailable' : `${formatValue(us10y)}%`}
          </div>
          <div className="mt-0.5 text-[10px] text-[#64748B] dark:text-slate-400">
            Global Risk-Free Rate
          </div>
        </div>
      </div>
    </div>
  );
}
