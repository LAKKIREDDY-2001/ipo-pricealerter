# PriceAlerter production account setup (Cloudflare Pages + D1)

The Pages Functions already contain the D1-backed account API. Sign-in, registration, sessions, watchlists, alerts and notifications are intentionally unavailable until a persistent D1 database is attached. Do not enable a fake/localStorage-only account mode in production.

## 1. Create the D1 database

From the repository root, with Wrangler authenticated to the Cloudflare account that owns the Pages project:

```bash
npx wrangler login
npx wrangler d1 create pricealerter-db
```

Copy the `database_id` returned by Wrangler.

## 2. Bind D1 to Pages

Add this block to the root `wrangler.toml`, replacing the placeholder with the actual ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "pricealerter-db"
database_id = "REPLACE_WITH_REAL_DATABASE_ID"
migrations_dir = "migrations"
```

The binding name must be exactly `DB`; the Pages Function reads `env.DB`.

Alternatively, add a D1 database binding named `DB` in the Cloudflare Pages project's **Settings → Functions → D1 database bindings** and bind it to the same database. Keep the binding consistent between preview and production environments.

## 3. Apply the schema to the remote database

```bash
npx wrangler d1 migrations apply pricealerter-db --remote
```

Check that both migrations in `migrations/` are applied. The schema includes users, password hashes, sessions, watchlists, alerts, notifications, rate limits and sync/audit tables.

## 4. Configure optional production variables

In **Cloudflare Pages → Settings → Environment variables**, set:

- `ADMIN_EMAIL`: optional; only the matching address receives the administrator role at registration. Keep this private.
- Configure a transactional email provider before advertising password-reset emails. The current D1 password-reset endpoint deliberately returns an explicit not-configured response until a secure delivery flow is implemented.

Never put credentials, database tokens or API secrets in `VITE_*` variables or frontend source.

## 5. Deploy and verify

Trigger a new Pages deployment from the `main` branch. After deployment, verify:

- `GET /api/health` reports `persistentDatabaseConfigured: true` and `database: "connected"`.
- Register a test account with a password of at least 10 characters containing letters and numbers.
- Sign out, sign back in, refresh the page, and confirm the session remains valid.
- Confirm one user's watchlist and alerts are not visible to another user.
- Confirm logout invalidates the session.

If `/api/health` reports that D1 is not configured, account creation must remain disabled and show the setup error. Do not treat a successful frontend build as proof that production authentication is ready.
