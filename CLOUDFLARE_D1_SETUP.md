# PriceAlerter — Cloudflare Pages + D1 setup

This repository remains a **Cloudflare Pages** application. The existing React/Vite site continues to build to `dist/`; Pages Functions in `functions/` handle `/api/*`. D1 stores account and user data plus imported IPO/stock snapshots and quote observations.

## What is implemented in this repository

- Initial D1 schema in `migrations/0001_initial_d1_schema.sql`.
- Pages API D1 adapter in `functions/lib/d1-api.ts`.
- D1 integration from `functions/api/[[path]].ts`.
- Password hashing with Web Crypto PBKDF2-SHA256; opaque bearer tokens are stored as SHA-256 hashes, not raw tokens.
- Registration/login/logout/current-user, preference updates, password change, personal-data export, account deletion.
- Watchlist CRUD, price-alert CRUD, notification listing/read state.
- Protected admin snapshot import endpoint: `POST /api/admin/sync-snapshot`.
- IPO and stock records are read from D1 after snapshot import; fetched stock quote observations are persisted to D1.
- Market quotes are best-effort third-party data and may be delayed. D1 does not make a third-party feed exchange-authoritative.
- Password reset email, scheduled alert evaluation, SSE streaming, admin editing tools and mail delivery are not enabled by this D1 migration alone.

## 1. Create the D1 database

From the repository root, authenticate Wrangler:

```bash
npx wrangler@latest login
npx wrangler@latest d1 create pricealerter-db
```

Copy the UUID returned by Cloudflare. Do not put secrets or the database UUID into public frontend variables.

Copy the example Wrangler file and replace the placeholder:

```bash
cp wrangler.d1.example.toml wrangler.d1.toml
```

Edit `wrangler.d1.toml` and replace `REPLACE_WITH_D1_DATABASE_UUID` with the database UUID from the create command.

The temporary file `wrangler.d1.toml` is git-ignored and is used for CLI migrations. Keep the existing Pages build settings in `wrangler.toml` unchanged; after you have the database UUID, uncomment the D1 block at the bottom of `wrangler.toml`, replace the placeholder UUID, and commit that config change. This keeps the Pages deployment's binding definition in source control.

## 2. Apply the schema to the remote database

```bash
npx wrangler@latest d1 migrations list pricealerter-db --remote --config wrangler.d1.toml
npx wrangler@latest d1 migrations apply pricealerter-db --remote --config wrangler.d1.toml
npx wrangler@latest d1 migrations list pricealerter-db --remote --config wrangler.d1.toml
```

The migrations create users, sessions, watchlists, price alerts, notifications, IPO records, stock instruments, latest stock quotes, quote history, GMP history, audit logs, contact messages, sync-run history and rate-limit tables. The migration is additive and does not drop existing website files or data.

## 3. Bind D1 to the existing Pages project

In Cloudflare Dashboard:

1. Open **Workers & Pages**.
2. Select the existing Pages project serving `pricealerter.in`.
3. Open **Settings → Bindings → Add → D1 database**.
4. Set **Variable name** to exactly `DB`.
5. Select the database `pricealerter-db`.
6. Save the binding for **Production**. Add the same binding to **Preview** if you use preview deployments.
7. Commit the real D1 UUID in the `[[d1_databases]]` block in `wrangler.toml` (do not commit the temporary `wrangler.d1.toml`).
8. Redeploy the Pages project so the binding is available to Functions.

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

Expected response includes `ok: true`, `ipoCount`, `stockCount` and `syncedAt`. The endpoint imports the currently published build-time snapshot. It does not fetch a new IPO universe from an exchange.

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
- Password reset currently returns a clear unavailable response because email delivery and one-time reset tokens are not configured in Pages.
- Quote records carry provider and quality metadata. Third-party quote data can be delayed, missing or blocked; verify investment decisions against official exchange data.
- D1 is the persistence layer, not a market-data license or exchange feed. IPO/GMP freshness still depends on the upstream source and import schedule.
