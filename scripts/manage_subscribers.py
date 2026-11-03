#!/usr/bin/env python3
"""
Subscriber Excel & GitHub Deduplication Manager
Ensures that all subscriber emails are stored in Excel (subscribers.xlsx & subscribers.csv),
strictly prevents duplicate entries, marks duplicates, and blocks duplicates from being stored in GitHub.
"""

import sys
import os
import re
import csv
import json
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
XLSX_PATH = os.path.join(DATA_DIR, "subscribers.xlsx")
CSV_PATH = os.path.join(DATA_DIR, "subscribers.csv")
JSON_PATH = os.path.join(DATA_DIR, "subscribers.json")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def normalize_email(email):
    if not email:
        return ""
    return str(email).strip().lower()

def get_existing_subscribers():
    """Loads all existing unique subscribers from Excel/CSV/JSON."""
    subscribers = []
    seen_emails = set()

    # Try loading from Excel first if it exists
    if os.path.exists(XLSX_PATH):
        try:
            wb = openpyxl.load_workbook(XLSX_PATH)
            ws = wb.active
            for row in ws.iter_rows(min_row=2, values_only=True):
                if not row or not row[0]:
                    continue
                email = normalize_email(row[0])
                if email and email not in seen_emails:
                    seen_emails.add(email)
                    subscribers.append({
                        "email": email,
                        "name": str(row[1] or ""),
                        "subscribed_at": str(row[2] or datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                        "status": str(row[3] or "Active"),
                        "source": str(row[4] or "IPO Pricealerter")
                    })
            return subscribers, seen_emails
        except Exception as e:
            print(f"[Warning] Could not read from {XLSX_PATH}: {e}")

    # Fallback to CSV if Excel doesn't exist
    if os.path.exists(CSV_PATH):
        try:
            with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    email = normalize_email(row.get("Email Address", ""))
                    if email and email not in seen_emails:
                        seen_emails.add(email)
                        subscribers.append({
                            "email": email,
                            "name": row.get("Name", ""),
                            "subscribed_at": row.get("Subscribed Date", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                            "status": row.get("Status", "Active"),
                            "source": row.get("Source", "IPO Pricealerter")
                        })
            return subscribers, seen_emails
        except Exception as e:
            print(f"[Warning] Could not read from {CSV_PATH}: {e}")

    # Fallback to JSON
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    email = normalize_email(item.get("email", ""))
                    if email and email not in seen_emails:
                        seen_emails.add(email)
                        subscribers.append({
                            "email": email,
                            "name": item.get("name", ""),
                            "subscribed_at": item.get("subscribed_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                            "status": item.get("status", "Active"),
                            "source": item.get("source", "IPO Pricealerter")
                        })
            return subscribers, seen_emails
        except Exception as e:
            print(f"[Warning] Could not read from {JSON_PATH}: {e}")

    return subscribers, seen_emails

def save_all_formats(subscribers):
    """Saves unique subscribers to formatted Excel (.xlsx), CSV, and JSON."""
    ensure_data_dir()

    # 1. Save Excel Workbook (.xlsx) with professional formatting
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "IPO Subscribers"

    # Header styling
    headers = ["Email Address", "Name", "Subscribed Date", "Status", "Source"]
    ws.append(headers)

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1A237E", end_color="1A237E", fill_type="solid")
    header_align = Alignment(horizontal="center", vertical="center")
    thin_border = Border(
        left=Side(style="thin", color="E0E0E0"),
        right=Side(style="thin", color="E0E0E0"),
        top=Side(style="thin", color="E0E0E0"),
        bottom=Side(style="thin", color="E0E0E0")
    )

    for col_num in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_num)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align

    # Data rows
    row_font = Font(name="Calibri", size=10)
    for idx, sub in enumerate(subscribers, start=2):
        row_values = [
            sub["email"],
            sub.get("name", ""),
            sub.get("subscribed_at", ""),
            sub.get("status", "Active"),
            sub.get("source", "IPO Pricealerter")
        ]
        ws.append(row_values)
        for col_num in range(1, len(row_values) + 1):
            cell = ws.cell(row=idx, column=col_num)
            cell.font = row_font
            cell.border = thin_border
            if col_num in (3, 4, 5):
                cell.alignment = Alignment(horizontal="center")

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 15)

    ws.freeze_panes = "A2"
    wb.save(XLSX_PATH)
    print(f"✓ Saved {len(subscribers)} unique subscribers to Excel: {XLSX_PATH}")

    # 2. Save CSV (UTF-8 with BOM for native Microsoft Excel opening)
    with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for sub in subscribers:
            writer.writerow([
                sub["email"],
                sub.get("name", ""),
                sub.get("subscribed_at", ""),
                sub.get("status", "Active"),
                sub.get("source", "IPO Pricealerter")
            ])
    print(f"✓ Saved {len(subscribers)} unique subscribers to CSV: {CSV_PATH}")

    # 3. Save JSON for web client consumption
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(subscribers, f, indent=2)
    print(f"✓ Saved {len(subscribers)} unique subscribers to JSON: {JSON_PATH}")

def add_subscriber(email, name="", source="IPO Pricealerter"):
    """Adds a subscriber, strictly checking for duplicates. Rejects duplicate storage."""
    norm_email = normalize_email(email)
    if not norm_email or not EMAIL_REGEX.match(norm_email):
        print(f"❌ [INVALID EMAIL] '{email}' is not a valid email address.")
        return False, "Invalid email address"

    subscribers, seen_emails = get_existing_subscribers()

    # Strict Duplicate Check
    if norm_email in seen_emails:
        print(f"\n⚠️  [DUPLICATE DETECTED] Email '{norm_email}' is ALREADY subscribed!")
        print(f"🚫 [BLOCKED] Strictly NOT allowed to store duplicates in GitHub or Excel.")
        return False, "DUPLICATE: Email already exists"

    # Unique email: Add once
    new_sub = {
        "email": norm_email,
        "name": (name or "").strip(),
        "subscribed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "Active",
        "source": source or "IPO Pricealerter"
    }
    subscribers.append(new_sub)
    save_all_formats(subscribers)
    print(f"\n✅ [SUCCESS] New subscriber '{norm_email}' successfully added to Excel.")
    return True, "Subscribed successfully"

def validate_no_duplicates():
    """Asserts that there are strictly 0 duplicates in XLSX, CSV, and JSON. Used in CI/GitHub Actions."""
    errors = []

    # 1. Validate XLSX
    if os.path.exists(XLSX_PATH):
        try:
            wb = openpyxl.load_workbook(XLSX_PATH)
            ws = wb.active
            xlsx_emails = []
            for row in ws.iter_rows(min_row=2, values_only=True):
                if row and row[0]:
                    e = normalize_email(row[0])
                    if e:
                        xlsx_emails.append(e)
            if len(xlsx_emails) != len(set(xlsx_emails)):
                dups = [x for x in set(xlsx_emails) if xlsx_emails.count(x) > 1]
                errors.append(f"Duplicate emails in Excel ({XLSX_PATH}): {dups}")
        except Exception as err:
            errors.append(f"Error checking {XLSX_PATH}: {err}")

    # 2. Validate CSV
    if os.path.exists(CSV_PATH):
        try:
            with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                csv_emails = [normalize_email(r.get("Email Address", "")) for r in reader if r.get("Email Address")]
            if len(csv_emails) != len(set(csv_emails)):
                dups = [x for x in set(csv_emails) if csv_emails.count(x) > 1]
                errors.append(f"Duplicate emails in CSV ({CSV_PATH}): {dups}")
        except Exception as err:
            errors.append(f"Error checking {CSV_PATH}: {err}")

    # 3. Validate JSON
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                json_emails = [normalize_email(x.get("email", "")) for x in data if x.get("email")]
            if len(json_emails) != len(set(json_emails)):
                dups = [x for x in set(json_emails) if json_emails.count(x) > 1]
                errors.append(f"Duplicate emails in JSON ({JSON_PATH}): {dups}")
        except Exception as err:
            errors.append(f"Error checking {JSON_PATH}: {err}")

    if errors:
        print("\n❌ [GITHUB REPOSITORY ERROR] Duplicate subscribers detected!")
        for err in errors:
            print(f"  • {err}")
        print("🚫 Duplicates are strictly prohibited from being stored in GitHub!")
        sys.exit(1)

    subscribers, _ = get_existing_subscribers()
    print(f"\n✅ [PASSED] Repository Excel validation verified: {len(subscribers)} unique subscribers, 0 duplicates.")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        if command == "--validate":
            validate_no_duplicates()
        elif command == "--add" and len(sys.argv) > 2:
            email_arg = sys.argv[2]
            name_arg = sys.argv[3] if len(sys.argv) > 3 else ""
            success, msg = add_subscriber(email_arg, name_arg)
            if not success:
                sys.exit(2 if "DUPLICATE" in msg else 1)
        elif command == "--init":
            subs, _ = get_existing_subscribers()
            save_all_formats(subs)
        elif command == "--list":
            subs, _ = get_existing_subscribers()
            print(f"Total Unique Subscribers: {len(subs)}")
            for idx, s in enumerate(subs, 1):
                print(f"  {idx}. {s['email']} ({s['name'] or 'No Name'}) - {s['subscribed_at']}")
        else:
            print("Usage:")
            print("  python3 manage_subscribers.py --add <email> [name]")
            print("  python3 manage_subscribers.py --validate")
            print("  python3 manage_subscribers.py --list")
            print("  python3 manage_subscribers.py --init")
    else:
        # Default initialization
        subs, _ = get_existing_subscribers()
        save_all_formats(subs)
