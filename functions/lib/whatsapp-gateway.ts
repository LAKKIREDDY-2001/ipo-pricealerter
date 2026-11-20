export type WhatsAppProvider = "meta_cloud_api" | "twilio" | "whatsapp_direct_link";
export interface WhatsAppEnv {
  WHATSAPP_TOKEN?: string;
  META_WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_WHATSAPP_NUMBER?: string;
  SITE_URL?: string;
}
export interface WhatsAppDispatch {
  ok: boolean;
  success: boolean;
  delivered: boolean;
  provider: WhatsAppProvider;
  recipient: string;
  message: string;
  clickToChatUrl: string;
  error?: string;
}
export function normalizeWhatsAppPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return "91" + digits;
  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
  if (digits.length >= 8 && digits.length <= 15) return digits;
  return "";
}
function makeText(title: string, message: string, link: string): string {
  return ["🔔 *PriceAlerter Market Alert*", "━━━━━━━━━━━━━━━━━━━━", "📊 *" + title + "*", message, "", "👉 " + link, "", "_PriceAlerter.in · Market & IPO Intelligence_"].join("\n");
}
function result(provider: WhatsAppProvider, phone: string, text: string, delivered: boolean, error?: string): WhatsAppDispatch {
  return {
    ok: true, success: true, delivered, provider, recipient: phone,
    message: delivered ? "WhatsApp message accepted by " + (provider === "meta_cloud_api" ? "Meta Cloud API" : "Twilio") + "." : "Message prepared. Open WhatsApp and tap Send.",
    clickToChatUrl: "https://api.whatsapp.com/send?phone=" + phone + "&text=" + encodeURIComponent(text),
    ...(error ? { error } : {}),
  };
}
export async function dispatchWhatsApp(env: WhatsAppEnv, input: { phone: string; title: string; message: string; url?: string }): Promise<WhatsAppDispatch> {
  const phone = normalizeWhatsAppPhone(input.phone);
  if (!phone) throw new Error("Enter a valid WhatsApp number with country code.");
  const site = (env.SITE_URL || "https://pricealerter.in").replace(/\/+$/, "");
  const link = input.url && /^https?:\/\//i.test(input.url) ? input.url : site;
  const text = makeText(input.title.slice(0, 140), input.message.slice(0, 1200), link);
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
    } catch { /* try the next configured gateway */ }
  }
  const sid = (env.TWILIO_ACCOUNT_SID || "").trim();
  const auth = (env.TWILIO_AUTH_TOKEN || "").trim();
  const from = (env.TWILIO_WHATSAPP_NUMBER || "").trim();
  if (sid && auth && from) {
    try {
      const basic = btoa(sid + ":" + auth);
      const body = new URLSearchParams({ From: from.startsWith("whatsapp:") ? from : "whatsapp:" + from, To: "whatsapp:+" + phone, Body: text });
      const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(sid) + "/Messages.json", {
        method: "POST",
        headers: { authorization: "Basic " + basic, "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) return result("twilio", phone, text, true);
    } catch { /* fall through to user-driven WhatsApp link */ }
  }
  return result("whatsapp_direct_link", phone, text, false);
}
