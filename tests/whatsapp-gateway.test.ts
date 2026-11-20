import test from "node:test";
import assert from "node:assert/strict";
import { dispatchWhatsApp, normalizeWhatsAppPhone } from "../functions/lib/whatsapp-gateway.ts";

test("normalizes Indian mobile numbers and preserves international country codes", () => {
  assert.equal(normalizeWhatsAppPhone("9876543210"), "919876543210");
  assert.equal(normalizeWhatsAppPhone("+1 (415) 555-2671"), "14155552671");
  assert.equal(normalizeWhatsAppPhone("123"), "");
});

test("uses the no-key Click-to-Chat fallback without claiming delivery", async () => {
  const result = await dispatchWhatsApp({}, {
    phone: "9876543210",
    title: "Test",
    message: "A test alert",
    url: "https://pricealerter.in/stock/RELIANCE",
  });
  assert.equal(result.provider, "whatsapp_direct_link");
  assert.equal(result.delivered, false);
  assert.match(result.clickToChatUrl, /^https:\/\/api\.whatsapp\.com\/send\?/);
  assert.match(decodeURIComponent(result.clickToChatUrl), /A test alert/);
});

test("uses Meta Cloud API when configured and accepted", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    called = true;
    assert.equal((init?.headers as Record<string, string>).authorization, "Bearer meta-secret");
    return new Response(JSON.stringify({ messages: [{ id: "wamid.test" }] }), { status: 200 });
  }) as typeof fetch;
  try {
    const result = await dispatchWhatsApp({
      WHATSAPP_TOKEN: "meta-secret",
      WHATSAPP_PHONE_NUMBER_ID: "123456",
    }, { phone: "9876543210", title: "Test", message: "Meta delivery" });
    assert.equal(called, true);
    assert.equal(result.provider, "meta_cloud_api");
    assert.equal(result.delivered, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("falls back to Twilio API Key authentication when Meta rejects the request", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  let twilioAuthorization = "";
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(String(input));
    if (String(input).includes("graph.facebook.com")) return new Response("{}", { status: 401 });
    twilioAuthorization = (init?.headers as Record<string, string>).authorization;
    return new Response(JSON.stringify({ sid: "SM-test" }), { status: 201 });
  }) as typeof fetch;
  try {
    const result = await dispatchWhatsApp({
      WHATSAPP_TOKEN: "bad-meta-token",
      WHATSAPP_PHONE_NUMBER_ID: "123456",
      TWILIO_ACCOUNT_SID: "AC-account",
      TWILIO_API_KEY_SID: "SK-api-key",
      TWILIO_API_KEY_SECRET: "api-key-secret",
      TWILIO_WHATSAPP_NUMBER: "whatsapp:+14155238886",
    }, { phone: "9876543210", title: "Test", message: "Meta fallback" });
    assert.equal(result.provider, "twilio");
    assert.equal(result.delivered, true);
    assert.equal(calls.length, 2);
    assert.equal(twilioAuthorization, "Basic " + btoa("SK-api-key:api-key-secret"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("authenticates Twilio with API Key SID and Secret while using Account SID in the URL", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let authorization = "";
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = String(input);
    authorization = (init?.headers as Record<string, string>).authorization;
    return new Response(JSON.stringify({ sid: "SM-test" }), { status: 201 });
  }) as typeof fetch;
  try {
    const result = await dispatchWhatsApp({
      TWILIO_ACCOUNT_SID: "AC-account",
      TWILIO_API_KEY_SID: "SK-api-key",
      TWILIO_API_KEY_SECRET: "api-key-secret",
      TWILIO_AUTH_TOKEN: "legacy-token-should-not-be-used",
      TWILIO_WHATSAPP_NUMBER: "whatsapp:+14155238886",
    }, { phone: "9876543210", title: "Test", message: "API key auth" });
    assert.equal(result.provider, "twilio");
    assert.equal(result.delivered, true);
    assert.equal(requestUrl, "https://api.twilio.com/2010-04-01/Accounts/AC-account/Messages.json");
    assert.equal(authorization, "Basic " + btoa("SK-api-key:api-key-secret"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("falls back to legacy Twilio Auth Token when API Key credentials are absent", async () => {
  const originalFetch = globalThis.fetch;
  let authorization = "";
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    authorization = (init?.headers as Record<string, string>).authorization;
    return new Response(JSON.stringify({ sid: "SM-test" }), { status: 201 });
  }) as typeof fetch;
  try {
    const result = await dispatchWhatsApp({
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "legacy-token",
      TWILIO_WHATSAPP_NUMBER: "whatsapp:+14155238886",
    }, { phone: "9876543210", title: "Test", message: "Legacy auth" });
    assert.equal(result.provider, "twilio");
    assert.equal(authorization, "Basic " + btoa("AC123:legacy-token"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not retry through another gateway after an ambiguous Meta network failure", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    throw new Error("connection reset after request");
  }) as typeof fetch;
  try {
    const result = await dispatchWhatsApp({
      WHATSAPP_TOKEN: "meta-secret",
      WHATSAPP_PHONE_NUMBER_ID: "123456",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_API_KEY_SID: "SK123",
      TWILIO_API_KEY_SECRET: "twilio-secret",
      TWILIO_WHATSAPP_NUMBER: "whatsapp:+14155238886",
    }, { phone: "9876543210", title: "Test", message: "No duplicates" });
    assert.equal(result.success, false);
    assert.equal(result.delivered, false);
    assert.equal(result.clickToChatUrl, "");
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reports Twilio HTTP rejection instead of silently falling back", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    code: 63007,
    message: "Twilio could not find a Channel with the specified From address",
  }), { status: 400 })) as typeof fetch;
  try {
    const result = await dispatchWhatsApp({
      TWILIO_ACCOUNT_SID: "AC-account",
      TWILIO_API_KEY_SID: "SK-api-key",
      TWILIO_API_KEY_SECRET: "api-key-secret",
      TWILIO_WHATSAPP_NUMBER: "whatsapp:+14155238886",
    }, { phone: "9876543210", title: "Test", message: "Rejected message" });
    assert.equal(result.success, false);
    assert.equal(result.delivered, false);
    assert.equal(result.provider, "twilio");
    assert.match(result.error || "", /63007/);
    assert.match(result.error || "", /Channel/);
    assert.match(result.clickToChatUrl, /^https:\/\/api\.whatsapp\.com\/send\?/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
