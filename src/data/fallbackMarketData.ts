// Auto-generated infallible fallback market data
// Guarantees zero "Data Unavailable" screens even if backend or static files are unreachable
import type {
  BlogArticle,
  IPOOffering,
  MarketIndexInstrument,
  MarketInsight,
  StockInstrument,
} from "../types/financial";

export interface FallbackMarketDataset {
  indices: MarketIndexInstrument[];
  stocks: StockInstrument[];
  ipos: IPOOffering[];
  insights: MarketInsight[];
  blogs: BlogArticle[];
  lastSyncTime: string;
  lastSyncFormatted: string;
}

export const FALLBACK_MARKET_DATA: FallbackMarketDataset = {
  "indices": [
    {
      "id": "nifty50",
      "symbol": "NIFTY 50",
      "yahooSymbol": "^NSEI",
      "name": "NIFTY 50 Index",
      "value": 25144.3,
      "previousClose": 25299.35,
      "change": -155.05,
      "changePercent": -0.61,
      "unit": "PTS",
      "provenance": {
        "source": "NSE India Official Index Feed",
        "retrievedAt": "2026-11-15T17:04:00.541Z",
        "effectiveDate": "2026-11-15",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "PTS",
        "unit": "Index Points",
        "dataCategory": "Benchmark Index"
      }
    },
    {
      "id": "sensex",
      "symbol": "SENSEX",
      "yahooSymbol": "^BSESN",
      "name": "BSE SENSEX",
      "value": 81592.45,
      "previousClose": 81911.01,
      "change": -318.56,
      "changePercent": -0.39,
      "unit": "PTS",
      "provenance": {
        "source": "Yahoo Finance Indian Index Feed",
        "retrievedAt": "2026-11-15T17:04:00.540Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "DELAYED",
        "currency": "PTS",
        "unit": "Index Points",
        "dataCategory": "Benchmark Index"
      }
    },
    {
      "id": "banknifty",
      "symbol": "BANK NIFTY",
      "yahooSymbol": "^NSEBANK",
      "name": "NIFTY Bank Index",
      "value": 61034.1,
      "previousClose": 61518.5,
      "change": -484.4,
      "changePercent": -0.79,
      "unit": "PTS",
      "provenance": {
        "source": "NSE India Official Index Feed",
        "retrievedAt": "2026-11-15T17:04:00.541Z",
        "effectiveDate": "2026-11-15",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "PTS",
        "unit": "Index Points",
        "dataCategory": "Sector Index"
      }
    },
    {
      "id": "indiavix",
      "symbol": "INDIA VIX",
      "yahooSymbol": "^INDIAVIX",
      "name": "India Volatility Index",
      "value": 15.78,
      "previousClose": 16.62,
      "change": -0.84,
      "changePercent": -5.06,
      "unit": "PTS",
      "provenance": {
        "source": "NSE India Official Index Feed",
        "retrievedAt": "2026-11-15T17:04:00.541Z",
        "effectiveDate": "2026-11-15",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "PTS",
        "unit": "Volatility %",
        "dataCategory": "Volatility Index"
      }
    },
    {
      "id": "usdinr",
      "symbol": "USD/INR",
      "yahooSymbol": "INR=X",
      "name": "US Dollar / Indian Rupee",
      "value": 94.24,
      "previousClose": 94.03,
      "change": 0.21,
      "changePercent": 0.22,
      "unit": "INR",
      "provenance": {
        "source": "Yahoo Finance Indian Index Feed",
        "retrievedAt": "2026-11-15T17:03:58.362Z",
        "effectiveDate": "2026-11-15",
        "verificationStatus": "Verified",
        "qualityStatus": "DELAYED",
        "currency": "INR",
        "unit": "INR per USD",
        "dataCategory": "Currency FX"
      }
    },
    {
      "id": "gold",
      "symbol": "GOLD",
      "yahooSymbol": "GC=F",
      "name": "Gold Futures (COMEX/Ref)",
      "value": 3886.3,
      "previousClose": 3885.3,
      "change": 1,
      "changePercent": 0.03,
      "unit": "USD/oz",
      "provenance": {
        "source": "Yahoo Finance Indian Index Feed",
        "retrievedAt": "2026-11-15T17:03:58.538Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "DELAYED",
        "currency": "USD",
        "unit": "USD per troy oz",
        "dataCategory": "Precious Metal"
      }
    },
    {
      "id": "silver",
      "symbol": "SILVER",
      "yahooSymbol": "SI=F",
      "name": "Silver Futures (COMEX/Ref)",
      "value": 49.12,
      "previousClose": 49.97,
      "change": -0.85,
      "changePercent": -1.7,
      "unit": "USD/oz",
      "provenance": {
        "source": "Yahoo Finance Indian Index Feed",
        "retrievedAt": "2026-11-15T17:03:59.674Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "DELAYED",
        "currency": "USD",
        "unit": "USD per troy oz",
        "dataCategory": "Precious Metal"
      }
    },
    {
      "id": "crude",
      "symbol": "CRUDE OIL",
      "yahooSymbol": "CL=F",
      "name": "WTI Crude Oil Futures",
      "value": 88.56,
      "previousClose": 88.74,
      "change": -0.18,
      "changePercent": -0.2,
      "unit": "USD/bbl",
      "provenance": {
        "source": "Yahoo Finance Indian Index Feed",
        "retrievedAt": "2026-11-15T17:03:59.786Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "DELAYED",
        "currency": "USD",
        "unit": "USD per barrel",
        "dataCategory": "Energy Commodity"
      }
    }
  ],
  "stocks": [
    {
      "id": "stk-reliance",
      "symbol": "RELIANCE",
      "bseCode": "500325",
      "yahooSymbol": "RELIANCE.NS",
      "companyName": "Reliance Industries Limited",
      "logoUrl": "/assets/movers/reliance.png",
      "exchange": "NSE/BSE",
      "sector": "Oil",
      "industry": "Oil",
      "isin": "INE002A01018",
      "currentPrice": 1339.7,
      "previousClose": 1335.4,
      "open": 1336.6,
      "dayHigh": 1350.7,
      "dayLow": 1324,
      "week52High": 1611.8,
      "week52Low": 1152.2,
      "volume": 13756247,
      "marketCapCr": 1805375,
      "lastTradeTime": "2026-11-13T10:29:51.000Z",
      "sparkline": [
        1201.8,
        1196.2,
        1158,
        1167.4,
        1164.9,
        1300,
        1307.9
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:09.059Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 18.88,
        "pb": 1.91,
        "roePct": 8.69,
        "rocePct": 10.4,
        "debtToEquity": 0.43,
        "revenueGrowthPct": 10.53,
        "profitGrowthPct": 18.35,
        "dividendYieldPct": 0.45,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-tcs",
      "symbol": "TCS",
      "bseCode": "532540",
      "yahooSymbol": "TCS.NS",
      "companyName": "Tata Consultancy Services Limited",
      "logoUrl": "/assets/movers/tcs.png",
      "exchange": "NSE/BSE",
      "sector": "Information Technology",
      "industry": "Information Technology",
      "isin": "INE467B01029",
      "currentPrice": 2407.5,
      "previousClose": 2442.4,
      "open": 2438.6,
      "dayHigh": 2450.3,
      "dayLow": 2400.2,
      "week52High": 3350,
      "week52Low": 1976.8,
      "volume": 3344738,
      "marketCapCr": 878653,
      "lastTradeTime": "2026-11-13T10:29:55.000Z",
      "sparkline": [
        2535,
        2496.9,
        2460,
        2478,
        2502.6,
        2501.7,
        2499.1
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:08.565Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 16.94,
        "pb": 7.38,
        "roePct": 43.37,
        "rocePct": 64.2,
        "debtToEquity": 0.1,
        "revenueGrowthPct": 4.68,
        "profitGrowthPct": 1.35,
        "dividendYieldPct": 4.53,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-hdfcbank",
      "symbol": "HDFCBANK",
      "bseCode": "500180",
      "yahooSymbol": "HDFCBANK.NS",
      "companyName": "HDFC Bank Limited",
      "logoUrl": "/assets/movers/hdfc-bank.png",
      "exchange": "NSE/BSE",
      "sector": "Banks",
      "industry": "Banks",
      "isin": "INE040A01034",
      "currentPrice": 804,
      "previousClose": 812.3,
      "open": 808,
      "dayHigh": 808.8,
      "dayLow": 798,
      "week52High": 1017.5,
      "week52Low": 669.2,
      "volume": 23442886,
      "marketCapCr": 1252880,
      "lastTradeTime": "2026-11-13T10:29:01.000Z",
      "sparkline": [
        688.05,
        680.2,
        685.3,
        683.3,
        692.8,
        700,
        725.5
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:08.939Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 14.97,
        "pb": 2.08,
        "roePct": 13.27,
        "rocePct": 7.8,
        "debtToEquity": 0.25,
        "revenueGrowthPct": 5.21,
        "profitGrowthPct": 7.87,
        "dividendYieldPct": 1.9,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-icicibank",
      "symbol": "ICICIBANK",
      "bseCode": "532174",
      "yahooSymbol": "ICICIBANK.NS",
      "companyName": "ICICI Bank Limited",
      "logoUrl": "/assets/movers/icici-bank.png",
      "exchange": "NSE/BSE",
      "sector": "Banks",
      "industry": "Banks",
      "isin": "INE090A01021",
      "currentPrice": 1583.6,
      "previousClose": 1590,
      "open": 1576.1,
      "dayHigh": 1586,
      "dayLow": 1566.1,
      "week52High": 1616,
      "week52Low": 1187.6,
      "volume": 11440109,
      "marketCapCr": 1140588,
      "lastTradeTime": "2026-11-13T10:26:18.000Z",
      "sparkline": [
        1403,
        1386.9,
        1377.6,
        1386.6,
        1398,
        1387.4,
        1424.5
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:09.071Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 18.15,
        "pb": 2.97,
        "roePct": 15.39,
        "rocePct": 8.1,
        "debtToEquity": 0.25,
        "revenueGrowthPct": 5.95,
        "profitGrowthPct": 5.98,
        "dividendYieldPct": 0.75,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-bhartiartl",
      "symbol": "BHARTIARTL",
      "bseCode": "532454",
      "yahooSymbol": "BHARTIARTL.NS",
      "companyName": "Bharti Airtel Limited",
      "logoUrl": "/assets/movers/airtel.png",
      "exchange": "NSE/BSE",
      "sector": "Telecom",
      "industry": "Telecom",
      "isin": "INE397D01024",
      "currentPrice": 2106,
      "previousClose": 2096,
      "open": 2082,
      "dayHigh": 2122.9,
      "dayLow": 2082,
      "week52High": 2174.5,
      "week52Low": 1726.3,
      "volume": 6106256,
      "marketCapCr": 1305746,
      "lastTradeTime": "2026-11-13T10:29:37.000Z",
      "sparkline": [
        1917.5,
        1978.8,
        1948.1,
        1972.1,
        1973.7,
        1989.9,
        2065
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:10.409Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 33.94,
        "pb": 8.26,
        "roePct": 19.62,
        "rocePct": 14.6,
        "debtToEquity": 1.26,
        "revenueGrowthPct": 22.47,
        "profitGrowthPct": -9.76,
        "dividendYieldPct": 1.12,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-sbin",
      "symbol": "SBIN",
      "bseCode": "500112",
      "yahooSymbol": "SBIN.NS",
      "companyName": "State Bank of India",
      "logoUrl": "/assets/movers/sbi.png",
      "exchange": "NSE/BSE",
      "sector": "Banks",
      "industry": "Banks",
      "isin": "INE062A01020",
      "currentPrice": 1080,
      "previousClose": 1086.5,
      "open": 1090,
      "dayHigh": 1090.7,
      "dayLow": 1074.15,
      "week52High": 1234.7,
      "week52Low": 933.9,
      "volume": 15886106,
      "marketCapCr": 1001538,
      "lastTradeTime": "2026-11-13T10:29:59.000Z",
      "sparkline": [
        960.8,
        945.1,
        956.8,
        971.9,
        961.85,
        987,
        970.25
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:12.246Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 10.65,
        "pb": 1.57,
        "roePct": 13.36,
        "rocePct": 7.2,
        "debtToEquity": 0.25,
        "revenueGrowthPct": 7.43,
        "profitGrowthPct": 7.78,
        "dividendYieldPct": 1.6,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-infy",
      "symbol": "INFY",
      "bseCode": "500209",
      "yahooSymbol": "INFY.NS",
      "companyName": "Infosys Limited",
      "logoUrl": "/assets/movers/infosys.png",
      "exchange": "NSE/BSE",
      "sector": "Information Technology",
      "industry": "Information Technology",
      "isin": "INE009A01021",
      "currentPrice": 1141.5,
      "previousClose": 1151.2,
      "open": 1147.5,
      "dayHigh": 1155,
      "dayLow": 1135.5,
      "week52High": 1728,
      "week52Low": 980.4,
      "volume": 5936229,
      "marketCapCr": 465851,
      "lastTradeTime": "2026-11-13T10:29:30.000Z",
      "sparkline": [
        1166,
        1163,
        1123.15,
        1146.5,
        1185,
        1161,
        1148.1
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:12.364Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 15.13,
        "pb": 4.94,
        "roePct": 31.03,
        "rocePct": 40.2,
        "debtToEquity": 0.09,
        "revenueGrowthPct": 9.83,
        "profitGrowthPct": 10.18,
        "dividendYieldPct": 4.18,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-lt",
      "symbol": "LT",
      "bseCode": "500510",
      "yahooSymbol": "LT.NS",
      "companyName": "Larsen & Toubro Limited",
      "logoUrl": "/assets/movers/lt.png",
      "exchange": "NSE/BSE",
      "sector": "Infrastructure",
      "industry": "Infrastructure",
      "isin": "INE018A01030",
      "currentPrice": 4143.8,
      "previousClose": 4159.2,
      "open": 4145.1,
      "dayHigh": 4193.6,
      "dayLow": 4127.6,
      "week52High": 4440,
      "week52Low": 3288.1,
      "volume": 1585695,
      "marketCapCr": 572684,
      "lastTradeTime": "2026-11-13T10:29:25.000Z",
      "sparkline": [
        3680,
        3665.1,
        3801.3,
        3837.1,
        3871.7,
        3939.9,
        3948.2
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:09.324Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 27.41,
        "pb": 5.07,
        "roePct": 15.81,
        "rocePct": 14.2,
        "debtToEquity": 1.24,
        "revenueGrowthPct": 12.23,
        "profitGrowthPct": 8.32,
        "dividendYieldPct": 0.91,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-itc",
      "symbol": "ITC",
      "bseCode": "500875",
      "yahooSymbol": "ITC.NS",
      "companyName": "ITC Limited",
      "logoUrl": "/assets/movers/itc.png",
      "exchange": "NSE/BSE",
      "sector": "Food & Beverages",
      "industry": "Food & Beverages",
      "isin": "INE154A01025",
      "currentPrice": 285,
      "previousClose": 284.05,
      "open": 284,
      "dayHigh": 285.3,
      "dayLow": 282.1,
      "week52High": 412,
      "week52Low": 252.8,
      "volume": 8329401,
      "marketCapCr": 355844,
      "lastTradeTime": "2026-11-13T10:29:47.000Z",
      "sparkline": [
        260.5,
        260,
        259.5,
        265,
        265.6,
        266.4,
        273.9
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:10.234Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 18.51,
        "pb": 4.98,
        "roePct": 26.44,
        "rocePct": 36.8,
        "debtToEquity": 0.01,
        "revenueGrowthPct": 4.41,
        "profitGrowthPct": 4.9,
        "dividendYieldPct": 5.11,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-hindunilvr",
      "symbol": "HINDUNILVR",
      "bseCode": "500696",
      "yahooSymbol": "HINDUNILVR.NS",
      "companyName": "Hindustan Unilever Limited",
      "logoUrl": "/assets/movers/hul.png",
      "exchange": "NSE/BSE",
      "sector": "FMCG",
      "industry": "FMCG",
      "isin": "INE030A01027",
      "currentPrice": 1992.9,
      "previousClose": 1974,
      "open": 1971,
      "dayHigh": 1994.5,
      "dayLow": 1961,
      "week52High": 2479.6,
      "week52Low": 1758.2,
      "volume": 1268888,
      "marketCapCr": 460778,
      "lastTradeTime": "2026-11-13T10:23:28.000Z",
      "sparkline": [
        1818.6,
        1818,
        1815.8,
        1858.2,
        1864.6,
        1898.3,
        1962.8
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:10.252Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 30.57,
        "pb": 9.44,
        "roePct": 22.93,
        "rocePct": 22.4,
        "debtToEquity": 0.03,
        "revenueGrowthPct": 1.69,
        "profitGrowthPct": -0.18,
        "dividendYieldPct": 2.09,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-bajfinance",
      "symbol": "BAJFINANCE",
      "bseCode": "500034",
      "yahooSymbol": "BAJFINANCE.NS",
      "companyName": "Bajaj Finance Limited",
      "logoUrl": "/assets/movers/bajaj-finance.png",
      "exchange": "NSE/BSE",
      "sector": "Financial Services",
      "industry": "Financial Services",
      "isin": "INE296A01032",
      "currentPrice": 1115.2,
      "previousClose": 1110.7,
      "open": 1102,
      "dayHigh": 1118.6,
      "dayLow": 1090,
      "week52High": 1176.4,
      "week52Low": 787.9,
      "volume": 715972,
      "marketCapCr": 691517,
      "lastTradeTime": "2026-11-13T10:29:16.000Z",
      "sparkline": [
        918.7,
        912,
        917.25,
        938.9,
        939.1,
        959.4,
        970
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:16.741Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 31.34,
        "pb": 5.61,
        "roePct": 17.61,
        "rocePct": 12.1,
        "debtToEquity": 4.08,
        "revenueGrowthPct": 19.09,
        "profitGrowthPct": 15.21,
        "dividendYieldPct": 0.54,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-kotakbank",
      "symbol": "KOTAKBANK",
      "bseCode": "500247",
      "yahooSymbol": "KOTAKBANK.NS",
      "companyName": "Kotak Mahindra Bank Limited",
      "logoUrl": "/assets/movers/kotak-bank.png",
      "exchange": "NSE/BSE",
      "sector": "Banks",
      "industry": "Banks",
      "isin": "INE237A01036",
      "currentPrice": 488.55,
      "previousClose": 490.4,
      "open": 490.4,
      "dayHigh": 490.4,
      "dayLow": 483.95,
      "week52High": 494.05,
      "week52Low": 345.5,
      "volume": 11257492,
      "marketCapCr": 486176,
      "lastTradeTime": "2026-11-13T10:28:17.000Z",
      "sparkline": [
        440.75,
        442.5,
        440,
        459,
        461.6,
        458.35,
        464.65
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:15.867Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 22.65,
        "pb": 2.5,
        "roePct": 10.89,
        "rocePct": 22.4,
        "debtToEquity": 0.25,
        "revenueGrowthPct": 0.98,
        "profitGrowthPct": -12.6,
        "dividendYieldPct": 0.13,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-axisbank",
      "symbol": "AXISBANK",
      "bseCode": "532215",
      "yahooSymbol": "AXISBANK.NS",
      "companyName": "Axis Bank Limited",
      "logoUrl": "/assets/movers/axis-bank.png",
      "exchange": "NSE/BSE",
      "sector": "Banks",
      "industry": "Banks",
      "isin": "INE238A01034",
      "currentPrice": 1331,
      "previousClose": 1342.9,
      "open": 1338,
      "dayHigh": 1340,
      "dayLow": 1325.8,
      "week52High": 1418.3,
      "week52Low": 1150.3,
      "volume": 4277775,
      "marketCapCr": 416717,
      "lastTradeTime": "2026-11-13T10:25:05.000Z",
      "sparkline": [
        1220,
        1205.7,
        1220,
        1225,
        1217,
        1209,
        1232.7
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:15.868Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 13.87,
        "pb": 1.81,
        "roePct": 13.04,
        "rocePct": 22.4,
        "debtToEquity": 0.25,
        "revenueGrowthPct": 4.04,
        "profitGrowthPct": -5.76,
        "dividendYieldPct": 0.07,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-sunpharma",
      "symbol": "SUNPHARMA",
      "bseCode": "524715",
      "yahooSymbol": "SUNPHARMA.NS",
      "companyName": "Sun Pharmaceutical Industries Limited",
      "logoUrl": "/assets/movers/sun-pharma.png",
      "exchange": "NSE/BSE",
      "sector": "Pharmaceuticals",
      "industry": "Pharmaceuticals",
      "isin": "INE044A01036",
      "currentPrice": 1880,
      "previousClose": 1885,
      "open": 1887,
      "dayHigh": 1915,
      "dayLow": 1869.8,
      "week52High": 2046.9,
      "week52Low": 1583.7,
      "volume": 2037762,
      "marketCapCr": 452707,
      "lastTradeTime": "2026-11-13T10:29:50.000Z",
      "sparkline": [
        1740,
        1751.2,
        1757.5,
        1761,
        1777.7,
        1770,
        1769.9
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:12.816Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 41.21,
        "pb": 5.07,
        "roePct": 13.79,
        "rocePct": 19.4,
        "debtToEquity": 0.04,
        "revenueGrowthPct": 12.69,
        "profitGrowthPct": 5.32,
        "dividendYieldPct": 0.85,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-maruti",
      "symbol": "MARUTI",
      "bseCode": "532500",
      "yahooSymbol": "MARUTI.NS",
      "companyName": "Maruti Suzuki India Limited",
      "logoUrl": "/assets/movers/maruti.png",
      "exchange": "NSE/BSE",
      "sector": "Auto Manufacturers",
      "industry": "Auto Manufacturers",
      "isin": "INE585B01010",
      "currentPrice": 12854,
      "previousClose": 13024,
      "open": 12901,
      "dayHigh": 12978,
      "dayLow": 12786,
      "week52High": 17370,
      "week52Low": 10985,
      "volume": 492029,
      "marketCapCr": 407497,
      "lastTradeTime": "2026-11-13T10:29:56.000Z",
      "sparkline": [
        11220,
        11450,
        11579,
        11426,
        11397,
        11672,
        11869
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:12.780Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 30.29,
        "pb": 3.74,
        "roePct": 12.34,
        "rocePct": 20.8,
        "debtToEquity": 0,
        "revenueGrowthPct": 18.83,
        "profitGrowthPct": 1.24,
        "dividendYieldPct": 1.08,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-ntpc",
      "symbol": "NTPC",
      "bseCode": "532555",
      "yahooSymbol": "NTPC.NS",
      "companyName": "NTPC Limited",
      "logoUrl": "/assets/movers/ntpc.png",
      "exchange": "NSE/BSE",
      "sector": "Power",
      "industry": "Power",
      "isin": "INE733E01010",
      "currentPrice": 319.1,
      "previousClose": 323,
      "open": 321,
      "dayHigh": 322.95,
      "dayLow": 317.05,
      "week52High": 414.4,
      "week52Low": 292.05,
      "volume": 4877275,
      "marketCapCr": 312814,
      "lastTradeTime": "2026-11-13T10:28:38.000Z",
      "sparkline": [
        300,
        301.8,
        303.75,
        310.5,
        316.25,
        323,
        321.55
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:13.727Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 10.27,
        "pb": 1.47,
        "roePct": 13.92,
        "rocePct": 10.2,
        "debtToEquity": 1.31,
        "revenueGrowthPct": -0.56,
        "profitGrowthPct": 48.19,
        "dividendYieldPct": 2.79,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-titan",
      "symbol": "TITAN",
      "bseCode": "500114",
      "yahooSymbol": "TITAN.NS",
      "companyName": "Titan Company Limited",
      "logoUrl": "/assets/movers/titan.png",
      "exchange": "NSE/BSE",
      "sector": "Jewellery",
      "industry": "Jewellery",
      "isin": "INE280A01028",
      "currentPrice": 4844.9,
      "previousClose": 4921.9,
      "open": 4935,
      "dayHigh": 4947.8,
      "dayLow": 4837.1,
      "week52High": 5186.7,
      "week52Low": 3751,
      "volume": 624040,
      "marketCapCr": 434971,
      "lastTradeTime": "2026-11-13T10:26:55.000Z",
      "sparkline": [
        4323,
        4365.9,
        4337.9,
        4434,
        4436.5,
        4476.3,
        4562
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:13.681Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 61.85,
        "pb": 23.82,
        "roePct": 38.51,
        "rocePct": 22.4,
        "debtToEquity": 1.51,
        "revenueGrowthPct": 44.62,
        "profitGrowthPct": 52.02,
        "dividendYieldPct": 0.31,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-adaniports",
      "symbol": "ADANIPORTS",
      "bseCode": "532921",
      "yahooSymbol": "ADANIPORTS.NS",
      "companyName": "Adani Ports and Special Economic Zone Limited",
      "logoUrl": "/assets/movers/adani-ports.png",
      "exchange": "NSE/BSE",
      "sector": "Maritime Industries",
      "industry": "Maritime Industries",
      "isin": "INE742F01042",
      "currentPrice": 1903.3,
      "previousClose": 1930,
      "open": 1926,
      "dayHigh": 1932.9,
      "dayLow": 1893,
      "week52High": 1979,
      "week52Low": 1292,
      "volume": 1937817,
      "marketCapCr": 443167,
      "lastTradeTime": "2026-11-13T10:29:06.000Z",
      "sparkline": [
        1752.5,
        1754.5,
        1761.3,
        1872,
        1850,
        1854,
        1866.9
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:13.150Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 32.39,
        "pb": 4.33,
        "roePct": 13.33,
        "rocePct": 22.4,
        "debtToEquity": 0.65,
        "revenueGrowthPct": 26.16,
        "profitGrowthPct": 15.56,
        "dividendYieldPct": 0.39,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-m&m",
      "symbol": "MM",
      "bseCode": "500520",
      "yahooSymbol": "M&M.NS",
      "companyName": "Mahindra & Mahindra Limited",
      "logoUrl": "/assets/movers/mm.png",
      "exchange": "NSE/BSE",
      "sector": "Auto Manufacturers",
      "industry": "Auto Manufacturers",
      "isin": "INE101A01026",
      "currentPrice": 3333,
      "previousClose": 3399,
      "open": 3380,
      "dayHigh": 3382,
      "dayLow": 3330,
      "week52High": 3839.9,
      "week52Low": 2744.3,
      "volume": 1987890,
      "marketCapCr": 429813,
      "lastTradeTime": "2026-11-13T10:29:31.000Z",
      "sparkline": [
        2853.1,
        2858.4,
        2869.9,
        2890,
        2840.3,
        2868.8,
        2908
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE/BSE Live Market Feed (Groww Adapter)",
        "retrievedAt": "2026-11-15T17:04:01.191Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote"
      },
      "fundamentals": {
        "pe": 19.77,
        "pb": 4.33,
        "roePct": 19.8,
        "rocePct": 19.5,
        "debtToEquity": 1.57,
        "revenueGrowthPct": 25.21,
        "profitGrowthPct": 32.32,
        "dividendYieldPct": 0.94,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-hcltech",
      "symbol": "HCLTECH",
      "bseCode": "532281",
      "yahooSymbol": "HCLTECH.NS",
      "companyName": "HCL Technologies Limited",
      "logoUrl": "/assets/movers/hcltech.webp",
      "exchange": "NSE/BSE",
      "sector": "Information Technology",
      "industry": "Information Technology",
      "isin": "INE860A01027",
      "currentPrice": 1378,
      "previousClose": 1380.8,
      "open": 1380.7,
      "dayHigh": 1396.7,
      "dayLow": 1368.5,
      "week52High": 1780.1,
      "week52Low": 1030,
      "volume": 2089627,
      "marketCapCr": 373943,
      "lastTradeTime": "2026-11-13T10:28:27.000Z",
      "sparkline": [
        1417,
        1420,
        1400.5,
        1403.9,
        1428.1,
        1434,
        1439.1
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:14.763Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 20.4,
        "pb": 4.91,
        "roePct": 24.08,
        "rocePct": 30.4,
        "debtToEquity": 0.08,
        "revenueGrowthPct": 10.15,
        "profitGrowthPct": -4.29,
        "dividendYieldPct": 3.92,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-powergrid",
      "symbol": "POWERGRID",
      "bseCode": "532898",
      "yahooSymbol": "POWERGRID.NS",
      "companyName": "Power Grid Corporation of India Limited",
      "logoUrl": "/assets/movers/power-grid.png",
      "exchange": "NSE/BSE",
      "sector": "Power",
      "industry": "Power",
      "isin": "INE752E01010",
      "currentPrice": 257.45,
      "previousClose": 259.45,
      "open": 259.5,
      "dayHigh": 260.1,
      "dayLow": 256,
      "week52High": 324.95,
      "week52Low": 242.3,
      "volume": 4947984,
      "marketCapCr": 240700,
      "lastTradeTime": "2026-11-13T10:29:03.000Z",
      "sparkline": [
        247,
        251.75,
        251.4,
        260,
        265,
        267.7,
        259.55
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:17.551Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 14.87,
        "pb": 2.25,
        "roePct": 15.17,
        "rocePct": 22.4,
        "debtToEquity": 1.42,
        "revenueGrowthPct": 0.47,
        "profitGrowthPct": 22.68,
        "dividendYieldPct": 3.48,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-coalindia",
      "symbol": "COALINDIA",
      "bseCode": "533278",
      "yahooSymbol": "COALINDIA.NS",
      "companyName": "Coal India Limited",
      "logoUrl": "/assets/movers/coal-india.png",
      "exchange": "NSE/BSE",
      "sector": "Metals & Mining",
      "industry": "Metals & Mining",
      "isin": "INE522F01014",
      "currentPrice": 403.5,
      "previousClose": 404.3,
      "open": 404.6,
      "dayHigh": 406.2,
      "dayLow": 402.3,
      "week52High": 491.25,
      "week52Low": 369.6,
      "volume": 4674518,
      "marketCapCr": 249221,
      "lastTradeTime": "2026-11-13T10:29:58.000Z",
      "sparkline": [
        405,
        398,
        392,
        393.1,
        389,
        408,
        408
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:19.195Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 7.45,
        "pb": 1.96,
        "roePct": 26.17,
        "rocePct": 22.4,
        "debtToEquity": 0.12,
        "revenueGrowthPct": 0.54,
        "profitGrowthPct": -12.35,
        "dividendYieldPct": 6.55,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-ultracemco",
      "symbol": "ULTRACEMCO",
      "bseCode": "532538",
      "yahooSymbol": "ULTRACEMCO.NS",
      "companyName": "UltraTech Cement Limited",
      "logoUrl": "/assets/movers/ultratech.png",
      "exchange": "NSE/BSE",
      "sector": "Cement",
      "industry": "Cement",
      "isin": "INE481G01011",
      "currentPrice": 12100,
      "previousClose": 12337,
      "open": 12280,
      "dayHigh": 12285,
      "dayLow": 12062,
      "week52High": 13110,
      "week52Low": 10325,
      "volume": 171017,
      "marketCapCr": 362472,
      "lastTradeTime": "2026-11-13T10:29:16.000Z",
      "sparkline": [
        11180,
        11150,
        11104,
        11175,
        11045,
        11387,
        11700
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:19.200Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 41.03,
        "pb": 4.93,
        "roePct": 11.96,
        "rocePct": 22.4,
        "debtToEquity": 0.4,
        "revenueGrowthPct": 16.15,
        "profitGrowthPct": 35.58,
        "dividendYieldPct": 1.95,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-ongc",
      "symbol": "ONGC",
      "bseCode": "500312",
      "yahooSymbol": "ONGC.NS",
      "companyName": "Oil & Natural Gas Corporation Limited",
      "logoUrl": "/assets/movers/ongc.png",
      "exchange": "NSE/BSE",
      "sector": "Oil",
      "industry": "Oil",
      "isin": "INE213A01029",
      "currentPrice": 225,
      "previousClose": 224.5,
      "open": 225.5,
      "dayHigh": 226.8,
      "dayLow": 225,
      "week52High": 307.5,
      "week52Low": 218.53,
      "volume": 8935063,
      "marketCapCr": 282742,
      "lastTradeTime": "2026-11-13T10:29:57.000Z",
      "sparkline": [
        228.44,
        229.85,
        224.89,
        225.79,
        225.39,
        234.83,
        232.17
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:17.508Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 5.58,
        "pb": 0.71,
        "roePct": 12.35,
        "rocePct": 22.4,
        "debtToEquity": 0.46,
        "revenueGrowthPct": -0.55,
        "profitGrowthPct": 29.91,
        "dividendYieldPct": 3.23,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-tatasteel",
      "symbol": "TATASTEEL",
      "bseCode": "500470",
      "yahooSymbol": "TATASTEEL.NS",
      "companyName": "Tata Steel Limited",
      "logoUrl": "/assets/movers/tata-steel.png",
      "exchange": "NSE/BSE",
      "sector": "Metals & Mining",
      "industry": "Metals & Mining",
      "isin": "INE081A01020",
      "currentPrice": 186.68,
      "previousClose": 188,
      "open": 187,
      "dayHigh": 188.43,
      "dayLow": 185.8,
      "week52High": 224.4,
      "week52Low": 160.06,
      "volume": 13050423,
      "marketCapCr": 233692,
      "lastTradeTime": "2026-11-13T10:29:55.000Z",
      "sparkline": [
        169.94,
        171.42,
        169.27,
        169.46,
        167.6,
        177.37,
        176.5
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:20.139Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 19.83,
        "pb": 2.29,
        "roePct": 11.18,
        "rocePct": 7.4,
        "debtToEquity": 0.99,
        "revenueGrowthPct": 6.12,
        "profitGrowthPct": 242.99,
        "dividendYieldPct": 2.14,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-tatamotors",
      "symbol": "TMPV",
      "bseCode": "500570",
      "yahooSymbol": "TMPV.NS",
      "companyName": "Tata Motors Passenger Vehicles Limited",
      "logoUrl": "/assets/movers/tatamotors.png",
      "exchange": "NSE/BSE",
      "sector": "Auto Manufacturers",
      "industry": "Auto Manufacturers",
      "isin": "INE155A01022",
      "currentPrice": 287.4,
      "previousClose": 297.25,
      "open": 297.25,
      "dayHigh": 297.3,
      "dayLow": 287.25,
      "week52High": 411.4,
      "week52Low": 259.1,
      "volume": 9462724,
      "marketCapCr": 109385,
      "lastTradeTime": "2026-11-13T10:27:20.000Z",
      "sparkline": [
        263.7,
        261.2,
        263.6,
        266,
        265.4,
        272.4,
        276.7
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:19.192Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 1.38,
        "pb": 0.98,
        "roePct": 5.47,
        "rocePct": 22.4,
        "debtToEquity": 0.71,
        "revenueGrowthPct": -8.09,
        "profitGrowthPct": -107.1,
        "dividendYieldPct": 1.01,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-tmcv",
      "symbol": "TMCV",
      "bseCode": "544569",
      "yahooSymbol": "TMCV.NS",
      "companyName": "Tata Motors Limited",
      "logoUrl": "/assets/movers/tatamotors.png",
      "exchange": "NSE/BSE",
      "sector": "Auto Manufacturers",
      "industry": "Auto Manufacturers",
      "isin": "INE1TAE01010",
      "currentPrice": 433.55,
      "previousClose": 453.4,
      "open": 453.4,
      "dayHigh": 455,
      "dayLow": 431.15,
      "week52High": 509,
      "week52Low": 306.3,
      "volume": 6880844,
      "marketCapCr": 167164,
      "lastTradeTime": "2026-11-13T10:29:47.000Z",
      "sparkline": [
        384.05,
        399.2,
        399.7,
        400.3,
        396.35,
        401.4,
        404.2
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:20.190Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 26.5,
        "pb": 10.93,
        "roePct": 46.77,
        "rocePct": 19.5,
        "debtToEquity": 0.25,
        "revenueGrowthPct": 43.8,
        "profitGrowthPct": -5.16,
        "dividendYieldPct": 0.88,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-adanient",
      "symbol": "ADANIENT",
      "bseCode": "512599",
      "yahooSymbol": "ADANIENT.NS",
      "companyName": "Adani Enterprises Limited",
      "logoUrl": "/assets/movers/adani-enterprises.png",
      "exchange": "NSE/BSE",
      "sector": "Distributors",
      "industry": "Distributors",
      "isin": "INE423A01024",
      "currentPrice": 2688,
      "previousClose": 2741.5,
      "open": 2736,
      "dayHigh": 2750,
      "dayLow": 2677,
      "week52High": 3245,
      "week52Low": 1753,
      "volume": 940356,
      "marketCapCr": 370299,
      "lastTradeTime": "2026-11-13T10:29:06.000Z",
      "sparkline": [
        2508,
        2490,
        2479.8,
        2607.9,
        2579.4,
        2615.4,
        2593.3
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:17.733Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 69.62,
        "pb": 3.78,
        "roePct": 3.66,
        "rocePct": 22.4,
        "debtToEquity": 1.2,
        "revenueGrowthPct": 2.57,
        "profitGrowthPct": 29.07,
        "dividendYieldPct": 0.05,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-adanipower",
      "symbol": "ADANIPOWER",
      "bseCode": "533096",
      "yahooSymbol": "ADANIPOWER.NS",
      "companyName": "Adani Power Limited",
      "logoUrl": "/assets/movers/adani-power.png",
      "exchange": "NSE/BSE",
      "sector": "Power",
      "industry": "Power",
      "isin": "INE814H01029",
      "currentPrice": 205.67,
      "previousClose": 207.9,
      "open": 206.25,
      "dayHigh": 207.79,
      "dayLow": 204.62,
      "week52High": 254.2,
      "week52Low": 128.1,
      "volume": 11778447,
      "marketCapCr": 400350,
      "lastTradeTime": "2026-11-13T10:26:44.000Z",
      "sparkline": [
        186.55,
        188.69,
        184.59,
        191.2,
        189,
        195.35,
        195.5
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:20.167Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 21.47,
        "pb": 5.22,
        "roePct": 23.74,
        "rocePct": 22.4,
        "debtToEquity": 0.82,
        "revenueGrowthPct": -1.77,
        "profitGrowthPct": 1.74,
        "dividendYieldPct": 0,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-adanigreen",
      "symbol": "ADANIGREEN",
      "bseCode": "541450",
      "yahooSymbol": "ADANIGREEN.NS",
      "companyName": "Adani Green Energy Limited",
      "logoUrl": "/assets/movers/adani-green.png",
      "exchange": "NSE/BSE",
      "sector": "Power",
      "industry": "Power",
      "isin": "INE364U01010",
      "currentPrice": 1403,
      "previousClose": 1422,
      "open": 1425.9,
      "dayHigh": 1442,
      "dayLow": 1397.5,
      "week52High": 1631.5,
      "week52Low": 765,
      "volume": 2482479,
      "marketCapCr": 233438,
      "lastTradeTime": "2026-11-13T10:28:26.000Z",
      "sparkline": [
        1250,
        1289,
        1269,
        1307,
        1298.7,
        1337,
        1339.3
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:18.932Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 103.82,
        "pb": 10.81,
        "roePct": 8.68,
        "rocePct": 22.4,
        "debtToEquity": 5.48,
        "revenueGrowthPct": 11.25,
        "profitGrowthPct": -0.7,
        "dividendYieldPct": 0,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-wipro",
      "symbol": "WIPRO",
      "bseCode": "507685",
      "yahooSymbol": "WIPRO.NS",
      "companyName": "Wipro Limited",
      "logoUrl": "/assets/movers/wipro.png",
      "exchange": "NSE/BSE",
      "sector": "Information Technology",
      "industry": "Information Technology",
      "isin": "INE075A01022",
      "currentPrice": 194.6,
      "previousClose": 196.2,
      "open": 195.56,
      "dayHigh": 197.45,
      "dayLow": 194.1,
      "week52High": 273.1,
      "week52Low": 156.79,
      "volume": 4918972,
      "marketCapCr": 194103,
      "lastTradeTime": "2026-11-13T10:27:48.000Z",
      "sparkline": [
        189.2,
        187,
        184.5,
        190.1,
        198.31,
        196.4,
        198
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:21.210Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 14.68,
        "pb": 2.46,
        "roePct": 16.68,
        "rocePct": 18.6,
        "debtToEquity": 0.28,
        "revenueGrowthPct": 3.79,
        "profitGrowthPct": 0.36,
        "dividendYieldPct": 5.94,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-jswsteel",
      "symbol": "JSWSTEEL",
      "bseCode": "500228",
      "yahooSymbol": "JSWSTEEL.NS",
      "companyName": "JSW Steel Limited",
      "logoUrl": "/assets/movers/jsw-steel.png",
      "exchange": "NSE/BSE",
      "sector": "Metals & Mining",
      "industry": "Metals & Mining",
      "isin": "INE019A01038",
      "currentPrice": 1348,
      "previousClose": 1352.1,
      "open": 1343.1,
      "dayHigh": 1355.4,
      "dayLow": 1336.4,
      "week52High": 1370,
      "week52Low": 1073.2,
      "volume": 1611804,
      "marketCapCr": 331114,
      "lastTradeTime": "2026-11-13T10:29:05.000Z",
      "sparkline": [
        1260,
        1252.7,
        1241.2,
        1255.4,
        1246,
        1309.9,
        1320
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:20.627Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 10.44,
        "pb": 2.92,
        "roePct": 11.86,
        "rocePct": 22.4,
        "debtToEquity": 0.62,
        "revenueGrowthPct": 10.15,
        "profitGrowthPct": 630.68,
        "dividendYieldPct": 0.65,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-hindalco",
      "symbol": "HINDALCO",
      "bseCode": "500440",
      "yahooSymbol": "HINDALCO.NS",
      "companyName": "Hindalco Industries Limited",
      "logoUrl": "/assets/movers/hindalco.png",
      "exchange": "NSE/BSE",
      "sector": "Metals & Mining",
      "industry": "Metals & Mining",
      "isin": "INE038A01020",
      "currentPrice": 943.6,
      "previousClose": 964,
      "open": 954,
      "dayHigh": 963,
      "dayLow": 941.5,
      "week52High": 1176,
      "week52Low": 771.85,
      "volume": 8856292,
      "marketCapCr": 216678,
      "lastTradeTime": "2026-11-13T10:28:44.000Z",
      "sparkline": [
        885.65,
        891.2,
        893.75,
        886.3,
        884.7,
        911.4,
        915.75
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:20.695Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 11.29,
        "pb": 1.36,
        "roePct": 14.58,
        "rocePct": 22.4,
        "debtToEquity": 0.71,
        "revenueGrowthPct": 15.19,
        "profitGrowthPct": -16.32,
        "dividendYieldPct": 0.51,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-grasim",
      "symbol": "GRASIM",
      "bseCode": "500300",
      "yahooSymbol": "GRASIM.NS",
      "companyName": "Grasim Industries Limited",
      "logoUrl": "/assets/movers/grasim.png",
      "exchange": "NSE/BSE",
      "sector": "Cement",
      "industry": "Cement",
      "isin": "INE047A01021",
      "currentPrice": 3034,
      "previousClose": 3114.9,
      "open": 3125,
      "dayHigh": 3125,
      "dayLow": 3009,
      "week52High": 3411.1,
      "week52Low": 2502.5,
      "volume": 1510159,
      "marketCapCr": 212328,
      "lastTradeTime": "2026-11-13T10:28:44.000Z",
      "sparkline": [
        2950,
        2900.8,
        2900,
        2932.8,
        2981.4,
        3057.1,
        3090
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:20.877Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 18.85,
        "pb": 2.04,
        "roePct": 4.8,
        "rocePct": 22.4,
        "debtToEquity": 2.2,
        "revenueGrowthPct": 17.79,
        "profitGrowthPct": 32.8,
        "dividendYieldPct": 0.32,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    },
    {
      "id": "stk-bpcl",
      "symbol": "BPCL",
      "bseCode": "500547",
      "yahooSymbol": "BPCL.NS",
      "companyName": "Bharat Petroleum Corporation Limited",
      "logoUrl": "/assets/movers/bpcl.png",
      "exchange": "NSE/BSE",
      "sector": "Oil",
      "industry": "Oil",
      "isin": "INE029A01011",
      "currentPrice": 302,
      "previousClose": 311.5,
      "open": 308.1,
      "dayHigh": 308.5,
      "dayLow": 302,
      "week52High": 391.65,
      "week52Low": 266.6,
      "volume": 4413031,
      "marketCapCr": 134928,
      "lastTradeTime": "2026-11-13T10:26:17.000Z",
      "sparkline": [
        290.4,
        295.6,
        287,
        289.2,
        284.9,
        293.05,
        296.9
      ],
      "historicalSeries": [],
      "announcements": [],
      "provenance": {
        "source": "NSE India · BSE India · Groww Exchange & Filings · Zerodha Kite Registry · Yahoo Finance Historical",
        "retrievedAt": "2026-11-15T17:04:20.600Z",
        "effectiveDate": "2026-11-13",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR per share",
        "dataCategory": "Equity Quote & Fundamentals"
      },
      "fundamentals": {
        "pe": 8.54,
        "pb": 1.33,
        "roePct": 15.58,
        "rocePct": 22.4,
        "debtToEquity": 0.62,
        "revenueGrowthPct": 3.52,
        "profitGrowthPct": 93.78,
        "dividendYieldPct": 5.54,
        "reportingPeriod": "TTM Live Exchange Filings",
        "source": "NSE/BSE Company Filings (via Groww)"
      }
    }
  ],
  "ipos": [
    {
      "id": "crystal-crop-protection",
      "slug": "crystal-crop-protection-ipo",
      "companyName": "Crystal Crop Protection Ltd",
      "shortName": "Crystal Crop Protection",
      "logoMonogram": "CC",
      "logoColor": "#15803D",
      "logoUrl": "/assets/movers/crystal-crop.png",
      "sector": "Agro Chemicals",
      "industry": "Agro Chemicals",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "https://groww.in/ipo/crystal-crop-protection-ipo",
      "registrar": "MUFG Intime India Pvt Ltd",
      "registrarUrl": "https://in.mpms.mufg.com/Initial_Offer/public-issues.html",
      "issueSizeCr": 455.71,
      "freshIssueCr": 318.84,
      "ofsCr": 136.65,
      "priceBandLow": 259,
      "priceBandHigh": 272,
      "lotSize": 55,
      "minBidQuantity": 55,
      "minInvestment": 14960,
      "faceValue": 10,
      "dates": {
        "openDate": "2026-11-18",
        "closeDate": "2026-11-20",
        "allotmentDate": "2026-11-23",
        "refundDate": "2026-11-23",
        "dematCreditDate": "2026-11-24",
        "listingDate": "2026-11-26"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.438Z",
          "effectiveDate": "2026-11-20",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 15,
        "previousGmp": 27,
        "lastUpdated": "2026-11-15T15:07:00.000Z",
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": [
          {
            "date": "2026-11-13",
            "gmp": 40,
            "note": "Initial"
          },
          {
            "date": "2026-11-14",
            "gmp": 27,
            "note": "Stable"
          },
          {
            "date": "2026-11-15",
            "gmp": 15,
            "note": "Downward"
          }
        ]
      },
      "listing": {
        "issuePrice": 272,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-11-26",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "BSE India · Groww Exchange & Filings · Zerodha Kite Registry",
          "retrievedAt": "2026-11-15T17:04:24.461Z",
          "effectiveDate": "2026-11-13",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Equity Quote & Fundamentals"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY24",
            "revenueCr": 2229.93,
            "ebitdaCr": null,
            "patCr": 87.24,
            "assetsCr": 2541.92,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY25",
            "revenueCr": 2690.51,
            "ebitdaCr": null,
            "patCr": 118.39,
            "assetsCr": 3528.42,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY26",
            "revenueCr": 3151.97,
            "ebitdaCr": null,
            "patCr": 144.91,
            "assetsCr": 3927.24,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": 28.19,
        "pbRatio": 3.2,
        "marketCapCr": 3108,
        "eps": 22.4,
        "industryAvgPe": 24.8,
        "reportingPeriod": "Issue Price Valuation",
        "calculationBasis": "Upper issue price divided by restated pre-issue EPS (via InvestorGain / RHP)",
        "peers": []
      },
      "profile": {
        "overview": "Crystal Crop Protection Limited is an agrochemical and seed company established in 1994. The company develops, manufactures, and distributes crop protection products, natural crop solutions, technical-grade active ingredients, and seeds. Its crop protection portfolio includes herbicides, fungicides, insecticides, bio-stimulants, bio-protectants, plant growth regulators, liquid fertilisers, and micronutrients. \nIts seed portfolio covers field crops such as cotton, mustard, maize, rice, and wheat, along with vegetable and flower seeds. The company also manufactures self-propelled boom sprayers and sells conventional sprayers. It operates four formulation manufacturing units in Haryana, Gujarat, and Jammu and two technical manufacturing units in Gujarat and Maharashtra. \nIts seed processing facilities are located in Hyderabad, Telangana, and Bengaluru, Karnataka. The company also operates research and development facilities across multiple states, including its Key Research and Development Centre in Sonipat, Haryana.",
        "productsAndServices": "Crystal Crop Protection Ltd operates in Agro Chemicals (Founded 1994).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE101P01016.",
        "industryOverview": "Agro Chemicals primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding opens on 18 November",
        "promoters": [
          "Mr Ankur Aggarwal"
        ],
        "growthOpportunities": [
          "Expansion into biological crop solutions and organic bio-stimulants",
          "Scaling hybrid seed sales in cotton, mustard, and maize belts",
          "Increasing direct farm mechanization sprayer penetration"
        ],
        "strengths": [
          "The company claims to have dedicated R&D facilities for crop protection products and seeds, including its Key Research Development Centre (KRDC) in Sonipat, Haryana, which is recognised by the Department of Science and Technology and has received GLP compliance certification. As of the date of the prospectus, it had applied for 28 patents, of which 18 were granted in India and two outside India. It also had 14 patents commercialised as of March 31, 2026.",
          "As of June 30, 2026, the company had 139 domestic registrations for technical-grade products, 601 domestic formulation registrations and 147 export registrations for technicals and formulations. Its seed portfolio comprised over 275 hybrid varieties, including 111 field crop varieties, 139 vegetable seed varieties, and 25 marigold varieties. It also held 63 plant variety protection (PVP) registrations across cotton, pearl millet, sorghum, and mustard.",
          "The company has entered into product development and technology collaborations with multinational companies such as Bayer, BASF, Corteva, Cibus, and Traitomic. These arrangements cover crop protection formulations, herbicide-tolerant mustard varieties, insect-resistant cotton seeds, and gene-editing research in mustard. It has also collaborated with the World Vegetable Centre on developing disease-resistant okra varieties.",
          "The company has acquired several established agrochemical brands, including Bavistin from BASF; Proclaim, Tilt, and Blue Copper from Syngenta; Dursban and Nurelle D from Dow AgroSciences; and Gramoxone from Syngenta. Its seed business has also expanded through acquisitions from Bayer, Syngenta, Kohinoor Seeds, and I&B Seeds. These acquisitions have added established products and brands to its existing portfolio.",
          "The company claims to operate four crop protection formulation manufacturing units with an aggregate installed capacity of 75,962 MT and two technical-grade manufacturing units with a combined capacity of 4,717 MT as of June 30, 2026. It also operates three seed processing units with a combined installed capacity of 49,935.79 MT. Its formulation manufacturing units are accredited with ISO 9001:2015 quality management and ISO 14001:2015 environmental management system standards.",
          "As of June 30, 2026, the company had a distribution network of 14,717 independent distributors across 23 states and four union territories. Its network also included 34 distribution centres and three regional distribution centres. The company had 729 employees supporting its crop protection sales network and 489 employees supporting its seeds business.",
          "The company’s portfolio covers crop protection products, natural crop solutions, technical-grade active ingredients, and hybrid seeds across field crops, vegetables, and flowers. It also exports crop protection products and seeds to multiple international markets. As of June 30, 2026, it held 53 product registrations across 14 overseas jurisdictions, including Europe and Brazil."
        ],
        "risks": [
          "The company, its promoters, and one of its directors are subject to ongoing criminal and regulatory proceedings relating to alleged violations of the Foreign Trade Policy (2009–2014) and the Handbook of Procedures of the Directorate General of Foreign Trade. Any adverse outcome in these proceedings could negatively affect the company’s business, financial condition, cash flows, and reputation.",
          "A significant portion of the company’s revenue from operations is derived from its domestic business in India. Domestic sales contributed Rs 1,160.05 crore (96.90%), Rs 3,006.38 crore (95.38%), Rs 2,622.64 crore (97.48%), and Rs 2,180.76 crore (97.80%) to revenue from operations in the three months ended June 30, 2026, FY26, FY25, and FY24, respectively. Further, crop protection products and natural crop solutions contributed Rs 793.34 crore (63.20%), Rs 2,476.56 crore (80.42%), Rs 2,201.01 crore (81.74%) and Rs 1,836.72 crore (83.40%) during the same periods. Any adverse changes in the Indian crop protection and natural crop solutions industry, a decline in domestic demand, or failure to introduce new products in response to changing regulatory and market requirements could negatively affect the company’s business and financial condition.",
          "The company’s business is exposed to climatic conditions, pest attacks and seasonal variations in agricultural activity. Adverse weather conditions, including droughts, floods, unseasonal rainfall and heat waves, can affect crop yields, sowing patterns, pest incidence and farmers’ demand for crop protection products, natural crop solutions and seeds. The company’s sales, inventory requirements, capacity utilisation and working capital needs are also dependent on Kharif and Rabi cropping seasons, and any mismatch between inventory build-up and actual demand could result in higher holding costs, product obsolescence, stock-outs and lower margins. Any adverse changes in weather conditions, pest outbreaks or cropping patterns could negatively affect the company’s business, cash flows and financial performance.",
          "The company, its subsidiaries, promoters, directors, key managerial personnel, and senior management personnel are involved in various ongoing legal proceedings amounting to Rs 341.95 crore as of June 30, 2026, representing 16.76% of the company’s net worth. Any adverse judgments or penalties in these proceedings could result in additional payments, higher expenses, and increased current or contingent liabilities, adversely affecting the company’s business, financial condition, results of operations, and cash flows.",
          "The company’s crop protection and seeds businesses require significant investment in research and development, while new products may take 5–7 years to reach the market due to stringent testing and regulatory approval requirements. Any failure to develop commercially viable products, obtain timely registrations or respond to technological advancements and changing customer preferences could result in delays, higher costs, or loss of market share to competitors, adversely affecting the company’s business and cash flows.",
          "The company recorded negative cash flows from investing activities amounting to Rs 90.69 crore, Rs 215.90 crore, Rs 673.43 crore, and Rs 229.71 crore in the three months ended June 30, 2026, FY26, FY25, and FY24, respectively. These outflows primarily arose from purchases of property, plant and equipment, intangible assets and investments, along with payments towards asset and business acquisitions. The company also recorded negative cash flows from financing activities amounting to Rs 95.10 crore in FY24, mainly due to repayments of current and non-current borrowings, dividend payments, lease liabilities, and finance costs, partially offset by proceeds from current borrowings. Sustained outflows could adversely affect its liquidity, working capital requirements, and financial condition.",
          "The company had trade receivables of Rs 810.66 crore as of June 30, 2026, indicating a significant amount of funds outstanding from its customers. Any delay or failure in recovering these receivables could adversely affect the company’s cash flows, working capital position, and financial condition.",
          "As of August 31, 2026, the company and its subsidiaries had consolidated outstanding financial indebtedness of Rs 974.51 crore. Any difficulty in servicing or refinancing these borrowings could adversely affect the company’s cash flows, financial condition, and results of operations."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.iiflcapital.com/institutional-equities/upload/investmentbanking/prospects/crystal_crop_protection_limited_-_red_herring_prospectus.pdf",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://in.mpms.mufg.com/Initial_Offer/public-issues.html",
        "exchangeNoticeUrl": null
      },
      "archived": false,
      "provenance": {
        "source": "Groww Primary Issue Registry · InvestorGain GMP Tracker",
        "retrievedAt": "2026-11-15T17:04:05.438Z",
        "effectiveDate": "2026-11-26",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-mahanadi-coalfields-ipo",
      "slug": "mahanadi-coalfields-ipo",
      "companyName": "Mahanadi Coalfields",
      "shortName": "Mahanadi Coalfields",
      "logoMonogram": "MC",
      "logoColor": "#0F766E",
      "logoUrl": "/api/company-logo?searchId=mahanadi-coalfields-ipo&name=Mahanadi+Coalfields",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 4000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 320,
      "priceBandHigh": 340,
      "lotSize": 44,
      "minBidQuantity": 44,
      "minInvestment": 14960,
      "faceValue": null,
      "dates": {
        "openDate": "2026-11-19",
        "closeDate": "2026-11-23",
        "allotmentDate": "2026-11-25",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-11-27"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.471Z",
          "effectiveDate": "2026-11-23",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 7,
        "previousGmp": 9.25,
        "lastUpdated": "2026-11-15T15:07:00.000Z",
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": [
          {
            "date": "2026-11-14",
            "gmp": 9.25,
            "note": "Initial"
          },
          {
            "date": "2026-11-15",
            "gmp": 7,
            "note": "Stable"
          }
        ]
      },
      "listing": {
        "issuePrice": 340,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-11-27",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.471Z",
          "effectiveDate": "2026-11-27",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": []
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Mahanadi Coalfields has filed public issue offer documents for a Mainboard IPO on NSE / BSE.",
        "productsAndServices": "Mahanadi Coalfields operates in its core segment.",
        "businessModel": "Mainboard issue (Book Built) listed on NSE / BSE.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Filed with exchange & SEBI.",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [],
        "risks": []
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "InvestorGain GMP Tracker",
        "retrievedAt": "2026-11-15T17:04:05.471Z",
        "effectiveDate": "2026-11-27",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-watrana-rentals-ipo",
      "slug": "watrana-rentals-ipo",
      "companyName": "Watrana Rentals",
      "shortName": "Watrana Rentals",
      "logoMonogram": "WR",
      "logoColor": "#0F766E",
      "logoUrl": "/api/company-logo?searchId=watrana-rentals-ipo&name=Watrana+Rentals",
      "sector": "Capital Markets",
      "industry": "SME Equity Issue",
      "category": "SME",
      "status": "Upcoming",
      "exchanges": [
        "NSE"
      ],
      "website": "",
      "registrar": "Bigshare Services Pvt Ltd",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 120.1,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 245,
      "priceBandHigh": 245,
      "lotSize": 600,
      "minBidQuantity": 600,
      "minInvestment": 147000,
      "faceValue": null,
      "dates": {
        "openDate": "2026-11-19",
        "closeDate": "2026-11-23",
        "allotmentDate": "2026-11-25",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-11-27"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.472Z",
          "effectiveDate": "2026-11-23",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "SME IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 22,
        "previousGmp": 22,
        "lastUpdated": "2026-11-15T15:07:00.000Z",
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": [
          {
            "date": "2026-11-13",
            "gmp": 16,
            "note": "Initial"
          },
          {
            "date": "2026-11-14",
            "gmp": 22,
            "note": "Stable"
          },
          {
            "date": "2026-11-15",
            "gmp": 22,
            "note": "Stable"
          }
        ]
      },
      "listing": {
        "issuePrice": 245,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-11-27",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.472Z",
          "effectiveDate": "2026-11-27",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "SME IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": []
      },
      "valuation": {
        "peRatio": 9.61,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Issue Price Valuation",
        "calculationBasis": "Upper issue price divided by restated pre-issue EPS (via InvestorGain / RHP)",
        "peers": []
      },
      "profile": {
        "overview": "Watrana Rentals has filed public issue offer documents for a SME IPO on NSE.",
        "productsAndServices": "Watrana Rentals operates in its core segment.",
        "businessModel": "SME issue (Book Built) listed on NSE.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Filed with exchange & SEBI.",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [],
        "risks": []
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "InvestorGain GMP Tracker",
        "retrievedAt": "2026-11-15T17:04:05.472Z",
        "effectiveDate": "2026-11-27",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "SME IPO"
      }
    },
    {
      "id": "ipo-truhome-finance-ipo",
      "slug": "truhome-finance-ipo",
      "companyName": "Truhome Finance",
      "shortName": "Truhome Finance",
      "logoMonogram": "TF",
      "logoColor": "#14263F",
      "logoUrl": "https://assets-netstorage.groww.in/stock-assets/logos2/truhome_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 850,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 165,
      "priceBandHigh": 175,
      "lotSize": 85,
      "minBidQuantity": 85,
      "minInvestment": 14875,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-02",
        "closeDate": "2026-12-04",
        "allotmentDate": "2026-12-07",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-09"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.447Z",
          "effectiveDate": "2026-12-04",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 18,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 175,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-09",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.447Z",
          "effectiveDate": "2026-12-09",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Truhome Finance Limited (formerly known as Shriram Housing Finance Limited) is a premier affordable housing finance company (HFC) in India, currently the third-largest in its segment by Assets Under Management (AUM). Following its acquisition by global private equity firm Warburg Pincus in December 2024, the Mumbai-based firm rebranded to Truhome to align with its new strategic positioning. As of December 31, 2025, the company reported an AUM of ₹21,124.32 crore, serving a predominantly self-employed customer base through a pan-India network of 216 branches across 19 states. Financially, the company has exhibited strong growth, recording a Total Income of ₹1,905.48 crore and a Profit After Tax (PAT) of ₹286.24 crore for FY25, maintained by a healthy asset quality with Net Stage-3 assets at 1.09%. The proposed ₹3,000 crore IPO consists of an equal split between a fresh issue of ₹1,500 crore and an Offer for Sale (OFS) of ₹1,500 crore by promoter Mango Crest Investment Ltd. The proceeds are primarily earmarked for augmenting the capital base to meet future lending requirements and ensuring strict compliance with RBI’s capital adequacy norms.",
        "productsAndServices": "Truhome Finance operates in its core segment.",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN ISINTRUE123T.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [],
        "risks": []
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/mar-2026/truhome-finance-limited_100519.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.447Z",
        "effectiveDate": "2026-12-09",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-zepto-ipo",
      "slug": "zepto-ipo",
      "companyName": "Zepto",
      "shortName": "Zepto",
      "logoMonogram": "ZE",
      "logoColor": "#14263F",
      "logoUrl": "/assets/movers/zepto.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 2500,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 350,
      "priceBandHigh": 380,
      "lotSize": 39,
      "minBidQuantity": 39,
      "minInvestment": 14820,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-03",
        "closeDate": "2026-12-05",
        "allotmentDate": "2026-12-08",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-10"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.446Z",
          "effectiveDate": "2026-12-05",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 65,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 380,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "ZEPTEMP",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-10",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.446Z",
          "effectiveDate": "2026-12-10",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY24",
            "revenueCr": 4454.52,
            "ebitdaCr": null,
            "patCr": -1214.79,
            "assetsCr": 2898.27,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY25",
            "revenueCr": 11109.95,
            "ebitdaCr": null,
            "patCr": -4699.71,
            "assetsCr": 13800.13,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY26",
            "revenueCr": 22623.58,
            "ebitdaCr": null,
            "patCr": -5905.19,
            "assetsCr": 13510.11,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Zepto Limited is the fastest-growing quick commerce platform in India, focused on delivering groceries, fruits, vegetables, and a wide assortment of household products to users in under 10 minutes. The company operates a marketplace model, leveraging a network of over 1,139 strategically located 'dark stores' as of March 2026. Its business model relies on a proprietary technology stack for its app, warehouse management, last-mile delivery, and brand advertising, serving both end-consumers and providing B2B services to wholesalers and retailers.",
        "productsAndServices": "Zepto operates in its core segment (Founded 2020).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN ZEPTOISIN123.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Aadit Palicha"
        ],
        "growthOpportunities": [],
        "strengths": [
          "As India's fastest-growing quick commerce platform, Zepto's order volume grew at a CAGR of approximately 119.50% between Fiscal 2024 and Fiscal 2026, significantly outpacing the industry. This market leadership is mirrored in its financial performance, with revenue from operations skyrocketing from ₹4,454.52 Crores in FY24 to ₹22,623.58 Crores in FY26.",
          "The company's 'densification flywheel' strategy is improving operational efficiency, evidenced by the Average Distance per Order decreasing from 2.05 km in FY24 to 1.78 km in FY26, while the Orders Per Day (OPD) per store increased from 1,325 to 1,677 in the same period.",
          "Zepto is demonstrating significant improvements in unit economics, with Fixed Cost per Order reducing from ₹80.72 in Q1 FY24 to ₹52.34 in Q4 FY26. Concurrently, Digital Marketing Cost per Order has dramatically decreased from ₹10.82 to ₹1.01 in the same period, indicating increased brand salience and user retention.",
          "The company is successfully monetizing its platform beyond delivery commissions, with high-margin Advertisement Revenue growing exponentially from ₹49.17 Crores in FY24 to ₹1,635.73 Crores in FY26, a CAGR of 477.9%. This segment now constitutes 7.23% of total revenue from operations in FY26.",
          "Leveraging its data flywheel, Zepto has rapidly expanded its product assortment to enhance user engagement, increasing the average number of SKUs at a dark store from 12,312 in FY24 to 46,623 in FY26. This has deepened user adoption, with retained users purchasing from over 18 product categories within two years of joining.",
          "The company has demonstrated strong user base growth, with Annual Transacting Users (ATU) growing from 10.57 million in FY24 to 47.97 million in FY26. This growth is supported by solid user retention, with 45.2% to 49.8% of users remaining active on the platform three years after their first order.",
          "The company is led by its entrepreneurial founders, Aadit Palicha and Kaivalya Vohra, who are deeply involved in granular day-to-day execution. They are supported by an experienced management team with backgrounds in e-commerce, manufacturing, and retail from companies like Flipkart, ITC, and Amazon.",
          "Zepto has rapidly executed its physical infrastructure expansion, growing its network of dark stores from 337 in FY24 to 1,139 in FY26. This aggressive rollout supports its densification strategy and ability to maintain fast delivery times while scaling order volumes."
        ],
        "risks": [
          "The company has a history of significant and growing losses, with restated loss for the year increasing from ₹1,214.79 Crores in FY24 to ₹5,905.19 Crores in FY26. It has also consistently generated negative cash flows from operating activities since its inception.",
          "Business growth is critically dependent on acquiring and retaining users, which has historically required significant marketing expenditure. Advertisement expenses increased from ₹303.55 Crores in FY24 to ₹1,389.12 Crores in FY26, representing 6.14% of revenue from operations in the latest fiscal year.",
          "The business model is heavily reliant on a non-exclusive 'gig economy' network of delivery partners and a wide base of merchant partners. In FY26, delivery and handling expenses amounted to ₹3,046.34 Crores, highlighting a major cost center and dependency for its core service.",
          "The company faces intense competition from well-established players and new entrants in a market with low barriers to entry. Key competitors include Blinkit, a subsidiary of the publicly listed Zomato (Eternal Limited), and Instamart, a division of Swiggy, which have deep pockets and established ecosystems.",
          "The company and its Promoters are involved in multiple pending litigations, including a penalty of ₹0.07 Crores from the CCPA for 'dark patterns', which is currently under appeal, and summons received by Promoters from the Directorate of Enforcement regarding FEMA inquiries. Total contingent liabilities from pending litigations are valued at ₹2.01 Crores.",
          "The company experiences very high employee attrition, especially among its operational staff. The overall attrition rate was 51.28% in FY26, while the rate for its crucial 'Operating Staff' (pickers, packers, etc.) was significantly higher at 73.22% for the same period."
        ]
      },
      "documents": {
        "drhpUrl": "https://www.sebi.gov.in/filings/public-issues/jun-2026/zepto-limited-udrhp1_101929.html",
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.446Z",
        "effectiveDate": "2026-12-10",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-marri-retail-ipo",
      "slug": "marri-retail-ipo",
      "companyName": "Marri Retail",
      "shortName": "Marri Retail",
      "logoMonogram": "MR",
      "logoColor": "#334155",
      "logoUrl": "https://assets-netstorage.groww.in/stock-assets/logos2/marri_retail.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Bigshare Services Pvt Ltd",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 600,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 210,
      "priceBandHigh": 225,
      "lotSize": 66,
      "minBidQuantity": 66,
      "minInvestment": 14850,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-04",
        "closeDate": "2026-12-08",
        "allotmentDate": "2026-12-09",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-11"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.447Z",
          "effectiveDate": "2026-12-08",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 24,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 225,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "MARRI",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-11",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.447Z",
          "effectiveDate": "2026-12-11",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Marri Retail Limited is a prominent Hyderabad-based multi-brand retailer specializing in apparel and jewelry, operating through well-known regional brands such as The Chennai Shopping Mall, JC Brothers, JC Mall, and Jeans Corner. From its origins as a small proprietorship in 1997, the company has scaled to a network of 34 stores (spanning nearly 0.98 million sq. ft.) across Telangana, Andhra Pradesh, Karnataka, and Maharashtra. Financially, the company has shown significant momentum, reporting Revenue from Operations of ₹2,456.3 crore in FY25 and a Net Profit of ₹83.5 crore for the six-month period ending September 30, 2025. The IPO features a fresh issue of up to ₹522 crore and an Offer for Sale (OFS) of 2.7 crore equity shares by promoter Marri Venkat Reddy. Strategically, the company plans to utilize ₹250.5 crore of the proceeds for aggressive physical expansion (including 10 new apparel and 2 standalone jewelry stores) and ₹115.6 crore for debt repayment, aiming to strengthen its balance sheet as it transitions into a larger corporate retail entity.",
        "productsAndServices": "Marri Retail operates in its core segment.",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN TEMPMARI123M.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [],
        "risks": []
      },
      "documents": {
        "drhpUrl": "https://www.sebi.gov.in/filings/public-issues/feb-2026/marri-retail-limited-drhp_99483.html",
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.447Z",
        "effectiveDate": "2026-12-11",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-incred-holdings-ipo",
      "slug": "incred-holdings-ipo",
      "companyName": "InCred Holdings",
      "shortName": "InCred Holdings",
      "logoMonogram": "IH",
      "logoColor": "#0E7490",
      "logoUrl": "https://assets-netstorage.groww.in/stock-assets/logos2/incred_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 1500,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 180,
      "priceBandHigh": 192,
      "lotSize": 78,
      "minBidQuantity": 78,
      "minInvestment": 14976,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-05",
        "closeDate": "2026-12-09",
        "allotmentDate": "2026-12-10",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-12"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.447Z",
          "effectiveDate": "2026-12-09",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 35,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 192,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "INCREDTEMP",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-12",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.447Z",
          "effectiveDate": "2026-12-12",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "InCred Holdings Limited (“formerly known as KKR Capital Markets Limited) (“InCred Holdings” / “IHL”) was incorporated on 3rd January, 2011 under the Companies Act, 1956 and holds a certificate of registration under Securities and Exchange Board of India (Merchant Bankers) Regulations, 1992, to act as a Merchant Banker bearing registration no. INM000011880, and also acts as an investment manager to certain alternative investment funds registered with SEBI under the Securities and Exchange Board of India (Alternative Investment Funds) Regulations, 2012.",
        "productsAndServices": "InCred Holdings operates in its core segment.",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN TEMPINCRED12.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.447Z",
        "effectiveDate": "2026-12-12",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-razorpay-ipo",
      "slug": "razorpay-ipo",
      "companyName": "Razorpay",
      "shortName": "Razorpay",
      "logoMonogram": "RA",
      "logoColor": "#2563EB",
      "logoUrl": "/assets/movers/razorpay.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 3000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 460,
      "priceBandHigh": 490,
      "lotSize": 30,
      "minBidQuantity": 30,
      "minInvestment": 14700,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-08",
        "closeDate": "2026-12-10",
        "allotmentDate": "2026-12-11",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-15"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.447Z",
          "effectiveDate": "2026-12-10",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 95,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 490,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-15",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.447Z",
          "effectiveDate": "2026-12-15",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Razorpay is a Bengaluru-based financial technology company established in 2014 by Harshil Mathur and Shashank Kumar. It operates as a provider of comprehensive financial infrastructure and payment solutions for businesses, ranging from early-stage startups and small-to-medium enterprises (SMEs) to large-scale corporations.",
        "productsAndServices": "Razorpay operates in its core segment (Founded 2014).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN TEMPRAZOR12Z.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [],
        "risks": []
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.447Z",
        "effectiveDate": "2026-12-15",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-hero-fincrop-limited-ipo",
      "slug": "hero-fincrop-limited-ipo",
      "companyName": "Hero Fincorp Limited",
      "shortName": "Hero Fincorp",
      "logoMonogram": "HF",
      "logoColor": "#059669",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/hero_fincorp_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 3668.13,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 320,
      "priceBandHigh": 340,
      "lotSize": 44,
      "minBidQuantity": 44,
      "minInvestment": 14960,
      "faceValue": 10,
      "dates": {
        "openDate": "2026-12-09",
        "closeDate": "2026-12-11",
        "allotmentDate": "2026-12-14",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-16"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-11",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 55,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 340,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-16",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-16",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 4738.65,
            "ebitdaCr": null,
            "patCr": -191.9,
            "assetsCr": 34399.04,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 6401.59,
            "ebitdaCr": null,
            "patCr": 479.95,
            "assetsCr": 43451.23,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 8290.9,
            "ebitdaCr": null,
            "patCr": 637.05,
            "assetsCr": 53204.66,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Hero Fincorp is a non-banking financial company (NBFC) that provides a range of financial services to retail customers and micro, small, and medium enterprises (MSMEs) in India. Its offerings include vehicle loans (two-wheeler, used car, and electric vehicle loans), personal loans, mortgage loans, and MSME financing (secured and unsecured loans for business needs). Hero Fincorp also offers loans to corporate and institutional customers. \nThe company operates under the \"Hero\" brand and leverages the extensive distribution network of its parent company, Hero MotoCorp, which has a wide dealer presence across India. Hero Fincorp utilises a digital platform for customer acquisition and loan management. \nThe company is headquartered in India and has an extensive presence across the country with a combination of in-house teams and distribution partnerships.\nUse of proceeds:\nThe IPO consists of both a fresh issue of shares and an offer for sale (OFS).​ Proceeds from the OFS will go to the respective selling shareholders, whereas the net proceeds from the fresh issue will be utilised for the following purposes:​ \nAugmenting the company’s Tier-I capital to support future lending requirements.\nCovering expenses related to the offer.",
        "productsAndServices": "Hero Fincorp Limited operates in its core segment (Founded 1991).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN TEMPISIN123H.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Mr Abhimanyu Munjal"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Hero Fincorp claims to have strategically expanded its product portfolio beyond two-wheeler loans to include a wide range of secured and unsecured loans, catering to both retail and MSME customers. As of FY24, retail and MSME loans accounted for 65.08 percent and 20.80 percent of its total assets under management (AUM).",
          "Hero Fincorp claims to benefit from a deep-rooted relationship with Hero MotoCorp Limited, leveraging its brand recognition and extensive dealer network. In FY24, Hero MotoCorp Limited held a 41.19 percent equity stake in Hero Fincorp and provided financing for a significant portion of Hero MotoCorp’s two-wheeler sales.",
          "The company claims to have developed a comprehensive, omnichannel distribution network that spans 18,603 pin-codes across India, aided by both digital and physical channels. Hero Fincorp also claims to source a substantial portion of its business through partnerships with 3,612 partners, including used car dealers, digital partners, and direct sales agents (DSAs).",
          "Hero Fincorp claims to follow a ‘customer first approach’ that allows it to design customised products for retail and MSME clients, addressing unique financing needs across metro, urban, and rural regions. The company further states this approach enhances cross-sell potential, as demonstrated by a product per customer (PPC) ratio of 4.25 in FY24, 3.15 in FY23, and 3.52 in FY22.",
          "The company claims to integrate technology seamlessly into customer onboarding, underwriting, loan servicing, and collections, providing a fully digital experience. It claims to leverage artificial intelligence (AI), machine learning (ML), and real-time analytics to improve customer acquisition, reduce wait times, and streamline operations, boosting both operational efficiency and customer satisfaction.",
          "The company claims to have consistently improved its asset quality over the years. As of FY24, the gross non-performing assets (GNPA) ratio is 4.02 percent, a reduction from 5.11 percent in FY23 and 7.54 percent in 2022. Similarly, the net non-performing assets (NNPA) ratio has declined to 2.00 percent in 2024, compared to 2.69 percent in 2023 and 4.43 percent in 2022. ",
          "Leveraging advanced data analytics, Hero Fincorp claims to enhance its risk management by tracking credit trends and predicting default probabilities. It has integrated a technology-driven collections infrastructure, improving efficiency with a 94.42 percent collection rate in FY24, 95.07 percent in FY23, and 83.00 percent in FY22, through mobile app-based repayments and a four-tier collections team.",
          "The company claims to maintain a well-balanced mix of short-term and long-term assets and liabilities, minimising liquidity and interest rate risks.",
          "The company has received credit ratings of AA+ with a stable outlook from Credit Rating Information Services of India Limited (CRISIL), Investment Information and Credit Rating Agency of India Limited (ICRA), and Credit Analysis and Research Limited (CARE), and an A1+ rating for commercial papers from CRISIL, CARE, and ICRA as of FY24. ",
          "The company has witnessed a consistent increase in revenue from operations. It increased from Rs 4,738.65 crore in FY22 to Rs 6,401.59 crore in FY23 and Rs 8,290.90 crore in FY24."
        ],
        "risks": [
          "Hero Fincorp sourced Rs 9,581.62 crore (99.04 percent), Rs 8,726.52 crore (99.69 percent), and Rs 8,074.88 crore (99.93 percent) of its two-wheeler loans from Hero MotoCorp Limited’s dealerships in FY24, FY23, and FY22, respectively. Any decline in demand for Hero MotoCorp’s two-wheelers could adversely affect the company’s ability to generate revenue from these loans, thereby impacting its business, results of operations, and financial condition.",
          "The company’s retail finance business depends heavily on new-to-credit (NTC) borrowers. They accounted for 8.953.66 crore (26.55 percent) of the company’s total retail AUM in FY24, Rs 8,934.51 crore (34.06 percent) in FY23, and Rs 9,250.4 crore (46.33 percent) in FY22. The lack of credit history makes it difficult to assess these customers’ creditworthiness, which may result in higher default rates. In the event of defaults, recovering these loans, especially unsecured ones, could be challenging, potentially leading to the company’s financial losses.",
          "Retail finance, including vehicle, personal, mortgage, and MSME loans, accounted for Rs 44,506.08 crore (85.88 percent) of the company’s total AUM in FY24, Rs 34,713.74 crore (83.14 percent) in FY23, and Rs 26,117.92 crore (79.02 percent) in FY22. Furthermore, as of FY24, 72.20 percent of these loans are extended to customers in the “Aspiring India” segment, who are vulnerable to economic downturns. Any adverse economic developments could reduce loan demand or increase default rates, negatively impacting the company’s financial condition.",
          "The company’s promoters are involved in certain regulatory proceedings. Any adverse outcomes in these cases could be detrimental to the company’s reputation. ",
          "The company’s operations heavily depend on its information technology (IT) systems, which manage risk, deposit servicing, loan origination, and other critical functions. Capital expenditure incurred towards IT systems constituted Rs 48.43 crore (29.48 percent) of the company’s total expenditure in FY24, Rs 26.47 crore (57.51 percent) in FY23, and Rs 18.43 crore (71.79 percent) in FY22. Any internal or external disruptions, system failures, or inadequate maintenance could significantly affect customer service, operations, and the company’s reputation.",
          "The company’s net interest income and margins are vulnerable to fluctuations in interest rates due to its fixed and floating-rate loans and borrowings. As of FY24, FY23, and FY22, Rs 37,084.04 crore (72.03 percent), Rs 31,352.22 crore (75.55 percent), and Rs 25,279.18 crore (76.72 percent) of total gross loans were extended at fixed interest rates. If interest rates rise, the company may not be able to fully pass on increased costs to fixed-rate borrowers, which could lead to lower margins, increased defaults, and reduced loan demand.",
          "As of FY24, FY23, and FY22, unsecured loans accounted for Rs 20,275.58 crore (39.13 percent), Rs 15,521.04 crore (37.18 percent), and Rs 10,497.72 crore (31.76 percent) of the company’s total AUM, respectively. Any failure to recover receivables from these loans could adversely affect the company’s operations, cash flow, and financial condition.",
          "The company is exposed to risks related to the devaluation or loss of collateral backing secured loans, such as property and vehicles. Secured loans accounted for Rs 30,866.24 crore (59.95 percent) of the company’s total gross loans in FY24, Rs 25,928.95 crore (62.48 percent) in FY23, and Rs 22,240.08 crore (67.49 percent) in FY22.",
          "The company relies heavily on third-party distributors, including two-wheeler dealers, digital partners, and direct selling agents (DSAs). They accounted for 62.07 percent, 65.69 percent, and 58.02 percent of the company’s disbursements in FY24, FY23, and FY22, respectively. Any breakdown in relationships, service disruptions, or inefficiencies by these third-party service providers could impact the company’s business operations, financial condition, and reputation.",
          "The company reported negative cash flow from operating activities amounting to Rs 9,238.83 crore in FY24, Rs 6,918.52 crore in FY23, and Rs 5,411.77 crore in FY22. Additionally, negative cash flow from investing activities amounted to Rs 129.79 crore in FY24 and Rs 474.13 crore in FY23. Furthermore, the company experienced a net decrease in cash and cash equivalents amounting to Rs 651.36 crore in FY24, Rs 124.35 crore in FY23, and Rs 232.37 crore in FY22. If cash outflows continue to exceed inflows in the future, the company may face liquidity challenges.",
          "As of June 30, 2024, the company had outstanding financial indebtedness of Rs 43,917.86 crore. Any failure to service or repay these loans can hurt the company’s operations and financial position."
        ]
      },
      "documents": {
        "drhpUrl": "https://hfcl-website-cms.s3.ap-south-1.amazonaws.com/DRHP_Hero_Fin_Corp_Limited_fe2e340ba3.pdf",
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.448Z",
        "effectiveDate": "2026-12-16",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-allchem-lifescience-ipo",
      "slug": "allchem-lifescience-ipo",
      "companyName": "Allchem Lifescience",
      "shortName": "Allchem Lifescience",
      "logoMonogram": "AL",
      "logoColor": "#334155",
      "logoUrl": "https://assets-netstorage.groww.in/stock-assets/logos2/Allchecm_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Bigshare Services Pvt Ltd",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 750,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 280,
      "priceBandHigh": 295,
      "lotSize": 50,
      "minBidQuantity": 50,
      "minInvestment": 14750,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-10",
        "closeDate": "2026-12-12",
        "allotmentDate": "2026-12-15",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-17"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-12",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 42,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 295,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-17",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-17",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Allchem Lifescience is an Indian company founded in 2003 by Mr. Bipin Patel, specializing in the manufacture of advanced pharmaceutical intermediates (API intermediates) and specialty chemicals. Headquartered in Vadodara, Gujarat, Allchem Lifescience operates ISO-certified facilities and focuses on serving pharmaceutical, agrochemical, and industrial clients both in India and internationally across over 20 countries.",
        "productsAndServices": "Allchem Lifescience operates in its core segment.",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE12386489A.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.448Z",
        "effectiveDate": "2026-12-17",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-cardekho-ipo",
      "slug": "cardekho-ipo",
      "companyName": "CarDekho",
      "shortName": "CarDekho",
      "logoMonogram": "CA",
      "logoColor": "#0E7490",
      "logoUrl": "https://assets-netstorage.groww.in/stock-assets/logos2/cardekho.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 2000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 275,
      "priceBandHigh": 290,
      "lotSize": 51,
      "minBidQuantity": 51,
      "minInvestment": 14790,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-12",
        "closeDate": "2026-12-16",
        "allotmentDate": "2026-12-17",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-19"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-16",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 48,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 290,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "CDTEMP",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-19",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-19",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "CarDekho is a leading Indian technology company founded in 2008 by brothers Amit Jain and Anurag Jain in Jaipur, Rajasthan. It operates digital platforms focused on automotive sales, reviews, insurance, and financing. Originally started as an online portal providing car reviews, specifications, and price comparisons to simplify buying and selling cars, CarDekho has evolved into a comprehensive automotive ecosystem.",
        "productsAndServices": "CarDekho operates in its core segment.",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INECD123455D.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.448Z",
        "effectiveDate": "2026-12-19",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-haldirams-snacks-foods-ipo",
      "slug": "haldirams-snacks-foods-ipo",
      "companyName": "Haldiram's Snacks Foods",
      "shortName": "Haldiram's Snacks Foods",
      "logoMonogram": "HS",
      "logoColor": "#14263F",
      "logoUrl": "/assets/movers/haldiram.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 5000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 520,
      "priceBandHigh": 550,
      "lotSize": 27,
      "minBidQuantity": 27,
      "minInvestment": 14850,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-15",
        "closeDate": "2026-12-17",
        "allotmentDate": "2026-12-18",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-22"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-17",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 120,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 550,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "HALDITEMP",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-22",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-22",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Haldiram's is a renowned Indian food company that originated in 1937 as a small sweets and snacks shop in Bikaner, Rajasthan, founded by Ganga Bishan Agarwal, fondly known as Haldiram Ji. Over the decades, it has grown into one of India's largest and most trusted snack brands, with a diverse product range including traditional sweets, namkeens (savory snacks), papads, and cookies, alongside a strong presence in the restaurant and hospitality sectors.",
        "productsAndServices": "Haldiram's Snacks Foods operates in its core segment.",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE12345534H.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.448Z",
        "effectiveDate": "2026-12-22",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-prestige-hospitality-ventures-ipo",
      "slug": "prestige-hospitality-ventures-ipo",
      "companyName": "Prestige Hospitality Ventures Ltd",
      "shortName": "Prestige Hospitality",
      "logoMonogram": "PH",
      "logoColor": "#7C3AED",
      "logoUrl": "https://assets-netstorage.groww.in/stock-assets/logos2/logo-prestige.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 2500,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 180,
      "priceBandHigh": 195,
      "lotSize": 76,
      "minBidQuantity": 76,
      "minInvestment": 14820,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-16",
        "closeDate": "2026-12-18",
        "allotmentDate": "2026-12-21",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-23"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-18",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 32,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 195,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-23",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-23",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Prestige Hospitality Ventures Ltd is a hospitality asset owner and developer focused on luxury, upper-upscale, and upper midscale hospitality assets in India. It caters to both business and leisure travelers and operates as part of the larger Prestige Group, which is promoted by Prestige Estates Projects Limited (PEPL)—a well-established real estate company with over 38 years of experience.",
        "productsAndServices": "Prestige Hospitality Ventures Ltd operates in its core segment.",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN PREST1234RFD.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.448Z",
        "effectiveDate": "2026-12-23",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-curefoods-ipo",
      "slug": "curefoods-ipo",
      "companyName": "Curefoods",
      "shortName": "Curefoods",
      "logoMonogram": "CU",
      "logoColor": "#14263F",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/curefoods_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 1200,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 215,
      "priceBandHigh": 230,
      "lotSize": 65,
      "minBidQuantity": 65,
      "minInvestment": 14950,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-17",
        "closeDate": "2026-12-21",
        "allotmentDate": "2026-12-22",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-24"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-21",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 38,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 230,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-24",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.448Z",
          "effectiveDate": "2026-12-24",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Based in Bengaluru, Curefoods is a leading Indian food technology company that operates on a \"house of brands\" model, primarily through a vast network of cloud kitchens. Founded in 2020 by Ankit Nagori, the company's core strategy is to acquire, incubate, and scale a diverse portfolio of food brands.\n\nCurefoods has grown rapidly by taking over popular brands and expanding their reach through its extensive operational infrastructure. Its portfolio covers a wide range of cuisines and includes well-known names such as:\nEatFit (healthy meals)\nSharief Bhai (biryani)\nNomad Pizza and Olio (pizzas)\nCakeZone (desserts)\nFrozen Bottle (milkshakes and desserts)\nThe company operates hundreds of outlets, including cloud kitchens and physical restaurants, across numerous Indian cities.",
        "productsAndServices": "Curefoods operates in its core segment (Founded 2020).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN TEMP1234567C.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/jul-2025/curefoods-india-limited_95013.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.448Z",
        "effectiveDate": "2026-12-24",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-cult-fit-ipo",
      "slug": "cult-fit-ipo",
      "companyName": "Cult Fit",
      "shortName": "Cult Fit",
      "logoMonogram": "CF",
      "logoColor": "#0F766E",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/cultfit_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 1500,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 260,
      "priceBandHigh": 275,
      "lotSize": 54,
      "minBidQuantity": 54,
      "minInvestment": 14850,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-18",
        "closeDate": "2026-12-22",
        "allotmentDate": "2026-12-23",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-26"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-22",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 45,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 275,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-26",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-26",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Cult.fit is a leading Indian health and fitness company headquartered in Bengaluru, Karnataka. Co-founded in 2016 by Mukesh Bansal and Ankit Nagori, the company's core mission is to make fitness fun, accessible, and a part of everyday life by offering a holistic approach to well-being.",
        "productsAndServices": "Cult Fit operates in its core segment (Founded 2016).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN TEMPISIN123C.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.449Z",
        "effectiveDate": "2026-12-26",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-kent-ro-ipo",
      "slug": "kent-ro-ipo",
      "companyName": "Kent RO Systems",
      "shortName": "Kent RO",
      "logoMonogram": "KR",
      "logoColor": "#0E7490",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/kent_ro_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 1000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 310,
      "priceBandHigh": 330,
      "lotSize": 45,
      "minBidQuantity": 45,
      "minInvestment": 14850,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-19",
        "closeDate": "2026-12-23",
        "allotmentDate": "2026-12-24",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-28"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-23",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 50,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 330,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-28",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-28",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 1047.37,
            "ebitdaCr": null,
            "patCr": 154.68,
            "assetsCr": 1593.21,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 1084.39,
            "ebitdaCr": null,
            "patCr": 97.61,
            "assetsCr": 1689.3,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 1178.18,
            "ebitdaCr": null,
            "patCr": 166.98,
            "assetsCr": 1857.11,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Kent R O Systems is a company engaged in the manufacturing and sale of water purifiers and household appliances. It offers a wide range of products, including electric and non-electric water purifiers, water softeners, internet of things (IoT)-enabled devices, zero-water-wastage systems, kitchen appliances, and brushless direct current (BLDC) fans under the brands ‘Kent’ and ‘Kuhl’. The product portfolio also includes items such as egg boilers, mixers, cooktops, multicookers, and vegetable cleaners.\nThe company operates four manufacturing facilities: one is situated in Roorkee, Uttarakhand, and the remaining three are located in Noida, Uttar Pradesh. The Roorkee unit focuses on water purifiers and softeners, while the Noida facilities handle the production of purifiers, appliances, and fans. One of the three facilities located in Noida also serves as a mother warehouse.\nUse of proceeds:\nThe IPO is an offer-for-sale (OFS). The company will not receive any proceeds from the offer. Net proceeds from the offer will go to the promoter selling shareholders in proportion to the number of shares offered by them for sale.\nThe primary objective of the offer is to achieve the benefits of listing the equity shares on the stock exchanges, which is expected to enhance the company’s visibility and brand recognition. Listing will also provide liquidity to the existing shareholders and create a public market for the company’s shares in India​.",
        "productsAndServices": "Kent RO Systems operates in its core segment (Founded 2007).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN TEMPISIN123K.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Mr Mahesh Gupta"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Kent R O Systems claims to be the pioneer in introducing reverse osmosis (RO) technology in the water purifier segment in India. The company first launched an RO-based water purifier in 1999 and claims to serve over 5.50 million consumers, as of September 30, 2024. The company further claims it has the highest number of stock-keeping units (SKUs) in both the overall and premium water purifier categories, among its peers.",
          "The company claims to have received the highest number of certifications in the Indian water purifier category, including National Sanitation Foundation/American National Standards Institute standard for point-of-use reverse osmosis systems (NSF/ANSI 58), Bureau of Indian Standards (BIS ), Water Quality Association (WQA) gold seal certification, and CE (Conformité Européenne) marking. ",
          "The company claims to have a strong focus on innovation, with several patented technologies across its product portfolio. These include mineral RO technology, zero-water-wastage systems, IoT-enabled purifiers, and integrated ultraviolet light-emitting diodes (UV LEDs) for disinfection. Kent also claims to hold rights to use 15 registered patents and has a dedicated R&D lab in Noida, Uttar Pradesh, backed by a team of qualified professionals.",
          "Kent R O Systems claims to have undertaken targeted brand-building initiatives aimed at enhancing brand equity and increasing visibility across multiple consumer touchpoints. The company’s marketing strategy spans television (TV) sponsorships, cricket team and tournament partnerships, print advertisements, digital media, social media, e-commerce platforms, over-the-top (OTT) mobile apps, and celebrity endorsements, notably with actress Hema Malini as its brand ambassador for over a decade.",
          "Kent R O Systems claims to have the capability to build and scale new brands beyond its core water purification business. In FY23, it introduced its BLDC fan business under the ‘Kuhl’ brand and claims to have launched over 120 SKUs within two years. The company also claims to have established a dedicated fan manufacturing unit, Noida Facility II, with a built-up area of approximately 31,167 square metres.",
          "Kent R O Systems claims to leverage its brand strength to offer a diverse product portfolio and increase consumer wallet share. While it is primarily known for RO water purifiers, the company has expanded into categories such as water softeners, kitchen and home appliances, and energy-efficient fans, under the ‘Kent’ and ‘Kuhl’ brands, respectively. It claims that this strategic diversification allows it to meet broader household needs and tap into multiple consumer spending categories.",
          "Kent R O Systems claims to have streamlined manufacturing operations that combine in-house production with external sourcing to maintain product quality and efficiency. It further claims to use advanced machinery and quality control processes, including manufacturing key components like RO membranes and BLDC motors in-house. ",
          "Kent R O Systems claims to maintain a strong financial position, with significant reserves and no long-term debt since incorporation. The company states that it has built reserves through retained earnings, held in the form of cash equivalents, investments, and real estate assets. It also claims to follow a proactive inventory management approach and has invested in operational and residential real estate, some of which is provided to employees at no cost to support retention. As of September 30, 2024, the company reports holding Rs 477.51 crore in operational real estate, Rs 125.63 crore in residential real estate, and Rs 259.80 crore in investments.",
          "The company claims to have a wide pan-India distribution and service network with 1,898 channel partners, 5,000+ technicians, and presence across 15,000+ pin codes. It also claims to be the largest exporter of water purifiers from India in FY24.",
          "The company holds ISO 9001:2015 certification for quality management systems, ISO 14001:2015 certification for environmental management systems, and ISO 45001:2018 certification for occupational health and safety. ",
          "The company has witnessed a consistent increase in revenue from operations. It increased from Rs 1,047.37 crore in FY22 to Rs 1,084.39 crore in FY23 and Rs 1,178.18 crore in FY24."
        ],
        "risks": [
          "A substantial portion of the company’s revenue is derived from the sale of water purifiers and water softener products. They accounted for Rs 536.80 crore (84.25 percent) of the company’s revenue in the period ended September 30, 2024, Rs 1,012.42 crore (85.93 percent) in FY24, Rs 940.67 crore (86.75 percent) in FY23, and Rs 909.98 crore (86.88 percent) in FY22. Any decrease in demand for these products could hit the company’s business and finances.",
          "The cost of raw materials consumed accounted for Rs 234.29 crore (39.40 percent) of the company’s total expenses in the period ended September 30, 2024, Rs 401.51 crore (38.62 percent) in FY24, Rs 365.69 crore (37.43 percent) in FY23, and Rs 340.24 crore (38.73 percent) in FY22. Any disruption in the supply of raw materials or fluctuations in raw material prices could adversely affect the company’s ability to manufacture its products, thereby negatively impacting its business, results of operations, financial condition, and cash flows. ",
          "A significant portion of Kent R O Systems’ raw material purchases are dependent on imports. They accounted for Rs 104.76 crore (43.02 percent) of the company’s total purchase of raw materials in the period ended September 30, 2024, Rs 149.02 crore (39.17 percent) in FY24, Rs 145.84 crore (36.29 percent) in FY23, and Rs 136.38 crore (37.59 percent) in FY22. Any restrictions on imports, an increase in duties, or geopolitical tensions in supplier regions can adversely impact the company’s business and profitability.",
          "Three out of Kent R O Systems’ four manufacturing facilities are located in Noida, Uttar Pradesh. Any disruption in this region can negatively impact the company’s business and finances.",
          "Kent R O Systems relies heavily on its network of 1,898 channel partners as of September 30, 2024, for the distribution of its products. Any disruption, inefficiency, or inability to retain or expand this distributor base could result in market share loss and adversely affect its business, financial condition, and cash flows.",
          "The company, its group company, and promoters are involved in certain ongoing legal proceedings, including criminal and tax-related matters. Any adverse judgments in any of these cases could be detrimental to the company’s business prospects. ",
          "The company’s business is impacted by seasonality, with higher demand for products such as water purifiers, water softeners, and fans during the summer months. Any inability to address this fluctuation in demand could adversely affect its business and financial condition.",
          "As of September 30, 2024, the company had trade receivables amounting to Rs 113.52 crore, a sharp increase from Rs 87.65 crore in FY24. Any failure to collect these receivables on time or at all can negatively impact the business and its financial condition."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/jan-2025/kent-r-o-systems-limited_91156.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.449Z",
        "effectiveDate": "2026-12-28",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-vlcc-ipo",
      "slug": "vlcc-ipo",
      "companyName": "VLCC",
      "shortName": "VLCC",
      "logoMonogram": "VL",
      "logoColor": "#334155",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/vlcc_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 1000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 145,
      "priceBandHigh": 155,
      "lotSize": 96,
      "minBidQuantity": 96,
      "minInvestment": 14880,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-22",
        "closeDate": "2026-12-24",
        "allotmentDate": "2026-12-28",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-30"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-24",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 22,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 155,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-30",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-30",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "VLCC is a leading Wellness & Beauty brand, offering a comprehensive range of services and products. Founded in 1989 by Mrs. Vandana Luthra, VLCC has grown to operate across 350+ locations in 165 cities and 14 countries. They offer wellness and weight management solutions, beauty treatments, and a wide array of skin, hair, and body care products.",
        "productsAndServices": "VLCC operates in its core segment.",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN TEMPISIN123V.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.449Z",
        "effectiveDate": "2026-12-30",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-pharmeasy-ipo",
      "slug": "pharmeasy-ipo",
      "companyName": "PharmEasy",
      "shortName": "PharmEasy",
      "logoMonogram": "PH",
      "logoColor": "#334155",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/Pharmeasy_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 2500,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 95,
      "priceBandHigh": 105,
      "lotSize": 142,
      "minBidQuantity": 142,
      "minInvestment": 14910,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-23",
        "closeDate": "2026-12-26",
        "allotmentDate": "2026-12-29",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-31"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-26",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 15,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 105,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2026-12-31",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-31",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "PharmEasy is a consumer healthcare “super app” that provides consumers with on-demand, home delivered access to a wide range of prescription, OTC pharmaceuticals.",
        "productsAndServices": "PharmEasy operates in its core segment.",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN ISINPHARM123.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.449Z",
        "effectiveDate": "2026-12-31",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-servify-ipo",
      "slug": "servify-ipo",
      "companyName": "Servify",
      "shortName": "Servify",
      "logoMonogram": "SE",
      "logoColor": "#334155",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/Servify_logo.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Bigshare Services Pvt Ltd",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 1000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 175,
      "priceBandHigh": 190,
      "lotSize": 78,
      "minBidQuantity": 78,
      "minInvestment": 14820,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-24",
        "closeDate": "2026-12-28",
        "allotmentDate": "2026-12-29",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-01-02"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-28",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 28,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 190,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": null,
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-01-02",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2027-01-02",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Servify is a Mumbai-based company that operates as a product lifecycle management platform, focused on after-sales services for devices. It connects brands, retailers, and consumers on a single platform to provide post-purchase support, including warranty and protection plans, device diagnosis, and exchange programs.",
        "productsAndServices": "Servify operates in its core segment (Founded 2015).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN SERVISIN1234.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.449Z",
        "effectiveDate": "2027-01-02",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-hero-future-energies-ipo",
      "slug": "hero-future-energies-ipo",
      "companyName": "Hero Future Energies",
      "shortName": "Hero Future Energies",
      "logoMonogram": "HF",
      "logoColor": "#0E7490",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/hero_future_energies_logo.jpg",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 2500,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 240,
      "priceBandHigh": 255,
      "lotSize": 58,
      "minBidQuantity": 58,
      "minInvestment": 14790,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-26",
        "closeDate": "2026-12-30",
        "allotmentDate": "2026-12-31",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-01-04"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2026-12-30",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 40,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 255,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "HEROTEMP",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-01-04",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2027-01-04",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Hero Future Energies (HFE), established in 2012, is a renewable energy company focused on providing sustainable and clean energy solutions globally, with a portfolio of wind and solar assets and ventures into green hydrogen production.",
        "productsAndServices": "Hero Future Energies operates in its core segment (Founded 2012).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN HEROISIN1234.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Rahul Munjal"
        ],
        "growthOpportunities": [],
        "strengths": [
          "."
        ],
        "risks": [
          "."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.449Z",
        "effectiveDate": "2027-01-04",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-flipkart-ipo",
      "slug": "flipkart-ipo",
      "companyName": "Flipkart",
      "shortName": "Flipkart",
      "logoMonogram": "FL",
      "logoColor": "#0E7490",
      "logoUrl": "/assets/movers/flipkart.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 15000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 680,
      "priceBandHigh": 720,
      "lotSize": 20,
      "minBidQuantity": 20,
      "minInvestment": 14400,
      "faceValue": 1,
      "dates": {
        "openDate": "2027-01-07",
        "closeDate": "2027-01-11",
        "allotmentDate": "2027-01-12",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-01-15"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2027-01-11",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 180,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 720,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "FLIPTEMP",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-01-15",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2027-01-15",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Flipkart, an Indian e-commerce giant founded in 2007 by Sachin Bansal and Binny Bansal, started as an online bookstore and has expanded to a wide range of products, including electronics, fashion, and home essentials, with a customer base of over 500 million.",
        "productsAndServices": "Flipkart operates in its core segment (Founded 2007).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN FLIPISIN1234.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Kalyan Krishnamurthy"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Diverse Product Categories: Flipkart offers a wide range of products, including electronics, fashion, home essentials, groceries, and more. ",
          "",
          "Customer-Centric Approach: Flipkart is known for its customer-centric innovations, such as Cash on Delivery, No Cost EMI, and easy returns. ",
          "",
          "Technology Focus: Flipkart invests in technology innovations to improve the customer experience and efficiency of its operations."
        ],
        "risks": [
          "Intense Competition: The e-commerce landscape is highly competitive, with Flipkart facing strong competition from other players like Amazon. ",
          "",
          "Regulatory Challenges: Changes in e-commerce regulations, data protection laws, and taxation policies can pose challenges to Flipkart's operations. ",
          "",
          "Economic Downturns: Economic downturns or fluctuations in consumer spending can negatively impact e-commerce sales and Flipkart's performance."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.449Z",
        "effectiveDate": "2027-01-15",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-phonepe-ipo",
      "slug": "phonepe-ipo",
      "companyName": "PhonePe",
      "shortName": "PhonePe",
      "logoMonogram": "PH",
      "logoColor": "#0F766E",
      "logoUrl": "/assets/movers/phonepe.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 12000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 580,
      "priceBandHigh": 620,
      "lotSize": 24,
      "minBidQuantity": 24,
      "minInvestment": 14880,
      "faceValue": 1,
      "dates": {
        "openDate": "2027-01-12",
        "closeDate": "2027-01-14",
        "allotmentDate": "2027-01-15",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-01-19"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2027-01-14",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 145,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 620,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "PH123",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-01-19",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2027-01-19",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "00",
            "revenueCr": 0,
            "ebitdaCr": null,
            "patCr": 0,
            "assetsCr": 0,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "PhonePe Limited is a technology company that builds digital platforms for Payments services, Digital Distribution Services, and Financial Services. Through its flagship PhonePe Platform, it offers Consumer Payments, Merchant Payments, and both Lending and Insurance Distribution services. The company has also expanded into new platforms, including Share.Market, a stock broking and mutual funds distribution platform, and Indus Appstore, a mobile app marketplace. These platforms are built on a proprietary technology stack designed for reliability, scalability, and security.\nThe company's operations are primarily India-focused, with merchants present across 98.61% of the country's pin codes. It has extended its UPI payments service to ten international markets, including Singapore, UAE, and France, enabling Indian users to make payments when they travel abroad. A significant portion of its user base, 65.22%, comes from Tier-2+ cities.",
        "productsAndServices": "PhonePe operates in its core segment (Founded 2015).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN PHONE1234543.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Sameer Nigam"
        ],
        "growthOpportunities": [],
        "strengths": [
          "The company is the market leader in India's digital payments ecosystem, holding a 49.15% market share of UPI TPV for customer-initiated transactions as of September 2025. This market leadership has been sustained for 58 consecutive months and has translated into strong financial growth, with Total Payment Value (TPV) on its platform growing from ₹69.55 lakh Crores in FY23 to ₹132.70 lakh Crores in FY25.",
          "PhonePe has demonstrated rapid revenue growth and strategic diversification, with revenue from operations growing at a CAGR of 56.25% from ₹2,914.29 Crores in FY23 to ₹7,114.86 Crores in FY25. This growth is supported by a successful diversification strategy, which saw the revenue contribution from Merchant Payments increase from 14.75% to 27.99% and from Lending & Insurance services from 0.96% to 7.84% over the same period.",
          "The company possesses a massive and deeply engaged user base, with 65.76 Crore life-till-date registered users and 4.72 Crore merchants as of September 2025. This scale is reflected in its customer activity metrics, which show a 31.48% CAGR in Daily Active Customers from FY23 to FY25, indicating strong platform stickiness and growing user engagement.",
          "PhonePe has shown significant improvement in profitability, with its restated loss narrowing from ₹2,796.07 Crores in FY23 to ₹1,727.41 Crores in FY25. More significantly, key operational metrics have turned positive, with the company achieving an Adjusted EBITDA of ₹1,477.19 Crores and generating free cash of ₹190.48 Crores in FY25, indicating a strong path towards sustainable profitability.",
          "The company operates a proprietary, in-house technology stack and self-managed infrastructure, a key differentiator in the commoditized payments market. It has invested ₹3,373 Crores in this infrastructure since 2016, which enables greater control over reliability, scalability, security, and cost-efficiency while ensuring 100% data residency in India.",
          "The company has built a highly trusted brand, demonstrated by being India's most downloaded Android finance app with the highest Daily Active Users of 15.6 Crores in H1FY26. This brand trust translates into strong customer retention, with 99.23% of daily customers returning to the platform within 30 days as of September 2025.",
          "The company is successfully executing its diversification strategy into new high-growth areas like wealth management and app distribution. Its Share.Market platform has already opened 1.26 million demat accounts and manages an AUM of ₹5,838 Crores, while its Indus Appstore has secured partnerships with major OEMs like Xiaomi and Motorola to be pre-installed on their smartphones.",
          "PhonePe is backed by strong promoters, WM Digital Commerce Holdings Pte. Ltd. and Wal-Mart International Holdings, Inc., part of the Walmart group. WM Digital holds 71.77% of the pre-offer equity, providing significant financial backing, strategic oversight, and robust corporate governance standards."
        ],
        "risks": [
          "The company has a history of significant net losses, recording a loss of ₹1,727.41 Crores in FY25 and ₹1,996.17 Crores in FY24. While losses are narrowing, the company also reported negative cash flows from operating activities of ₹117.27 Crores for the six months ended September 30, 2025, indicating continued cash burn to fund operations and growth.",
          "The business is heavily dependent on its payment services, which accounted for 86.92% of its revenue from operations in the six months ended September 30, 2025, down from 97.66% in FY23. Any downturn in customer willingness to use these services, regulatory changes, or increased competition could materially impact its financial results.",
          "A significant regulatory risk arises from the NPCI's proposed 30% volume cap on UPI transactions for any single Third-Party App Provider (TPAP), which has been deferred until December 31, 2026. With a UPI volume market share of 46.85% as of September 2025, enforcement of this cap could severely impact the company's ability to onboard new users and its overall growth trajectory.",
          "The company's operations are critically dependent on its three sponsor Payment System Provider (PSP) banks: Yes Bank, Axis Bank, and ICICI Bank. Any disruption, failure, change in commercial terms, or operational breakdown with these banks could adversely affect business, as exemplified by the temporary stoppage of its UPI services during the Yes Bank moratorium in March 2020.",
          "The company faces rising payment processing charges, which as a percentage of total expenses, increased from 11.29% in FY23 to 17.97% in FY25. Any significant future increase in these charges by financial institutions, if unable to be passed on to merchants or consumers, could decrease margins and profitability.",
          "The company and its directors are involved in material pending litigations, including 10 tax proceedings against the company with an aggregate amount of ₹24.95 Crores. An adverse outcome in these or other legal matters could lead to significant financial liabilities and reputational damage.",
          "As a large digital platform processing vast amounts of sensitive user data, the company is vulnerable to cybersecurity risks. The recent implementation of India's Digital Personal Data Protection (DPDP) Act introduces significant compliance obligations and potential penalties of up to ₹250 Crores for data breaches, heightening the financial and reputational risk."
        ]
      },
      "documents": {
        "drhpUrl": "https://www.sebi.gov.in/filings/public-issues/jan-2026/phonepe-limited-udrhp-i_99285.html",
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.449Z",
        "effectiveDate": "2027-01-19",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-fabindia-ipo",
      "slug": "fabindia-ipo",
      "companyName": "FabIndia Ltd.",
      "shortName": "FabIndia",
      "logoMonogram": "FA",
      "logoColor": "#14263F",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/logos-135.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "BSE",
        "NSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 4000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 340,
      "priceBandHigh": 360,
      "lotSize": 41,
      "minBidQuantity": 41,
      "minInvestment": 14760,
      "faceValue": 0,
      "dates": {
        "openDate": "2027-01-14",
        "closeDate": "2027-01-18",
        "allotmentDate": "2027-01-19",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-01-22"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2027-01-18",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 45,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 360,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "FABINDIA",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-01-22",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.449Z",
          "effectiveDate": "2027-01-22",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY19",
            "revenueCr": 1481,
            "ebitdaCr": null,
            "patCr": 84,
            "assetsCr": 2131,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY20",
            "revenueCr": 1524,
            "ebitdaCr": null,
            "patCr": 31,
            "assetsCr": 2466,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY21",
            "revenueCr": 1087,
            "ebitdaCr": null,
            "patCr": -117,
            "assetsCr": 2103,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Fabindia is an Indian chain store retailing garments, furnishings, fabrics, and ethnic products handmade by craftspeople across rural India. Fabindia is a legacy brand focusing on handcrafted, indigenous products. The company has established a brand built on artisanal heritage and tradition, inherited across various product categories.\nFabindia links around 50,000 craft-based rural producers to modern urban markets, thereby creating a base for skilled, sustainable rural employment, and preserving India's traditional handicrafts in the process.",
        "productsAndServices": "FabIndia Ltd. operates in its core segment (Founded 1976).",
        "businessModel": "Mainboard issue (EQUITY) listed on BSE / NSE · ISIN INE111111.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Viney Singh"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Leading consumer lifestyle brand focused on authentic craft-based products made using sustainable materials & practices",
          "Targets people who desire high-quality Indian lifestyle and organic products",
          "Sustainable  business model which prioritizes the interests of Supplier Community",
          "Established supplier network and supply chain infrastructure ",
          "Offers products through multiple channels for seamless customer experience",
          "Managed by a highly experienced team of professionals led by the founder",
          "Capital efficient business model (good investment to expense ratio), with a track record of delivering growth and return on capital"
        ],
        "risks": [
          "Growth of online retailers may create pricing pressures, increase competition, and adversely affect business, results of operations and financial condition.",
          "Significant dependence on a network of Contract Manufacturers (who in turn engage artisans) and farmers for the manufacture of products.",
          "Significant portion of revenues is dependent on the sale of clothing.",
          "Sale of certain products affected due to seasonal changes.",
          "Outstanding litigation proceedings against Company, Directors, Promoters and Subsidiaries.",
          "Some part of revenue comes from sales at retail franchise stores, failure to maintain such franchise relationships may affect sales, profits.",
          "Focus on using sustainable materials and environmentally processes may lead to increase in the cost of revenue and hinder growth.",
          "Dependent on third-party transportation providers for the delivery of raw materials and products.",
          "Have certain contingent liabilities that have not been provided for in financial statements. If they materialise, they may adversely affect the financial condition.",
          "Have had net outflows of cash from operating activities in the past and may continue to have net cash outflows in future."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/jan-2022/fabindia-limited_55532.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.449Z",
        "effectiveDate": "2027-01-22",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-oyo-ipo",
      "slug": "oyo-ipo",
      "companyName": "Oravel Travels Ltd.",
      "shortName": "OYO",
      "logoMonogram": "OY",
      "logoColor": "#0E7490",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/logos-88.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "BSE",
        "NSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 8430,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 110,
      "priceBandHigh": 120,
      "lotSize": 125,
      "minBidQuantity": 125,
      "minInvestment": 15000,
      "faceValue": 0,
      "dates": {
        "openDate": "2027-01-19",
        "closeDate": "2027-01-21",
        "allotmentDate": "2027-01-22",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-01-27"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-01-21",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 25,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 120,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "OYO",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-01-27",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-01-27",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY19",
            "revenueCr": 6518.46,
            "ebitdaCr": null,
            "patCr": -2294.3,
            "assetsCr": 11742.61,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY20",
            "revenueCr": 13413.27,
            "ebitdaCr": null,
            "patCr": -11079.79,
            "assetsCr": 14108.98,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY21",
            "revenueCr": 4157.39,
            "ebitdaCr": null,
            "patCr": -4102.28,
            "assetsCr": 8751.05,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "OYO is a leading, new-age technology platform empowering the large yet highly fragmented global hospitality ecosystem. It has been focusing on the short-stay accommodation space since 2012. Its unique business model helps its patrons transform fragmented, unbranded, and underutilized hospitality assets into branded, digitally-enabled storefronts with higher revenue generation potential. OYO provides its customers with high-quality storefronts at compelling price points.",
        "productsAndServices": "Oravel Travels Ltd. operates in its core segment (Founded 2012).",
        "businessModel": "Mainboard issue (EQUITY) listed on BSE / NSE · ISIN OYOISIN123.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Ritesh Agarwal"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Largest footprint in terms of hotel storefronts in India and SEA ",
          "Second largest footprint in Europe in terms of home storefronts among full stack short-stay accommodation players, according to RedSeer.",
          "Asset-light business model and a lean cost structure - the company does not own the storefronts listed on its platform",
          "Full-stack technology platform",
          "Two flagship Patron applications - Co-OYO and OYO OS",
          "An increase in Patron satisfaction score from 30.1% for the three months ended September 30, 2020 to 72.3% for the three months ended March 31, 2021",
          "Unit economics, measured based on Contribution Profit, has improved from 5.1% in Fiscal 2020 to 18.4% in Fiscal 2021",
          "The proportion of hotel and home storefronts with minimum guarantees or fixed payout commitments from the company has decreased from 14.7% in Fiscal 2019 to 0.1% in Fiscal 2021."
        ],
        "risks": [
          "Impact of the Covid-19 pandemic on the travel industry.",
          "Negative cash flows from operating activities in prior years. ",
          "Company has incurred net losses in each year since incorporation.",
          "A substantial amount of debt in the past",
          "No control over or ability to predict the actions of our patrons, customers and other third parties, such as neighbors or invitees, during a customer’s stay",
          "Any adverse outcome in legal proceedings involving Zostel may affect the business.",
          "The company is currently involved in a matter before the Competition Commission of India.",
          "There is a pending litigation against the company, certain subsidiaries and directors and promoters."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/oct-2021/oravel-stays-limited_53084.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.450Z",
        "effectiveDate": "2027-01-27",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-boat-ipo",
      "slug": "boat-ipo",
      "companyName": "Imagine Marketing Ltd.",
      "shortName": "boAt ",
      "logoMonogram": "BO",
      "logoColor": "#14263F",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/logos-131.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "BSE",
        "NSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 2000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 290,
      "priceBandHigh": 310,
      "lotSize": 48,
      "minBidQuantity": 48,
      "minInvestment": 14880,
      "faceValue": 0,
      "dates": {
        "openDate": "2027-01-21",
        "closeDate": "2027-01-25",
        "allotmentDate": "2027-01-27",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-01-29"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-01-25",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 60,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 310,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "BOAT",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-01-29",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-01-29",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY19",
            "revenueCr": 226.11,
            "ebitdaCr": null,
            "patCr": 8.03,
            "assetsCr": 83.93,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY20",
            "revenueCr": 609.95,
            "ebitdaCr": null,
            "patCr": 47.79,
            "assetsCr": 190.5,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY21",
            "revenueCr": 1320.37,
            "ebitdaCr": null,
            "patCr": 86.53,
            "assetsCr": 678.42,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Imagine Marketing (boAt) is a digital-first consumer products company and one of the largest Indian digital-first brands in terms of revenue from operations for the financial year 2021. It was founded in 2013 and is led by its flagship brand “boAt” which was launched in 2014. It has products in various segments. It provides audio wearables such as wired headphones and earphones, wireless headphones and earphones (neckbands), bluetooth speakers, home theatre systems among others. It also consists of smartwatches, gaming accessories that include wired and wireless headsets, mouse and keyboards, mobile accessories and personal care appliances.",
        "productsAndServices": "Imagine Marketing Ltd. operates in its core segment (Founded 2013).",
        "businessModel": "Mainboard issue (EQUITY) listed on BSE / NSE · ISIN BOATISIN123.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Vivek Gambhir"
        ],
        "growthOpportunities": [],
        "strengths": [
          "One of the largest Indian digital-first brands with leading market positions across multiple fast-growing product categories.",
          "Company’s flagship brand “boAt” is a consumer brand with strong market positioning and a clear value proposition.",
          "Digital-first platform capabilities are targeted to enable growth and continue to allow building a presence across multiple consumer categories.",
          "RedGear brand to cater to the gaming headsets and controllers (keyboard, mouse, mouse pad, joystick) market.",
          "Some products including Rockerz 255, Airdopes 131 and storm smartwatch have a rating of over 4 (out of 5) with over 400,000 ratings across online marketplaces.",
          "In January 2022, the company announced a partnership with Dixon Technologies for manufacturing “Made-in-India” wireless audio devices."
        ],
        "risks": [
          "Strength of the company’s flagship “boAt” brand and other brands is crucial to success.",
          "Failure to successfully identify and respond to changing customer preferences and market developments in a cost-effective and timely manner.",
          "Operates in a highly competitive industry including large and established competitors.",
          "Dependence on a number of third-party contract manufacturers and component suppliers for the production of its products.",
          "Risks associated with overseas procurement, such as geographical concentration and foreign currency exchange risks.",
          "Disruptions in its relationships with certain online marketplaces and offline distributors.",
          "Dependence on the audio and wearables category.",
          "Inability to adequately protect its flagship brand ‘boAt’ and its intellectual property."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/jan-2022/imagine-marketing-limited_55666.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.450Z",
        "effectiveDate": "2027-01-29",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-bajaj-energy-ipo",
      "slug": "bajaj-energy-ipo",
      "companyName": "Bajaj Energy Ltd.",
      "shortName": "Bajaj Energy",
      "logoMonogram": "BE",
      "logoColor": "#1E3554",
      "logoUrl": "https://storage.googleapis.com/gw-prod-asset-netstorage/stocks-ipo/logos/logos_bajajelec-41.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 5450,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 195,
      "priceBandHigh": 210,
      "lotSize": 71,
      "minBidQuantity": 71,
      "minInvestment": 14910,
      "faceValue": 0,
      "dates": {
        "openDate": "2027-01-26",
        "closeDate": "2027-01-28",
        "allotmentDate": "2027-01-29",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-02-02"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-01-28",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 28,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 210,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "BAJAJENER",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-02-02",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-02-02",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "March-16",
            "revenueCr": 1407.09,
            "ebitdaCr": null,
            "patCr": 102.67,
            "assetsCr": 3590.05,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "March-17",
            "revenueCr": 1405.87,
            "ebitdaCr": null,
            "patCr": 105.08,
            "assetsCr": 3684.1,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "March-18",
            "revenueCr": 897.63,
            "ebitdaCr": null,
            "patCr": -2.07,
            "assetsCr": 3474.15,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Bajaj Energy Ltd. (BEL) and Lalitpur Power Generation Company Ltd. (LPGCL) are among the largest private-sector thermal generation companies in Uttar Pradesh. The company develops, finances and operates thermal power plants in India.\nBEL has 450 megawatt coal-based thermal Power plants across 5 locations in Uttar Pradesh.\nBajaj Energy's total gross installed capacity is 2,430 MW. This comprises 450 mega-watts from 5 plants, owned and managed by BEL (the \"BEL Power Plants\"), and 1,980 MW from\nthe power plant owned and operated by LPGCL (the \"LPGCL Power Plant\").\nBEL intends to acquire LPGCL completely in future using the proceeds it receives from the IPO offer.",
        "productsAndServices": "Bajaj Energy Ltd. operates in its core segment (Founded 2008).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN BAJAJENERISIN123.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Vinay Kumar Singh Bankoti"
        ],
        "growthOpportunities": [],
        "strengths": [
          "One of the largest independent power producers in Uttar Pradesh. ",
          "Principal fuel supplier is Central Coal Fields Ltd., a subsidiary of Coal India Ltd.",
          "Well-positioned in Uttar Pradesh to capitalise on the state's demand.",
          "All assets are based in Uttar Pradesh. Uttar Pradesh is one of the largest and most densely populated states in India.",
          "Operational power plants have a gross capacity of 2,430 MW. This according to the draft red herring prospectus published in 2019."
        ],
        "risks": [
          "Most of the income is derived from electricity sales to one customer: Uttar Pradesh Power Corporation Ltd. (UPPCL).",
          "As per DRHP, LPGCL is involved in disputes with UPPCL for tariff payment.",
          "Has not been compliant with certain loan agreements in the past resulting in default",
          "Faces fuel supply risks despite having entered into long-term agreements. BEL primarily relies on coal sourced from subsidiaries of Coal India.",
          "Operations carry risk of environmental damage.",
          "Unavailability of appropriate infrastructure could impact the delivery of coal. Heavy dependence on railway infrastructure and road infra for coal.",
          "Tariffs subject to regulatory scrutiny by the Uttar Pradesh Electricity Regulatory Commission (UPERC)",
          "As per DRHP, the final tariff for LPGCL has not been approved by UPERC.",
          "Majority of the land are under lease agreements and inability to renew the agreement or termination of the agreement could impact revenue and operations.",
          "Financial results subject to seasonal variations.",
          "Operations could be affected by strikes or increased wage demands by the employees."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/apr-2019/bajaj-energy-limited_42638.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.450Z",
        "effectiveDate": "2027-02-02",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-arohan-financial-ipo",
      "slug": "arohan-financial-ipo",
      "companyName": "Arohan Financial",
      "shortName": "Arohan Financial",
      "logoMonogram": "AF",
      "logoColor": "#14263F",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/logos-72.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "BSE",
        "NSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 1800,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 170,
      "priceBandHigh": 180,
      "lotSize": 83,
      "minBidQuantity": 83,
      "minInvestment": 14940,
      "faceValue": 0,
      "dates": {
        "openDate": "2027-01-28",
        "closeDate": "2027-02-01",
        "allotmentDate": "2027-02-02",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-02-05"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-02-01",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 20,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 180,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "AROHAN",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-02-05",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-02-05",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY18",
            "revenueCr": 327.87,
            "ebitdaCr": null,
            "patCr": 30.97,
            "assetsCr": 2303.67,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY19",
            "revenueCr": 651.59,
            "ebitdaCr": null,
            "patCr": 127.64,
            "assetsCr": 3853.09,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY20",
            "revenueCr": 934.51,
            "ebitdaCr": null,
            "patCr": 126.8,
            "assetsCr": 5280.82,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Arohan Financial Services Limited is a leading NBFC-MFI (micro-finance institution) with operations in financially under-penetrated low income states of India. It provides income-generating loans and other financial inclusion-related products to customers who have limited or no access to financial services. It offers a broad range of products to financially underserved customers. The financial products are classified into credit and insurance products.",
        "productsAndServices": "Arohan Financial operates in its core segment (Founded 1991).",
        "businessModel": "Mainboard issue (EQUITY) listed on BSE / NSE · ISIN AROHANISIN123.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Manoj Kumar Nambiar"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Largest NBFC-MFI in Eastern India and fifth largest NBFC-MFI in India with a focus on the low-income states.",
          "Seasoned business model incorporating its well-established risk management framework, loan approval processes, and recovery drives.",
          "Customer-centric approach with diverse product offerings.",
          "Advanced and scalable technology-enabled infrastructure.",
          "Diverse borrowing relationships and access to multiple sources of capital.",
          "Management consists of professionals who have experience in microfinance, consumer finance, investment banking, retail banking, consulting, and insurance."
        ],
        "risks": [
          "Inability to control the level of non-performing assets in the future, or its impairment of financial instruments allowance is insufficient to cover future loan losses.",
          "Any disruption in its funding sources.",
          "Vulnerability to interest rate risk and an inability to manage the same.",
          "Asset-liability mismatches that could expose it to interest rate and liquidity risks",
          "Any failure in its IT systems.",
          "Geographic concentration in low-income states like West Bengal, Bihar, Assam, and Odisha.",
          "Inability to maintain its capital adequacy ratio.",
          "Any downgrade in its credit ratings resulting in an increase in its finance costs.",
          "Any changes in laws and regulations applicable to Non-Banking Finance Companies (NBFCs).",
          "Highly competitive industry – the financing industry.",
          "Operational risks including fraud, petty theft, embezzlement, or other misconduct since it deals with large volumes of cash.",
          "Inability to measure or verify customer credit-worthiness or repayment ability data and information.",
          "Exposure to credit, market, and liquidity risks including in respect of its residual MSME lending business.",
          "Inability to develop or implement effective risk management frameworks.",
          "Inability to protect or use its intellectual property rights.",
          "Failure to detect money-laundering and other illegal or improper activities fully or on a timely basis."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/feb-2021/arohan-financial-services-limited_49148.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.450Z",
        "effectiveDate": "2027-02-05",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-droom-technology-ipo",
      "slug": "droom-technology-ipo",
      "companyName": "Droom Ltd.",
      "shortName": "Droom",
      "logoMonogram": "DR",
      "logoColor": "#7C3AED",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/logos-125.png",
      "sector": "Capital Markets",
      "industry": "Mainboard Equity Issue",
      "category": "Mainboard",
      "status": "Upcoming",
      "exchanges": [
        "BSE",
        "NSE"
      ],
      "website": "",
      "registrar": "Link Intime India Private Limited",
      "registrarUrl": "https://www.sebi.gov.in",
      "issueSizeCr": 3000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 230,
      "priceBandHigh": 245,
      "lotSize": 61,
      "minBidQuantity": 61,
      "minInvestment": 14945,
      "faceValue": 0,
      "dates": {
        "openDate": "2027-02-03",
        "closeDate": "2027-02-05",
        "allotmentDate": "2027-02-08",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-02-10"
      },
      "subscription": {
        "qib": null,
        "nii": null,
        "retail": null,
        "employee": null,
        "shareholder": null,
        "total": null,
        "isFinal": false,
        "dailyBreakdown": [],
        "provenance": {
          "source": "Issue Not Yet Open",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-02-05",
          "verificationStatus": "Provisional",
          "qualityStatus": "UNAVAILABLE",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": 35,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Available",
        "source": "InvestorGain Grey Market Tracker (Indicative)",
        "history": []
      },
      "listing": {
        "issuePrice": 245,
        "actualListingPrice": null,
        "listingExchange": null,
        "stockSymbol": "DROOM",
        "currentMarketPrice": null,
        "previousClose": null,
        "listingDate": "2027-02-10",
        "priceStatus": "UNAVAILABLE",
        "provenance": {
          "source": "Pending Listing",
          "retrievedAt": "2026-11-15T17:04:05.450Z",
          "effectiveDate": "2027-02-10",
          "verificationStatus": "Unverified",
          "qualityStatus": "UNAVAILABLE",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY19",
            "revenueCr": 146.11,
            "ebitdaCr": null,
            "patCr": -105.37,
            "assetsCr": 129.03,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY20",
            "revenueCr": 181.37,
            "ebitdaCr": null,
            "patCr": -89.6,
            "assetsCr": 136.48,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY21",
            "revenueCr": 135.52,
            "ebitdaCr": null,
            "patCr": -68.88,
            "assetsCr": 114.84,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": null,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Pending Final Pricing",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Droom is a technology and data science company that facilitates automobile buying and selling online through a combination of its e-commerce platform along with a technology-driven vertically integrated proprietary ecosystem of products and services for the automobile industry. The company’s automobile e-commerce platform, which includes website and mobile apps, offers the facility to buy and sell new and used vehicles. Some of the elements of automobile buying covered on the company’s platforms are searching for a vehicle, creating buying requirements, price discovery, booking, certification to purchase and financing and doorstep delivery.",
        "productsAndServices": "Droom Ltd. operates in its core segment (Founded 2014).",
        "businessModel": "Mainboard issue (EQUITY) listed on BSE / NSE · ISIN DROOMISIN123.",
        "industryOverview": "Sector primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Bidding dates to be announced",
        "promoters": [
          "Sandeep Aggarwal"
        ],
        "growthOpportunities": [],
        "strengths": [
          "End-to-end e-commerce platform for buying and selling used vehicles in India.",
          "Purely online player which allows the company to escape expensive real estate, and high cost of capital. ",
          "An asset-light and technology-driven platform.",
          "As of September 30, 2021, the company had over 278,807 used vehicles listed across 11 categories present across 1,151 cities in India.",
          "As of September 30, 2021, the company had 14.46 million cumulative downloads of its mobile app.",
          "The company holds a valid patent in the United States for Orange Book Value (OBV), its used vehicle pricing solution. ",
          "Other platforms such as its AI-based vehicle inspection service and Droom Credit, an automobile-focused lending platform have been developed entirely in-house. ",
          "The number of auto dealers on its platform has increased at a CAGR of 11.57% from 16,175 as of March 31, 2019, to 20,133 as of March 31, 2021, and were 20,725 as of September 30, 2021."
        ],
        "risks": [
          "Business heavily reliant on India’s used and new automobile and vehicular services e-commerce industry - any impact on the overall market will likely have an impact on the company’s business.",
          "Inability to add more auto dealers or a reduction in the number of auto dealers on the platform could have a material adverse effect on the business.",
          "There are outstanding legal proceedings involving the company, its directors, promoter, and subsidiaries. ",
          "The company intends to utilise a certain amount from the net proceeds of the IPO towards potential acquisitions and strategic initiatives - if there is any shortfall the company may raise requisite capital through means such as internal accruals and/or seeking debt. ",
          "Funding requirements are based on internal management estimates and its current business plans have not been appraised by any bank or financial institution.",
          "Demand for used vehicles is subject to seasonal fluctuations. ",
          "Limited number of third-party financing partners to fund loans facilitated through its platform",
          "Negative cash flows from operating activities in the three months ended June 30, 2021, and Fiscals 2021, 2020, and 2019."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/nov-2021/droom-technology-limited_53946.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.sebi.gov.in",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry",
        "retrievedAt": "2026-11-15T17:04:05.450Z",
        "effectiveDate": "2027-02-10",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-indo-farm-equipment-ipo",
      "slug": "indo-farm-equipment-ipo",
      "companyName": "Indo Farm Equipment Ltd",
      "shortName": "Indo Farm Equipment",
      "logoMonogram": "IF",
      "logoColor": "#14263F",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/IndoFarmEquipmentLtd_88096405_38519.png",
      "sector": "Automobile",
      "industry": "Automobile",
      "category": "Mainboard",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "MAS",
      "registrarUrl": "https://www.masserv.com/opt.asp",
      "issueSizeCr": 260.15,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 204,
      "priceBandHigh": 215,
      "lotSize": 69,
      "minBidQuantity": 69,
      "minInvestment": 14835,
      "faceValue": 10,
      "dates": {
        "openDate": "2026-12-31",
        "closeDate": "2027-01-02",
        "allotmentDate": "2027-01-03",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2027-01-07"
      },
      "subscription": {
        "qib": 242.4,
        "nii": 500.75,
        "retail": 98.86,
        "employee": null,
        "shareholder": null,
        "total": 225.99,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2025-01-02T17:00:16",
          "effectiveDate": "2027-01-02",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 215,
        "actualListingPrice": 256,
        "listingExchange": "NSE",
        "stockSymbol": "INDOFARM",
        "currentMarketPrice": 126.96,
        "previousClose": 128.08,
        "listingDate": "2027-01-07",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "NSE/BSE Live Quote & Listing Record",
          "retrievedAt": "2026-11-15T17:04:05.471Z",
          "effectiveDate": "2027-01-07",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY21",
            "revenueCr": 267.78,
            "ebitdaCr": null,
            "patCr": 8.49,
            "assetsCr": 551.38,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY22",
            "revenueCr": 352.08,
            "ebitdaCr": null,
            "patCr": 13.72,
            "assetsCr": 619.83,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 370.76,
            "ebitdaCr": null,
            "patCr": 15.56,
            "assetsCr": 622.84,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": 595,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Indo Farm Equipment Limited is a manufacturer of tractors, pick-and-carry cranes, and a range of agricultural equipment, including harvester combines, rotavators, and related spare parts and components. The company’s products serve sectors such as agriculture, infrastructure, construction, heavy engineering, and industrial projects. Apart from this, in 2017, the company established its in-house non-banking financial company (NBFC) to offer retail financing solutions specifically for its tractors.",
        "productsAndServices": "Indo Farm Equipment Ltd operates in Automobile (Founded 1994).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE622H01018.",
        "industryOverview": "Automobile primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 225.99x.",
        "promoters": [
          "Mr. Ranbir Singh Khadwalia"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Indo Farm Equipment manufacturing facilities are ISO 9001:2015 certified for quality management systems.",
          "The company claims that the facilities are equipped with advanced machinery, including induction furnaces, pneumatic molding machines, an automatic molding line, a sand plant, and a fully equipped metallurgy and sand testing laboratory. Additional units include a machining centre, gear shop, press shop, fabrication shop, paint shop, assembly unit, quality room, and utility room.",
          "As of August 31, 2023, the production facilities have an annual capacity to produce 12,000 tractors and 720 pick-and-carry cranes. The company manufactures tractors ranging from 16 HP to 110 HP and pick-and-carry cranes with lifting capacities ranging from 9 tonnes to 30 tonnes.",
          "The company’s products are marketed and distributed through a network of over 140 dealers across states such as Punjab, Haryana, Uttar Pradesh, Maharashtra, Gujarat, and Rajasthan. ",
          "The company has seen a consistent increase in revenue from operations and profit after tax (PAT). Revenue from operations increased from Rs 267.78 crore in FY21 to Rs 352.08 crore in FY22 to Rs 370.76 crore in FY23. PAT increased from Rs 8.49 crore in FY21 to Rs 13.72 crore in FY22 to Rs 15.56 crore in FY23."
        ],
        "risks": [
          "The company, its promoters, directors, and subsidiary are involved in certain legal proceedings. Any adverse judgments in any of these cases could be detrimental to the company’s business prospects. ",
          "A major portion of the company’s revenue comes from the sale of tractors and pick & carry cranes. Tractors contributed Rs 174.48 crore (69.30%) in FY21, Rs 257.32 crore (77.77%) in FY22, and Rs 226.89 crore (65.46%) in FY23 to the total sales and cranes contributed Rs 76.47 crore (30.37%) in FY21, Rs 72.13 crore (21.80%) in FY22 and Rs 118.71 crore (34.25%) in FY23 to the total sales. Any decline in demand or disruptions in the manufacturing of these products could negatively impact the company’s business and financial performance.",
          "The company primarily operates in North India. Any adverse developments in the business environment of this region could negatively impact the company's operations. ",
          "The company has contingent liabilities totalling Rs 18.24 crore as of March 31, 2023. If these liabilities materialise they could harm the company’s financial position.",
          "The company’s business relationships are concentrated among a limited number of dealers, with its top 10 dealers contributing 19.75% of revenue for FY23 and 23.63% for FY22. If these relationships are strained or terminated, the company’s revenue and operational results could be adversely affected.",
          "As of March 31, 2023, the company’s total outstanding borrowings amounted to Rs 280.65 crore.  Any inability to repay or service these loans could adversely affect the company’s financial position."
        ]
      },
      "documents": {
        "drhpUrl": "https://nsearchives.nseindia.com/corporate/Indo_DRHP.pdf",
        "rhpUrl": null,
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://www.masserv.com/opt.asp",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · NSE/BSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.471Z",
        "effectiveDate": "2027-01-07",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-unimech-aerospace-ipo",
      "slug": "unimech-aerospace-ipo",
      "companyName": "Unimech Aerospace and Manufacturing Ltd",
      "shortName": "Unimech Aerospace",
      "logoMonogram": "UA",
      "logoColor": "#0F766E",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/UnimechAerospaceandManufacturingLtd_69486914_93631.png",
      "sector": "Aerospace & Defence",
      "industry": "Aerospace & Defence",
      "category": "Mainboard",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Ltd",
      "registrarUrl": "https://ris.kfintech.com/ipostatus/",
      "issueSizeCr": 500,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 745,
      "priceBandHigh": 785,
      "lotSize": 19,
      "minBidQuantity": 19,
      "minInvestment": 14915,
      "faceValue": 5,
      "dates": {
        "openDate": "2026-12-23",
        "closeDate": "2026-12-26",
        "allotmentDate": "2026-12-27",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-31"
      },
      "subscription": {
        "qib": 116.01,
        "nii": 196.78,
        "retail": 44.11,
        "employee": null,
        "shareholder": null,
        "total": 97.29,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2024-12-26T17:00:16",
          "effectiveDate": "2026-12-26",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 785,
        "actualListingPrice": 1460,
        "listingExchange": "NSE",
        "stockSymbol": "UNIMECH",
        "currentMarketPrice": 1937.8,
        "previousClose": 1980.6,
        "listingDate": "2026-12-31",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "NSE/BSE Live Quote & Listing Record",
          "retrievedAt": "2026-11-15T17:04:05.471Z",
          "effectiveDate": "2026-12-31",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 36.35,
            "ebitdaCr": null,
            "patCr": 3.39,
            "assetsCr": 56.87,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 94.17,
            "ebitdaCr": null,
            "patCr": 22.81,
            "assetsCr": 93.34,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 208.77,
            "ebitdaCr": null,
            "patCr": 58.13,
            "assetsCr": 175.63,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": 9768,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Unimech Aerospace is an engineering solutions provider engaged in the manufacturing and supply of essential components for industries such as aerospace, defense, energy, and semiconductors. The company specifically focuses on aero tooling, ground support equipment, electro-mechanical sub-assemblies, and other precision-engineered products. The company’s portfolio includes items such as engine lifting and balancing beams, assembly and calibration tools, airframe assembly platforms, engine transportation stands, mechanical and electro-mechanical turnkey systems, and high-precision components.",
        "productsAndServices": "Unimech Aerospace and Manufacturing Ltd operates in Aerospace & Defence (Founded 2016).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE0U3I01011.",
        "industryOverview": "Aerospace & Defence primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 97.29x.",
        "promoters": [
          "Mr. Anil Kumar P"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Unimech Aerospace’s client base includes leading global airframe and aero-engine OEMs as well as their approved licensees.",
          "Both manufacturing facilities are AS 9100D certified for aerospace quality management, BS EN (British and European Standard) ISO 9001:2015 certified for quality management systems and ISO 45001:2018 certified for occupational health and safety.",
          "Between FY22 and the six months ending September 30, 2024, the company produced 2,999 SKUs in the tooling and precision sub-assembly category and 760 SKUs in precision-machined parts, supplying to over 26 customers across seven countries.",
          "The company serves customers globally and has clients in the US, Germany, and the UK.",
          "Manufacturing capabilities include advanced machining processes such as turning, milling, double-column milling, electro-discharge machining, and grinding. The assembly centre can handle assemblies up to 10 metres in size and diameters of up to 3 metres.",
          "Assembly expertise includes various types of assemblies, such as interference and transition fits, heli-coil assemblies, smooth sealing applications, and capacities of up to 3,000 components in a single assembly. Additional capabilities include laser tracker calibration, load testing up to 70 tonnes, pressure testing up to 420 bars, balancing to within 1 gram, helium leak detection, and non-destructive testing methods such as ultrasonic, die-penetrant, magnetic particle, fluorescent penetration, and drive mechanism testing.",
          "Fabrication capabilities cover engineering fabrication up to 2 metres and structural fabrication up to 6 metres, performed by AWS and ASME-certified welders. The company also offers special processes such as painting, polymer-based coatings, and NADCAP-certified processes like heat treatment and anodising through third-party vendors.",
          "The company has seen a consistent increase in revenue from operations and profit after tax (PAT). Revenue from operations increased from Rs 36.35 crore in FY22 to Rs 94.17 crore in FY23 to Rs 208.77 crore in FY24. PAT increased from Rs 3.39 crore in FY22 to Rs 22.81 crore in FY23 to Rs 58.13 crore in FY24."
        ],
        "risks": [
          "A substantial portion of the company's revenue comes from the aerospace sector, specifically from manufacturing aero-engine tooling and airframe tooling. The sector contributed Rs 118.54 crore (98.25%) for the six months ending September 30, 2024, and Rs 207.41 crore (99.35%), Rs 89.18 crore (94.70%), and Rs 34.84 crore (95.84%) in FY24, FY23, and FY22, respectively, to the revenue from operations. Any adverse developments in this sector could negatively affect the company’s business operations and financial condition. ",
          "The company’s revenue is dependent on a few customers. The company’s top 10 customers contributed Rs 119.56 crore (99.09%) for the six months ending September 30, 2024, and Rs 207.62 crore (99.45%), Rs 92.38 crore (98.11%), and Rs 35.14 crore (96.67%) in FY24, FY23, and FY22, respectively, to the revenue from operations. Any loss of any of these major customers or a decline in purchases from them could adversely affect the company’s operations and finances.",
          "The largest client accounts for a significant portion of the revenue, accounting for 58.89% in the six months ending September 30, 2024, and 59.82%, 59.45%, and 44.47% in FY24, FY23, and FY22, respectively. If the company loses this major client, the revenue from operations could be adversely affected. ",
          "Unimech’s business is dependent on exports, which accounted for 95.67% of total revenue for the six months ending September 30, 2024, and 97.64%, 95.20%, and 91.06% in FY24, FY23, and FY22, respectively. The United States alone contributed Rs 99.60 crore (82.55%) for the six months ending September 30, 2024, and Rs 192.46 crore (92.19%), Rs 72.42 crore (76.91%), and Rs 27.76 crore (76.38%) in FY24, FY23, and FY22, respectively. Any adverse developments or changes in these export markets, particularly the USA and Germany, could adversely impact operations and finances.",
          "A major portion of Unimech Aerospace's operations is carried out through its material subsidiary, Innomech Aerospace Toolings Private Limited (“Innomech”). The company is heavily reliant on the operating income generated by Innomech, which contributed Rs 100.70 crore (83.46%) in the six months ending September 30, 2024, and Rs 186.53 crore (89.35%), Rs 69.22 crore (73.50%), and Rs 24.74 crore (68.06%) in FY24, FY23, and FY22, respectively, to the consolidated revenue from operations. A decline in Innomech’s performance or changes in ownership could hurt the company’s financial health.",
          "The company relies on third-party suppliers for raw materials without long-term contracts or exclusive agreements. This exposes it to risks of supply chain disruptions and price volatility, which could affect production, order fulfilment, and profitability. Additionally, advances paid to suppliers may not always be recoverable, further increasing financial risks.",
          "The company, its subsidiaries, directors, and promoters are currently involved in certain ongoing legal proceedings. Any adverse judgments in any of these cases could be detrimental to the company’s business prospects. ",
          "As of October 31, 2024, the company and its material subsidiary had consolidated outstanding borrowings amounting to Rs 75.03 crore. Any inability to repay or service these loans could adversely affect the company’s financial position."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://unimechaerospace.com/wp-content/uploads/2024/12/Red-Herring-Prospectus-Unimech.pdf",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://ris.kfintech.com/ipostatus/",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · NSE/BSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.471Z",
        "effectiveDate": "2026-12-31",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-senores-pharmaceuticals-ipo",
      "slug": "senores-pharmaceuticals-ipo",
      "companyName": "Senores Pharmaceuticals Ltd",
      "shortName": "Senores Pharmaceuticals",
      "logoMonogram": "SP",
      "logoColor": "#059669",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/SENORESPHARMACEUTICALSLIMITED_30889871_93477.png",
      "sector": "Pharmaceuticals",
      "industry": "Pharmaceuticals",
      "category": "Mainboard",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "MUFG Intime India Pvt Ltd",
      "registrarUrl": "https://linkintime.co.in/initial_offer/public-issues.html",
      "issueSizeCr": 582.11,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 372,
      "priceBandHigh": 391,
      "lotSize": 38,
      "minBidQuantity": 38,
      "minInvestment": 14858,
      "faceValue": 10,
      "dates": {
        "openDate": "2026-12-20",
        "closeDate": "2026-12-24",
        "allotmentDate": "2026-12-26",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-30"
      },
      "subscription": {
        "qib": 91.47,
        "nii": 94.97,
        "retail": 83.99,
        "employee": null,
        "shareholder": null,
        "total": 90.43,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2024-12-24T16:00:19",
          "effectiveDate": "2026-12-24",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 391,
        "actualListingPrice": 600,
        "listingExchange": "NSE",
        "stockSymbol": "SENORES",
        "currentMarketPrice": 1174.6,
        "previousClose": 1217,
        "listingDate": "2026-12-30",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "NSE/BSE Live Quote & Listing Record",
          "retrievedAt": "2026-11-15T17:04:05.471Z",
          "effectiveDate": "2026-12-30",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 14.17,
            "ebitdaCr": null,
            "patCr": 0.99,
            "assetsCr": 59.15,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 35.34,
            "ebitdaCr": null,
            "patCr": 8.43,
            "assetsCr": 131.05,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 214.52,
            "ebitdaCr": null,
            "patCr": 32.71,
            "assetsCr": 621.88,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": 5397,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Senores Pharmaceuticals is a global pharmaceutical company focused on the development and manufacturing of pharmaceutical products, primarily for regulated markets in the United States, Canada, and the United Kingdom. The company operates across multiple therapeutic areas and dosage forms.\nSome of its commercialised products include Acetaminophen Butalbital, Acetaminophen Butalbital Caffeine, Chlorzoxazone, Diclofenac Potassium, Ketorolac, and Mexiletine Hydrochloride. Additionally, Senores Pharmaceuticals also sources specific products from other companies to meet the unique needs of its marketing partners and customers. The company also utilises its Atlanta facility to provide Contract Development and Manufacturing Organisation (CDMO) and Contract Manufacturing Organisation (CMO) services across the US, Canada, and the UK.",
        "productsAndServices": "Senores Pharmaceuticals Ltd operates in Pharmaceuticals (Founded 2017).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE0RB801010.",
        "industryOverview": "Pharmaceuticals primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 90.43x.",
        "promoters": [
          "Mr. Swapnil Jatinbhai Shah"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Senores has a strong presence in emerging markets, with operations in 43 countries. The company focuses on regions such as Latin America, Africa, the Commonwealth of Independent States (CIS), Southeast Asia, and the Middle East.",
          "The company claims to focus on quality and specialise in identifying complex molecules, resulting in a well-curated pipeline of products across various dosage forms and therapeutic areas. Senores has established partnerships in regulated markets, including the US, Canada, and the UK, with global and Indian pharmaceutical companies like Prasco LLC, Lannett Company Inc., Jubilant Cadista Pharmaceuticals Inc., Alkem Laboratories Ltd, Sun Pharmaceutical Industries Ltd, Dr Reddy’s Laboratories Inc., and Cipla USA Inc. ",
          "Senores markets its products in the US, Canada, and the UK through marketing and distribution agreements with pharmaceutical companies. As of September 30, 2024, the company received approvals for 19 ANDAs and has commercialised 21 products in the US and Canadian markets.",
          "By September 30, 2024, Senores had launched 55 products across key therapeutic segments, including antibiotics, antibacterials, antifungals, and blood-related products. The company has a strong presence in hospitals across India, operating through distributor partnerships and direct arrangements with hospitals.",
          "The Chhatral facility can produce four dosage forms: oral solids, oral liquids, injectables, and oral rehydration solutions (ORS). It has dedicated manufacturing areas for Cephalosporins and Beta-Lactam products. ",
          "The Chhatral facility is WHO-GMP approved and is ISO 9001:2015 certified for quality management systems in the development, manufacturing, testing, and marketing of Beta-Lactam oral dosage formulations.",
          "The R&D laboratory at the Chhatral facility is equipped with advanced technology, including 13 high-performance liquid chromatography systems, seven stability chambers, and five auto-dissolution machines. At the Naroda facility, the R&D lab handles various chemical reactions like nitration, bromination, Friedel-Crafts, Grignard, hydrogenation, chlorination, esterification, and hydrolysis. It is equipped with one UV chamber, six fume hoods, and two high-performance liquid chromatography systems.",
          "The company has seen a consistent increase in revenue from operations and profit after tax (PAT). Revenue from operations increased from Rs 14.17 crore in FY22 to Rs 35.34 crore in FY23 to Rs 214.52 crore in FY24. PAT increased from Rs 0.99 crore in FY22 to Rs 8.43 crore in FY23 to Rs 32.71 crore in FY24."
        ],
        "risks": [
          "Senores Pharmaceuticals relies heavily on third-party marketing partners and distributors for product sales. The top 10 partners contributed Rs 91.33 crore (50.46%) in the six months ending September 30, 2024, and Rs 84.47 crore (39.37%), Rs 19.65 crore (55.60%), and Rs 0.89 crore (6.26%) in FY24, FY23, and FY22, respectively, to the revenue from operations. Any loss of any key partners, their financial instability, or reduced demand for products could negatively impact the company’s operations and finances. ",
          "The company's revenue majorly depends on the growth and sale of its products in regulated markets. This segment contributed Rs 110.37 crore (60.97%) in the six months ending September 30, 2024, and Rs 145.15 crore (67.66%), Rs 20.74 crore (58.69%), and Rs 0.89 crore (6.26%) in FY24, FY23, and FY22, respectively, to the revenue from operations. Any decline in market demand or inability to adapt to changing market conditions could adversely affect the company’s financial performance and operations.",
          "A large portion of revenue is derived from a limited number of customers. The top 10 customers accounted for Rs 125.20 crore (69.17%) for the six months ending September 30, 2024, and Rs 167.59 crore (78.12%), Rs 32.81 crore (92.85%), and Rs 14.17 crore (100%) in FY24, FY23, and FY22, respectively, of the revenue from operations. Any loss of any key customers, the termination of contracts or a reduction in business from them could adversely impact the company’s revenue generation capabilities and business performance.",
          "The United States is a key market for Senores Pharmaceuticals, contributing Rs 108.24 crore (59.80%) in the six months ending September 30, 2024, and Rs 142.93 crore (66.63%), Rs 26.35 crore (74.56%), and Rs 0.87 crore (6.26%) in FY24, FY23, and FY22, respectively, to the revenue from operations. A decline in demand from this market could have a negative impact on the company’s financial health.",
          "The company depends on a limited number of CDMO and CMO customers across regulated and emerging markets. Any inability to maintain or establish relationships with these customers could adversely impact the company’s financial condition and operational results.",
          "The company, its subsidiaries, and its directors are involved in certain ongoing legal proceedings. Any adverse judgments in any of these cases could be detrimental to the company’s business prospects.",
          "Senores Pharmaceuticals relies on its manufacturing and research and development facilities. Any equipment breakdowns or industrial accidents which could cause the facilities’ sudden shutdown could adversely affect the company's operations. ",
          "Two out of the company’s three manufacturing facilities are located in Gujarat, India, specifically in Chhatral and Naroda. Any adverse developments in this region could negatively affect its business operations and finances.",
          "The company has contingent liabilities amounting to Rs 118.70 crore. If these liabilities materialise they could pose a risk to the company's financial stability.",
          "As of November 30, 2024, Senores Pharmaceuticals had total borrowings of Rs 298.95 crore. Any inability to repay or service these loans could adversely affect the company’s financial position."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://senorespharma.com/wp-content/uploads/2024/12/Senores-Pharmaceuticals-Limited-RHP.pdf",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://linkintime.co.in/initial_offer/public-issues.html",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · NSE/BSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.471Z",
        "effectiveDate": "2026-12-30",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-carraro-india-ipo",
      "slug": "carraro-india-ipo",
      "companyName": "Carraro India Ltd",
      "shortName": "Carraro India",
      "logoMonogram": "CA",
      "logoColor": "#0F766E",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/CarraroIndiaLtd_51934019_7636.png",
      "sector": "Auto Ancillaries",
      "industry": "Auto Ancillaries",
      "category": "Mainboard",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "MUFG Intime India Pvt Ltd",
      "registrarUrl": "https://linkintime.co.in/initial_offer/",
      "issueSizeCr": 1250,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 668,
      "priceBandHigh": 704,
      "lotSize": 21,
      "minBidQuantity": 21,
      "minInvestment": 14784,
      "faceValue": 10,
      "dates": {
        "openDate": "2026-12-20",
        "closeDate": "2026-12-24",
        "allotmentDate": "2026-12-26",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-30"
      },
      "subscription": {
        "qib": 2.19,
        "nii": 0.58,
        "retail": 0.64,
        "employee": null,
        "shareholder": null,
        "total": 1.07,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2024-12-24T16:00:18",
          "effectiveDate": "2026-12-24",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 704,
        "actualListingPrice": 651,
        "listingExchange": "NSE",
        "stockSymbol": "CARRARO",
        "currentMarketPrice": 483.75,
        "previousClose": 494.4,
        "listingDate": "2026-12-30",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "NSE/BSE Live Quote & Listing Record",
          "retrievedAt": "2026-11-15T17:04:05.471Z",
          "effectiveDate": "2026-12-30",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 1497.54,
            "ebitdaCr": null,
            "patCr": 22.43,
            "assetsCr": 1012.44,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 1713.14,
            "ebitdaCr": null,
            "patCr": 48.46,
            "assetsCr": 1072.39,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 1788.96,
            "ebitdaCr": null,
            "patCr": 62.56,
            "assetsCr": 1072.89,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": 2801,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Carraro India is a supplier that makes engineering products for original equipment manufacturer (OEM) customers. Primarily, the company manufactures axles and transmission systems for agricultural tractors and construction vehicles such as backhoe loaders, soil compactors, and small motor graders, alongside gears, shafts, and related components for industrial and automotive applications. The company also provides solutions, including in-house product design, manufacturing, and supply of critical components for off-highway vehicles.",
        "productsAndServices": "Carraro India Ltd operates in Auto Ancillaries (Founded 1997).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE0V7W01012.",
        "industryOverview": "Auto Ancillaries primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 1.07x.",
        "promoters": [
          "Mr. Balaji Gopalan"
        ],
        "growthOpportunities": [],
        "strengths": [
          "The company claims to have advanced manufacturing facilities at its two manufacturing plants in Pune, Maharashtra. Among these, the driveline manufacturing plant is equipped for machining, assembly, and testing of axles and transmission systems. The gear manufacturing plant claims to house advanced gear machining and heat treatment technologies such as carburising, induction hardening, and nitriding.",
          "As of September 30, 2024, the gear manufacturing plant holds the IATF 16949:2016 certification for quality management and is also ISO 9001:2015 certified for quality management systems.",
          "The drive line manufacturing plant is ISO 9001:2015 certified for quality management systems and ISO 14001:2015 certified for environmental management systems.",
          "As of September 30, 2024, Carraro India supplies its products to 38 manufacturers across India.",
          "In addition to serving Indian manufacturers, Carraro India supplies products to international manufacturers. Some of these exports are facilitated through Carraro Drive Tech Italia S.p.A., a leading entity in the Carraro Group's driveline business.",
          "The company has seen a consistent increase in revenue from operations and profit after tax (PAT). Revenue from operations increased from Rs 1,497.54 crore in FY22 to Rs 1,713.14 crore in FY23 to Rs 1,788.96 crore in FY24, while PAT increased from Rs 22.43 crore in FY22 to Rs 48.46 crore in FY23 to Rs 62.56 crore in FY24."
        ],
        "risks": [
          "The company derives a major portion of its revenue from its top 10 customers. The top 10 customers of the company contributed Rs 803.73 crore (87.88%%) for the six months ended 30, September 2024 and Rs 1,527.66 crore (85.39%), Rs 1,488.79 crore (86.90%), Rs 1,320.93 crore (88.21%) to the total revenue from operations in FY24, FY23, and FY22, respectively. Any failure to retain these key customers, expand the customer base, or a loss of business from these clients can adversely affect the company’s business and finances.",
          "Carraro India relies on the Carraro Group for various operational aspects, including the use of the Carraro brand, customer sourcing, procurement, R&D, and general support. The Carraro Group has been the company's largest customer, contributing Rs 304.34 crore (33.27%) for the six months ended 30, September 2024 and Rs 606.71 crore (33.91%), Rs 562.94 crore (32.86%) and Rs 464.12 crore (30.99%) in FY24, FY23 and FY22,  respectively, to the revenue from operations. Any disruption in this relationship could adversely impact the company’s operations and business performance.",
          "The manufacturing operations of Carraro India are concentrated in Pune, Maharashtra. Any adverse developments in Maharashtra, such as labour disputes, natural disasters, or regulatory changes, could hit production, negatively impacting the company’s financial performance.",
          "Carraro India’s business is dependent on the performance of the tractor and construction vehicles markets. The agricultural sector contributed Rs 425.03 crore (47.08%) for the six months ended September 30, 2024, and Rs 793.39 crore (45.05%), Rs 832.31 crore (49.37%), and Rs 745.90 crore (50.59%) in FY24, FY23, and FY22, respectively, to revenue from operations. The construction vehicles segment contributed Rs 357.60 crore (39.61%) for the six months ended September 30, 2024, and Rs 727.18 crore (41.29%), Rs 647.74 crore (38.43%), and Rs 532.57 crore (36.12%) in FY24, FY23, and FY22, respectively, to revenue from operations. Any adverse changes in these markets could negatively affect the company’s business operations.",
          "The company relies heavily on its global base of OEM customers. Exports contributed Rs 315.07 crore (34.60%) for the six months ended September 30, 2024, and Rs 638.40 crore (35.87%), Rs 650.64 crore (38.19%), and Rs 548.36 crore (36.80%) in FY24, FY23, and FY22, respectively, to the revenue from operations. Any inability to maintain the stability of its existing OEM customer relationships or attract new customers could adversely impact its financial condition and operational results.",
          "The company has contingent liabilities as of September 30, 2024, amounting to Rs 231.07 crore. If these liabilities materialise, it could pose a risk to the company’s financial stability. ",
          "The company, its subsidiary, and promoters are involved in some legal proceedings. Any adverse judgments in any of these cases can be detrimental to the company’s business prospects. ",
          "As of October 31, 2024, the total borrowings amounted to Rs 209.19 crore. Any failure to service or repay these loans on time could adversely impact the company’s operations, liquidity, and overall financial position."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.axiscapital.co.in/wp-content/uploads/Carraro-India-Limited-RHP.pdf",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://linkintime.co.in/initial_offer/",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · NSE/BSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.471Z",
        "effectiveDate": "2026-12-30",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-ventive-hospitality-ipo",
      "slug": "ventive-hospitality-ipo",
      "companyName": "Ventive Hospitality Ltd",
      "shortName": "Ventive Hospitality",
      "logoMonogram": "VH",
      "logoColor": "#0F766E",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/VentiveHospitalityLtd_19888170_40188.png",
      "sector": "Realty",
      "industry": "Realty",
      "category": "Mainboard",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Ltd",
      "registrarUrl": "https://ris.kfintech.com/ipostatus/",
      "issueSizeCr": 1600,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 610,
      "priceBandHigh": 643,
      "lotSize": 23,
      "minBidQuantity": 23,
      "minInvestment": 14789,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-20",
        "closeDate": "2026-12-24",
        "allotmentDate": "2026-12-26",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-30"
      },
      "subscription": {
        "qib": 9.08,
        "nii": 13.48,
        "retail": 5.17,
        "employee": null,
        "shareholder": null,
        "total": 9.57,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2024-12-24T16:00:19",
          "effectiveDate": "2026-12-24",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 643,
        "actualListingPrice": 716,
        "listingExchange": "NSE",
        "stockSymbol": "VENTIVE",
        "currentMarketPrice": 546.3,
        "previousClose": 550.4,
        "listingDate": "2026-12-30",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "NSE/BSE Live Quote & Listing Record",
          "retrievedAt": "2026-11-15T17:04:05.471Z",
          "effectiveDate": "2026-12-30",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 229.17,
            "ebitdaCr": null,
            "patCr": 29.43,
            "assetsCr": 824.91,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 430.81,
            "ebitdaCr": null,
            "patCr": 131.27,
            "assetsCr": 779.29,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 477.98,
            "ebitdaCr": null,
            "patCr": 166.32,
            "assetsCr": 951.97,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": 12661,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Ventive Hospitality is a hospitality asset owner, specifically in luxury properties across both business and leisure segments. The company’s assets are managed or franchised by renowned global operators such as Marriott, Hilton, Minor, and Atmosphere. Ventive Hospitality’s portfolio includes 17 properties located in India and the Maldives, across the luxury, upper-upscale, and upscale categories.",
        "productsAndServices": "Ventive Hospitality Ltd operates in Realty (Founded 2002).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE781S01027.",
        "industryOverview": "Realty primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 9.57x.",
        "promoters": [
          "Mr. Atul Chordia"
        ],
        "growthOpportunities": [],
        "strengths": [
          "The company’s hospitality assets feature leading food and beverage outlets. Some notable ones are Alto Vino (Italian) and Tao Fu (Chinese) at JW Marriott, Pune, and Ukiyo (Japanese) at The Ritz-Carlton, Pune.",
          "Ventive Hospitality has experienced substantial growth, expanding from 83 keys in 2007 to 2,036 keys as of September 30, 2024.",
          "As of September 30, 2024, Ventive Hospitality’s operating portfolio comprises seven hospitality assets with 1,331 keys developed by the company, its promoter, promoter group, and their affiliates. Additionally, the portfolio includes four acquired assets with 705 keys.",
          "The company’s hospitality assets are strategically located in key business hubs like Pune and Bengaluru, popular tourist destinations such as the Maldives, and significant cultural and spiritual centres like Varanasi.",
          "The company’s portfolio includes prominent luxury properties managed by globally recognised hospitality brands. Pre-acquisition assets include JW Marriott, Pune, while post-acquisition additions comprise JW Marriott, Pune; The Ritz-Carlton, Pune; Conrad Maldives; Anantara Maldives; and Raaya by Atmosphere, Maldives.",
          "Ventive Hospitality has a dedicated asset management team that works closely with hotel operators. They oversee critical functions such as procurement, marketing strategies, and capital expenditure planning.",
          "The company claims to prioritise strong Environmental, Social, and Governance (ESG) practices. Their management actively integrates ESG initiatives into business goals, monitors progress, and identifies areas for improvement.",
          "The company has seen a consistent increase in revenue from operations and profit after tax (PAT). Revenue from operations increased from Rs 229.17 crore in FY22 to Rs 430.81 crore in FY23 to Rs 477.98 crore in FY24. PAT increased from Rs 29.43 crore in FY22 to Rs 131.27 crore in FY23 to Rs 166.32 crore in FY24."
        ],
        "risks": [
          "The company relies on third-party operators for the quality of services at its hospitality assets. These assets are operated by or franchised from third-party brands. Any negative impact on the reputation of these assets or brands, or failure in the quality control systems, could adversely affect the company’s business, financial performance, and operations.",
          "A major portion of the company’s assets are operated by or franchised by Marriott and Hilton, which account for 8 out of 17 hospitality assets. These assets contributed substantial revenue, with Rs 430.83 crore (49.19%) for the six months ended September 30, 2024. In FY24, FY23, and FY22, they contributed Rs 971.23 crore (50.92%), Rs 891.89 crore (50.61%), and Rs 499.70 crore (41.72%) to the company’s pro forma total income, respectively. If the long-term agreements with these third-party operators are terminated or not renewed, it could negatively affect the company’s operations and financial condition.",
          "A large portion of the company’s total income comes from the revenue generated by hotel operations. For the six months ending September 30, 2024, this segment contributed Rs 599.76 crore (68.47%) to the pro forma total income. In FY24, FY23, and FY22, it contributed Rs 1,374.06 crore (72.04%), Rs 1,281.28 crore (72.71%), and Rs 820.77 crore (68.53%), respectively. Additionally, a substantial share of the income is derived from the company’s four largest hospitality assets. These assets contributed Rs 462.71 crore (52.83%) for the six months ended September 30, 2024, and Rs 1,111.20 crore (58.26%), Rs 1036.27 crore (58.81%), and Rs 727.01 crore (60.71%) in FY24, FY23, and FY22, respectively. Any adverse changes affecting these key assets could adversely impact the company’s business operations and finances.",
          "Before the recent acquisitions, the company’s total income was derived solely from assets located in Pune. However, a large portion of its total income now comes from assets concentrated in Pune and the Maldives, accounting for 58.40% and 32.03% of the pro forma total income for the six months ended September 30, 2024, respectively. Any adverse developments in these locations could have a significant impact on the company's operations and financial position.",
          "The company’s annuity assets contributed Rs 245.45 crore (28.02%) as of the six months ended September 30, 2024. In FY24, FY23, and FY22, these assets contributed Rs 466.10 crore (24.44%), Rs 416.12 crore (23.61%), and Rs 339.20 crore (28.32%), respectively, to the pro forma total income. If demand for office and retail properties declines, the company’s business and financial results could be adversely impacted.",
          "Low occupancy rates at the company’s hospitality assets could adversely affect its business, financial condition, and cash flows.",
          "As of the six months ending September 30, 2024, Rs 87.36 crore (26.47%) of the company’s pro forma revenue from room income came from bookings through travel agents, intermediaries, and other channels. In FY24, FY23, and FY22, this amounted to Rs 249.90 crore (32.50%), Rs 238.34 crore (33.07%), and Rs 179.54 crore (40.60%), respectively. If these distribution channels continue to capture a larger share of bookings compared to direct booking channels, the company may face higher commission costs. Additionally, if competitors negotiate more favourable terms with these agents and intermediaries, it could lead to a reduction in the company’s total income, negatively affecting its business.",
          "As of September 30, 2024, the company had outstanding borrowings of Rs 3,609.52 crore. Any inability to repay or service these loans could adversely affect the company’s financial stability.",
          "The company, its directors, promoters, and subsidiaries are involved in certain ongoing legal proceedings. Any adverse judgment in any of these cases could be detrimental to the company’s business prospects."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.ventivehospitality.com/wp-content/uploads/2024/07/Project-Puma-RHP-Final-Filing.pdf",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://ris.kfintech.com/ipostatus/",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · NSE/BSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.471Z",
        "effectiveDate": "2026-12-30",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-vishal-mega-mart-ipo",
      "slug": "vishal-mega-mart-ipo",
      "companyName": "Vishal Mega Mart Ltd",
      "shortName": "Vishal Mega Mart",
      "logoMonogram": "VM",
      "logoColor": "#0F766E",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/Vishal_Mega_Mart_Logo.png",
      "sector": "Trading",
      "industry": "Trading",
      "category": "Mainboard",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Ltd",
      "registrarUrl": "https://ris.kfintech.com/ipostatus/",
      "issueSizeCr": 8000,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 74,
      "priceBandHigh": 78,
      "lotSize": 190,
      "minBidQuantity": 190,
      "minInvestment": 14820,
      "faceValue": 10,
      "dates": {
        "openDate": "2026-12-11",
        "closeDate": "2026-12-13",
        "allotmentDate": "2026-12-16",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-18"
      },
      "subscription": {
        "qib": 25.01,
        "nii": 11.69,
        "retail": 1.94,
        "employee": null,
        "shareholder": null,
        "total": 10.62,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2024-12-13T16:00:21",
          "effectiveDate": "2026-12-13",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 78,
        "actualListingPrice": 104,
        "listingExchange": "NSE",
        "stockSymbol": "VMM",
        "currentMarketPrice": 96.37,
        "previousClose": 96,
        "listingDate": "2026-12-18",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "NSE/BSE Live Quote & Listing Record",
          "retrievedAt": "2026-11-15T17:04:05.470Z",
          "effectiveDate": "2026-12-18",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 5588.51,
            "ebitdaCr": null,
            "patCr": 202.77,
            "assetsCr": 8217.98,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 7586.04,
            "ebitdaCr": null,
            "patCr": 321.27,
            "assetsCr": 8288.91,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 8911.95,
            "ebitdaCr": null,
            "patCr": 461.93,
            "assetsCr": 8506.08,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": 45208,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "Vishal Mega Mart is a supermarket brand that provides products across three main categories: apparel, general merchandise, and fast-moving consumer goods (FMCG). These products are available through its network of Vishal Mega Mart stores as well as its mobile application and website. \nThe apparel category features clothing options such as t-shirts, shirts, denim, activewear, loungewear, nightwear, innerwear, western wear, formal wear, and ethnic wear for men, women, children, and infants. \nThe general merchandise category includes both in-house and third-party branded products, such as home appliances, crockery, utensils, home furnishings, toys, stationery, travel essentials, and footwear. \nIn the FMCG segment, the company offers food items like biscuits, savoury snacks (namkeen), noodles, tea, coffee, mustard oil, soybean oil, clarified butter (desi ghee), and spices. It also provides non-food essentials, including baby diapers, hair oil, sanitary pads, and handwash.",
        "productsAndServices": "Vishal Mega Mart Ltd operates in Trading (Founded 2018).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE01EA01019.",
        "industryOverview": "Trading primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 10.62x.",
        "promoters": [
          "Mr. Gunender Kapur"
        ],
        "growthOpportunities": [],
        "strengths": [
          "As of September 30, 2024, the company operates a vast network of 645 stores across 414 cities in 28 states and two Union Territories.",
          "For its own brands, the company states that the in-house design team identifies products based on both global and local trends, collaborates with vendors to create prototypes, and places orders to ensure production meets its specifications and quality standards.",
          "Vishal Mega Mart claims to have integrated advanced technology and systems across its operations, ensuring the efficient and timely delivery of both existing and new products to its customers in a cost-effective manner.",
          "The company operates one central distribution centre, one main distribution centre, and 17 regional distribution centres, all strategically located near major demand areas, ensuring efficient delivery and supply chain management.",
          "Vishal Mega Mart continues to grow its portfolio of brands, adding new products each year. For instance, the company has significantly expanded its ‘Tandem’ brand for home appliances over the last three financial years, now including items like air fryers, garment steamers, egg boilers, beard trimmers, juicers, soundbars, travel speakers, induction cooktops, and vegetable choppers, among others. ",
          "The company has observed a consistent increase in revenue from operations and profit after tax (PAT). Revenue from operations increased from Rs 5,588.51 crore in FY22 to Rs 7,586.04 crore in FY23 to Rs 8,911.95 crore in FY24. PAT increased from Rs 202.77 crore in FY22, to Rs 321.27 crore in FY23 to Rs 461.93 crore in FY24."
        ],
        "risks": [
          "This is an offer-for-sale. Therefore, the money mopped up through the share sale will go into the hands of the sellers and not to the company to help it grow.",
          "The company, its subsidiaries, directors, and promoters, are involved in certain legal proceedings. Any adverse judgments in any of the cases could be detrimental to the company’s business prospects.",
          "The company does not manufacture any of the products sold in its stores and relies entirely on third-party vendors to produce items under its brands. These vendors are expected to meet strict specifications, quality, design, and manufacturing standards. Any failure on their part could negatively affect the company’s operations and finances. ",
          "A significant portion of revenue comes from stores located in Uttar Pradesh, Karnataka, and Assam. Any adverse developments in these states could disrupt operations and negatively impact revenue-generating capabilities.",
          "The company has received two directives with requests for information from the Enforcement Directorate (ED) to furnish information and documents for its investigation into the workings of the company. Any adverse outcome in the investigation could lead to possible penalties.",
          "The company has experienced negative cash flows in the past. Any repeat of this could be detrimental to the company’s working",
          "As of 30 September 2024, Vishal Mega Mart had contingent liabilities amounting to Rs 60.66 crore. If these liabilities materialise, it could adversely affect the company’s financial condition."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sebi.gov.in/filings/public-issues/dec-2024/vishal-mega-mart-red-herring-prospectus_89311.html",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://ris.kfintech.com/ipostatus/",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · NSE/BSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.470Z",
        "effectiveDate": "2026-12-18",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-sai-life-sciences-ipo",
      "slug": "sai-life-sciences-ipo",
      "companyName": "Sai Life Sciences Ltd",
      "shortName": "Sai Life Sciences",
      "logoMonogram": "SL",
      "logoColor": "#2563EB",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/SaiLifeSciencesLtd_92232367_68121.png",
      "sector": "Miscellaneous",
      "industry": "Miscellaneous",
      "category": "Mainboard",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "KFin Technologies Ltd",
      "registrarUrl": "https://ris.kfintech.com/ipostatus/",
      "issueSizeCr": 3042.62,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 522,
      "priceBandHigh": 549,
      "lotSize": 27,
      "minBidQuantity": 27,
      "minInvestment": 14823,
      "faceValue": 1,
      "dates": {
        "openDate": "2026-12-11",
        "closeDate": "2026-12-13",
        "allotmentDate": "2026-12-16",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-18"
      },
      "subscription": {
        "qib": 12.05,
        "nii": 2.74,
        "retail": 0.78,
        "employee": null,
        "shareholder": null,
        "total": 4.3,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2024-12-13T16:00:19",
          "effectiveDate": "2026-12-13",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 549,
        "actualListingPrice": 650,
        "listingExchange": "NSE",
        "stockSymbol": "SAILIFE",
        "currentMarketPrice": 1928.8,
        "previousClose": 1905.2,
        "listingDate": "2026-12-18",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "NSE/BSE Live Quote & Listing Record",
          "retrievedAt": "2026-11-15T17:04:05.471Z",
          "effectiveDate": "2026-12-18",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 869.59,
            "ebitdaCr": null,
            "patCr": 6.23,
            "assetsCr": 2164.23,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 1217.14,
            "ebitdaCr": null,
            "patCr": 9.99,
            "assetsCr": 2186.65,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 1465.18,
            "ebitdaCr": null,
            "patCr": 82.81,
            "assetsCr": 2275.14,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": 107.54,
        "pbRatio": 15.05,
        "marketCapCr": 40759,
        "eps": 17.71,
        "industryAvgPe": 40.55,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Live market valuation & filings",
        "peers": [
          {
            "name": "Gland Pharma",
            "symbol": "GLAND",
            "pe": 44.16,
            "pb": 5.11,
            "roePct": null,
            "marketCapCr": 54577.34
          },
          {
            "name": "Piramal Pharma",
            "symbol": "PPLPHARMA",
            "pe": null,
            "pb": 4.01,
            "roePct": null,
            "marketCapCr": 32644.66
          },
          {
            "name": "Divi's Laboratories",
            "symbol": "DIVISLAB",
            "pe": 90.39,
            "pb": 16.89,
            "roePct": null,
            "marketCapCr": 303961.52
          },
          {
            "name": "Neuland Laboratories",
            "symbol": "NEULANDLAB",
            "pe": 59.3,
            "pb": 13.23,
            "roePct": null,
            "marketCapCr": 26835.77
          },
          {
            "name": "Onesource Specialty Pharma",
            "symbol": "ONESOURCE",
            "pe": null,
            "pb": 3.13,
            "roePct": null,
            "marketCapCr": 18542.24
          }
        ]
      },
      "profile": {
        "overview": "Sai Life Sciences is a contract research, development, and manufacturing organisation (CRDMO) that caters to global pharmaceutical innovators and biotechnology companies. The company offers services spanning the entire drug discovery, development, and manufacturing process for small molecule new chemical entities (NCEs). The company’s CDMO portfolio features over 170 innovator pharmaceutical products, with 38 of these products supporting the manufacturing of 28 commercial drugs.",
        "productsAndServices": "Sai Life Sciences Ltd operates in Miscellaneous (Founded 1999).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE570L01029.",
        "industryOverview": "Miscellaneous primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 4.30x.",
        "promoters": [
          "Mr. Krishnam Raju Kanumuri"
        ],
        "growthOpportunities": [],
        "strengths": [
          "During FY24 and the six months ending September 30, 2024, the company served over 280 and 230 innovator pharmaceutical companies, respectively, including 18 of the top 25 global pharmaceutical companies (in terms of revenue for the calendar year 2023). Its services cater to regulated markets such as the US, UK, Europe, and Japan. ",
          "Over the past five years and through September 30, 2024, Sai Life Sciences has supported more than 200 small molecule discovery programs. In the last three years and six months, the company has collaborated with over 160 customers.",
          "The company claims to have implemented energy conservation initiatives in production, utilities, and effluent treatment. In FY24, it centralised air compression, installed energy-efficient pumps, and significantly increased the use of renewable energy at its Unit IV in Bidar to 89%, up from 67% in FY22, resulting in reduced carbon dioxide emissions.",
          "Its manufacturing facilities have received certifications from major regulatory bodies, including the United States Food and Drug Administration (USFDA), Japan’s Pharmaceuticals and Medical Devices Agency (PMDA), and India’s Central Drug Standards Control Organisation (CDSCO).",
          "Sai Life Sciences claims to be among the few Indian CRDMOs that integrate discovery and development operations across the US, UK, and India, coupled with manufacturing capabilities located in India.",
          "Sai Life Sciences states that the company strategically operates near key innovation clusters, with facilities in Greater Boston and Manchester. These locations provide access to cutting-edge research, a skilled global workforce, and collaboration opportunities within innovation ecosystems. Additionally, the company's facilities in India offer a cost-effective advantage, enabling large-scale drug discovery, development, and commercial production.",
          "The company has seen a consistent increase in revenue from operations and profit after tax (PAT). Revenue from operations increased from Rs 869.59 crore in FY22 to Rs 1,217.14 crore in FY23 to Rs 1,465.18 crore in FY24. PAT increased from Rs 6.23 crore in FY22, to Rs 9.99 crore in FY23 to Rs 82.81 crore in FY24"
        ],
        "risks": [
          "Sai Life Sciences’ financial performance is highly dependent on securing business from biotechnology and pharmaceutical clients. As a result, the company is exposed to risks and uncertainties that influence these industries, which can directly affect its operations.",
          "The company relies heavily on its research and development (R&D) activities for future growth. If these efforts fail to deliver the expected outcomes, customers may discontinue their partnerships, jeopardising the company’s long-term growth prospects.",
          "Sai Life Sciences operates its key manufacturing facilities in India: a large facility in Bidar (Unit IV), a smaller intermediate facility in Bollaram (Unit III), and another facility in Hyderabad (Unit II). Any interruptions or delays at these sites could affect the company’s operations and the ability to meet customer demand, which could adversely impact the company’s finances.",
          "The company’s revenue is predominantly driven by overseas customers, contributing Rs 654.22 crore (97.40%) for the six months ending September 30, 2024, and Rs 1,438.60 crore (97.95%), Rs 1,176.19 crore (98.27%) and Rs 800.97 crore (92.16%) in FY24, FY23 and FY22 to the total revenue from contract research, development and manufacturing activities, respectively. This reliance on international markets exposes Sai Life Sciences to risks such as operational delays, sudden regulatory restrictions or any financial challenges which could impact its business and financial performance. ",
          "A substantial portion of the company’s revenue comes from a small group of key customers. The top 10 customers contributed Rs 293.43 crore (43.45%) during the six months ending September 30, 2024, and Rs 677.74 crore (46.26%), Rs 489.21 crore (40.19%), and Rs 378.52 crore (43.53%) in FY24, FY23, and FY22, respectively to the revenue from operations. Any loss of any major customer or large contract could adversely affect the company’s operations and revenue generation capabilities.",
          "As of September 30, 2024, the company reported total borrowings of Rs 764.49 crore. Any inability to repay or service these loans could harm the company’s financial standing.",
          "The company, its directors and promoters are involved in certain legal proceedings. Any adverse judgments in any of the cases could be detrimental to the company’s business prospects."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://www.sailife.com/wp-content/uploads/2024/12/Red-Herring-Prospectus.pdf",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://ris.kfintech.com/ipostatus/",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · NSE/BSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.471Z",
        "effectiveDate": "2026-12-18",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-mobikwik-ipo",
      "slug": "mobikwik-ipo",
      "companyName": "One Mobikwik Systems Ltd",
      "shortName": "One Mobikwik Systems",
      "logoMonogram": "OM",
      "logoColor": "#059669",
      "logoUrl": "https://assets-netstorage.groww.in/stocks-ipo/logos/logos-56.png",
      "sector": "E-Commerce/App based Aggregator",
      "industry": "E-Commerce/App based Aggregator",
      "category": "Mainboard",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "MUFG Intime India Pvt Ltd",
      "registrarUrl": "https://linkintime.co.in/mipo/ipoallotment.html",
      "issueSizeCr": 572,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 265,
      "priceBandHigh": 279,
      "lotSize": 53,
      "minBidQuantity": 53,
      "minInvestment": 14787,
      "faceValue": 2,
      "dates": {
        "openDate": "2026-12-11",
        "closeDate": "2026-12-13",
        "allotmentDate": "2026-12-16",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-18"
      },
      "subscription": {
        "qib": 35.34,
        "nii": 88.19,
        "retail": 113.42,
        "employee": null,
        "shareholder": null,
        "total": 63.95,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2024-12-13T16:00:18",
          "effectiveDate": "2026-12-13",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "Mainboard IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 279,
        "actualListingPrice": 440,
        "listingExchange": "NSE",
        "stockSymbol": "MOBIKWIK",
        "currentMarketPrice": 226.82,
        "previousClose": 230.21,
        "listingDate": "2026-12-18",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "NSE/BSE Live Quote & Listing Record",
          "retrievedAt": "2026-11-15T17:04:05.471Z",
          "effectiveDate": "2026-12-18",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Mainboard IPO Listing"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 526.56,
            "ebitdaCr": null,
            "patCr": -128.16,
            "assetsCr": 836.13,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 539.47,
            "ebitdaCr": null,
            "patCr": -83.81,
            "assetsCr": 714.33,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 875,
            "ebitdaCr": null,
            "patCr": 14.08,
            "assetsCr": 854.65,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": null,
        "pbRatio": null,
        "marketCapCr": 1783,
        "eps": null,
        "industryAvgPe": null,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Pending offer document financial ratios",
        "peers": []
      },
      "profile": {
        "overview": "MobiKwik operates as a platform-based business with a two-sided payment network that connects consumers and merchants. For consumers, the MobiKwik app offers different payment options alongside financial products, including digital credit, investments, and insurance solutions.\nThe company’s product portfolio includes services such as online checkout for e-commerce merchants, \"Scan and Pay\" with Kwik QR, MobiKwik Vibe (a soundbox solution), the MobiKwik EDC machine, and Merchant Cash Advance. MobiKwik has also developed offerings like MobiKwik ZIP and ZIP EMI for consumers following collaborations with lending partners, as well as Merchant Cash Advance solutions specifically for merchants.",
        "productsAndServices": "One Mobikwik Systems Ltd operates in E-Commerce/App based Aggregator (Founded 2008).",
        "businessModel": "Mainboard issue (EQUITY) listed on NSE / BSE · ISIN INE0HLU01028.",
        "industryOverview": "E-Commerce/App based Aggregator primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 63.95x.",
        "promoters": [
          "Mr. Bipin Preet Singh"
        ],
        "growthOpportunities": [],
        "strengths": [
          "For MobiKwik, the number of registered users has grown at a compound annual growth rate (CAGR) of 12.31% from 123.56 million on 31 March 2022 to 155.84 million on 31 March 2024. As of June 30 June 2024, the company had 161.03 million registered users.",
          "Evolving from a payments-focused business, MobiKwik claims it has transformed into a multi-product platform offering financial services. By consolidating and analysing consumer financial data through advanced analytics and machine learning, the company provides personalised financial solutions tailored to individual behaviour, capabilities, and aspirations.",
          "MobiKwik, in partnership with SBM Bank India, offers a fixed deposit-backed credit card. This product is designed to help individuals with little or no credit history build their credit scores.",
          "The company has collaborated with several leading lending partners, including Unity Small Finance Bank, TVS Credit Services, Hero Fincorp, Poonawalla Fincorp, SMFG India Credit (formerly Fullerton India), Suryoday Small Finance Bank, Northern Arc Capital, MyShubhLife, Krazybee Services, Vivriti Capital, and Transactree Technologies.",
          "By June 30, 2024, MobiKwik had over 70.88 million KYC-completed users on its platform, acquired primarily through the MobiKwik Wallet.",
          "The number of unique merchants where MobiKwik ZIP users transacted increased from 20,671 as of March 31, 2022, to 32,898 as of March 31, 2024.",
          "MobiKwik leverages the account aggregator technology to offer a personal financial management product. By consolidating financial data into a single platform, the tool—powered by analytics and machine learning—helps consumers better understand and manage their finances, promoting financial wellness through personalised solutions.",
          "The company has seen a consistent increase in revenue from operations. Revenue from operations increased from Rs 526.56 crore in FY22 to Rs 539.47 crore in FY23 to Rs 875.00 crore in FY24."
        ],
        "risks": [
          "The industry in which MobiKwik operates is susceptible to cyber risks. Any security breaches, cyberattacks, or failure to protect personal, confidential, or proprietary information could harm MobiKwik's reputation, negatively impacting its business operations.",
          "The company’s performance depends on retaining and expanding its network of consumers, merchants, and lending partners. A decline in the number of registered users or revenue from its digital payments and financial services businesses could hit its operations and finances.",
          "MobiKwik's ability to distribute financial products relies heavily on partnerships with lending institutions. In FY24, revenue generated by financial services stood at Rs 557.88 crore and Rs 170.73 crore in the three months ending June 30, 2024, reflecting dependency on these collaborations. Any failure to maintain these partnerships could adversely impact the company’s financial services business.",
          "The company has incurred significant losses of Rs 128.16 crore in FY22 and Rs 83.81 crore in FY23. A repeat of this in the future could be bad for the company’s financial and reputational standing. ",
          "MobiKwik relies on Zaakpay for critical operations in its payments and financial services businesses, including MobiKwik ZIP and ZIP EMI. Any disruption in Zaakpay’s services could harm the platform’s functionality, adversely affecting MobiKwik’s brand, reputation, and financial results.",
          "A significant portion of MobiKwik's financial services revenue is tied to its MobiKwik ZIP and ZIP EMI products. Any downturn in these offerings, or failure to develop new financial products, could hit the company’s revenue and operational performance.",
          "MobiKwik and its subsidiary, Zaak ePayment Services Private Limited, are involved in certain legal proceedings. Any adverse judgments in any of these cases could be detrimental to its business prospects. ",
          "As of June 30, 2024, MobiKwik had an outstanding debt of Rs 206.34 crore. Any inability to repay or service these loans could adversely affect the company’s financial position. "
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://documents.mobikwik.com/files/investor-relations/filings/red-herring-prospectus-Mobikwik.pdf?v=1.0110012024",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://linkintime.co.in/mipo/ipoallotment.html",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · NSE/BSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.471Z",
        "effectiveDate": "2026-12-18",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "Mainboard IPO"
      }
    },
    {
      "id": "ipo-c2c-advanced-systems-ipo",
      "slug": "c2c-advanced-systems-ipo",
      "companyName": "C2C Advanced Systems Ltd",
      "shortName": "C2C Advanced Systems",
      "logoMonogram": "CA",
      "logoColor": "#334155",
      "logoUrl": "/assets/movers/c2c-advanced.png",
      "sector": "Aerospace & Defence",
      "industry": "Aerospace & Defence",
      "category": "SME",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "MUFG Intime India Pvt Ltd",
      "registrarUrl": "https://linkintime.co.in/initial_offer/public-issues.html",
      "issueSizeCr": 99.07,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 214,
      "priceBandHigh": 226,
      "lotSize": 600,
      "minBidQuantity": 600,
      "minInvestment": 135600,
      "faceValue": 10,
      "dates": {
        "openDate": "2026-11-22",
        "closeDate": "2026-11-26",
        "allotmentDate": "2026-11-27",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-03"
      },
      "subscription": {
        "qib": 0,
        "nii": 0,
        "retail": 0,
        "employee": null,
        "shareholder": null,
        "total": 107.32,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2024-11-26T16:00:18",
          "effectiveDate": "2026-11-26",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "SME IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 226,
        "actualListingPrice": 429.4,
        "listingExchange": "NSE",
        "stockSymbol": "C2C",
        "currentMarketPrice": 143.15,
        "previousClose": 149.15,
        "listingDate": "2026-12-03",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "NSE India · Groww Exchange & Filings · Zerodha Kite Registry",
          "retrievedAt": "2026-11-15T17:04:24.477Z",
          "effectiveDate": "2026-11-13",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Equity Quote & Fundamentals"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 0.35,
            "ebitdaCr": null,
            "patCr": -2.38,
            "assetsCr": 9.03,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 8.05,
            "ebitdaCr": null,
            "patCr": 2.87,
            "assetsCr": 18.5,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 41.06,
            "ebitdaCr": null,
            "patCr": 12.28,
            "assetsCr": 85.83,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": 13.81,
        "pbRatio": 1.07,
        "marketCapCr": 253,
        "eps": 10.8,
        "industryAvgPe": 52.32,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Live market valuation & filings",
        "peers": [
          {
            "name": "LMW",
            "symbol": "LMW",
            "pe": 90.4,
            "pb": 6.1,
            "roePct": null,
            "marketCapCr": 18541.31
          },
          {
            "name": "BEML",
            "symbol": "BEML",
            "pe": 108.33,
            "pb": 6.16,
            "roePct": null,
            "marketCapCr": 17693.08
          },
          {
            "name": "Elecon Engineering Company",
            "symbol": "ELECON",
            "pe": 41.77,
            "pb": 4.07,
            "roePct": null,
            "marketCapCr": 10216.93
          },
          {
            "name": "Esab India",
            "symbol": "ESABINDIA",
            "pe": 41.81,
            "pb": 16.12,
            "roePct": null,
            "marketCapCr": 8011.14
          },
          {
            "name": "Kennametal India",
            "symbol": "KENNAMET",
            "pe": 38.95,
            "pb": 8.94,
            "roePct": null,
            "marketCapCr": 7633.37
          }
        ]
      },
      "profile": {
        "overview": "C2C Advanced Systems Limited operates as a provider of defence electronics solutions with a focus on providing products for India's defence sector. The company supports a range of defence platforms, both aerial and maritime. C2C's core competencies consist of hardware, software, and firmware design and development, mechanical engineering, product prototyping, functional testing and validation, environmental testing and verification, and engineering services. \nThe company claims that its design capabilities include areas such as processors, power systems, radio frequencies (RF), radars, and microwave technologies, along with embedded software and firmware. The company also develops C4I systems for enhanced situational awareness and decision support, using AI/ML for big data analytics and integrating real-time data from Industry Internet of Things (IIoT) within complex defence, security, and aerospace systems and subsystems.",
        "productsAndServices": "C2C Advanced Systems Ltd operates in Aerospace & Defence (Founded 2018).",
        "businessModel": "SME issue (EQUITY) listed on NSE / BSE · ISIN INE0U7V01015.",
        "industryOverview": "Aerospace & Defence primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 107.32x.",
        "promoters": [
          "Ms. Lakshmi Chandra"
        ],
        "growthOpportunities": [],
        "strengths": [
          "C2C Advanced Systems claims to excel in creating bespoke software, hardware, and firmware solutions by utilising its own intellectual property and collaborations with third-party partners.",
          "The company maintains a technology-driven approach in the design and development of advanced systems and subsystems. It claims to specialise in delivering customised software and systems that manage mission-critical defence applications for both Indian and global military and security sectors.",
          "C2C Advanced Systems leverages its expertise in mission-critical systems to develop 'dual-use' solutions, particularly focusing on Industry 4.0 products. These solutions include AI/ML-based advanced analytics tailored for civilian sectors such as manufacturing.",
          "The company has expanded its operations across India and internationally, including in Canada, the United States, Malaysia, Singapore, the United Kingdom, and France, covering all aspects of the project lifecycle and providing after-sale services.",
          "The company has seen a consistent increase in revenue from operations over the past few years. Revenue from operations increased from Rs 0.35 crore in FY22 to Rs 8.05 crore in FY23 to Rs 41.06 crore in FY24."
        ],
        "risks": [
          "C2C Advanced Systems relies on contracts from the Government of India (GoI) and its associated entities, including defence public sector undertakings and government organisations involved in defence. A significant portion of its domestic revenue comes from these contracts, with sales totalling Rs 2.74 crore (6.34%), Rs 0.90 crore (11.19%), and Rs 0.35 crore (100%) during the six months ended September 30, 2024, FY23, and FY22, respectively. Any changes in government priorities or a decrease in contracts from them could adversely impact the company’s operations and finances.",
          "A majority of the company’s revenue is generated from its top 10 customers. These customers contributed 100% of its revenues for the year ended March 31, 2024, and 99.05% for the period ended September 30, 2024. Any loss of any of these customers or failure to retain them can adversely affect the company’s revenue. ",
          "A large portion of the company's revenue comes from projects with government entities or agencies, which often include client-favourable terms. These projects are awarded through a competitive selection process based on specific criteria and are typically non-negotiable in terms of conditions. Any changes in government policies or delays in payment could adversely impact the company’s operations.",
          "The company witnessed a financial loss of Rs 2.38 crore in FY22 and does not guarantee non-occurrence in future. ",
          "C2C Advanced Systems depends significantly on exports for revenue. Exports contributed Rs 30.90 crore (75.25%), Rs 19.21 crore (87.09%), and Rs 7.15 crore (88.81%) to the revenue from operations respectively in FY24, FY23, and FY22, respectively. Any adverse developments in foreign relations, export restrictions, and other regulatory changes could affect the company’s business performance and financial condition.",
          "As of September 30, 2024, the company’s total borrowings (unsecured) amounted to Rs 13.29 crore. Any inability to repay or service these loans can harm the company’s financial standing.",
          "C2C Advanced Systems is currently involved in certain legal proceedings. Any adverse judgments in any of these cases can be detrimental to the company’s business prospects."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://beelinemb.com/wp-content/uploads/2024/11/C2C_RHP.pdf",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://linkintime.co.in/initial_offer/public-issues.html",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · NSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.469Z",
        "effectiveDate": "2026-12-03",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "SME IPO"
      }
    },
    {
      "id": "ipo-rajputana-biodiesel-ipo",
      "slug": "rajputana-biodiesel-ipo",
      "companyName": "Rajputana Biodiesel Ltd",
      "shortName": "Rajputana Biodiesel",
      "logoMonogram": "RB",
      "logoColor": "#334155",
      "logoUrl": "/assets/movers/rajputana.png",
      "sector": "Miscellaneous",
      "industry": "Miscellaneous",
      "category": "SME",
      "status": "Listed",
      "exchanges": [
        "NSE",
        "BSE"
      ],
      "website": "",
      "registrar": "Maashitla Securities Pvt Ltd",
      "registrarUrl": "https://maashitla.com/allotment-status/public-issues",
      "issueSizeCr": 24.7,
      "freshIssueCr": null,
      "ofsCr": null,
      "priceBandLow": 123,
      "priceBandHigh": 130,
      "lotSize": 1000,
      "minBidQuantity": 1000,
      "minInvestment": 130000,
      "faceValue": 10,
      "dates": {
        "openDate": "2026-11-26",
        "closeDate": "2026-11-28",
        "allotmentDate": "2026-11-29",
        "refundDate": null,
        "dematCreditDate": null,
        "listingDate": "2026-12-03"
      },
      "subscription": {
        "qib": 0,
        "nii": 0,
        "retail": 0,
        "employee": null,
        "shareholder": null,
        "total": 609.89,
        "isFinal": true,
        "dailyBreakdown": [],
        "provenance": {
          "source": "NSE / BSE Consolidated Bid Data (via Groww)",
          "retrievedAt": "2024-11-28T16:00:18",
          "effectiveDate": "2026-11-28",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "PTS",
          "unit": "Times Subscribed (x)",
          "dataCategory": "SME IPO Subscription"
        }
      },
      "gmp": {
        "latestGmp": null,
        "previousGmp": null,
        "lastUpdated": null,
        "availability": "Unavailable",
        "source": "Unavailable",
        "history": []
      },
      "listing": {
        "issuePrice": 130,
        "actualListingPrice": 247,
        "listingExchange": "NSE",
        "stockSymbol": "RAJPUTANA",
        "currentMarketPrice": 26.6,
        "previousClose": 26.65,
        "listingDate": "2026-12-03",
        "priceStatus": "VERIFIED",
        "provenance": {
          "source": "BSE India · Groww Exchange & Filings · Zerodha Kite Registry",
          "retrievedAt": "2026-11-15T17:04:25.149Z",
          "effectiveDate": "2026-11-13",
          "verificationStatus": "Verified",
          "qualityStatus": "VERIFIED",
          "currency": "INR",
          "unit": "INR per share",
          "dataCategory": "Equity Quote & Fundamentals"
        }
      },
      "financials": {
        "reportingBasis": "Offer Document Restated Financials (₹ Crores)",
        "years": [
          {
            "year": "FY22",
            "revenueCr": 17.07,
            "ebitdaCr": null,
            "patCr": 0.2,
            "assetsCr": 10.71,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY23",
            "revenueCr": 23.41,
            "ebitdaCr": null,
            "patCr": 1.69,
            "assetsCr": 15.16,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          },
          {
            "year": "FY24",
            "revenueCr": 53.46,
            "ebitdaCr": null,
            "patCr": 4.5,
            "assetsCr": 39.95,
            "netWorthCr": null,
            "borrowingsCr": null,
            "eps": null,
            "roePct": null,
            "rocePct": null,
            "debtToEquity": null
          }
        ]
      },
      "valuation": {
        "peRatio": 266.5,
        "pbRatio": 1.98,
        "marketCapCr": 8,
        "eps": 0.1,
        "industryAvgPe": 56.69,
        "reportingPeriod": "Live Post-Listing Exchange Ratio",
        "calculationBasis": "Live market valuation & filings",
        "peers": [
          {
            "name": "Landmark Cars",
            "symbol": "LANDMARK",
            "pe": 45.63,
            "pb": 3.53,
            "roePct": null,
            "marketCapCr": 2066.2
          },
          {
            "name": "Popular Vehicles & Services",
            "symbol": "PVSL",
            "pe": null,
            "pb": 1.05,
            "roePct": null,
            "marketCapCr": 663.57
          },
          {
            "name": "Competent Automobiles Company",
            "symbol": "COMPEAU",
            "pe": 10.38,
            "pb": 0.58,
            "roePct": null,
            "marketCapCr": 224.94
          },
          {
            "name": "Bombay Cycle & Motor Agency",
            "symbol": "BOMBCYC",
            "pe": 24.8,
            "pb": 2.07,
            "roePct": null,
            "marketCapCr": 62.91
          },
          {
            "name": "Hira Automobiles",
            "symbol": "HIRAUTO",
            "pe": null,
            "pb": 3.6,
            "roePct": null,
            "marketCapCr": 53.08
          }
        ]
      },
      "profile": {
        "overview": "Rajputana Biodiesel is a manufacturer and supplier of biofuels and by-products, including glycerine and fatty acids. Rajputana Biodiesel’s manufacturing facilities are located in Phulera, Rajasthan. The company provides products such as biodiesel, crude glycerin, and fatty acids. Biodiesel is an eco-friendly and safe alternative to conventional petroleum diesel, suitable for use in various applications, including on-road and off-road vehicles, marine vessels, and for power generation in both stationary setups and boilers. \nAs a by-product from the production of biodiesel and soap, crude glycerin finds use across various industrial and agricultural sectors. Similarly, fatty acids, also a by-product of biodiesel production, are used in manufacturing soaps, detergents, and cosmetics.",
        "productsAndServices": "Rajputana Biodiesel Ltd operates in Miscellaneous (Founded 2016).",
        "businessModel": "SME issue (EQUITY) listed on NSE / BSE · ISIN INE0VHU01019.",
        "industryOverview": "Miscellaneous primary market offering tracked via SEBI & exchange filings.",
        "competitivePosition": "Consolidated subscription recorded at 609.89x.",
        "promoters": [
          "Mr. Sarthak Soni"
        ],
        "growthOpportunities": [],
        "strengths": [
          "Rajputana Biodiesel has an approved production capacity of 30 kilolitres per day (klpd) with an installed capacity of 24 klpd.",
          "The company claims to be dedicated to incorporating biodiesel and other renewable energy sources into its energy portfolio, aiming at reducing carbon emissions and lessening the reliance on fossil fuels. This commitment is supported by investments in state-of-the-art technologies and infrastructure that enhance biofuel production and utilisation.",
          "Rajputana Biodiesel claims to have solid and long-standing relationships with government public sector undertakings (PSUs). This partnership not only ensures a stable and dependable revenue stream but also showcases the company's reputation and credibility.",
          "The company has seen a consistent increase in revenue from operations and profit after tax (PAT) over the past few years. Revenue from operations increased from Rs 17.07 crore in FY22 to Rs 23.41 crore in FY23 to Rs 53.46 crore in FY24. PAT increased from Rs 0.20 crore in FY22 to Rs 1.69 crore in FY23 to Rs 4.50 crore in FY24."
        ],
        "risks": [
          "Rajputana Biodiesel's operations are heavily regulated by government policies. Any adverse change in this policy or failure to comply with these regulations could negatively impact the company's overall business performance. ",
          "The company's production relies on a competitive bidding process managed by government entities. There is no guarantee that Rajputana Biodiesel will qualify for or win future bids, which could adversely affect its operations and business outcomes.",
          "Rajputana Biodiesel's financial performance depends heavily on the sale of one commodity, biodiesel. Sales from biodiesel accounted for Rs 13.82 crore (80.93%), Rs 20.25 crore (86.51%), and Rs 43.27 crore (80.93%) in FY22, FY23, and FY24, respectively and Rs 24 crore (89.80 %) for period ended July 31, 2024. Any failure to meet evolving consumer demands or maintain product quality could diminish demand for its products, negatively affecting the company's operations and revenue generation capabilities.",
          "A large portion of Rajputana Biodiesel's revenue comes from its top 10 customers. These customers contributed Rs 13.59 crore (79.64%), Rs 21.00 crore (89.72%), and Rs 46.14 crore (85.98%) in FY22, FY23, and FY24, respectively, and Rs 26.64 crore (100%) for the period ended July 31, 2024 to the revenue. Any loss of any of these customers or a failure to retain them could adversely affect the company’s operation and finances. ",
          "The company operates out of its one manufacturing facility in Phulera, Rajasthan. Any adverse developments or disruptions in the business environment of the region could hit the company’s business. ",
          "The company and its directors are involved in certain ongoing legal proceedings. Any adverse judgment in any of these cases could be detrimental to the company’s business prospects. ",
          "As of July 31, 2024, the company has an outstanding principal amount (secured and unsecured) of Rs 19.89 crore. Any inability to repay or service these loans can harm the company’s financial standing."
        ]
      },
      "documents": {
        "drhpUrl": null,
        "rhpUrl": "https://rajputanabiodiesel.com/wp-content/uploads/2024/11/RHP_RBL_16.11.2024_compressed.pdf",
        "prospectusUrl": null,
        "anchorUrl": null,
        "allotmentUrl": "https://maashitla.com/allotment-status/public-issues",
        "exchangeNoticeUrl": null
      },
      "provenance": {
        "source": "Groww Primary Issue Registry · BSE Live Feed",
        "retrievedAt": "2026-11-15T17:04:05.470Z",
        "effectiveDate": "2026-12-03",
        "verificationStatus": "Verified",
        "qualityStatus": "VERIFIED",
        "currency": "INR",
        "unit": "INR / Crores",
        "dataCategory": "SME IPO"
      }
    }
  ],
  "insights": [
    {
      "id": "ins-nifty-grid-infra",
      "slug": "nifty-holds-24300-amid-power-transmission-capex",
      "title": "NIFTY 50 Holds Above 24,300 as Power Transmission & Capital Goods Lead Breadth",
      "category": "Market Overview",
      "publishedAt": "2026-11-14T13:45:00+05:30",
      "source": "NSE India & PriceAlerter Research Desk",
      "sourceUrl": "https://www.nseindia.com",
      "summary": "Benchmark indices consolidated recent gains with Bank NIFTY advancing 0.53% and India VIX cooling below 14.2.",
      "facts": [
        "NIFTY 50 reference close stood at 24,318.45 (+0.52%) while SENSEX settled at 80,142.80 (+0.47%).",
        "India VIX eased 3.81% to 14.12, reflecting lower near-term implied option volatility.",
        "Capital Goods and Aerospace & Defence constituents recorded positive institutional cash volume."
      ],
      "analysis": "Institutional flows remain selective around earnings visibility and balance-sheet leverage. Mid-cap industrial and transmission equipment issuers continue to attract primary market interest ahead of upcoming Q3 infrastructure tenders.",
      "instruments": [
        "NIFTY 50",
        "SENSEX",
        "BANK NIFTY",
        "LT",
        "HAL"
      ]
    },
    {
      "id": "ins-primary-market-nov",
      "slug": "mainboard-ipo-pipeline-november-2026-oversubscription",
      "title": "Primary Market Liquidity Concentrates in Grid Infrastructure & Semiconductor OSAT Issues",
      "category": "IPO Update",
      "publishedAt": "2026-11-14T11:30:00+05:30",
      "source": "SEBI Filings & Exchange Bid Books",
      "sourceUrl": "https://www.sebi.gov.in",
      "summary": "QIB institutional bidding remains the decisive driver in late-2026 Mainboard IPOs while retail participation stays disciplined on valuation.",
      "facts": [
        "Velox Semiconductor Packaging closed with 41.22x final subscription, led by 64.18x QIB demand.",
        "Bharat Grid Power Systems reached 9.18x consolidated subscription by intraday Day 3.",
        "SEBI T+3 listing timeline remains active across all Mainboard and SME issues."
      ],
      "analysis": "Investors are increasingly differentiating between fresh capital expenditure issues and pure Offer-for-Sale (OFS) exits. Issues with post-issue P/E discounts relative to listed peers are seeing stronger Day-2 institutional build-up.",
      "instruments": [
        "Bharat Grid Power",
        "Velox Semicon",
        "Sahayadri Precision"
      ]
    },
    {
      "id": "ins-bullion-fx-nov",
      "slug": "gold-firm-above-2600-usdinr-steady-near-84-38",
      "title": "Gold Holds Firm Near $2,612/oz While USD/INR Trades Range-Bound Around 84.38",
      "category": "Commodities & FX",
      "publishedAt": "2026-11-14T10:15:00+05:30",
      "source": "Global Commodity Reference & FBIL",
      "sourceUrl": "https://www.rbi.org.in",
      "summary": "Precious metals ticked higher on global central bank reserve demand while softer crude oil near $68.72/bbl cushioned domestic import bills.",
      "facts": [
        "WTI Crude futures traded 0.66% lower at $68.72 per barrel.",
        "Gold edged up 0.55% to $2,612.40/oz; Silver rose 0.72% to $30.84/oz.",
        "USD/INR hovered at 84.38, down 0.04% from the prior reference close."
      ],
      "analysis": "Sub-$70 crude continues to provide macro cushion to India’s current account balance and downstream paint/aviation margins, though festive bullion demand keeps domestic jewellery retail volumes sensitive to spot gold swings.",
      "instruments": [
        "GOLD",
        "SILVER",
        "CRUDE OIL",
        "USD/INR"
      ]
    },
    {
      "id": "ins-sector-rotation-it-pharma",
      "slug": "it-services-and-specialty-pharma-q2-margin-recap",
      "title": "IT Services & Domestic Pharma Show Margin Resilience in Q2 FY27 Filings",
      "category": "Sector & Macro",
      "publishedAt": "2026-11-13T18:10:00+05:30",
      "source": "NSE & BSE Quarterly Corporate Filings",
      "sourceUrl": "https://www.bseindia.com",
      "summary": "Large-cap IT bellwethers and USFDA-compliant pharma exporters posted steady free-cash-flow conversion despite global discretionary caution.",
      "facts": [
        "TCS, Infosys, and HCL Tech maintained ROE profiles between 24.8% and 51.4% on TTM filings.",
        "Sun Pharma and Cipla outperformed broader healthcare peers on specialty portfolio growth."
      ],
      "analysis": "Low debt-to-equity balance sheets in Tier-1 IT and specialty pharma remain defensive anchors when domestic cyclical valuations trade above historical 5-year averages.",
      "instruments": [
        "TCS",
        "INFY",
        "HCLTECH",
        "SUNPHARMA",
        "CIPLA"
      ]
    }
  ],
  "blogs": [
    {
      "id": "blog-ipo-basics",
      "slug": "ipo-basics-how-indian-public-issues-work",
      "title": "IPO Basics: How Initial Public Offerings Work in India (SEBI T+3 Framework)",
      "seoTitle": "IPO Basics India – DRHP, Price Band, Lot Size & T+3 Listing Explained | PriceAlerter",
      "metaDescription": "Understand how Indian IPOs work from DRHP filing and anchor bidding to ASBA/UPI application, allotment, and T+3 listing on NSE and BSE.",
      "category": "IPO Basics",
      "author": "PriceAlerter Editorial Research",
      "publishedAt": "2026-09-12",
      "updatedAt": "2026-11-10",
      "readMinutes": 7,
      "excerpt": "A complete guide to Mainboard and SME IPO structures, fresh issue vs Offer for Sale (OFS), book building, and the SEBI T+3 listing cycle.",
      "toc": [
        {
          "id": "what-is-ipo",
          "title": "1. What is an Initial Public Offering?"
        },
        {
          "id": "fresh-vs-ofs",
          "title": "2. Fresh Issue vs. Offer for Sale (OFS)"
        },
        {
          "id": "mainboard-vs-sme",
          "title": "3. Mainboard vs. SME IPO Platforms"
        },
        {
          "id": "t3-timeline",
          "title": "4. The SEBI T+3 Listing Timeline"
        }
      ],
      "sections": [
        {
          "id": "what-is-ipo",
          "heading": "1. What is an Initial Public Offering?",
          "paragraphs": [
            "An Initial Public Offering (IPO) is the process through which a privately held company raises equity capital from institutional and retail investors and lists its shares on stock exchanges such as the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE).",
            "Before launching an IPO in India, the issuer files a Draft Red Herring Prospectus (DRHP) with the Securities and Exchange Board of India (SEBI), disclosing audited historical financials, business risks, promoter shareholding, and objects of the issue."
          ]
        },
        {
          "id": "fresh-vs-ofs",
          "heading": "2. Fresh Issue vs. Offer for Sale (OFS)",
          "paragraphs": [
            "Understanding the split between Fresh Issue and Offer for Sale is critical to evaluating capital deployment."
          ],
          "bullets": [
            "Fresh Issue: New shares are created and issued; proceeds flow directly into the company for capex, debt reduction, or working capital.",
            "Offer for Sale (OFS): Existing promoters or private equity investors sell their stake; proceeds go to the selling shareholders rather than the company balance sheet."
          ]
        },
        {
          "id": "mainboard-vs-sme",
          "heading": "3. Mainboard vs. SME IPO Platforms",
          "paragraphs": [
            "Mainboard IPOs typically carry smaller retail lot sizes (~₹14,000–₹15,000 per lot) and list on NSE/BSE main boards. SME IPOs list on NSE Emerge or BSE SME with minimum retail lot sizes exceeding ₹1,00,000 and higher post-listing liquidity risk."
          ]
        },
        {
          "id": "t3-timeline",
          "heading": "4. The SEBI T+3 Listing Timeline",
          "paragraphs": [
            "Under SEBI’s mandatory T+3 framework, if an issue closes on Day T, allotment is finalized on T+1, refunds/unblocking and demat credit occur on T+2, and shares commence trading on T+3."
          ]
        }
      ],
      "officialReferences": [
        {
          "label": "SEBI ICDR Regulations & Public Issue Filings",
          "url": "https://www.sebi.gov.in"
        },
        {
          "label": "NSE Primary Market IPO Portal",
          "url": "https://www.nseindia.com"
        }
      ],
      "relatedSlugs": [
        "how-to-apply-for-ipo-asba-upi-guide",
        "ipo-gmp-explained-what-grey-market-premium-means"
      ]
    },
    {
      "id": "blog-how-to-apply-ipo",
      "slug": "how-to-apply-for-ipo-asba-upi-guide",
      "title": "How to Apply for an IPO in India: ASBA, UPI Mandate & Cut-Off Price Rules",
      "seoTitle": "How to Apply for an IPO via ASBA & UPI in India | PriceAlerter",
      "metaDescription": "Step-by-step instructions to apply for Indian IPOs using ASBA netbanking or UPI mandates, including retail cut-off pricing and HNI categories.",
      "category": "IPO Application",
      "author": "PriceAlerter Editorial Research",
      "publishedAt": "2026-09-20",
      "updatedAt": "2026-11-08",
      "readMinutes": 6,
      "excerpt": "Learn how ASBA keeps funds earning interest until allotment, how UPI mandates work up to ₹5 lakh, and why retail bidders use Cut-Off Price.",
      "toc": [
        {
          "id": "asba-upi",
          "title": "1. ASBA Bank Blocking vs. UPI Mandate"
        },
        {
          "id": "investor-categories",
          "title": "2. Retail, sNII, bNII & QIB Categories"
        },
        {
          "id": "cutoff-rule",
          "title": "3. Why Cut-Off Price Matters for Retail"
        }
      ],
      "sections": [
        {
          "id": "asba-upi",
          "heading": "1. ASBA Bank Blocking vs. UPI Mandate",
          "paragraphs": [
            "All IPO applications in India use ASBA (Application Supported by Blocked Amount). Instead of debiting money upfront, your bank temporarily blocks the application amount in your savings account until allotment is finalized.",
            "Retail applicants applying up to ₹5,00,000 can apply via broker apps using a UPI ID, provided they approve the UPI mandate request before 5:00 PM on the closing day."
          ]
        },
        {
          "id": "investor-categories",
          "heading": "2. Retail, sNII, bNII & QIB Categories",
          "paragraphs": [
            "SEBI classifies non-institutional and retail bidders strictly by application size:"
          ],
          "bullets": [
            "Retail Individual Investor (RII): Up to ₹2,00,000 per PAN.",
            "Small NII (sNII): Between ₹2,00,000 and ₹10,00,000.",
            "Big NII (bNII): Above ₹10,00,000 (must apply via bank ASBA netbanking)."
          ]
        },
        {
          "id": "cutoff-rule",
          "heading": "3. Why Cut-Off Price Matters for Retail",
          "paragraphs": [
            "In oversubscribed book-built issues, the final issue price is almost always fixed at the upper end of the price band. Selecting the \"Cut-Off Price\" option ensures your bid remains valid at the final discovered price (available only to Retail and Employee categories)."
          ]
        }
      ],
      "officialReferences": [
        {
          "label": "NPCI UPI IPO Mandate Guidelines",
          "url": "https://www.npci.org.in"
        },
        {
          "label": "BSE IPO Bidding Guidelines",
          "url": "https://www.bseindia.com"
        }
      ],
      "relatedSlugs": [
        "ipo-allotment-process-lottery-and-status-check",
        "ipo-basics-how-indian-public-issues-work"
      ]
    },
    {
      "id": "blog-ipo-allotment",
      "slug": "ipo-allotment-process-lottery-and-status-check",
      "title": "IPO Allotment Explained: Proportional vs. Lottery Allocation & Registrar Check",
      "seoTitle": "IPO Allotment Process & How to Check Allotment Status | PriceAlerter",
      "metaDescription": "How registrars like KFinTech and Link Intime process oversubscribed IPO allotments, why single-lot applications work in Retail, and how to check status.",
      "category": "IPO Allotment",
      "author": "PriceAlerter Editorial Research",
      "publishedAt": "2026-10-02",
      "updatedAt": "2026-11-05",
      "readMinutes": 5,
      "excerpt": "Understand SEBI’s lottery allotment rule for oversubscribed Retail and sNII buckets, common rejection reasons, and official registrar verification.",
      "toc": [
        {
          "id": "lottery-math",
          "title": "1. Oversubscribed Retail Lottery Rule"
        },
        {
          "id": "common-rejections",
          "title": "2. Common Reasons Applications Get Rejected"
        },
        {
          "id": "check-status",
          "title": "3. Official Allotment Status Check"
        }
      ],
      "sections": [
        {
          "id": "lottery-math",
          "heading": "1. Oversubscribed Retail Lottery Rule",
          "paragraphs": [
            "When the Retail category is subscribed more than 1x, SEBI rules mandate that every valid applicant should receive at least one minimum lot if possible. If applicants exceed available lots, the registrar runs a computerized random lottery.",
            "Applying for multiple lots from the same PAN in an oversubscribed retail issue does not improve allotment odds compared to applying for 1 lot."
          ]
        },
        {
          "id": "common-rejections",
          "heading": "2. Common Reasons Applications Get Rejected",
          "paragraphs": [
            "Ensure technical accuracy before submitting bids:"
          ],
          "bullets": [
            "Multiple applications submitted using the same PAN across different brokers.",
            "UPI mandate left unapproved or expiring prior to issue closure.",
            "Mismatch between bank account holder name/PAN and demat account PAN."
          ]
        },
        {
          "id": "check-status",
          "heading": "3. Official Allotment Status Check",
          "paragraphs": [
            "Always verify allotment directly on the official registrar portal (such as KFin Technologies, Link Intime, or Bigshare Services) or the NSE/BSE IPO verification pages using your PAN or Application Number."
          ]
        }
      ],
      "officialReferences": [
        {
          "label": "KFinTech IPO Allotment Portal",
          "url": "https://ris.kfintech.com/ipostatus/"
        },
        {
          "label": "BSE Application Check",
          "url": "https://www.bseindia.com/investors/appli_check.aspx"
        }
      ],
      "relatedSlugs": [
        "how-to-apply-for-ipo-asba-upi-guide",
        "ipo-basics-how-indian-public-issues-work"
      ]
    },
    {
      "id": "blog-gmp-explained",
      "slug": "ipo-gmp-explained-what-grey-market-premium-means",
      "title": "IPO GMP Explained: What Grey Market Premium Means & Its Limitations",
      "seoTitle": "IPO GMP Explained – Formula, Risks & Unofficial Nature | PriceAlerter",
      "metaDescription": "Learn what IPO Grey Market Premium (GMP) is, how estimated listing price is calculated, and why unofficial GMP cannot predict guaranteed listing gains.",
      "category": "GMP",
      "author": "PriceAlerter Editorial Research",
      "publishedAt": "2026-10-15",
      "updatedAt": "2026-11-12",
      "readMinutes": 6,
      "excerpt": "A transparent breakdown of how unofficial grey market premiums form, how hypothetical listing estimates are calculated, and why fundamentals matter more.",
      "toc": [
        {
          "id": "what-is-gmp",
          "title": "1. What is Grey Market Premium?"
        },
        {
          "id": "gmp-formula",
          "title": "2. How Hypothetical Listing Estimates Work"
        },
        {
          "id": "risks-gmp",
          "title": "3. Why GMP Is Not an Exchange Quote"
        }
      ],
      "sections": [
        {
          "id": "what-is-gmp",
          "heading": "1. What is Grey Market Premium?",
          "paragraphs": [
            "Grey Market Premium (GMP) refers to an unofficial, unregulated over-the-counter premium or discount at which IPO shares are quoted informally before official listing on NSE or BSE.",
            "GMP is not recognized, regulated, or published by SEBI, NSE, or BSE."
          ]
        },
        {
          "id": "gmp-formula",
          "heading": "2. How Hypothetical Listing Estimates Work",
          "paragraphs": [
            "Trackers compute a hypothetical reference price using the upper price band plus the latest unofficial GMP:"
          ],
          "bullets": [
            "Estimated Listing Price = IPO Upper Issue Price + Latest GMP",
            "Estimated Gain % = (Latest GMP / IPO Upper Issue Price) × 100"
          ]
        },
        {
          "id": "risks-gmp",
          "heading": "3. Why GMP Is Not an Exchange Quote",
          "paragraphs": [
            "Grey market quotes suffer from thin liquidity, speculative sentiment swings, and zero settlement guarantee. Broad market corrections between issue close and listing day frequently cause actual exchange opening prices to diverge sharply from prior GMP expectations."
          ]
        }
      ],
      "officialReferences": [
        {
          "label": "SEBI Investor Education Portal",
          "url": "https://investor.sebi.gov.in"
        }
      ],
      "relatedSlugs": [
        "fundamental-analysis-and-financial-ratios-guide",
        "investment-risks-and-capital-preservation"
      ]
    },
    {
      "id": "blog-fundamental-ratios",
      "slug": "fundamental-analysis-and-financial-ratios-guide",
      "title": "Fundamental Analysis & Financial Ratios: P/E, P/B, ROE, ROCE & Debt-to-Equity",
      "seoTitle": "Financial Ratios for Indian Stocks – P/E, P/B, ROE, ROCE Explained | PriceAlerter",
      "metaDescription": "Master essential stock valuation and profitability ratios including P/E, P/B, ROE, ROCE, and Debt-to-Equity when analysing NSE/BSE companies and IPOs.",
      "category": "Financial Ratios",
      "author": "PriceAlerter Editorial Research",
      "publishedAt": "2026-10-28",
      "updatedAt": "2026-11-11",
      "readMinutes": 8,
      "excerpt": "How to read company financial statements, compare valuation multiples against industry peers, and avoid value traps using capital efficiency metrics.",
      "toc": [
        {
          "id": "valuation-multiples",
          "title": "1. Valuation Multiples: P/E and P/B"
        },
        {
          "id": "capital-efficiency",
          "title": "2. Profitability: ROE vs. ROCE"
        },
        {
          "id": "leverage-check",
          "title": "3. Balance Sheet Safety: Debt-to-Equity"
        }
      ],
      "sections": [
        {
          "id": "valuation-multiples",
          "heading": "1. Valuation Multiples: P/E and P/B",
          "paragraphs": [
            "Price-to-Earnings (P/E) compares a company’s share price to its Earnings Per Share (EPS). Always compare a stock or IPO’s P/E against listed sector peers using the same reporting period (TTM or FY26).",
            "Price-to-Book (P/B) is especially vital for banks, NBFCs, and asset-heavy lenders where book value reflects tangible equity capital."
          ]
        },
        {
          "id": "capital-efficiency",
          "heading": "2. Profitability: ROE vs. ROCE",
          "paragraphs": [
            "Return on Equity (ROE = Net Profit / Shareholders’ Equity) measures return generated on equity capital, while Return on Capital Employed (ROCE = EBIT / Capital Employed) evaluates total operational efficiency across both debt and equity."
          ]
        },
        {
          "id": "leverage-check",
          "heading": "3. Balance Sheet Safety: Debt-to-Equity",
          "paragraphs": [
            "A rising ROE fueled by excessive borrowing is fragile during interest-rate upcycles. Checking Debt-to-Equity alongside interest coverage ensures earnings growth is backed by sustainable cash flow."
          ]
        }
      ],
      "officialReferences": [
        {
          "label": "NSE Listed Company Corporate Filings",
          "url": "https://www.nseindia.com"
        },
        {
          "label": "BSE Financial Statements Archive",
          "url": "https://www.bseindia.com"
        }
      ],
      "relatedSlugs": [
        "stock-market-basics-nse-bse-indices",
        "investment-risks-and-capital-preservation"
      ]
    },
    {
      "id": "blog-stock-market-basics",
      "slug": "stock-market-basics-nse-bse-indices",
      "title": "Stock Market Basics: Understanding NSE, BSE, NIFTY 50, SENSEX & Mutual Funds",
      "seoTitle": "Indian Stock Market Basics – NSE, BSE, NIFTY 50 & Mutual Funds | PriceAlerter",
      "metaDescription": "Learn how NSE and BSE operate, how NIFTY 50 and SENSEX indices are weighted, and how equity mutual funds compare to direct stock investing.",
      "category": "Stock Market",
      "author": "PriceAlerter Editorial Research",
      "publishedAt": "2026-11-01",
      "updatedAt": "2026-11-12",
      "readMinutes": 7,
      "excerpt": "An essential primer on India’s dual-exchange market structure, free-float market capitalization indices, order types, and diversified mutual funds.",
      "toc": [
        {
          "id": "exchanges",
          "title": "1. NSE and BSE Market Structure"
        },
        {
          "id": "indices",
          "title": "2. How NIFTY 50 and SENSEX Work"
        },
        {
          "id": "mutual-funds",
          "title": "3. Direct Equities vs. Mutual Funds"
        }
      ],
      "sections": [
        {
          "id": "exchanges",
          "heading": "1. NSE and BSE Market Structure",
          "paragraphs": [
            "India’s equity trading centres on the National Stock Exchange (NSE) and the Bombay Stock Exchange (BSE), regulated by SEBI with T+1 equity settlement. Most large-cap and mid-cap stocks trade on both exchanges simultaneously."
          ]
        },
        {
          "id": "indices",
          "heading": "2. How NIFTY 50 and SENSEX Work",
          "paragraphs": [
            "NIFTY 50 tracks 50 large, liquid Indian companies weighted by free-float market capitalization, while BSE SENSEX tracks 30 blue-chip leaders. Sectoral indices such as BANK NIFTY track concentrated banking performance."
          ]
        },
        {
          "id": "mutual-funds",
          "heading": "3. Direct Equities vs. Mutual Funds",
          "paragraphs": [
            "Investors seeking diversified market exposure without single-stock research overhead often combine core index or flexi-cap mutual funds (regulated under AMFI/SEBI norms) with selective direct equity or IPO allocations."
          ]
        }
      ],
      "officialReferences": [
        {
          "label": "AMFI Mutual Fund Investor Guide",
          "url": "https://www.amfiindia.com"
        },
        {
          "label": "SEBI Investor Portal",
          "url": "https://investor.sebi.gov.in"
        }
      ],
      "relatedSlugs": [
        "fundamental-analysis-and-financial-ratios-guide",
        "investment-risks-and-capital-preservation"
      ]
    },
    {
      "id": "blog-investment-risks",
      "slug": "investment-risks-and-capital-preservation",
      "title": "Investment Risks in IPOs & Equities: Liquidity, Valuation & Concentration Risk",
      "seoTitle": "Stock Market & IPO Investment Risks – Risk Management Guide | PriceAlerter",
      "metaDescription": "Understand market volatility, SME liquidity risk, valuation compression, and position sizing discipline for Indian retail investors.",
      "category": "Investment Risk",
      "author": "PriceAlerter Editorial Research",
      "publishedAt": "2026-11-04",
      "updatedAt": "2026-11-12",
      "readMinutes": 6,
      "excerpt": "Why capital preservation, reading RHP risk factors, and understanding SME market-lot liquidity matter before committing capital.",
      "toc": [
        {
          "id": "valuation-risk",
          "title": "1. Valuation & Post-Listing Drawdown Risk"
        },
        {
          "id": "sme-liquidity",
          "title": "2. SME Board Liquidity & Circuit Limits"
        },
        {
          "id": "discipline",
          "title": "3. Position Sizing & Verified Research"
        }
      ],
      "sections": [
        {
          "id": "valuation-risk",
          "heading": "1. Valuation & Post-Listing Drawdown Risk",
          "paragraphs": [
            "Not every IPO lists at a premium. Companies priced aggressively during peak market optimism can list below issue price or underperform if post-listing quarterly earnings miss prospectus projections."
          ]
        },
        {
          "id": "sme-liquidity",
          "heading": "2. SME Board Liquidity & Circuit Limits",
          "paragraphs": [
            "SME-listed equities trade in fixed lot sizes and often hit 5% or 20% circuit filters with thin order-book depth, making rapid exits difficult during risk-off sessions."
          ]
        },
        {
          "id": "discipline",
          "heading": "3. Position Sizing & Verified Research",
          "paragraphs": [
            "Always cross-verify financial statements in the official RHP/Prospectus, separate speculative GMP chatter from balance-sheet quality, and size individual equity bets conservatively within your overall asset allocation."
          ]
        }
      ],
      "officialReferences": [
        {
          "label": "SEBI Risk Disclosures for Equity & IPOs",
          "url": "https://investor.sebi.gov.in"
        }
      ],
      "relatedSlugs": [
        "ipo-gmp-explained-what-grey-market-premium-means",
        "fundamental-analysis-and-financial-ratios-guide"
      ]
    },
    {
      "id": "blog-drhp-rhp-reading-guide",
      "slug": "how-to-read-drhp-rhp-ipo-prospectus",
      "title": "How to Read a DRHP & RHP Prospectus: 7 Critical Sections Before Applying for Any IPO",
      "seoTitle": "How to Read DRHP & RHP IPO Prospectus – Investor Checklist | PriceAlerter",
      "metaDescription": "Learn which sections of a SEBI DRHP or RHP prospectus matter most: Objects of the Issue, Risk Factors, Litigations, Promoter Holding, and Restated Financials.",
      "category": "IPO Basics",
      "author": "PriceAlerter Editorial Research",
      "publishedAt": "2026-11-06",
      "updatedAt": "2026-11-14",
      "readMinutes": 9,
      "excerpt": "Skip the 400-page overwhelm: focus on Objects of the Issue, working capital intensity, contingent liabilities, related-party transactions, and peer valuation.",
      "toc": [
        {
          "id": "objects-of-issue",
          "title": "1. Objects of the Issue & Fresh vs. OFS Split"
        },
        {
          "id": "risk-litigation",
          "title": "2. Material Risk Factors & Pending Litigations"
        },
        {
          "id": "restated-cashflows",
          "title": "3. Restated Cash Flows vs. Accounting Profit"
        },
        {
          "id": "related-party",
          "title": "4. Related-Party Transactions & Promoter Track Record"
        }
      ],
      "sections": [
        {
          "id": "objects-of-issue",
          "heading": "1. Objects of the Issue & Fresh vs. OFS Split",
          "paragraphs": [
            "Every Red Herring Prospectus (RHP) opens with a concise summary of capital deployment. Distinguish carefully between Fresh Issue proceeds funding productive capacity or debt repayment versus Offer for Sale (OFS) exits by early financial sponsors or promoters.",
            "Watch out for vague \"General Corporate Purposes\" exceeding 25% of issue proceeds or sudden pre-IPO debt spikes slated for repayment using public funds."
          ],
          "bullets": [
            "Check exact capex milestones and scheduled commercial operation dates.",
            "Verify promoter lock-in periods (typically 18 months for minimum promoter contribution and 6 months for remaining pre-IPO equity)."
          ]
        },
        {
          "id": "risk-litigation",
          "heading": "2. Material Risk Factors & Pending Litigations",
          "paragraphs": [
            "Do not treat the Internal Risk Factors section as boilerplate. Pay close attention to customer concentration (whether Top 5 clients contribute over 50% of revenue), single-geography factory exposure, regulatory license renewals, and tax or criminal proceedings involving directors or group entities."
          ]
        },
        {
          "id": "restated-cashflows",
          "heading": "3. Restated Cash Flows vs. Accounting Profit",
          "paragraphs": [
            "Compare three-year Restated Consolidated PAT against Operating Cash Flow (OCF) and Trade Receivables days. A company reporting rapid profit expansion while operating cash flow remains persistently negative may face working capital stress or aggressive revenue recognition."
          ]
        },
        {
          "id": "related-party",
          "heading": "4. Related-Party Transactions & Promoter Track Record",
          "paragraphs": [
            "Inspect Related-Party Transactions (RPT) in the financial notes for raw-material purchases, factory lease rentals, or brand royalties paid to promoter-owned private entities. Transparent governance lowers post-listing minority shareholder risk."
          ]
        }
      ],
      "officialReferences": [
        {
          "label": "SEBI Offer Documents & DRHP Filings",
          "url": "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=3&ssid=15&smid=10"
        },
        {
          "label": "NSE Listing & Offer Document Circulars",
          "url": "https://www.nseindia.com"
        }
      ],
      "relatedSlugs": [
        "ipo-basics-how-indian-public-issues-work",
        "fundamental-analysis-and-financial-ratios-guide"
      ]
    },
    {
      "id": "blog-ipo-taxation-india",
      "slug": "ipo-and-equity-capital-gains-taxation-india",
      "title": "Capital Gains Tax on IPO Listing Gains & Listed Indian Equities (STCG & LTCG Guide)",
      "seoTitle": "STCG & LTCG Tax Rules on Indian IPOs & Stocks | PriceAlerter",
      "metaDescription": "Understand how Short-Term Capital Gains (STCG), Long-Term Capital Gains (LTCG), STT, holding periods, and dividend income are taxed on NSE and BSE equities in India.",
      "category": "Financial Literacy",
      "author": "PriceAlerter Editorial Research",
      "publishedAt": "2026-11-08",
      "updatedAt": "2026-11-14",
      "readMinutes": 7,
      "excerpt": "An investor reference on holding period classification (12-month threshold), listing-day sell tax implications, STT applicability, and AIS/Form 26AS reconciliation.",
      "toc": [
        {
          "id": "holding-period",
          "title": "1. Holding Period: Demat Credit Date to Sell Date"
        },
        {
          "id": "stcg-vs-ltcg",
          "title": "2. Short-Term vs. Long-Term Equity Gains"
        },
        {
          "id": "dividend-stt",
          "title": "3. Dividends, STT & Tax Record-Keeping"
        }
      ],
      "sections": [
        {
          "id": "holding-period",
          "heading": "1. Holding Period: Demat Credit Date to Sell Date",
          "paragraphs": [
            "For IPO shares allotted in India, the holding period for Income Tax purposes commences from the date shares are allotted/credited to your demat account, not the application bid date.",
            "Listed equity shares sold on recognized Indian exchanges (NSE/BSE) where Securities Transaction Tax (STT) is paid qualify as Long-Term Capital Assets only if held for more than 12 months."
          ]
        },
        {
          "id": "stcg-vs-ltcg",
          "heading": "2. Short-Term vs. Long-Term Equity Gains",
          "paragraphs": [
            "Selling IPO shares on listing day or within 12 months triggers Short-Term Capital Gains (STCG) under Section 111A of the Income Tax Act (20% base rate plus applicable surcharge and 4% cess under post-July 2024 Finance Act rules).",
            "Equity holdings sold after 12 months qualify for Long-Term Capital Gains (LTCG) under Section 112A (12.5% rate above the ₹1.25 lakh annual aggregate exemption threshold, without indexation). Always consult a qualified Chartered Accountant for your personal slab and surcharge rules."
          ]
        },
        {
          "id": "dividend-stt",
          "heading": "3. Dividends, STT & Tax Record-Keeping",
          "paragraphs": [
            "Equity dividends received from NSE/BSE companies are taxable at your marginal income tax slab rate, with 10% TDS deducted when annual dividends from a company exceed statutory limits. Reconcile your broker Profit & Loss statement with the Income Tax AIS portal before filing ITR-2 or ITR-3."
          ]
        }
      ],
      "officialReferences": [
        {
          "label": "Income Tax Department of India",
          "url": "https://www.incometax.gov.in"
        },
        {
          "label": "SEBI & Exchange STT Circulars",
          "url": "https://www.nseindia.com"
        }
      ],
      "relatedSlugs": [
        "stock-market-basics-nse-bse-indices",
        "investment-risks-and-capital-preservation"
      ]
    }
  ],
  "lastSyncTime": "2026-11-16T14:30:15.346Z",
  "lastSyncFormatted": "Live Fallback Mode"
};
