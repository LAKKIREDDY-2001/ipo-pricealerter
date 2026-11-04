#!/usr/bin/env python3
"""
scripts/sync_market_data.py

Autonomous Market Data & IPO Price Sync Engine for PriceAlerter.in.
Executes every 10 minutes via GitHub Actions and local scheduled sidecars.

Zero Human Involvement Pipeline:
1. Fetches real-time market data for:
   - Top Gainers (Muthoot Finance, Hitachi Energy, Vedanta, BEL, Hindustan Zinc, Adani Enterprises)
   - Market Shakers / Volume Breakouts (Fractal Analytics, Awfis, Faze Three, Alembic Pharma, Saregama, R Systems)
   - Top Losers (Siemens Energy, Power Grid, PNB, SBI, Union Bank, Asian Paints)
   - Active IPOs & Market Debuts (Antala Industries, Vedant Poly Fabs, Zepto, Razorpay, Swiggy, NTPC Green)
2. Uses TAPETIDE_TOKEN if provided (from env or secrets); seamlessly falls back to direct financial quote feeds.
3. Compares fetched live data against local state.
4. Atomically updates:
   - data/live-market-data.json (centralized live quotes feed for the frontend)
   - data/ipo-data.js (live GMP, issue price, and listing prices)
   - app.js (static fallback constants for gainers, losers, and shakers)
"""

import sys
import os
import json
import math
import re
import time
import argparse
import urllib.request
import urllib.parse
import ssl
from datetime import datetime, timezone, timedelta

# IST Timezone (UTC + 5:30)
IST = timezone(timedelta(hours=5, minutes=30))

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data")
LIVE_DATA_FILE = os.path.join(DATA_DIR, "live-market-data.json")
IPO_DATA_FILE = os.path.join(DATA_DIR, "ipo-data.js")
APP_JS_FILE = os.path.join(ROOT_DIR, "app.js")

# Stock definitions with official exchange symbols
TRACKED_GAINERS = [
    {
        "symbol": "MUTHOOTFIN",
        "ticker": "MUTHOOTFIN.NS",
        "name": "Muthoot Finance",
        "logo": "assets/movers/muthoot-finance.png",
        "initials": "MF",
        "gradient": "linear-gradient(135deg, #DC2626, #991B1B)",
        "defaultPrice": 2709.80,
        "defaultChange": 181.60,
        "defaultPct": 7.18,
        "defaultVolume": "21,72,336",
        "defaultVolRaw": 2172336,
        "trend": [2530, 2560, 2580, 2610, 2640, 2660, 2675, 2690, 2700, 2709.8]
    },
    {
        "symbol": "POWERINDIA",
        "ticker": "HITACHI.NS",
        "altTicker": "POWERINDIA.NS",
        "name": "Hitachi Energy",
        "logo": "assets/movers/hitachi-energy.png",
        "initials": "HE",
        "gradient": "linear-gradient(135deg, #DC2626, #991B1B)",
        "defaultPrice": 29100.00,
        "defaultChange": 1820.00,
        "defaultPct": 6.67,
        "defaultVolume": "1,80,043",
        "defaultVolRaw": 180043,
        "trend": [27280, 27600, 28300, 28600, 28750, 28900, 29000, 29050, 29100]
    },
    {
        "symbol": "VEDL",
        "ticker": "VEDL.NS",
        "name": "Vedanta Alumin Metal",
        "logo": "assets/movers/vedanta.png",
        "initials": "VAL",
        "gradient": "linear-gradient(135deg, #0284C7, #0369A1)",
        "defaultPrice": 376.85,
        "defaultChange": 17.20,
        "defaultPct": 4.78,
        "defaultVolume": "1,05,38,796",
        "defaultVolRaw": 10538796,
        "trend": [359.5, 361.0, 363.0, 365.5, 368.0, 371.0, 374.0, 377.5, 375.0, 376.85]
    },
    {
        "symbol": "BEL",
        "ticker": "BEL.NS",
        "name": "Bharat Electronics",
        "logo": "assets/movers/bel.png",
        "initials": "BEL",
        "gradient": "linear-gradient(135deg, #2563EB, #1D4ED8)",
        "defaultPrice": 398.00,
        "defaultChange": 17.90,
        "defaultPct": 4.71,
        "defaultVolume": "2,35,41,317",
        "defaultVolRaw": 23541317,
        "trend": [380.1, 388.0, 387.0, 391.0, 392.5, 393.0, 395.0, 396.5, 397.0, 398.0]
    },
    {
        "symbol": "HINDZINC",
        "ticker": "HINDZINC.NS",
        "name": "Hindustan Zinc",
        "logo": "assets/movers/hindustan-zinc.png",
        "initials": "HZ",
        "gradient": "linear-gradient(135deg, #1E293B, #0F172A)",
        "defaultPrice": 550.15,
        "defaultChange": 23.65,
        "defaultPct": 4.49,
        "defaultVolume": "47,80,415",
        "defaultVolRaw": 4780415,
        "trend": [526.5, 529.0, 532.0, 535.0, 541.0, 544.0, 547.0, 548.5, 550.15]
    },
    {
        "symbol": "ADANIENT",
        "ticker": "ADANIENT.NS",
        "name": "Adani Enterprises",
        "logo": "assets/movers/adani-enterprises.png",
        "initials": "AE",
        "gradient": "linear-gradient(135deg, #7C3AED, #6D28D9)",
        "defaultPrice": 2709.20,
        "defaultChange": 115.90,
        "defaultPct": 4.47,
        "defaultVolume": "22,10,845",
        "defaultVolRaw": 2210845,
        "trend": [2593.3, 2640.0, 2670.0, 2685.0, 2690.0, 2695.0, 2702.0, 2709.2]
    }
]

TRACKED_SHAKERS = [
    {
        "symbol": "FRACTAL",
        "ticker": "FRACTAL.NS",
        "name": "Fractal Analytics",
        "subtitle": "Results yesterday",
        "logo": "assets/movers/fractal-analytics.png",
        "initials": "FA",
        "gradient": "linear-gradient(135deg, #0F172A, #334155)",
        "defaultPrice": 835.65,
        "defaultChange": 102.85,
        "defaultPct": 14.04,
        "volChange": "10,981%",
        "defaultVolume": "1,94,24,579",
        "defaultVolRaw": 19424579,
        "trend": [733, 755, 780, 805, 820, 830, 835.65]
    },
    {
        "symbol": "AWFIS",
        "ticker": "AWFIS.NS",
        "name": "Awfis Space Solutions",
        "subtitle": "Results yesterday",
        "logo": "assets/movers/awfis.png",
        "initials": "AW",
        "gradient": "linear-gradient(135deg, #EF4444, #B91C1C)",
        "defaultPrice": 256.19,
        "defaultChange": 14.99,
        "defaultPct": 6.21,
        "volChange": "6,662%",
        "defaultVolume": "1,44,66,829",
        "defaultVolRaw": 14466829,
        "trend": [241, 248, 252, 250, 254, 256.19]
    },
    {
        "symbol": "FAZE3Q",
        "ticker": "FAZE3Q.BO",
        "name": "Faze Three",
        "subtitle": "Results yesterday",
        "logo": "assets/movers/faze-three.png",
        "initials": "FT",
        "gradient": "linear-gradient(135deg, #DC2626, #7F1D1D)",
        "defaultPrice": 541.80,
        "defaultChange": 90.30,
        "defaultPct": 20.00,
        "volChange": "5,585%",
        "defaultVolume": "17,96,686",
        "defaultVolRaw": 1796686,
        "trend": [451.5, 470, 500, 520, 535, 541.8]
    },
    {
        "symbol": "APLLTD",
        "ticker": "APLLTD.NS",
        "name": "Alembic Pharmaceuticals",
        "subtitle": "Results today",
        "logo": "assets/movers/alembic-pharma.png",
        "initials": "AP",
        "gradient": "linear-gradient(135deg, #0284C7, #0369A1)",
        "defaultPrice": 906.70,
        "defaultChange": 103.90,
        "defaultPct": 12.94,
        "volChange": "4,513%",
        "defaultVolume": "41,62,581",
        "defaultVolRaw": 4162581,
        "trend": [802.8, 810, 820, 850, 885, 906.7]
    },
    {
        "symbol": "SAREGAMA",
        "ticker": "SAREGAMA.NS",
        "name": "Saregama India",
        "subtitle": "Results today",
        "logo": "assets/movers/saregama.png",
        "initials": "SI",
        "gradient": "linear-gradient(135deg, #059669, #047857)",
        "defaultPrice": 636.80,
        "defaultChange": 74.60,
        "defaultPct": 13.27,
        "volChange": "3,048%",
        "defaultVolume": "2,12,55,680",
        "defaultVolRaw": 21255680,
        "trend": [562, 575, 590, 605, 620, 630, 636.8]
    },
    {
        "symbol": "RSYSTEMS",
        "ticker": "RSYSTEMS.NS",
        "name": "R Systems International",
        "subtitle": "Results yesterday",
        "logo": "assets/movers/r-systems.png",
        "initials": "RS",
        "gradient": "linear-gradient(135deg, #2563EB, #1D4ED8)",
        "defaultPrice": 269.70,
        "defaultChange": 21.40,
        "defaultPct": 8.62,
        "volChange": "2,888%",
        "defaultVolume": "86,37,136",
        "defaultVolRaw": 8637136,
        "trend": [248.3, 252, 258, 263, 266, 268, 269.7]
    }
]

TRACKED_LOSERS = [
    {
        "symbol": "SIEMENS",
        "ticker": "SIEMENS.NS",
        "name": "Siemens Energy India",
        "logo": "assets/movers/siemens-energy.png",
        "initials": "SE",
        "gradient": "linear-gradient(135deg, #0284C7, #0369A1)",
        "defaultPrice": 2846.60,
        "defaultChange": -92.80,
        "defaultPct": -3.16,
        "defaultVolume": "4,86,507",
        "defaultVolRaw": 486507,
        "trend": [2940, 2928, 2932, 2915, 2925, 2900, 2895, 2905, 2875, 2870, 2865, 2870, 2855, 2858, 2846.6]
    },
    {
        "symbol": "POWERGRID",
        "ticker": "POWERGRID.NS",
        "name": "Power Grid Corpn.",
        "logo": "assets/movers/power-grid.png",
        "initials": "PG",
        "gradient": "linear-gradient(135deg, #7C3AED, #6D28D9)",
        "defaultPrice": 259.55,
        "defaultChange": -8.15,
        "defaultPct": -3.04,
        "defaultVolume": "1,09,94,586",
        "defaultVolRaw": 10994586,
        "trend": [267.7, 267.5, 267.0, 266.8, 267.2, 266.5, 266.8, 266.0, 265.5, 264.0, 260.0, 259.55]
    },
    {
        "symbol": "PNB",
        "ticker": "PNB.NS",
        "name": "PNB",
        "logo": "assets/movers/pnb.png",
        "initials": "PNB",
        "gradient": "linear-gradient(135deg, #B91C1C, #991B1B)",
        "defaultPrice": 120.97,
        "defaultChange": -2.09,
        "defaultPct": -1.70,
        "defaultVolume": "1,90,95,279",
        "defaultVolRaw": 19095279,
        "trend": [123.06, 122.2, 121.8, 121.5, 122.5, 122.8, 122.4, 122.9, 121.6, 121.2, 121.0, 121.4, 120.97]
    },
    {
        "symbol": "SBIN",
        "ticker": "SBIN.NS",
        "name": "State Bank Of India",
        "logo": "assets/movers/sbi.png",
        "initials": "SBI",
        "gradient": "linear-gradient(135deg, #0284C7, #075985)",
        "defaultPrice": 970.25,
        "defaultChange": -16.75,
        "defaultPct": -1.70,
        "defaultVolume": "2,79,59,412",
        "defaultVolRaw": 27959412,
        "trend": [987.0, 986.5, 986.0, 987.5, 988.0, 987.0, 986.5, 988.0, 985.0, 978.0, 975.0, 979.0, 970.25]
    },
    {
        "symbol": "UNIONBANK",
        "ticker": "UNIONBANK.NS",
        "name": "Union Bank of India",
        "logo": "assets/movers/union-bank.png",
        "initials": "UBI",
        "gradient": "linear-gradient(135deg, #D97706, #B45309)",
        "defaultPrice": 183.20,
        "defaultChange": -2.80,
        "defaultPct": -1.51,
        "defaultVolume": "1,40,40,640",
        "defaultVolRaw": 14040640,
        "trend": [186.0, 185.0, 186.2, 184.8, 184.0, 182.5, 183.8, 184.5, 184.0, 184.2, 183.5, 183.2]
    },
    {
        "symbol": "ASIANPAINT",
        "ticker": "ASIANPAINT.NS",
        "name": "Asian Paints",
        "logo": "assets/movers/asian-paints.png",
        "initials": "AP",
        "gradient": "linear-gradient(135deg, #D97706, #B45309)",
        "defaultPrice": 2437.80,
        "defaultChange": -34.20,
        "defaultPct": -1.38,
        "defaultVolume": "20,08,963",
        "defaultVolRaw": 2008963,
        "trend": [2472.0, 2465.0, 2460.0, 2455.0, 2450.0, 2445.0, 2442.0, 2440.0, 2437.8]
    }
]

TRACKED_RECENT_IPOS = [
    {
        "symbol": "WAAREEENER",
        "ticker": "WAAREEENER.NS",
        "name": "Waaree Energies",
        "subtitle": "Solar PV Modules & Clean Energy",
        "logo": "assets/movers/waaree.png",
        "initials": "WE",
        "gradient": "linear-gradient(135deg, #F59E0B, #B45309)",
        "issuePrice": 1503,
        "lotSize": 9,
        "defaultPrice": 2408.00,
        "defaultChange": 14.50,
        "defaultPct": 0.61,
        "defaultVolume": "6,87,608",
        "defaultVolRaw": 687608,
        "slug": "waaree-energies-ipo",
        "exchange": "BSE, NSE",
        "category": "RECENT_IPO",
        "catLabel": "🚀 Recent IPO Debut",
        "trend": [2320, 2350, 2375, 2390, 2410, 2405, 2408.0]
    },
    {
        "symbol": "SWIGGY",
        "ticker": "SWIGGY.NS",
        "name": "Swiggy Limited",
        "subtitle": "Food Delivery & Quick Commerce",
        "logo": "assets/movers/swiggy.png",
        "initials": "SW",
        "gradient": "linear-gradient(135deg, #FC8019, #EA580C)",
        "issuePrice": 390,
        "lotSize": 38,
        "defaultPrice": 178.89,
        "defaultChange": 2.45,
        "defaultPct": 1.39,
        "defaultVolume": "1,53,05,731",
        "defaultVolRaw": 15305731,
        "slug": "swiggy-limited-ipo",
        "exchange": "BSE, NSE",
        "category": "RECENT_IPO",
        "catLabel": "🚀 Recent IPO Debut",
        "trend": [172.5, 174.0, 175.8, 177.2, 178.0, 178.89]
    },
    {
        "symbol": "HYUNDAI",
        "ticker": "HYUNDAI.NS",
        "name": "Hyundai Motor India",
        "subtitle": "Automobile OEM Leader",
        "logo": "assets/movers/hyundai.png",
        "initials": "HMI",
        "gradient": "linear-gradient(135deg, #002C6C, #001A40)",
        "issuePrice": 1960,
        "lotSize": 7,
        "defaultPrice": 2063.00,
        "defaultChange": 18.50,
        "defaultPct": 0.91,
        "defaultVolume": "7,38,012",
        "defaultVolRaw": 738012,
        "slug": "hyundai-motor-india-ipo",
        "exchange": "BSE, NSE",
        "category": "RECENT_IPO",
        "catLabel": "🚀 Recent IPO Debut",
        "trend": [2030, 2045, 2050, 2058, 2063.0]
    },
    {
        "symbol": "PREMIERENE",
        "ticker": "PREMIERENE.NS",
        "name": "Premier Energies",
        "subtitle": "Solar PV Cells Manufacturer",
        "logo": "assets/movers/premier-energies.png",
        "initials": "PE",
        "gradient": "linear-gradient(135deg, #10B981, #047857)",
        "issuePrice": 450,
        "lotSize": 33,
        "defaultPrice": 904.00,
        "defaultChange": 14.00,
        "defaultPct": 1.57,
        "defaultVolume": "11,45,856",
        "defaultVolRaw": 1145856,
        "slug": "premier-energies-ipo",
        "exchange": "BSE, NSE",
        "category": "RECENT_IPO",
        "catLabel": "🚀 Recent IPO Debut",
        "trend": [885, 892, 898, 902, 904.0]
    },
    {
        "symbol": "BAJAJHFL",
        "ticker": "BAJAJHFL.NS",
        "name": "Bajaj Housing Finance",
        "subtitle": "NBFC Housing Finance",
        "logo": "assets/movers/bajaj-housing.png",
        "initials": "BHF",
        "gradient": "linear-gradient(135deg, #0284C7, #0369A1)",
        "issuePrice": 70,
        "lotSize": 214,
        "defaultPrice": 81.42,
        "defaultChange": 0.85,
        "defaultPct": 1.05,
        "defaultVolume": "43,02,345",
        "defaultVolRaw": 4302345,
        "slug": "bajaj-housing-finance-ipo",
        "exchange": "BSE, NSE",
        "category": "RECENT_IPO",
        "catLabel": "🚀 Recent IPO Debut",
        "trend": [80.2, 80.6, 81.0, 81.2, 81.42]
    },
    {
        "symbol": "OLAELEC",
        "ticker": "OLAELEC.NS",
        "name": "Ola Electric Mobility",
        "subtitle": "EV Two-Wheeler OEM",
        "logo": "assets/movers/ola-electric.png",
        "initials": "OLA",
        "gradient": "linear-gradient(135deg, #1E293B, #0F172A)",
        "issuePrice": 76,
        "lotSize": 195,
        "defaultPrice": 35.04,
        "defaultChange": -0.62,
        "defaultPct": -1.74,
        "defaultVolume": "4,30,60,994",
        "defaultVolRaw": 43060994,
        "slug": "ola-electric-mobility-ipo",
        "exchange": "BSE, NSE",
        "category": "RECENT_IPO",
        "catLabel": "🚀 Recent IPO Debut",
        "trend": [36.2, 35.8, 35.5, 35.2, 35.04]
    },
    {
        "symbol": "BSE",
        "ticker": "BSE.NS",
        "name": "BSE Limited",
        "subtitle": "India Exchange & Trading Infra",
        "logo": "assets/movers/bse.png",
        "initials": "BSE",
        "gradient": "linear-gradient(135deg, #2563EB, #1D4ED8)",
        "issuePrice": 806,
        "lotSize": 10,
        "defaultPrice": 3601.50,
        "defaultChange": 72.50,
        "defaultPct": 2.05,
        "defaultVolume": "42,13,926",
        "defaultVolRaw": 4213926,
        "slug": "bse-limited",
        "exchange": "NSE",
        "category": "RECENT_IPO",
        "catLabel": "🚀 Recent IPO Debut",
        "trend": [3520, 3550, 3580, 3600, 3601.5]
    },
    {
        "symbol": "NTPCGREEN",
        "ticker": "NTPCGREEN.NS",
        "name": "NTPC Green Energy",
        "subtitle": "Renewable Power Utility",
        "logo": "assets/movers/ntpc-green.png",
        "initials": "NGE",
        "gradient": "linear-gradient(135deg, #059669, #065F46)",
        "issuePrice": 108,
        "lotSize": 138,
        "defaultPrice": 115.00,
        "defaultChange": 1.20,
        "defaultPct": 1.05,
        "defaultVolume": "2,15,40,110",
        "defaultVolRaw": 21540110,
        "slug": "ntpc-green-energy-ipo",
        "exchange": "BSE, NSE",
        "category": "RECENT_IPO",
        "catLabel": "🚀 Recent IPO Debut",
        "trend": [112.5, 113.8, 114.2, 114.8, 115.0]
    }
]

TRACKED_BLUECHIPS = [
    {
        "symbol": "RELIANCE",
        "ticker": "RELIANCE.NS",
        "name": "Reliance Industries",
        "subtitle": "Energy, Retail & Telecom Giant",
        "logo": "assets/movers/reliance.png",
        "initials": "RIL",
        "gradient": "linear-gradient(135deg, #0284C7, #075985)",
        "defaultPrice": 1311.00,
        "defaultChange": 14.50,
        "defaultPct": 1.12,
        "defaultVolume": "1,94,44,018",
        "defaultVolRaw": 19444018,
        "exchange": "NSE, BSE",
        "category": "BLUECHIP",
        "catLabel": "🏛️ Nifty 50 Bluechip",
        "trend": [1295, 1302, 1305, 1308, 1311.0]
    },
    {
        "symbol": "TCS",
        "ticker": "TCS.NS",
        "name": "Tata Consultancy Services",
        "subtitle": "Global IT Services Leader",
        "logo": "assets/movers/tcs.png",
        "initials": "TCS",
        "gradient": "linear-gradient(135deg, #1E293B, #334155)",
        "defaultPrice": 2436.00,
        "defaultChange": 22.00,
        "defaultPct": 0.91,
        "defaultVolume": "31,40,927",
        "defaultVolRaw": 3140927,
        "exchange": "NSE, BSE",
        "category": "BLUECHIP",
        "catLabel": "🏛️ Nifty 50 Bluechip",
        "trend": [2410, 2418, 2425, 2430, 2436.0]
    },
    {
        "symbol": "INFY",
        "ticker": "INFY.NS",
        "name": "Infosys Limited",
        "subtitle": "Digital Services & Consulting",
        "logo": "assets/movers/infosys.png",
        "initials": "INFY",
        "gradient": "linear-gradient(135deg, #2563EB, #1D4ED8)",
        "defaultPrice": 1128.20,
        "defaultChange": 11.20,
        "defaultPct": 1.00,
        "defaultVolume": "93,24,799",
        "defaultVolRaw": 9324799,
        "exchange": "NSE, BSE",
        "category": "BLUECHIP",
        "catLabel": "🏛️ Nifty 50 Bluechip",
        "trend": [1115, 1120, 1124, 1126, 1128.2]
    },
    {
        "symbol": "HDFCBANK",
        "ticker": "HDFCBANK.NS",
        "name": "HDFC Bank",
        "subtitle": "Private Banking Benchmark",
        "logo": "assets/movers/hdfc-bank.png",
        "initials": "HDFC",
        "gradient": "linear-gradient(135deg, #004C8F, #002E54)",
        "defaultPrice": 736.70,
        "defaultChange": 5.40,
        "defaultPct": 0.74,
        "defaultVolume": "5,06,71,579",
        "defaultVolRaw": 50671579,
        "exchange": "NSE, BSE",
        "category": "BLUECHIP",
        "catLabel": "🏛️ Nifty 50 Bluechip",
        "trend": [730, 732, 734, 735.5, 736.7]
    },
    {
        "symbol": "ICICIBANK",
        "ticker": "ICICIBANK.NS",
        "name": "ICICI Bank",
        "subtitle": "Diversified Financial Conglomerate",
        "logo": "assets/movers/icici-bank.png",
        "initials": "ICICI",
        "gradient": "linear-gradient(135deg, #B91C1C, #991B1B)",
        "defaultPrice": 1424.10,
        "defaultChange": 18.20,
        "defaultPct": 1.29,
        "defaultVolume": "1,05,98,803",
        "defaultVolRaw": 10598803,
        "exchange": "NSE, BSE",
        "category": "BLUECHIP",
        "catLabel": "🏛️ Nifty 50 Bluechip",
        "trend": [1405, 1412, 1418, 1422, 1424.1]
    },
    {
        "symbol": "BAJFINANCE",
        "ticker": "BAJFINANCE.NS",
        "name": "Bajaj Finance",
        "subtitle": "Consumer NBFC Champion",
        "logo": "assets/movers/bajaj-finance.png",
        "initials": "BF",
        "gradient": "linear-gradient(135deg, #0284C7, #0369A1)",
        "defaultPrice": 994.00,
        "defaultChange": 12.00,
        "defaultPct": 1.22,
        "defaultVolume": "1,44,07,596",
        "defaultVolRaw": 14407596,
        "exchange": "NSE, BSE",
        "category": "BLUECHIP",
        "catLabel": "🏛️ Nifty 50 Bluechip",
        "trend": [980, 985, 990, 992, 994.0]
    },
    {
        "symbol": "LT",
        "ticker": "LT.NS",
        "name": "Larsen & Toubro",
        "subtitle": "EPC Infrastructure Leader",
        "logo": "assets/movers/lt.png",
        "initials": "LT",
        "gradient": "linear-gradient(135deg, #D97706, #B45309)",
        "defaultPrice": 3944.40,
        "defaultChange": 48.00,
        "defaultPct": 1.23,
        "defaultVolume": "24,93,326",
        "defaultVolRaw": 2493326,
        "exchange": "NSE, BSE",
        "category": "BLUECHIP",
        "catLabel": "🏛️ Nifty 50 Bluechip",
        "trend": [3890, 3910, 3925, 3935, 3944.4]
    },
    {
        "symbol": "ITC",
        "ticker": "ITC.NS",
        "name": "ITC Limited",
        "subtitle": "FMCG, Hotels & Paperboards",
        "logo": "assets/movers/itc.png",
        "initials": "ITC",
        "gradient": "linear-gradient(135deg, #B45309, #78350F)",
        "defaultPrice": 280.00,
        "defaultChange": 3.10,
        "defaultPct": 1.12,
        "defaultVolume": "4,24,46,833",
        "defaultVolRaw": 42446833,
        "exchange": "NSE, BSE",
        "category": "BLUECHIP",
        "catLabel": "🏛️ Nifty 50 Bluechip",
        "trend": [276, 277.5, 278.2, 279.0, 280.0]
    }
]

TRACKED_IPOS = [
    {
        "slug": "antala-industries-ipo",
        "symbol": "ANTALA",
        "exchange": "BSE SME",
        "board": "SME",
        "name": "Antala Industries",
        "status": "OPEN",
        "issuePrice": 66,
        "priceBandLow": 62,
        "priceBandHigh": 66,
        "lotSize": 2000,
        "gmp": 0,
        "gmpPct": 0.0,
        "estListing": 66,
        "profitPerLot": 0,
        "qibSub": 67.0,
        "niiSub": 22.17,
        "bNiiSub": 32.49,
        "sNiiSub": 1.17,
        "retailSub": 0.80,
        "totalSub": 4.82
    },
    {
        "slug": "vedant-poly-fabs-ipo",
        "symbol": "VEDANT",
        "exchange": "BSE SME",
        "board": "SME",
        "name": "Vedant Poly Fabs",
        "status": "CLOSED",
        "issuePrice": 94,
        "priceBandLow": 89,
        "priceBandHigh": 94,
        "lotSize": 1200,
        "gmp": 15,
        "gmpPct": 16.0,
        "estListing": 109,
        "profitPerLot": 18000,
        "qibSub": 1.05,
        "totalSub": 1.25
    },
    {
        "slug": "zepto-ipo",
        "symbol": "ZEPTO",
        "exchange": "BSE, NSE",
        "board": "MAINBOARD",
        "name": "Zepto",
        "status": "UPCOMING",
        "issuePrice": 405,
        "priceBandLow": 380,
        "priceBandHigh": 405,
        "lotSize": 35,
        "gmp": 85,
        "gmpPct": 21.0,
        "estListing": 490,
        "profitPerLot": 2975,
        "qibSub": None,
        "totalSub": None
    },
    {
        "slug": "razorpay-ipo",
        "symbol": "RAZORPAY",
        "exchange": "BSE, NSE",
        "board": "MAINBOARD",
        "name": "Razorpay",
        "status": "UPCOMING",
        "issuePrice": 685,
        "priceBandLow": 650,
        "priceBandHigh": 685,
        "lotSize": 21,
        "gmp": 140,
        "gmpPct": 20.4,
        "estListing": 825,
        "profitPerLot": 2940,
        "qibSub": None,
        "totalSub": None
    },
    {
        "slug": "haldirams-snacks-foods-ipo",
        "symbol": "HALDIRAM",
        "exchange": "BSE, NSE",
        "board": "MAINBOARD",
        "name": "Haldiram Snacks",
        "status": "UPCOMING",
        "issuePrice": 445,
        "priceBandLow": 420,
        "priceBandHigh": 445,
        "lotSize": 33,
        "gmp": 95,
        "gmpPct": 21.3,
        "estListing": 540,
        "profitPerLot": 3135,
        "qibSub": None,
        "totalSub": None
    },
    {
        "slug": "flipkart-ipo",
        "symbol": "FLIPKART",
        "exchange": "BSE, NSE",
        "board": "MAINBOARD",
        "name": "Flipkart",
        "status": "UPCOMING",
        "issuePrice": 900,
        "priceBandLow": 850,
        "priceBandHigh": 900,
        "lotSize": 16,
        "gmp": 180,
        "gmpPct": 20.0,
        "estListing": 1080,
        "profitPerLot": 2880,
        "qibSub": None,
        "totalSub": None
    },
    {
        "slug": "phonepe-ipo",
        "symbol": "PHONEPE",
        "exchange": "BSE, NSE",
        "board": "MAINBOARD",
        "name": "PhonePe",
        "status": "UPCOMING",
        "issuePrice": 550,
        "priceBandLow": 510,
        "priceBandHigh": 550,
        "lotSize": 27,
        "gmp": 115,
        "gmpPct": 20.9,
        "estListing": 665,
        "profitPerLot": 3105,
        "qibSub": None,
        "totalSub": None
    },
    {
        "slug": "swiggy-limited-ipo",
        "symbol": "SWIGGY",
        "exchange": "BSE, NSE",
        "board": "MAINBOARD",
        "name": "Swiggy Limited",
        "status": "LISTED",
        "issuePrice": 390,
        "listingPrice": 420,
        "lotSize": 38,
        "gmp": 30,
        "gmpPct": 7.69,
        "estListing": 420,
        "profitPerLot": 1140,
        "qibSub": 6.02,
        "totalSub": 3.59
    }
]

def format_indian_num(num):
    """Formats an integer into Indian comma grouping (Lakhs and Crores)."""
    if num is None:
        return "—"
    try:
        s = str(int(num))
        if len(s) <= 3:
            return s
        last3 = s[-3:]
        rest = s[:-3]
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        return ",".join(groups) + "," + last3
    except Exception:
        return str(num)

def fetch_tapetide_quote(symbol, token):
    """Calls Tapetide live quote endpoint if token is present."""
    url = f"https://api.tapetide.com/v1/stock/live-quote?symbol={urllib.parse.quote(symbol)}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {token}",
        "User-Agent": "PriceAlerter-Sync/2.0"
    })
    ctx = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                return data
    except Exception as e:
        return None
    return None

def fetch_market_quote(ticker):
    """Fetches real-time price & volume for an Indian stock ticker (.NS / .BO)."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1d"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    })
    ctx = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
            if resp.status == 200:
                body = json.loads(resp.read().decode())
                result = body.get("chart", {}).get("result", [])
                if result:
                    meta = result[0].get("meta", {})
                    cmp = meta.get("regularMarketPrice")
                    prev = meta.get("chartPreviousClose") or meta.get("previousClose")
                    high = meta.get("regularMarketDayHigh")
                    low = meta.get("regularMarketDayLow")
                    vol = meta.get("regularMarketVolume")
                    
                    if cmp is not None and prev is not None and meta.get("regularMarketTime"):
                        change = round(cmp - prev, 2)
                        pct = round((change / prev) * 100, 2) if prev > 0 else 0.0
                        return {
                            "cmp": float(cmp), "previousClose": float(prev),
                            "change": float(change), "changePct": float(pct),
                            "high": float(high) if high is not None else None,
                            "low": float(low) if low is not None else None,
                            "volume": int(vol) if vol is not None else None,
                            "quoteTimestamp": int(meta["regularMarketTime"]),
                            "source": "Yahoo Finance chart endpoint"
                        }
    except Exception:
        pass
    return None

def resolve_stock_live(stock_def, tapetide_token=None):
    """Return only a real, timestamped quote; never synthesize a fallback price."""
    symbol = stock_def.get("symbol")
    ticker = stock_def.get("ticker")
    live = fetch_tapetide_quote(symbol, tapetide_token) if tapetide_token else None
    provider = "Tapetide" if live else None
    if not live and ticker:
        live = fetch_market_quote(ticker)
        provider = "Yahoo Finance chart endpoint" if live else None
    if not live and stock_def.get("altTicker"):
        live = fetch_market_quote(stock_def["altTicker"])
        provider = "Yahoo Finance chart endpoint" if live else None
    if not isinstance(live, dict):
        return None
    try:
        cmp = float(live.get("cmp"))
        previous_close = float(live.get("previousClose"))
        change = float(live.get("change"))
        pct = float(live.get("changePct"))
    except (TypeError, ValueError):
        return None
    if not all(math.isfinite(v) for v in (cmp, previous_close, change, pct)):
        return None
    if cmp <= 0 or previous_close <= 0:
        return None
    quote_timestamp = live.get("quoteTimestamp")
    if isinstance(quote_timestamp, (int, float)):
        quote_timestamp = datetime.fromtimestamp(quote_timestamp, timezone.utc).isoformat()
    if not quote_timestamp:
        return None
    high, low = live.get("high"), live.get("low")
    try:
        high = float(high) if high is not None else None
        low = float(low) if low is not None else None
    except (TypeError, ValueError):
        high, low = None, None
    if high is not None and (not math.isfinite(high) or high < cmp):
        high = None
    if low is not None and (not math.isfinite(low) or low > cmp or low <= 0):
        low = None
    vol_raw = live.get("volume")
    try:
        vol_raw = int(vol_raw) if vol_raw is not None else None
    except (TypeError, ValueError):
        vol_raw = None
    return {
        "symbol": symbol, "ticker": ticker or f"{symbol}.NS",
        "name": stock_def["name"], "subtitle": stock_def.get("subtitle", ""),
        "category": stock_def.get("category", ""), "catLabel": stock_def.get("catLabel", ""),
        "logo": stock_def["logo"], "initials": stock_def["initials"],
        "gradient": stock_def["gradient"], "price": f"₹{cmp:,.2f}",
        "rawPrice": cmp, "previousClose": previous_close,
        "change": f"{change:,.2f} ({pct:.2f}%)", "rawChange": change, "pct": pct,
        "isGain": change >= 0, "high": high, "low": low,
        "volRaw": vol_raw, "volume": format_indian_num(vol_raw) if vol_raw is not None else "—",
        "volChange": "", "issuePrice": stock_def.get("issuePrice"),
        "lotSize": stock_def.get("lotSize"), "slug": stock_def.get("slug"),
        "exchange": stock_def.get("exchange", "NSE / BSE"), "trend": [],
        "quoteVerified": True, "quoteTimestamp": quote_timestamp,
        "quoteSource": live.get("source") or provider or "Unknown provider",
        "quoteDelayNote": "Third-party quote; delay and redistribution rights depend on provider"
    }

def run_sync(tapetide_token=None, dry_run=False, verbose=False):
    """Executes the complete market synchronization cycle."""
    now_ist = datetime.now(IST)
    iso_time = now_ist.isoformat()
    formatted_time = now_ist.strftime("%d %b %Y, %I:%M %p IST")

    print(f"\n==================================================")
    print(f"🚀 PriceAlerter Market Sync Pipeline: {formatted_time}")
    print(f"==================================================")

    if tapetide_token:
        print("🔑 Tapetide Token detected: querying Tapetide primary feed.")
    else:
        print("ℹ️  Tapetide Token not provided: using resilient direct exchange market feeds.")

    # 1. Fetch Gainers
    synced_gainers = []
    print("\n[1/6] Syncing Top Gainers...")
    for item in TRACKED_GAINERS:
        item["category"] = "GAINER"
        item["catLabel"] = "🏆 Top Gainer"
        res = resolve_stock_live(item, tapetide_token)
        if res:
            synced_gainers.append(res)
        else:
            print(f"  ⚠️  {item['name']}: no valid timestamped quote; omitted")
        print(f"  ✓ {res['name']:<24}: {res['price']:>12} | {res['change']:>18} | Vol: {res['volume']}")

    # 2. Fetch Market Shakers (Volume Surge)
    synced_shakers = []
    print("\n[2/6] Syncing Market Shakers (Volume Breakouts)...")
    for item in TRACKED_SHAKERS:
        item["category"] = "SHAKER"
        item["catLabel"] = "⚡ Market Shaker"
        res = resolve_stock_live(item, tapetide_token)
        if res:
            synced_shakers.append(res)
        else:
            print(f"  ⚠️  {item['name']}: no valid timestamped quote; omitted")
        print(f"  ✓ {res['name']:<24}: {res['price']:>12} | Vol Chg: {res['volChange']:>8} | Vol: {res['volume']}")

    # 3. Fetch Losers
    synced_losers = []
    print("\n[3/6] Syncing Top Losers...")
    for item in TRACKED_LOSERS:
        item["category"] = "LOSER"
        item["catLabel"] = "🔻 Top Loser"
        res = resolve_stock_live(item, tapetide_token)
        if res:
            synced_losers.append(res)
        else:
            print(f"  ⚠️  {item['name']}: no valid timestamped quote; omitted")
        print(f"  ✓ {res['name']:<24}: {res['price']:>12} | {res['change']:>18} | Vol: {res['volume']}")

    # 4. Fetch Recent IPO Debuts
    synced_recent_ipos = []
    print("\n[4/6] Syncing Recent IPO Debuts...")
    for item in TRACKED_RECENT_IPOS:
        item["category"] = "RECENT_IPO"
        item["catLabel"] = "🚀 Recent IPO Debut"
        res = resolve_stock_live(item, tapetide_token)
        if res:
            synced_recent_ipos.append(res)
        else:
            print(f"  ⚠️  {item['name']}: no valid timestamped quote; omitted")
        print(f"  ✓ {res['name']:<24}: {res['price']:>12} | Issue: ₹{res.get('issuePrice', '—')} | Vol: {res['volume']}")

    # 5. Fetch Nifty 50 Bluechips
    synced_bluechips = []
    print("\n[5/6] Syncing Nifty 50 Bluechips...")
    for item in TRACKED_BLUECHIPS:
        item["category"] = "BLUECHIP"
        item["catLabel"] = "🏛️ Nifty 50 Bluechip"
        res = resolve_stock_live(item, tapetide_token)
        if res:
            synced_bluechips.append(res)
        else:
            print(f"  ⚠️  {item['name']}: no valid timestamped quote; omitted")
        print(f"  ✓ {res['name']:<24}: {res['price']:>12} | {res['change']:>18} | Vol: {res['volume']}")

    # Static GMP values are estimates without per-observation source evidence.
    # Do not publish them as exchange-verified data.
    synced_ipos = []
    print("\n[6/6] Skipping unverified static GMP estimates.\n")

    # Aggregate Unified All Live Stocks (32+ stocks)
    all_live_stocks = []
    all_live_stocks.extend(synced_recent_ipos)
    all_live_stocks.extend(synced_gainers)
    all_live_stocks.extend(synced_shakers)
    all_live_stocks.extend(synced_losers)
    all_live_stocks.extend(synced_bluechips)

    # Build Central Live Market Data Structure
    live_dataset = {
        "lastSyncTime": iso_time,
        "lastSyncFormatted": formatted_time,
        "nextSyncCountdownSeconds": 600,
        "syncIntervalMinutes": 10,
        "source": "Timestamped third-party quote feeds; not exchange-certified",
        "officialSources": {
            "dhan": "https://dhan.co/ipo/",
            "nse": "https://www.nseindia.com/static/market-data/real-time-data-subscription",
            "bse": "https://marketdata.bseindia.com/",
            "tapetide": "https://tapetide.com/"
        },
        "status": "PARTIAL_VERIFIED_QUOTES",
        "dataQualityNotice": "Only timestamped provider quotes are included. Unavailable quotes are omitted; no hardcoded fallback prices, synthetic OHLC values, or generated trend points are used. Provider delay and redistribution rights must be confirmed.",
        "marketGainers": synced_gainers,
        "marketShakers": synced_shakers,
        "marketLosers": synced_losers,
        "recentIpos": synced_recent_ipos,
        "bluechips": synced_bluechips,
        "trackedIpos": synced_ipos,
        "allLiveStocks": all_live_stocks
    }

    if dry_run:
        print("\n🔍 DRY-RUN MODE: No files modified.")
        return True

    if not all_live_stocks:
        print("\n❌ No valid timestamped market quotes received; existing files left unchanged.")
        return False

    # 1. Write data/live-market-data.json
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(LIVE_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(live_dataset, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Updated {LIVE_DATA_FILE} ({len(all_live_stocks)} total real-time stocks)")

    # 2. Update data/ipo-data.js with active IPO GMPs and recent IPO CMPs
    # Do not overwrite IPO issue/listing prices or GMP from third-party CMPs or static estimates.

    # 3. Update app.js static fallbacks
    # Static app.js quote fallbacks are not refreshed; the frontend uses the timestamped feed.

    print(f"\n✨ Market data sync complete! Next autonomous cycle in 10 minutes.")
    return True

def update_ipo_data_js(synced_ipos, synced_recent_ipos=None, iso_time=None):
    """Updates active IPO GMPs and listing prices inside data/ipo-data.js."""
    if not os.path.exists(IPO_DATA_FILE):
        return

    with open(IPO_DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Search for window.IpoData = { ... };
    match = re.search(r"window\.IpoData\s*=\s*(\{.*?\});\s*$", content, re.DOTALL)
    if not match:
        return

    try:
        raw_json = match.group(1)
        data = json.loads(raw_json)
        records = data.get("records", [])

        ipo_map = {item["slug"]: item for item in synced_ipos}
        recent_map = {item["slug"]: item for item in (synced_recent_ipos or []) if item.get("slug")}

        updated_count = 0
        for r in records:
            slug = r.get("slug")
            if slug in ipo_map:
                update_info = ipo_map[slug]
                r["gmp"] = update_info["gmp"]
                r["gmpPercentage"] = update_info["gmpPct"]
                r["expectedListingPrice"] = update_info["estListing"]
                r["estProfitPerLot"] = update_info["profitPerLot"]
                r["gmpUpdatedAt"] = iso_time
                r["dayHighGmp"] = update_info["gmp"] + 2
                r["dayLowGmp"] = max(1, update_info["gmp"] - 2)
                r["trend"] = "bullish" if update_info["gmp"] > 0 else "neutral"
                updated_count += 1
            elif slug in recent_map:
                recent_info = recent_map[slug]
                r["currentPrice"] = recent_info["rawPrice"]
                r["dayChange"] = recent_info["rawChange"]
                r["dayChangePerc"] = recent_info["pct"]
                r["dayHigh"] = recent_info["high"]
                r["dayLow"] = recent_info["low"]
                r["volume"] = recent_info["volume"]
                r["lastPriceUpdate"] = iso_time
                updated_count += 1

        data["updatedAt"] = iso_time
        new_content = "window.IpoData = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n"

        with open(IPO_DATA_FILE, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"✅ Updated {IPO_DATA_FILE} ({updated_count} IPO records updated with live GMPs)")
    except Exception as e:
        print(f"⚠️  Could not update ipo-data.js: {e}")

def update_app_js_constants(gainers, shakers, losers):
    """Updates marketGainers, marketLosers, marketShakers array constants in app.js."""
    if not os.path.exists(APP_JS_FILE):
        return

    with open(APP_JS_FILE, "r", encoding="utf-8") as f:
        code = f.read()

    # Helper to generate clean JS object string
    def to_js_gainers(items):
        lines = ["  const marketGainers = ["]
        for item in items:
            lines.append("    {")
            lines.append(f'      name: "{item["name"]}",')
            lines.append(f'      logo: "{item["logo"]}",')
            lines.append(f'      initials: "{item["initials"]}",')
            lines.append(f'      gradient: "{item["gradient"]}",')
            lines.append(f'      price: "{item["price"]}",')
            lines.append(f'      change: "{item["change"]}",')
            lines.append(f'      isGain: {str(item["isGain"]).lower()},')
            lines.append(f'      volume: "{item["volume"]}",')
            lines.append(f'      trend: {json.dumps(item["trend"])}')
            lines.append("    },")
        if lines[-1].endswith(","):
            lines[-1] = lines[-1][:-1]
        lines.append("  ];")
        return "\n".join(lines)

    def to_js_losers(items):
        lines = ["  const marketLosers = ["]
        for item in items:
            lines.append("    {")
            lines.append(f'      name: "{item["name"]}",')
            lines.append(f'      logo: "{item["logo"]}",')
            lines.append(f'      initials: "{item["initials"]}",')
            lines.append(f'      gradient: "{item["gradient"]}",')
            lines.append(f'      price: "{item["price"]}",')
            lines.append(f'      change: "{item["change"]}",')
            lines.append(f'      isGain: {str(item["isGain"]).lower()},')
            lines.append(f'      volume: "{item["volume"]}",')
            lines.append(f'      trend: {json.dumps(item["trend"])}')
            lines.append("    },")
        if lines[-1].endswith(","):
            lines[-1] = lines[-1][:-1]
        lines.append("  ];")
        return "\n".join(lines)

    def to_js_shakers(items):
        lines = ["  const marketShakers = ["]
        for item in items:
            lines.append("    {")
            lines.append(f'      name: "{item["name"]}",')
            if item.get("subtitle"):
                lines.append(f'      subtitle: "{item["subtitle"]}",')
            lines.append(f'      logo: "{item["logo"]}",')
            lines.append(f'      initials: "{item["initials"]}",')
            lines.append(f'      gradient: "{item["gradient"]}",')
            lines.append(f'      price: "{item["price"]}",')
            lines.append(f'      change: "{item["change"]}",')
            lines.append(f'      isGain: {str(item["isGain"]).lower()},')
            lines.append(f'      volChange: "{item["volChange"]}",')
            lines.append(f'      volume: "{item["volume"]}",')
            lines.append(f'      trend: {json.dumps(item["trend"])}')
            lines.append("    },")
        if lines[-1].endswith(","):
            lines[-1] = lines[-1][:-1]
        lines.append("  ];")
        return "\n".join(lines)

    new_gainers = to_js_gainers(gainers)
    new_losers = to_js_losers(losers)
    new_shakers = to_js_shakers(shakers)

    # Replace const marketGainers = [ ... ];
    code = re.sub(r"const marketGainers\s*=\s*\[.*?\];", new_gainers.strip(), code, flags=re.DOTALL)
    # Replace const marketLosers = [ ... ];
    code = re.sub(r"const marketLosers\s*=\s*\[.*?\];", new_losers.strip(), code, flags=re.DOTALL)
    # Replace const marketShakers = [ ... ];
    code = re.sub(r"const marketShakers\s*=\s*\[.*?\];", new_shakers.strip(), code, flags=re.DOTALL)

    with open(APP_JS_FILE, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"✅ Updated {APP_JS_FILE} (Static market mover constants refreshed)")

def main():
    parser = argparse.ArgumentParser(description="Autonomous 10-Minute Market Data Sync")
    parser.add_argument("--token", default=os.environ.get("TAPETIDE_TOKEN"), help="Tapetide API Bearer Token")
    parser.add_argument("--dry-run", action="store_true", help="Fetch quotes without saving files")
    parser.add_argument("--loop", type=int, default=0, help="Run continuously in a loop every N seconds (e.g. 600)")
    parser.add_argument("--verbose", action="store_true", help="Verbose log output")

    args = parser.parse_args()

    if args.loop > 0:
        print(f"🔄 Starting autonomous daemon loop: syncing every {args.loop} seconds...")
        while True:
            try:
                run_sync(tapetide_token=args.token, dry_run=args.dry_run, verbose=args.verbose)
            except Exception as e:
                print(f"❌ Error during sync cycle: {e}")
            time.sleep(args.loop)
    else:
        success = run_sync(tapetide_token=args.token, dry_run=args.dry_run, verbose=args.verbose)
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
