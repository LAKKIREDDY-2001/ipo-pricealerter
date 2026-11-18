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
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Send,
  Copy,
  Check,
  FileText,
  Search,
  Layers,
  ShieldAlert,
  ExternalLink,
  Gauge,
  Timer,
  Scale,
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

  // 11. Closing Auction Session (CAS) Suite State
  const [casSimTime, setCasSimTime] = useState<string>('15:22');
  const [casUseLiveTime, setCasUseLiveTime] = useState<boolean>(false);
  const [casSymbol, setCasSymbol] = useState<string>('RELIANCE');
  const [casRefPrice, setCasRefPrice] = useState<string>('1280.00');
  const [casOrderType, setCasOrderType] = useState<string>('LIMIT');
  const [casOrderAction, setCasOrderAction] = useState<'PLACE' | 'MODIFY' | 'CANCEL'>('PLACE');
  const [casOrderPrice, setCasOrderPrice] = useState<string>('1285.00');
  const [casIsIceberg, setCasIsIceberg] = useState<boolean>(false);
  const [casTab, setCasTab] = useState<'monitor' | 'validator' | 'bands' | 'auction' | 'squareoff'>('monitor');

  // Sample trades between 3:00 and 3:15 pm for Reference Price calculation
  const [casSampleTrades, setCasSampleTrades] = useState<Array<{ price: number; volume: number; time: string }>>([
    { price: 1279.50, volume: 14500, time: '15:02:14' },
    { price: 1280.25, volume: 28000, time: '15:05:40' },
    { price: 1280.00, volume: 52000, time: '15:08:12' },
    { price: 1281.50, volume: 34000, time: '15:11:55' },
    { price: 1280.75, volume: 41500, time: '15:14:30' },
  ]);

  // Auction simulation order book (Bids & Asks)
  const [casBids, setCasBids] = useState<Array<{ price: number; quantity: number }>>([
    { price: 1295.0, quantity: 5000 },
    { price: 1290.0, quantity: 12000 },
    { price: 1285.0, quantity: 25000 },
    { price: 1280.0, quantity: 40000 },
    { price: 1275.0, quantity: 15000 },
  ]);
  const [casAsks, setCasAsks] = useState<Array<{ price: number; quantity: number }>>([
    { price: 1270.0, quantity: 8000 },
    { price: 1275.0, quantity: 18000 },
    { price: 1280.0, quantity: 35000 },
    { price: 1285.0, quantity: 22000 },
    { price: 1290.0, quantity: 10000 },
  ]);

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

  // 8. Angel One SmartAPI WebSocket Order Status (Streaming)
  const [orderWsConnected, setOrderWsConnected] = useState(true);
  const [orderWsActiveConnections, setOrderWsActiveConnections] = useState(1);
  const [orderWsHeartbeatTimer, setOrderWsHeartbeatTimer] = useState(10);
  const [orderWsHeartbeatLatency, setOrderWsHeartbeatLatency] = useState(15);
  const [orderWsAutoStream, setOrderWsAutoStream] = useState(true);
  const [orderWsBreachError, setOrderWsBreachError] = useState<string | null>(null);
  const [orderWsEvents, setOrderWsEvents] = useState<any[]>([]);
  const [orderWsSelectedEvent, setOrderWsSelectedEvent] = useState<any>(null);
  const [orderWsActiveTab, setOrderWsActiveTab] = useState<'feed' | 'simulator' | 'inspector' | 'docs'>('feed');
  const [orderWsCopied, setOrderWsCopied] = useState(false);

  // Custom Simulator Form State
  const [simSymbol, setSimSymbol] = useState('SBIN-EQ');
  const [simQty, setSimQty] = useState('10');
  const [simPrice, setSimPrice] = useState('820.5');
  const [simSide, setSimSide] = useState<'BUY' | 'SELL'>('BUY');
  const [simStatus, setSimStatus] = useState('AB01');
  const [simProduct, setSimProduct] = useState('DELIVERY');
  const [simOrderType, setSimOrderType] = useState('LIMIT');
  const [simOrderId, setSimOrderId] = useState('ORD_781290');

  // Load initial order status updates
  const loadOrderWsEvents = async () => {
    try {
      const res = await api.getAngelOrderStatusEvents({ limit: 30 });
      if (res && res.events && res.events.length > 0) {
        setOrderWsEvents(res.events);
        if (!orderWsSelectedEvent) setOrderWsSelectedEvent(res.events[0]);
      } else {
        // Seed initial handshake AB00 & open order AB01
        const seed1 = await api.simulateAngelOrderStatus({ orderStatus: 'AB00', userId: 'CLIENT_A8892' });
        const seed2 = await api.simulateAngelOrderStatus({
          orderStatus: 'AB01',
          userId: 'CLIENT_A8892',
          tradingsymbol: 'SBIN-EQ',
          quantity: 25,
          price: 820.5,
          orderId: 'ORD_10098',
        });
        const combined = [seed2.record, seed1.record].filter(Boolean);
        setOrderWsEvents(combined);
        setOrderWsSelectedEvent(seed2.record || seed1.record);
      }
    } catch (err) {
      console.warn('Failed to load order status events:', err);
    }
  };

  useEffect(() => {
    if (activeTool === 'order-websocket' || activeTool === 'all') {
      loadOrderWsEvents();
    }
  }, [activeTool]);

  // 10-Second Ping/Pong Heartbeat Tracker
  useEffect(() => {
    if (!orderWsConnected || (activeTool !== 'order-websocket' && activeTool !== 'all')) return;
    const timer = setInterval(() => {
      setOrderWsHeartbeatTimer((prev) => {
        if (prev <= 1) {
          setOrderWsHeartbeatLatency(Math.floor(12 + Math.random() * 12));
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orderWsConnected, activeTool]);

  // Periodic Auto-stream lifecycle updater
  useEffect(() => {
    if (!orderWsConnected || !orderWsAutoStream || (activeTool !== 'order-websocket' && activeTool !== 'all')) return;
    const interval = setInterval(async () => {
      try {
        const statuses = ['AB01', 'AB04', 'AB05', 'AB10', 'AB02'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const scrips = [
          { symbol: 'SBIN-EQ', token: '3045', price: 820.5 },
          { symbol: 'RELIANCE-EQ', token: '2885', price: 2950.0 },
          { symbol: 'TCS-EQ', token: '11536', price: 4150.0 },
          { symbol: 'INFY-EQ', token: '1594', price: 1845.0 },
          { symbol: 'NIFTY24NOV24000CE', token: '67300', price: 165.5 },
        ];
        const scrip = scrips[Math.floor(Math.random() * scrips.length)];
        const side = Math.random() > 0.4 ? 'BUY' : 'SELL';
        const qty = [5, 10, 25, 50, 100][Math.floor(Math.random() * 5)];

        const res = await api.simulateAngelOrderStatus({
          orderStatus: randomStatus,
          tradingsymbol: scrip.symbol,
          symboltoken: scrip.token,
          price: scrip.price,
          quantity: qty,
          transactiontype: side,
        });

        if (res && res.record) {
          setOrderWsEvents((prev) => [res.record, ...prev.slice(0, 49)]);
          setOrderWsSelectedEvent(res.record);
        }
      } catch (err) {
        // Ignore background timer errors
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [orderWsConnected, orderWsAutoStream, activeTool]);

  // Dispatch simulated order event
  const dispatchSimulatedOrder = async (overrideStatus?: string) => {
    try {
      const statusToUse = overrideStatus || simStatus;
      const res = await api.simulateAngelOrderStatus({
        orderStatus: statusToUse,
        tradingsymbol: simSymbol,
        quantity: Number(simQty) || 1,
        price: Number(simPrice) || 0,
        transactiontype: simSide,
        producttype: simProduct,
        ordertype: simOrderType,
        orderId: simOrderId,
      });
      if (res && res.record) {
        setOrderWsEvents((prev) => [res.record, ...prev.slice(0, 49)]);
        setOrderWsSelectedEvent(res.record);
        setSimOrderId(`ORD_${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } catch (err) {
      console.warn('Dispatch order status error:', err);
    }
  };

  // Test breach limit of 3 concurrent connections (HTTP 429)
  const handleSimulateConnectionIncrement = () => {
    if (orderWsActiveConnections >= 3) {
      setOrderWsBreachError(
        'HTTP 429 Too Many Requests: Client connection limit breached! Each client code is strictly limited to 3 concurrent connections. Close unused connections.'
      );
    } else {
      setOrderWsActiveConnections((c) => c + 1);
      setOrderWsBreachError(null);
    }
  };

  const handleResetConnections = () => {
    setOrderWsActiveConnections(1);
    setOrderWsBreachError(null);
  };

  // 9. Angel One SmartAPI Instruments & Scrip Master Suite
  const [scripMasterSegment, setScripMasterSegment] = useState<string>('all');
  const [scripMasterQuery, setScripMasterQuery] = useState<string>('');
  const [scripMasterData, setScripMasterData] = useState<{
    instruments: Array<{
      token: string;
      symbol: string;
      name: string;
      expiry?: string;
      strike?: string | number;
      lotsize?: string | number;
      instrumenttype?: string;
      exch_seg: string;
      tick_size?: string | number;
      is_cas_enabled?: boolean;
    }>;
    totalAvailable: number;
    filteredCount: number;
    segmentCounts: Record<string, number>;
    sourceUrl: string;
    retrievedAt: string;
  } | null>(null);
  const [scripMasterLoading, setScripMasterLoading] = useState<boolean>(false);
  const [scripMasterCopiedToken, setScripMasterCopiedToken] = useState<string | null>(null);

  // Search Scrip
  const [searchScripExchange, setSearchScripExchange] = useState<'NSE' | 'BSE' | 'NFO' | 'MCX'>('NSE');
  const [searchScripQuery, setSearchScripQuery] = useState<string>('SBIN');
  const [searchScripLoading, setSearchScripLoading] = useState<boolean>(false);
  const [searchScripResults, setSearchScripResults] = useState<
    Array<{ exchange: string; tradingsymbol: string; symboltoken: string }>
  >([]);

  // Intraday Allowed Scrips
  const [intradayExchange, setIntradayExchange] = useState<'NSE' | 'BSE'>('NSE');
  const [intradayLoading, setIntradayLoading] = useState<boolean>(false);
  const [intradayScrips, setIntradayScrips] = useState<
    Array<{ exchange: string; SymbolName: string; Multiplier: string }>
  >([]);
  const [intradayFilterQuery, setIntradayFilterQuery] = useState<string>('');

  // Cautionary Scrips
  const [cautionaryLoading, setCautionaryLoading] = useState<boolean>(false);
  const [cautionaryScrips, setCautionaryScrips] = useState<
    Array<{ token: string; symbol: string; message: string; category?: string }>
  >([]);
  const [cautionaryCategoryFilter, setCautionaryCategoryFilter] = useState<string>('ALL');

  // Live LTP Quote Tester
  const [ltpExchange, setLtpExchange] = useState<'NSE' | 'BSE'>('NSE');
  const [ltpSymbol, setLtpSymbol] = useState<string>('SBIN-EQ');
  const [ltpToken, setLtpToken] = useState<string>('3045');
  const [ltpLoading, setLtpLoading] = useState<boolean>(false);
  const [ltpQuote, setLtpQuote] = useState<{
    exchange: string;
    tradingsymbol: string;
    symboltoken: string;
    open: number;
    high: number;
    low: number;
    close: number;
    ltp: number;
  } | null>(null);
  const [ltpError, setLtpError] = useState<string | null>(null);

  // Fetch Scrip Master
  const loadScripMaster = async (segment = scripMasterSegment, query = scripMasterQuery) => {
    setScripMasterLoading(true);
    try {
      const res = await api.getAngelScripMaster({
        segment: segment === 'all' ? undefined : segment,
        query: query.trim() || undefined,
        limit: 100,
      });
      if (res && res.ok) {
        setScripMasterData(res);
      }
    } catch (err) {
      console.warn('Failed to load scrip master:', err);
    } finally {
      setScripMasterLoading(false);
    }
  };

  // Perform Scrip Search
  const performSearchScrip = async (exchange = searchScripExchange, q = searchScripQuery) => {
    if (!q.trim()) return;
    setSearchScripLoading(true);
    try {
      const res = await api.searchAngelScrip(exchange, q.trim());
      if (res && res.data) {
        setSearchScripResults(res.data);
      }
    } catch (err) {
      console.warn('Failed to search scrip:', err);
    } finally {
      setSearchScripLoading(false);
    }
  };

  // Load Intraday Scrips
  const loadIntradayScrips = async (exchange = intradayExchange) => {
    setIntradayLoading(true);
    try {
      const res = await api.getAngelIntradayScrips(exchange);
      if (res && res.data) {
        setIntradayScrips(res.data);
      }
    } catch (err) {
      console.warn('Failed to load intraday scrips:', err);
    } finally {
      setIntradayLoading(false);
    }
  };

  // Load Cautionary Scrips
  const loadCautionaryScrips = async () => {
    setCautionaryLoading(true);
    try {
      const res = await api.getAngelCautionaryScrips();
      if (res && res.data) {
        setCautionaryScrips(res.data);
      }
    } catch (err) {
      console.warn('Failed to load cautionary scrips:', err);
    } finally {
      setCautionaryLoading(false);
    }
  };

  // Fetch Live LTP
  const handleFetchLtp = async (exch = ltpExchange, sym = ltpSymbol, tok = ltpToken) => {
    if (!tok.trim()) {
      setLtpError('Please enter a valid symbol token');
      return;
    }
    setLtpLoading(true);
    setLtpError(null);
    try {
      const res = await api.getAngelInstrumentLtp(exch, sym.trim(), tok.trim());
      if (res && res.data && res.data.length > 0) {
        setLtpQuote(res.data[0]);
      } else {
        setLtpError('No quote returned for this symbol/token');
      }
    } catch (err: any) {
      setLtpError(err?.message || 'Failed to fetch LTP');
    } finally {
      setLtpLoading(false);
    }
  };

  const handleCopyToken = (tok: string) => {
    navigator.clipboard?.writeText(tok);
    setScripMasterCopiedToken(tok);
    setTimeout(() => setScripMasterCopiedToken(null), 2000);
  };

  const handleSelectInstrumentForLtp = (exch: string, sym: string, tok: string) => {
    const standardExch = exch.toLowerCase().includes('bse') ? 'BSE' : 'NSE';
    setLtpExchange(standardExch);
    setLtpSymbol(sym);
    setLtpToken(tok);
    handleFetchLtp(standardExch, sym, tok);
  };

  // 10. Angel One SmartAPI Rate Limit Suite State
  const [rateLimitCatalog, setRateLimitCatalog] = useState<any[]>([]);
  const [rateLimitStatus, setRateLimitStatus] = useState<any>(null);
  const [rateLimitLoading, setRateLimitLoading] = useState(false);
  const [rateLimitSearch, setRateLimitSearch] = useState('');
  const [rateLimitCategory, setRateLimitCategory] = useState<string>('ALL');
  const [burstApiName, setBurstApiName] = useState<string>('Place Order');
  const [burstCount, setBurstCount] = useState<number>(12);
  const [burstClientCode, setBurstClientCode] = useState<string>('TRADER_CLIENT');
  const [burstResult, setBurstResult] = useState<any>(null);
  const [burstSimulating, setBurstSimulating] = useState(false);
  const [rateLimitTab, setRateLimitTab] = useState<'catalog' | 'simulator' | 'telemetry' | 'spec'>('catalog');
  const [quotaCheckApi, setQuotaCheckApi] = useState<string>('Place Order');
  const [quotaCheckResult, setQuotaCheckResult] = useState<any>(null);
  const [quotaCheckLoading, setQuotaCheckLoading] = useState(false);

  const loadRateLimitCatalog = async () => {
    try {
      setRateLimitLoading(true);
      const res = await api.getAngelRateLimitsCatalog();
      if (res.ok && res.catalog) {
        setRateLimitCatalog(res.catalog);
      }
    } catch {
      // fallback
    } finally {
      setRateLimitLoading(false);
    }
  };

  const loadRateLimitStatus = async (clientCode = burstClientCode) => {
    try {
      const res = await api.getAngelRateLimitsStatus(clientCode);
      if (res.ok) {
        setRateLimitStatus(res);
      }
    } catch {
      // fallback
    }
  };

  const handleSimulateBurst = async () => {
    try {
      setBurstSimulating(true);
      setBurstResult(null);
      const res = await api.simulateAngelRateLimitBurst(burstApiName, burstCount, burstClientCode);
      if (res.ok && res.simulation) {
        setBurstResult(res.simulation);
        loadRateLimitStatus(burstClientCode);
      }
    } catch {
      // ignore
    } finally {
      setBurstSimulating(false);
    }
  };

  const handleResetRateLimits = async () => {
    try {
      await api.resetAngelRateLimits(burstClientCode);
      setBurstResult(null);
      setQuotaCheckResult(null);
      loadRateLimitStatus(burstClientCode);
    } catch {
      // ignore
    }
  };

  const handleCheckQuota = async () => {
    try {
      setQuotaCheckLoading(true);
      const res = await api.checkAngelRateLimit(quotaCheckApi, burstClientCode, false);
      if (res.ok && res.result) {
        setQuotaCheckResult(res.result);
      }
    } catch {
      // ignore
    } finally {
      setQuotaCheckLoading(false);
    }
  };

  useEffect(() => {
    if (activeTool === 'instruments' || activeTool === 'all') {
      loadScripMaster('all', '');
      performSearchScrip('NSE', 'SBIN');
      loadIntradayScrips('NSE');
      loadCautionaryScrips();
      handleFetchLtp('NSE', 'SBIN-EQ', '3045');
    }
    if (activeTool === 'rate-limits' || activeTool === 'all') {
      loadRateLimitCatalog();
      loadRateLimitStatus();
    }
  }, [activeTool]);

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

  // Derived CAS Phase & Timings
  const effectiveCasTime = useMemo(() => {
    if (!casUseLiveTime) return casSimTime;
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffsetMs);
    const h = String(ist.getHours()).padStart(2, '0');
    const m = String(ist.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, [casSimTime, casUseLiveTime]);

  const activeCasPhase = useMemo(() => {
    const [hStr, mStr] = effectiveCasTime.split(':');
    const h = parseInt(hStr || '15', 10);
    const m = parseInt(mStr || '20', 10);
    const mins = h * 60 + m;

    if (mins >= 555 && mins < 915) {
      return {
        id: 'CONTINUOUS_TRADING',
        name: 'Continuous Trading Session',
        timeRange: '9.15 am - 3.15 pm',
        permittedActions: 'All order types (Limit, Market, SL, SL-M, Iceberg, Robo) permitted across all segments.',
        isOrderEntryAllowed: true,
        allowedOrderTypes: ['LIMIT', 'MARKET', 'SL', 'ICEBERG'],
        canModifyMarketOrders: true,
        isStopLossAllowed: true,
        isIcebergAllowed: true,
        priceType: 'LTP',
        badgeColor: 'blue',
      };
    } else if (mins >= 915 && mins < 920) {
      return {
        id: 'TRANSITION_TO_CAS',
        name: 'Transition from continuous trading to CAS',
        timeRange: '3.15 - 3.20 pm',
        permittedActions: 'Reference price is calculated. Order entry via SmartAPI will be rejected in this phase.',
        isOrderEntryAllowed: false,
        allowedOrderTypes: [],
        canModifyMarketOrders: false,
        isStopLossAllowed: false,
        isIcebergAllowed: false,
        priceType: 'REFERENCE_LIMIT_PRICE',
        badgeColor: 'rose',
      };
    } else if (mins >= 920 && mins < 925) {
      return {
        id: 'ORDER_ENTRY_AND_MODIFICATION',
        name: 'Order entry and modification opens',
        timeRange: '3.20 - 3.25 pm',
        permittedActions: 'Limit and Market orders can be placed, modified, or cancelled within ±3% Reference Price band.',
        isOrderEntryAllowed: true,
        allowedOrderTypes: ['LIMIT', 'MARKET'],
        canModifyMarketOrders: true,
        isStopLossAllowed: false,
        isIcebergAllowed: false,
        priceType: 'REFERENCE_LIMIT_PRICE',
        badgeColor: 'emerald',
      };
    } else if (mins >= 925 && mins < 930) {
      return {
        id: 'LIMIT_ORDERS_ONLY',
        name: 'Limit orders only',
        timeRange: '3.25 - 3.30 pm',
        permittedActions: 'No changes or cancellations on Market Orders. Limit orders can still be placed/modified. Random close between 3:28 pm and 3:30 pm.',
        isOrderEntryAllowed: true,
        allowedOrderTypes: ['LIMIT'],
        canModifyMarketOrders: false,
        isStopLossAllowed: false,
        isIcebergAllowed: false,
        priceType: 'REFERENCE_LIMIT_PRICE',
        badgeColor: 'amber',
      };
    } else if (mins >= 930 && mins < 935) {
      return {
        id: 'ORDER_MATCHING',
        name: 'Order Matching',
        timeRange: '3.30 - 3.35 pm',
        permittedActions: 'Orders are matched against each other via volume maximisation, and the closing price (Equilibrium Price) is set.',
        isOrderEntryAllowed: false,
        allowedOrderTypes: [],
        canModifyMarketOrders: false,
        isStopLossAllowed: false,
        isIcebergAllowed: false,
        priceType: 'EQUILIBRIUM_PRICE',
        badgeColor: 'purple',
      };
    } else if (mins >= 935 && mins < 950) {
      return {
        id: 'BUFFER_PERIOD',
        name: 'Buffer Period',
        timeRange: '3.35 - 3.50 pm',
        permittedActions: 'Transition from CAS to Post-closing session. Extended F&O trading ceases at 3:40 pm.',
        isOrderEntryAllowed: false,
        allowedOrderTypes: [],
        canModifyMarketOrders: false,
        isStopLossAllowed: false,
        isIcebergAllowed: false,
        priceType: 'EQUILIBRIUM_PRICE',
        badgeColor: 'slate',
      };
    } else if (mins >= 950 && mins < 960) {
      return {
        id: 'POST_CLOSING_SESSION',
        name: 'Post-closing Session',
        timeRange: '3.50 - 4.00 pm',
        permittedActions: 'Trades settle at the Equilibrium Price discovered in the auction. Applies to all stocks.',
        isOrderEntryAllowed: true,
        allowedOrderTypes: ['MARKET'],
        canModifyMarketOrders: false,
        isStopLossAllowed: false,
        isIcebergAllowed: false,
        priceType: 'EQUILIBRIUM_PRICE',
        badgeColor: 'teal',
      };
    } else {
      return {
        id: 'MARKET_CLOSED',
        name: 'Market Closed',
        timeRange: '4.00 pm - 9.15 am',
        permittedActions: 'Market sessions closed. Next regular continuous session commences at 9:15 am IST.',
        isOrderEntryAllowed: false,
        allowedOrderTypes: [],
        canModifyMarketOrders: false,
        isStopLossAllowed: false,
        isIcebergAllowed: false,
        priceType: 'EQUILIBRIUM_PRICE',
        badgeColor: 'slate',
      };
    }
  }, [effectiveCasTime]);

  // Derived Reference Price & ±3% Price Band
  const casCalculatedRef = useMemo(() => {
    let totVal = 0;
    let totVol = 0;
    for (const t of casSampleTrades) {
      totVal += t.price * t.volume;
      totVol += t.volume;
    }
    const vwap = totVol > 0 ? Math.round((totVal / totVol) * 20) / 20 : Number(casRefPrice) || 1280.0;
    const bandLow = Math.round(vwap * 0.97 * 20) / 20;
    const bandHigh = Math.round(vwap * 1.03 * 20) / 20;
    return {
      referencePrice: vwap,
      bandLow,
      bandHigh,
      totVol,
      totVal,
    };
  }, [casSampleTrades, casRefPrice]);

  // Derived Order Validation Result
  const casOrderValidation = useMemo(() => {
    const isCasStock = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'NIFTY'].includes(casSymbol.toUpperCase());
    const [hStr, mStr] = effectiveCasTime.split(':');
    const h = parseInt(hStr || '15', 10);
    const m = parseInt(mStr || '20', 10);
    const mins = h * 60 + m;
    const p = Number(casOrderPrice);

    // Rule 1: 3:15-3:20 Transition
    if (mins >= 915 && mins < 920) {
      return {
        allowed: false,
        errorCode: 'AB_CAS_TRANSITION_REJECT',
        reason: 'Transition from continuous trading to CAS (3:15-3:20 pm). Reference price is being calculated. Order entry via SmartAPI is rejected in this phase.',
      };
    }

    // Rule 2: Stop-loss & Iceberg disallowed 3:15-3:40 pm for CAS stocks
    if (isCasStock && mins >= 915 && mins < 940) {
      if (casOrderType === 'STOPLOSS_LIMIT' || casOrderType === 'STOPLOSS_MARKET' || casIsIceberg) {
        return {
          allowed: false,
          errorCode: 'AB_CAS_DISALLOWED_ORDER_TYPE',
          reason: 'Stop-loss and Iceberg orders for CAS-eligible stocks are disallowed between 3:15-3:40 pm.',
        };
      }
    }

    // Rule 3: 3:25-3:30 Limit orders only. Market orders cannot be modified or cancelled.
    if (mins >= 925 && mins < 930) {
      if (casOrderType === 'MARKET' && (casOrderAction === 'MODIFY' || casOrderAction === 'CANCEL')) {
        return {
          allowed: false,
          errorCode: 'AB_CAS_MARKET_MODIFICATION_BLOCKED',
          reason: 'After 3:25 pm, Market orders can no longer be modified or cancelled - only added or changed as Limit orders.',
        };
      }
    }

    // Rule 4: 3:30-3:35 Order Matching
    if (mins >= 930 && mins < 935) {
      return {
        allowed: false,
        errorCode: 'AB_CAS_MATCHING_IN_PROGRESS',
        reason: 'Order Matching phase in progress (3:30-3:35 pm). Orders are being matched via volume maximisation; no modifications or entries allowed.',
      };
    }

    // Rule 5: 3:35-3:50 Buffer Period
    if (mins >= 935 && mins < 950) {
      return {
        allowed: false,
        errorCode: 'AB_CAS_BUFFER_PERIOD',
        reason: 'Buffer Period (3:35-3:50 pm). Transitioning to Post-closing session; order entry disallowed.',
      };
    }

    // Rule 6: Check ±3% price band during 3:20-3:30 pm
    if (isCasStock && mins >= 920 && mins < 930) {
      if (Number.isFinite(p) && p > 0) {
        if (p < casCalculatedRef.bandLow || p > casCalculatedRef.bandHigh) {
          return {
            allowed: false,
            errorCode: 'AB_CAS_PRICE_BAND_BREACH',
            reason: `Price ₹${p.toFixed(2)} is outside the allowed ±3% CAS price band [₹${casCalculatedRef.bandLow.toFixed(2)} - ₹${casCalculatedRef.bandHigh.toFixed(2)}] for Reference Price ₹${casCalculatedRef.referencePrice.toFixed(2)}.`,
          };
        }
      }
    }

    return {
      allowed: true,
      reason: `Order permitted. Conforms to CAS session rules for ${activeCasPhase.name}.`,
    };
  }, [casSymbol, effectiveCasTime, casOrderType, casIsIceberg, casOrderAction, casOrderPrice, casCalculatedRef, activeCasPhase]);

  // Derived Equilibrium Price Discovery (Volume Maximisation)
  const casEquilibriumDiscovery = useMemo(() => {
    const prices = new Set<number>();
    prices.add(casCalculatedRef.referencePrice);
    for (const b of casBids) prices.add(b.price);
    for (const a of casAsks) prices.add(a.price);

    const sortedPrices = Array.from(prices).sort((a, b) => a - b);
    let maxMatched = 0;
    let candidates: { price: number; matched: number; imbalance: number }[] = [];

    const steps = sortedPrices.map((p) => {
      let cumBuy = 0;
      let cumSell = 0;
      for (const b of casBids) if (b.price >= p) cumBuy += b.quantity;
      for (const a of casAsks) if (a.price <= p) cumSell += a.quantity;
      const matched = Math.min(cumBuy, cumSell);
      const imbalance = Math.abs(cumBuy - cumSell);

      if (matched > maxMatched) {
        maxMatched = matched;
        candidates = [{ price: p, matched, imbalance }];
      } else if (matched === maxMatched && maxMatched > 0) {
        candidates.push({ price: p, matched, imbalance });
      }

      return {
        price: p,
        cumBuy,
        cumSell,
        matched,
        imbalance,
      };
    });

    let discoveredPrice = casCalculatedRef.referencePrice;
    if (maxMatched > 0 && candidates.length > 0) {
      candidates.sort((a, b) => a.imbalance - b.imbalance);
      const minImbalance = candidates[0].imbalance;
      const tieBreakers = candidates.filter((c) => c.imbalance === minImbalance);
      tieBreakers.sort((a, b) => Math.abs(a.price - casCalculatedRef.referencePrice) - Math.abs(b.price - casCalculatedRef.referencePrice));
      discoveredPrice = tieBreakers[0].price;
    }

    return {
      steps,
      discoveredPrice,
      maxMatched,
    };
  }, [casBids, casAsks, casCalculatedRef]);

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
          { label: '⚡ Order Status (WebSocket)', to: '/calculators/order-websocket', id: 'order-websocket' },
          { label: '📜 Instruments & Scrip Master', to: '/calculators/instruments', id: 'instruments' },
          { label: '⏱️ Rate Limit Manager', to: '/calculators/rate-limits', id: 'rate-limits' },
          { label: '⚖️ Closing Auction (CAS)', to: '/calculators/cas', id: 'cas' },
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

        {show('order-websocket') && (
          <section className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                  Angel One SmartAPI WebSocket Order Status (Streaming)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time streaming order updates connecting to <code className="font-mono text-emerald-600 dark:text-emerald-400">wss://tns.angelone.in/smart-order-update</code> with Bearer auth, 10s ping/pong heartbeat, and status codes AB00–AB11.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  orderWsConnected
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${orderWsConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                  {orderWsConnected ? 'Stream: Connected' : 'Stream: Disconnected'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Heartbeat: ping/pong in {orderWsHeartbeatTimer}s ({orderWsHeartbeatLatency}ms)
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  orderWsActiveConnections >= 3
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                }`}>
                  Connections: {orderWsActiveConnections} / 3 Max
                </span>
              </div>
            </div>

            {/* Breach Alert Box (HTTP 429) */}
            {orderWsBreachError && (
              <div className="p-3.5 rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 flex items-start justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Connection Quota Breached (Error 429): </span>
                    {orderWsBreachError}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetConnections}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold shrink-0 cursor-pointer text-[11px]"
                >
                  Reset to 1 Connection
                </button>
              </div>
            )}

            {/* Connection Top Bar & Controls */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Server Endpoint:</span>
                  <code className="font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                    wss://tns.angelone.in/smart-order-update
                  </code>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span>Auth:</span>
                  <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300">
                    Authorization: Bearer &lt;JWT&gt;
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderWsConnected(!orderWsConnected)}
                  className={`px-3 py-1.5 rounded-lg font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                    orderWsConnected
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {orderWsConnected ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                  {orderWsConnected ? 'Pause Stream' : 'Connect Stream'}
                </button>

                <button
                  type="button"
                  onClick={() => setOrderWsAutoStream(!orderWsAutoStream)}
                  className={`px-3 py-1.5 rounded-lg font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                    orderWsAutoStream
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  {orderWsAutoStream ? 'Auto Live: ON' : 'Auto Live: OFF'}
                </button>

                <button
                  type="button"
                  onClick={handleSimulateConnectionIncrement}
                  className="px-2.5 py-1.5 rounded-lg font-semibold border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Simulate opening an additional concurrent connection (limit is 3)"
                >
                  +1 Connection ({orderWsActiveConnections}/3)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    api.clearAngelOrderStatusEvents();
                    setOrderWsEvents([]);
                    setOrderWsSelectedEvent(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg font-semibold border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Clear in-memory order events"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
              {[
                { id: 'feed' as const, label: `Live Order Feed (${orderWsEvents.length})`, icon: Activity },
                { id: 'simulator' as const, label: 'Event Simulator & Lifecycle Triggers', icon: Send },
                { id: 'inspector' as const, label: 'Raw WebSocket JSON Inspector', icon: Terminal },
                { id: 'docs' as const, label: 'Official Protocol & Status Codes (AB00–AB11)', icon: HelpCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderWsActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                      orderWsActiveTab === tab.id
                        ? 'bg-amber-500 text-white border-amber-500 dark:bg-amber-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Subtab 1: Live Order Feed */}
            {orderWsActiveTab === 'feed' && (
              <div className="space-y-4">
                {orderWsEvents.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <Activity className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="text-xs text-slate-500">No WebSocket order events recorded yet.</p>
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedOrder('AB01')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-semibold text-xs cursor-pointer hover:bg-amber-600"
                    >
                      Trigger Simulated Order
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {orderWsEvents.map((evt, idx) => {
                      const od = evt.orderData || {};
                      const isBuy = (od.transactiontype || 'BUY').toUpperCase() === 'BUY';
                      const statusCode = evt.orderStatusCode || evt['order-status'] || 'AB01';
                      const statusInfo = evt.orderStatusInfo || {};
                      const isSelected = orderWsSelectedEvent?.orderData?.orderid === od.orderid && orderWsSelectedEvent?.orderStatusCode === statusCode;

                      // Badge color mapping
                      let badgeBg = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
                      if (statusCode === 'AB01') badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
                      if (statusCode === 'AB02' || statusCode === 'AB07') badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
                      if (statusCode === 'AB03') badgeBg = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800';
                      if (statusCode === 'AB04' || statusCode === 'AB08') badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
                      if (statusCode === 'AB05') badgeBg = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800';
                      if (statusCode === 'AB06') badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
                      if (statusCode === 'AB10') badgeBg = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';

                      return (
                        <div
                          key={`${od.orderid || idx}-${statusCode}-${idx}`}
                          onClick={() => {
                            setOrderWsSelectedEvent(evt);
                            setOrderWsActiveTab('inspector');
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${badgeBg}`}>
                                {statusCode} • {statusInfo.label || statusCode}
                              </span>
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {od.tradingsymbol || 'CONNECTION'}
                              </span>
                              {od.exchange && (
                                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {od.exchange}
                                </span>
                              )}
                              {od.transactiontype && (
                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  isBuy ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}>
                                  {od.transactiontype}
                                </span>
                              )}
                            </div>

                            <div className="text-right text-[11px] text-slate-400 font-mono">
                              {od.updatetime || (evt.receivedAt ? new Date(evt.receivedAt).toLocaleTimeString() : 'Just now')}
                            </div>
                          </div>

                          {statusCode !== 'AB00' && (
                            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Order ID</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{od.orderid || '—'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Price / Avg</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                  ₹{od.price} {od.averageprice > 0 ? `(Avg: ₹${od.averageprice})` : ''}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Filled / Total Qty</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                  {od.filledshares || 0} / {od.quantity || 0} shares ({evt.fillPercent ?? 0}%)
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Status Msg / Fill ID</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                                  {od.text || (od.fillid ? `Fill: #${od.fillid}` : 'Order update')}
                                </span>
                              </div>
                            </div>
                          )}

                          {statusCode !== 'AB00' && Number(od.quantity) > 0 && (
                            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  evt.fillPercent === 100
                                    ? 'bg-emerald-500'
                                    : evt.fillPercent > 0
                                    ? 'bg-amber-500'
                                    : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                                style={{ width: `${evt.fillPercent || (statusCode === 'AB05' ? 100 : 0)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Subtab 2: Interactive Event Simulator */}
            {orderWsActiveTab === 'simulator' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    1-Click Order Lifecycle Trigger Presets
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedOrder('AB01')}
                      className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">🟢 New Order Placed</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">AB01 • Open in Exchange Book</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedOrder('AB04')}
                      className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-300">✏️ Order Modified</div>
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">AB04 • Price/Qty Updated</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedOrder('AB05')}
                      className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-green-800 dark:text-green-300">⚡ Market Traded / Filled</div>
                      <div className="text-[11px] text-green-600 dark:text-green-400 mt-0.5">AB05 • 100% Executed with Fill ID</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedOrder('AB02')}
                      className="p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-rose-800 dark:text-rose-300">❌ Order Cancelled</div>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">AB02 • Cancelled by User</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedOrder('AB03')}
                      className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-red-800 dark:text-red-300">🚫 RMS Rejection</div>
                      <div className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">AB03 • Margin Shortfall</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedOrder('AB10')}
                      className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-purple-800 dark:text-purple-300">⏳ Stop-Loss Pending</div>
                      <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">AB10 • Trigger Pending</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedOrder('AB06')}
                      className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300">🌙 After Market Order</div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">AB06 • AMO Request Received</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchSimulatedOrder('AB00')}
                      className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-blue-800 dark:text-blue-300">🔌 Initial Handshake</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">AB00 • Connected Response</div>
                    </button>
                  </div>
                </div>

                {/* Custom Event Creator Form */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Custom Order Status Dispatcher
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                    <div>
                      <label className="text-slate-500 block mb-1">Trading Symbol</label>
                      <input
                        type="text"
                        value={simSymbol}
                        onChange={(e) => setSimSymbol(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Transaction Side</label>
                      <select
                        value={simSide}
                        onChange={(e) => setSimSide(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Quantity</label>
                      <input
                        type="number"
                        value={simQty}
                        onChange={(e) => setSimQty(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={simPrice}
                        onChange={(e) => setSimPrice(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Status Code</label>
                      <select
                        value={simStatus}
                        onChange={(e) => setSimStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      >
                        <option value="AB01">AB01 (Open)</option>
                        <option value="AB04">AB04 (Modified)</option>
                        <option value="AB05">AB05 (Complete)</option>
                        <option value="AB02">AB02 (Cancelled)</option>
                        <option value="AB03">AB03 (Rejected)</option>
                        <option value="AB06">AB06 (AMO Received)</option>
                        <option value="AB07">AB07 (AMO Cancelled)</option>
                        <option value="AB08">AB08 (AMO Modify)</option>
                        <option value="AB09">AB09 (Open Pending)</option>
                        <option value="AB10">AB10 (Trigger Pending)</option>
                        <option value="AB11">AB11 (Modify Pending)</option>
                        <option value="AB00">AB00 (Connected)</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => dispatchSimulatedOrder()}
                        className="w-full px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-pointer transition-colors"
                      >
                        Dispatch Event
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtab 3: Raw WebSocket JSON Inspector */}
            {orderWsActiveTab === 'inspector' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Inspecting Payload for Order:{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {orderWsSelectedEvent?.orderData?.orderid || orderWsSelectedEvent?.orderid || 'N/A'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!orderWsSelectedEvent) return;
                      navigator.clipboard.writeText(JSON.stringify(orderWsSelectedEvent, null, 2));
                      setOrderWsCopied(true);
                      setTimeout(() => setOrderWsCopied(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    {orderWsCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {orderWsCopied ? 'Copied JSON!' : 'Copy Raw Payload'}
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto max-h-[420px] leading-relaxed border border-slate-800">
                  {orderWsSelectedEvent
                    ? JSON.stringify(
                        {
                          'user-id': orderWsSelectedEvent.userId || orderWsSelectedEvent['user-id'] || 'A102938',
                          'status-code': orderWsSelectedEvent.statusCode || orderWsSelectedEvent['status-code'] || '200',
                          'order-status': orderWsSelectedEvent.orderStatusCode || orderWsSelectedEvent['order-status'] || 'AB01',
                          'error-message': orderWsSelectedEvent.errorMessage || orderWsSelectedEvent['error-message'] || '',
                          orderData: orderWsSelectedEvent.orderData || {},
                        },
                        null,
                        2
                      )
                    : '// Select an order update from the feed to inspect raw JSON'}
                </pre>
              </div>
            )}

            {/* Subtab 4: Official Protocol Specification & Status Codes */}
            {orderWsActiveTab === 'docs' && (
              <div className="space-y-6 text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">Server URL &amp; Handshake</div>
                    <p className="text-[11px] text-slate-500 font-mono">wss://tns.angelone.in/smart-order-update</p>
                    <p className="text-[11px] text-slate-500">Requires Bearer JWT token in Authorization header.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">Heartbeat Protocol</div>
                    <p className="text-[11px] text-slate-500 font-mono">Client: "ping" → Server: "pong"</p>
                    <p className="text-[11px] text-slate-500">Required every 10 seconds to maintain connection liveliness.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">Connection Limit &amp; 429</div>
                    <p className="text-[11px] text-slate-500 font-mono">Max 3 connections / Client Code</p>
                    <p className="text-[11px] text-slate-500">Exceeding returns HTTP 429 Response Code.</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                    Official Order Status Codes (<code className="font-mono text-emerald-600">order-status</code>)
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 uppercase font-semibold">
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Code</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Category</th>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-blue-600">AB00</td>
                          <td className="p-2.5 font-semibold">Connection</td>
                          <td className="p-2.5">After-successful connection (initial handshake response)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-emerald-600">AB01</td>
                          <td className="p-2.5 font-semibold">Open</td>
                          <td className="p-2.5">Order is open and actively placed in the exchange book</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-rose-600">AB02</td>
                          <td className="p-2.5 font-semibold">Cancelled</td>
                          <td className="p-2.5">Order cancelled by the user or exchange</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-red-600">AB03</td>
                          <td className="p-2.5 font-semibold">Rejected</td>
                          <td className="p-2.5">Order rejected by RMS (risk management) or exchange rules</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-amber-600">AB04</td>
                          <td className="p-2.5 font-semibold">Modified</td>
                          <td className="p-2.5">Order price or quantity modified successfully</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-green-600">AB05</td>
                          <td className="p-2.5 font-semibold">Complete</td>
                          <td className="p-2.5">Order fully executed and traded (with fill ID and fill time)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-indigo-600">AB06</td>
                          <td className="p-2.5 font-semibold">AMO Received</td>
                          <td className="p-2.5">After market order request received</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-rose-600">AB07</td>
                          <td className="p-2.5 font-semibold">AMO Cancelled</td>
                          <td className="p-2.5">Cancelled after market order</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-indigo-600">AB08</td>
                          <td className="p-2.5 font-semibold">AMO Modify</td>
                          <td className="p-2.5">Modify after market order request received</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-sky-600">AB09</td>
                          <td className="p-2.5 font-semibold">Open Pending</td>
                          <td className="p-2.5">Order open request pending at exchange</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-purple-600">AB10</td>
                          <td className="p-2.5 font-semibold">Trigger Pending</td>
                          <td className="p-2.5">Stop-loss or trigger condition pending execution</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-bold text-orange-600">AB11</td>
                          <td className="p-2.5 font-semibold">Modify Pending</td>
                          <td className="p-2.5">Order modification request pending at exchange</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">WebSocket Error Codes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1">
                      <div className="font-mono font-bold text-rose-600">Code 401</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Invalid Token</div>
                      <p className="text-[11px] text-slate-500">Received if AUTHORIZATION_TOKEN is invalid.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1">
                      <div className="font-mono font-bold text-rose-600">Code 403</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Expired Token</div>
                      <p className="text-[11px] text-slate-500">Received if AUTHORIZATION_TOKEN is expired.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1">
                      <div className="font-mono font-bold text-amber-600">Code 429</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Connection Limit</div>
                      <p className="text-[11px] text-slate-500">Received if &gt;3 concurrent connections are opened.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {show('instruments') && (
          <section className={`rounded-xl border border-teal-200 dark:border-teal-900/60 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-6 ${activeTool === 'instruments' ? 'col-span-full' : 'lg:col-span-2'}`}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#14263F] dark:text-white flex items-center gap-2 flex-wrap">
                    <span>Angel One SmartAPI Instruments &amp; Scrip Master Suite</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono font-semibold">
                      OpenAPI 1.0
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Daily Tradable Instruments Dump, Single Scrip Search API, Intraday Margin Feeds, Exchange Surveillance Feeds &amp; Live LTP.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://smartapi.angelone.in/docs/Instruments#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Official Docs</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    loadScripMaster();
                    loadIntradayScrips();
                    loadCautionaryScrips();
                    if (searchScripQuery) performSearchScrip();
                  }}
                  disabled={scripMasterLoading || intradayLoading || cautionaryLoading}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scripMasterLoading ? 'animate-spin' : ''}`} />
                  <span>{scripMasterLoading ? 'Syncing...' : 'Refresh All'}</span>
                </button>
              </div>
            </div>

            {/* Quick Segment Statistics Cards */}
            {scripMasterData && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { id: 'all', label: 'All Instruments', count: scripMasterData.totalAvailable, color: 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800' },
                  { id: 'nse_cm', label: 'NSE Equity (CM)', count: scripMasterData.segmentCounts['nse_cm'] || 0, color: 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40' },
                  { id: 'nse_fo', label: 'NSE F&O Derivatives', count: scripMasterData.segmentCounts['nse_fo'] || 0, color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40' },
                  { id: 'bse_cm', label: 'BSE Equity (CM)', count: scripMasterData.segmentCounts['bse_cm'] || 0, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40' },
                  { id: 'mcx_fo', label: 'MCX Commodities', count: scripMasterData.segmentCounts['mcx_fo'] || 0, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40' },
                  { id: 'cns_fo', label: 'Currency (CDS)', count: scripMasterData.segmentCounts['cns_fo'] || 0, color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40' },
                ].map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => {
                      setScripMasterSegment(seg.id);
                      loadScripMaster(seg.id, scripMasterQuery);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      scripMasterSegment === seg.id
                        ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/50 dark:bg-teal-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{seg.label}</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {formatNumberIN(seg.count)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* SECTION 1: OpenAPI Scrip Master Explorer */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    OpenAPI Scrip Master Daily Instruments Dump
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    OpenAPIScripMaster.json
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Showing {scripMasterData?.instruments.length || 0} of {scripMasterData?.filteredCount || 0} filtered
                </div>
              </div>

              {/* Controls: Segment Filter + Search Input + Presets */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={scripMasterQuery}
                    onChange={(e) => {
                      setScripMasterQuery(e.target.value);
                      loadScripMaster(scripMasterSegment, e.target.value);
                    }}
                    placeholder="Search by Symbol (e.g. RELIANCE, NIFTY24NOV, SBIN) or Name..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <select
                  value={scripMasterSegment}
                  onChange={(e) => {
                    setScripMasterSegment(e.target.value);
                    loadScripMaster(e.target.value, scripMasterQuery);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Segments</option>
                  <option value="nse_cm">NSE Equity (nse_cm)</option>
                  <option value="nse_fo">NSE F&amp;O (nse_fo)</option>
                  <option value="bse_cm">BSE Equity (bse_cm)</option>
                  <option value="mcx_fo">MCX Commodities (mcx_fo)</option>
                  <option value="cns_fo">Currency (cns_fo)</option>
                </select>

                <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[11px] text-slate-400 font-medium">Chips:</span>
                  {['RELIANCE', 'SBIN', 'TCS', 'NIFTY', 'CRUDEOIL'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setScripMasterQuery(preset);
                        loadScripMaster(scripMasterSegment, preset);
                      }}
                      className="px-2 py-1 rounded bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                  {scripMasterQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setScripMasterQuery('');
                        loadScripMaster(scripMasterSegment, '');
                      }}
                      className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[11px] font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Scrip Master Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-500 uppercase font-semibold">
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Token</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Trading Symbol</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Name</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Segment</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Type</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Expiry / Strike</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-right">Lot Size</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center">CAS</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {scripMasterLoading && (!scripMasterData || scripMasterData.instruments.length === 0) ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                          Loading tradable scrip master dump...
                        </td>
                      </tr>
                    ) : scripMasterData?.instruments.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400">
                          No tradable instruments matching your filter query. Try selecting another segment or clearing search.
                        </td>
                      </tr>
                    ) : (
                      scripMasterData?.instruments.map((item) => (
                        <tr key={`${item.exch_seg}-${item.token}-${item.symbol}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-mono font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleCopyToken(item.token)}
                              title="Click to copy token"
                              className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <span>{item.token}</span>
                              {scripMasterCopiedToken === item.token ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400 opacity-60" />
                              )}
                            </button>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {item.symbol}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                            {item.name || item.symbol}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              item.exch_seg === 'nse_cm' ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300' :
                              item.exch_seg === 'nse_fo' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' :
                              item.exch_seg === 'bse_cm' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' :
                              item.exch_seg === 'mcx_fo' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {item.exch_seg}
                            </span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                              {item.instrumenttype || (item.symbol.includes('-EQ') ? 'EQ' : '-')}
                            </span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                            {item.expiry ? (
                              <span>
                                {item.expiry} {Number(item.strike) > 0 ? `@ ₹${Number(item.strike)}` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                            {item.lotsize || '1'}
                          </td>
                          <td className="p-2.5 text-center">
                            {item.is_cas_enabled ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                                CAS Yes
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleSelectInstrumentForLtp(item.exch_seg, item.symbol, item.token)}
                              className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Test LTP
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                <span className="font-mono">
                  Dump URL: https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json
                </span>
                <span>Auto-cached with 12h freshness • Includes all tradable equities and derivatives</span>
              </div>
            </div>

            {/* SECTION 2 & 3: Two Column Layout (Single Scrip Search + Live LTP Tester) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 2: Single Scrip Search API */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Search Scrip API (Series Token Resolver)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-semibold">
                    searchScrip
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Resolves individual scrips to exchange series tokens (e.g. <code className="font-mono text-cyan-600">-EQ</code> regular equity, <code className="font-mono text-cyan-600">-BE</code> trade-for-trade, <code className="font-mono text-cyan-600">-BL</code> block deals, <code className="font-mono text-cyan-600">-AF</code> physical settlement).
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={searchScripExchange}
                    onChange={(e) => setSearchScripExchange(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="NFO">NFO</option>
                    <option value="MCX">MCX</option>
                  </select>

                  <input
                    type="text"
                    value={searchScripQuery}
                    onChange={(e) => setSearchScripQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') performSearchScrip();
                    }}
                    placeholder="Search scrip (e.g. SBIN, RELIANCE, TCS)..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-mono"
                  />

                  <button
                    type="button"
                    onClick={() => performSearchScrip()}
                    disabled={searchScripLoading}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Search className={`w-3.5 h-3.5 ${searchScripLoading ? 'animate-spin' : ''}`} />
                    <span>Search</span>
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-slate-400">Official Samples:</span>
                  {['SBIN', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setSearchScripQuery(sample);
                        performSearchScrip(searchScripExchange, sample);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      {sample}
                    </button>
                  ))}
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-500 uppercase font-semibold">
                        <th className="p-2 border-b border-slate-200 dark:border-slate-700">Exchange</th>
                        <th className="p-2 border-b border-slate-200 dark:border-slate-700">Trading Symbol</th>
                        <th className="p-2 border-b border-slate-200 dark:border-slate-700">Symbol Token</th>
                        <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {searchScripResults.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 text-xs">
                            No series tokens returned. Enter a scrip symbol and search.
                          </td>
                        </tr>
                      ) : (
                        searchScripResults.map((item) => (
                          <tr key={`${item.exchange}-${item.tradingsymbol}-${item.symboltoken}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="p-2 font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {item.exchange}
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-900 dark:text-white">
                              {item.tradingsymbol}
                            </td>
                            <td className="p-2 font-mono text-cyan-600 dark:text-cyan-400">
                              <button
                                type="button"
                                onClick={() => handleCopyToken(item.symboltoken)}
                                title="Click to copy token"
                                className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <span>{item.symboltoken}</span>
                                {scripMasterCopiedToken === item.symboltoken ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400 opacity-60" />
                                )}
                              </button>
                            </td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleSelectInstrumentForLtp(item.exchange, item.tradingsymbol, item.symboltoken)}
                                className="px-2 py-0.5 rounded bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Test LTP
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 3: Live LTP Quote Tester */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Get LTP Data API Tester
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
                    getLtpData
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fetches instantaneous Last Traded Price, Day's High, Low, Open, and Previous Close for an instrument token.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Exchange</label>
                    <select
                      value={ltpExchange}
                      onChange={(e) => setLtpExchange(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <option value="NSE">NSE</option>
                      <option value="BSE">BSE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Trading Symbol</label>
                    <input
                      type="text"
                      value={ltpSymbol}
                      onChange={(e) => setLtpSymbol(e.target.value)}
                      placeholder="e.g. SBIN-EQ"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Symbol Token</label>
                    <input
                      type="text"
                      value={ltpToken}
                      onChange={(e) => setLtpToken(e.target.value)}
                      placeholder="e.g. 3045"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFetchLtp()}
                  disabled={ltpLoading}
                  className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ltpLoading ? 'animate-spin' : ''}`} />
                  <span>{ltpLoading ? 'Fetching LTP...' : 'Query Live LTP Quote'}</span>
                </button>

                {ltpError && (
                  <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{ltpError}</span>
                  </div>
                )}

                {ltpQuote && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500 font-mono">
                          {ltpQuote.exchange} • {ltpQuote.tradingsymbol} (Token: {ltpQuote.symboltoken})
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                          ₹{formatNumberIN(ltpQuote.ltp)}
                        </div>
                      </div>

                      {ltpQuote.close > 0 && (
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                          ltpQuote.ltp >= ltpQuote.close
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                        }`}>
                          {ltpQuote.ltp >= ltpQuote.close ? '+' : ''}
                          {(((ltpQuote.ltp - ltpQuote.close) / ltpQuote.close) * 100).toFixed(2)}%
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] text-slate-400 uppercase">Open</div>
                        <div className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                          ₹{formatNumberIN(ltpQuote.open)}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] text-slate-400 uppercase">High</div>
                        <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ₹{formatNumberIN(ltpQuote.high)}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] text-slate-400 uppercase">Low</div>
                        <div className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                          ₹{formatNumberIN(ltpQuote.low)}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] text-slate-400 uppercase">Prev Close</div>
                        <div className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                          ₹{formatNumberIN(ltpQuote.close)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4 & 5: Two Column Layout (Intraday Multipliers + Cautionary Surveillance) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 4: Intraday Allowed Scrips */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Scrips Allowed for Intraday Trading
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setIntradayExchange('NSE');
                        loadIntradayScrips('NSE');
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        intradayExchange === 'NSE'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      NSE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIntradayExchange('BSE');
                        loadIntradayScrips('BSE');
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        intradayExchange === 'BSE'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      BSE
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Approved securities permitted for intraday leverage with broker margin multipliers (<code className="font-mono text-indigo-600">5.0x = 20% margin</code>, <code className="font-mono text-indigo-600">1.0x = 100% full cash</code>).
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={intradayFilterQuery}
                    onChange={(e) => setIntradayFilterQuery(e.target.value)}
                    placeholder={`Filter ${intradayExchange} intraday scrips...`}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                  <span className="text-xs text-slate-500 shrink-0 font-medium">
                    {intradayScrips.filter((s) => !intradayFilterQuery || s.SymbolName.toUpperCase().includes(intradayFilterQuery.toUpperCase())).length} Scrips
                  </span>
                </div>

                <div className="max-h-[300px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                      <tr className="text-[11px] text-slate-500 uppercase font-semibold">
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Symbol Name</th>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Exchange</th>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center">Multiplier</th>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-right">Margin Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {intradayLoading ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 text-xs">
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-600" />
                            Loading {intradayExchange} intraday eligible scrips...
                          </td>
                        </tr>
                      ) : (
                        intradayScrips
                          .filter((s) => !intradayFilterQuery || s.SymbolName.toUpperCase().includes(intradayFilterQuery.toUpperCase()))
                          .map((scrip, idx) => {
                            const mult = Number(scrip.Multiplier) || 1.0;
                            const marginPct = (100 / mult).toFixed(0);
                            return (
                              <tr key={`${scrip.exchange}-${scrip.SymbolName}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                  {scrip.SymbolName}
                                </td>
                                <td className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">
                                  {scrip.exchange}
                                </td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                                    {scrip.Multiplier}x
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                                  {marginPct}% Upfront
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 5: Cautionary & Surveillance Scrips */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Exchange Cautionary &amp; Surveillance Scrips
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold">
                    cautionaryScrips
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-semibold">SEBI Surveillance Frameworks:</span> Securities under Additional Surveillance Measure (ASM), Graded Surveillance Measure (GSM), or Gross Settlement require 100% upfront cash margin, have reduced price circuit bands (5% or 2%), and intraday squaring off is disallowed.
                  </div>
                </div>

                {/* Surveillance Category Filter */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  {['ALL', 'ASM', 'GSM', 'TRADE_FOR_TRADE'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCautionaryCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                        cautionaryCategoryFilter === cat
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat === 'TRADE_FOR_TRADE' ? 'Gross Settlement' : cat}
                    </button>
                  ))}
                </div>

                <div className="max-h-[280px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                      <tr className="text-[11px] text-slate-500 uppercase font-semibold">
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Token</th>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Symbol</th>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Surveillance Notice</th>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-right">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cautionaryLoading ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 text-xs">
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-rose-500" />
                            Loading cautionary securities...
                          </td>
                        </tr>
                      ) : (
                        cautionaryScrips
                          .filter((s) => cautionaryCategoryFilter === 'ALL' || s.category === cautionaryCategoryFilter)
                          .map((scrip) => (
                            <tr key={`${scrip.token}-${scrip.symbol}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 font-mono text-slate-500">
                                {scrip.token}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                {scrip.symbol}
                              </td>
                              <td className="p-2.5 text-slate-700 dark:text-slate-300">
                                {scrip.message}
                              </td>
                              <td className="p-2.5 text-right whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                                  {scrip.category || 'SURVEILLANCE'}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Architectural & Protocol Documentation Reference */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <span>Angel One SmartAPI Instruments Endpoints Architecture</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <div className="font-mono font-bold text-teal-600">GET Scrip Master Dump</div>
                  <p className="text-[11px] font-mono text-slate-500">OpenAPIScripMaster.json</p>
                  <p className="text-[11px] text-slate-500">Complete tradable master dump across all segments generated daily ~08:00 IST.</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <div className="font-mono font-bold text-cyan-600">POST searchScrip</div>
                  <p className="text-[11px] font-mono text-slate-500">v1/searchScrip</p>
                  <p className="text-[11px] text-slate-500">Single scrip resolution for symbol series tokens (EQ, BE, BL, AF, etc.).</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <div className="font-mono font-bold text-indigo-600">GET Intraday Feeds</div>
                  <p className="text-[11px] font-mono text-slate-500">nseIntraday &amp; bseIntraday</p>
                  <p className="text-[11px] text-slate-500">Exchange-wise eligible intraday scrips with leverage multiplier coefficients.</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <div className="font-mono font-bold text-rose-600">POST cautionaryScrips</div>
                  <p className="text-[11px] font-mono text-slate-500">v1/cautionaryScrips</p>
                  <p className="text-[11px] text-slate-500">Surveillance measure scrips (ASM/GSM/Trade-For-Trade) with 100% margin mandate.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 10. Angel One SmartAPI Rate Limit Suite */}
        {show('rate-limits') && (
          <section className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 mb-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Official Angel One SmartAPI Rate Limit Architecture</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>SmartAPI Rate Limit Suite &amp; Throttle Engine</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enforces per-second, per-minute, and cumulative order limits (≤ 9 req/s) with exact HTTP 403 (AB1004) error telemetry across all 26 endpoints.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://smartapi.angelone.in/docs/RateLimit#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Official Docs</span>
                </a>
                <button
                  type="button"
                  onClick={handleResetRateLimits}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Counters</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadRateLimitCatalog();
                    loadRateLimitStatus();
                  }}
                  disabled={rateLimitLoading}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${rateLimitLoading ? 'animate-spin' : ''}`} />
                  <span>Sync Telemetry</span>
                </button>
              </div>
            </div>

            {/* Live Token Bucket & Throttle Meter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Cumulative Order Pool</span>
                  <span className="font-mono font-bold text-amber-600">Max 9 req/s</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {rateLimitStatus?.cumulativePool?.currentRps ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">/ 9 req/sec</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      (rateLimitStatus?.cumulativePool?.currentRps ?? 0) >= 9
                        ? 'bg-rose-500'
                        : (rateLimitStatus?.cumulativePool?.currentRps ?? 0) >= 7
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round(((rateLimitStatus?.cumulativePool?.currentRps ?? 0) / 9) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Pool covers Place, Modify, Cancel Order &amp; Batch APIs.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Processed Requests</span>
                  <span className="font-mono text-xs text-emerald-600 font-semibold">Active Windows</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {rateLimitStatus?.telemetry?.totalRequests ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">calls</span>
                </div>
                <div className="flex items-center gap-3 text-xs mt-2 text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Allowed: {rateLimitStatus?.telemetry?.allowedRequests ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Throttled: {rateLimitStatus?.telemetry?.throttledRequests ?? 0}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Active Client Code: <span className="font-mono text-slate-700 dark:text-slate-300">{burstClientCode}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Throttle Rate</span>
                  <span className="font-mono text-xs text-rose-600 font-semibold">HTTP 403 (AB1004)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {rateLimitStatus?.telemetry?.throttleRatePct ?? 0}%
                  </span>
                  <span className="text-xs text-slate-500">rate</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Peak RPS Observed: <span className="font-mono font-bold">{rateLimitStatus?.telemetry?.peakRps ?? 0} req/s</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Breaches reject with &quot;Access denied because of exceeding rate limit&quot;.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Catalog Endpoints</span>
                  <span className="font-mono text-xs text-cyan-600 font-semibold">Complete Coverage</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {rateLimitCatalog.length || 26}
                  </span>
                  <span className="text-xs text-slate-500">APIs mapped</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">Orders: 9/s</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Market: 10/s</span>
                  <span className="px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">History: 3/s</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Sliding window bucket refreshed in real-time.
                </p>
              </div>
            </div>

            {/* Navigation Sub-Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar text-xs">
              {[
                { id: 'catalog' as const, label: `Official Rate Limit Catalog (${rateLimitCatalog.length || 26} Endpoints)` },
                { id: 'simulator' as const, label: 'Interactive Burst Simulator & 403 Enforcement' },
                { id: 'telemetry' as const, label: 'Pre-Flight Quota Checker' },
                { id: 'spec' as const, label: 'SmartAPI AB1004 Protocol Specification' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRateLimitTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    rateLimitTab === tab.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-Tab 1: Official Catalog */}
            {rateLimitTab === 'catalog' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={rateLimitSearch}
                      onChange={(e) => setRateLimitSearch(e.target.value)}
                      placeholder="Search API Name, description, or group..."
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {['ALL', 'ORDERS', 'MARKET_DATA', 'AUTH_USER', 'PORTFOLIO', 'MARGIN', 'HISTORICAL', 'GTT'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setRateLimitCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          rateLimitCategory === cat
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold">
                        <th className="p-3 w-12 text-center">Sr</th>
                        <th className="p-3">API Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-center">Limit / Sec</th>
                        <th className="p-3 text-center">Limit / Min</th>
                        <th className="p-3 text-center">Limit / Hour</th>
                        <th className="p-3">Cumulative Pool Rule</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                      {rateLimitCatalog
                        .filter(
                          (item) =>
                            rateLimitCategory === 'ALL' || item.category === rateLimitCategory
                        )
                        .filter(
                          (item) =>
                            !rateLimitSearch ||
                            item.apiName.toLowerCase().includes(rateLimitSearch.toLowerCase()) ||
                            item.description.toLowerCase().includes(rateLimitSearch.toLowerCase()) ||
                            String(item.cumulativeGroup || '').toLowerCase().includes(rateLimitSearch.toLowerCase())
                        )
                        .map((item) => (
                          <tr key={item.srNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="p-3 text-center font-mono font-bold text-slate-400">
                              {item.srNo}
                            </td>
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">
                              {item.apiName}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600">
                              {item.limitPerSecond} / s
                            </td>
                            <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                              {item.limitPerMinute ? `${item.limitPerMinute} / m` : '—'}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                              {item.limitPerHour ? `${item.limitPerHour} / h` : '—'}
                            </td>
                            <td className="p-3">
                              {item.cumulativeGroup ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                                  {item.cumulativeGroup} (≤ 9 req/s)
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Independent</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs">
                              {item.description}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Interactive Burst Simulator */}
            {rateLimitTab === 'simulator' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Real-Time High-Frequency Burst Simulator</span>
                  </div>
                  <p>
                    Simulates rapid-fire concurrent API requests from an algorithmic client to verify exact rate limiting behavior, cumulative order pool containment, and HTTP 403 (AB1004) denial messages.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target API Endpoint
                    </label>
                    <select
                      value={burstApiName}
                      onChange={(e) => setBurstApiName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {rateLimitCatalog.map((item) => (
                        <option key={item.apiName} value={item.apiName}>
                          {item.apiName} (Limit: {item.limitPerSecond}/s{item.cumulativeGroup ? `, Pool: ${item.cumulativeGroup}` : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Burst Size (Requests in 1 Second)
                    </label>
                    <select
                      value={burstCount}
                      onChange={(e) => setBurstCount(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                    >
                      <option value={5}>5 Requests (Safe Below 9/s Limit)</option>
                      <option value={8}>8 Requests (Near Cumulative Capacity)</option>
                      <option value={9}>9 Requests (Exact Cumulative Threshold)</option>
                      <option value={10}>10 Requests (Triggers 1 Throttled Call)</option>
                      <option value={12}>12 Requests (3 Throttled Calls)</option>
                      <option value={15}>15 Requests (6 Throttled Calls)</option>
                      <option value={20}>20 Requests (Heavy HFT Burst)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Client Code Identifier
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={burstClientCode}
                        onChange={(e) => setBurstClientCode(e.target.value.toUpperCase())}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={handleSimulateBurst}
                        disabled={burstSimulating}
                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50 whitespace-nowrap"
                      >
                        <Send className={`w-3.5 h-3.5 ${burstSimulating ? 'animate-spin' : ''}`} />
                        <span>Run Burst</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulation Output */}
                {burstResult && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">Burst Simulation Result:</span>
                        <span className="font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {burstResult.apiName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-emerald-600 font-bold">Allowed: {burstResult.allowedCount}</span>
                        <span className="text-rose-600 font-bold">Throttled: {burstResult.throttledCount}</span>
                        <span className="text-slate-500">Throttle Rate: {burstResult.throttleRatePct}%</span>
                      </div>
                    </div>

                    {/* Timeline visualization of calls */}
                    <div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                        Per-Call Execution Timeline:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {burstResult.results.map((call: any, idx: number) => (
                          <div
                            key={idx}
                            title={`Call #${idx + 1}: ${call.allowed ? 'HTTP 200 OK' : 'HTTP 403 Rate Limited (AB1004)'} - ${call.message}`}
                            className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 border ${
                              call.allowed
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            <span>#{idx + 1}</span>
                            <span>{call.allowed ? '200 OK' : '403 Denied'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Raw Error Packet if throttled */}
                    {burstResult.throttledCount > 0 && (
                      <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-xs space-y-1.5 font-mono">
                        <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Exact SmartAPI Rejection Payload Received (AB1004):</span>
                        </div>
                        <pre className="text-[11px] bg-white dark:bg-black/60 p-2.5 rounded border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 overflow-x-auto">
{JSON.stringify(
  {
    status: false,
    message: 'Access denied because of exceeding rate limit',
    errorcode: 'AB1004',
    data: null,
    httpStatusCode: 403,
    resetInMs: burstResult.results.find((c: any) => !c.allowed)?.resetInMs || 1000,
  },
  null,
  2
)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 3: Pre-Flight Quota Checker */}
            {rateLimitTab === 'telemetry' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Pre-Flight Quota Check Prior to Order Dispatch</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Query current capacity for any SmartAPI endpoint before sending an order or batch request to prevent 403 rejections.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                      value={quotaCheckApi}
                      onChange={(e) => setQuotaCheckApi(e.target.value)}
                      className="w-full sm:w-80 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {rateLimitCatalog.map((item) => (
                        <option key={item.apiName} value={item.apiName}>
                          {item.apiName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleCheckQuota}
                      disabled={quotaCheckLoading}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Check Remaining Quota</span>
                    </button>
                  </div>

                  {quotaCheckResult && (
                    <div className="mt-3 p-3 rounded-lg border border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/20 text-xs font-mono space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-900 dark:text-teal-200">
                          {quotaCheckResult.apiName}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${quotaCheckResult.allowed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                          {quotaCheckResult.allowed ? 'QUOTA AVAILABLE (HTTP 200)' : 'RATE LIMIT REACHED (HTTP 403)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div>
                          <div className="text-slate-500">Second Remaining:</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {quotaCheckResult.remainingSec} / {quotaCheckResult.limitPerSecond}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Current Second RPS:</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {quotaCheckResult.currentRps} req/s
                          </div>
                        </div>
                        {quotaCheckResult.cumulativePool && (
                          <div>
                            <div className="text-slate-500">Order Pool Rem:</div>
                            <div className="font-bold text-amber-600">
                              {quotaCheckResult.cumulativePool.remainingSec} / 9 req/s
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-slate-500">Bucket Reset In:</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {quotaCheckResult.resetInMs} ms
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Protocol Specification */}
            {rateLimitTab === 'spec' && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Angel One SmartAPI Rate Limit Rules &amp; Sliding Window Mechanics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1.5">
                    <div className="font-bold text-amber-600">1. Cumulative Order Limit Rule (≤ 9 req/s)</div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Even if individual order APIs (Place, Modify, Cancel) specify 10 req/s, their combined sum cannot exceed 9 req/s across the active client session. Exceeding 9 req/s will result in an immediate HTTP 403 rejection.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1.5">
                    <div className="font-bold text-blue-600">2. Error Code AB1004 &amp; HTTP 403</div>
                    <p className="text-slate-600 dark:text-slate-400">
                      When rate limits are breached, SmartAPI responds with HTTP 403 Forbidden and JSON payload:
                      <code className="block mt-1 p-1 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-mono">
                        &#123;&quot;status&quot;: false, &quot;message&quot;: &quot;Access denied because of exceeding rate limit&quot;, &quot;errorcode&quot;: &quot;AB1004&quot;&#125;
                      </code>
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1.5">
                    <div className="font-bold text-teal-600">3. Per-Client Code Isolation</div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Rate limit counters are tracked per Angel One client code using high-performance in-memory sliding windows. One user&apos;s burst does not impact another client session.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1.5">
                    <div className="font-bold text-indigo-600">4. Algorithmic Trading Recommendation</div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Always throttle outbound order loops to ≤ 8 req/s to accommodate latency jitter and clock skew, leaving a 1 req/s safety buffer below the strict 9 req/s cumulative threshold.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 11. Angel One SmartAPI Closing Auction Session (CAS) Suite */}
        {show('cas') && (
          <section className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 sm:p-6 space-y-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 mb-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span>SEBI Mandate Effective 03 Aug 2026</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Closing Auction Session (CAS) Suite &amp; Price Discovery Engine</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-4xl">
                  Official Angel One SmartAPI CAS architecture: 20-minute closing auction (3:15–3:35 pm IST) for F&amp;O-eligible cash segment equities, replacing continuous 30-min VWAP with Volume Maximisation Equilibrium Price discovery and extending F&amp;O trading in NFO/BFO till 3:40 pm.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://smartapi.angelone.in/docs/CASDoc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Angel One CAS Docs</span>
                </a>
                <a
                  href="https://www.sebi.gov.in/legal/circulars/jan-2026/introduction-of-closing-auction-session-cas-in-the-equity-cash-segment-and-certain-modifications-in-the-pre-open-auction-session_99122.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>SEBI Circular</span>
                </a>
                <a
                  href="https://nsearchives.nseindia.com/content/circulars/CMTR74466.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>NSE CMTR74466</span>
                </a>
                <a
                  href="https://www.bseindia.com/downloads/UploadDocs/Notices/20260610-41/20260610-41.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>BSE 20260610-41</span>
                </a>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Auction Window</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">3:15 – 3:35 PM</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">20-minute CAS session</div>
              </div>
              <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-950/60 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="text-[11px] font-medium text-blue-700 dark:text-blue-400">CAS Price Band</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">±3.0% of Ref Price</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-500 mt-0.5">VWAP (3:00–3:15 PM)</div>
              </div>
              <div className="p-3 rounded-xl border border-purple-100 dark:border-purple-950/60 bg-purple-50/50 dark:bg-purple-950/20">
                <div className="text-[11px] font-medium text-purple-700 dark:text-purple-400">Extended F&amp;O Close</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">3:40 PM IST</div>
                <div className="text-[10px] text-purple-600 dark:text-purple-500 mt-0.5">NFO &amp; BFO trading active</div>
              </div>
              <div className="p-3 rounded-xl border border-amber-100 dark:border-amber-950/60 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Auto-Square Off (MIS)</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">3:10 PM IST</div>
                <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">Robo: 3:05 · F&amp;O: 3:20 PM</div>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200 dark:border-slate-800 text-xs">
              {[
                { id: 'monitor', label: '⏱️ Live CAS Phase Monitor & Timeline' },
                { id: 'validator', label: '🛡️ Order Eligibility Pre-Flight Validator' },
                { id: 'bands', label: '📊 ±3% Reference Price & Band Calculator' },
                { id: 'auction', label: '⚖️ Equilibrium Price Discovery Simulator' },
                { id: 'squareoff', label: '🕒 Auto-Square Off Schedules (03 Aug 2026)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCasTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    casTab === t.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sub-Tab 1: Live CAS Phase Monitor & Timeline */}
            {casTab === 'monitor' && (
              <div className="space-y-6">
                {/* Time Control Bar */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Simulated Session Time (IST)
                      </div>
                      <div className="text-xs text-slate-500">
                        Adjust time to test CAS phase state machine transitions
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {['10:30', '15:12', '15:18', '15:22', '15:27', '15:32', '15:38', '15:55'].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setCasSimTime(t);
                          setCasUseLiveTime(false);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                          !casUseLiveTime && casSimTime === t
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="time"
                        value={casSimTime}
                        onChange={(e) => {
                          setCasSimTime(e.target.value);
                          setCasUseLiveTime(false);
                        }}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                      />
                      <button
                        onClick={() => setCasUseLiveTime(!casUseLiveTime)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border ${
                          casUseLiveTime
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {casUseLiveTime ? '● Live Clock' : 'Use Live Clock'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Phase Card */}
                <div className="p-5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50/70 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900/40 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
                      </span>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Current CAS Phase · Effective at {effectiveCasTime} IST
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {activeCasPhase.name} ({activeCasPhase.timeRange})
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        activeCasPhase.isOrderEntryAllowed
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700'
                          : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-300 dark:border-rose-700'
                      }`}>
                        {activeCasPhase.isOrderEntryAllowed ? '✓ Order Entry OPEN' : '✕ Order Entry REJECTED'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {activeCasPhase.permittedActions}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                    <div>
                      <span className="text-slate-500">Allowed Order Types:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {activeCasPhase.allowedOrderTypes.length > 0
                          ? activeCasPhase.allowedOrderTypes.join(', ')
                          : 'None (SmartAPI Rejection)'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Market Order Changes:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {activeCasPhase.canModifyMarketOrders ? '✓ Allowed' : '✕ Blocked (Frozen)'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Stop-Loss &amp; Iceberg:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {activeCasPhase.isStopLossAllowed ? '✓ Permitted' : '✕ Disallowed (3:15-3:40 pm)'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Active Price Type:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {activeCasPhase.priceType === 'LTP'
                          ? 'Last Traded Price (LTP)'
                          : activeCasPhase.priceType === 'REFERENCE_LIMIT_PRICE'
                            ? 'Reference Limit Price (±3%)'
                            : 'Equilibrium Price'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6 CAS Phases Timeline Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    All 6 Closing Auction Session (CAS) Phases
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        phaseId: 'TRANSITION_TO_CAS',
                        num: '1',
                        time: '3.15 - 3.20 pm',
                        name: 'Transition to CAS',
                        actions: 'Reference price calculated. Order entry via SmartAPI will be rejected in this phase.',
                        entry: false,
                        type: 'Reference Price',
                      },
                      {
                        phaseId: 'ORDER_ENTRY_AND_MODIFICATION',
                        num: '2',
                        time: '3.20 - 3.25 pm',
                        name: 'Order Entry & Modification',
                        actions: 'Limit and Market orders can be placed, modified, or cancelled within ±3% band.',
                        entry: true,
                        type: 'Limit & Market',
                      },
                      {
                        phaseId: 'LIMIT_ORDERS_ONLY',
                        num: '3',
                        time: '3.25 - 3.30 pm',
                        name: 'Limit Orders Only',
                        actions: 'No changes/cancellations on Market Orders. Limit orders only. Random close 3:28-3:30 pm.',
                        entry: true,
                        type: 'Limit Only',
                      },
                      {
                        phaseId: 'ORDER_MATCHING',
                        num: '4',
                        time: '3.30 - 3.35 pm',
                        name: 'Order Matching',
                        actions: 'Orders matched via volume maximisation algorithm, and closing price is set.',
                        entry: false,
                        type: 'Equilibrium Price',
                      },
                      {
                        phaseId: 'BUFFER_PERIOD',
                        num: '5',
                        time: '3.35 - 3.50 pm',
                        name: 'Buffer Period',
                        actions: 'Transition from CAS to Post-closing session. F&O trading ceases at 3:40 pm.',
                        entry: false,
                        type: 'Extended F&O till 3:40',
                      },
                      {
                        phaseId: 'POST_CLOSING_SESSION',
                        num: '6',
                        time: '3.50 - 4.00 pm',
                        name: 'Post-Closing Session',
                        actions: 'Trades settle at the Equilibrium Price discovered in the auction. Applies to all stocks.',
                        entry: true,
                        type: 'At Equilibrium Price',
                      },
                    ].map((p) => {
                      const isActive = activeCasPhase.id === p.phaseId;
                      return (
                        <div
                          key={p.num}
                          className={`p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Phase {p.num} · {p.time}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white animate-pulse">
                                CURRENT ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                            {p.actions}
                          </p>
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">{p.type}</span>
                            <span className={`font-semibold ${p.entry ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {p.entry ? 'Entry Permitted' : 'Entry Rejected'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Order Eligibility Pre-Flight Validator */}
            {casTab === 'validator' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Form */}
                  <div className="lg:col-span-1 space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Configure Order Parameters
                    </h3>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Scrip / Symbol (CAS Eligible)
                      </label>
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'TATAMOTORS', 'SBIN', 'NIFTY'].map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setCasSymbol(s);
                              if (s === 'RELIANCE') setCasRefPrice('1280.00');
                              if (s === 'TCS') setCasRefPrice('3950.00');
                              if (s === 'INFY') setCasRefPrice('1840.00');
                              if (s === 'HDFCBANK') setCasRefPrice('1740.00');
                              if (s === 'TATAMOTORS') setCasRefPrice('840.00');
                              if (s === 'SBIN') setCasRefPrice('810.00');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                              casSymbol === s
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={casSymbol}
                        onChange={(e) => setCasSymbol(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Order Type
                      </label>
                      <select
                        value={casOrderType}
                        onChange={(e) => setCasOrderType(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="LIMIT">LIMIT (Allowed in CAS)</option>
                        <option value="MARKET">MARKET (Frozen after 3:25 pm)</option>
                        <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT (Disallowed 3:15-3:40 pm)</option>
                        <option value="STOPLOSS_MARKET">STOPLOSS_MARKET (Disallowed 3:15-3:40 pm)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="icebergCheck"
                        checked={casIsIceberg}
                        onChange={(e) => setCasIsIceberg(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      <label htmlFor="icebergCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        Iceberg Order (Disallowed 3:15-3:40 pm)
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Action
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['PLACE', 'MODIFY', 'CANCEL'] as const).map((act) => (
                          <button
                            key={act}
                            onClick={() => setCasOrderAction(act)}
                            className={`px-2 py-1.5 rounded text-xs font-bold border transition-colors ${
                              casOrderAction === act
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                            }`}
                          >
                            {act}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Order Limit Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={casOrderPrice}
                        onChange={(e) => setCasOrderPrice(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Validation Output */}
                  <div className="lg:col-span-2 space-y-4">
                    <div
                      className={`p-6 rounded-2xl border-2 transition-all shadow-sm ${
                        casOrderValidation.allowed
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                          : 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {casOrderValidation.allowed ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <div>
                          <div className={`text-xs font-bold uppercase tracking-wider ${
                            casOrderValidation.allowed ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                          }`}>
                            SmartAPI Pre-Flight Validation Verdict
                          </div>
                          <h3 className={`text-xl font-extrabold ${
                            casOrderValidation.allowed ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'
                          }`}>
                            {casOrderValidation.allowed ? '✓ ORDER APPROVED' : '✕ ORDER REJECTED'}
                          </h3>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                        {casOrderValidation.reason}
                        {casOrderValidation.errorCode && (
                          <div className="mt-1 font-mono font-bold text-rose-600 dark:text-rose-400">
                            Error Code: {casOrderValidation.errorCode}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs">
                        <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-slate-500">CAS Eligibility:</span>
                          <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                            {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'NIFTY'].includes(casSymbol)
                              ? '✓ is_cas_enabled: true'
                              : 'Standard Continuous (Non-CAS)'}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-slate-500">Allowed ±3% Band:</span>
                          <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                            ₹{casCalculatedRef.bandLow.toFixed(2)} – ₹{casCalculatedRef.bandHigh.toFixed(2)}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-slate-500">Reference Price:</span>
                          <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                            ₹{casCalculatedRef.referencePrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pre-Flight Rules Explanation */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        SmartAPI Closing Auction Session Pre-Flight Verification Rules
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                        <li><strong>Phase 1 (3:15–3:20 pm):</strong> All SmartAPI order entries are strictly rejected while the exchange calculates the Reference Price.</li>
                        <li><strong>Stop-loss &amp; Iceberg orders:</strong> Disallowed between 3:15–3:40 pm for all CAS-eligible stocks.</li>
                        <li><strong>Market orders after 3:25 pm:</strong> Cannot be modified or cancelled; only Limit orders can be added or adjusted.</li>
                        <li><strong>Price Band:</strong> Orders must fall within the ±3% band of the discovered Reference Price.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: ±3% Reference Price & Band Calculator */}
            {casTab === 'bands' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Reference Price (VWAP 3:00 - 3:15 PM) &amp; ±3% Price Band
                      </h3>
                      <p className="text-xs text-slate-500">
                        The Reference Price is the volume-weighted average price (VWAP) of all trades between 3:00 and 3:15 pm. It sets the strict ±3% band within which auction orders can be accepted.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-500">Prefill:</span>
                      {[
                        { name: 'Reliance', price: 1280.0 },
                        { name: 'TCS', price: 3950.0 },
                        { name: 'Infosys', price: 1840.0 },
                        { name: 'HDFC Bank', price: 1740.0 },
                        { name: 'SBI', price: 810.0 },
                      ].map((item) => (
                        <button
                          key={item.name}
                          onClick={() => {
                            setCasRefPrice(String(item.price));
                            setCasSampleTrades([
                              { price: item.price - 0.5, volume: 14500, time: '15:02:14' },
                              { price: item.price + 0.25, volume: 28000, time: '15:05:40' },
                              { price: item.price, volume: 52000, time: '15:08:12' },
                              { price: item.price + 1.5, volume: 34000, time: '15:11:55' },
                              { price: item.price + 0.75, volume: 41500, time: '15:14:30' },
                            ]);
                          }}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        >
                          {item.name} (₹{item.price})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculated Band Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center">
                      <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Lower Band (-3.0%)</span>
                      <div className="text-2xl font-extrabold text-rose-900 dark:text-rose-200 font-mono mt-1">
                        ₹{casCalculatedRef.bandLow.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500">Minimum allowed auction bid/ask</span>
                    </div>

                    <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Reference Price (VWAP)</span>
                      <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200 font-mono mt-1">
                        ₹{casCalculatedRef.referencePrice.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500">Starting auction benchmark</span>
                    </div>

                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-center">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Upper Band (+3.0%)</span>
                      <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-200 font-mono mt-1">
                        ₹{casCalculatedRef.bandHigh.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500">Maximum allowed auction bid/ask</span>
                    </div>
                  </div>
                </div>

                {/* Sample Trades Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pre-CAS Trade Prints Considered (3:00 PM – 3:15 PM)
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left">Trade Timestamp</th>
                          <th className="px-3 py-2 text-right">Execution Price (₹)</th>
                          <th className="px-3 py-2 text-right">Volume (Shares)</th>
                          <th className="px-3 py-2 text-right">Trade Value (₹ Cr)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {casSampleTrades.map((tr, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">{tr.time}</td>
                            <td className="px-3 py-2 font-mono font-bold text-right text-slate-900 dark:text-white">
                              ₹{tr.price.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 font-mono text-right text-slate-700 dark:text-slate-300">
                              {tr.volume.toLocaleString('en-IN')}
                            </td>
                            <td className="px-3 py-2 font-mono text-right text-slate-600 dark:text-slate-400">
                              ₹{((tr.price * tr.volume) / 1e7).toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-slate-900/80 font-bold border-t border-slate-200 dark:border-slate-800">
                        <tr>
                          <td className="px-3 py-2">Total Considered</td>
                          <td className="px-3 py-2 font-mono text-right text-emerald-600 dark:text-emerald-400">
                            VWAP: ₹{casCalculatedRef.referencePrice.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 font-mono text-right">
                            {casCalculatedRef.totVol.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2 font-mono text-right">
                            ₹{(casCalculatedRef.totVal / 1e7).toFixed(3)} Cr
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Equilibrium Price Discovery Simulator */}
            {casTab === 'auction' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      SEBI Volume Maximisation Auction Engine
                    </h3>
                    <p className="text-xs text-slate-500">
                      Orders placed during CAS are matched using the volume maximisation algorithm. The price with the highest executable matched quantity becomes the official daily closing price.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/40 text-center shrink-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Discovered Equilibrium Price
                    </div>
                    <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono mt-0.5">
                      ₹{casEquilibriumDiscovery.discoveredPrice.toFixed(2)}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Matched: {casEquilibriumDiscovery.maxMatched.toLocaleString('en-IN')} shares
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Volume Maximisation Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Price Level Volume Maximisation Table (Auction Matching)
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left">Price (₹)</th>
                          <th className="px-3 py-2 text-right">Cumulative Buy Qty (Bid ≥ P)</th>
                          <th className="px-3 py-2 text-right">Cumulative Sell Qty (Ask ≤ P)</th>
                          <th className="px-3 py-2 text-right">Matched Volume (Shares)</th>
                          <th className="px-3 py-2 text-right">Unmatched Imbalance</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {casEquilibriumDiscovery.steps.map((st) => {
                          const isDiscovered = st.price === casEquilibriumDiscovery.discoveredPrice;
                          return (
                            <tr
                              key={st.price}
                              className={`transition-colors ${
                                isDiscovered
                                  ? 'bg-emerald-100/80 dark:bg-emerald-950/60 font-bold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="px-3 py-2.5 font-mono text-slate-900 dark:text-white">
                                ₹{st.price.toFixed(2)}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-right text-blue-600 dark:text-blue-400">
                                {st.cumBuy.toLocaleString('en-IN')}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-right text-purple-600 dark:text-purple-400">
                                {st.cumSell.toLocaleString('en-IN')}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-right font-bold text-slate-900 dark:text-white">
                                {st.matched.toLocaleString('en-IN')}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-right text-slate-500">
                                {st.imbalance.toLocaleString('en-IN')}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {isDiscovered ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                                    ★ EQUILIBRIUM
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">Candidate</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 5: Auto-Square Off Timings */}
            {casTab === 'squareoff' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Revised Auto-Square Off Timings (Effective 03 Aug 2026)
                  </h3>
                  <p className="text-xs text-slate-500">
                    To prevent square-off orders from colliding with the 3:15 pm CAS transition, brokers and exchanges are shifting auto-square off timings earlier into the session.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      Equity &amp; F&amp;O Robo Orders
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      3:05 PM IST
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Auto-square off triggers at 3:05 pm for all Robo orders to prevent pending brackets at market close.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                      Equity MIS Orders
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      3:10 PM IST
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Intraday MIS square-off occurs 5 minutes prior to CAS to avoid getting frozen in the 3:15–3:20 pm transition window.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      Equity F&amp;O Positions
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      3:20 PM IST
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Since F&amp;O trading continues until 3:40 pm, F&amp;O square-off occurs at 3:20 pm, giving 20 minutes before contract expiration.
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
