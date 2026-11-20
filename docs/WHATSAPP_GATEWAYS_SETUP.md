# WhatsApp Gateway Setup

PriceAlerter supports three delivery paths from its Cloudflare Pages Functions runtime.

## Gateway order

1. Meta WhatsApp Cloud API when both `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are configured.
2. Twilio WhatsApp when `TWILIO_ACCOUNT_SID`, Twilio credentials, and `TWILIO_WHATSAPP_NUMBER` are configured. Twilio is attempted when Meta is not configured or its request fails.
3. WhatsApp Click-to-Chat link when neither API gateway accepts the message. The user must open WhatsApp and tap **Send**; a prepared link is not an automatically delivered message.

The API response distinguishes `delivered: true` (provider accepted the request) from `delivered: false` (manual WhatsApp send required).

## Configure secrets

In Cloudflare Dashboard, open **Workers & Pages → ipo-pricealerter → Settings → Variables and Secrets**. Add credentials as encrypted secrets for the Production environment, then redeploy.

Meta:
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

Twilio (recommended API Key authentication):
- `TWILIO_ACCOUNT_SID` — the Account SID from Twilio Console (starts with `AC`)
- `TWILIO_API_KEY_SID` — the API Key SID (starts with `SK`)
- `TWILIO_API_KEY_SECRET` — the API Key Secret
- `TWILIO_WHATSAPP_NUMBER` — the WhatsApp-enabled sender shown in Twilio Console; for sandbox testing use the sandbox sender

Legacy Twilio authentication is also supported with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_NUMBER`. When a complete API Key SID/Secret pair is present, it takes precedence over the legacy Auth Token.

Optional site URL:
- `SITE_URL=https://pricealerter.in`

Never add provider tokens to `VITE_*` variables or browser code. Do not commit real credentials to Git.

## Provider requirements

- Meta requires a valid WhatsApp Business Platform phone-number ID and access token. WhatsApp business-initiated messages outside the customer-service window may require an approved message template.
- Twilio requires an active WhatsApp sender and recipient eligibility/opt-in. Sandbox senders require the recipient to join the sandbox first.
- API acceptance is not proof of handset delivery/read status. The current implementation reports provider acceptance, not a WhatsApp delivery receipt.

## Test

1. Sign in to PriceAlerter and open **Price Alerts**.
2. Enter the recipient number (10-digit Indian mobile numbers are normalized to country code 91; international numbers should include their country code).
3. Select **Send Test Alert**.
4. If Meta or Twilio accepts the message, the page reports the provider. If no API gateway is configured or a provider request fails, choose **Review & Send in WhatsApp** and tap Send in WhatsApp.

The test endpoint is rate-limited to five attempts per IP per ten minutes. Triggered price alerts use the phone number saved in the user's notification preferences and attempt the configured API gateways. Without an API gateway, background alerts cannot open a WhatsApp link on the user's device; in-app alerts remain available.
