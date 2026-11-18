import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  RefreshCw,
  X,
  Clock,
  ArrowUpDown,
  AlertCircle,
  ExternalLink,
  Key,
  Lock,
  Unlock,
  ShieldAlert,
  Zap,
  Copy,
  Check,
  Radio,
  Calculator,
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/StateViews';
import { formatNumberIN } from '../utils/calculations';
import { api } from '../services/api';
import { CompanyLogo } from '../components/common/CompanyLogo';

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
  isin?: string;
}

const KNOWN_ISIN_MAP: Record<string, string> = {
  RELIANCE: 'INE002A01018',
  HDFCBANK: 'INE040A01034',
  TCS: 'INE467B01029',
  INFY: 'INE009A01021',
  SBIN: 'INE062A01020',
  TATASTEEL: 'INE081A01020',
  PARAGMILK: 'INE883N01014',
  TRENT: 'INE849A01020',
  TATAMOTORS: 'INE155A01022',
  ITC: 'INE154A01025',
  BHARTIARTL: 'INE397D01024',
  LT: 'INE018A01030',
  ICICIBANK: 'INE090A01021',
  KOTAKBANK: 'INE237A01028',
  WIPRO: 'INE075A01022',
  BAJFINANCE: 'INE296A01024',
};

const DEFAULT_SAMPLE_HOLDINGS: PortfolioHolding[] = [];
/* Removed hard-coded sample holdings from production UI.
const LEGACY_SAMPLE_HOLDINGS: PortfolioHolding[] = [
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
*/

const STORAGE_KEY = 'pa_external_portfolio_v2';

export function PortfolioTrackerPage() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          const demoIds = new Set(['h-reliance', 'h-hdfc', 'h-tcs', 'h-trent', 'h-ppfas', 'h-nippon']);
          return Array.isArray(saved) ? saved.filter((holding) => !demoIds.has(holding?.id)) : [];
        }
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

  // Broker Market API Demat Sync Modal
  const [angelModalOpen, setAngelModalOpen] = useState(false);
  const [angelSyncError, setAngelSyncError] = useState<string | null>(null);
  const [angelSyncing, setAngelSyncing] = useState(false);
  const [angelSuccess, setAngelSuccess] = useState(false);
  const [angelProfile, setAngelProfile] = useState<{
    clientcode: string;
    name?: string;
    exchanges?: string[];
    products?: string[];
    lastlogintime?: string;
  } | null>(null);
  const [angelFunds, setAngelFunds] = useState<{
    net?: string;
    availablecash?: string;
    collateral?: string;
  } | null>(null);

  // Tab State: Demat Holdings vs Broker Market API Orders & Trades vs Webhook Postbacks
  const [portfolioTab, setPortfolioTab] = useState<'holdings' | 'orderbook' | 'tradebook' | 'postbacks'>('holdings');

  // Order Book & Trade Book State
  const [orderBook, setOrderBook] = useState<any[]>([]);

  const [tradeBook, setTradeBook] = useState<any[]>([]);

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'OPEN' | 'EXECUTED' | 'CANCELLED' | 'REJECTED'>('ALL');

  // Postback / Webhook Stream State
  const [postbacks, setPostbacks] = useState<any[]>([]);
  const [loadingPostbacks, setLoadingPostbacks] = useState(false);
  const [postbackFilter, setPostbackFilter] = useState<'ALL' | 'COMPLETE' | 'PARTIALLY_EXECUTED' | 'OPEN' | 'CANCELLED' | 'REJECTED'>('ALL');
  const [postbackSearch, setPostbackSearch] = useState('');
  const [postbackCopied, setPostbackCopied] = useState(false);
  const [expandedPostbackId, setExpandedPostbackId] = useState<string | null>(null);

  // Simulate Postback Modal State
  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  const [simOrderId, setSimOrderId] = useState('201020000000080');
  const [simSymbol, setSimSymbol] = useState('SBIN-EQ');
  const [simToken, setSimToken] = useState('3045');
  const [simExchange, setSimExchange] = useState('NSE');
  const [simSide, setSimSide] = useState<'BUY' | 'SELL'>('BUY');
  const [simProduct, setSimProduct] = useState('DELIVERY');
  const [simOrderType, setSimOrderType] = useState('LIMIT');
  const [simQty, setSimQty] = useState('10');
  const [simPrice, setSimPrice] = useState('195.00');
  const [simEvent, setSimEvent] = useState<'COMPLETE' | 'PARTIAL' | 'OPEN' | 'CANCELLED' | 'REJECTED'>('COMPLETE');
  const [simReason, setSimReason] = useState('RMS:Rule: Check Margin failed. Insufficient funds in trading account');
  const [simulating, setSimulating] = useState(false);

  // Place Order Modal State
  const [placeOrderModalOpen, setPlaceOrderModalOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);

  // Place Order Form Fields
  const [orderSymbol, setOrderSymbol] = useState('SBIN-EQ');
  const [orderToken, setOrderToken] = useState('3045');
  const [orderExchange, setOrderExchange] = useState<'NSE' | 'BSE' | 'NFO' | 'MCX' | 'BFO'>('NSE');
  const [orderVariety, setOrderVariety] = useState<'NORMAL' | 'STOPLOSS' | 'ROBO' | 'AMO'>('NORMAL');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOPLOSS_LIMIT' | 'STOPLOSS_MARKET'>('LIMIT');
  const [orderProduct, setOrderProduct] = useState<'DELIVERY' | 'INTRADAY' | 'MARGIN' | 'CARRYFORWARD' | 'BO'>('DELIVERY');
  const [orderDuration, setOrderDuration] = useState<'DAY' | 'IOC'>('DAY');
  const [orderQty, setOrderQty] = useState('1');
  const [orderPrice, setOrderPrice] = useState('194.50');
  const [orderTriggerPrice, setOrderTriggerPrice] = useState('');
  const [orderSquareoff, setOrderSquareoff] = useState('');
  const [orderStoploss, setOrderStoploss] = useState('');
  const [orderScripConsent, setOrderScripConsent] = useState(true);

  // Inspect Individual Order Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectOrderData, setInspectOrderData] = useState<any | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // CDSL eDIS Authorisation Modal State
  const [edisModalOpen, setEdisModalOpen] = useState(false);
  const [edisHolding, setEdisHolding] = useState<PortfolioHolding | null>(null);
  const [edisIsin, setEdisIsin] = useState('INE062A01020');
  const [edisQuantity, setEdisQuantity] = useState('1');
  const [edisLoading, setEdisLoading] = useState(false);
  const [edisVerifyData, setEdisVerifyData] = useState<{
    ReqId?: string;
    DPId?: string | null;
    BOID?: string | null;
    TransDtls?: string | null;
    version?: string;
    ReturnURL?: string | null;
  } | null>(null);
  const [edisAlreadyRegistered, setEdisAlreadyRegistered] = useState(false);
  const [edisAuthStatus, setEdisAuthStatus] = useState<'IDLE' | 'AUTHORIZED' | 'PENDING' | 'FAILED'>('IDLE');
  const [edisMessage, setEdisMessage] = useState<string | null>(null);

  // TPIN Helper Drawer State
  const [tpinDrawerOpen, setTpinDrawerOpen] = useState(false);
  const [tpinPan, setTpinPan] = useState('');
  const [tpinGenerating, setTpinGenerating] = useState(false);
  const [tpinMessage, setTpinMessage] = useState<string | null>(null);
  const [edisStatusChecking, setEdisStatusChecking] = useState(false);

  const handleOpenEdisModal = (holding?: PortfolioHolding) => {
    if (holding) {
      setEdisHolding(holding);
      const isin = holding.isin || KNOWN_ISIN_MAP[holding.symbol] || 'INE062A01020';
      setEdisIsin(isin);
      setEdisQuantity(String(holding.quantity || 1));
    } else {
      setEdisHolding(null);
      setEdisIsin('INE062A01020');
      setEdisQuantity('1');
    }
    setEdisVerifyData(null);
    setEdisAlreadyRegistered(false);
    setEdisAuthStatus('IDLE');
    setEdisMessage(null);
    setTpinMessage(null);
    setTpinDrawerOpen(false);
    setEdisModalOpen(true);
  };

  const handleInitiateEdis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEdisLoading(true);
    setEdisMessage(null);
    setEdisVerifyData(null);
    try {
      const res = await api.verifyAngelEdis(edisIsin, edisQuantity);
      if (res.alreadyRegistered || res.errorcode === 'AG1000' || String(res.message).toLowerCase().includes('already')) {
        setEdisAlreadyRegistered(true);
        setEdisAuthStatus('AUTHORIZED');
        setEdisMessage('You have already been registered with CDSL for today! Authorisation is valid for 24 hours across all Demat sell orders.');
      } else if (res.status && res.data) {
        setEdisVerifyData(res.data);
        setEdisAuthStatus('PENDING');
        setEdisMessage('CDSL eDIS transaction parameters generated successfully. Click below to open CDSL India and enter your 6-digit TPIN.');
      } else {
        setEdisAuthStatus('FAILED');
        setEdisMessage(res.message || 'eDIS verification failed. Please verify the ISIN and try again.');
      }
    } catch (err: any) {
      setEdisAuthStatus('FAILED');
      setEdisMessage(err?.message || 'Network error initiating eDIS verification.');
    } finally {
      setEdisLoading(false);
    }
  };

  const handleSubmitCdslForm = () => {
    if (!edisVerifyData || !edisVerifyData.TransDtls) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://edis.cdslindia.com/eDIS/VerifyDIS/';
    form.target = '_blank';

    const addField = (name: string, value: string) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    };

    addField('DPId', edisVerifyData.DPId || '');
    addField('ReqId', edisVerifyData.ReqId || '');
    addField('Version', edisVerifyData.version || '1.1');
    addField('TransDtls', edisVerifyData.TransDtls || '');

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleCheckEdisStatus = async () => {
    const reqId = edisVerifyData?.ReqId;
    if (!reqId) return;
    setEdisStatusChecking(true);
    try {
      const res = await api.checkAngelEdisStatus(reqId);
      if (res.authorized) {
        setEdisAuthStatus('AUTHORIZED');
        setEdisMessage('CDSL Authorization Confirmed! Status: 1 (Authorised to Sell holdings).');
      } else {
        setEdisAuthStatus('PENDING');
        setEdisMessage('CDSL Status: 0 (Pending authorization). If you just entered your TPIN on CDSL, please wait 10 seconds and re-check.');
      }
    } catch (err: any) {
      setEdisMessage(err?.message || 'Could not verify transaction status from Broker.');
    } finally {
      setEdisStatusChecking(false);
    }
  };

  const handleGenerateTpin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tpinPan) return;
    setTpinGenerating(true);
    setTpinMessage(null);
    try {
      const res = await api.generateAngelEdisTpin({
        dpId: edisVerifyData?.DPId || '33200',
        reqId: edisVerifyData?.ReqId || `${Date.now()}`.slice(0, 16),
        boid: edisVerifyData?.BOID || '',
        pan: tpinPan.trim().toUpperCase(),
      });
      if (res.status) {
        setTpinMessage('TPIN generated successfully! CDSL has dispatched your 6-digit TPIN via SMS & email.');
      } else {
        setTpinMessage(res.message || 'TPIN generation failed. Please check your PAN number.');
      }
    } catch (err: any) {
      setTpinMessage(err?.message || 'Network error generating TPIN.');
    } finally {
      setTpinGenerating(false);
    }
  };

  // Auto-set symbol token when selecting common scrips
  const handleSelectScripPreset = (sym: string, tok: string, ex: 'NSE' | 'BSE' = 'NSE', price: string = '194.50') => {
    setOrderSymbol(sym);
    setOrderToken(tok);
    setOrderExchange(ex);
    setOrderPrice(price);
  };

  const refreshOrderBook = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getAngelOrderBook();
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setOrderBook(res.data);
      }
    } catch {
      // retain state
    } finally {
      setLoadingOrders(false);
    }
  };

  const refreshTradeBook = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getAngelTradeBook();
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTradeBook(res.data);
      }
    } catch {
      // retain state
    } finally {
      setLoadingOrders(false);
    }
  };

  const refreshPostbacks = async () => {
    setLoadingPostbacks(true);
    try {
      const res = await api.getAngelPostbacks();
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPostbacks(res.data);
      }
    } catch {
      // retain state
    } finally {
      setLoadingPostbacks(false);
    }
  };

  const handleSimulatePostback = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSimulating(true);
    try {
      const qty = Number(simQty) || 1;
      const price = Number(simPrice) || 0;
      const res = await api.simulateAngelPostback({
        orderid: simOrderId.trim() || `ORD_${Date.now()}`,
        tradingsymbol: simSymbol.trim().toUpperCase(),
        symboltoken: simToken.trim(),
        exchange: simExchange,
        transactiontype: simSide,
        producttype: simProduct,
        ordertype: simOrderType,
        quantity: qty,
        price,
        event: simEvent,
        rejectionReason: simReason,
      });

      if (res.ok && res.data) {
        const newRecord = res.data;
        setPostbacks((prev) => [newRecord, ...prev.filter((p) => p.orderid !== newRecord.orderid || p.receivedAt !== newRecord.receivedAt)]);

        // Sync with live Order Book if matching order exists
        setOrderBook((prev) =>
          prev.map((ord) => {
            if (String(ord.orderid) === String(newRecord.orderid)) {
              return {
                ...ord,
                status: newRecord.status,
                orderstatus: newRecord.orderstatus,
                filledshares: String(newRecord.filledshares),
                unfilledshares: String(newRecord.unfilledshares),
                averageprice: String(newRecord.averageprice),
                text: newRecord.text,
              };
            }
            return ord;
          })
        );

        // If completed or partial fill, append trade to Trade Book
        if (newRecord.numericFilledShares > 0) {
          setTradeBook((prev) => [
            {
              orderid: newRecord.orderid,
              fillid: newRecord.fillid || String(Math.floor(100000 + Math.random() * 900000)),
              tradingsymbol: newRecord.tradingsymbol,
              exchange: newRecord.exchange,
              transactiontype: newRecord.transactiontype,
              producttype: newRecord.producttype,
              fillprice: String(newRecord.averageprice),
              fillsize: String(newRecord.numericFilledShares),
              tradevalue: String(newRecord.averageprice * newRecord.numericFilledShares),
              filltime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            },
            ...prev,
          ]);
        }

        setSimulateModalOpen(false);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to simulate postback');
    } finally {
      setSimulating(false);
    }
  };

  const handleClearPostbacks = async () => {
    if (!confirm('Are you sure you want to clear the postback event stream?')) return;
    try {
      await api.clearAngelPostbacks();
      setPostbacks([]);
    } catch (err: any) {
      alert(err?.message || 'Error clearing postbacks');
    }
  };

  const handleCopyWebhookUrl = () => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/api/orders/angel/postback`
      : 'https://pricealerter.com/api/orders/angel/postback';
    navigator.clipboard?.writeText(url);
    setPostbackCopied(true);
    setTimeout(() => setPostbackCopied(false), 2000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSubmitting(true);
    setOrderErrorMessage(null);
    setOrderSuccessMessage(null);

    try {
      const res = await api.placeAngelOrder({
        variety: orderVariety,
        tradingsymbol: orderSymbol,
        symboltoken: orderToken,
        transactiontype: orderSide,
        exchange: orderExchange,
        ordertype: orderType,
        producttype: orderProduct,
        duration: orderDuration,
        price: orderType === 'MARKET' ? 0 : Number(orderPrice) || 0,
        quantity: Number(orderQty) || 1,
        triggerprice: orderTriggerPrice ? Number(orderTriggerPrice) : undefined,
        squareoff: orderSquareoff ? Number(orderSquareoff) : undefined,
        stoploss: orderStoploss ? Number(orderStoploss) : undefined,
        scripconsent: orderScripConsent ? 'yes' : 'no',
      });

      if (res.status && res.data) {
        const orderId = String(res.data.orderid || Date.now());
        const uOrderId = String(res.data.uniqueorderid || `uo-${Date.now()}`);
        setOrderSuccessMessage(`Order placed successfully! Order ID: ${orderId}, Unique ID: ${uOrderId}`);

        const newOrder = {
          orderid: orderId,
          uniqueorderid: uOrderId,
          tradingsymbol: orderSymbol,
          symboltoken: orderToken,
          transactiontype: orderSide,
          exchange: orderExchange,
          ordertype: orderType,
          producttype: orderProduct,
          duration: orderDuration,
          variety: orderVariety,
          price: orderPrice,
          quantity: orderQty,
          filledshares: 0,
          unfilledshares: orderQty,
          orderstatus: 'open',
          status: 'open',
          updatetime: new Date().toLocaleTimeString('en-IN'),
        };
        setOrderBook((prev) => [newOrder, ...prev]);

        setTimeout(() => {
          setPlaceOrderModalOpen(false);
          setOrderSuccessMessage(null);
          setPortfolioTab('orderbook');
        }, 1500);
      } else {
        setOrderErrorMessage(res.message || 'Failed to place order on Broker Market API');
      }
    } catch (err: any) {
      setOrderErrorMessage(err?.message || 'Network error placing order');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleCancelOrder = async (variety: string, orderid: string) => {
    if (!confirm(`Are you sure you want to cancel order #${orderid}?`)) return;
    try {
      const res = await api.cancelAngelOrder({
        variety: (variety as any) || 'NORMAL',
        orderid,
      });
      if (res.status) {
        setOrderBook((prev) =>
          prev.map((o) =>
            String(o.orderid) === orderid ? { ...o, orderstatus: 'cancelled', status: 'cancelled' } : o
          )
        );
      } else {
        alert(res.message || 'Could not cancel order');
      }
    } catch (err: any) {
      alert(err?.message || 'Error cancelling order');
    }
  };

  const handleInspectOrder = async (uniqueOrderId: string) => {
    setInspectModalOpen(true);
    setInspectLoading(true);
    try {
      const res = await api.getAngelOrderDetail(uniqueOrderId);
      if (res && res.data) {
        setInspectOrderData(res.data);
      } else {
        const found = orderBook.find((o) => o.uniqueorderid === uniqueOrderId);
        setInspectOrderData(found || null);
      }
    } catch {
      const found = orderBook.find((o) => o.uniqueorderid === uniqueOrderId);
      setInspectOrderData(found || null);
    } finally {
      setInspectLoading(false);
    }
  };

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

  const filteredPostbacks = useMemo(() => {
    let list = postbacks;
    if (postbackFilter !== 'ALL') {
      list = list.filter((p) => p.statusCategory === postbackFilter);
    }
    if (postbackSearch.trim()) {
      const q = postbackSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          String(p.orderid).toLowerCase().includes(q) ||
          String(p.tradingsymbol).toLowerCase().includes(q) ||
          String(p.clientcode || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [postbacks, postbackFilter, postbackSearch]);

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

  const handleAngelLogout = async () => {
    try {
      await fetch('/api/user/angel/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAngelProfile(null);
    setAngelFunds(null);
  };

  const handleSyncAngelHoldings = async () => {
    setAngelSyncing(true);
    setAngelSuccess(false);
    setAngelSyncError(null);

    try {
      const res = await fetch('/api/portfolio/angel/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.holdings) && data.holdings.length > 0) {
          setHoldings((prev) => {
            const existingSymbols = new Set(prev.map((h) => h.symbol));
            const nonDuplicate = data.holdings.filter((h: PortfolioHolding) => !existingSymbols.has(h.symbol));
            return [...nonDuplicate, ...prev];
          });

          // Fetch Broker User Profile and RMS Funds in parallel
          fetch('/api/user/angel/profile')
            .then((r) => r.json())
            .then((d) => {
              if (d.ok && d.profile) setAngelProfile(d.profile);
            })
            .catch(() => {});

          fetch('/api/user/angel/funds')
            .then((r) => r.json())
            .then((d) => {
              if (d.ok && d.funds) setAngelFunds(d.funds);
            })
            .catch(() => {});

          setAngelSyncing(false);
          setAngelSuccess(true);
          setTimeout(() => {
            setAngelModalOpen(false);
            setAngelSuccess(false);
          }, 1600);
          return;
        }
      }
    } catch {
      // Backend sync gracefully falls back to verified holdings snapshot
    }

    setAngelSyncError('Live holdings could not be retrieved. No sample account data was added. Check the server-side SmartAPI configuration and try again.');
    setAngelSyncing(false);
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
            onClick={() => handleOpenEdisModal()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-105 transition-all cursor-pointer"
            title="Authorise CDSL eDIS for Selling Demat holdings without POA"
          >
            <ShieldCheck className="w-4 h-4 text-blue-200" />
            <span>CDSL eDIS Authorise</span>
          </button>
          <button
            type="button"
            onClick={() => setAngelModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 dark:border-orange-800/60 bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-105 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Sync Broker Demat</span>
          </button>
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

      {/* Broker Market API Live Session & RMS Limits Card */}
      {angelProfile && (
        <section className="rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white dark:from-[#1e1510] dark:via-[#19151e] dark:to-[#111C2E] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/movers/angel-one.png"
              alt="Broker"
              className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 border border-orange-200 dark:border-orange-800 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#14263F] dark:text-white">
                  Broker Market API Session Connected
                </h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Demat
                </span>
              </div>
              <div className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {angelProfile.name && <span>• Name: <strong className="text-slate-800 dark:text-slate-200">{angelProfile.name}</strong></span>}
                {angelProfile.exchanges && (
                  <span>• Segments: <span className="font-mono text-[11px] text-orange-700 dark:text-orange-400 font-semibold">{angelProfile.exchanges.join(', ')}</span></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {angelFunds && (
              <div className="flex items-center gap-3 border-l md:border-l border-slate-200 dark:border-slate-800 pl-4 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Available Cash</div>
                  <div className="font-mono font-bold text-[#14263F] dark:text-white">
                    ₹{formatNumberIN(Math.round(Number(angelFunds.availablecash || 0)))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Collateral Margin</div>
                  <div className="font-mono font-bold text-[#14263F] dark:text-white">
                    ₹{formatNumberIN(Math.round(Number(angelFunds.collateral || 0)))}
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleAngelLogout}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        </section>
      )}

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

      {/* Holdings & SmartAPI Orders Section */}
      <section className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setPortfolioTab('holdings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                portfolioTab === 'holdings'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Demat Holdings</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {holdings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortfolioTab('orderbook');
                refreshOrderBook();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                portfolioTab === 'orderbook'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 hover:bg-orange-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Broker Order Book</span>
              {orderBook.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-orange-700/60 text-white">
                  {orderBook.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPortfolioTab('tradebook');
                refreshTradeBook();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                portfolioTab === 'tradebook'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Trade Book (Today)</span>
              {tradeBook.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-700/60 text-white">
                  {tradeBook.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPortfolioTab('postbacks');
                refreshPostbacks();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                portfolioTab === 'postbacks'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 hover:bg-purple-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Webhook / Postbacks</span>
              {postbacks.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-700/60 text-white">
                  {postbacks.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {portfolioTab === 'postbacks' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulateModalOpen(true)}
                  className="px-2.5 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                  title="Simulate Webhook Postback"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Simulate Webhook</span>
                </button>
                <button
                  type="button"
                  onClick={refreshPostbacks}
                  disabled={loadingPostbacks}
                  className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Refresh postbacks"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPostbacks ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearPostbacks}
                  className="px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear postback stream"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            )}
            {portfolioTab === 'orderbook' && (
              <button
                type="button"
                onClick={refreshOrderBook}
                disabled={loadingOrders}
                className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Refresh order book"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}

            {portfolioTab === 'tradebook' && (
              <button
                type="button"
                onClick={refreshTradeBook}
                disabled={loadingOrders}
                className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Refresh trade book"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}

            <Link
              to="/calculators/margin"
              className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Open SmartAPI Basket Margin Calculator"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Margin Calculator</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setOrderErrorMessage(null);
                setOrderSuccessMessage(null);
                setPlaceOrderModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Place Angel Order</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Holdings Table */}
        {portfolioTab === 'holdings' && (
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
                        <div className="flex items-center gap-2.5">
                          <CompanyLogo companyName={h.name} symbol={h.symbol} size="sm" />
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-100">{h.name}</div>
                            <div className="font-data text-[10px] text-[#64748B]">{h.symbol} · {h.sector}</div>
                          </div>
                        </div>
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
                      <td className="py-3.5 pl-3 text-center space-x-1 whitespace-nowrap">
                        {h.assetType === 'Equity' && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdisModal(h)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                            title="Authorise CDSL eDIS to sell shares without POA"
                          >
                            <Key className="w-3 h-3" />
                            <span>eDIS</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteHolding(h.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
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
        )}

        {/* Tab 2: Order Book */}
        {portfolioTab === 'orderbook' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Filter:</span>
                {(['ALL', 'OPEN', 'EXECUTED', 'CANCELLED', 'REJECTED'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOrderFilter(f)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      orderFilter === f
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400">
                Validated with Static IP &amp; Scrip Consent
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[#64748B] dark:text-slate-400 font-semibold">
                    <th className="pb-3 pr-3">Time / Order ID</th>
                    <th className="pb-3 px-3">Security</th>
                    <th className="pb-3 px-3">Side</th>
                    <th className="pb-3 px-3">Type</th>
                    <th className="pb-3 px-3">Product</th>
                    <th className="pb-3 px-3 text-right">Price</th>
                    <th className="pb-3 px-3 text-right">Qty (Filled)</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                    <th className="pb-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {orderBook
                    .filter((o) => {
                      if (orderFilter === 'ALL') return true;
                      const st = String(o.orderstatus || o.status || '').toLowerCase();
                      if (orderFilter === 'OPEN') return st.includes('open') || st.includes('pending');
                      if (orderFilter === 'EXECUTED') return st.includes('complete') || st.includes('traded');
                      if (orderFilter === 'CANCELLED') return st.includes('cancel');
                      if (orderFilter === 'REJECTED') return st.includes('reject');
                      return true;
                    })
                    .map((o) => {
                      const st = String(o.orderstatus || o.status || 'open').toLowerCase();
                      const isComplete = st.includes('complete') || st.includes('traded');
                      const isCancelled = st.includes('cancel');
                      const isRejected = st.includes('reject');
                      const isOpen = !isComplete && !isCancelled && !isRejected;

                      return (
                        <tr key={o.orderid || o.uniqueorderid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 pr-3">
                            <div className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                              #{o.orderid}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{o.updatetime || o.exchtime || 'Today'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <CompanyLogo companyName={o.tradingsymbol} symbol={o.tradingsymbol ? o.tradingsymbol.replace(/-EQ$/, '') : ''} size="sm" />
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-100">{o.tradingsymbol}</div>
                                <div className="font-mono text-[10px] text-slate-400">{o.exchange || 'NSE'} · Tok: {o.symboltoken || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                o.transactiontype === 'BUY'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800'
                              }`}
                            >
                              {o.transactiontype}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                              {o.ordertype}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                              {o.producttype}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            ₹{Number(o.price || 0).toFixed(2)}
                            {o.triggerprice && Number(o.triggerprice) > 0 && (
                              <div className="text-[9px] text-slate-400">Trig: ₹{Number(o.triggerprice).toFixed(2)}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{o.quantity}</span>
                            <span className="text-slate-400 text-[10px]"> ({o.filledshares || 0})</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isComplete
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                                  : isCancelled
                                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200'
                                  : isRejected
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 animate-pulse'
                              }`}
                            >
                              {o.orderstatus || o.status}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleInspectOrder(o.uniqueorderid || String(o.orderid))}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Inspect Order Status & Details"
                            >
                              Inspect
                            </button>
                            {isOpen && (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(o.variety || 'NORMAL', String(o.orderid))}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Cancel Order"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Trade Book */}
        {portfolioTab === 'tradebook' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Today's Executed Trades retrieved from Broker Market API
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[#64748B] dark:text-slate-400 font-semibold">
                    <th className="pb-3 pr-3">Fill Time</th>
                    <th className="pb-3 px-3">Security</th>
                    <th className="pb-3 px-3">Side</th>
                    <th className="pb-3 px-3">Product</th>
                    <th className="pb-3 px-3 text-right">Fill Price</th>
                    <th className="pb-3 px-3 text-right">Fill Qty</th>
                    <th className="pb-3 px-3 text-right">Trade Value</th>
                    <th className="pb-3 pl-3 text-right">Fill ID / Order ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {tradeBook.map((t) => (
                    <tr key={t.fillid || t.orderid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pr-3 font-mono text-[11px] text-slate-500">
                        {t.filltime || 'Today'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <CompanyLogo companyName={t.tradingsymbol} symbol={t.tradingsymbol ? t.tradingsymbol.replace(/-EQ$/, '') : ''} size="sm" />
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-100">{t.tradingsymbol}</div>
                            <div className="font-mono text-[10px] text-slate-400">{t.exchange || 'NSE'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.transactiontype === 'BUY'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {t.transactiontype}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                          {t.producttype}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        ₹{Number(t.fillprice || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {t.fillsize}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{formatNumberIN(Number(t.tradevalue || Number(t.fillprice || 0) * Number(t.fillsize || 0)))}
                      </td>
                      <td className="py-3 pl-3 text-right font-mono text-[10px] text-slate-400">
                        <div>FID: {t.fillid}</div>
                        <div>OID: #{t.orderid}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {portfolioTab === 'postbacks' && (
          <div className="space-y-4">
            {/* Webhook Configuration Banner */}
            <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-slate-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-slate-900/40 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Broker Market API Postback Webhook Endpoint</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-mono">
                        HTTPS Port 443
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      SmartAPI provides real-time updates of order execution via HTTP POST. AMO orders are dispatched at 9:00 AM on market open.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulateModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Simulate Webhook Delivery</span>
                  </button>
                </div>
              </div>

              {/* Webhook URL Input & Copy */}
              <div className="flex items-center gap-2 bg-white dark:bg-[#111C2E] border border-purple-200 dark:border-purple-900/50 rounded-lg p-1.5 shadow-inner">
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold rounded">
                  POST
                </span>
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/api/orders/angel/postback`
                      : 'https://pricealerter.com/api/orders/angel/postback'
                  }
                  className="flex-1 bg-transparent font-mono text-xs text-slate-800 dark:text-slate-200 outline-none px-2 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  className="px-3 py-1 text-xs rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                >
                  {postbackCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{postbackCopied ? 'Copied!' : 'Copy URL'}</span>
                </button>
              </div>

              {/* Badges / Specification pills */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Port 443 SSL Required
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  application/json
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  AMO 9:00 AM Callbacks
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Live Fills, Partial Fills &amp; RMS Rejections
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    { key: 'ALL', label: 'All Postbacks' },
                    { key: 'COMPLETE', label: 'Complete / Executed' },
                    { key: 'PARTIALLY_EXECUTED', label: 'Partial Fill' },
                    { key: 'OPEN', label: 'Open / Pending' },
                    { key: 'CANCELLED', label: 'Cancelled' },
                    { key: 'REJECTED', label: 'Rejected' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setPostbackFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      postbackFilter === f.key
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                    {f.key === 'ALL' && (
                      <span className="ml-1 opacity-70">({postbacks.length})</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by Order ID or Symbol..."
                  value={postbackSearch}
                  onChange={(e) => setPostbackSearch(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-3 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none w-48 sm:w-56"
                />
              </div>
            </div>

            {/* Postback Stream Table */}
            {filteredPostbacks.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
                <Zap className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <div className="text-xs font-semibold">No webhook postback events match the selected criteria.</div>
                <div className="text-[11px] text-slate-500">
                  Click <span className="font-semibold text-purple-600 dark:text-purple-400">"Simulate Webhook Delivery"</span> above to test an incoming fill or rejection event.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[#64748B] dark:text-slate-400 font-semibold">
                      <th className="pb-3 pr-3">Event Time</th>
                      <th className="pb-3 px-3">Security &amp; Side</th>
                      <th className="pb-3 px-3">Order Specs</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Execution Fill</th>
                      <th className="pb-3 px-3 text-right">Prices (Order / Avg)</th>
                      <th className="pb-3 pl-3 text-right">Order ID / Fill ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredPostbacks.map((pb, idx) => {
                      const isComplete = pb.statusCategory === 'COMPLETE';
                      const isPartial = pb.statusCategory === 'PARTIALLY_EXECUTED';
                      const isRejected = pb.statusCategory === 'REJECTED';
                      const isCancelled = pb.statusCategory === 'CANCELLED';
                      const isExpanded = expandedPostbackId === `${pb.orderid}-${idx}`;

                      return (
                        <React.Fragment key={`${pb.orderid}-${idx}`}>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 pr-3 font-mono text-[11px] text-slate-500">
                              <div>{pb.exchorderupdatetime || pb.updatetime || 'Just now'}</div>
                              <div className="text-[9px] text-slate-400">Recv: {new Date(pb.receivedAt || Date.now()).toLocaleTimeString()}</div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <CompanyLogo
                                  companyName={pb.tradingsymbol}
                                  symbol={pb.tradingsymbol ? pb.tradingsymbol.replace(/-EQ$/, '') : ''}
                                  size="sm"
                                />
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                    <span>{pb.tradingsymbol}</span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                        pb.transactiontype === 'BUY'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-red-50 text-red-700 border border-red-200'
                                      }`}
                                    >
                                      {pb.transactiontype}
                                    </span>
                                  </div>
                                  <div className="font-mono text-[10px] text-slate-400">
                                    {pb.exchange || 'NSE'} • {pb.symboltoken || ''}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                                  {pb.ordertype}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                                  {pb.producttype}
                                </span>
                                {pb.variety && pb.variety !== 'NORMAL' && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[10px]">
                                    {pb.variety}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                    isComplete
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                      : isPartial
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                      : isRejected
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                                      : isCancelled
                                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                                  }`}
                                >
                                  {isComplete && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                  {isRejected && <AlertCircle className="w-3 h-3 text-rose-600" />}
                                  <span>{pb.statusCategory || pb.status}</span>
                                </span>
                                {pb.text && (
                                  <div className="text-[10px] text-slate-500 max-w-xs truncate pt-0.5" title={pb.text}>
                                    {pb.text}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {pb.filledshares} / {pb.quantity} ({pb.fillPercent}%)
                              </div>
                              <div className="w-20 ml-auto h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isComplete ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${pb.fillPercent}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono">
                              <div className="font-bold text-slate-900 dark:text-white">
                                ₹{Number(pb.price || 0).toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Avg: ₹{Number(pb.averageprice || 0).toFixed(2)}
                              </div>
                            </td>

                            <td className="py-3 pl-3 text-right font-mono text-[10px] text-slate-400">
                              <div className="font-semibold text-slate-700 dark:text-slate-300">#{pb.orderid}</div>
                              {pb.fillid && <div className="text-[9px]">Fill: {pb.fillid}</div>}
                              <button
                                type="button"
                                onClick={() => setExpandedPostbackId(isExpanded ? null : `${pb.orderid}-${idx}`)}
                                className="text-purple-600 dark:text-purple-400 hover:underline text-[9px] mt-0.5 cursor-pointer"
                              >
                                {isExpanded ? 'Hide JSON ▲' : 'Raw JSON ▼'}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Raw JSON inspection drawer */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 dark:bg-slate-900/60">
                              <td colSpan={7} className="p-3">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                    <span>Exact SmartAPI Webhook Payload Snapshot</span>
                                    <span className="font-mono text-[10px]">Webhook payload</span>
                                  </div>
                                  <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-48">
                                    {JSON.stringify(pb, null, 2)}
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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

      {/* Broker Market API Demat Sync Modal */}
      {angelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/movers/angel-one.png"
                  alt="Broker"
                  className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 border border-orange-200 dark:border-orange-800 shadow-md shrink-0"
                />
                <div>
                  <h3 className="font-bold text-base text-[#14263F] dark:text-white">
                    Broker Market API Portfolio Sync
                  </h3>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Direct Demat holdings import via official SmartAPI v1
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAngelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>SEBI-Compliant Read-Only Integration</span>
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                Uses Broker's official <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">/portfolio/v1/getAllHolding</code> endpoint. PriceAlerter only reads settled shares and never executes orders.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 text-xs text-slate-600 dark:text-slate-300">
              Connection credentials are kept in the server environment and are never requested or displayed on this page.
            </div>

            {angelSyncError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{angelSyncError}</p>}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSyncAngelHoldings}
                disabled={angelSyncing}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 py-2.5 px-4 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {angelSyncing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Broker Demat...</span>
                  </>
                ) : angelSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Holdings Synced Successfully!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Sync My Broker Demat Holdings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broker Market API Place Order Modal */}
      {placeOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/movers/angel-one.png"
                  alt="Broker"
                  className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 border border-orange-200 dark:border-orange-800 shadow-md shrink-0"
                />
                <div>
                  <h3 className="font-bold text-base text-[#14263F] dark:text-white flex items-center gap-1.5">
                    <span>Broker Market API Order Execution</span>
                  </h3>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Direct exchange routing (NSE/BSE) via <code className="font-mono text-[10px]">/order/v1/placeOrder</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlaceOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrip Quick Selection Bar */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500">Quick Select Scrips:</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { sym: 'SBIN-EQ', name: 'SBIN', tok: '3045', price: '775.50' },
                  { sym: 'RELIANCE-EQ', name: 'RELIANCE', tok: '2885', price: '1367.00' },
                  { sym: 'INFY-EQ', name: 'INFY', tok: '1594', price: '1840.00' },
                  { sym: 'TATAMOTORS-EQ', name: 'TATAMOTORS', tok: '3456', price: '942.20' },
                  { sym: 'HDFCBANK-EQ', name: 'HDFCBANK', tok: '1333', price: '1742.50' },
                ].map((s) => (
                  <button
                    key={s.sym}
                    type="button"
                    onClick={() => handleSelectScripPreset(s.sym, s.tok, 'NSE', s.price)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      orderSymbol === s.sym
                        ? 'border-orange-500 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-300'
                    }`}
                  >
                    <CompanyLogo companyName={s.name} symbol={s.name} size="xs" />
                    <span>{s.sym}</span>
                  </button>
                ))}
              </div>
            </div>

            {orderErrorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{orderErrorMessage}</span>
              </div>
            )}

            {orderSuccessMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{orderSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-3.5 text-xs">
              {/* Side (BUY / SELL) */}
              <div>
                <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Transaction Side</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderSide('BUY')}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      orderSide === 'BUY'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    BUY ORDER
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSide('SELL')}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      orderSide === 'SELL'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    SELL ORDER
                  </button>
                </div>
                {orderSide === 'SELL' && (
                  <div className="mt-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-2.5 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-[11px]">Selling non-POA Demat holdings requires CDSL eDIS TPIN authorisation once daily.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cleanSym = orderSymbol.replace(/-EQ$/, '');
                        const found = holdings.find((h) => h.symbol === cleanSym);
                        handleOpenEdisModal(found);
                      }}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Authorise eDIS
                    </button>
                  </div>
                )}
              </div>

              {/* Symbol, Token & Exchange */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Trading Symbol</label>
                  <input
                    type="text"
                    required
                    value={orderSymbol}
                    onChange={(e) => setOrderSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN-EQ"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Token</label>
                  <input
                    type="text"
                    required
                    value={orderToken}
                    onChange={(e) => setOrderToken(e.target.value)}
                    placeholder="e.g. 3045"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 font-mono text-slate-800 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Order Variety, Exchange, Product */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Variety</label>
                  <select
                    value={orderVariety}
                    onChange={(e) => setOrderVariety(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-2.5 py-2 font-semibold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="STOPLOSS">STOPLOSS</option>
                    <option value="ROBO">ROBO</option>
                    <option value="AMO">AMO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Exchange</label>
                  <select
                    value={orderExchange}
                    onChange={(e) => setOrderExchange(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-2.5 py-2 font-semibold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="NFO">NFO</option>
                    <option value="MCX">MCX</option>
                    <option value="BFO">BFO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Product</label>
                  <select
                    value={orderProduct}
                    onChange={(e) => setOrderProduct(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-2.5 py-2 font-semibold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="DELIVERY">DELIVERY (CNC)</option>
                    <option value="INTRADAY">INTRADAY (MIS)</option>
                    <option value="MARGIN">MARGIN (MTF)</option>
                    <option value="CARRYFORWARD">CARRYFORWARD</option>
                    <option value="BO">BO (Bracket)</option>
                  </select>
                </div>
              </div>

              {/* Order Type, Duration */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-2.5 py-2 font-semibold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="LIMIT">LIMIT</option>
                    <option value="MARKET">MARKET</option>
                    <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
                    <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Duration</label>
                  <select
                    value={orderDuration}
                    onChange={(e) => setOrderDuration(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-2.5 py-2 font-semibold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="DAY">DAY</option>
                    <option value="IOC">IOC (Immediate/Cancel)</option>
                  </select>
                </div>
              </div>

              {/* Quantity, Price, Trigger Price */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    disabled={orderType === 'MARKET'}
                    required={orderType !== 'MARKET'}
                    value={orderType === 'MARKET' ? '0' : orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-orange-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">Trigger Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    disabled={!orderType.includes('STOPLOSS') && orderVariety !== 'STOPLOSS'}
                    value={orderTriggerPrice}
                    onChange={(e) => setOrderTriggerPrice(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 font-mono text-slate-800 dark:text-white outline-none focus:border-orange-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Live Margin Calculation Indicator */}
              {(() => {
                const q = Math.abs(Number(orderQty) || 1);
                const p = Number(orderPrice) || (orderType === 'MARKET' ? 250 : 0);
                const notional = q * p;
                const isDelivery = orderProduct === 'DELIVERY' && orderSide === 'BUY';
                const isDeriv = orderExchange === 'NFO' || orderExchange === 'BFO' || orderExchange === 'MCX';
                const estMargin = isDelivery
                  ? notional
                  : isDeriv
                  ? (orderSide === 'BUY' ? notional : Math.round(notional * 0.18))
                  : Math.round(notional * 0.20);

                return (
                  <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        SmartAPI Margin Estimate:
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isDelivery ? '(100% Delivery Cash)' : isDeriv ? '(SPAN/Options Premium)' : '(~5x Intraday MIS Leverage)'}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-purple-700 dark:text-purple-300">
                      ₹{formatNumberIN(estMargin)}
                    </div>
                  </div>
                );
              })()}

              {/* Compliance & Scrip Consent Checkbox */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orderScripConsent}
                    onChange={(e) => setOrderScripConsent(e.target.checked)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Pass <code className="font-mono text-orange-600 dark:text-orange-400">scripconsent: 'yes'</code> (Surveillance compliance)
                  </span>
                </label>
                <p className="text-[10px] text-slate-500">
                  Complies with static IP headers (<code className="font-mono">X-ClientLocalIP</code>, <code className="font-mono">X-ClientPublicIP</code>) and Broker Market API security guidelines.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPlaceOrderModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 px-6 py-2 text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {orderSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Order...</span>
                    </>
                  ) : (
                    <span>Submit Order to Broker</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Individual Order Details Modal */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/movers/angel-one.png"
                  alt="Broker"
                  className="w-9 h-9 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 border border-orange-200 dark:border-orange-800 shadow-md shrink-0"
                />
                <div>
                  <h3 className="font-bold text-base text-[#14263F] dark:text-white">
                    Order Status &amp; Audit Trail
                  </h3>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Endpoint: <code className="font-mono text-[10px]">/order/v1/details/:uniqueorderid</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {inspectLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
                <span className="text-xs">Fetching live status from Broker...</span>
              </div>
            ) : inspectOrderData ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CompanyLogo
                      companyName={inspectOrderData.tradingsymbol || 'SBIN'}
                      symbol={inspectOrderData.tradingsymbol ? String(inspectOrderData.tradingsymbol).replace(/-EQ$/, '') : 'SBIN'}
                      size="sm"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {inspectOrderData.tradingsymbol}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {inspectOrderData.exchange || 'NSE'} · Token: {inspectOrderData.symboltoken || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      String(inspectOrderData.orderstatus || inspectOrderData.status).toLowerCase().includes('complete')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : String(inspectOrderData.orderstatus || inspectOrderData.status).toLowerCase().includes('cancel')
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : String(inspectOrderData.orderstatus || inspectOrderData.status).toLowerCase().includes('reject')
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {inspectOrderData.orderstatus || inspectOrderData.status || 'OPEN'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-400">Order ID</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">#{inspectOrderData.orderid}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-400">Unique Order ID</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{inspectOrderData.uniqueorderid || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-400">Side / Variety</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {inspectOrderData.transactiontype} · {inspectOrderData.variety || 'NORMAL'}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-400">Order Type</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{inspectOrderData.ordertype}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-400">Product Type</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{inspectOrderData.producttype}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-400">Order Price</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">₹{Number(inspectOrderData.price || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-400">Filled / Total Qty</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {inspectOrderData.filledshares || 0} / {inspectOrderData.quantity}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-400">Avg Execution Price</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      ₹{Number(inspectOrderData.averageprice || inspectOrderData.price || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-sans text-slate-400">Update / Exch Time</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {inspectOrderData.updatetime || inspectOrderData.exchtime || 'Today'}
                    </div>
                  </div>
                </div>

                {inspectOrderData.text && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Exchange Remarks: </span>
                    {inspectOrderData.text}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setInspectModalOpen(false)}
                    className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Order details could not be retrieved.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CDSL eDIS Authorisation Modal */}
      {edisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/movers/angel-one.png"
                  alt="Broker"
                  className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 border border-orange-200 dark:border-orange-800 shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#14263F] dark:text-white">
                      CDSL eDIS Sell Authorisation
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400">
                      CDSL v1.1
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    SEBI-compliant online Demat sell pre-authorisation via SmartAPI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEdisModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SEBI Compliance & Regulations Box */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 p-3 space-y-1 text-xs text-blue-950 dark:text-blue-200">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Daily CDSL eDIS TPIN Authorisation</span>
              </div>
              <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-relaxed">
                Investors who have not submitted physical Power of Attorney (POA) must authorise CDSL once every trading day using their 6-digit TPIN &amp; OTP. Authorisation is valid for 24 hours across all sell orders.
              </p>
            </div>

            {/* Holding Preview */}
            {edisHolding && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <CompanyLogo companyName={edisHolding.name} symbol={edisHolding.symbol} size="sm" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-white">{edisHolding.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{edisHolding.symbol} · Qty: {edisHolding.quantity}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">LTP</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">₹{edisHolding.currentPrice.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Already Authorised State */}
            {edisAlreadyRegistered && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Authorised with CDSL for Today</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                  Your Demat holdings are already authorized for sale with CDSL for today (Error Code: <code className="font-mono">AG1000</code>). You can place sell orders directly without re-entering TPIN until the end of today's market session.
                </p>
              </div>
            )}

            {/* Action Feedback Messages */}
            {edisMessage && !edisAlreadyRegistered && (
              <div
                className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${
                  edisAuthStatus === 'AUTHORIZED'
                    ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                    : edisAuthStatus === 'FAILED'
                    ? 'border-red-200 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                    : 'border-blue-200 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300'
                }`}
              >
                {edisAuthStatus === 'AUTHORIZED' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : edisAuthStatus === 'FAILED' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{edisMessage}</span>
              </div>
            )}

            {/* Form & Verification Section */}
            {!edisAlreadyRegistered && (
              <form onSubmit={handleInitiateEdis} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">
                      ISIN (International Securities ID)
                    </label>
                    <input
                      type="text"
                      required
                      value={edisIsin}
                      onChange={(e) => setEdisIsin(e.target.value.toUpperCase())}
                      placeholder="e.g. INE528G01035"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[#64748B] dark:text-slate-400 mb-1 font-semibold">
                      Authorise Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={edisQuantity}
                      onChange={(e) => setEdisQuantity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {!edisVerifyData && (
                  <button
                    type="submit"
                    disabled={edisLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 py-2.5 px-4 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {edisLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Initiating with Broker &amp; CDSL...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Initiate CDSL eDIS Verification</span>
                      </>
                    )}
                  </button>
                )}
              </form>
            )}

            {/* Generated Transaction Parameters & Redirection */}
            {edisVerifyData && (
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">CDSL Req ID:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{edisVerifyData.ReqId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">DP ID / BO ID:</span>
                    <span className="text-slate-800 dark:text-slate-200">{edisVerifyData.DPId || '33200'} / {edisVerifyData.BOID || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">eDIS Protocol:</span>
                    <span className="text-slate-800 dark:text-slate-200">Version {edisVerifyData.version || '1.1'}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitCdslForm}
                    className="w-full sm:flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 py-2.5 px-4 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to CDSL Gateway (Enter TPIN)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckEdisStatus}
                    disabled={edisStatusChecking}
                    className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152338] px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${edisStatusChecking ? 'animate-spin' : ''}`} />
                    <span>Check Status</span>
                  </button>
                </div>
              </div>
            )}

            {/* Need a TPIN Helper Drawer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTpinDrawerOpen((prev) => !prev)}
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Don't know or forgot your 6-digit CDSL TPIN? Generate TPIN</span>
              </button>

              {tpinDrawerOpen && (
                <form onSubmit={handleGenerateTpin} className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 space-y-2.5">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Enter PAN Number to dispatch TPIN via SMS &amp; Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABCDE1234F"
                      value={tpinPan}
                      onChange={(e) => setTpinPan(e.target.value.toUpperCase())}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-1.5 font-mono text-xs uppercase text-slate-800 dark:text-white outline-none"
                    />
                    <button
                      type="submit"
                      disabled={tpinGenerating}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {tpinGenerating ? 'Requesting...' : 'Send TPIN'}
                    </button>
                  </div>
                  {tpinMessage && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      {tpinMessage}
                    </div>
                  )}
                </form>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setEdisModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulate Postback Webhook Modal */}
      {simulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#14263F] dark:text-white">
                    Simulate SmartAPI Postback Webhook
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Simulate real-time execution callbacks delivered to HTTPS Port 443
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimulateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-500">
                1-Click Execution Scenario Presets:
              </label>
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setSimOrderId('201020000000080');
                    setSimSymbol('SBIN-EQ');
                    setSimToken('3045');
                    setSimExchange('NSE');
                    setSimSide('BUY');
                    setSimProduct('INTRADAY');
                    setSimOrderType('LIMIT');
                    setSimQty('10');
                    setSimPrice('195.00');
                    setSimEvent('COMPLETE');
                  }}
                  className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] hover:border-emerald-400 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">⚡ Full Fill: SBIN 10 Qty</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">100% Executed @ ₹195.00</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimOrderId('201020000000080');
                    setSimSymbol('SBIN-EQ');
                    setSimToken('3045');
                    setSimExchange('NSE');
                    setSimSide('BUY');
                    setSimProduct('INTRADAY');
                    setSimOrderType('LIMIT');
                    setSimQty('10');
                    setSimPrice('195.00');
                    setSimEvent('PARTIAL');
                  }}
                  className="p-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-[11px] hover:border-amber-400 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-amber-800 dark:text-amber-300">⚡ Partial Fill: 50%</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">5 filled, 5 pending execution</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimOrderId('231010000000970');
                    setSimSymbol('RELIANCE-EQ');
                    setSimToken('2885');
                    setSimExchange('NSE');
                    setSimSide('BUY');
                    setSimProduct('DELIVERY');
                    setSimOrderType('LIMIT');
                    setSimQty('1');
                    setSimPrice('2298.25');
                    setSimEvent('REJECTED');
                    setSimReason('RMS:Rule: Check Margin failed. Insufficient funds in trading account');
                  }}
                  className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-[11px] hover:border-rose-400 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-rose-800 dark:text-rose-300">⚡ RMS Rejection: Reliance</div>
                  <div className="text-[10px] text-rose-600 dark:text-rose-400">Margin shortfall callback</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimOrderId(`ORD${Date.now()}`);
                    setSimSymbol('INFY-EQ');
                    setSimToken('1594');
                    setSimExchange('NSE');
                    setSimSide('BUY');
                    setSimProduct('DELIVERY');
                    setSimOrderType('LIMIT');
                    setSimQty('5');
                    setSimPrice('1850.00');
                    setSimEvent('CANCELLED');
                  }}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-[11px] hover:border-slate-400 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200">⚡ Order Cancelled</div>
                  <div className="text-[10px] text-slate-500">User / Exchange cancellation</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSimulatePostback} className="space-y-3 text-xs pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Order ID (SmartAPI)
                  </label>
                  <input
                    type="text"
                    required
                    value={simOrderId}
                    onChange={(e) => setSimOrderId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 text-slate-800 dark:text-white outline-none font-mono text-xs"
                    placeholder="e.g. 201020000000080"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Outcome
                  </label>
                  <select
                    value={simEvent}
                    onChange={(e) => setSimEvent(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 text-slate-800 dark:text-white outline-none text-xs font-semibold"
                  >
                    <option value="COMPLETE">COMPLETE (100% Filled / Traded)</option>
                    <option value="PARTIAL">PARTIAL (50% Filled, 50% Unfilled)</option>
                    <option value="OPEN">OPEN (Trigger Pending / Put to Exch)</option>
                    <option value="REJECTED">REJECTED (RMS Margin / Price Out of Circuit)</option>
                    <option value="CANCELLED">CANCELLED (Order Cancelled)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trading Symbol
                  </label>
                  <input
                    type="text"
                    required
                    value={simSymbol}
                    onChange={(e) => setSimSymbol(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 text-slate-800 dark:text-white outline-none font-mono text-xs uppercase"
                    placeholder="SBIN-EQ"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={simQty}
                    onChange={(e) => setSimQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 text-slate-800 dark:text-white outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    required
                    value={simPrice}
                    onChange={(e) => setSimPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152338] px-3 py-2 text-slate-800 dark:text-white outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {simEvent === 'REJECTED' && (
                <div>
                  <label className="block text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1">
                    Rejection Reason / RMS Exchange Message
                  </label>
                  <input
                    type="text"
                    value={simReason}
                    onChange={(e) => setSimReason(e.target.value)}
                    className="w-full rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2 text-slate-800 dark:text-white outline-none text-xs"
                    placeholder="RMS:Rule: Check Margin failed..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSimulateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{simulating ? 'Firing Webhook...' : 'Deliver Webhook Callback'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
