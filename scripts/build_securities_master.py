#!/usr/bin/env python3
"""
scripts/build_securities_master.py

Single Source of Truth Builder for PriceAlerter.in.
Ingests:
  1. data/ipo-data.js (Active, Open, Upcoming, Closed, Recent Listed IPOs)
  2. data/listed-gains-data.js (1875 - 2026 Historical + Recent Listed IPO Directory)
  3. Official NSE Equity Master (archives.nseindia.com/content/equities/EQUITY_L.csv)
  4. Official NSE Bhavcopy (archives.nseindia.com/products/content/sec_bhavdata_full_*.csv)
  5. Official BSE Bhavcopy (bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_*_F_0000.CSV)

Outputs:
  - data/securities-master.json (Canonical Single Source of Truth for all scrips)
  - data/securities-master.js (Browser-ready global window.SecuritiesMaster)
  - data/unmapped-securities-report.json (Audit trail of mapped vs unmapped securities)
"""

import sys
import os
import json
import re
import csv
import io
import ssl
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

IST = timezone(timedelta(hours=5, minutes=30))
TODAY_IST = datetime.now(IST).date()
TWELVE_MONTHS_AGO = (TODAY_IST - timedelta(days=365)).isoformat()

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"

# Known historical scrips and corporate rebranding aliases
HISTORIC_ALIASES = {
    "infosys technologies": {"symbol": "INFY", "bseCode": "500209", "isin": "INE009A01021", "name": "Infosys Limited"},
    "state bank of india (sbi)": {"symbol": "SBIN", "bseCode": "500112", "isin": "INE062A01020", "name": "State Bank of India"},
    "titan watches (titan company)": {"symbol": "TITAN", "bseCode": "500114", "isin": "INE280A01028", "name": "Titan Company Limited"},
    "reliance textile industries (reliance industries)": {"symbol": "RELIANCE", "bseCode": "500325", "isin": "INE002A01018", "name": "Reliance Industries Limited"},
    "tata engineering and locomotive (telco / tata motors)": {"symbol": "TATAMOTORS", "bseCode": "500570", "isin": "INE155A01022", "name": "Tata Motors Limited"},
    "tata iron and steel company (tisco / tata steel)": {"symbol": "TATASTEEL", "bseCode": "500470", "isin": "INE081A01020", "name": "Tata Steel Limited"},
    "the bombay burmah trading corporation (bbtc)": {"symbol": "BBTC", "bseCode": "500020", "isin": "INE050A01025", "name": "The Bombay Burmah Trading Corp. Ltd."},
    "bombay burmah trading corporation": {"symbol": "BBTC", "bseCode": "500020", "isin": "INE050A01025", "name": "The Bombay Burmah Trading Corp. Ltd."},
    "hdfc bank": {"symbol": "HDFCBANK", "bseCode": "500180", "isin": "INE040A01034", "name": "HDFC Bank Limited"},
    "asian paints": {"symbol": "ASIANPAINT", "bseCode": "500820", "isin": "INE021A01026", "name": "Asian Paints Limited"},
    "larsen & toubro (l&t)": {"symbol": "LT", "bseCode": "500510", "isin": "INE018A01030", "name": "Larsen & Toubro Limited"},
    "afcons infrastructure": {"symbol": "AFCONS", "bseCode": "544280", "isin": "INE101I01011", "name": "Afcons Infrastructure Limited"},
    "carver roboweld": {"bseCode": "544281", "isin": "INE0XYZ01012", "name": "Carver Roboweld Limited"},
    "m.k. sons fine jewels": {"bseCode": "544282", "isin": "INE0W1201018", "name": "M.K. Sons Fine Jewels Limited"},
    "m. k. sons fine jewels": {"bseCode": "544282", "isin": "INE0W1201018", "name": "M.K. Sons Fine Jewels Limited"},
    "bombay coated and special steels": {"symbol": "BOMCOAT", "bseCode": "544285", "name": "Bombay Coated and Special Steels Limited"},
    "core4 engineers": {"bseCode": "545007", "symbol": "CORE4", "name": "Core4 Engineers Limited"},
    "core4 engineer": {"bseCode": "545007", "symbol": "CORE4", "name": "Core4 Engineers Limited"},
    "papadmalji agro": {"symbol": "PAPADMALJI", "name": "Papadmalji Agro Limited"},
    "papadmalji agro foods": {"symbol": "PAPADMALJI", "name": "Papadmalji Agro Limited"},
    "ravita engineering services": {"symbol": "RAVITA", "name": "Ravita Engineering Services Limited"},
    "eventions": {"symbol": "EVENTIONS", "name": "Eventions Limited"},
    "dove soft": {"bseCode": "544975", "symbol": "DSL", "name": "Dove Soft Limited"},
    "acme india industries": {"bseCode": "544283", "symbol": "ACMESOLAR", "name": "ACME Solar Holdings Limited"}
}


def read_js_object(path: Path, assignment: str):
    """Safely extracts a JSON object literal assigned in a JavaScript file."""
    text = path.read_text(encoding="utf-8")
    start = text.index(assignment) + len(assignment)
    while start < len(text) and text[start].isspace():
        start += 1
    depth = 0
    quoted = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if quoted:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                quoted = False
        elif char == '"':
            quoted = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start:index + 1])
    raise ValueError(f"Could not parse JS object in {path}")


def norm_string(s: str) -> str:
    """Aggressively normalizes company names for fuzzy string matching."""
    if not s:
        return ""
    s = str(s).lower()
    # Strip legal and generic corporate terms
    for term in [
        r"\blimited\b", r"\bltd\b", r"\bprivate\b", r"\bpvt\b",
        r"\bindustries\b", r"\bindustry\b", r"\btechnologies\b",
        r"\btechnology\b", r"\benterprises\b", r"\benterprise\b",
        r"\bsolutions\b", r"\bsolution\b", r"\bservices\b",
        r"\bservice\b", r"\bindia\b", r"\bco\b", r"\bcorp\b",
        r"\bcorporation\b", r"\bholdings\b", r"\bholding\b",
        r"\bipo\b", r"\b202[0-9]\b", r"&", r"\band\b"
    ]:
        s = re.sub(term, "", s)
    return re.sub(r"[^a-z0-9]", "", s)


def clean_tokens(s: str) -> set:
    """Extracts distinctive word tokens from a company name."""
    if not s:
        return set()
    words = re.findall(r"[a-z0-9]+", str(s).lower())
    stop = {
        "limited", "ltd", "private", "pvt", "industries", "industry",
        "technologies", "technology", "enterprises", "enterprise",
        "solutions", "solution", "services", "service", "india", "and",
        "the", "co", "corp", "corporation", "holding", "holdings", "ipo",
        "2024", "2025", "2026"
    }
    return {w for w in words if w not in stop and len(w) > 2}


def fetch_nse_master(ctx, headers):
    """Fetches official NSE Equity Master (EQUITY_L.csv)."""
    urls = [
        "https://archives.nseindia.com/content/equities/EQUITY_L.csv",
        "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
                print(f"✅ Fetched NSE Equity Master ({len(data)} bytes)")
                return data
        except Exception as e:
            print(f"⚠️ Failed fetching {url}: {e}")
    return None


def fetch_nse_bhavcopy(ctx, headers):
    """Fetches latest official NSE full bhavcopy."""
    date_candidates = [
        TODAY_IST.strftime("%d%m%Y"),
        (TODAY_IST - timedelta(days=1)).strftime("%d%m%Y"),
        (TODAY_IST - timedelta(days=2)).strftime("%d%m%Y"),
        (TODAY_IST - timedelta(days=3)).strftime("%d%m%Y"),
        "04112026"
    ]
    for d in date_candidates:
        url = f"https://archives.nseindia.com/products/content/sec_bhavdata_full_{d}.csv"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
                if len(data) > 50000 and "SYMBOL" in data[:200]:
                    print(f"✅ Fetched NSE Bhavcopy for {d} ({len(data)} bytes)")
                    return data, d
        except Exception:
            pass
    return None, None


def fetch_bse_bhavcopy(ctx, headers):
    """Fetches latest official BSE CM Bhavcopy."""
    date_candidates = [
        TODAY_IST.strftime("%Y%m%d"),
        (TODAY_IST - timedelta(days=1)).strftime("%Y%m%d"),
        (TODAY_IST - timedelta(days=2)).strftime("%Y%m%d"),
        (TODAY_IST - timedelta(days=3)).strftime("%Y%m%d"),
        "20261104"
    ]
    for d in date_candidates:
        url = f"https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_{d}_F_0000.CSV"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
                if len(data) > 100000 and "TradDt" in data[:200]:
                    print(f"✅ Fetched BSE Bhavcopy for {d} ({len(data)} bytes)")
                    return data, d
        except Exception:
            pass
    return None, None


def main():
    print(f"🚀 Building Unified Securities Master as of {TODAY_IST.isoformat()} (12M cutoff: {TWELVE_MONTHS_AGO})")
    
    ctx = ssl._create_unverified_context()
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.nseindia.com/"
    }

    # 1. Download official exchange masters
    nse_master_csv = fetch_nse_master(ctx, headers)
    nse_bhav_csv, nse_bhav_date = fetch_nse_bhavcopy(ctx, headers)
    bse_headers = {**headers, "Referer": "https://www.bseindia.com/"}
    bse_bhav_csv, bse_bhav_date = fetch_bse_bhavcopy(ctx, bse_headers)

    # Index NSE Master
    nse_by_isin = {}
    nse_by_norm = {}
    nse_by_sym = {}
    nse_by_tokens = []
    if nse_master_csv:
        reader = csv.DictReader(io.StringIO(nse_master_csv))
        for r in reader:
            sym = r.get("SYMBOL", "").strip()
            name = r.get("NAME OF COMPANY", "").strip()
            isin = r.get(" ISIN NUMBER", "").strip()
            if not isin:
                isin = r.get("ISIN NUMBER", "").strip()
            srs = r.get(" SERIES", "").strip() or r.get("SERIES", "").strip()
            n = norm_string(name)
            item = {"symbol": sym, "name": name, "isin": isin, "series": srs}
            if sym:
                nse_by_sym[sym] = item
            if isin:
                nse_by_isin[isin] = item
            if n:
                nse_by_norm[n] = item
            toks = clean_tokens(name)
            if len(toks) >= 2:
                nse_by_tokens.append((toks, item))

    # Index NSE Bhavcopy (for series like SM, ST, BE, and latest prices)
    nse_bhav_by_sym = {}
    if nse_bhav_csv:
        reader = csv.reader(io.StringIO(nse_bhav_csv))
        hdr = [h.strip() for h in next(reader, [])]
        try:
            sym_idx = hdr.index("SYMBOL")
            srs_idx = hdr.index("SERIES")
            close_idx = hdr.index("CLOSE_PRICE")
            prev_idx = hdr.index("PREV_CLOSE")
            vol_idx = hdr.index("TTL_TRD_QNTY")
            for row in reader:
                if len(row) > vol_idx:
                    sym = row[sym_idx].strip()
                    srs = row[srs_idx].strip()
                    cls_val = float(row[close_idx].strip()) if row[close_idx].strip() and row[close_idx].strip() != "-" else None
                    prev_val = float(row[prev_idx].strip()) if row[prev_idx].strip() and row[prev_idx].strip() != "-" else None
                    vol_val = int(row[vol_idx].strip()) if row[vol_idx].strip() and row[vol_idx].strip() != "-" else None
                    nse_bhav_by_sym[sym] = {
                        "symbol": sym,
                        "series": srs,
                        "closePrice": cls_val,
                        "prevClose": prev_val,
                        "volume": vol_val
                    }
        except Exception as e:
            print(f"⚠️ Error parsing NSE Bhavcopy: {e}")

    # Index BSE Bhavcopy
    bse_by_isin = {}
    bse_by_code = {}
    bse_by_norm = {}
    bse_by_ticker = {}
    bse_by_tokens = []
    if bse_bhav_csv:
        reader = csv.DictReader(io.StringIO(bse_bhav_csv))
        for r in reader:
            code = r.get("FinInstrmId", "").strip()
            name = r.get("FinInstrmNm", "").strip()
            isin = r.get("ISIN", "").strip()
            tick = r.get("TckrSymb", "").strip()
            srs = r.get("SctySrs", "").strip()
            cls_str = r.get("ClsPric", "").strip()
            prev_str = r.get("PrvsClsgPric", "").strip()
            vol_str = r.get("TtlTradgVol", "").strip()
            cls_val = float(cls_str) if cls_str and cls_str != "-" else None
            prev_val = float(prev_str) if prev_str and prev_str != "-" else None
            vol_val = int(vol_str) if vol_str and vol_str != "-" else None
            n = norm_string(name)
            item = {
                "bseCode": code,
                "ticker": tick,
                "name": name,
                "isin": isin,
                "series": srs,
                "closePrice": cls_val,
                "prevClose": prev_val,
                "volume": vol_val
            }
            if code:
                bse_by_code[code] = item
            if isin:
                bse_by_isin[isin] = item
            if n:
                bse_by_norm[n] = item
            if tick:
                bse_by_ticker[tick] = item
            toks = clean_tokens(name)
            if len(toks) >= 2:
                bse_by_tokens.append((toks, item))

    print(f"📊 Indexed: NSE Symbols={len(nse_by_sym)}, NSE Bhav={len(nse_bhav_by_sym)}, BSE Codes={len(bse_by_code)}")

    # 2. Ingest existing app datasets
    ipo_data = read_js_object(DATA_DIR / "ipo-data.js", "window.IpoData =")
    listed_data = read_js_object(DATA_DIR / "listed-gains-data.js", "window.ListedGainsData =")
    
    ipo_records = ipo_data.get("records", [])
    history_records = listed_data.get("records", [])
    print(f"📁 Loaded {len(ipo_records)} records from ipo-data.js and {len(history_records)} from listed-gains-data.js")

    # Map of ipo_records by slug and by normalized name for easy merging
    ipo_by_slug = {r.get("slug"): r for r in ipo_records if r.get("slug")}
    ipo_by_norm = {}
    for r in ipo_records:
        n = norm_string(r.get("companyName") or r.get("shortName") or r.get("id"))
        if n:
            ipo_by_norm[n] = r

    # Master securities registry
    master_securities = []
    seen_ids = set()
    unmapped_records = []
    mapped_count = 0

    # Process all historical records first
    for r in history_records:
        name = r.get("name") or ""
        slug = r.get("slug") or norm_string(name)
        sid = f"sec-{slug}"
        if sid in seen_ids:
            continue
        seen_ids.add(sid)

        # Merge with matching ipo_record if exists
        matched_ipo = ipo_by_slug.get(slug)
        if not matched_ipo:
            n_name = norm_string(name)
            matched_ipo = ipo_by_norm.get(n_name)

        # Basic fields
        short_name = name
        company_name = matched_ipo.get("companyName") if matched_ipo else name
        board = "SME" if (r.get("segment") == "SME" or (matched_ipo and matched_ipo.get("board") == "SME")) else "MAINBOARD"
        exchange = r.get("exchange") or (matched_ipo.get("exchange") if matched_ipo else ("BSE SME" if board == "SME" else "NSE, BSE"))
        
        issue_price = r.get("issuePrice") or (matched_ipo.get("issuePrice") if matched_ipo else None)
        listing_date = r.get("listedDate") or (matched_ipo.get("listingDate") if matched_ipo else None)
        listing_price = r.get("listingPrice") or (matched_ipo.get("listingPrice") if matched_ipo else None)
        listing_close = r.get("listingDayClose") or (matched_ipo.get("listingDayClose") if matched_ipo else None)
        listing_gain = r.get("listingGainPct") or (matched_ipo.get("listingGainPct") if matched_ipo else None)
        current_price = r.get("currentPrice") or (matched_ipo.get("currentPrice") if matched_ipo else None)
        return_since_issue = r.get("returnSinceIssuePct") or (matched_ipo.get("returnSinceIssuePct") if matched_ipo else None)
        subscription = r.get("subscription") or (matched_ipo.get("subscription") if matched_ipo else None)
        issue_size_cr = r.get("issueSizeCr") or (matched_ipo.get("issueSizeCr") if matched_ipo else None)

        # Multi-stage symbol & identifier matching
        nse_match = None
        bse_match = None
        alias_match = None

        name_lower = name.lower().strip()
        if name_lower in HISTORIC_ALIASES:
            alias_match = HISTORIC_ALIASES[name_lower]
        else:
            for k, v in HISTORIC_ALIASES.items():
                if k in name_lower or name_lower in k:
                    alias_match = v
                    break

        bcode = r.get("bseCode") or (matched_ipo.get("bseCode") if matched_ipo else None)
        if alias_match and "bseCode" in alias_match:
            bcode = alias_match["bseCode"]

        if bcode and bcode in bse_by_code:
            bse_match = bse_by_code[bcode]

        # Match by ISIN
        isin = (bse_match.get("isin") if bse_match else None) or (alias_match.get("isin") if alias_match else None) or (matched_ipo.get("isin") if matched_ipo else None)
        if isin and isin in nse_by_isin:
            nse_match = nse_by_isin[isin]
        if isin and not bse_match and isin in bse_by_isin:
            bse_match = bse_by_isin[isin]

        # Match by symbol
        sym = (alias_match.get("symbol") if alias_match else None) or (matched_ipo.get("symbol") if matched_ipo else None)
        if sym and sym in nse_by_sym:
            nse_match = nse_by_sym[sym]

        # Match by normalized name
        n = norm_string(name)
        if not bse_match and n in bse_by_norm:
            bse_match = bse_by_norm[n]
        if not nse_match and n in nse_by_norm:
            nse_match = nse_by_norm[n]

        # High-confidence token and similarity matching (prevent false positives)
        toks = clean_tokens(name)
        if not bse_match and len(toks) >= 2:
            for b_toks, b_item in bse_by_tokens:
                if toks == b_toks:
                    bse_match = b_item
                    break

        if not nse_match and len(toks) >= 2:
            for ns_toks, ns_item in nse_by_tokens:
                if toks == ns_toks:
                    nse_match = ns_item
                    break

        # Check NSE Bhavcopy directly only for distinctive names (>= 5 chars matching full first word)
        if not nse_match:
            first_word = re.findall(r"[A-Za-z0-9]+", name)
            if first_word and len(first_word[0]) >= 5:
                w_up = first_word[0].upper()
                if w_up in nse_bhav_by_sym and nse_bhav_by_sym[w_up].get("series") in ["SM", "ST", "EQ"]:
                    nse_match = {"symbol": w_up, "name": name, "isin": None}

        # Resolve final identifiers
        final_symbol = nse_match.get("symbol") if nse_match else (alias_match.get("symbol") if alias_match else None)
        final_bse_code = bse_match.get("bseCode") if bse_match else (alias_match.get("bseCode") if alias_match else bcode)
        final_isin = (nse_match.get("isin") if nse_match else None) or (bse_match.get("isin") if bse_match else None) or (alias_match.get("isin") if alias_match else isin)

        # Pull price from latest bhavcopy if available
        if nse_match and nse_match.get("symbol") in nse_bhav_by_sym:
            bhav = nse_bhav_by_sym[nse_match["symbol"]]
            if bhav.get("closePrice"):
                # Sanity check: prevent matching a different large-cap stock with 10x+ price gap
                if not alias_match and issue_price and float(issue_price) > 0:
                    ratio = float(bhav["closePrice"]) / float(issue_price)
                    if 0.05 <= ratio <= 15.0:
                        current_price = bhav["closePrice"]
                        price_source = "NSE_BHAVCOPY"
                    else:
                        # Price divergence indicates false fuzzy match; discard match
                        final_symbol = None
                        price_source = "HISTORICAL_RECORD"
                else:
                    current_price = bhav["closePrice"]
                    price_source = "NSE_BHAVCOPY"
        elif bse_match and bse_match.get("closePrice"):
            if not alias_match and issue_price and float(issue_price) > 0:
                ratio = float(bse_match["closePrice"]) / float(issue_price)
                if 0.05 <= ratio <= 15.0:
                    current_price = bse_match["closePrice"]
                    price_source = "BSE_BHAVCOPY"
                else:
                    final_bse_code = bcode
                    price_source = "HISTORICAL_RECORD"
            else:
                current_price = bse_match["closePrice"]
                price_source = "BSE_BHAVCOPY"
        else:
            price_source = "HISTORICAL_RECORD"

        # Calculate return since issue if possible
        if current_price is not None and issue_price:
            try:
                return_since_issue = round(((float(current_price) - float(issue_price)) / float(issue_price)) * 100, 2)
            except Exception:
                pass

        # Calculate listing gain if possible
        if listing_price is not None and issue_price:
            try:
                listing_gain = round(((float(listing_price) - float(issue_price)) / float(issue_price)) * 100, 2)
            except Exception:
                pass

        # Determine Tier
        is_recent_12m = False
        if listing_date and str(listing_date) >= TWELVE_MONTHS_AGO:
            is_recent_12m = True

        is_active = (nse_match is not None or bse_match is not None)
        
        if is_recent_12m:
            tier = "tier1"
            status = "LISTED"
            price_status = "ACTIVE"
        elif is_active:
            tier = "tier2"
            status = "LISTED"
            price_status = "ACTIVE"
        else:
            tier = "tier3"
            status = "SUSPENDED" if current_price else "DELISTED"
            price_status = "SUSPENDED"

        # Yahoo Symbol
        yahoo_sym = None
        if final_symbol:
            yahoo_sym = f"{final_symbol}.NS"
        elif final_bse_code:
            yahoo_sym = f"{final_bse_code}.BO"

        # Initials & Visual Color
        words = re.findall(r"[A-Za-z0-9]+", short_name)
        initials = (words[0][0] + (words[1][0] if len(words) > 1 else words[0][1:2])).upper() if words else "IP"
        logo_color = "#2563EB" if board == "MAINBOARD" else "#0D9488"
        logo_path = matched_ipo.get("logo") if matched_ipo else None

        # Year computation
        year_val = None
        if listing_date and len(str(listing_date)) >= 4 and str(listing_date)[:4].isdigit():
            year_val = int(str(listing_date)[:4])
        elif r.get("year"):
            year_val = r.get("year")
        else:
            year_val = "historic"

        record = {
            "id": sid,
            "slug": slug,
            "name": company_name,
            "shortName": short_name,
            "symbol": final_symbol,
            "bseCode": final_bse_code,
            "isin": final_isin,
            "exchange": exchange,
            "board": board,
            "segment": "SME" if board == "SME" else "Mainboard",
            "year": year_val,
            "isHistoric": bool(r.get("isHistoric", False) or (isinstance(year_val, int) and year_val < 2018)),
            "issuePrice": issue_price,
            "listingDate": listing_date,
            "listedDate": listing_date,
            "listingPrice": listing_price,
            "listingDayClose": listing_close,
            "listingGainPct": listing_gain,
            "currentPrice": current_price,
            "returnSinceIssuePct": return_since_issue,
            "issueSizeCr": issue_size_cr,
            "subscription": subscription,
            "tier": tier,
            "status": status,
            "priceStatus": price_status,
            "yahooSymbol": yahoo_sym,
            "logo": logo_path,
            "initials": initials,
            "logoColor": logo_color,
            "lastUpdated": datetime.now(IST).isoformat(),
            "priceSource": price_source
        }

        master_securities.append(record)
        if final_symbol or final_bse_code or final_isin:
            mapped_count += 1
        else:
            unmapped_records.append({
                "name": name,
                "slug": slug,
                "listingDate": listing_date,
                "segment": board,
                "lastPrice": current_price,
                "tier": tier,
                "reason": "Not actively trading in current NSE/BSE Bhavcopies (delisted, renamed, or historic)"
            })

    # Now add any OPEN, UPCOMING, or CLOSED IPOs from ipo-data.js that are not in ListedGainsData
    for r in ipo_records:
        slug = r.get("slug")
        sid = f"sec-{slug}"
        if sid in seen_ids:
            continue
        seen_ids.add(sid)

        status = r.get("status", "UPCOMING")
        tier = "tier1"
        board = r.get("board", "MAINBOARD")
        short_name = r.get("shortName") or r.get("companyName")
        company_name = r.get("companyName") or short_name

        words = re.findall(r"[A-Za-z0-9]+", short_name)
        initials = (words[0][0] + (words[1][0] if len(words) > 1 else words[0][1:2])).upper() if words else "IP"

        record = {
            "id": sid,
            "slug": slug,
            "name": company_name,
            "shortName": short_name,
            "symbol": r.get("symbol"),
            "bseCode": r.get("bseCode"),
            "isin": r.get("isin"),
            "exchange": r.get("exchange", "BSE, NSE"),
            "board": board,
            "segment": "SME" if board == "SME" else "Mainboard",
            "year": 2026,
            "isHistoric": False,
            "issuePrice": r.get("issuePrice"),
            "listingDate": r.get("listingDate"),
            "listedDate": r.get("listingDate"),
            "listingPrice": r.get("listingPrice"),
            "listingDayClose": r.get("listingDayClose"),
            "listingGainPct": r.get("listingGainPct"),
            "currentPrice": r.get("currentPrice"),
            "returnSinceIssuePct": r.get("returnSinceIssuePct"),
            "issueSizeCr": r.get("issueSizeCr"),
            "subscription": r.get("subscription"),
            "tier": tier,
            "status": status,
            "priceStatus": "UNLISTED" if status in ["OPEN", "UPCOMING", "CLOSED"] else "ACTIVE",
            "yahooSymbol": None,
            "logo": r.get("logo"),
            "initials": r.get("initials") or initials,
            "logoColor": r.get("logoColor") or "#10B981",
            "lastUpdated": datetime.now(IST).isoformat(),
            "priceSource": "PRIMARY_DISCLOSURE"
        }
        master_securities.append(record)
        mapped_count += 1

    # Sort master_securities by listingDate desc
    def sort_key(x):
        ld = str(x.get("listingDate") or "")
        return ld

    master_securities.sort(key=sort_key, reverse=True)

    tier1_list = [s for s in master_securities if s["tier"] == "tier1"]
    tier2_list = [s for s in master_securities if s["tier"] == "tier2"]
    tier3_list = [s for s in master_securities if s["tier"] == "tier3"]

    # Compute by-year statistics for instant KPI cards on Listed page
    by_year_stats = {}
    years_seen = set()
    for s in master_securities:
        yr = s.get("year")
        if yr:
            years_seen.add(str(yr))

    for yr_key in sorted(years_seen, reverse=True):
        yr_records = [s for s in master_securities if str(s.get("year")) == yr_key and s.get("status") == "LISTED"]
        if not yr_records:
            continue
        gains = [float(s["listingGainPct"]) for s in yr_records if s.get("listingGainPct") is not None]
        avg_gain = round(sum(gains) / len(gains), 2) if gains else None
        sorted_gains = sorted(gains)
        med_gain = round(sorted_gains[len(sorted_gains) // 2], 2) if gains else None
        above_count = sum(1 for g in gains if g > 0)
        share_above = round((above_count / len(gains)) * 100, 1) if gains else None
        total_size = round(sum(float(s["issueSizeCr"]) for s in yr_records if s.get("issueSizeCr")), 2)
        try:
            yr_int = int(yr_key)
        except ValueError:
            yr_int = yr_key
        by_year_stats[yr_key] = {
            "year": yr_int,
            "avgGainPct": avg_gain,
            "medGainPct": med_gain,
            "totalListed": len(yr_records),
            "aboveIssue": above_count,
            "shareAbovePct": share_above,
            "totalIssueSizeCr": total_size if total_size > 0 else None
        }

    # Statistics
    stats = {
        "totalSecurities": len(master_securities),
        "mappedCount": mapped_count,
        "unmappedCount": len(unmapped_records),
        "matchRatePct": round((mapped_count / len(master_securities)) * 100, 2),
        "tier1Count": len(tier1_list),
        "tier2Count": len(tier2_list),
        "tier3Count": len(tier3_list),
        "twelveMonthCutoff": TWELVE_MONTHS_AGO,
        "updatedAt": datetime.now(IST).isoformat(),
        "byYear": by_year_stats,
        "sources": {
            "nseMaster": bool(nse_master_csv),
            "nseBhavcopyDate": nse_bhav_date,
            "bseBhavcopyDate": bse_bhav_date
        }
    }

    # 3. Write data/securities-master.json
    out_master_json = {
        "metadata": stats,
        "records": master_securities
    }
    with open(DATA_DIR / "securities-master.json", "w", encoding="utf-8") as f:
        json.dump(out_master_json, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved data/securities-master.json ({len(master_securities)} total records)")

    # 4. Write data/securities-master.js for direct frontend browser consumption
    js_content = f"""/* Canonical Single Source of Truth for Indian Securities & IPO Tracking */
(function(window) {{
  const master = {json.dumps(out_master_json, ensure_ascii=False)};
  window.SecuritiesMaster = master;
  // Seamless backward-compatible bridge for ListedGainsData
  window.ListedGainsData = {{
    stats: master.metadata.byYear || {{}},
    records: master.records || [],
    totalCount: (master.records && master.records.length) || 0,
    years: [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, "historic", 1875]
  }};
}})(typeof window !== "undefined" ? window : global);
"""
    with open(DATA_DIR / "securities-master.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print("✅ Saved data/securities-master.js")

    # 5. Write data/unmapped-securities-report.json
    unmapped_report = {
        "generatedAt": datetime.now(IST).isoformat(),
        "stats": stats,
        "unmappedSecurities": unmapped_records
    }
    with open(DATA_DIR / "unmapped-securities-report.json", "w", encoding="utf-8") as f:
        json.dump(unmapped_report, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved data/unmapped-securities-report.json ({len(unmapped_records)} unmapped records)")

    print("\n" + "=" * 60)
    print("🎯 SECURITIES MASTER BUILD SUMMARY")
    print(f"Total Tracked Securities: {stats['totalSecurities']}")
    print(f"Mapped Securities:        {stats['mappedCount']} ({stats['matchRatePct']}%)")
    print(f"Tier 1 (5-Min Live / 12M):{stats['tier1Count']}")
    print(f"Tier 2 (Older Active):    {stats['tier2Count']}")
    print(f"Tier 3 (Suspended/Hist):  {stats['tier3Count']}")
    print(f"Unmapped Exception Scrips:{stats['unmappedCount']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
