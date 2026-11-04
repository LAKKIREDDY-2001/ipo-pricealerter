# Private subscriber storage setup

PriceAlerter uses Cloudflare Pages Functions + a private Cloudflare KV namespace. Subscriber emails are not stored in website JavaScript, localStorage, or public static files.

## Required Cloudflare configuration

1. Open Cloudflare Dashboard → Workers & Pages → your PriceAlerter Pages project → Settings → Functions → KV namespace bindings.
2. Create a KV namespace, e.g. `pricealerter-subscribers`.
3. Add binding variable name exactly `SUBSCRIBERS` and select that namespace.
4. Under Settings → Variables and Secrets, add secret `SUBSCRIBER_ADMIN_KEY` with a long random value (at least 32 characters). Do not put this value in website code or GitHub.
5. Redeploy the Pages project after saving the binding and secret.

## Endpoints

- `POST /api/subscribe`: validates and normalizes email, rejects duplicates, and stores the record in private KV.
- `GET /api/subscribers-export`: requires the `X-Admin-Key` header and downloads a UTF-8 CSV that opens in Excel.

The export key is entered only when a team member initiates an export. Never share it with visitors.

## Notes

- Cloudflare KV is server-side storage and is not exposed to browser code.
- The export is CSV (Excel-compatible), not native XLSX.
- Pages Functions require the `functions/` directory at the repository root and the KV binding above.
- Update your privacy policy with the contact address, retention period, and unsubscribe/removal process before launch.
