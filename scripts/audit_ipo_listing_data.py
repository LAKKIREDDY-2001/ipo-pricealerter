#!/usr/bin/env python3
"""Audit the IPO datasets for internal inconsistencies before publishing.

This is an internal consistency audit only. It does not certify exchange prices.
Official NSE/BSE listing records and bhavcopies must be used to resolve every flag.
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_js_object(path: Path, assignment: str):
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
    raise ValueError(f"Could not parse object in {path}")


def normalize(value):
    return re.sub(r"[^a-z0-9]", "", re.sub(r"limited|ltd|&", "", str(value or "").lower()))


def pct(price, base):
    if price is None or base is None or not base:
        return None
    return round((float(price) - float(base)) / float(base) * 100, 2)


def main():
    ipo = read_js_object(ROOT / "data/ipo-data.js", "window.IpoData =")
    history = read_js_object(ROOT / "data/listed-gains-data.js", "window.ListedGainsData =")
    history_by_name = {normalize(row.get("name")): row for row in history.get("records", [])}
    conflicts = []
    missing = []
    math_errors = []
    missing_identifiers = []
    for row in ipo.get("records", []):
        if row.get("status") != "LISTED":
            continue
        name = row.get("companyName") or row.get("shortName") or row.get("id")
        old = history_by_name.get(normalize(name))
        if row.get("listingPrice") is None:
            missing.append({"name": name, "listingDate": row.get("listingDate"), "field": "listingPrice"})
        if not row.get("symbol") and not row.get("isin"):
            missing_identifiers.append(name)
        if old:
            for left, right, field in [
                (row.get("listingDate"), old.get("listedDate"), "listingDate"),
                (row.get("issuePrice"), old.get("issuePrice"), "issuePrice"),
                (row.get("listingPrice"), old.get("listingPrice"), "listingPrice"),
            ]:
                if left is not None and right is not None and left != right:
                    conflicts.append({"name": name, "field": field, "ipoData": left, "listedHistory": right})
        gain = row.get("listingGainPct")
        expected = pct(row.get("listingPrice"), row.get("issuePrice"))
        if gain is not None and expected is not None and abs(float(gain) - expected) > 0.15:
            math_errors.append({"name": name, "field": "listingGainPct", "stored": gain, "calculated": expected})
    report = {
        "generatedAt": date.today().isoformat(),
        "scope": "Internal consistency only; not an exchange verification",
        "ipoRecordCount": len(ipo.get("records", [])),
        "listedRecordCount": sum(1 for r in ipo.get("records", []) if r.get("status") == "LISTED"),
        "crossDatasetConflicts": conflicts,
        "listedRowsMissingListingPrice": missing,
        "listedRowsMissingSymbolAndIsin": missing_identifiers,
        "listingGainArithmeticErrors": math_errors,
        "verifiedListingCloseCount": sum(1 for r in ipo.get("records", []) if r.get("status") == "LISTED" and r.get("listingDayClose") is not None),
        "note": "Do not infer missing values. Resolve each flag against the designated exchange's listing-day bhavcopy or official IPO tracker. Listing open and listing-day close are separate values."
    }
    out = ROOT / "data/listing-data-quality-report.json"
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if not isinstance(v, list)}, indent=2))
    print(f"Conflicts: {len(conflicts)}; missing listing prices: {len(missing)}; arithmetic errors: {len(math_errors)}")
    return 1 if conflicts or math_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
