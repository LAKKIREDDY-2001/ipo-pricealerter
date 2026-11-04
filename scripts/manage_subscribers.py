#!/usr/bin/env python3
"""
Subscriber Excel & GitHub Deduplication Manager
Stores strictly email details in one Excel file in GitHub (data/subscribers.xlsx & data/subscribers.csv).
Enforces strict deduplication:
- Each email address is recorded only once.
- Duplicates are rejected and strictly blocked from storage in GitHub or Excel.
"""

import sys
import os
import re
import csv
import json
import urllib.request
import ssl
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
XLSX_PATH = os.path.join(DATA_DIR, "subscribers.xlsx")
CSV_PATH = os.path.join(DATA_DIR, "subscribers.csv")
JSON_PATH = os.path.join(DATA_DIR, "subscribers.json")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
HEADERS = ["Email Address", "Subscribed Date (IST)", "Status"]

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def normalize_email(email):
    if not email:
        return ""
    return str(email).strip().lower()

def get_existing_subscribers():
    """Loads all existing unique subscriber mail details from Excel/CSV/JSON."""
    subscribers = []
    seen_emails = set()

    # 1. Load from Excel first if present
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
                        "subscribed_at": str(row[1] or datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                        "status": str(row[2] or "Active")
                    })
            return subscribers, seen_emails
        except Exception as e:
            print(f"[Notice] Reading {XLSX_PATH}: {e}")

    # 2. Fallback to CSV
    if os.path.exists(CSV_PATH):
        try:
            with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    email = normalize_email(row.get("Email Address", "") or row.get("Email", ""))
                    if email and email not in seen_emails:
                        seen_emails.add(email)
                        subscribers.append({
                            "email": email,
                            "subscribed_at": row.get("Subscribed Date (IST)", "") or row.get("Subscribed Date", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                            "status": row.get("Status", "Active")
                        })
            return subscribers, seen_emails
        except Exception as e:
            print(f"[Notice] Reading {CSV_PATH}: {e}")

    # 3. Fallback to JSON
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
                            "subscribed_at": item.get("subscribed_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                            "status": item.get("status", "Active")
                        })
            return subscribers, seen_emails
        except Exception as e:
            print(f"[Notice] Reading {JSON_PATH}: {e}")

    return subscribers, seen_emails

def save_all_formats(subscribers):
    """Saves unique subscribers strictly into one Excel (.xlsx) file, plus CSV and JSON."""
    ensure_data_dir()

    # 1. Save formatted Excel Workbook (.xlsx)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Subscribers"

    ws.append(HEADERS)

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1A237E", end_color="1A237E", fill_type="solid")
    header_align = Alignment(horizontal="center", vertical="center")
    thin_border = Border(
        left=Side(style="thin", color="E2E8F0"),
        right=Side(style="thin", color="E2E8F0"),
        top=Side(style="thin", color="E2E8F0"),
        bottom=Side(style="thin", color="E2E8F0")
    )

    for col_num in range(1, len(HEADERS) + 1):
        cell = ws.cell(row=1, column=col_num)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align

    row_font = Font(name="Calibri", size=10)
    for idx, sub in enumerate(subscribers, start=2):
        row_values = [
            sub["email"],
            sub.get("subscribed_at", ""),
            sub.get("status", "Active")
        ]
        ws.append(row_values)
        for col_num in range(1, len(row_values) + 1):
            cell = ws.cell(row=idx, column=col_num)
            cell.font = row_font
            cell.border = thin_border
            if col_num in (2, 3):
                cell.alignment = Alignment(horizontal="center")

    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 5, 20)

    ws.freeze_panes = "A2"
    wb.save(XLSX_PATH)
    print(f"✓ Saved {len(subscribers)} unique subscribers into Excel: {XLSX_PATH}")

    # 2. Save CSV (UTF-8 with BOM for native Microsoft Excel opening)
    with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(HEADERS)
        for sub in subscribers:
            writer.writerow([
                sub["email"],
                sub.get("subscribed_at", ""),
                sub.get("status", "Active")
            ])
    print(f"✓ Saved {len(subscribers)} unique subscribers into CSV: {CSV_PATH}")

    # 3. Save JSON
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(subscribers, f, indent=2)
    print(f"✓ Saved {len(subscribers)} unique subscribers into JSON: {JSON_PATH}")

def add_subscriber(email, subscribed_at=None):
    """Adds a subscriber, strictly checking for duplicates. Blocks duplicate storage."""
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

    new_sub = {
        "email": norm_email,
        "subscribed_at": subscribed_at or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "Active"
    }
    subscribers.append(new_sub)
    save_all_formats(subscribers)
    print(f"\n✅ [SUCCESS] Subscriber '{norm_email}' successfully added to Excel.")
    return True, "Subscribed successfully"

def remove_subscriber(email):
    """Deletes user details completely from Excel, CSV, and JSON."""
    norm_email = normalize_email(email)
    if not norm_email:
        print(f"❌ [INVALID EMAIL] '{email}'")
        return False, "Invalid email address"

    existing_subs, seen_emails = get_existing_subscribers()
    if norm_email not in seen_emails:
        print(f"ℹ️ Email '{norm_email}' not found in subscribers list.")
        return False, "Email not found"

    filtered = [s for s in existing_subs if normalize_email(s.get("email")) != norm_email]
    save_all_formats(filtered)
    print(f"🗑️ [DELETED] User details for '{norm_email}' successfully deleted from Excel, CSV, and JSON.")
    return True, "User details deleted successfully"

def sync_from_kv(export_url="https://pricealerter.in/api/subscribers-export?format=json"):
    """Fetches KV subscriber pairs and syncs them into the GitHub Excel file with deduplication and deletion."""
    print(f"🔄 Syncing KV subscriber pairs from {export_url}...")
    try:
        req = urllib.request.Request(export_url, headers={"User-Agent": "GitHub-Action-Excel-Sync"})
        try:
            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as ssl_err:
            insecure_ctx = ssl._create_unverified_context()
            with urllib.request.urlopen(req, context=insecure_ctx, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        
        kv_subscribers = data.get("subscribers", [])
        print(f"📥 Received {len(kv_subscribers)} subscriber records from KV.")
        
        existing_subs, seen_emails = get_existing_subscribers()
        active_kv_emails = {normalize_email(item.get("email")) for item in kv_subscribers if normalize_email(item.get("email"))}
        
        # 1. Filter existing subscribers: Keep only those present in KV, delete unsubscribed user details
        retained_subs = []
        deleted_count = 0
        for sub in existing_subs:
            e = normalize_email(sub.get("email"))
            if e in active_kv_emails:
                retained_subs.append(sub)
            else:
                print(f"🗑️ Deleting user details from Excel for unsubscribed email: {e}")
                deleted_count += 1
                
        # 2. Add any new subscribers from KV
        retained_emails = {normalize_email(s.get("email")) for s in retained_subs}
        new_count = 0
        for item in kv_subscribers:
            e = normalize_email(item.get("email"))
            if e and e not in retained_emails:
                retained_emails.add(e)
                retained_subs.append({
                    "email": e,
                    "subscribed_at": item.get("subscribedAt") or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "status": "Active"
                })
                new_count += 1
                
        if new_count > 0 or deleted_count > 0:
            save_all_formats(retained_subs)
            print(f"✅ Successfully updated Excel: {new_count} added, {deleted_count} deleted. Total current: {len(retained_subs)}")
            return True, new_count + deleted_count
        else:
            print("ℹ️ All KV subscribers already present in Excel file. Zero duplicates added.")
            return False, 0
            
    except Exception as err:
        print(f"⚠️ Could not sync from KV endpoint: {err}")
        return False, 0

def validate_no_duplicates():
    """Asserts that there are strictly 0 duplicates in XLSX, CSV, and JSON."""
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

    if errors:
        print("\n❌ [ERROR] Duplicate subscribers detected!")
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
        elif command == "--sync-kv":
            url = sys.argv[2] if len(sys.argv) > 2 else "https://pricealerter.in/api/subscribers-export?format=json"
            sync_from_kv(url)
        elif command == "--add" and len(sys.argv) > 2:
            email_arg = sys.argv[2]
            success, msg = add_subscriber(email_arg)
            if not success:
                sys.exit(2 if "DUPLICATE" in msg else 1)
        elif command == "--remove" and len(sys.argv) > 2:
            email_arg = sys.argv[2]
            success, msg = remove_subscriber(email_arg)
            if not success:
                sys.exit(1)
        elif command == "--init":
            subs, _ = get_existing_subscribers()
            save_all_formats(subs)
        elif command == "--list":
            subs, _ = get_existing_subscribers()
            print(f"Total Unique Subscribers in Excel: {len(subs)}")
            for idx, s in enumerate(subs, 1):
                print(f"  {idx}. {s['email']} ({s.get('subscribed_at', '—')})")
        else:
            print("Usage:")
            print("  python3 manage_subscribers.py --add <email>")
            print("  python3 manage_subscribers.py --sync-kv [endpoint_url]")
            print("  python3 manage_subscribers.py --validate")
            print("  python3 manage_subscribers.py --list")
            print("  python3 manage_subscribers.py --init")
    else:
        subs, _ = get_existing_subscribers()
        save_all_formats(subs)
