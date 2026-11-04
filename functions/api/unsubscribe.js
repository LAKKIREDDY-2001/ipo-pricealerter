const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost(context) {
  const { request, env } = context;
  const waitUntil = (context && typeof context.waitUntil === "function")
    ? context.waitUntil.bind(context)
    : (request && request.ctx && typeof request.ctx.waitUntil === "function" ? request.ctx.waitUntil.bind(request.ctx) : null);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  const kv = env && (env.SUBSCRIBERS || env.KV);
  if (kv) {
    try {
      const key = "subscriber:" + await sha256(email);
      await kv.delete(key);
    } catch (e) {}
  }

  if (env && env.GITHUB_TOKEN) {
    try {
      const ghTask = fetch("https://api.github.com/repos/LAKKIREDDY-2001/ipo-pricealerter/dispatches", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.GITHUB_TOKEN,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "PriceAlerter-Subscriber-Sync"
        },
        body: JSON.stringify({
          event_type: "sync-subscribers",
          client_payload: { email: email, action: "unsubscribe" }
        })
      }).catch(() => {});
      if (waitUntil) waitUntil(ghTask);
    } catch (ghErr) {}
  }

  return Response.json({
    success: true,
    message: "You have been unsubscribed and your details have been deleted successfully."
  });
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}
