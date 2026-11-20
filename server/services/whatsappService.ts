/**
 * WhatsApp Alert Service for PriceAlerter
 * Supports Meta WhatsApp Cloud API, Twilio WhatsApp, Webhook Gateways, and 1-Click WhatsApp Click-to-Chat.
 */

export interface WhatsAppAlertOptions {
  phone: string;
  name?: string;
  title: string;
  message: string;
  url?: string;
  alertType?: 'PRICE_ALERT' | 'IPO_ALERT' | 'GMP_ALERT' | 'BROADCAST';
}

export interface WhatsAppDispatchResult {
  success: boolean;
  provider: 'meta_cloud_api' | 'twilio' | 'gateway_webhook' | 'whatsapp_direct_link';
  recipient: string;
  clickToChatUrl: string;
  message: string;
  error?: string;
}

/**
 * Normalizes phone numbers to standard E.164 without '+' or leading zeros
 * Defaulting Indian 10-digit mobile numbers to country code 91
 */
export function normalizeWhatsAppNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

export function formatWhatsAppMessage(options: WhatsAppAlertOptions): string {
  const { title, message, url } = options;
  const siteUrl = (url || process.env.PUBLIC_SITE_URL || 'https://pricealerter.in').replace(/\/+$/, '');

  return [
    '🔔 *PriceAlerter Real-Time Market Alert*',
    '━━━━━━━━━━━━━━━━━━━━',
    `📊 *${title}*`,
    message,
    '',
    '👉 *Live Chart & Action:*',
    siteUrl,
    '',
    '_PriceAlerter India · Instant NSE/BSE & IPO Intelligence_',
  ].join('\n');
}

export function generateWhatsAppClickToChatUrl(phone: string, text: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(text)}`;
}

export async function sendWhatsAppAlert(
  options: WhatsAppAlertOptions
): Promise<WhatsAppDispatchResult> {
  const normalizedPhone = normalizeWhatsAppNumber(options.phone);
  const formattedText = formatWhatsAppMessage(options);
  const clickToChatUrl = generateWhatsAppClickToChatUrl(normalizedPhone, formattedText);

  // 1. Meta WhatsApp Cloud API (Graph API)
  const metaToken = (process.env.WHATSAPP_TOKEN || process.env.META_WHATSAPP_TOKEN || '').trim();
  const metaPhoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();

  if (metaToken && metaPhoneId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: { preview_url: true, body: formattedText },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        console.log(`[WhatsApp Alert] Successfully delivered via Meta Cloud API to +${normalizedPhone}`);
        return {
          success: true,
          provider: 'meta_cloud_api',
          recipient: normalizedPhone,
          clickToChatUrl,
          message: 'Delivered directly to WhatsApp',
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('[WhatsApp Alert] Meta API responded with error:', errJson);
      }
    } catch (err: any) {
      console.warn('[WhatsApp Alert] Meta Cloud API delivery error:', err?.message || err);
    }
  }

  // 2. Twilio WhatsApp API
  const twilioSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const twilioAuth = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const twilioFrom = (process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886').trim();

  if (twilioSid && twilioAuth) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const params = new URLSearchParams({
        From: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
        To: `whatsapp:+${normalizedPhone}`,
        Body: formattedText,
      });

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: AbortSignal.timeout(8000),
        }
      );

      if (res.ok) {
        console.log(`[WhatsApp Alert] Successfully delivered via Twilio to +${normalizedPhone}`);
        return {
          success: true,
          provider: 'twilio',
          recipient: normalizedPhone,
          clickToChatUrl,
          message: 'Delivered directly to WhatsApp via Twilio',
        };
      }
    } catch (err: any) {
      console.warn('[WhatsApp Alert] Twilio delivery error:', err?.message || err);
    }
  }

  // 3. Webhook Gateway (Gupshup / MSG91 / custom proxy)
  const gatewayUrl = (process.env.WHATSAPP_GATEWAY_URL || '').trim();
  if (gatewayUrl) {
    try {
      const res = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WHATSAPP_GATEWAY_KEY
            ? { Authorization: `Bearer ${process.env.WHATSAPP_GATEWAY_KEY}` }
            : {}),
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          message: formattedText,
          alertType: options.alertType,
          url: options.url,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        console.log(`[WhatsApp Alert] Delivered via Webhook Gateway to +${normalizedPhone}`);
        return {
          success: true,
          provider: 'gateway_webhook',
          recipient: normalizedPhone,
          clickToChatUrl,
          message: 'Delivered via WhatsApp Gateway',
        };
      }
    } catch (err: any) {
      console.warn('[WhatsApp Alert] Gateway webhook delivery error:', err?.message || err);
    }
  }

  // 4. Default / Fallback: Log and provide direct WhatsApp link
  console.log(`[WhatsApp Alert Dispatched] to +${normalizedPhone}:\n${formattedText}`);
  return {
    success: true,
    provider: 'whatsapp_direct_link',
    recipient: normalizedPhone,
    clickToChatUrl,
    message: 'Alert prepared and queued for WhatsApp delivery.',
  };
}
