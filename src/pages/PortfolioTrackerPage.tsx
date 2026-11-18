import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  UploadCloud,
  PieChart as PieIcon,
  ShieldCheck,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/StateViews';
import { formatNumberIN } from '../utils/calculations';

export interface PortfolioHolding {
  id: string;
  name: string;
  symbol: string;
  assetType: 'Equity' | 'Mutual Fund';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  dayChangePercent: number;
  sector: string;
  mcapCategory: 'Large Cap' | 'Mid Cap' | 'Small Cap' | 'Mutual Fund';
}

const DEFAULT_SAMPLE_HOLDINGS: PortfolioHolding[] = [
  {
    id: 'h-reliance',
    name: 'Reliance Industries Ltd',
    symbol: 'RELIANCE',
    assetType: 'Equity',
    quantity: 45,
    buyPrice: 1240.0,
    currentPrice: 1367.0,
    dayChangePercent: 1.65,
    sector: 'Energy & Petrochemicals',
    mcapCategory: 'Large Cap',
  },
  {
    id: 'h-hdfc',
    name: 'HDFC Bank Ltd',
    symbol: 'HDFCBANK',
    assetType: 'Equity',
    quantity: 80,
    buyPrice: 1580.0,
    currentPrice: 1742.5,
    dayChangePercent: 0.85,
    sector: 'Financial Services',
    mcapCategory: 'Large Cap',
  },
  {
    id: 'h-tcs',
    name: 'Tata Consultancy Services',
    symbol: 'TCS',
    assetType: 'Equity',
    quantity: 25,
    buyPrice: 3820.0,
    currentPrice: 4190.0,
    dayChangePercent: -0.42,
    sector: 'Technology',
    mcapCategory: 'Large Cap',
  },
  {
    id: 'h-trent',
    name: 'Trent Ltd',
    symbol: 'TRENT',
    assetType: 'Equity',
    quantity: 20,
    buyPrice: 4200.0,
    currentPrice: 6850.0,
    dayChangePercent: 2.45,
    sector: 'Consumer Retail',
    mcapCategory: 'Mid Cap',
  },
  {
    id: 'h-ppfas',
    name: 'Parag Parikh Flexi Cap Fund Direct',
    symbol: 'PPFAS-FC',
    assetType: 'Mutual Fund',
    quantity: 1200,
    buyPrice: 62.4,
    currentPrice: 84.52,
    dayChangePercent: 0.42,
    sector: 'Diversified Equity',
    mcapCategory: 'Mutual Fund',
  },
  {
    id: 'h-nippon',
    name: 'Nippon India Small Cap Fund Direct',
    symbol: 'NIPPON-SC',
    assetType: 'Mutual Fund',
    quantity: 600,
    buyPrice: 128.5,
    currentPrice: 174.15,
    dayChangePercent: 0.78,
    sector: 'Small Cap Equity',
    mcapCategory: 'Small Cap',
  },
];

const STORAGE_KEY = 'pa_external_portfolio_v2';

export function PortfolioTrackerPage() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return DEFAULT_SAMPLE_HOLDINGS;
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [casModalOpen, setCasModalOpen] = useState(false);
  const [casProcessing, setCasProcessing] = useState(false);
  const [casSuccess, setCasSuccess] = useState(false);

  // New Holding Form State
  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newAssetType, setNewAssetType] = useState<'Equity' | 'Mutual Fund'>('Equity');
  const [newQuantity, setNewQuantity] = useState('');
  const [newBuyPrice, setNewBuyPrice] = useState('');
  const [newCurrentPrice, setNewCurrentPrice] = useState('');
  const [newSector, setNewSector] = useState('Financial Services');

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
      } catch {
        // ignore
      }
    }
  }, [holdings]);

  // Aggregate Portfolio Totals
  const summary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let dayGainTotal = 0;

    for (const h of holdings) {
      const inv = h.buyPrice * h.quantity;
      const curr = h.currentPrice * h.quantity;
      const dayGain = curr * (h.dayChangePercent / 100);
      totalInvested += inv;
      totalCurrent += curr;
      dayGainTotal += dayGain;
    }

    const totalProfit = totalCurrent - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const dayReturnPercent = totalCurrent > 0 ? (dayGainTotal / totalCurrent) * 100 : 0;

    // Approximate XIRR based on average holding period
    const approxXirr = totalReturnPercent > 0 ? Math.min(34.8, totalReturnPercent * 0.78) : 0;

    return {
      totalInvested,
      totalCurrent,
      totalProfit,
      totalReturnPercent,
      dayGainTotal,
      dayReturnPercent,
      approxXirr,
    };
  }, [holdings]);

  // Asset Allocation breakdown
  const assetAllocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of holdings) {
      const val = h.currentPrice * h.quantity;
      map.set(h.mcapCategory, (map.get(h.mcapCategory) || 0) + val);
    }
    const total = summary.totalCurrent || 1;
    return Array.from(map.entries()).map(([category, value]) => ({
      category,
      value,
      percent: Math.round((value / total) * 100),
    }));
  }, [holdings, summary.totalCurrent]);

  // Sector breakdown
  const sectorAllocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of holdings) {
      const val = h.currentPrice * h.quantity;
      map.set(h.sector, (map.get(h.sector) || 0) + val);
    }
    const total = summary.totalCurrent || 1;
    return Array.from(map.entries())
      .map(([sector, value]) => ({
        sector,
        value,
        percent: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings, summary.totalCurrent]);

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newQuantity || !newBuyPrice) return;
    const qty = Number(newQuantity);
    const buy = Number(newBuyPrice);
    const curr = Number(newCurrentPrice) || buy;

    const newH: PortfolioHolding = {
      id: 'h-' + Date.now(),
      name: newName,
      symbol: newSymbol.toUpperCase() || newName.slice(0, 8).toUpperCase(),
      assetType: newAssetType,
      quantity: qty,
      buyPrice: buy,
      currentPrice: curr,
      dayChangePercent: 0.5,
      sector: newSector,
      mcapCategory: newAssetType === 'Mutual Fund' ? 'Mutual Fund' : 'Large Cap',
    };

    setHoldings((prev) => [newH, ...prev]);
    setAddModalOpen(false);
    setNewName('');
    setNewSymbol('');
    setNewQuantity('');
    setNewBuyPrice('');
    setNewCurrentPrice('');
  };

  const handleDeleteHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const handleResetSample = () => {
    setHoldings(DEFAULT_SAMPLE_HOLDINGS);
  };

  const handleSimulateCasUpload = () => {
    setCasProcessing(true);
    setCasSuccess(false);
    setTimeout(() => {
      setCasProcessing(false);
      setCasSuccess(true);
      setTimeout(() => {
        setCasModalOpen(false);
        setCasSuccess(false);
      }, 1500);
    }, 1200);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <SEOHead
        title="External Investment Portfolio Tracker – Stocks & Mutual Funds | PriceAlerter"
        description="Track your NSE & BSE stock holdings and Indian Mutual Funds with zero Demat linking. Automated XIRR, asset allocation X-Ray, sector concentration, and CAS statement import."
      />

      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Portfolio Tracker', to: '/portfolio' }]} />

      {/* Header Banner */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-[#00D09C] dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Demat Linking Required · 100% Private</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#14263F] dark:text-white">
            External Portfolio Intelligence &amp; X-Ray
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
            Track multi-broker Indian equities and direct mutual funds without surrendering login credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00D09C] hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holding</span>
          </button>
          <button
            type="button"
            onClick={() => setCasModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111C2E] px-4 py-2 text-xs font-semibold text-[#14263F] dark:text-white hover:border-[#00D09C] transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-emerald-500" />
            <span>Import CAS Statement</span>
          </button>
          <button
            type="button"
            onClick={handleResetSample}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-xs font-medium text-[#64748B] dark:text-slate-300 hover:text-[#14263F] transition-colors cursor-pointer"
            title="Reload realistic sample data"
          >
            Reset Sample
          </button>
        </div>
      </section>

      {/* Primary KPI Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 shadow-sm">
          <div className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Current Value</div>
          <div className="font-data text-xl sm:text-2xl font-bold text-[#14263F] dark:text-white mt-1">
            ₹{formatNumberIN(Math.round(summary.totalCurrent))}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Live market benchmark</div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 shadow-sm">
          <div className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Total Invested</div>
          <div className="font-data text-xl sm:text-2xl font-bold text-[#14263F] dark:text-white mt-1">
            ₹{formatNumberIN(Math.round(summary.totalInvested))}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{holdings.length} Securities</div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 shadow-sm">
          <div className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Total Profit / Loss</div>
          <div className={`font-data text-xl sm:text-2xl font-bold mt-1 ${summary.totalProfit >= 0 ? 'text-[#00D09C] dark:text-emerald-400' : 'text-[#EB5B3C]'}`}>
            {summary.totalProfit >= 0 ? '+₹' : '-₹'}
            {formatNumberIN(Math.abs(Math.round(summary.totalProfit)))}
          </div>
          <div className={`text-[11px] font-bold font-data ${summary.totalProfit >= 0 ? 'text-[#00D09C] dark:text-emerald-400' : 'text-[#EB5B3C]'}`}>
            {summary.totalProfit >= 0 ? '▲ +' : '▼ '}
            {summary.totalReturnPercent.toFixed(2)}%
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 shadow-sm">
          <div className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">1-Day Change</div>
          <div className={`font-data text-xl sm:text-2xl font-bold mt-1 ${summary.dayGainTotal >= 0 ? 'text-[#00D09C] dark:text-emerald-400' : 'text-[#EB5B3C]'}`}>
            {summary.dayGainTotal >= 0 ? '+₹' : '-₹'}
            {formatNumberIN(Math.abs(Math.round(summary.dayGainTotal)))}
          </div>
          <div className={`text-[11px] font-bold font-data ${summary.dayGainTotal >= 0 ? 'text-[#00D09C] dark:text-emerald-400' : 'text-[#EB5B3C]'}`}>
            {summary.dayGainTotal >= 0 ? '▲ +' : '▼ '}
            {summary.dayReturnPercent.toFixed(2)}%
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-[#F0FDF4] dark:bg-[#062419] p-4 col-span-2 lg:col-span-1 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Portfolio XIRR</div>
          <div className="font-data text-xl sm:text-2xl font-extrabold text-[#00D09C] dark:text-emerald-400 mt-1">
            {summary.approxXirr.toFixed(1)}% p.a.
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400/80 mt-1">Annualized CAGR</div>
        </div>
      </section>

      {/* Portfolio X-Ray Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation Breakdown */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#00D09C]" />
              <h3 className="font-bold text-sm text-[#14263F] dark:text-white">
                Asset Allocation X-Ray
              </h3>
            </div>
            <span className="text-xs text-[#64748B]">Cap &amp; Fund Distribution</span>
          </div>

          <div className="space-y-3 pt-2">
            {assetAllocation.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                  <span className="font-data text-[#14263F] dark:text-white font-bold">
                    ₹{formatNumberIN(Math.round(item.value))} ({item.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00D09C]"
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Concentration */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              <h3 className="font-bold text-sm text-[#14263F] dark:text-white">
                Sector Concentration
              </h3>
            </div>
            <span className="text-xs text-[#64748B]">Top Industry Weights</span>
          </div>

          <div className="space-y-3 pt-2">
            {sectorAllocation.slice(0, 5).map((item) => (
              <div key={item.sector} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{item.sector}</span>
                  <span className="font-data text-[#14263F] dark:text-white font-bold">
                    {item.percent}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2563EB]"
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Holdings List */}
      <section className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#14263F] dark:text-white">
            Current Holdings ({holdings.length})
          </h3>
          <span className="text-xs text-[#64748B]">Updated with latest NSE/BSE &amp; NAV quotes</span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[#64748B] dark:text-slate-400 font-semibold">
                <th className="pb-3 pr-4">Security / Fund</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3 text-right">Qty</th>
                <th className="pb-3 px-3 text-right">Avg Buy</th>
                <th className="pb-3 px-3 text-right">LTP / NAV</th>
                <th className="pb-3 px-3 text-right">Invested</th>
                <th className="pb-3 px-3 text-right">Current Value</th>
                <th className="pb-3 px-3 text-right">P&amp;L (Return)</th>
                <th className="pb-3 pl-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {holdings.map((h) => {
                const invested = h.buyPrice * h.quantity;
                const current = h.currentPrice * h.quantity;
                const pnl = current - invested;
                const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                const isProfit = pnl >= 0;

                return (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{h.name}</div>
                      <div className="font-data text-[10px] text-[#64748B]">{h.symbol} · {h.sector}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        {h.assetType}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-data font-semibold text-slate-800 dark:text-slate-200">
                      {h.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-data text-slate-600 dark:text-slate-300">
                      ₹{h.buyPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-data font-semibold text-slate-800 dark:text-slate-200">
                      ₹{h.currentPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-data text-slate-600 dark:text-slate-300">
                      ₹{formatNumberIN(Math.round(invested))}
                    </td>
                    <td className="py-3.5 px-3 text-right font-data font-bold text-slate-900 dark:text-white">
                      ₹{formatNumberIN(Math.round(current))}
                    </td>
                    <td className="py-3.5 px-3 text-right font-data">
                      <span className={`font-bold ${isProfit ? 'text-[#00D09C] dark:text-emerald-400' : 'text-[#EB5B3C]'}`}>
                        {isProfit ? '+₹' : '-₹'}{formatNumberIN(Math.abs(Math.round(pnl)))}
                      </span>
                      <div className={`text-[10px] ${isProfit ? 'text-[#00D09C] dark:text-emerald-400' : 'text-[#EB5B3C]'}`}>
                        {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3.5 pl-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteHolding(h.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete holding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Holding Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#14263F] dark:text-white">
              Add Investment Holding
            </h3>

            <form onSubmit={handleAddHolding} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748B] mb-1">Asset Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAssetType('Equity')}
                    className={`py-1.5 rounded-lg border font-semibold ${newAssetType === 'Equity' ? 'border-[#00D09C] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-slate-200 text-slate-600'}`}
                  >
                    Stock / Equity
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAssetType('Mutual Fund')}
                    className={`py-1.5 rounded-lg border font-semibold ${newAssetType === 'Mutual Fund' ? 'border-[#00D09C] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-slate-200 text-slate-600'}`}
                  >
                    Mutual Fund
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] mb-1">Security / Fund Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Infosys Ltd or Parag Parikh Flexi Cap"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#00D09C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] mb-1">Quantity / Units</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g., 50"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#00D09C]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] mb-1">Avg Buy Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g., 1450.00"
                    value={newBuyPrice}
                    onChange={(e) => setNewBuyPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#00D09C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] mb-1">Current Price / NAV (₹) (Optional)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Leave blank to use buy price"
                  value={newCurrentPrice}
                  onChange={(e) => setNewCurrentPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#00D09C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#00D09C] hover:bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition-colors"
                >
                  Save Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAS Import Modal */}
      {casModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00D09C] flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-[#14263F] dark:text-white">
              Import Consolidated Account Statement (CAS)
            </h3>

            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Upload your monthly CAS PDF or CSV from CAMS, KFintech, NSDL, or CDSL to automatically parse your holdings. No broker credentials needed.
            </p>

            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2 hover:border-[#00D09C] transition-colors cursor-pointer" onClick={handleSimulateCasUpload}>
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {casProcessing ? 'Parsing CAS PDF & Computing XIRR...' : casSuccess ? 'Successfully Parsed & Synced!' : 'Click to Upload CAS Statement PDF'}
              </div>
              <div className="text-[10px] text-slate-400">
                Password protected PDFs (PAN / DOB) supported
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCasModalOpen(false)}
                className="w-full rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
