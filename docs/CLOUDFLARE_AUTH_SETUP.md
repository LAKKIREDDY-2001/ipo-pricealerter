# PriceAlerter production account setup (Cloudflare Pages + D1)

The Pages Functions provide registration, sign-in, persistent sessions, profile preferences, password changes, password resets, watchlists, alerts and notifications. The D1 database has already been created and bound as `DB` in both Production and Preview. The remaining database step is applying the migrations.

## 1. Apply the D1 schema

From the repository root, authenticate Wrangler to the Cloudflare account that owns the Pages project:

```bash
npx wrangler@latest login
npx wrangler@latest d1 migrations list pricealerter-db --remote --config wrangler.d1.example.toml
npx wrangler@latest d1 migrations apply pricealerter-db --remote --config wrangler.d1.example.toml
npx wrangler@latest d1 migrations list pricealerter-db --remote --config wrangler.d1.example.toml
```

The CLI-only config already contains the existing database ID. Do not use `wrangler.d1.example.toml` as the Pages production deployment config, and do not create another database or another binding.

All three migrations must show as applied. They create users, password hashes, sessions, watchlists, alerts, notifications, password-reset tokens, rate limits and market-data sync tables.

## 2. Configure password-reset email

In **Cloudflare Dashboard → Workers & Pages → ipo-pricealerter → Settings → Variables and Secrets**, add these to Production (and Preview if you test resets there):

- `RESEND_API_KEY`: an encrypted secret from your Resend account.
- `MAIL_FROM`: a sender address verified in Resend, for example `PriceAlerter <no-reply@pricealerter.in>`.
- `SITE_URL`: `https://pricealerter.in`.
- `ADMIN_EMAIL`: optional; the matching email is assigned the administrator role when that account is registered. Keep it private.

Never put API keys, database credentials or other secrets in `VITE_*` variables or frontend source.

## 3. Deploy and verify

Trigger a new deployment of the `main` branch in Cloudflare Pages so the updated Pages Functions and frontend are live. Then verify:

- `GET https://pricealerter.in/api/health` returns `status: "ok"`, `database: "connected"` and `persistentDatabaseConfigured: true`.
- Register a test account with a password of at least 10 characters containing letters and numbers.
- Sign out, sign in again, refresh the page and confirm the session remains valid.
- Add a stock and an IPO to the watchlist; refresh and confirm both remain saved.
- Create, pause and delete a price alert.
- Test forgot-password after setting the Resend variables; use the emailed link to set a new password, then sign in with it.
- Confirm one user's watchlist and alerts are not visible to another user.
- Confirm logout invalidates the session.

If `/api/health` returns `DATABASE_MIGRATIONS_REQUIRED`, apply all migrations. If it returns `PASSWORD_RESET_EMAIL_NOT_CONFIGURED`, add the Resend settings. A successful frontend build alone is not proof that production authentication is ready.

## 4. Features that still need separate services

Price-alert records are stored, but automatic price-alert evaluation and delivery still require a scheduled Worker/cron and a dependable quote feed. Email verification is also not enabled. Do not advertise these as active until those services are implemented and tested.

