export async function onRequestGet({ request, env }) {
  const expected = env.SUBSCRIBER_ADMIN_KEY || "", supplied = request.headers.get("X-Admin-Key") || "";
  if (!expected || !constantTimeEqual(supplied, expected)) return new Response("Unauthorized", { status: 401 });
  if (!env.SUBSCRIBERS) return new Response("Subscriber storage is not configured", { status: 503 });
  const rows = [["Email", "Subscribed At (UTC)", "Source", "Status", "Consent"]];
  let cursor;
  do {
    const page = await env.SUBSCRIBERS.list({ prefix: "subscriber:", cursor, limit: 1000 });
    for (const item of page.keys) {
      const raw = await env.SUBSCRIBERS.get(item.name);
      if (!raw) continue;
      try { const r = JSON.parse(raw); rows.push([r.email, r.subscribedAt, r.source, r.status, r.consent ? "Yes" : "No"]); } catch {}
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  const csv = "\uFEFF" + rows.map(row => row.map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",")).join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="PriceAlerter_Subscribers.csv"', "Cache-Control": "no-store" } });
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
