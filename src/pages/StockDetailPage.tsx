import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BellPlus, Building2, RefreshCw } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { IPOOffering, StockInstrument } from '../types/financial';
import {
  formatCompactNumberIN,
  formatCrores,
  formatDateIN,
  formatINR,
  formatNumberIN,
  formatPercent,
  formatStockTickerLabel,
  formatTimestampIN,
} from '../utils/calculations';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { SEOHead } from '../components/common/SEOHead';
import {
  Breadcrumbs,
  ErrorRetryState,
  LoadingSkeleton,
} from '../components/common/StateViews';
import { DataQualityBadge } from '../components/common/DataQualityBadge';
import { WatchlistButton } from '../components/common/WatchlistButton';
import { useLiveMarketStream } from '../hooks/useLiveMarketStream';

const CHART_RANGES = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
  { label: 'All', value: 'max' },
] as const;

export function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [stock, setStock] = useState<StockInstrument | null>(null);
  const [linkedIpo, setLinkedIpo] = useState<IPOOffering | null>(null);
  const [range, setRange] = useState<string>('3mo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState<'PRICE_ABOVE' | 'PRICE_BELOW'>('PRICE_BELOW');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [alertErr, setAlertErr] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [finBasis, setFinBasis] = useState<'CONSOLIDATED' | 'STANDALONE'>('CONSOLIDATED');
  const [finFreq, setFinFreq] = useState<'yearly' | 'quarterly'>('yearly');

  const fetchStock = async (targetRange = range, background = false) => {
    if (!symbol) return;
    if (!background) setLoading(true);
    setError(null);
    try {
      const res = await api.getStockBySymbol(symbol, targetRange);
      setStock(res.stock);
      setLinkedIpo(res.linkedIpo);
      if (res.stock.currentPrice && !alertPrice) {
        setAlertPrice(String(Math.round(res.stock.currentPrice * 0.97)));
      }
      if (
        res.stock.financialStatements?.length &&
        !res.stock.financialStatements.some((f) => f.basis === finBasis)
      ) {
        setFinBasis(res.stock.financialStatements[0].basis);
      }
    } catch (err) {
      if (!background) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to fetch quote for this security.'
        );
      }
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    setAlertPrice('');
    fetchStock(range, false);
  }, [symbol, range]);

  useEffect(() => {
    if (!autoRefresh || !symbol) return;
    const timer = setInterval(() => {
      fetchStock(range, true);
    }, 15_000);
    return () => clearInterval(timer);
  }, [autoRefresh, symbol, range]);

  useLiveMarketStream({
    enabled: autoRefresh && Boolean(symbol),
    onStocks: () => {
      void fetchStock(range, true);
    },
  });

  const handleQuickAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    setAlertErr(null);
    if (!user) {
      navigate('/login');
      return;
    }
    if (!stock) return;
    try {
      await api.createAlert({
        symbol: stock.symbol,
        conditionType: alertType,
        targetValue: Number(alertPrice),
      });
      await refreshUserData();
      setAlertMsg(
        `Alert saved: Notify when ${stock.symbol} moves ${
          alertType === 'PRICE_ABOVE' ? 'above' : 'below'
        } ₹${alertPrice}.`
      );
    } catch (err) {
      setAlertErr(err instanceof Error ? err.message : 'Failed to create alert.');
    }
  };

  if (loading && !stock) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <LoadingSkeleton rows={8} />
      </main>
    );
  }

  if (error || !stock) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Live Stocks', to: '/live-prices' }]} />
        <ErrorRetryState
          message={error || 'Security unavailable.'}
          onRetry={() => fetchStock(range, false)}
        />
      </main>
    );
  }

  const hasQuote = stock.currentPrice !== null && stock.previousClose !== null;
  const diff = hasQuote ? stock.currentPrice! - stock.previousClose! : null;
  const diffPct =
    hasQuote && stock.previousClose! > 0 ? (diff! / stock.previousClose!) * 100 : null;
  const isUp = (diff ?? 0) >= 0;

  const activeFin =
    stock.financialStatements?.find((f) => f.basis === finBasis) ||
    stock.financialStatements?.[0];

  const finChartData = activeFin
    ? (finFreq === 'yearly' ? activeFin.revenueYearly : activeFin.revenueQuarterly).map((rev) => {
        const profList = finFreq === 'yearly' ? activeFin.profitYearly : activeFin.profitQuarterly;
        const prof = profList.find((p) => p.period === rev.period);
        const nw =
          finFreq === 'yearly'
            ? activeFin.netWorthYearly.find((n) => n.period === rev.period)
            : undefined;
        return {
          period: rev.period,
          Revenue: rev.valueCr,
          Profit: prof?.valueCr ?? null,
          NetWorth: nw?.valueCr ?? null,
        };
      })
    : [];

  return (
    <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6">
      <SEOHead
        title={`${stock.symbol} (${stock.companyName}) Live Share Price, Financials & Shareholding`}
        description={`Live NSE & BSE share price, circuit limits, financials, shareholding pattern, peers, and Zerodha/NSE registry data for ${stock.companyName} (${stock.symbol}).`}
      />
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Live Stocks', to: '/live-prices' },
          { label: stock.companyName },
        ]}
      />

      {/* Quote Header */}
      <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-start gap-4">
              <CompanyLogo
                size="lg"
                companyName={stock.companyName}
                symbol={stock.symbol}
                bseCode={stock.bseCode}
                logoUrl={stock.logoUrl}
                searchId={stock.searchId}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                  <span className="font-semibold text-[#152338] dark:text-slate-200">{stock.exchange}</span>
                  <span>·</span>
                  <span>BSE {stock.bseCode}</span>
                  {stock.registry?.nseSeries && (
                    <>
                      <span>·</span>
                      <span>Series: {stock.registry.nseSeries}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{stock.sector}</span>
                  <span>·</span>
                  <span>ISIN: {stock.isin}</span>
                  {stock.registry?.isFnoEnabled && (
                    <>
                      <span>·</span>
                      <span className="font-semibold text-[#2563EB] dark:text-blue-400">F&amp;O</span>
                    </>
                  )}
                  <DataQualityBadge status={stock.provenance.qualityStatus} compact />
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white mt-1">
                  {stock.companyName}{' '}
                  <span className="text-[#64748B] dark:text-slate-400 font-data text-xl">
                    ({formatStockTickerLabel(stock.symbol, stock.bseCode)})
                  </span>
                </h1>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="font-data text-3xl font-bold text-[#14263F] dark:text-white">
                {formatINR(stock.currentPrice)}
              </span>
              {diff !== null && diffPct !== null && (
                <span
                  className={`font-data text-sm font-semibold ${
                    isUp ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#DC2626] dark:text-red-400'
                  }`}
                >
                  {isUp ? '+' : ''}
                  {diff.toFixed(2)} ({formatPercent(diffPct)})
                </span>
              )}
              <span className="text-xs text-[#64748B] dark:text-slate-400 font-data">
                Updated: {formatTimestampIN(stock.provenance.retrievedAt)}
              </span>
            </div>
            {stock.dataSourcesUsed && stock.dataSourcesUsed.length > 0 && (
              <div className="mt-2 text-[11px] text-[#64748B] dark:text-slate-400">
                Active Sources: <span className="font-medium text-[#152338] dark:text-slate-300">{stock.dataSourcesUsed.join(' · ')}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <WatchlistButton itemType="stock" itemKey={stock.symbol} label={stock.companyName} />
            <button
              type="button"
              onClick={() => setAutoRefresh((p) => !p)}
              className={`rounded-md border px-3 py-2 text-xs font-semibold cursor-pointer ${
                autoRefresh
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400'
                  : 'border-[#E2E8F0] dark:border-slate-700 text-[#64748B]'
              }`}
            >
              Live: {autoRefresh ? '15s' : 'Off'}
            </button>
            <button
              type="button"
              onClick={() => fetchStock(range, false)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] dark:border-slate-700 px-3 py-2 text-xs font-medium text-[#152338] dark:text-slate-200 hover:border-[#14263F] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Quote
            </button>
          </div>
        </div>

        {/* Key Quote Strip */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <div className="text-[#64748B]">Previous Close</div>
            <div className="font-data font-bold text-sm mt-0.5">{formatINR(stock.previousClose)}</div>
          </div>
          <div>
            <div className="text-[#64748B]">Open</div>
            <div className="font-data font-bold text-sm mt-0.5">{formatINR(stock.open)}</div>
          </div>
          <div>
            <div className="text-[#64748B]">Day Range</div>
            <div className="font-data font-semibold text-sm mt-0.5">
              {stock.dayLow !== null && stock.dayHigh !== null
                ? `₹${stock.dayLow.toFixed(2)} – ₹${stock.dayHigh.toFixed(2)}`
                : 'Unavailable'}
            </div>
          </div>
          <div>
            <div className="text-[#64748B]">52-Week Range</div>
            <div className="font-data font-semibold text-sm mt-0.5">
              {stock.week52Low !== null && stock.week52High !== null
                ? `₹${stock.week52Low.toFixed(2)} – ₹${stock.week52High.toFixed(2)}`
                : 'Unavailable'}
            </div>
          </div>
          <div>
            <div className="text-[#64748B]">Volume</div>
            <div className="font-data font-bold text-sm mt-0.5">
              {formatCompactNumberIN(stock.volume)}
            </div>
          </div>
          <div>
            <div className="text-[#64748B]">Market Cap</div>
            <div className="font-data font-bold text-sm mt-0.5">
              {formatCrores(stock.marketCapCr)}
            </div>
          </div>
        </div>

        {/* Dual Exchange Live Order Book & Circuit Limits */}
        {(stock.nseQuote || stock.bseQuote) && (
          <div className="mt-5 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {stock.nseQuote && (
              <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#14263F] dark:text-white">
                      NSE Live ({stock.symbol})
                    </div>
                    <div className="text-[11px] text-[#64748B] font-data mt-0.5">
                      Vol: {formatCompactNumberIN(stock.nseQuote.volume)} · Last Trade: {formatTimestampIN(stock.nseQuote.lastTradeTime)}
                    </div>
                  </div>
                  <div className="text-right font-data">
                    <div className="text-base font-bold text-[#14263F] dark:text-white">
                      {formatINR(stock.nseQuote.ltp)}
                    </div>
                    {stock.nseQuote.dayChange !== null && stock.nseQuote.dayChangePct !== null && (
                      <div className={stock.nseQuote.dayChange >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {stock.nseQuote.dayChange >= 0 ? '+' : ''}
                        {stock.nseQuote.dayChange.toFixed(2)} ({formatPercent(stock.nseQuote.dayChangePct)})
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px] font-data text-[#64748B]">
                  <div className="col-span-2 sm:col-span-1">
                    Lower / Upper Circuit:{' '}
                    <span className="text-[#152338] dark:text-slate-200 font-semibold">
                      {stock.nseQuote.lowerCircuit && stock.nseQuote.upperCircuit
                        ? `₹${stock.nseQuote.lowerCircuit} / ₹${stock.nseQuote.upperCircuit}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    Buy Qty:{' '}
                    <span className="text-[#16A34A] font-semibold">
                      {stock.nseQuote.totalBuyQty !== null && stock.nseQuote.totalBuyQty !== undefined
                        ? formatCompactNumberIN(stock.nseQuote.totalBuyQty)
                        : '—'}
                    </span>
                  </div>
                  <div>
                    Sell Qty:{' '}
                    <span className="text-[#DC2626] font-semibold">
                      {stock.nseQuote.totalSellQty !== null && stock.nseQuote.totalSellQty !== undefined
                        ? formatCompactNumberIN(stock.nseQuote.totalSellQty)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {stock.bseQuote && (
              <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#14263F] dark:text-white">
                      BSE Live ({stock.bseCode})
                    </div>
                    <div className="text-[11px] text-[#64748B] font-data mt-0.5">
                      Vol: {formatCompactNumberIN(stock.bseQuote.volume)} · Last Trade: {formatTimestampIN(stock.bseQuote.lastTradeTime)}
                    </div>
                  </div>
                  <div className="text-right font-data">
                    <div className="text-base font-bold text-[#14263F] dark:text-white">
                      {formatINR(stock.bseQuote.ltp)}
                    </div>
                    {stock.bseQuote.dayChange !== null && stock.bseQuote.dayChangePct !== null && (
                      <div className={stock.bseQuote.dayChange >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {stock.bseQuote.dayChange >= 0 ? '+' : ''}
                        {stock.bseQuote.dayChange.toFixed(2)} ({formatPercent(stock.bseQuote.dayChangePct)})
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px] font-data text-[#64748B]">
                  <div className="col-span-2 sm:col-span-1">
                    Lower / Upper Circuit:{' '}
                    <span className="text-[#152338] dark:text-slate-200 font-semibold">
                      {stock.bseQuote.lowerCircuit && stock.bseQuote.upperCircuit
                        ? `₹${stock.bseQuote.lowerCircuit} / ₹${stock.bseQuote.upperCircuit}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    Buy Qty:{' '}
                    <span className="text-[#16A34A] font-semibold">
                      {stock.bseQuote.totalBuyQty !== null && stock.bseQuote.totalBuyQty !== undefined
                        ? formatCompactNumberIN(stock.bseQuote.totalBuyQty)
                        : '—'}
                    </span>
                  </div>
                  <div>
                    Sell Qty:{' '}
                    <span className="text-[#DC2626] font-semibold">
                      {stock.bseQuote.totalSellQty !== null && stock.bseQuote.totalSellQty !== undefined
                        ? formatCompactNumberIN(stock.bseQuote.totalSellQty)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Chart + Quick Price Alert + Fundamental Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#152338] dark:text-white">
                Historical Price Performance
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Exchange-derived historical close series ({stock.historicalSeries.length} sessions)
              </p>
            </div>
            <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-[#F6F8FB] dark:bg-slate-900 p-1 border border-[#E2E8F0] dark:border-slate-800">
              {CHART_RANGES.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setRange(r.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    range === r.value
                      ? 'bg-white dark:bg-[#1E3554] text-[#14263F] dark:text-white shadow-xs'
                      : 'text-[#64748B] dark:text-slate-400'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {stock.historicalSeries.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stock.historicalSeries}>
                  <defs>
                    <linearGradient id="stockFillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? '#059669' : '#DC2626'} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={isUp ? '#059669' : '#DC2626'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.45} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => formatDateIN(String(d))}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    minTickGap={24}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `₹${v}`}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    width={62}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [formatINR(Number(value)), 'Close']}
                    labelFormatter={(l) => formatDateIN(String(l))}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={isUp ? '#059669' : '#DC2626'}
                    strokeWidth={2}
                    fill="url(#stockFillGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-[#64748B]">
              Historical series unavailable for this timeframe.
            </div>
          )}
        </div>

        {/* Price Alert & Fundamentals */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BellPlus className="w-4 h-4 text-[#059669]" />
              <h2 className="text-sm font-semibold text-[#152338] dark:text-white">
                Set Price Alert for {stock.companyName}
              </h2>
            </div>
            <form onSubmit={handleQuickAlert} className="space-y-3 text-xs">
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as 'PRICE_ABOVE' | 'PRICE_BELOW')}
                className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-[#152338] dark:text-slate-100"
              >
                <option value="PRICE_BELOW">Price falls below (≤)</option>
                <option value="PRICE_ABOVE">Price rises above (≥)</option>
              </select>
              <input
                type="number"
                step="0.05"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder="Target price in ₹"
                required
                className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-[#152338] dark:text-slate-100"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[#14263F] dark:bg-[#2563EB] py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
              >
                {user ? 'Create Price Alert' : 'Sign In to Create Alert'}
              </button>
              {alertMsg && <p className="text-[#16A34A] font-medium">{alertMsg}</p>}
              {alertErr && <p className="text-[#DC2626] font-medium">{alertErr}</p>}
            </form>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5">
            <h2 className="text-sm font-semibold text-[#152338] dark:text-white mb-1">
              Fundamental &amp; Valuation Ratios
            </h2>
            <p className="text-[11px] text-[#64748B] mb-3">
              {stock.fundamentals.reportingPeriod} · {stock.fundamentals.source}
            </p>
            <dl className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-xs">
              {[
                { label: 'P/E Ratio (TTM)', val: stock.fundamentals.pe !== null ? `${stock.fundamentals.pe}x` : 'Unavailable' },
                { label: 'Industry P/E', val: stock.companyProfile?.industryPe !== null && stock.companyProfile?.industryPe !== undefined ? `${stock.companyProfile.industryPe}x` : 'Unavailable' },
                { label: 'P/B Ratio', val: stock.fundamentals.pb !== null ? `${stock.fundamentals.pb}x` : 'Unavailable' },
                { label: 'EPS (TTM)', val: stock.companyProfile?.epsTtm !== null && stock.companyProfile?.epsTtm !== undefined ? formatINR(stock.companyProfile.epsTtm) : 'Unavailable' },
                { label: 'Book Value', val: stock.companyProfile?.bookValue !== null && stock.companyProfile?.bookValue !== undefined ? formatINR(stock.companyProfile.bookValue) : 'Unavailable' },
                { label: 'ROE', val: stock.fundamentals.roePct !== null ? `${stock.fundamentals.roePct}%` : 'Unavailable' },
                { label: 'Debt-to-Equity', val: stock.fundamentals.debtToEquity !== null ? `${stock.fundamentals.debtToEquity}x` : 'N/A' },
                { label: 'Dividend Yield', val: stock.fundamentals.dividendYieldPct !== null ? `${stock.fundamentals.dividendYieldPct}%` : 'Unavailable' },
                { label: 'Face Value', val: stock.registry?.faceValue !== null && stock.registry?.faceValue !== undefined ? `₹${stock.registry.faceValue}` : 'Unavailable' },
              ].map((row) => (
                <div key={row.label} className="py-2 flex items-center justify-between">
                  <dt className="text-[#64748B]">{row.label}</dt>
                  <dd className="font-data font-semibold text-[#152338] dark:text-slate-100">
                    {row.val}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Financial Statements (Revenue, Profit & Net Worth) */}
      {activeFin && finChartData.length > 0 && (
        <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#14263F] dark:text-white">
                Financial Performance ({finBasis === 'CONSOLIDATED' ? 'Consolidated' : 'Standalone'})
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Revenue, net profit, and net worth in ₹ Crores sourced from company exchange filings.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {stock.financialStatements && stock.financialStatements.length > 1 && (
                <div className="inline-flex rounded-lg bg-[#F6F8FB] dark:bg-slate-900 p-1 border border-[#E2E8F0] dark:border-slate-800">
                  {stock.financialStatements.map((fs) => (
                    <button
                      key={fs.basis}
                      type="button"
                      onClick={() => setFinBasis(fs.basis)}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        finBasis === fs.basis
                          ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {fs.basis === 'CONSOLIDATED' ? 'Consolidated' : 'Standalone'}
                    </button>
                  ))}
                </div>
              )}
              <div className="inline-flex rounded-lg bg-[#F6F8FB] dark:bg-slate-900 p-1 border border-[#E2E8F0] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFinFreq('yearly')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    finFreq === 'yearly' ? 'bg-[#14263F] text-white dark:bg-[#2563EB]' : 'text-[#64748B]'
                  }`}
                >
                  Yearly
                </button>
                <button
                  type="button"
                  onClick={() => setFinFreq('quarterly')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    finFreq === 'quarterly' ? 'bg-[#14263F] text-white dark:bg-[#2563EB]' : 'text-[#64748B]'
                  }`}
                >
                  Quarterly
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.45} />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} width={64} />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      `₹${formatNumberIN(Number(value), 0)} Cr`,
                      String(name),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Revenue" fill="#14263F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Profit" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-5 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-data">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 text-[#64748B] font-sans">
                    <th className="py-2 pr-3">Period</th>
                    <th className="py-2 px-3 text-right">Revenue (Cr)</th>
                    <th className="py-2 px-3 text-right">Profit (Cr)</th>
                    {finFreq === 'yearly' && <th className="py-2 pl-3 text-right">Net Worth (Cr)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {finChartData.map((row) => (
                    <tr key={row.period}>
                      <td className="py-2 pr-3 font-semibold font-sans">{row.period}</td>
                      <td className="py-2 px-3 text-right">₹{formatNumberIN(row.Revenue, 0)}</td>
                      <td className="py-2 px-3 text-right text-[#059669] dark:text-emerald-400">
                        {row.Profit !== null ? `₹${formatNumberIN(row.Profit, 0)}` : '—'}
                      </td>
                      {finFreq === 'yearly' && (
                        <td className="py-2 pl-3 text-right">
                          {row.NetWorth !== null ? `₹${formatNumberIN(row.NetWorth, 0)}` : '—'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Shareholding Pattern & Company Overview + Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {stock.shareholding && stock.shareholding.length > 0 && (
          <section className="lg:col-span-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#14263F] dark:text-white">
                Shareholding Pattern (%)
              </h2>
              <p className="text-xs text-[#64748B]">
                Quarterly ownership distribution across Promoters, FIIs, DIIs, and Public.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-data">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 text-[#64748B] font-sans">
                    <th className="py-2 pr-3">Quarter</th>
                    <th className="py-2 px-2 text-right">Promoters</th>
                    <th className="py-2 px-2 text-right">FII</th>
                    <th className="py-2 px-2 text-right">DII</th>
                    <th className="py-2 pl-2 text-right">Public</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {stock.shareholding.map((q) => (
                    <tr key={q.quarter}>
                      <td className="py-2.5 pr-3 font-sans font-semibold">{q.quarter}</td>
                      <td className="py-2.5 px-2 text-right">{q.promoters ?? '—'}%</td>
                      <td className="py-2.5 px-2 text-right">{q.fii ?? '—'}%</td>
                      <td className="py-2.5 px-2 text-right">{q.dii ?? '—'}%</td>
                      <td className="py-2.5 pl-2 text-right">{q.public ?? '—'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section
          className={`${
            stock.shareholding && stock.shareholding.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'
          } rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#059669]" />
            <h2 className="text-base font-bold text-[#14263F] dark:text-white">
              Company Profile &amp; Exchange Registry
            </h2>
          </div>

          {stock.companyProfile?.businessSummary && (
            <p className="text-xs text-[#64748B] dark:text-slate-300 leading-relaxed">
              {stock.companyProfile.businessSummary}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-xs">
            <div>
              <div className="text-[#64748B]">Managing Director / CEO</div>
              <div className="font-semibold text-[#152338] dark:text-slate-100 mt-0.5">
                {stock.companyProfile?.managingDirector || stock.companyProfile?.ceo || 'Unavailable'}
              </div>
            </div>
            <div>
              <div className="text-[#64748B]">Founded Year</div>
              <div className="font-data font-semibold mt-0.5">
                {stock.companyProfile?.foundedYear || 'Unavailable'}
              </div>
            </div>
            <div>
              <div className="text-[#64748B]">NSE Listing Date</div>
              <div className="font-data font-semibold mt-0.5">
                {stock.registry?.nseListingDate || 'Unavailable'}
              </div>
            </div>
            <div>
              <div className="text-[#64748B]">Market Lot / Tick Size</div>
              <div className="font-data font-semibold mt-0.5">
                {stock.registry?.marketLot ?? 1} share · ₹{stock.registry?.tickSize ?? 0.05}
              </div>
            </div>
            <div>
              <div className="text-[#64748B]">Zerodha NSE Token</div>
              <div className="font-data font-semibold mt-0.5">
                {stock.registry?.zerodhaNseToken ?? 'Unavailable'}
              </div>
            </div>
            <div>
              <div className="text-[#64748B]">Zerodha BSE Token</div>
              <div className="font-data font-semibold mt-0.5">
                {stock.registry?.zerodhaBseToken ?? 'Unavailable'}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Peer Comparison & Mutual Funds Invested */}
      {(stock.peers?.length || stock.fundsInvested?.length) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {stock.peers && stock.peers.length > 0 && (
            <section className="lg:col-span-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3">
              <h2 className="text-base font-bold text-[#14263F] dark:text-white">
                Sector Peer Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-slate-800 text-[#64748B]">
                      <th className="py-2 pr-3">Company</th>
                      <th className="py-2 px-2 text-right">M.Cap (Cr)</th>
                      <th className="py-2 px-2 text-right">P/E</th>
                      <th className="py-2 pl-2 text-right">P/B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 font-data">
                    {stock.peers.map((p) => (
                      <tr key={p.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 pr-3 font-sans">
                          <div className="flex items-center gap-2 min-w-0">
                            <CompanyLogo
                              size="xs"
                              companyName={p.companyName}
                              symbol={p.symbol}
                              logoUrl={p.logoUrl}
                            />
                            <div className="min-w-0">
                              <Link
                                to={`/stock/${p.symbol}`}
                                className="font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB] block truncate max-w-[180px]"
                              >
                                {p.companyName}
                              </Link>
                              <div className="text-[11px] font-data text-[#64748B] truncate">
                                {formatStockTickerLabel(p.symbol)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {p.marketCapCr !== null ? `₹${formatNumberIN(p.marketCapCr, 0)}` : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-right">{p.pe ?? '—'}</td>
                        <td className="py-2.5 pl-2 text-right">{p.pb ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {stock.fundsInvested && stock.fundsInvested.length > 0 && (
            <section className="lg:col-span-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3">
              <h2 className="text-base font-bold text-[#14263F] dark:text-white">
                Top Mutual Funds Invested
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-slate-800 text-[#64748B]">
                      <th className="py-2 pr-3">Fund Scheme</th>
                      <th className="py-2 px-2 text-right">AUM %</th>
                      <th className="py-2 px-2 text-right">1Y Ret</th>
                      <th className="py-2 pl-2 text-right">3Y Ret</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 font-data">
                    {stock.fundsInvested.map((mf) => (
                      <tr key={mf.name}>
                        <td className="py-2.5 pr-3 font-sans font-medium text-[#152338] dark:text-slate-200 max-w-[230px] truncate">
                          {mf.name}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {mf.investedAumPct !== null ? `${mf.investedAumPct}%` : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {mf.return1y !== null ? formatPercent(mf.return1y) : '—'}
                        </td>
                        <td className="py-2.5 pl-2 text-right">
                          {mf.return3y !== null ? formatPercent(mf.return3y) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Corporate Announcements & Linked IPO History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5">
          <h2 className="text-base font-semibold text-[#152338] dark:text-white mb-3">
            Corporate Announcements &amp; Exchange Filings
          </h2>
          {stock.announcements.length === 0 ? (
            <p className="text-xs text-[#64748B]">
              Check NSE/BSE exchange filing feeds for latest board announcements on {stock.symbol}.
            </p>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
              {stock.announcements.map((a) => (
                <div key={a.id} className="py-3 text-xs">
                  <div className="text-[#64748B] font-data">
                    {formatDateIN(a.date)} · {a.category} · {a.source}
                  </div>
                  <div className="font-medium text-[#152338] dark:text-slate-100 mt-0.5">
                    {a.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {linkedIpo && (
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#152338] dark:text-white">
                IPO Listing History
              </h2>
              <Link
                to={`/ipo/${linkedIpo.slug}`}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Full IPO Dossier →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div>
                <div className="text-[#64748B]">IPO Issue Price</div>
                <div className="font-data font-bold text-sm mt-0.5">
                  {formatINR(linkedIpo.listing.issuePrice)}
                </div>
              </div>
              <div>
                <div className="text-[#64748B]">Listing Day Price</div>
                <div className="font-data font-bold text-sm mt-0.5">
                  {formatINR(linkedIpo.listing.actualListingPrice)}
                </div>
              </div>
              <div>
                <div className="text-[#64748B]">Listing Date</div>
                <div className="font-data font-semibold text-sm mt-0.5">
                  {formatDateIN(linkedIpo.listing.listingDate)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
