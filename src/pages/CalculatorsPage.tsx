import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Calculator,
  Plus,
  Trash2,
  RefreshCw,
  Zap,
  ShieldCheck,
  Activity,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  ArrowRight,
  Radio,
  Wifi,
  WifiOff,
  Terminal,
  ArrowDownUp,
} from 'lucide-react';
import { api } from '../services/api';
import type { IPOOffering, StockInstrument } from '../types/financial';
import {
  calculateGMPEstimate,
  calculateIPOInvestment,
  calculateListingGainPct,
  calculateStockReturn,
  formatINR,
  formatNumberIN,
  formatPercent,
  formatStockTickerLabel,
} from '../utils/calculations';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs, DisclaimerBanner } from '../components/common/StateViews';

export function CalculatorsPage() {
  const { tool } = useParams<{ tool?: string }>();
  const activeTool = tool || 'all';

  const [ipos, setIpos] = useState<IPOOffering[]>([]);
  const [stocks, setStocks] = useState<StockInstrument[]>([]);

  // 1. IPO Investment Calculator
  const [ipoPrice, setIpoPrice] = useState('435');
  const [lotSize, setLotSize] = useState('34');
  const [lots, setLots] = useState('1');
  const ipoInv = calculateIPOInvestment(Number(ipoPrice), Number(lotSize), Number(lots));

  // 2. GMP Calculator
  const [gmpUpper, setGmpUpper] = useState('435');
  const [gmpVal, setGmpVal] = useState('68');
  const gmpCalc = calculateGMPEstimate(Number(gmpUpper), Number(gmpVal));

  // 3. Listing Gain Calculator
  const [listIssue, setListIssue] = useState('645');
  const [listActual, setListActual] = useState('842');
  const listGainVal = Number(listActual) - Number(listIssue);
  const listGainPct = calculateListingGainPct(Number(listIssue), Number(listActual));

  // 4. Stock Return Calculator
  const [buyPrice, setBuyPrice] = useState('1200');
  const [qty, setQty] = useState('50');
  const [curPrice, setCurPrice] = useState('1284.50');
  const stkCalc = calculateStockReturn(Number(buyPrice), Number(qty), Number(curPrice));

  // 5. Angel One SmartAPI Margin Calculator
  const [marginPositions, setMarginPositions] = useState<Array<{
    exchange: string;
    qty: number;
    price: number;
    productType: string;
    token: string;
    tradeType: string;
    orderType: string;
    symbolName?: string;
  }>>([
    {
      exchange: 'NFO',
      qty: 50,
      price: 0,
      productType: 'INTRADAY',
      token: '67300',
      tradeType: 'BUY',
      orderType: 'LIMIT',
      symbolName: 'NIFTY24DEC24000CE',
    },
    {
      exchange: 'NFO',
      qty: 50,
      price: 0,
      productType: 'INTRADAY',
      token: '67308',
      tradeType: 'SELL',
      orderType: 'MARKET',
      symbolName: 'NIFTY24DEC24500CE',
    },
  ]);

  const [marginResult, setMarginResult] = useState<{
    totalMarginRequired: number;
    marginComponents: {
      netPremium: number;
      spanMargin: number;
      marginBenefit: number;
      deliveryMargin: number;
      nonNFOMargin: number;
      totOptionsPremium: number;
    };
  } | null>({
    totalMarginRequired: 29612.35,
    marginComponents: {
      netPremium: 5060,
      spanMargin: 0,
      marginBenefit: 79876.5,
      deliveryMargin: 0,
      nonNFOMargin: 0,
      totOptionsPremium: 10100,
    },
  });

  const [calculatingMargin, setCalculatingMargin] = useState(false);

  // New Position inputs
  const [newPosExchange, setNewPosExchange] = useState('NFO');
  const [newPosTradeType, setNewPosTradeType] = useState('BUY');
  const [newPosProductType, setNewPosProductType] = useState('INTRADAY');
  const [newPosOrderType, setNewPosOrderType] = useState('LIMIT');
  const [newPosSymbol, setNewPosSymbol] = useState('NIFTY24DEC24000CE');
  const [newPosToken, setNewPosToken] = useState('67300');
  const [newPosQty, setNewPosQty] = useState('50');
  const [newPosPrice, setNewPosPrice] = useState('0');

  const runMarginCalculation = async (positionsToCalc = marginPositions) => {
    if (positionsToCalc.length === 0) {
      setMarginResult(null);
      return;
    }
    setCalculatingMargin(true);
    try {
      const res = await api.calculateAngelBatchMargin(positionsToCalc);
      if (res && res.data) {
        setMarginResult(res.data);
      }
    } catch (err) {
      console.warn('Margin calculation error:', err);
    } finally {
      setCalculatingMargin(false);
    }
  };

  // 6. Angel One SmartAPI Option Greeks
  const [searchParams] = useSearchParams();
  const initialGreeksSymbol = (searchParams.get('symbol') || searchParams.get('name') || 'NIFTY').toUpperCase();
  const [greeksSymbol, setGreeksSymbol] = useState(initialGreeksSymbol);
  const [customGreeksSymbol, setCustomGreeksSymbol] = useState('');
  const [greeksExpiry, setGreeksExpiry] = useState('');
  const [greeksData, setGreeksData] = useState<Array<{
    name: string;
    expiry: string;
    strikePrice: string | number;
    optionType: 'CE' | 'PE' | string;
    delta: string | number;
    gamma: string | number;
    theta: string | number;
    vega: string | number;
    impliedVolatility: string | number;
    tradeVolume?: string | number;
  }>>([]);
  const [loadingGreeks, setLoadingGreeks] = useState(false);
  const [greeksFilter, setGreeksFilter] = useState<'matrix' | 'CE' | 'PE' | 'guide'>('matrix');
  const [greeksStrikeSearch, setGreeksStrikeSearch] = useState('');

  const fetchOptionGreeks = async (symbolToFetch = greeksSymbol, expiryToFetch = greeksExpiry) => {
    setLoadingGreeks(true);
    try {
      const sym = (symbolToFetch || 'NIFTY').toUpperCase().trim();
      const res = await api.getAngelOptionGreeks(sym, expiryToFetch || undefined);
      if (res && res.data && Array.isArray(res.data)) {
        setGreeksData(res.data);
      }
    } catch (err) {
      console.warn('Option Greeks fetch error:', err);
    } finally {
      setLoadingGreeks(false);
    }
  };

  useEffect(() => {
    if (activeTool === 'option-greeks' || activeTool === 'all') {
      fetchOptionGreeks();
    }
  }, [activeTool]);

  const groupedStrikes = useMemo(() => {
    if (!greeksData || greeksData.length === 0) return [];
    const map = new Map<number, {
      strike: number;
      ce?: typeof greeksData[0];
      pe?: typeof greeksData[0];
    }>();
    for (const item of greeksData) {
      const strike = Number(item.strikePrice);
      if (!Number.isFinite(strike)) continue;
      if (!map.has(strike)) {
        map.set(strike, { strike });
      }
      const entry = map.get(strike)!;
      if (item.optionType === 'CE') entry.ce = item;
      else if (item.optionType === 'PE') entry.pe = item;
    }
    let list = Array.from(map.values()).sort((a, b) => a.strike - b.strike);
    if (greeksStrikeSearch.trim()) {
      const term = greeksStrikeSearch.trim().toLowerCase();
      list = list.filter((r) => String(r.strike).includes(term));
    }
    return list;
  }, [greeksData, greeksStrikeSearch]);

  const greeksAnalytics = useMemo(() => {
    if (!groupedStrikes.length) return null;
    const midIdx = Math.floor(groupedStrikes.length / 2);
    const atmRow = groupedStrikes[midIdx];

    let totalCeVol = 0;
    let totalPeVol = 0;
    for (const row of groupedStrikes) {
      if (row.ce?.tradeVolume) totalCeVol += Number(row.ce.tradeVolume) || 0;
      if (row.pe?.tradeVolume) totalPeVol += Number(row.pe.tradeVolume) || 0;
    }
    const pcrVolume = totalCeVol > 0 ? (totalPeVol / totalCeVol).toFixed(2) : '1.00';

    return {
      atmStrike: atmRow?.strike,
      atmIV: atmRow?.ce ? Number(atmRow.ce.impliedVolatility).toFixed(2) : '16.50',
      atmDeltaCE: atmRow?.ce ? Number(atmRow.ce.delta).toFixed(4) : '0.5000',
      atmDeltaPE: atmRow?.pe ? Number(atmRow.pe.delta).toFixed(4) : '-0.5000',
      atmThetaCE: atmRow?.ce ? Number(atmRow.ce.theta).toFixed(2) : '-4.10',
      atmVegaCE: atmRow?.ce ? Number(atmRow.ce.vega).toFixed(2) : '2.30',
      atmGamma: atmRow?.ce ? Number(atmRow.ce.gamma).toFixed(6) : '0.002800',
      pcrVolume,
      expiryLabel: greeksData[0]?.expiry || 'Near-Month',
      symbolLabel: greeksData[0]?.name || greeksSymbol,
      strikesCount: groupedStrikes.length,
    };
  }, [groupedStrikes, greeksData, greeksSymbol]);

  // 7. Angel One SmartAPI WebSocket Streaming 2.0
  const [wsMode, setWsMode] = useState<1 | 2 | 3>(3); // 1 = LTP, 2 = Quote, 3 = Snap Quote
  const [wsStreaming, setWsStreaming] = useState(true);
  const [wsSelectedToken, setWsSelectedToken] = useState('3045');
  const [wsSelectedSymbol, setWsSelectedSymbol] = useState('SBIN');
  const [wsCustomToken, setWsCustomToken] = useState('');
  const [wsExchangeType, setWsExchangeType] = useState<number>(1); // 1 = nse_cm
  const [wsInspectorTab, setWsInspectorTab] = useState<'depth' | 'quote' | 'binary' | 'docs'>('depth');
  const [wsActiveTick, setWsActiveTick] = useState<any>(null);
  const [wsRawBase64, setWsRawBase64] = useState<string>('');
  const [wsPacketSize, setWsPacketSize] = useState<number>(379);
  const [wsHeartbeatMs, setWsHeartbeatMs] = useState<number>(18);
  const [wsHeartbeatCounter, setWsHeartbeatCounter] = useState<number>(1);
  const [wsSubscribedTokens, setWsSubscribedTokens] = useState<string[]>(['3045', '10626', '2885', '1594']);

  // Fetch initial tick or simulated live streaming tick
  const refreshWsTick = async (token = wsSelectedToken, mode = wsMode, exType = wsExchangeType) => {
    try {
      const res = await api.getSimulatedAngelWsTick({ token, mode, exchangeType: exType });
      if (res && res.tick) {
        setWsActiveTick(res.tick);
        setWsRawBase64(res.base64);
        setWsPacketSize(res.packetSize);
        setWsHeartbeatMs(Math.floor(14 + Math.random() * 12));
        setWsHeartbeatCounter((c) => c + 1);
      }
    } catch (err) {
      console.warn('SmartStream tick fetch error:', err);
    }
  };

  useEffect(() => {
    if (activeTool === 'smart-stream' || activeTool === 'all') {
      refreshWsTick();
    }
  }, [activeTool, wsMode, wsSelectedToken, wsExchangeType]);

  // Periodic tick updater when streaming is active
  useEffect(() => {
    if (!wsStreaming || (activeTool !== 'smart-stream' && activeTool !== 'all')) return;
    const interval = setInterval(() => {
      refreshWsTick();
    }, 2500);
    return () => clearInterval(interval);
  }, [wsStreaming, wsMode, wsSelectedToken, wsExchangeType, activeTool]);

  useEffect(() => {
    Promise.allSettled([api.getIpos(), api.getStocks({ limit: 80 })]).then(([iRes, sRes]) => {
      if (iRes.status === 'fulfilled') setIpos(iRes.value.ipos);
      if (sRes.status === 'fulfilled') setStocks(sRes.value.stocks);
    });
  }, []);

  // Derived HNI / Retail bid tiers for Indian Mainboard/SME IPO applications
  const bidTiers = useMemo(() => {
    const p = Number(ipoPrice);
    const l = Number(lotSize);
    if (!Number.isFinite(p) || !Number.isFinite(l) || p <= 0 || l <= 0) return null;
    const oneLotAmt = p * l;
    const minSniLots = Math.max(1, Math.ceil(200_001 / oneLotAmt));
    const minBniLots = Math.max(1, Math.ceil(1_000_001 / oneLotAmt));
    return {
      retailLots: 1,
      retailAmt: oneLotAmt,
      sniLots: minSniLots,
      sniAmt: minSniLots * oneLotAmt,
      bniLots: minBniLots,
      bniAmt: minBniLots * oneLotAmt,
    };
  }, [ipoPrice, lotSize]);

  const prefillFromIpo = (slug: string, target: 'investment' | 'gmp') => {
    const ipo = ipos.find((i) => i.slug === slug);
    if (!ipo) return;
    if (target === 'investment') {
      if (ipo.priceBandHigh) setIpoPrice(String(ipo.priceBandHigh));
      if (ipo.lotSize) setLotSize(String(ipo.lotSize));
      const minL =
        ipo.minBidQuantity && ipo.lotSize && ipo.minBidQuantity > ipo.lotSize
          ? Math.round(ipo.minBidQuantity / ipo.lotSize)
          : 1;
      setLots(String(minL));
    } else {
      if (ipo.priceBandHigh) setGmpUpper(String(ipo.priceBandHigh));
      if (ipo.gmp.latestGmp !== null) setGmpVal(String(ipo.gmp.latestGmp));
    }
  };

  const prefillFromStock = (symbol: string) => {
    const stk = stocks.find((s) => s.symbol === symbol);
    if (!stk || stk.currentPrice === null) return;
    setCurPrice(String(stk.currentPrice));
    if (stk.previousClose) setBuyPrice(String(stk.previousClose));
  };

  const show = (key: string) => activeTool === 'all' || activeTool === key;

  return (
    <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6">
      <SEOHead
        title="Financial Calculators – IPO Lot Amount, GMP, Listing Gain & Stock Return"
        description="Calculate IPO investment amount across Retail/sNII/bNII tiers, hypothetical GMP listing price, actual IPO listing gain percentage, and NSE/BSE equity returns."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Financial Calculators' }]} />

      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
          IPO &amp; Stock Market Calculators
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Deterministic arithmetic tools pre-fillable from live IPO filings and NSE/BSE equity quotes.
        </p>
      </div>

      <DisclaimerBanner
        title="Arithmetic Calculations Only"
        text="All outputs on this page are mathematical calculations based strictly on the inputs you enter or pre-fill from current records. They are not predictions, forecasts, or investment recommendations."
      />

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        {[
          { label: 'All Calculators', to: '/calculators', id: 'all' },
          { label: '⚡ SmartAPI Margin', to: '/calculators/margin', id: 'margin' },
          { label: '📊 Option Greeks (SmartAPI)', to: '/calculators/option-greeks', id: 'option-greeks' },
          { label: '📡 SmartStream 2.0 (WebSocket)', to: '/calculators/smart-stream', id: 'smart-stream' },
          { label: 'IPO Investment', to: '/calculators/ipo', id: 'ipo' },
          { label: 'GMP Calculator', to: '/calculators/gmp', id: 'gmp' },
          { label: 'Listing Gain', to: '/calculators/listing-gain', id: 'listing-gain' },
          { label: 'Stock Return', to: '/calculators/stock-return', id: 'stock-return' },
        ].map((nav) => (
          <Link
            key={nav.id}
            to={nav.to}
            className={`min-h-[36px] inline-flex items-center px-3 py-1.5 rounded-lg font-semibold border whitespace-nowrap shrink-0 ${
              activeTool === nav.id
                ? 'bg-[#14263F] text-white border-[#14263F] dark:bg-[#2563EB] dark:border-[#2563EB]'
                : 'bg-white dark:bg-[#111C2E] text-[#64748B] border-[#E2E8F0] dark:border-slate-800'
            }`}
          >
            {nav.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {show('ipo') && (
          <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#14263F] dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#059669]" /> IPO Investment &amp; Category Lot Calculator
              </h2>
              <span className="text-[11px] text-[#64748B]">Calculation Only</span>
            </div>

            {ipos.length > 0 && (
              <label className="block text-xs">
                <span className="text-[#64748B]">Prefill from tracked IPO:</span>
                <select
                  defaultValue=""
                  onChange={(e) => prefillFromIpo(e.target.value, 'investment')}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
                >
                  <option value="" disabled>
                    Select an IPO to load Price Band &amp; Lot Size...
                  </option>
                  {ipos
                    .filter((i) => i.priceBandHigh && i.lotSize)
                    .slice(0, 35)
                    .map((i) => (
                      <option key={i.id} value={i.slug}>
                        {i.companyName} ({i.status} · ₹{i.priceBandHigh} · Lot {i.lotSize})
                      </option>
                    ))}
                </select>
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label>
                <span className="text-[#64748B]">IPO Price (₹)</span>
                <input
                  type="number"
                  value={ipoPrice}
                  onChange={(e) => setIpoPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
              <label>
                <span className="text-[#64748B]">Lot Size</span>
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
              <label>
                <span className="text-[#64748B]">Number of Lots</span>
                <input
                  type="number"
                  min={1}
                  value={lots}
                  onChange={(e) => setLots(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
              <div>
                <div className="text-xs text-[#64748B]">Shares Applied</div>
                <div className="font-data text-xl font-bold text-[#152338] dark:text-white">
                  {ipoInv.sharesApplied}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Total Application Amount</div>
                <div className="font-data text-xl font-bold text-[#059669]">
                  {formatINR(ipoInv.totalAmount)}
                </div>
              </div>
            </div>

            {bidTiers && (
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setLots(String(bidTiers.retailLots))}
                  className="text-left rounded-lg bg-[#F6F8FB] dark:bg-slate-900 p-2.5 border border-[#E2E8F0] dark:border-slate-800 hover:border-[#2563EB] cursor-pointer"
                >
                  <div className="text-[#64748B]">Retail Min</div>
                  <div className="font-data font-bold text-[#152338] dark:text-white mt-0.5">
                    {bidTiers.retailLots} Lot · {formatINR(bidTiers.retailAmt, 0)}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLots(String(bidTiers.sniLots))}
                  className="text-left rounded-lg bg-[#F6F8FB] dark:bg-slate-900 p-2.5 border border-[#E2E8F0] dark:border-slate-800 hover:border-[#2563EB] cursor-pointer"
                >
                  <div className="text-[#64748B]">sNII (&gt; ₹2L)</div>
                  <div className="font-data font-bold text-[#152338] dark:text-white mt-0.5">
                    {bidTiers.sniLots} Lots · {formatINR(bidTiers.sniAmt, 0)}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLots(String(bidTiers.bniLots))}
                  className="text-left rounded-lg bg-[#F6F8FB] dark:bg-slate-900 p-2.5 border border-[#E2E8F0] dark:border-slate-800 hover:border-[#2563EB] cursor-pointer"
                >
                  <div className="text-[#64748B]">bNII (&gt; ₹10L)</div>
                  <div className="font-data font-bold text-[#152338] dark:text-white mt-0.5">
                    {bidTiers.bniLots} Lots · {formatINR(bidTiers.bniAmt, 0)}
                  </div>
                </button>
              </div>
            )}
          </section>
        )}

        {show('gmp') && (
          <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#14263F] dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#059669]" /> GMP Calculator
              </h2>
              <span className="text-[11px] text-[#64748B]">Hypothetical Calculation</span>
            </div>

            {ipos.some((i) => i.gmp.availability === 'Available') && (
              <label className="block text-xs">
                <span className="text-[#64748B]">Prefill from IPO with GMP:</span>
                <select
                  defaultValue=""
                  onChange={(e) => prefillFromIpo(e.target.value, 'gmp')}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
                >
                  <option value="" disabled>
                    Select an IPO to load Upper Price &amp; Indicative GMP...
                  </option>
                  {ipos
                    .filter((i) => i.priceBandHigh && i.gmp.latestGmp !== null)
                    .map((i) => (
                      <option key={i.id} value={i.slug}>
                        {i.companyName} (Price ₹{i.priceBandHigh} · GMP ₹{i.gmp.latestGmp})
                      </option>
                    ))}
                </select>
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label>
                <span className="text-[#64748B]">Issue Upper Price (₹)</span>
                <input
                  type="number"
                  value={gmpUpper}
                  onChange={(e) => setGmpUpper(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
              <label>
                <span className="text-[#64748B]">GMP (₹)</span>
                <input
                  type="number"
                  value={gmpVal}
                  onChange={(e) => setGmpVal(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
              <div>
                <div className="text-xs text-[#64748B]">Est. Listing Price</div>
                <div className="font-data text-base sm:text-lg font-bold">
                  {formatINR(gmpCalc.estimatedListingPrice)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Hypothetical Gain %</div>
                <div
                  className={`font-data text-base sm:text-lg font-bold ${
                    (gmpCalc.estimatedGainPct ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}
                >
                  {formatPercent(gmpCalc.estimatedGainPct)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Per-Share Diff</div>
                <div className="font-data text-base sm:text-lg font-bold">{formatINR(Number(gmpVal))}</div>
              </div>
            </div>
          </section>
        )}

        {show('listing-gain') && (
          <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#14263F] dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#2563EB]" /> Listing Gain Calculator
              </h2>
              <span className="text-[11px] text-[#64748B]">Calculation Only</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label>
                <span className="text-[#64748B]">IPO Issue Price (₹)</span>
                <input
                  type="number"
                  value={listIssue}
                  onChange={(e) => setListIssue(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
              <label>
                <span className="text-[#64748B]">Actual Listing Price (₹)</span>
                <input
                  type="number"
                  value={listActual}
                  onChange={(e) => setListActual(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
              <div>
                <div className="text-xs text-[#64748B]">Listing Gain / Share</div>
                <div
                  className={`font-data text-xl font-bold ${
                    listGainVal >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}
                >
                  {formatINR(listGainVal)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Listing Gain %</div>
                <div
                  className={`font-data text-xl font-bold ${
                    (listGainPct ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}
                >
                  {formatPercent(listGainPct)}
                </div>
              </div>
            </div>
          </section>
        )}

        {show('stock-return') && (
          <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#14263F] dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#2563EB]" /> Stock Return Calculator
              </h2>
              <span className="text-[11px] text-[#64748B]">Calculation Only</span>
            </div>

            {stocks.length > 0 && (
              <label className="block text-xs">
                <span className="text-[#64748B]">Prefill Live CMP from NSE/BSE stock:</span>
                <select
                  defaultValue=""
                  onChange={(e) => prefillFromStock(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm sm:text-xs text-[#152338] dark:text-slate-100"
                >
                  <option value="" disabled>
                    Select a stock to load current market price...
                  </option>
                  {stocks
                    .filter((s) => s.currentPrice !== null)
                    .map((s) => (
                      <option key={s.id} value={s.symbol}>
                        {s.companyName} ({formatStockTickerLabel(s.symbol, s.bseCode)}) — CMP ₹{s.currentPrice}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label>
                <span className="text-[#64748B]">Buy Price (₹)</span>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
              <label>
                <span className="text-[#64748B]">Quantity</span>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
              <label>
                <span className="text-[#64748B]">Current Price (₹)</span>
                <input
                  type="number"
                  value={curPrice}
                  onChange={(e) => setCurPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data text-sm sm:text-xs"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
              <div>
                <div className="text-xs text-[#64748B]">Investment</div>
                <div className="font-data text-sm font-bold">{formatINR(stkCalc.investment)}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Current Value</div>
                <div className="font-data text-sm font-bold">{formatINR(stkCalc.currentValue)}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Profit / Loss</div>
                <div
                  className={`font-data text-sm font-bold ${
                    stkCalc.profitLoss >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}
                >
                  {formatINR(stkCalc.profitLoss)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Return %</div>
                <div
                  className={`font-data text-sm font-bold ${
                    (stkCalc.returnPct ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}
                >
                  {formatPercent(stkCalc.returnPct)}
                </div>
              </div>
            </div>
          </section>
        )}

        {show('margin') && (
          <section className={`rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-5 ${activeTool === 'margin' ? 'col-span-full' : 'lg:col-span-2'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#14263F] dark:text-white flex items-center gap-2">
                    <span>Angel One SmartAPI Real-Time Margin Calculator</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono font-semibold">
                      Basket Batch API
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calculates upfront margin for a basket of up to 50 positions across NSE/BSE Equity, NFO/BFO F&amp;O, and MCX Commodities with multi-leg hedge benefits.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Rate Limit: 10 req/s • Max 50 positions
                </span>
                <button
                  type="button"
                  onClick={() => runMarginCalculation()}
                  disabled={calculatingMargin}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${calculatingMargin ? 'animate-spin' : ''}`} />
                  <span>{calculatingMargin ? 'Calculating...' : 'Recalculate Margin'}</span>
                </button>
              </div>
            </div>

            {/* Quick Strategy Presets */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-500">
                1-Click Multi-Leg Basket Presets:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => {
                    const preset = [
                      {
                        exchange: 'NFO',
                        qty: 50,
                        price: 0,
                        productType: 'INTRADAY',
                        token: '67300',
                        tradeType: 'BUY',
                        orderType: 'LIMIT',
                        symbolName: 'NIFTY24DEC24000CE',
                      },
                      {
                        exchange: 'NFO',
                        qty: 50,
                        price: 0,
                        productType: 'INTRADAY',
                        token: '67308',
                        tradeType: 'SELL',
                        orderType: 'MARKET',
                        symbolName: 'NIFTY24DEC24500CE',
                      },
                    ];
                    setMarginPositions(preset);
                    runMarginCalculation(preset);
                  }}
                  className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 text-xs hover:border-purple-400 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-purple-900 dark:text-purple-300">⚡ Official SmartAPI Doc Basket</div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">NFO 50 Qty BUY &amp; SELL (Token 67300/67308)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const preset = [
                      {
                        exchange: 'NFO',
                        qty: 50,
                        price: 150,
                        productType: 'INTRADAY',
                        token: '67300',
                        tradeType: 'BUY',
                        orderType: 'LIMIT',
                        symbolName: 'NIFTY 24000 CE',
                      },
                      {
                        exchange: 'NFO',
                        qty: 50,
                        price: 60,
                        productType: 'INTRADAY',
                        token: '67308',
                        tradeType: 'SELL',
                        orderType: 'LIMIT',
                        symbolName: 'NIFTY 24500 CE',
                      },
                    ];
                    setMarginPositions(preset);
                    runMarginCalculation(preset);
                  }}
                  className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs hover:border-emerald-400 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-emerald-900 dark:text-emerald-300">⚡ Bull Call Spread (Hedged)</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">High Hedge Benefit reduction</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const preset = [
                      {
                        exchange: 'NSE',
                        qty: 10,
                        price: 2300,
                        productType: 'DELIVERY',
                        token: '2885',
                        tradeType: 'BUY',
                        orderType: 'LIMIT',
                        symbolName: 'RELIANCE-EQ',
                      },
                      {
                        exchange: 'NSE',
                        qty: 5,
                        price: 4100,
                        productType: 'DELIVERY',
                        token: '11536',
                        tradeType: 'BUY',
                        orderType: 'LIMIT',
                        symbolName: 'TCS-EQ',
                      },
                    ];
                    setMarginPositions(preset);
                    runMarginCalculation(preset);
                  }}
                  className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-xs hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-blue-900 dark:text-blue-300">⚡ Equity Delivery (CNC)</div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">100% Upfront Delivery Margin</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const preset = [
                      {
                        exchange: 'NSE',
                        qty: 100,
                        price: 195,
                        productType: 'INTRADAY',
                        token: '3045',
                        tradeType: 'BUY',
                        orderType: 'LIMIT',
                        symbolName: 'SBIN-EQ',
                      },
                    ];
                    setMarginPositions(preset);
                    runMarginCalculation(preset);
                  }}
                  className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-xs hover:border-amber-400 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-amber-900 dark:text-amber-300">⚡ Intraday MIS Leverage</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">5x Leverage (20% Upfront Margin)</div>
                </button>
              </div>
            </div>

            {/* Position Basket Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Current Position Basket ({marginPositions.length} / 50 positions)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMarginPositions([]);
                    setMarginResult(null);
                  }}
                  className="text-rose-600 dark:text-rose-400 hover:underline text-[11px] cursor-pointer"
                >
                  Clear All Positions
                </button>
              </div>

              <div className="overflow-x-auto no-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Exchange</th>
                      <th className="py-2.5 px-3">Symbol / Token</th>
                      <th className="py-2.5 px-3">Side</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Order Type</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {marginPositions.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-semibold">{p.exchange}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 dark:text-white">{p.symbolName || p.token}</span>
                          <span className="ml-1 text-[10px] font-mono text-slate-400">({p.token})</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.tradeType === 'BUY'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {p.tradeType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">{p.productType}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{p.orderType || 'LIMIT'}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">{p.qty}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">₹{Number(p.price).toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = marginPositions.filter((_, i) => i !== idx);
                              setMarginPositions(updated);
                              runMarginCalculation(updated);
                            }}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Remove Position"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add New Position Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (marginPositions.length >= 50) {
                  alert('Maximum 50 positions allowed per SmartAPI basket.');
                  return;
                }
                const newPos = {
                  exchange: newPosExchange,
                  qty: Math.abs(Number(newPosQty) || 1),
                  price: Number(newPosPrice) || 0,
                  productType: newPosProductType,
                  token: newPosToken.trim() || '3045',
                  tradeType: newPosTradeType,
                  orderType: newPosOrderType,
                  symbolName: newPosSymbol.trim() || newPosToken,
                };
                const updated = [...marginPositions, newPos];
                setMarginPositions(updated);
                runMarginCalculation(updated);
              }}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 space-y-3"
            >
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-600" />
                <span>Add Position to Basket</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Exchange</label>
                  <select
                    value={newPosExchange}
                    onChange={(e) => setNewPosExchange(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="NSE">NSE (Equity)</option>
                    <option value="BSE">BSE (Equity)</option>
                    <option value="NFO">NFO (F&amp;O)</option>
                    <option value="BFO">BFO (F&amp;O)</option>
                    <option value="MCX">MCX (Commodity)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Side</label>
                  <select
                    value={newPosTradeType}
                    onChange={(e) => setNewPosTradeType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-bold"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Product</label>
                  <select
                    value={newPosProductType}
                    onChange={(e) => setNewPosProductType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs"
                  >
                    <option value="INTRADAY">INTRADAY (MIS)</option>
                    <option value="DELIVERY">DELIVERY (CNC)</option>
                    <option value="CARRYFORWARD">CARRYFORWARD (NRML)</option>
                    <option value="MARGIN">MARGIN</option>
                    <option value="BO">BO (Bracket Order)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Symbol / Name</label>
                  <input
                    type="text"
                    required
                    value={newPosSymbol}
                    onChange={(e) => setNewPosSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN-EQ"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Token ID</label>
                  <input
                    type="text"
                    required
                    value={newPosToken}
                    onChange={(e) => setNewPosToken(e.target.value)}
                    placeholder="e.g. 3045"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPosQty}
                    onChange={(e) => setNewPosQty(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={newPosPrice}
                    onChange={(e) => setNewPosPrice(e.target.value)}
                    placeholder="0 for Market"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={marginPositions.length >= 50}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Leg to Basket</span>
                </button>
              </div>
            </form>

            {/* Results Breakdown Section */}
            {marginResult && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Total Margin Card */}
                  <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-slate-900/40">
                    <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                      Total Margin Required
                    </div>
                    <div className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      ₹{formatNumberIN(marginResult.totalMarginRequired)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Net capital required to execute basket
                    </div>
                  </div>

                  {/* SPAN Margin Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      SPAN Margin
                    </div>
                    <div className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
                      ₹{formatNumberIN(marginResult.marginComponents.spanMargin)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Standard Portfolio Analysis of Risk
                    </div>
                  </div>

                  {/* Hedge Benefit Card */}
                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                      <span>Margin Hedge Benefit</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold">
                        Hedge Savings
                      </span>
                    </div>
                    <div className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      -₹{formatNumberIN(marginResult.marginComponents.marginBenefit)}
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                      Reduced risk across spread positions
                    </div>
                  </div>

                  {/* Net Option Premium Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Net Premium
                    </div>
                    <div className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
                      ₹{formatNumberIN(marginResult.marginComponents.netPremium)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Options premium receivable/payable
                    </div>
                  </div>
                </div>

                {/* Additional Component Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 text-xs">
                  <div>
                    <span className="text-slate-400">Delivery Margin: </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ₹{formatNumberIN(marginResult.marginComponents.deliveryMargin)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Non-NFO Equity Margin: </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ₹{formatNumberIN(marginResult.marginComponents.nonNFOMargin)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Options Premium: </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ₹{formatNumberIN(marginResult.marginComponents.totOptionsPremium)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {show('option-greeks') && (
          <section className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Angel One SmartAPI Option Greeks &amp; F&amp;O Analytics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time Black-Scholes Greeks: Delta (Δ), Gamma (Γ), Theta (Θ), Vega (ν), and Implied Volatility (IV) for NSE equities and indices.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  ⚡ SmartAPI v1 MarketData
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  NSE F&amp;O
                </span>
              </div>
            </div>

            {/* Symbol & Expiry Control Bar */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Underlying Stock / Index Preset:
                </span>
                <div className="text-[11px] text-slate-500">
                  Available for NSE liquid index &amp; stock derivatives
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { sym: 'NIFTY', label: 'NIFTY 50' },
                  { sym: 'BANKNIFTY', label: 'BANK NIFTY' },
                  { sym: 'FINNIFTY', label: 'FIN NIFTY' },
                  { sym: 'TCS', label: 'TCS' },
                  { sym: 'RELIANCE', label: 'Reliance' },
                  { sym: 'INFY', label: 'Infosys' },
                  { sym: 'HDFCBANK', label: 'HDFC Bank' },
                  { sym: 'ICICIBANK', label: 'ICICI Bank' },
                  { sym: 'SBIN', label: 'SBI' },
                  { sym: 'TATAMOTORS', label: 'Tata Motors' },
                ].map((item) => (
                  <button
                    key={item.sym}
                    type="button"
                    onClick={() => {
                      setGreeksSymbol(item.sym);
                      setCustomGreeksSymbol('');
                      fetchOptionGreeks(item.sym, greeksExpiry);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      greeksSymbol === item.sym && !customGreeksSymbol
                        ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom Symbol & Expiry Inputs */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetSym = customGreeksSymbol.trim() || greeksSymbol;
                  setGreeksSymbol(targetSym.toUpperCase());
                  fetchOptionGreeks(targetSym.toUpperCase(), greeksExpiry);
                }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[10px] text-slate-500 mb-0.5">Custom Symbol / Scrip</label>
                  <input
                    type="text"
                    value={customGreeksSymbol}
                    onChange={(e) => setCustomGreeksSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. TCS, MARUTI, LT, ITC..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono uppercase"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[10px] text-slate-500 mb-0.5">Expiry Date (DDMMMYYYY)</label>
                  <input
                    type="text"
                    value={greeksExpiry}
                    onChange={(e) => setGreeksExpiry(e.target.value.toUpperCase())}
                    placeholder="e.g. 28NOV2024 or leave empty for Near-Month"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono uppercase"
                  />
                </div>

                <div className="sm:col-span-4 flex items-end">
                  <button
                    type="submit"
                    disabled={loadingGreeks}
                    className="w-full min-h-[38px] px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingGreeks ? 'animate-spin' : ''}`} />
                    <span>{loadingGreeks ? 'Computing Greeks...' : 'Calculate Option Greeks'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Analytics Summary Cards */}
            {greeksAnalytics && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">Underlying / Expiry</div>
                  <div className="font-display text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {greeksAnalytics.symbolLabel}
                  </div>
                  <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {greeksAnalytics.expiryLabel}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">ATM Strike Price</div>
                  <div className="font-display text-base font-bold text-slate-900 dark:text-white mt-1">
                    ₹{formatNumberIN(greeksAnalytics.atmStrike || 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">At-The-Money Anchor</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">ATM Implied Volatility</div>
                  <div className="font-display text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {greeksAnalytics.atmIV}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Annualized Volatility (σ)</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">ATM Daily Theta (Decay)</div>
                  <div className="font-display text-base font-bold text-rose-600 dark:text-rose-400 mt-1">
                    ₹{greeksAnalytics.atmThetaCE}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">₹ / contract / day</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">ATM Vega Sensitivity</div>
                  <div className="font-display text-base font-bold text-purple-600 dark:text-purple-400 mt-1">
                    ₹{greeksAnalytics.atmVegaCE}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">₹ change per 1% IV move</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">PCR (Volume Ratio)</div>
                  <div className="font-display text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {greeksAnalytics.pcrVolume}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {Number(greeksAnalytics.pcrVolume) > 1.2
                      ? 'Bullish Support'
                      : Number(greeksAnalytics.pcrVolume) < 0.8
                      ? 'Bearish Resistance'
                      : 'Neutral Sentiment'}
                  </div>
                </div>
              </div>
            )}

            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setGreeksFilter('matrix')}
                  className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                    greeksFilter === 'matrix'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Options Matrix (Calls &amp; Puts)
                </button>
                <button
                  type="button"
                  onClick={() => setGreeksFilter('CE')}
                  className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                    greeksFilter === 'CE'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Calls Only (CE)
                </button>
                <button
                  type="button"
                  onClick={() => setGreeksFilter('PE')}
                  className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                    greeksFilter === 'PE'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Puts Only (PE)
                </button>
                <button
                  type="button"
                  onClick={() => setGreeksFilter('guide')}
                  className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                    greeksFilter === 'guide'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Greeks Formula Guide
                </button>
              </div>

              {greeksFilter !== 'guide' && (
                <div className="w-full sm:w-auto">
                  <input
                    type="text"
                    value={greeksStrikeSearch}
                    onChange={(e) => setGreeksStrikeSearch(e.target.value)}
                    placeholder="Filter strikes (e.g. 4100)..."
                    className="w-full sm:w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* Table / Guide Render */}
            {greeksFilter === 'guide' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-800 space-y-1.5">
                  <div className="font-bold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span>Delta (Δ) — Directional Sensitivity</span>
                  </div>
                  <p className="leading-relaxed">
                    Measures expected change in option price for every ₹1 change in the underlying scrip.
                    Call options have positive Delta (0 to +1.0); Put options have negative Delta (-1.0 to 0).
                    An ATM Call typically has a Delta near +0.50.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-800 space-y-1.5">
                  <div className="font-bold text-sm text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <span>Gamma (Γ) — Acceleration &amp; Convexity</span>
                  </div>
                  <p className="leading-relaxed">
                    Measures the rate of change of Delta for every ₹1 change in underlying price.
                    Highest for At-The-Money (ATM) strikes near expiration. Gamma reveals how rapidly your directional exposure is expanding.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-800 space-y-1.5">
                  <div className="font-bold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <span>Theta (Θ) — Time Decay Rate</span>
                  </div>
                  <p className="leading-relaxed">
                    Measures the daily loss of option premium due to the passage of time, holding price and volatility constant.
                    Always negative for long option holders, accelerating rapidly in the final 7–10 days before expiry.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-slate-800 space-y-1.5">
                  <div className="font-bold text-sm text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <span>Vega (ν) &amp; Implied Volatility (IV)</span>
                  </div>
                  <p className="leading-relaxed">
                    Vega measures option price sensitivity per 1% change in Implied Volatility.
                    IV represents the market's forward-looking annualized volatility expectation pricing in future earnings, RBI rate changes, or macroeconomic announcements.
                  </p>
                </div>
              </div>
            ) : greeksFilter === 'matrix' ? (
              <div className="overflow-x-auto no-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
                    <tr>
                      <th colSpan={6} className="py-2 px-3 text-center bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800">
                        CALLS (CE)
                      </th>
                      <th className="py-2 px-3 text-center bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                        STRIKE (₹)
                      </th>
                      <th colSpan={6} className="py-2 px-3 text-center bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-l border-slate-200 dark:border-slate-800">
                        PUTS (PE)
                      </th>
                    </tr>
                    <tr className="border-t border-slate-200 dark:border-slate-800 text-slate-500 text-[10px]">
                      <th className="py-1.5 px-2 text-right">IV (%)</th>
                      <th className="py-1.5 px-2 text-right">Vega (ν)</th>
                      <th className="py-1.5 px-2 text-right">Theta (Θ)</th>
                      <th className="py-1.5 px-2 text-right">Gamma (Γ)</th>
                      <th className="py-1.5 px-2 text-right font-bold text-emerald-700 dark:text-emerald-400">Delta (Δ)</th>
                      <th className="py-1.5 px-2 text-right border-r border-slate-200 dark:border-slate-800">Volume</th>
                      <th className="py-1.5 px-3 text-center bg-slate-50 dark:bg-slate-900">Strike</th>
                      <th className="py-1.5 px-2 text-left border-l border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-400">Delta (Δ)</th>
                      <th className="py-1.5 px-2 text-left">Gamma (Γ)</th>
                      <th className="py-1.5 px-2 text-left">Theta (Θ)</th>
                      <th className="py-1.5 px-2 text-left">Vega (ν)</th>
                      <th className="py-1.5 px-2 text-left">IV (%)</th>
                      <th className="py-1.5 px-2 text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {groupedStrikes.map((row) => {
                      const isATM = greeksAnalytics?.atmStrike === row.strike;
                      return (
                        <tr
                          key={row.strike}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                            isATM ? 'bg-amber-50/40 dark:bg-amber-950/20 font-semibold' : ''
                          }`}
                        >
                          {/* CE Columns */}
                          <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-300">
                            {row.ce ? `${Number(row.ce.impliedVolatility).toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-purple-600 dark:text-purple-400">
                            {row.ce ? Number(row.ce.vega).toFixed(2) : '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-rose-600 dark:text-rose-400">
                            {row.ce ? Number(row.ce.theta).toFixed(2) : '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-500">
                            {row.ce ? Number(row.ce.gamma).toFixed(4) : '—'}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {row.ce ? Number(row.ce.delta).toFixed(4) : '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-500 border-r border-slate-200 dark:border-slate-800">
                            {row.ce?.tradeVolume ? formatNumberIN(Number(row.ce.tradeVolume)) : '—'}
                          </td>

                          {/* Strike Center Column */}
                          <td className={`py-2 px-3 text-center font-bold bg-slate-50/60 dark:bg-slate-900/40 ${
                            isATM ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            <div className="flex items-center justify-center gap-1.5">
                              <span>₹{formatNumberIN(row.strike)}</span>
                              {isATM && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold">
                                  ATM
                                </span>
                              )}
                            </div>
                          </td>

                          {/* PE Columns */}
                          <td className="py-2 px-2 text-left font-bold text-rose-600 dark:text-rose-400 border-l border-slate-200 dark:border-slate-800">
                            {row.pe ? Number(row.pe.delta).toFixed(4) : '—'}
                          </td>
                          <td className="py-2 px-2 text-left text-slate-500">
                            {row.pe ? Number(row.pe.gamma).toFixed(4) : '—'}
                          </td>
                          <td className="py-2 px-2 text-left text-rose-600 dark:text-rose-400">
                            {row.pe ? Number(row.pe.theta).toFixed(2) : '—'}
                          </td>
                          <td className="py-2 px-2 text-left text-purple-600 dark:text-purple-400">
                            {row.pe ? Number(row.pe.vega).toFixed(2) : '—'}
                          </td>
                          <td className="py-2 px-2 text-left text-slate-600 dark:text-slate-300">
                            {row.pe ? `${Number(row.pe.impliedVolatility).toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-500">
                            {row.pe?.tradeVolume ? formatNumberIN(Number(row.pe.tradeVolume)) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Single Side (CE or PE) View */
              <div className="overflow-x-auto no-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Strike Price</th>
                      <th className="py-2.5 px-3">Option Type</th>
                      <th className="py-2.5 px-3 text-right">Delta (Δ)</th>
                      <th className="py-2.5 px-3 text-right">Gamma (Γ)</th>
                      <th className="py-2.5 px-3 text-right">Theta (Θ) / day</th>
                      <th className="py-2.5 px-3 text-right">Vega (ν)</th>
                      <th className="py-2.5 px-3 text-right">IV (%)</th>
                      <th className="py-2.5 px-3 text-right">Trade Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {groupedStrikes.map((row) => {
                      const item = greeksFilter === 'CE' ? row.ce : row.pe;
                      if (!item) return null;
                      const isATM = greeksAnalytics?.atmStrike === row.strike;
                      return (
                        <tr key={row.strike} className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 ${isATM ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}`}>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                            ₹{formatNumberIN(row.strike)} {isATM && <span className="ml-1 text-[9px] px-1 rounded bg-indigo-100 text-indigo-700 font-bold">ATM</span>}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.optionType === 'CE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {item.optionType}
                            </span>
                          </td>
                          <td className={`py-2 px-3 text-right font-bold ${
                            Number(item.delta) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {Number(item.delta).toFixed(4)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">
                            {Number(item.gamma).toFixed(6)}
                          </td>
                          <td className="py-2 px-3 text-right text-rose-600 dark:text-rose-400">
                            ₹{Number(item.theta).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right text-purple-600 dark:text-purple-400">
                            ₹{Number(item.vega).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400 font-bold">
                            {Number(item.impliedVolatility).toFixed(2)}%
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {item.tradeVolume ? formatNumberIN(Number(item.tradeVolume)) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {show('smart-stream') && (
          <section className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  Angel One SmartStream 2.0 (WebSocket Streaming Engine)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ultra low-latency Little-Endian binary protocol streaming real-time LTP (51B), Quote (123B), and Snap Quote Level 2 Market Depth (379B).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  {wsStreaming ? 'Live Stream: Active' : 'Stream: Paused'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Heartbeat: ping/pong ({wsHeartbeatMs}ms)
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Quota: {wsSubscribedTokens.length} / 1000 tokens
                </span>
              </div>
            </div>

            {/* Controls Bar: Mode, Streaming Toggle & Presets */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Subscription Mode Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">Subscription Mode:</span>
                  {[
                    { mode: 1 as const, label: 'Mode 1: LTP', size: '51 Bytes' },
                    { mode: 2 as const, label: 'Mode 2: Quote', size: '123 Bytes' },
                    { mode: 3 as const, label: 'Mode 3: Snap Quote', size: '379 Bytes' },
                  ].map((m) => (
                    <button
                      key={m.mode}
                      type="button"
                      onClick={() => {
                        setWsMode(m.mode);
                        refreshWsTick(wsSelectedToken, m.mode, wsExchangeType);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                        wsMode === m.mode
                          ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <span>{m.label}</span>
                      <span className="ml-1 text-[10px] opacity-75 font-mono">({m.size})</span>
                    </button>
                  ))}
                </div>

                {/* Play / Pause Toggle & Refresh */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWsStreaming((p) => !p)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                      wsStreaming
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {wsStreaming ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                    <span>{wsStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => refreshWsTick()}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    title="Manual Tick Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrip Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Tracked Token Preset:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { token: '3045', name: 'SBIN', exchange: 'NSE', exchangeType: 1, ltp: 820.5 },
                    { token: '2885', name: 'RELIANCE', exchange: 'NSE', exchangeType: 1, ltp: 2950.0 },
                    { token: '11536', name: 'TCS', exchange: 'NSE', exchangeType: 1, ltp: 4150.0 },
                    { token: '1594', name: 'INFY', exchange: 'NSE', exchangeType: 1, ltp: 1850.0 },
                    { token: '1333', name: 'HDFCBANK', exchange: 'NSE', exchangeType: 1, ltp: 1720.0 },
                    { token: '99926000', name: 'NIFTY 50', exchange: 'NSE', exchangeType: 1, ltp: 23600.0 },
                    { token: '99926009', name: 'BANK NIFTY', exchange: 'NSE', exchangeType: 1, ltp: 50400.0 },
                    { token: '234230', name: 'GOLD MCX', exchange: 'MCX', exchangeType: 5, ltp: 76500.0 },
                  ].map((scrip) => (
                    <button
                      key={scrip.token}
                      type="button"
                      onClick={() => {
                        setWsSelectedToken(scrip.token);
                        setWsSelectedSymbol(scrip.name);
                        setWsExchangeType(scrip.exchangeType);
                        setWsCustomToken('');
                        if (!wsSubscribedTokens.includes(scrip.token)) {
                          setWsSubscribedTokens((t) => [...t, scrip.token]);
                        }
                        refreshWsTick(scrip.token, wsMode, scrip.exchangeType);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        wsSelectedToken === scrip.token && !wsCustomToken
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <span>{scrip.name}</span>
                      <span className="ml-1 text-[10px] font-mono text-slate-400">({scrip.token})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Token Subscription Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (wsCustomToken.trim()) {
                    const token = wsCustomToken.trim();
                    setWsSelectedToken(token);
                    setWsSelectedSymbol(`TOKEN_${token}`);
                    if (!wsSubscribedTokens.includes(token)) {
                      setWsSubscribedTokens((t) => [...t, token]);
                    }
                    refreshWsTick(token, wsMode, wsExchangeType);
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1"
              >
                <div className="sm:col-span-5">
                  <label className="block text-[10px] text-slate-500 mb-0.5">Subscribe Custom Token ID</label>
                  <input
                    type="text"
                    value={wsCustomToken}
                    onChange={(e) => setWsCustomToken(e.target.value.trim())}
                    placeholder="Enter Master Scrip Token ID (e.g. 10626, 5290)..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[10px] text-slate-500 mb-0.5">Exchange Type</label>
                  <select
                    value={wsExchangeType}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setWsExchangeType(val);
                      refreshWsTick(wsSelectedToken, wsMode, val);
                    }}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
                  >
                    <option value={1}>1 — nse_cm (NSE Equities)</option>
                    <option value={2}>2 — nse_fo (NSE Derivatives)</option>
                    <option value={3}>3 — bse_cm (BSE Equities)</option>
                    <option value={4}>4 — bse_fo (BSE Derivatives)</option>
                    <option value={5}>5 — mcx_fo (MCX Commodities)</option>
                  </select>
                </div>
                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="submit"
                    className="w-full min-h-[34px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Subscribe Token</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Tick Header Bar */}
            {wsActiveTick && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/50 via-teal-50/20 to-white dark:from-emerald-950/30 dark:via-slate-900/40 dark:to-slate-900">
                <div>
                  <div className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Token / Exchange
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <span>{wsSelectedSymbol}</span>
                    <span className="text-xs font-mono text-slate-500">({wsActiveTick.token})</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {wsActiveTick.exchangeName} · Seq: {wsActiveTick.sequenceNumber}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Last Traded Price (LTP)
                  </div>
                  <div className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ₹{formatNumberIN(wsActiveTick.lastTradedPrice)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Paise: {Math.round(wsActiveTick.lastTradedPrice * 100)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Average Traded Price (ATP)
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{wsActiveTick.averageTradedPrice ? formatNumberIN(wsActiveTick.averageTradedPrice) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Day Weighted Avg</div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Total Traded Volume
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {wsActiveTick.volumeTradedForTheDay ? formatNumberIN(wsActiveTick.volumeTradedForTheDay) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Contracts / Shares</div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Circuit Limits (Band)
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                    UC: ₹{wsActiveTick.upperCircuitLimit ? formatNumberIN(wsActiveTick.upperCircuitLimit) : '—'}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    LC: ₹{wsActiveTick.lowerCircuitLimit ? formatNumberIN(wsActiveTick.lowerCircuitLimit) : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    52-Week Range
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    High: ₹{wsActiveTick.fiftyTwoWeekHighPrice ? formatNumberIN(wsActiveTick.fiftyTwoWeekHighPrice) : '—'}
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                    Low: ₹{wsActiveTick.fiftyTwoWeekLowPrice ? formatNumberIN(wsActiveTick.fiftyTwoWeekLowPrice) : '—'}
                  </div>
                </div>
              </div>
            )}

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs">
              {[
                { id: 'depth' as const, label: 'Section 2: Best Five Market Depth (Ladder)' },
                { id: 'quote' as const, label: 'Section 1: Full Quote & OHLC' },
                { id: 'binary' as const, label: 'Raw Binary Packet Inspector (Hex Dump)' },
                { id: 'docs' as const, label: 'WebSocket 2.0 Auth & Spec' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setWsInspectorTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                    wsInspectorTab === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Section 2 - Level 2 Market Depth (Best 5 Buys & Sells) */}
            {wsInspectorTab === 'depth' && wsActiveTick && (
              <div className="space-y-4">
                {wsMode < 3 ? (
                  <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold">Best Five Market Depth data is transmitted in Mode 3 (Snap Quote Mode - 379 Bytes).</p>
                    <p className="mt-1 text-[11px]">
                      Currently viewing Mode {wsMode} ({wsMode === 1 ? 'LTP - 51 Bytes' : 'Quote - 123 Bytes'}). Switch to Mode 3 above to see live Level 2 bid/ask order book.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bids (Buys) */}
                      <div className="border border-emerald-200 dark:border-emerald-900/60 rounded-xl overflow-hidden bg-white dark:bg-slate-900/50">
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 px-3 border-b border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            BEST 5 BIDS (BUYS)
                          </span>
                          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                            Total Buy Qty: {wsActiveTick.totalBuyQuantity ? formatNumberIN(wsActiveTick.totalBuyQuantity) : '—'}
                          </span>
                        </div>
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 text-[10px]">
                            <tr>
                              <th className="py-2 px-3">Orders</th>
                              <th className="py-2 px-3 text-right">Quantity</th>
                              <th className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">Bid Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {(wsActiveTick.bestFiveBuys || []).map((buy: any, idx: number) => {
                              const pct = Math.min(100, (buy.quantity / 500) * 100);
                              return (
                                <tr key={idx} className="relative hover:bg-emerald-50/30">
                                  <td className="py-2 px-3 text-slate-500">{buy.numberOfOrders}</td>
                                  <td className="py-2 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                                    {formatNumberIN(buy.quantity)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                    ₹{Number(buy.price).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Asks (Sells) */}
                      <div className="border border-rose-200 dark:border-rose-900/60 rounded-xl overflow-hidden bg-white dark:bg-slate-900/50">
                        <div className="bg-rose-50/70 dark:bg-rose-950/40 p-2.5 px-3 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs">
                          <span className="font-bold text-rose-800 dark:text-rose-300">
                            BEST 5 ASKS (SELLS)
                          </span>
                          <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400">
                            Total Sell Qty: {wsActiveTick.totalSellQuantity ? formatNumberIN(wsActiveTick.totalSellQuantity) : '—'}
                          </span>
                        </div>
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 text-[10px]">
                            <tr>
                              <th className="py-2 px-3 font-bold text-rose-700 dark:text-rose-400">Ask Price (₹)</th>
                              <th className="py-2 px-3 text-right">Quantity</th>
                              <th className="py-2 px-3 text-right">Orders</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {(wsActiveTick.bestFiveSells || []).map((sell: any, idx: number) => {
                              return (
                                <tr key={idx} className="relative hover:bg-rose-50/30">
                                  <td className="py-2 px-3 font-bold text-rose-600 dark:text-rose-400">
                                    ₹{Number(sell.price).toFixed(2)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                                    {formatNumberIN(sell.quantity)}
                                  </td>
                                  <td className="py-2 px-3 text-right text-slate-500">{sell.numberOfOrders}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Order Book Depth Pressure Ratio */}
                    {wsActiveTick.totalBuyQuantity && wsActiveTick.totalSellQuantity && (
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-emerald-700 dark:text-emerald-400">
                            Buyers: {((wsActiveTick.totalBuyQuantity / (wsActiveTick.totalBuyQuantity + wsActiveTick.totalSellQuantity)) * 100).toFixed(1)}%
                          </span>
                          <span className="text-slate-500">Order Book Pressure</span>
                          <span className="text-rose-700 dark:text-rose-400">
                            Sellers: {((wsActiveTick.totalSellQuantity / (wsActiveTick.totalBuyQuantity + wsActiveTick.totalSellQuantity)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{
                              width: `${(wsActiveTick.totalBuyQuantity / (wsActiveTick.totalBuyQuantity + wsActiveTick.totalSellQuantity)) * 100}%`,
                            }}
                          ></div>
                          <div
                            className="bg-rose-500 h-full transition-all duration-500"
                            style={{
                              width: `${(wsActiveTick.totalSellQuantity / (wsActiveTick.totalBuyQuantity + wsActiveTick.totalSellQuantity)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tab 2: Section 1 - Full Quote & OHLC */}
            {wsInspectorTab === 'quote' && wsActiveTick && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500">Open Price</div>
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{wsActiveTick.openPrice ? formatNumberIN(wsActiveTick.openPrice) : '—'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500">High Price</div>
                  <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ₹{wsActiveTick.highPrice ? formatNumberIN(wsActiveTick.highPrice) : '—'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500">Low Price</div>
                  <div className="font-mono text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    ₹{wsActiveTick.lowPrice ? formatNumberIN(wsActiveTick.lowPrice) : '—'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500">Previous Close Price</div>
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{wsActiveTick.closePrice ? formatNumberIN(wsActiveTick.closePrice) : '—'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500">Last Traded Quantity</div>
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {wsActiveTick.lastTradedQuantity ?? '—'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500">Open Interest (OI)</div>
                  <div className="font-mono text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                    {wsActiveTick.openInterest ? formatNumberIN(wsActiveTick.openInterest) : '—'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500">Exchange Timestamp</div>
                  <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {wsActiveTick.exchangeTimeISO}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500">Binary Packet Size</div>
                  <div className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {wsPacketSize} Bytes
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Raw Binary Packet Inspector */}
            {wsInspectorTab === 'binary' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Live Little-Endian Binary Buffer ({wsPacketSize} Bytes)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(wsRawBase64);
                        alert('Base64 binary packet copied to clipboard!');
                      }
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] cursor-pointer"
                  >
                    Copy Base64 Payload
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] break-all leading-relaxed overflow-x-auto">
                  <div className="text-slate-500 mb-1">// Base64 Binary Stream (Little Endian):</div>
                  {wsRawBase64 || 'No packet received yet'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Binary layout strictly matches Section 1 &amp; Section 2 specification:
                  Mode 1 = 51 bytes (LTP) · Mode 2 = 123 bytes (Quote) · Mode 3 = 379 bytes (Snap Quote with 10 Best-5 depth entries).
                </div>
              </div>
            )}

            {/* Tab 4: WebSocket 2.0 Auth & Spec */}
            {wsInspectorTab === 'docs' && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  Angel One SmartAPI WebSocket 2.0 Streaming Architecture
                </div>
                <p className="leading-relaxed">
                  Endpoint: <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">wss://smartapisocket.angelone.in/smart-stream</code>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">Authentication Protocol</div>
                    <p className="text-[11px] text-slate-500">
                      Browser: Query params <code className="font-mono">?clientCode=&amp;feedToken=&amp;apiKey=</code><br />
                      Node/Server: Headers <code className="font-mono">Authorization, x-api-key, x-client-code, x-feed-token</code>
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">Heartbeat &amp; Quotas</div>
                    <p className="text-[11px] text-slate-500">
                      Heartbeat: Text <code className="font-mono">ping</code> every 30s → expects text <code className="font-mono">pong</code>.<br />
                      Limits: 1000 tokens per session, up to 3 concurrent connections per client code.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
