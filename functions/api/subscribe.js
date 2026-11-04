const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OWNER_EMAIL = "lakkistudy@gmail.com";
const NOTIFICATION_URL = "https://formsubmit.co/ajax/" + OWNER_EMAIL;

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request format." }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  const source = String(body.source || "IPO Pricealerter Website").slice(0, 100);
  const dateStr = new Date().toISOString();
  const key = "subscriber:" + await sha256(email);

  // 1. Support both env.SUBSCRIBERS and env.KV
  const kv = env && (env.SUBSCRIBERS || env.KV);
  if (kv) {
    try {
      const existing = await kv.get(key);
      if (existing) {
        return Response.json({ message: "This email is already subscribed." }, { status: 409 });
      }
      const record = {
        email,
        subscribedAt: dateStr,
        source,
        status: "active",
        consent: true
      };
      await kv.put(key, JSON.stringify(record));
    } catch (kvErr) {
      console.warn("KV storage warning:", kvErr);
    }
  }

  // 2. Automated notification delivery: Send immediate alert to site owner
  try {
    const notifyTask = fetch(NOTIFICATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: email,
        source: source,
        subscribed_at: dateStr,
        _subject: "🔔 [IPO Pricealerter] New Subscriber: " + email,
        _template: "table"
      })
    });

    if (request.ctx && typeof request.ctx.waitUntil === "function") {
      request.ctx.waitUntil(notifyTask);
    } else {
      await Promise.race([notifyTask, new Promise(r => setTimeout(r, 1200))]).catch(() => {});
    }
  } catch (notifyErr) {}

  // 3. Forward to external Google Sheets webhook if configured in Cloudflare environment variables
  if (env && env.SUBSCRIBER_WEBHOOK) {
    try {
      fetch(env.SUBSCRIBER_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          name: "",
          source: source,
          subscribed_at: dateStr,
          status: "Active"
        })
      }).catch(() => {});
    } catch (whErr) {}
  }

  return Response.json({
    success: true,
    message: "Thank you! Your email has been added to the IPO alerts list."
  });
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}
