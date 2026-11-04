const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
export async function onRequestPost({ request, env }) {
  if (!env.SUBSCRIBERS) return Response.json({ message: "Subscription service is not configured yet. Please try again later." }, { status: 503 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ message: "Invalid request." }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  const key = "subscriber:" + await sha256(email);
  await env.SUBSCRIBERS.delete(key);
  return Response.json({ success: true, message: "Your unsubscribe request has been processed. If this email was subscribed, it has been removed from IPO alerts." });
}
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}
