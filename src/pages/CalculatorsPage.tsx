import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calculator, Plus, Trash2, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
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
      </div>
    </main>
  );
}
