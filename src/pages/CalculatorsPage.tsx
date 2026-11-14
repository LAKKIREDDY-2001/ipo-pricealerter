import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import { api } from '../services/api';
import type { IPOOffering, StockInstrument } from '../types/financial';
import {
  calculateGMPEstimate,
  calculateIPOInvestment,
  calculateListingGainPct,
  calculateStockReturn,
  formatINR,
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
      </div>
    </main>
  );
}
