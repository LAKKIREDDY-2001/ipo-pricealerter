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

  const now = new Date();
  const dateStr = now.toISOString();
  const key = "subscriber:" + await sha256(email);

  // 1. Cloudflare KV: Store ONLY mail details (email and subscribed date)
  const kv = env && (env.SUBSCRIBERS || env.KV);
  if (kv) {
    try {
      const existing = await kv.get(key);
      if (existing) {
        return Response.json({ message: "This email is already subscribed." }, { status: 409 });
      }
      // Store only email details in the KV pair
      const record = {
        email: email,
        subscribedAt: dateStr
      };
      await kv.put(key, JSON.stringify(record));
    } catch (kvErr) {
      console.warn("KV storage warning:", kvErr);
    }
  }

  // 2. Trigger automated GitHub sync if GITHUB_TOKEN is configured in Cloudflare environment
  if (env && env.GITHUB_TOKEN) {
    try {
      fetch("https://api.github.com/repos/LAKKIREDDY-2001/ipo-pricealerter/dispatches", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.GITHUB_TOKEN,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "PriceAlerter-Subscriber-Sync"
        },
        body: JSON.stringify({
          event_type: "sync-subscribers",
          client_payload: { email: email, subscribedAt: dateStr }
        })
      }).catch(() => {});
    } catch (ghErr) {}
  }

  // 3. Automated notification delivery: Send immediate alert to site owner
  try {
    const notifyTask = fetch(NOTIFICATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: email,
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

  // 4. Forward to external Google Sheets webhook if configured
  if (env && env.SUBSCRIBER_WEBHOOK) {
    try {
      fetch(env.SUBSCRIBER_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
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
