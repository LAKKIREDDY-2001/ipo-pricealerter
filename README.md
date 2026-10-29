# Pricealerter

Pricealerter is an Indian IPO dashboard built with Next.js 14, TypeScript, Tailwind CSS, Prisma and PostgreSQL. It includes a searchable dashboard, IPO detail pages, a calendar, GMP history, subscription data and a protected admin console.

## Data provider and access

The provider adapter uses IPO Guru's documented v2 API (`https://www.ipoguru.in/api/v2`). The v1 URL is retired. IPO Guru issues API keys manually; contact the provider with your project and plan choice as described in its [developer API documentation](https://www.ipoguru.in/ipo-gmp-details-developer-api).

The key is read only on the server as `IPOGURU_API_KEY`. Never add it to client code or a `NEXT_PUBLIC_` variable. The API requires a visible IPO Guru credit link; it is included in the dashboard and site footer.

Plan scopes matter:

- Free is evaluation-only, limited to 10 requests per day and 1 per minute. It includes the IPO calendar, basic details and current GMP.
- Basic adds company information, financials and promoters.
- Standard adds current subscription categories and day-wise GMP history.
- Pro adds intraday GMP and day-wise subscription history.

For the requested subscription categories and GMP history, use a key with the Standard scope or higher. The free plan is not documented for production use. Refresh is configurable and expands automatically to fit the reported daily quota. IPO Guru GMP is an unofficial grey-market observation, not an exchange quote.

NSE and BSE are linked as official references for issue details. Pricealerter does not call undocumented exchange APIs or bypass exchange access controls. See the [NSE public IPO page](https://www.nseindia.com/market-data/all-upcoming-issues-ipo), [NSE issue information](https://www.nseindia.com/market-data/issue-information), and [BSE issue summary](https://www.bseindia.com/markets/PublicIssues/Issuesummary.aspx).

## Local setup

1. Install Node.js 20 or newer and run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add `IPOGURU_API_KEY` on the server. Set `IPOGURU_REFRESH_SECONDS` to your desired refresh interval; the app raises it as needed for provider limits.
4. For persistent cache, history and admin edits, set `DATABASE_URL` to a PostgreSQL connection string.
5. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` to enable `/admin`.
6. Apply the schema with `npx prisma migrate deploy` and run `npm run dev`.
7. Open `http://localhost:3000`.

There are no hardcoded IPO demo records. With no provider key or saved database cache, the dashboard shows that provider data is unavailable. A failed refresh keeps the last saved provider response and marks it stale. `npm run db:seed` syncs from the configured provider; it does not create sample IPOs or chart points.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `IPOGURU_API_KEY` | Server-only key issued by IPO Guru |
| `IPOGURU_BASE_URL` | Defaults to the documented v2 API base |
| `IPOGURU_REFRESH_SECONDS` | Desired provider refresh interval; default 300 seconds |
| `DATABASE_URL` | PostgreSQL connection string for persistent cache and admin data |
| `NEXTAUTH_SECRET` | Signs the admin session |
| `NEXTAUTH_URL` | Application URL |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin credentials |

For GitHub Actions, add `IPOGURU_API_KEY` and `DATABASE_URL` as repository secrets. `IPOGURU_REFRESH_SECONDS` can be set as an Actions variable. For Vercel, add the same server environment variables in the project settings.

## Data mapping and freshness

- `/ipos?months=0` supplies listing/status, dates, board, price band, lot size, issue size, subscription total, current GMP, listing price/gain and provider URL when present.
- `/ipos/{slug}` supplies issue terms, sale type/exchanges, registrar and prospectus links when the plan includes them.
- `/ipos/{slug}/subscription` is Standard+; `/ipos/{slug}/subscription/history` is Pro+.
- `/ipos/{slug}/gmp/history` is Standard+; daily points are date-only unless the Pro intraday timeline supplies an actual observation time.
- Minimum investment is calculated only from a positive upper price band and a positive integer lot size.
- GMP percent is based on the upper price band: `GMP ÷ priceBandHigh × 100`. Provider observation time is displayed separately from the app's fetch time.
- Missing fields display “Not available.” No missing subscription category is converted to zero. Historical chart points are only provider observations or existing database observations with saved timestamps.
- Source fetches are cached in PostgreSQL when configured and in process memory otherwise. API timeout, invalid responses, plan errors and rate limits preserve the previous snapshot and expose a stale state. API keys and raw request headers are never returned to clients or logged.
- Manual admin values remain saved database values; they are distinct from IPO Guru refreshes. Check their source in the admin record before treating them as provider data.

## Routes

- `/` — IPO dashboard with status, board, exchange and search filters
- `/ipo/[slug]` — issue details, dates, current subscription, GMP observations and source links
- `/calendar` — monthly date calendar
- `/gmp` — sortable current GMP tracker
- `/admin` — credentials sign-in and manual IPO management
- `/api/ipos`, `/api/ipos/[slug]`, `/api/ipos/[slug]/gmp`, `/api/ipos/[slug]/subscription`, `/api/gmp/live`, `/api/calendar`

## Verification

Run `npm test`, `npx tsc --noEmit` and `npm run build`. Provider adapter tests use documented response shapes and mocked responses for success, missing fields, 429 rate limits and API errors. They do not replace a real API check: before calling the integration complete, configure a manually issued key and confirm a successful response from IPO Guru.
