import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellRing, Pause, Play, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { PriceAlertRule, StockInstrument } from '../types/financial';
import { formatINR, formatStockTickerLabel, formatTimestampIN } from '../utils/calculations';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs, EmptyState, LoadingSkeleton } from '../components/common/StateViews';

export function AlertsPage() {
  const { user, loading: authLoading, alerts, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [stockResults, setStockResults] = useState<StockInstrument[]>([]);
  const [stockSearch, setStockSearch] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockInstrument | null>(null);
  const [symbol, setSymbol] = useState('RELIANCE');
  const [conditionType, setConditionType] =
    useState<PriceAlertRule['conditionType']>('PRICE_BELOW');
  const [targetValue, setTargetValue] = useState('1300');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = stockSearch.trim();
    const timer = setTimeout(async () => {
      try {
        const res = await api.getStocks({ q: q || undefined, limit: 20 });
        setStockResults(res.stocks);
        if (!selectedStock && res.stocks.length > 0 && !q) {
          const def = res.stocks.find((s) => s.symbol === 'RELIANCE') || res.stocks[0];
          setSelectedStock(def);
          setSymbol(def.symbol);
          if (def.currentPrice) {
            setTargetValue(String(Math.round(def.currentPrice * 0.97)));
          }
        }
      } catch {
        // ignore transient search error
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [stockSearch]);

  if (authLoading) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <LoadingSkeleton rows={5} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Price Alerts' }]} />
        <EmptyState
          title="Sign in to manage Price Alerts"
          description="Create custom above/below target price and percentage movement alerts across all NSE and BSE Indian stocks."
          actionLabel="Sign In"
          onAction={() => navigate('/login')}
        />
      </main>
    );
  }

  const handleSelectStock = (stk: StockInstrument) => {
    setSelectedStock(stk);
    setSymbol(stk.symbol);
    setStockSearch(`${stk.companyName} (${formatStockTickerLabel(stk.symbol, stk.bseCode)})`);
    if (stk.currentPrice) {
      setTargetValue(String(Math.round(stk.currentPrice * 0.97)));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await api.createAlert({
        symbol: symbol.trim().toUpperCase(),
        conditionType,
        targetValue: Number(targetValue),
      });
      await refreshUserData();
      setSuccess(`Live alert rule saved for ${symbol.trim().toUpperCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store alert.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (rule: PriceAlertRule) => {
    await api.updateAlert(rule.id, { enabled: !rule.enabled });
    await refreshUserData();
  };

  const handleDelete = async (id: string) => {
    await api.deleteAlert(id);
    await refreshUserData();
  };

  const handleEvaluate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.evaluateAlerts();
      await refreshUserData();
      setSuccess(`Synced live NSE/BSE prices and evaluated rules. ${res.triggered} alert(s) triggered.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <SEOHead
        title="Price Alert System – All NSE & BSE Stock Target Alerts"
        description="Configure NSE and BSE stock target price and percentage movement alerts across all Indian listed equities with live market evaluation."
        noIndex
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Price Alerts' }]} />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
            Live NSE &amp; BSE Price Alert System
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Automated background tracking across 7,000+ NSE &amp; BSE listed Indian stocks with instant target and percentage alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEvaluate}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3.5 py-2 text-xs font-semibold cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> Sync Live &amp; Check Alerts
        </button>
      </div>

      {/* Create Alert Form */}
      <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#14263F] dark:text-white flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#059669]" /> Create New Alert Rule
          </h2>
          {selectedStock && (
            <span className="text-xs font-data text-[#64748B] flex items-center gap-2">
              <CompanyLogo
                size="xs"
                companyName={selectedStock.companyName}
                symbol={selectedStock.symbol}
                bseCode={selectedStock.bseCode}
                logoUrl={selectedStock.logoUrl}
                searchId={selectedStock.searchId}
              />
              <span>
                Selected:{' '}
                <strong className="font-sans text-[#152338] dark:text-white">
                  {selectedStock.companyName}
                </strong>{' '}
                ({formatStockTickerLabel(selectedStock.symbol, selectedStock.bseCode)} · {selectedStock.exchange}) · Live CMP:{' '}
                <strong className="text-[#059669]">{formatINR(selectedStock.currentPrice)}</strong>
              </span>
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-[#DC2626]">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs text-[#059669]">
            {success}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <label className="block sm:col-span-2">
              <span className="text-[#64748B]">Search Any NSE / BSE Stock (Symbol, Name, or BSE Code)</span>
              <div className="relative mt-1">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStockSearch(v);
                    if (/^[A-Za-z0-9&.-]{2,20}$/.test(v.trim())) {
                      setSymbol(v.trim().toUpperCase());
                    }
                  }}
                  placeholder="Type e.g. RELIANCE, ZOMATO, SUZLON, 539314..."
                  className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 pl-8 pr-3 py-2"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[#64748B]">Condition</span>
              <select
                value={conditionType}
                onChange={(e) =>
                  setConditionType(e.target.value as PriceAlertRule['conditionType'])
                }
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
              >
                <option value="PRICE_BELOW">Price falls below (₹)</option>
                <option value="PRICE_ABOVE">Price rises above (₹)</option>
                <option value="PCT_CHANGE_UP">Daily gain ≥ (%)</option>
                <option value="PCT_CHANGE_DOWN">Daily drop ≥ (%)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[#64748B]">
                {conditionType.startsWith('PCT') ? 'Threshold (%)' : 'Target Price (₹)'}
              </span>
              <input
                type="number"
                step="0.05"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data"
              />
            </label>
          </div>

          {stockResults.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {stockResults.slice(0, 10).map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => handleSelectStock(stk)}
                  className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] font-medium cursor-pointer transition-colors max-w-[260px] ${
                    symbol === stk.symbol
                      ? 'border-[#059669] bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400'
                      : 'border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 text-[#152338] dark:text-slate-200 hover:border-[#2563EB]'
                  }`}
                >
                  <CompanyLogo
                    size="xs"
                    companyName={stk.companyName}
                    symbol={stk.symbol}
                    bseCode={stk.bseCode}
                    logoUrl={stk.logoUrl}
                    searchId={stk.searchId}
                  />
                  <span className="font-semibold truncate">{stk.companyName}</span>
                  <span className="text-[#64748B] font-data shrink-0">
                    ({formatStockTickerLabel(stk.symbol, stk.bseCode)})
                  </span>
                  <span className="text-[#64748B] font-data shrink-0">{formatINR(stk.currentPrice)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#64748B]">
              Active symbol to save: <strong className="font-data text-[#152338] dark:text-white">{symbol}</strong>
            </span>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-5 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
            >
              Save Alert for {symbol}
            </button>
          </div>
        </form>
      </section>

      {/* Active & Historical Alerts */}
      {alerts.length === 0 ? (
        <EmptyState
          title="No price alerts configured"
          description="Search any NSE or BSE Indian stock above to monitor target prices or daily percentage moves."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <CompanyLogo
                    size="sm"
                    companyName={rule.companyName}
                    symbol={rule.symbol}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/stock/${rule.symbol}`}
                        className="text-sm font-bold text-[#152338] dark:text-white hover:text-[#2563EB]"
                      >
                        {rule.companyName}
                      </Link>
                      <span className="text-xs font-data text-[#64748B]">
                        ({formatStockTickerLabel(rule.symbol)})
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          rule.status === 'TRIGGERED'
                            ? 'bg-emerald-50 text-[#059669] border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900'
                            : rule.enabled
                              ? 'bg-blue-50 text-[#2563EB] border-blue-200 dark:bg-blue-950/50 dark:border-blue-900'
                              : 'bg-slate-100 text-[#64748B] border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                      >
                        {rule.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] mt-1 font-data">
                      Rule: {rule.conditionType.replace(/_/g, ' ')}{' '}
                      {rule.conditionType.startsWith('PCT') ? `${rule.targetValue}%` : formatINR(rule.targetValue)}
                      {rule.baselinePrice !== null && ` · Baseline: ${formatINR(rule.baselinePrice)}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(rule)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium cursor-pointer"
                  >
                    {rule.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {rule.enabled ? 'Pause' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id)}
                    aria-label="Delete alert"
                    className="p-1.5 rounded-md border border-[#E2E8F0] dark:border-slate-700 text-[#DC2626] hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {rule.history.length > 0 && (
                <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px] text-[#64748B] space-y-1">
                  {rule.history.slice(0, 3).map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <span>{h.event}</span>
                      <span className="font-data">{formatTimestampIN(h.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
