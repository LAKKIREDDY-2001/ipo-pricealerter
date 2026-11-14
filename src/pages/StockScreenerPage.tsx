import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, RotateCcw, Save, X } from 'lucide-react';
import { api } from '../services/api';
import type { StockInstrument } from '../types/financial';
import { formatCrores, formatINR, formatPercent, formatStockTickerLabel } from '../utils/calculations';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { SEOHead } from '../components/common/SEOHead';
import {
  Breadcrumbs,
  DisclaimerBanner,
  EmptyState,
  LoadingSkeleton,
} from '../components/common/StateViews';

interface ScreenerCriteria {
  exchange: string;
  sector: string;
  minPrice: string;
  maxPrice: string;
  minMcap: string;
  maxPe: string;
  maxPb: string;
  minRoe: string;
  minRoce: string;
  maxDebt: string;
  minRevGrowth: string;
  minProfitGrowth: string;
}

type ScreenerSortKey =
  | 'marketCapCr'
  | 'currentPrice'
  | 'pe'
  | 'pb'
  | 'roePct'
  | 'rocePct'
  | 'revenueGrowthPct'
  | 'profitGrowthPct';

const DEFAULT_CRITERIA: ScreenerCriteria = {
  exchange: 'All',
  sector: 'All',
  minPrice: '',
  maxPrice: '',
  minMcap: '',
  maxPe: '',
  maxPb: '',
  minRoe: '',
  minRoce: '',
  maxDebt: '',
  minRevGrowth: '',
  minProfitGrowth: '',
};

const PAGE_SIZE = 25;

export function StockScreenerPage() {
  const [stocks, setStocks] = useState<StockInstrument[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [criteria, setCriteria] = useState<ScreenerCriteria>(DEFAULT_CRITERIA);
  const [sortBy, setSortBy] = useState<ScreenerSortKey>('marketCapCr');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const [savedScreens, setSavedScreens] = useState<
    Array<{ name: string; criteria: ScreenerCriteria }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem('pa_saved_screens') || '[]');
    } catch {
      return [];
    }
  });
  const [screenName, setScreenName] = useState('');

  useEffect(() => {
    api
      .getStocks({ limit: 10000 })
      .then((res) => {
        setStocks(res.stocks);
        setSectors(res.sectors);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateCriteria = (patch: Partial<ScreenerCriteria>) => {
    setCriteria((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const results = useMemo(() => {
    const num = (v: string) => (v.trim() === '' ? null : Number(v));
    const minP = num(criteria.minPrice);
    const maxP = num(criteria.maxPrice);
    const minMc = num(criteria.minMcap);
    const maxPe = num(criteria.maxPe);
    const maxPb = num(criteria.maxPb);
    const minRoe = num(criteria.minRoe);
    const minRoce = num(criteria.minRoce);
    const maxDe = num(criteria.maxDebt);
    const minRev = num(criteria.minRevGrowth);
    const minProf = num(criteria.minProfitGrowth);

    const filtered = stocks.filter((s) => {
      if (criteria.exchange !== 'All' && !s.exchange.includes(criteria.exchange)) return false;
      if (criteria.sector !== 'All' && s.sector !== criteria.sector) return false;
      if (minP !== null && (s.currentPrice ?? -1) < minP) return false;
      if (maxP !== null && (s.currentPrice ?? Infinity) > maxP) return false;
      if (minMc !== null && (s.marketCapCr ?? -1) < minMc) return false;
      if (maxPe !== null && (s.fundamentals.pe === null || s.fundamentals.pe > maxPe)) return false;
      if (maxPb !== null && (s.fundamentals.pb === null || s.fundamentals.pb > maxPb)) return false;
      if (minRoe !== null && (s.fundamentals.roePct ?? -999) < minRoe) return false;
      if (minRoce !== null && (s.fundamentals.rocePct ?? -999) < minRoce) return false;
      if (maxDe !== null && s.fundamentals.debtToEquity !== null && s.fundamentals.debtToEquity > maxDe)
        return false;
      if (minRev !== null && (s.fundamentals.revenueGrowthPct ?? -999) < minRev) return false;
      if (minProf !== null && (s.fundamentals.profitGrowthPct ?? -999) < minProf) return false;
      return true;
    });

    const getVal = (s: StockInstrument): number | null => {
      switch (sortBy) {
        case 'marketCapCr':
          return s.marketCapCr;
        case 'currentPrice':
          return s.currentPrice;
        case 'pe':
          return s.fundamentals.pe;
        case 'pb':
          return s.fundamentals.pb;
        case 'roePct':
          return s.fundamentals.roePct;
        case 'rocePct':
          return s.fundamentals.rocePct;
        case 'revenueGrowthPct':
          return s.fundamentals.revenueGrowthPct;
        case 'profitGrowthPct':
          return s.fundamentals.profitGrowthPct;
      }
    };

    return [...filtered].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return sortAsc ? av - bv : bv - av;
    });
  }, [stocks, criteria, sortBy, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedResults = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (key: ScreenerSortKey) => {
    if (sortBy === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(key);
      setSortAsc(key === 'pe' || key === 'pb');
    }
    setPage(1);
  };

  const renderSortIcon = (key: ScreenerSortKey) => {
    if (sortBy !== key) return <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 inline ml-1 text-[#2563EB]" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1 text-[#2563EB]" />
    );
  };

  const applyPreset = (preset: 'roe' | 'value' | 'growth' | 'lowdebt') => {
    if (preset === 'roe') {
      setCriteria({ ...DEFAULT_CRITERIA, minRoe: '20', minRoce: '22', maxDebt: '0.5' });
    } else if (preset === 'value') {
      setCriteria({ ...DEFAULT_CRITERIA, maxPe: '25', minRoe: '14' });
    } else if (preset === 'growth') {
      setCriteria({ ...DEFAULT_CRITERIA, minRevGrowth: '12', minProfitGrowth: '15' });
    } else if (preset === 'lowdebt') {
      setCriteria({ ...DEFAULT_CRITERIA, maxDebt: '0.25', minMcap: '5000' });
    }
    setPage(1);
  };

  const handleSaveScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenName.trim()) return;
    const trimmed = screenName.trim();
    const next = [
      { name: trimmed, criteria },
      ...savedScreens.filter((s) => s.name !== trimmed),
    ].slice(0, 8);
    setSavedScreens(next);
    setScreenName('');
    try {
      localStorage.setItem('pa_saved_screens', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleDeleteScreen = (name: string) => {
    const next = savedScreens.filter((s) => s.name !== name);
    setSavedScreens(next);
    try {
      localStorage.setItem('pa_saved_screens', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleExportCsv = () => {
    const header = [
      'Symbol',
      'Company',
      'Exchange',
      'Sector',
      'Price_INR',
      'MarketCap_Cr',
      'PE',
      'PB',
      'ROE_Pct',
      'ROCE_Pct',
      'DebtToEquity',
      'RevenueGrowth_Pct',
      'ProfitGrowth_Pct',
      'ReportingPeriod',
    ];
    const rows = results.map((s) =>
      [
        s.symbol,
        `"${s.companyName.replace(/"/g, '""')}"`,
        s.exchange,
        `"${s.sector}"`,
        s.currentPrice ?? '',
        s.marketCapCr ?? '',
        s.fundamentals.pe ?? '',
        s.fundamentals.pb ?? '',
        s.fundamentals.roePct ?? '',
        s.fundamentals.rocePct ?? '',
        s.fundamentals.debtToEquity ?? '',
        s.fundamentals.revenueGrowthPct ?? '',
        s.fundamentals.profitGrowthPct ?? '',
        `"${s.fundamentals.reportingPeriod}"`,
      ].join(',')
    );
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricealerter-screener-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6">
      <SEOHead
        title="Indian Stock Screener – P/E, P/B, ROE, ROCE & Growth Filters"
        description="Screen NSE and BSE listed stocks by market cap, P/E, P/B, ROE, ROCE, debt-to-equity, revenue growth, and profit growth."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Stock Screener' }]} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
            Fundamental Stock Screener
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Filter Indian equities using valuation, capital efficiency, leverage, and growth ratios.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={results.length === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3.5 py-2 min-h-[38px] text-xs font-semibold text-[#152338] dark:text-slate-100 hover:border-[#14263F] disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV ({results.length.toLocaleString('en-IN')})
        </button>
      </div>

      <DisclaimerBanner
        title="Ratio Attribution"
        text="All fundamental ratios shown in the screener reference TTM FY26 / Latest Exchange Filings & Quarterly Results. Banks and NBFCs report Debt-to-Equity as N/A due to deposit-led balance sheet structures."
      />

      {/* Preset Screens */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-[#64748B]">Presets:</span>
        <button
          type="button"
          onClick={() => applyPreset('roe')}
          className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-1.5 min-h-[34px] font-medium hover:border-[#2563EB] cursor-pointer"
        >
          High ROE Compounders (ROE ≥ 20%)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('value')}
          className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-1.5 min-h-[34px] font-medium hover:border-[#2563EB] cursor-pointer"
        >
          Reasonable Valuation (P/E ≤ 25)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('growth')}
          className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-1.5 min-h-[34px] font-medium hover:border-[#2563EB] cursor-pointer"
        >
          High Earnings Growth (≥ 15%)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('lowdebt')}
          className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-1.5 min-h-[34px] font-medium hover:border-[#2563EB] cursor-pointer"
        >
          Low Leverage (D/E ≤ 0.25)
        </button>
        <button
          type="button"
          onClick={() => {
            setCriteria(DEFAULT_CRITERIA);
            setPage(1);
          }}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 min-h-[34px] text-[#64748B] hover:text-[#152338] dark:hover:text-white cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Filter Inputs */}
      <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Exchange</span>
            <select
              value={criteria.exchange}
              onChange={(e) => updateCriteria({ exchange: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 text-sm sm:text-xs"
            >
              <option value="All">All</option>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Sector</span>
            <select
              value={criteria.sector}
              onChange={(e) => updateCriteria({ sector: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 text-sm sm:text-xs"
            >
              <option value="All">All Sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Min Price (₹)</span>
            <input
              type="number"
              value={criteria.minPrice}
              onChange={(e) => updateCriteria({ minPrice: e.target.value })}
              placeholder="e.g. 100"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Max Price (₹)</span>
            <input
              type="number"
              value={criteria.maxPrice}
              onChange={(e) => updateCriteria({ maxPrice: e.target.value })}
              placeholder="e.g. 5000"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Min M.Cap (₹ Cr)</span>
            <input
              type="number"
              value={criteria.minMcap}
              onChange={(e) => updateCriteria({ minMcap: e.target.value })}
              placeholder="e.g. 10000"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Max P/E</span>
            <input
              type="number"
              value={criteria.maxPe}
              onChange={(e) => updateCriteria({ maxPe: e.target.value })}
              placeholder="e.g. 30"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Max P/B</span>
            <input
              type="number"
              value={criteria.maxPb}
              onChange={(e) => updateCriteria({ maxPb: e.target.value })}
              placeholder="e.g. 6"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Min ROE (%)</span>
            <input
              type="number"
              value={criteria.minRoe}
              onChange={(e) => updateCriteria({ minRoe: e.target.value })}
              placeholder="e.g. 15"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Min ROCE (%)</span>
            <input
              type="number"
              value={criteria.minRoce}
              onChange={(e) => updateCriteria({ minRoce: e.target.value })}
              placeholder="e.g. 15"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Max Debt/Eq</span>
            <input
              type="number"
              step="0.1"
              value={criteria.maxDebt}
              onChange={(e) => updateCriteria({ maxDebt: e.target.value })}
              placeholder="e.g. 0.5"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Min Rev Growth %</span>
            <input
              type="number"
              value={criteria.minRevGrowth}
              onChange={(e) => updateCriteria({ minRevGrowth: e.target.value })}
              placeholder="e.g. 10"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[#64748B] dark:text-slate-400">Min Profit Growth %</span>
            <input
              type="number"
              value={criteria.minProfitGrowth}
              onChange={(e) => updateCriteria({ minProfitGrowth: e.target.value })}
              placeholder="e.g. 12"
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-2 font-data text-sm sm:text-xs"
            />
          </label>
        </div>

        {/* Save Screen Bar */}
        <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSaveScreen} className="flex items-center gap-2 text-xs w-full sm:w-auto">
            <input
              type="text"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              placeholder="Name this screen..."
              className="flex-1 sm:w-52 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-3.5 py-2 min-h-[36px] font-semibold text-white cursor-pointer shrink-0"
            >
              <Save className="w-3.5 h-3.5" /> Save Screen
            </button>
          </form>

          {savedScreens.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[#64748B]">Saved:</span>
              {savedScreens.map((sc) => (
                <div
                  key={sc.name}
                  className="inline-flex items-center rounded-md border border-[#E2E8F0] dark:border-slate-700 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCriteria(sc.criteria);
                      setPage(1);
                    }}
                    className="px-2.5 py-1 hover:text-[#2563EB] cursor-pointer"
                  >
                    {sc.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteScreen(sc.name)}
                    aria-label={`Delete ${sc.name} screen`}
                    className="px-1.5 py-1 text-[#94A3B8] hover:text-[#DC2626] border-l border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : results.length === 0 ? (
        <EmptyState
          title="No stocks match all screener rules"
          description="Relax one or more numeric ratio thresholds to broaden matching equities."
          actionLabel="Reset Screener"
          onAction={() => {
            setCriteria(DEFAULT_CRITERIA);
            setPage(1);
          }}
        />
      ) : (
        <div className="space-y-3">
          {/* Mobile Sort Bar */}
          <div className="md:hidden flex items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3.5 py-2.5 text-xs">
            <label className="flex items-center gap-2 flex-1">
              <span className="text-[#64748B] font-medium shrink-0">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value as ScreenerSortKey)}
                className="w-full rounded-md border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-2.5 py-1.5 text-sm sm:text-xs font-medium text-[#152338] dark:text-slate-100"
              >
                <option value="marketCapCr">Market Cap</option>
                <option value="currentPrice">Share Price (CMP)</option>
                <option value="pe">P/E Ratio</option>
                <option value="pb">P/B Ratio</option>
                <option value="roePct">ROE %</option>
                <option value="rocePct">ROCE %</option>
                <option value="revenueGrowthPct">Revenue Growth %</option>
                <option value="profitGrowthPct">Profit Growth %</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setSortAsc((p) => !p)}
              className="px-2.5 py-1.5 min-h-[34px] rounded-md border border-[#E2E8F0] dark:border-slate-700 font-semibold text-[#152338] dark:text-slate-200 cursor-pointer shrink-0"
            >
              {sortAsc ? 'Low → High' : 'High → Low'}
            </button>
          </div>

          {/* Mobile Screener Cards */}
          <div className="md:hidden space-y-2.5">
            {pagedResults.map((s) => (
              <Link
                key={s.id}
                to={`/stock/${s.symbol}`}
                className="block rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-3.5 space-y-2.5 hover:border-[#2563EB]/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
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
                      <div className="text-sm font-bold text-[#152338] dark:text-white truncate">
                        {s.companyName}
                      </div>
                      <div className="text-[11px] font-data text-[#64748B] dark:text-slate-400 truncate">
                        {formatStockTickerLabel(s.symbol, s.bseCode)} · {s.exchange}
                      </div>
                      <div className="text-[11px] text-[#94A3B8] truncate">{s.sector}</div>
                    </div>
                  </div>
                  <div className="text-right font-data shrink-0">
                    <div className="text-sm font-bold text-[#152338] dark:text-white">
                      {formatINR(s.currentPrice)}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {formatCrores(s.marketCapCr)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px]">
                  <div>
                    <div className="text-[#64748B]">P/E</div>
                    <div className="font-data font-semibold text-[#152338] dark:text-slate-200">
                      {s.fundamentals.pe ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#64748B]">ROE %</div>
                    <div className="font-data font-semibold text-[#152338] dark:text-slate-200">
                      {s.fundamentals.roePct !== null ? `${s.fundamentals.roePct}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#64748B]">ROCE %</div>
                    <div className="font-data font-semibold text-[#152338] dark:text-slate-200">
                      {s.fundamentals.rocePct !== null ? `${s.fundamentals.rocePct}%` : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#64748B]">PAT Gr.</div>
                    <div
                      className={`font-data font-semibold ${
                        (s.fundamentals.profitGrowthPct ?? 0) >= 0
                          ? 'text-[#16A34A] dark:text-emerald-400'
                          : 'text-[#DC2626] dark:text-red-400'
                      }`}
                    >
                      {formatPercent(s.fundamentals.profitGrowthPct)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-3">Sector</th>
                    <th className="py-3 px-3 text-right">
                      <button type="button" onClick={() => handleSort('currentPrice')} className="cursor-pointer uppercase">
                        CMP{renderSortIcon('currentPrice')}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <button type="button" onClick={() => handleSort('marketCapCr')} className="cursor-pointer uppercase">
                        M.Cap{renderSortIcon('marketCapCr')}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <button type="button" onClick={() => handleSort('pe')} className="cursor-pointer uppercase">
                        P/E{renderSortIcon('pe')}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <button type="button" onClick={() => handleSort('pb')} className="cursor-pointer uppercase">
                        P/B{renderSortIcon('pb')}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <button type="button" onClick={() => handleSort('roePct')} className="cursor-pointer uppercase">
                        ROE %{renderSortIcon('roePct')}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <button type="button" onClick={() => handleSort('rocePct')} className="cursor-pointer uppercase">
                        ROCE %{renderSortIcon('rocePct')}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">D/E</th>
                    <th className="py-3 px-3 text-right">
                      <button type="button" onClick={() => handleSort('revenueGrowthPct')} className="cursor-pointer uppercase">
                        Rev Gr.{renderSortIcon('revenueGrowthPct')}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-right">
                      <button type="button" onClick={() => handleSort('profitGrowthPct')} className="cursor-pointer uppercase">
                        PAT Gr.{renderSortIcon('profitGrowthPct')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 font-data">
                  {pagedResults.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-sans">
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
                              className="font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate max-w-[200px]"
                            >
                              {s.companyName}
                            </Link>
                            <div className="text-[11px] font-data text-[#64748B] truncate">
                              {formatStockTickerLabel(s.symbol, s.bseCode)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-sans text-[#64748B]">{s.sector}</td>
                      <td className="py-3 px-3 text-right font-semibold">{formatINR(s.currentPrice)}</td>
                      <td className="py-3 px-3 text-right">{formatCrores(s.marketCapCr)}</td>
                      <td className="py-3 px-3 text-right">{s.fundamentals.pe ?? '—'}</td>
                      <td className="py-3 px-3 text-right">{s.fundamentals.pb ?? '—'}</td>
                      <td className="py-3 px-3 text-right">
                        {s.fundamentals.roePct !== null ? `${s.fundamentals.roePct}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {s.fundamentals.rocePct !== null ? `${s.fundamentals.rocePct}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">{s.fundamentals.debtToEquity ?? 'N/A'}</td>
                      <td className="py-3 px-3 text-right">{formatPercent(s.fundamentals.revenueGrowthPct)}</td>
                      <td className="py-3 px-4 text-right">{formatPercent(s.fundamentals.profitGrowthPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-4 py-2.5 text-xs text-[#64748B]">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, results.length)} of{' '}
                {results.length.toLocaleString('en-IN')} matching equities (Page {safePage} of {totalPages})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 min-h-[34px] rounded border border-[#E2E8F0] dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 min-h-[34px] rounded border border-[#E2E8F0] dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
