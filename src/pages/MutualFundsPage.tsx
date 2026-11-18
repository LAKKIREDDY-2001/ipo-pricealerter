import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Percent,
  Search,
  ShieldCheck,
  Sparkles,
  PieChart as PieIcon,
  ChevronDown,
  ArrowUpRight,
  Calculator,
  Building,
  Star,
  X,
  ExternalLink,
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/StateViews';
import { formatNumberIN } from '../utils/calculations';
import { MUTUAL_FUNDS_DATA, type MutualFundItem } from '../data/mutualFundsData';

export function MutualFundsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAmc, setSelectedAmc] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'3y' | '5y' | 'aum' | 'expense' | 'rating'>('3y');
  const [selectedFund, setSelectedFund] = useState<MutualFundItem | null>(null);

  // SIP Simulator State
  const [calcMode, setCalcMode] = useState<'sip' | 'lumpsum'>('sip');
  const [investmentAmount, setInvestmentAmount] = useState<number>(5000);
  const [expectedReturn, setExpectedReturn] = useState<number>(14);
  const [investmentYears, setInvestmentYears] = useState<number>(5);

  const categories = ['All', 'Equity', 'Large Cap', 'Flexi Cap', 'Mid Cap', 'Small Cap', 'Index', 'ELSS', 'Hybrid', 'Debt'];

  const amcs = useMemo(() => {
    const list = Array.from(new Set(MUTUAL_FUNDS_DATA.map((f) => f.amc)));
    return ['All', ...list];
  }, []);

  const filteredFunds = useMemo(() => {
    return MUTUAL_FUNDS_DATA.filter((fund) => {
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Equity' && fund.category !== 'Equity') return false;
        if (selectedCategory !== 'Equity' && !fund.subCategory.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }
      if (selectedAmc !== 'All' && fund.amc !== selectedAmc) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = fund.name.toLowerCase().includes(q);
        const matchesAmc = fund.amc.toLowerCase().includes(q);
        const matchesSub = fund.subCategory.toLowerCase().includes(q);
        if (!matchesName && !matchesAmc && !matchesSub) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === '3y') return b.returns['3y'] - a.returns['3y'];
      if (sortBy === '5y') return b.returns['5y'] - a.returns['5y'];
      if (sortBy === 'aum') return b.aumCr - a.aumCr;
      if (sortBy === 'expense') return a.expenseRatio - b.expenseRatio;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [selectedCategory, selectedAmc, searchQuery, sortBy]);

  // SIP Math: FV = P * [ (1+i)^n - 1 ] * (1+i) / i
  const simulationResults = useMemo(() => {
    const r = expectedReturn / 100;
    const n = investmentYears;
    if (calcMode === 'sip') {
      const i = r / 12;
      const months = n * 12;
      const totalInvested = investmentAmount * months;
      const maturityValue = investmentAmount * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
      const estGains = Math.max(0, maturityValue - totalInvested);
      return { totalInvested, estGains, maturityValue };
    } else {
      const totalInvested = investmentAmount;
      const maturityValue = totalInvested * Math.pow(1 + r, n);
      const estGains = Math.max(0, maturityValue - totalInvested);
      return { totalInvested, estGains, maturityValue };
    }
  }, [calcMode, investmentAmount, expectedReturn, investmentYears]);

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <SEOHead
        title="Direct Mutual Funds & SIP Intelligence – Zero Commission Funds | PriceAlerter"
        description="Explore top direct Indian mutual funds, compare 1Y, 3Y, and 5Y CAGR returns, simulate SIP/Lumpsum wealth growth, and view top stock holdings across top AMCs."
      />

      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Mutual Funds', to: '/mutual-funds' }]} />

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-gradient-to-br from-[#F8FAFC] via-white to-emerald-50/40 dark:from-[#0F172A] dark:via-[#111C2E] dark:to-emerald-950/20 p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-[#00D09C] dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>0% Commission Direct Mutual Funds</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[#14263F] dark:text-white">
            Mutual Fund Screener &amp; Wealth Hub
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-slate-300 leading-relaxed">
            Discover top-performing Direct mutual funds across Flexi Cap, Small Cap, Large Cap, and ELSS Tax Savers. Check verified 3Y/5Y CAGR returns, expense ratios, and inspect top stock portfolio holdings.
          </p>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[#E2E8F0] dark:border-slate-800">
          <div className="rounded-xl bg-white dark:bg-[#152338] p-3 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Tracked Direct Funds</div>
            <div className="text-xl font-bold font-data text-[#14263F] dark:text-white mt-0.5">850+</div>
          </div>
          <div className="rounded-xl bg-white dark:bg-[#152338] p-3 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Average 3Y Small Cap</div>
            <div className="text-xl font-bold font-data text-[#00D09C] dark:text-emerald-400 mt-0.5">+28.6%</div>
          </div>
          <div className="rounded-xl bg-white dark:bg-[#152338] p-3 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Lowest Index Expense</div>
            <div className="text-xl font-bold font-data text-[#2563EB] dark:text-blue-400 mt-0.5">0.18%</div>
          </div>
          <div className="rounded-xl bg-white dark:bg-[#152338] p-3 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Direct SIP Minimum</div>
            <div className="text-xl font-bold font-data text-[#14263F] dark:text-white mt-0.5">₹500 / mo</div>
          </div>
        </div>
      </section>

      {/* Interactive SIP & Lumpsum Calculator Card */}
      <section className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00D09C] dark:text-emerald-400">
              <Calculator className="w-4 h-4" />
              <span>Investment Return Simulator</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#14263F] dark:text-white mt-1">
              Estimate Your Wealth Growth
            </h2>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCalcMode('sip')}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                calcMode === 'sip'
                  ? 'bg-white dark:bg-[#1E3554] text-[#14263F] dark:text-white shadow-sm'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#14263F]'
              }`}
            >
              Monthly SIP
            </button>
            <button
              type="button"
              onClick={() => setCalcMode('lumpsum')}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                calcMode === 'lumpsum'
                  ? 'bg-white dark:bg-[#1E3554] text-[#14263F] dark:text-white shadow-sm'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#14263F]'
              }`}
            >
              One-Time Lumpsum
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sliders Zone */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#64748B] dark:text-slate-300">
                  {calcMode === 'sip' ? 'Monthly Investment' : 'Total Investment'}
                </span>
                <span className="font-data text-sm text-[#14263F] dark:text-white font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  ₹{formatNumberIN(investmentAmount)}
                </span>
              </div>
              <input
                type="range"
                min={calcMode === 'sip' ? 500 : 5000}
                max={calcMode === 'sip' ? 100000 : 1000000}
                step={calcMode === 'sip' ? 500 : 5000}
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00D09C]"
              />
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#64748B] dark:text-slate-300">Expected Annual Return (CAGR)</span>
                <span className="font-data text-sm text-[#00D09C] dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg">
                  {expectedReturn}% p.a.
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={25}
                step={0.5}
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00D09C]"
              />
            </div>

            {/* Investment Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#64748B] dark:text-slate-300">Time Period</span>
                <span className="font-data text-sm text-[#14263F] dark:text-white font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  {investmentYears} {investmentYears === 1 ? 'Year' : 'Years'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={investmentYears}
                onChange={(e) => setInvestmentYears(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00D09C]"
              />
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-[#F0FDF4] dark:bg-[#062419] p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Projected Maturity Corpus
              </div>
              <div className="font-data text-3xl font-extrabold text-[#14263F] dark:text-white">
                ₹{formatNumberIN(Math.round(simulationResults.maturityValue))}
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Total Amount Invested:</span>
                  <span className="font-bold font-data text-[#14263F] dark:text-white">
                    ₹{formatNumberIN(Math.round(simulationResults.totalInvested))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Estimated Wealth Gain:</span>
                  <span className="font-bold font-data">
                    +₹{formatNumberIN(Math.round(simulationResults.estGains))}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="space-y-1">
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                <div
                  className="bg-[#14263F] dark:bg-slate-400 h-full"
                  style={{
                    width: `${Math.round(
                      (simulationResults.totalInvested / simulationResults.maturityValue) * 100
                    )}%`,
                  }}
                  title="Invested Capital"
                />
                <div
                  className="bg-[#00D09C] h-full flex-1"
                  title="Wealth Gain"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#14263F] dark:bg-slate-400" />
                  Invested
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00D09C]" />
                  Gain
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screener Controls */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#14263F] dark:bg-[#00D09C] text-white dark:text-[#0F172A]'
                    : 'border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] text-[#64748B] dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#64748B] dark:text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-2.5 py-1.5 text-xs font-medium text-[#14263F] dark:text-slate-200 outline-none"
            >
              <option value="3y">Highest 3Y Return</option>
              <option value="5y">Highest 5Y Return</option>
              <option value="aum">Largest AUM</option>
              <option value="expense">Lowest Expense Ratio</option>
              <option value="rating">Top Rated (Stars)</option>
            </select>
          </div>
        </div>

        {/* Search Bar + AMC Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search mutual funds by name, AMC (e.g., Parag Parikh, HDFC, Small Cap)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] pl-9 pr-4 py-2 text-xs text-[#14263F] dark:text-white placeholder-slate-400 outline-none focus:border-[#00D09C]"
            />
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <select
              value={selectedAmc}
              onChange={(e) => setSelectedAmc(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3 py-2 text-xs text-[#14263F] dark:text-white outline-none focus:border-[#00D09C]"
            >
              {amcs.map((a) => (
                <option key={a} value={a}>
                  {a === 'All' ? 'All Fund Houses (AMCs)' : a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Funds Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredFunds.map((fund) => (
          <div
            key={fund.id}
            onClick={() => setSelectedFund(fund)}
            className="group rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 shadow-sm hover:border-[#00D09C] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-[#64748B] dark:text-slate-300">
                    {fund.subCategory}
                  </span>
                  <span className="ml-1.5 inline-block text-[11px] font-medium text-[#64748B] dark:text-slate-400">
                    {fund.amc}
                  </span>
                </div>
                <div className="flex items-center text-amber-400 text-xs">
                  {Array.from({ length: fund.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>

              <h3 className="font-semibold text-sm text-[#14263F] dark:text-white group-hover:text-[#00D09C] transition-colors line-clamp-2">
                {fund.name}
              </h3>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[10px] text-[#64748B] dark:text-slate-400">Current NAV</div>
                  <div className="font-data text-sm font-bold text-[#14263F] dark:text-white">
                    ₹{fund.nav.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#64748B] dark:text-slate-400">3Y CAGR</div>
                  <div className="font-data text-sm font-bold text-[#00D09C] dark:text-emerald-400">
                    +{fund.returns['3y']}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#64748B] dark:text-slate-400">5Y CAGR</div>
                  <div className="font-data text-sm font-bold text-[#00D09C] dark:text-emerald-400">
                    +{fund.returns['5y']}%
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400">
              <div>
                AUM: <span className="font-semibold font-data text-slate-700 dark:text-slate-200">₹{formatNumberIN(fund.aumCr)} Cr</span>
              </div>
              <div>
                Expense: <span className="font-semibold font-data text-slate-700 dark:text-slate-200">{fund.expenseRatio}%</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-semibold text-[#00D09C] dark:text-emerald-400 group-hover:underline"
              >
                <span>Details</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Fund Details Modal */}
      {selectedFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-[#00D09C] dark:text-emerald-400">
                    {selectedFund.category} · {selectedFund.subCategory}
                  </span>
                  <span className="text-xs text-[#64748B]">{selectedFund.amc}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#14263F] dark:text-white">
                  {selectedFund.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFund(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-[#64748B]">Current NAV</div>
                <div className="font-data text-base font-bold text-[#14263F] dark:text-white">
                  ₹{selectedFund.nav.toFixed(2)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-[#64748B]">3Y CAGR Return</div>
                <div className="font-data text-base font-bold text-[#00D09C] dark:text-emerald-400">
                  +{selectedFund.returns['3y']}%
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-[#64748B]">Expense Ratio</div>
                <div className="font-data text-base font-bold text-[#14263F] dark:text-white">
                  {selectedFund.expenseRatio}%
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-[#64748B]">Total AUM</div>
                <div className="font-data text-base font-bold text-[#14263F] dark:text-white">
                  ₹{formatNumberIN(selectedFund.aumCr)} Cr
                </div>
              </div>
            </div>

            {/* Fund Facts */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[#64748B]">Fund Manager:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedFund.fundManager}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[#64748B]">Risk Rating:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{selectedFund.riskLevel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[#64748B]">Minimum SIP Amount:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">₹{selectedFund.minSip} / month</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#64748B]">Exit Load:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-xs">{selectedFund.exitLoad}</span>
              </div>
            </div>

            {/* Top Stock Holdings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#14263F] dark:text-white">
                  Top Stock Portfolio Holdings
                </h4>
                <span className="text-[11px] text-[#64748B]">Top 10 holdings</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
                {selectedFund.topHoldings.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{stock.companyName}</div>
                      <div className="text-[10px] text-[#64748B]">{stock.sector}</div>
                    </div>
                    <div className="font-data font-bold text-[#14263F] dark:text-white">
                      {stock.weightPercent}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Close / Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedFund(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvestmentAmount(selectedFund.minSip);
                  setSelectedFund(null);
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                className="rounded-lg bg-[#00D09C] hover:bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition-colors"
              >
                Simulate SIP for this Fund
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
