export type WhatsAppProvider = "meta_cloud_api" | "twilio" | "whatsapp_direct_link";

export interface WhatsAppEnv {
  WHATSAPP_TOKEN?: string;
  META_WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_API_KEY_SID?: string;
  TWILIO_API_KEY_SECRET?: string;
  TWILIO_WHATSAPP_NUMBER?: string;
  SITE_URL?: string;
}

export interface WhatsAppDispatchInput {
  phone: string;
  title: string;
  message: string;
  url?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioApiKeySid?: string;
  twilioApiKeySecret?: string;
  twilioFrom?: string;
}

export interface WhatsAppDispatch {
  ok: boolean;
  success: boolean;
  delivered: boolean;
  provider: WhatsAppProvider;
  recipient: string;
  message: string;
  clickToChatUrl: string;
  messageSid?: string;
  status?: string;
  code?: number;
  error?: string;
  hint?: string;
  isSandboxJoinRequired?: boolean;
  needsConfig?: boolean;
}

export function normalizeWhatsAppPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return /^[6-9]/.test(digits) ? "91" + digits : "";
  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
  if (digits.length >= 8 && digits.length <= 15) return digits;
  return "";
}

function makeText(title: string, message: string, link: string): string {
  return [
    "🔔 *PriceAlerter Market Alert*",
    "━━━━━━━━━━━━━━━━━━━━",
    "📊 *" + title + "*",
    message,
    "",
    "👉 " + link,
    "",
    "_PriceAlerter.in · Market & IPO Intelligence_",
  ].join("\n");
}

function result(
  provider: WhatsAppProvider,
  phone: string,
  text: string,
  delivered: boolean,
  extra?: Partial<WhatsAppDispatch>
): WhatsAppDispatch {
  return {
    ok: true,
    success: true,
    delivered,
    provider,
    recipient: phone,
    message: delivered
      ? "WhatsApp message accepted by " + (provider === "meta_cloud_api" ? "Meta Cloud API" : "Twilio") + "."
      : "Message prepared. Open WhatsApp and tap Send.",
    clickToChatUrl: "https://api.whatsapp.com/send?phone=" + phone + "&text=" + encodeURIComponent(text),
    ...extra,
  };
}

function uncertain(provider: WhatsAppProvider, phone: string, error: string): WhatsAppDispatch {
  return {
    ok: false,
    success: false,
    delivered: false,
    provider,
    recipient: phone,
    message: "Delivery status is unknown. Check WhatsApp before retrying to avoid a duplicate alert.",
    clickToChatUrl: "",
    error,
  };
}

async function rejected(provider: WhatsAppProvider, phone: string, text: string, response: Response): Promise<WhatsAppDispatch> {
  let detail = "";
  let code: number | undefined;
  let hint = "";
  let isSandboxJoinRequired = false;

  try {
    const payload = await response.json() as { code?: string | number; message?: string };
    if (payload?.code) {
      code = Number(payload.code);
    }
    const codeStr = code ? " (" + code + ")" : "";
    const rawMsg = payload?.message ? String(payload.message).slice(0, 400) : "";
    detail = "HTTP " + response.status + codeStr + (rawMsg ? ": " + rawMsg : "");

    if (code === 21608 || /sandbox/i.test(rawMsg) || /unverified/i.test(rawMsg)) {
      isSandboxJoinRequired = true;
      hint = "Recipient +" + phone + " has not joined the Twilio WhatsApp Sandbox yet. Send your join code (e.g. 'join <keyword>') to +1 415 523 8886 from WhatsApp first.";
    } else if (code === 20003 || response.status === 401) {
      hint = "Twilio authentication failed: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Cloudflare Pages.";
    } else if (code === 63016 || code === 63015) {
      hint = "WhatsApp 24-hour session expired. Approved template required for business-initiated chats outside 24h.";
    } else if (code === 21606) {
      hint = "From number is not a valid WhatsApp sender. Use whatsapp:+14155238886 for Sandbox.";
    }
  } catch {
    detail = "HTTP " + response.status;
  }

  return {
    ok: false,
    success: false,
    delivered: false,
    provider,
    recipient: phone,
    code,
    error: detail,
    hint,
    isSandboxJoinRequired,
    message: provider === "twilio"
      ? (isSandboxJoinRequired
          ? "⚠️ Twilio Sandbox Join Required: Your number +" + phone + " must join the Twilio sandbox before receiving alerts."
          : "Twilio rejected the WhatsApp message. " + (hint || "Use the manual WhatsApp link or fix the gateway error."))
      : "The WhatsApp provider rejected the message.",
    clickToChatUrl: "https://api.whatsapp.com/send?phone=" + phone + "&text=" + encodeURIComponent(text),
  };
}

export async function dispatchWhatsApp(
  env: WhatsAppEnv,
  input: WhatsAppDispatchInput
): Promise<WhatsAppDispatch> {
  const phone = normalizeWhatsAppPhone(input.phone);
  if (!phone) throw new Error("Enter a valid WhatsApp number with country code.");

  const site = (env.SITE_URL || "https://pricealerter.in").replace(/\/+$/, "");
  const link = input.url && /^https?:\/\//i.test(input.url) ? input.url : site;
  const text = makeText(input.title.slice(0, 140), input.message.slice(0, 1200), link);

  // 1. Meta WhatsApp Cloud API
  const metaToken = (env.WHATSAPP_TOKEN || env.META_WHATSAPP_TOKEN || "").trim();
  const metaPhoneId = (env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  if (metaToken && metaPhoneId) {
    try {
      const response = await fetch("https://graph.facebook.com/v21.0/" + encodeURIComponent(metaPhoneId) + "/messages", {
        method: "POST",
        headers: { authorization: "Bearer " + metaToken, "content-type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "text", text: { preview_url: true, body: text } }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) return result("meta_cloud_api", phone, text, true);
    } catch {
      return uncertain("meta_cloud_api", phone, "Meta request outcome is unknown.");
    }
  }

  // 2. Twilio WhatsApp API
  const accountSid = (input.twilioAccountSid || env.TWILIO_ACCOUNT_SID || "").trim();
  const apiKeySid = (input.twilioApiKeySid || env.TWILIO_API_KEY_SID || "").trim();
  const apiKeySecret = (input.twilioApiKeySecret || env.TWILIO_API_KEY_SECRET || "").trim();
  const authToken = (input.twilioAuthToken || env.TWILIO_AUTH_TOKEN || "").trim();
  let from = (input.twilioFrom || env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886").trim();
  if (from && !from.startsWith("whatsapp:")) {
    from = "whatsapp:" + (from.startsWith("+") ? from : "+" + from);
  }

  const credentialUser = apiKeySid && apiKeySecret ? apiKeySid : accountSid;
  const credentialPassword = apiKeySid && apiKeySecret ? apiKeySecret : authToken;

  if (accountSid && credentialUser && credentialPassword && from) {
    try {
      const basic = btoa(credentialUser + ":" + credentialPassword);
      const body = new URLSearchParams({
        From: from,
        To: "whatsapp:+" + phone,
        Body: text,
      });
      const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(accountSid) + "/Messages.json", {
        method: "POST",
        headers: { authorization: "Basic " + basic, "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({})) as { sid?: string; status?: string };
        return result("twilio", phone, text, true, {
          messageSid: data.sid,
          status: data.status || "queued",
          message: `✅ Test alert dispatched via Twilio to +${phone}! (Status: ${data.status || "queued"}${data.sid ? `, SID: ${data.sid}` : ""})`,
        });
      }
      return await rejected("twilio", phone, text, response);
    } catch (err: any) {
      return uncertain("twilio", phone, "Twilio connection error: " + (err?.message || String(err)));
    }
  }

  // 3. Fallback: No credentials detected
  return {
    ok: false,
    success: false,
    delivered: false,
    needsConfig: true,
    provider: "whatsapp_direct_link",
    recipient: phone,
    message: "⚠️ Twilio API credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN) were not detected in the environment. Please add them in Cloudflare Pages (Settings → Environment variables) or your server .env. Click below to test manually.",
    clickToChatUrl: "https://api.whatsapp.com/send?phone=" + phone + "&text=" + encodeURIComponent(text),
  };
}
