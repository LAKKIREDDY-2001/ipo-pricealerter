# PriceAlerter production account setup (Cloudflare Pages + D1)

The Pages Functions contain the D1-backed account API for registration, sign-in, persistent sessions, profile preferences, password changes, password resets, watchlists, alerts and notifications. These features require the D1 schema migrations to be applied to the bound database. Do not enable a fake/localStorage-only account mode in production.

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

The database is already bound as `DB` in both Production and Preview. Do not add a second binding.

## 3. Apply the schema to the remote database

```bash
npx wrangler@latest d1 migrations apply pricealerter-db --remote --config wrangler.d1.example.toml
```

Check that all three migrations in `migrations/` are applied. The schema includes users, password hashes, sessions, watchlists, alerts, notifications, password-reset tokens, rate limits and sync/audit tables.

## 4. Configure optional production variables

In **Cloudflare Pages → Settings → Environment variables**, set:

- `ADMIN_EMAIL`: optional; only the matching address receives the administrator role at registration. Keep this private.
- `RESEND_API_KEY`: required for password-reset email delivery. Create an API key in Resend and add it as an encrypted Pages secret.
- `MAIL_FROM`: a sender address verified in Resend, for example `PriceAlerter <no-reply@pricealerter.in>`.
- `SITE_URL`: set to `https://pricealerter.in` so reset links point to the production site.

Never put credentials, database tokens or API secrets in `VITE_*` variables or frontend source.

## 5. Deploy and verify

Trigger a new Pages deployment from the `main` branch. After deployment, verify:

- `GET /api/health` reports `persistentDatabaseConfigured: true` and `database: "connected"`.
- Register a test account with a password of at least 10 characters containing letters and numbers. Test the forgot-password flow after setting the Resend secrets.
- Sign out, sign back in, refresh the page, and confirm the session remains valid.
- Confirm one user's watchlist and alerts are not visible to another user.
- Confirm logout invalidates the session.

If `/api/health` reports that D1 is not configured, account creation must remain disabled and show the setup error. Do not treat a successful frontend build as proof that production authentication is ready.
