import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellRing, Pause, Play, RefreshCw, Search, Trash2, Zap, ShieldCheck, ArrowUpRight } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<'alerts' | 'gtt'>('alerts');

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

  const [alertStocksBySym, setAlertStocksBySym] = useState<Record<string, StockInstrument>>({});

  // WhatsApp Alert State
  const [whatsappPhone, setWhatsappPhone] = useState(user?.phone || '');
  const [whatsappBusy, setWhatsappBusy] = useState(false);
  const [whatsappMsg, setWhatsappMsg] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.phone && !whatsappPhone) {
      setWhatsappPhone(user.phone);
    }
  }, [user]);

  const handleTestWhatsAppAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = whatsappPhone.trim();
    if (!clean) {
      setWhatsappError('Please enter your WhatsApp mobile number.');
      return;
    }
    setWhatsappBusy(true);
    setWhatsappMsg(null);
    setWhatsappError(null);
    try {
      const res = await api.testWhatsAppAlert({
        phone: clean,
        symbol: symbol || 'RELIANCE',
      });
      if (res.ok || res.success) {
        setWhatsappMsg(`✅ ${res.message}`);
        if (res.clickToChatUrl) {
          setWhatsappUrl(res.clickToChatUrl);
        }
      } else {
        setWhatsappError(res.message || 'Failed to dispatch WhatsApp alert.');
      }
    } catch (err: any) {
      setWhatsappError(err?.message || 'Network error dispatching WhatsApp alert.');
    } finally {
      setWhatsappBusy(false);
    }
  };

  // Angel One SmartAPI GTT (Good-Till-Triggered) State
  const [gttRules, setGttRules] = useState<any[]>([]);
  const [gttLoading, setGttLoading] = useState(false);
  const [gttError, setGttError] = useState<string | null>(null);
  const [gttSuccess, setGttSuccess] = useState<string | null>(null);

  const [gttExchange, setGttExchange] = useState<'NSE' | 'BSE'>('NSE');
  const [gttTransactionType, setGttTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [gttProductType, setGttProductType] = useState<'DELIVERY' | 'MARGIN'>('DELIVERY');
  const [gttPrice, setGttPrice] = useState('195');
  const [gttTriggerPrice, setGttTriggerPrice] = useState('196');
  const [gttQty, setGttQty] = useState('1');
  const [gttDisclosedQty, setGttDisclosedQty] = useState('1');
  const [gttSymbolToken, setGttSymbolToken] = useState('3045');

  const loadGttRules = async () => {
    setGttLoading(true);
    setGttError(null);
    try {
      const res = await api.getAngelGttRules();
      if (res.ok && Array.isArray(res.data)) {
        setGttRules(res.data);
      }
    } catch (err: any) {
      setGttError(err?.message || 'Failed to load GTT rules from SmartAPI');
    } finally {
      setGttLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gtt') {
      loadGttRules();
    }
  }, [activeTab]);

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
            setGttPrice(String(Math.round(def.currentPrice * 0.97)));
            setGttTriggerPrice(String(Math.round(def.currentPrice * 0.98)));
          }
        }
      } catch {
        // ignore transient search error
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [stockSearch]);

  useEffect(() => {
    if (!user || alerts.length === 0) return;
    const missing = Array.from(new Set(alerts.map((a) => a.symbol.toUpperCase()))).filter(
      (sym) => !alertStocksBySym[sym]
    );
    if (missing.length === 0) return;
    Promise.allSettled(missing.map((sym) => api.getStockBySymbol(sym, '1mo'))).then((settled) => {
      const additions: Record<string, StockInstrument> = {};
      for (const r of settled) {
        if (r.status === 'fulfilled' && r.value.stock) {
          additions[r.value.stock.symbol.toUpperCase()] = r.value.stock;
        }
      }
      if (Object.keys(additions).length > 0) {
        setAlertStocksBySym((prev) => ({ ...prev, ...additions }));
      }
    });
  }, [user, alerts]);

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
      setGttPrice(String(Math.round(stk.currentPrice * 0.97)));
      setGttTriggerPrice(String(Math.round(stk.currentPrice * 0.98)));
    }
    if (stk.exchange === 'BSE') {
      setGttExchange('BSE');
    } else {
      setGttExchange('NSE');
    }
  };

  const handleCreateGtt = async (e: React.FormEvent) => {
    e.preventDefault();
    setGttError(null);
    setGttSuccess(null);
    setBusy(true);
    try {
      const res = await api.createAngelGttRule({
        tradingsymbol: `${symbol.trim().toUpperCase()}-EQ`,
        symboltoken: gttSymbolToken || '3045',
        exchange: gttExchange,
        transactiontype: gttTransactionType,
        producttype: gttProductType,
        price: Number(gttPrice),
        qty: Number(gttQty),
        triggerprice: Number(gttTriggerPrice),
        disclosedqty: Number(gttDisclosedQty || gttQty),
      });
      if (res.ok && res.status) {
        setGttSuccess(`GTT Rule created successfully with ID: ${res.data?.id ?? 'Active'}`);
        await loadGttRules();
      } else {
        setGttError(res.message || 'Failed to create GTT rule on SmartAPI');
      }
    } catch (err: any) {
      setGttError(err?.message || 'Failed to create GTT rule on SmartAPI');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelGtt = async (rule: any) => {
    setGttError(null);
    setGttSuccess(null);
    setBusy(true);
    try {
      const res = await api.cancelAngelGttRule({
        id: rule.id,
        symboltoken: String(rule.symboltoken || gttSymbolToken),
        exchange: rule.exchange || gttExchange,
      });
      if (res.ok && res.status) {
        setGttSuccess(`GTT Rule #${rule.id} cancelled successfully.`);
        await loadGttRules();
      } else {
        setGttError(res.message || 'Failed to cancel GTT rule');
      }
    } catch (err: any) {
      setGttError(err?.message || 'Failed to cancel GTT rule');
    } finally {
      setBusy(false);
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

      {/* Tab Switcher: In-App Alerts vs Angel One SmartAPI GTT Orders */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-[#14263F] dark:bg-blue-600 text-white shadow-sm'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#14263F] dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>In-App Price Alerts ({alerts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gtt')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gtt'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
              : 'text-[#64748B] dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 bg-slate-100 dark:bg-slate-800/60'
          }`}
        >
          <img
            src="/assets/movers/angel-one.png"
            alt="Angel One"
            className="w-4 h-4 rounded object-contain bg-white p-0.5"
          />
          <span>Angel One SmartAPI GTT Orders {gttRules.length > 0 && `(${gttRules.length})`}</span>
        </button>
      </div>

      {/* WhatsApp Alerts Connection & Test Card */}
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900/40 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Live WhatsApp Alert Channel
              </span>
            </div>
            <h3 className="text-base font-bold text-[#14263F] dark:text-white mt-1">
              Direct WhatsApp Price &amp; IPO Notifications
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Receive real-time notifications directly on your mobile WhatsApp when your target prices trigger, IPOs open for bidding, or GMP jumps &gt;15%.
            </p>
          </div>

          <form onSubmit={handleTestWhatsAppAlert} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => {
                  setWhatsappPhone(e.target.value);
                  setWhatsappMsg(null);
                  setWhatsappError(null);
                }}
                placeholder="WhatsApp Number (e.g. 9876543210)"
                className="w-full sm:w-64 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1522] text-[#14263F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00D09C]"
              />
            </div>
            <button
              type="submit"
              disabled={whatsappBusy}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <span>{whatsappBusy ? 'Sending...' : '📲 Send Test Alert'}</span>
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#14263F] hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span>Open in WhatsApp</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </form>
        </div>

        {whatsappMsg && (
          <p className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {whatsappMsg}
          </p>
        )}
        {whatsappError && (
          <p className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {whatsappError}
          </p>
        )}
      </div>

      {activeTab === 'alerts' ? (
        <>
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
          {alerts.map((rule) => {
            const matchedStk =
              alertStocksBySym[rule.symbol.toUpperCase()] ||
              stockResults.find((s) => s.symbol.toUpperCase() === rule.symbol.toUpperCase());
            return (
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
                    bseCode={matchedStk?.bseCode}
                    logoUrl={matchedStk?.logoUrl}
                    searchId={matchedStk?.searchId}
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
                        ({formatStockTickerLabel(rule.symbol, matchedStk?.bseCode)})
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
                      {matchedStk?.currentPrice != null && ` · Live: ${formatINR(matchedStk.currentPrice)}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🔔 Price Alert for ${rule.companyName} (${rule.symbol}): ${rule.conditionType.replace(/_/g, ' ')} ${formatINR(rule.targetValue)} on PriceAlerter: https://pricealerter.in/stock/${rule.symbol}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                    title="Open / Forward alert on WhatsApp"
                  >
                    <span>📲 WhatsApp</span>
                  </a>
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
            );
          })}
        </div>
      )}
        </>
      ) : (
        /* Angel One SmartAPI GTT Orders Tab */
        <div className="space-y-6">
          {/* GTT Information & Compliance Banner */}
          <div className="rounded-xl border border-orange-200 dark:border-orange-900/40 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-white dark:from-[#1f1712] dark:to-[#111C2E] p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-orange-950 dark:text-orange-200">
                <img
                  src="/assets/movers/angel-one.png"
                  alt="Angel One"
                  className="w-5 h-5 rounded-md object-contain bg-white dark:bg-slate-900 p-0.5 border border-orange-200 shadow-sm"
                />
                <span>Angel One SmartAPI Good-Till-Triggered (GTT) Orders</span>
              </div>
              <a
                href="https://smartapi.angelone.in/docs/Gtt"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-0.5"
              >
                <span>SmartAPI GTT Docs</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-orange-900/80 dark:text-orange-300/80 leading-relaxed">
              GTT rules are official broker-level conditional triggers executed directly on the exchanges.
              Supported exchanges are <strong>NSE</strong> and <strong>BSE</strong> only, and supported product types are{' '}
              <strong>DELIVERY</strong> and <strong>MARGIN</strong>. Orders remain active for up to 1 year until triggered.
            </p>
          </div>

          {/* GTT Rule Creation Form */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#14263F] dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" /> Create Official GTT Trigger Rule
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Token: {gttSymbolToken} · {gttExchange}
              </span>
            </div>

            {gttError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-[#DC2626]">
                {gttError}
              </div>
            )}
            {gttSuccess && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs text-[#059669]">
                {gttSuccess}
              </div>
            )}

            <form onSubmit={handleCreateGtt} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Symbol & Autocomplete */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Trading Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN, RELIANCE"
                    required
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-3 py-1.5 font-mono font-bold text-slate-800 dark:text-white outline-none"
                  />
                </div>

                {/* Symbol Token */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Symbol Token</label>
                  <input
                    type="text"
                    value={gttSymbolToken}
                    onChange={(e) => setGttSymbolToken(e.target.value)}
                    placeholder="e.g. 3045"
                    required
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-3 py-1.5 font-mono text-slate-800 dark:text-white outline-none"
                  />
                </div>

                {/* Exchange */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Exchange</label>
                  <select
                    value={gttExchange}
                    onChange={(e) => setGttExchange(e.target.value as 'NSE' | 'BSE')}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-3 py-1.5 font-semibold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="NSE">NSE (National Stock Exchange)</option>
                    <option value="BSE">BSE (Bombay Stock Exchange)</option>
                  </select>
                </div>

                {/* Transaction Type */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Side</label>
                  <select
                    value={gttTransactionType}
                    onChange={(e) => setGttTransactionType(e.target.value as 'BUY' | 'SELL')}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-3 py-1.5 font-semibold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="BUY">BUY Order</option>
                    <option value="SELL">SELL Order</option>
                  </select>
                </div>

                {/* Product Type */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Product Type</label>
                  <select
                    value={gttProductType}
                    onChange={(e) => setGttProductType(e.target.value as 'DELIVERY' | 'MARGIN')}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-3 py-1.5 font-semibold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="DELIVERY">DELIVERY (Cash CNC)</option>
                    <option value="MARGIN">MARGIN (MTF)</option>
                  </select>
                </div>

                {/* Trigger Price */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Trigger Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={gttTriggerPrice}
                    onChange={(e) => setGttTriggerPrice(e.target.value)}
                    required
                    placeholder="e.g. 196"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-3 py-1.5 font-mono font-bold text-slate-800 dark:text-white outline-none"
                  />
                </div>

                {/* Execution Limit Price */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Limit Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={gttPrice}
                    onChange={(e) => setGttPrice(e.target.value)}
                    required
                    placeholder="e.g. 195"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-3 py-1.5 font-mono font-bold text-slate-800 dark:text-white outline-none"
                  />
                </div>

                {/* Order Quantity */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Quantity (Shares)</label>
                  <input
                    type="number"
                    min="1"
                    value={gttQty}
                    onChange={(e) => {
                      setGttQty(e.target.value);
                      setGttDisclosedQty(e.target.value);
                    }}
                    required
                    placeholder="e.g. 1"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-3 py-1.5 font-mono text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  Target: {gttTransactionType} {gttQty} shares of {symbol}-EQ @ ₹{gttPrice} when price hits ₹{gttTriggerPrice}
                </span>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 px-5 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Placing GTT...' : `Place GTT Rule on Angel One`}
                </button>
              </div>
            </form>
          </section>

          {/* GTT Active Rules List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Active &amp; Historical GTT Orders</span>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                  {gttRules.length}
                </span>
              </h3>
              <button
                type="button"
                onClick={loadGttRules}
                disabled={gttLoading}
                className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${gttLoading ? 'animate-spin' : ''}`} />
                <span>Refresh GTT Rules</span>
              </button>
            </div>

            {gttLoading && gttRules.length === 0 ? (
              <LoadingSkeleton rows={3} />
            ) : gttRules.length === 0 ? (
              <EmptyState
                title="No GTT rules found on Angel One"
                description="Create a Good-Till-Triggered order above to set automated broker-side buy/sell triggers on NSE or BSE."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gttRules.map((rule, idx) => (
                  <div
                    key={rule.id || idx}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CompanyLogo
                          companyName={rule.tradingsymbol || 'SBIN'}
                          symbol={rule.tradingsymbol ? rule.tradingsymbol.replace(/-EQ$/, '') : 'SBIN'}
                          size="sm"
                        />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {rule.tradingsymbol || 'SBIN-EQ'}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          ({rule.exchange || 'NSE'})
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rule.transactiontype === 'SELL'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {rule.transactiontype || 'BUY'}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          rule.status === 'TRIGGERED' || rule.status === 'SENTTOEXCHANGE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900'
                            : rule.status === 'ACTIVE' || rule.status === 'NEW'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:border-blue-900'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                      >
                        {rule.status || 'ACTIVE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500 font-sans">Trigger Price</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{rule.triggerprice || rule.price}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-sans">Limit Price</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{rule.price}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-sans">Quantity</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {rule.qty} shares
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
                      <span>Rule ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{rule.id}</strong></span>
                      {rule.status !== 'CANCELLED' && rule.status !== 'TRIGGERED' && (
                        <button
                          type="button"
                          onClick={() => handleCancelGtt(rule)}
                          className="text-red-600 dark:text-red-400 hover:underline font-semibold cursor-pointer"
                        >
                          Cancel Rule
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
