/**
 * WhatsApp Alert Service for PriceAlerter
 * Supports Twilio WhatsApp (Sandbox & Production), Meta WhatsApp Cloud API, Webhook Gateways, and 1-Click WhatsApp Click-to-Chat.
 */

export interface WhatsAppAlertOptions {
  phone: string;
  name?: string;
  title: string;
  message: string;
  url?: string;
  alertType?: 'PRICE_ALERT' | 'IPO_ALERT' | 'GMP_ALERT' | 'BROADCAST';
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFrom?: string;
}

export interface WhatsAppDispatchResult {
  success: boolean;
  delivered?: boolean;
  provider: 'meta_cloud_api' | 'twilio' | 'gateway_webhook' | 'whatsapp_direct_link';
  recipient: string;
  clickToChatUrl: string;
  message: string;
  messageSid?: string;
  status?: string;
  code?: number;
  error?: string;
  hint?: string;
  isSandboxJoinRequired?: boolean;
  needsConfig?: boolean;
}

/**
 * Normalizes phone numbers to standard E.164 without '+' or leading zeros
 * Defaulting Indian 10-digit mobile numbers to country code 91
 */
export function normalizeWhatsAppNumber(rawPhone: string): string {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
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

  // 1. Twilio WhatsApp API
  const twilioSid = (options.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || '').trim();
  const twilioAuth = (options.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN || '').trim();
  let twilioFrom = (options.twilioFrom || process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM || 'whatsapp:+14155238886').trim();
  if (twilioFrom && !twilioFrom.startsWith('whatsapp:')) {
    twilioFrom = `whatsapp:${twilioFrom.startsWith('+') ? twilioFrom : '+' + twilioFrom}`;
  }

  if (twilioSid && twilioAuth) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const params = new URLSearchParams({
        From: twilioFrom,
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

      const data: any = await res.json().catch(() => ({}));

      if (res.ok) {
        console.log(`[WhatsApp Alert] Successfully delivered via Twilio to +${normalizedPhone} (SID: ${data.sid})`);
        return {
          success: true,
          delivered: true,
          provider: 'twilio',
          recipient: normalizedPhone,
          messageSid: data.sid,
          status: data.status || 'queued',
          clickToChatUrl,
          message: `✅ Alert dispatched via Twilio to +${normalizedPhone}! (Status: ${data.status || 'queued'}, SID: ${data.sid})`,
        };
      } else {
        const code = Number(data.code || res.status || 0);
        const errMsg = String(data.message || res.statusText || 'Twilio delivery failed');
        let hint = '';
        let isSandboxJoinRequired = false;

        if (code === 21608 || /sandbox/i.test(errMsg) || /unverified/i.test(errMsg)) {
          isSandboxJoinRequired = true;
          hint = `Recipient +${normalizedPhone} has not joined the Twilio WhatsApp Sandbox yet. Send your join code (e.g. 'join <keyword>') to +1 415 523 8886 from WhatsApp first.`;
        } else if (code === 20003 || res.status === 401) {
          hint = 'Twilio authentication failed: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your environment.';
        } else if (code === 63016 || code === 63015) {
          hint = 'WhatsApp 24-hour session expired. Approved template required for business-initiated chats outside 24h.';
        } else if (code === 21606) {
          hint = 'From number is not a valid WhatsApp sender. Use whatsapp:+14155238886 for Sandbox.';
        }

        console.warn(`[WhatsApp Alert] Twilio delivery error (${code}): ${errMsg}. Hint: ${hint}`);
        return {
          success: false,
          delivered: false,
          provider: 'twilio',
          recipient: normalizedPhone,
          code,
          error: errMsg,
          hint,
          isSandboxJoinRequired,
          clickToChatUrl,
          message: `⚠️ Twilio Error ${code ? `(${code})` : ''}: ${errMsg}. ${hint}`.trim(),
        };
      }
    } catch (err: any) {
      console.warn('[WhatsApp Alert] Twilio connection error:', err?.message || err);
      return {
        success: false,
        delivered: false,
        provider: 'twilio',
        recipient: normalizedPhone,
        error: err?.message || String(err),
        clickToChatUrl,
        message: `⚠️ Twilio Connection Error: ${err?.message || 'Failed to reach Twilio API.'}`,
      };
    }
  }

  // 2. Meta WhatsApp Cloud API (Graph API)
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

      const data: any = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`[WhatsApp Alert] Successfully delivered via Meta Cloud API to +${normalizedPhone}`);
        return {
          success: true,
          delivered: true,
          provider: 'meta_cloud_api',
          recipient: normalizedPhone,
          clickToChatUrl,
          message: `✅ Alert dispatched via Meta WhatsApp Cloud API to +${normalizedPhone}!`,
        };
      } else {
        const errMsg = data?.error?.message || 'Meta API error';
        console.warn('[WhatsApp Alert] Meta API responded with error:', errMsg);
        return {
          success: false,
          delivered: false,
          provider: 'meta_cloud_api',
          recipient: normalizedPhone,
          error: errMsg,
          clickToChatUrl,
          message: `⚠️ Meta WhatsApp API Error: ${errMsg}`,
        };
      }
    } catch (err: any) {
      console.warn('[WhatsApp Alert] Meta Cloud API delivery error:', err?.message || err);
      return {
        success: false,
        delivered: false,
        provider: 'meta_cloud_api',
        recipient: normalizedPhone,
        error: err?.message || String(err),
        clickToChatUrl,
        message: `⚠️ Meta API Connection Error: ${err?.message}`,
      };
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
          delivered: true,
          provider: 'gateway_webhook',
          recipient: normalizedPhone,
          clickToChatUrl,
          message: '✅ Delivered via WhatsApp Gateway',
        };
      }
    } catch (err: any) {
      console.warn('[WhatsApp Alert] Gateway webhook delivery error:', err?.message || err);
    }
  }

  // 4. Default: No external credentials configured
  console.log(`[WhatsApp Alert Fallback Link Prepared] to +${normalizedPhone}`);
  return {
    success: false,
    delivered: false,
    needsConfig: true,
    provider: 'whatsapp_direct_link',
    recipient: normalizedPhone,
    clickToChatUrl,
    message: '⚠️ Twilio API credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN) were not detected in the environment. Please add them in .env or Cloudflare Pages. Click below to test manually via WhatsApp.',
  };
}
