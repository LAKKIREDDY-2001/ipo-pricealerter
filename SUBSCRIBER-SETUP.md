# Subscriber Storage & Service Setup — PriceAlerter

The subscription service uses **Cloudflare Pages Functions** (`/api/subscribe`, `/api/unsubscribe`, `/api/subscribers-export`) with automatic multi-channel collection and duplicate prevention:

1. **Cloudflare KV Namespace (Primary Private Server Storage)**: Stores encrypted/hashed subscriber records with deduplication.
2. **Instant Email Alert Dispatch (Zero Lost Subscribers)**: Dispatches a notification to `lakkistudy@gmail.com` for every new subscriber.
3. **Resilient Fallback**: If Cloudflare KV is not yet bound or unavailable, subscriptions **still succeed cleanly** (no `503 Service Unavailable` or "Subscription service is not configured yet" errors).

---

## ⚡ Cloudflare KV Binding (Optional for Server KV Storage)

If you wish to store all records inside Cloudflare's private KV database:

1. Open **[Cloudflare Dashboard](https://dash.cloudflare.com/)** &rarr; **Workers & Pages**.
2. Select your project: **`pricealerter`** (or `ipo-pricealerter`).
3. Go to **Settings** &rarr; **Functions** &rarr; scroll to **KV namespace bindings**.
4. Click **Add binding**:
   - **Variable name**: `SUBSCRIBERS` *(exact spelling, all uppercase)*
   - **KV namespace**: Select or create a namespace named `pricealerter-subscribers`.
5. (Optional Admin Export Key) Under **Settings** &rarr; **Environment variables**:
   - Variable name: `SUBSCRIBER_ADMIN_KEY`
   - Value: a secure random string (e.g. `PriceAlerter_Secret_Export_Key_2026`)
6. Trigger a deployment or push a commit.

---

## API Endpoints

- **`POST /api/subscribe`**: Validates email format, enforces strict deduplication, stores to KV if bound, notifies owner, and returns:
  ```json
  { "success": true, "message": "Thank you! Your email has been added to the IPO alerts list." }
  ```
- **`POST /api/unsubscribe`**: Removes the subscriber key from KV and returns confirmation.
- **`GET /api/subscribers-export`**: Requires `X-Admin-Key` header; downloads an Excel-compatible CSV with UTF-8 BOM (`\uFEFF`).

---

## Excel Export Options

1. **Team Server Export**: Click *Export to Excel* and enter your `SUBSCRIBER_ADMIN_KEY`.
2. **Local Cache Export**: Leave the prompt blank to instantly download locally cached unique subscribers formatted for Microsoft Excel.
