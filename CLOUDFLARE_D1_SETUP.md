# PriceAlerter — Cloudflare Pages + D1 setup

This repository remains a **Cloudflare Pages** application. The existing React/Vite site continues to build to `dist/`; Pages Functions in `functions/` handle `/api/*`. D1 stores account and user data plus imported IPO/stock snapshots and quote observations.

**Production setup status:** The D1 database `pricealerter-db` (ID `7f9ae459-221b-4076-be7f-0e755d7db363`) already exists and is bound as `DB` in Production and Preview. Do not create another database or binding. The CLI-only file `wrangler.d1.example.toml` already targets this database. To install the schema, authenticate Wrangler and run `npx wrangler@latest d1 migrations apply pricealerter-db --remote --config wrangler.d1.example.toml`.

## What is implemented in this repository

- Initial D1 schema in `migrations/0001_initial_d1_schema.sql`.
- Pages API D1 adapter in `functions/lib/d1-api.ts`.
- D1 integration from `functions/api/[[path]].ts`.
- Password hashing with Web Crypto PBKDF2-SHA256; opaque bearer tokens are stored as SHA-256 hashes, not raw tokens.
- Registration/login/logout/current-user, preference updates, password change, personal-data export, account deletion.
- Watchlist CRUD, price-alert CRUD, notification listing/read state.
- D1 latest quote and quote-history tables; quote history is recorded only when the third-party quote fetch succeeds.
- Protected admin snapshot import endpoint: `POST /api/admin/sync-snapshot`.
- IPO and stock records are read from D1 after snapshot import; fetched stock quote observations are persisted to D1.
- Market quotes are best-effort third-party data and may be delayed. D1 does not make a third-party feed exchange-authoritative.
- Password reset is implemented with one-time D1 tokens and Resend delivery; it requires `RESEND_API_KEY`, `MAIL_FROM` and `SITE_URL` Pages variables. Scheduled alert evaluation, SSE streaming, admin editing tools and automatic alert delivery require separate services.

## 1. Existing database and migration config

From the repository root, authenticate Wrangler:

```bash
npx wrangler@latest login
npx wrangler@latest d1 create pricealerter-db
```

When Wrangler asks whether it should add the D1 binding to your Wrangler config, choose **Yes**. Copy the UUID returned by Cloudflare. Do not put secrets or the database UUID into public frontend variables.

The D1 database already exists as `pricealerter-db`, ID `7f9ae459-221b-4076-be7f-0e755d7db363`, and is bound to the Pages project as `DB` in Production and Preview. The committed `wrangler.d1.example.toml` is a CLI-only config with this ID; do not use it as the Pages deployment config or create a second database/binding. Keep the existing Pages `wrangler.toml` unchanged.

## 2. Apply the schema to the remote database

```bash
npx wrangler@latest d1 migrations list pricealerter-db --remote --config wrangler.d1.example.toml
npx wrangler@latest d1 migrations apply pricealerter-db --remote --config wrangler.d1.example.toml
npx wrangler@latest d1 migrations list pricealerter-db --remote --config wrangler.d1.example.toml
```

The three migrations create users, sessions, watchlists, price alerts, notifications, password-reset tokens, IPO records, stock instruments, latest stock quotes, quote history, GMP history, audit logs, contact messages, sync-run history and rate-limit tables. The migration is additive and does not drop existing website files or data.

## 3. Verify the existing Pages binding

In Cloudflare Dashboard, open **Workers & Pages → ipo-pricealerter → Settings → Bindings** and verify the `DB` binding points to `pricealerter-db` in both Production and Preview. The binding has already been configured; do not add a duplicate. Redeploy after migrations and code changes.

Also set a Pages environment variable named `ADMIN_EMAIL` to the email address you want to use for the PriceAlerter administrator account. Set it in Production (and Preview only if required). Register that email after the binding and variable are saved; the matching account is assigned the admin role. Do not publish the admin email as a frontend build variable.

If an account with that email already exists, promote it once using the D1 SQL console:

```sql
UPDATE users SET role = 'admin', updated_at = datetime('now') WHERE email = 'YOUR_ADMIN_EMAIL';
```

Replace the example email with your own account email.

## 4. Import the existing IPO and stock snapshot

Sign in to PriceAlerter with the administrator account. In browser developer tools, read the current bearer token from Local Storage key `pa_auth_token_v1` (do not share it). Then run this from a terminal, replacing the token:

```bash
curl -X POST 'https://pricealerter.in/api/admin/sync-snapshot' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

Expected response includes `ok: true`, `ipoCount`, `stockCount` and `syncedAt`. The endpoint imports the currently published build-time snapshot, including available historical GMP points. It does not fetch a new IPO universe from an exchange. The importer is administrator-only.

After the import, test:

```bash
curl 'https://pricealerter.in/api/health'
curl 'https://pricealerter.in/api/ipos'
curl 'https://pricealerter.in/api/stocks?page=1&limit=20'
```

For authenticated APIs, include the same bearer token:

```bash
curl 'https://pricealerter.in/api/watchlist' -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
curl 'https://pricealerter.in/api/alerts' -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

## 5. Deploy the website

The existing Pages Git integration should build from `main` with:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Node version: 22 (or another version satisfying `package.json` engines)

The build now generates `public/data/live-market-data.json` from the repository's existing fallback data before running Vite. Pages Functions remain at repository-root `functions/`; do not move them into `dist/`. Pages Functions require Git integration or Wrangler deployment; dashboard Direct Upload does not deploy the `functions/` directory.

## 6. Local development

Use the same D1 database UUID in `wrangler.d1.toml`, then run:

```bash
npm ci
npm run build
npx wrangler@latest pages dev dist --d1 DB=YOUR_D1_DATABASE_UUID
```

Pages local development uses a local D1 database by default. Apply migrations locally with:

```bash
npx wrangler@latest d1 migrations apply pricealerter-db --local --config wrangler.d1.toml
```

Do not use local D1 to validate production records. Cloudflare documents that Pages local development uses local persistence; remote D1 development is not currently supported for Pages.

## 7. Important operational notes

- Never commit `wrangler.d1.toml`, `.dev.vars`, bearer tokens, passwords, API keys or database credentials.
- The migration intentionally does not insert demo users or passwords.
- Registration is rate-limited and passwords are hashed. Sessions expire after 30 days and are revocable on logout.
- Alert records are persistent, but alert evaluation is deliberately not simulated. A scheduled Worker/cron or other trusted scheduler and a dependable quote feed must be added before claiming automatic alerts.
- Password reset uses a 30-minute one-time token. Configure `RESEND_API_KEY` as an encrypted Pages secret, `MAIL_FROM` as a verified Resend sender, and `SITE_URL=https://pricealerter.in` before testing it.
- Quote records carry provider and quality metadata. Third-party quote data can be delayed, missing or blocked; verify investment decisions against official exchange data.
- D1 is the persistence layer, not a market-data license or exchange feed. IPO/GMP freshness still depends on the upstream source and import schedule.
