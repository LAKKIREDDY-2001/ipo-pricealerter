export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "csv").toLowerCase();
  const supplied = request.headers.get("X-Admin-Key") || url.searchParams.get("key") || "";
  const expected = env.SUBSCRIBER_ADMIN_KEY || "";

  if (expected && !constantTimeEqual(supplied, expected)) {
    return new Response("Unauthorized. Please provide valid admin key.", { status: 401 });
  }

  const kv = env && (env.SUBSCRIBERS || env.KV);
  const subscribers = [];

  if (kv) {
    let cursor;
    do {
      const page = await kv.list({ prefix: "subscriber:", cursor, limit: 1000 });
      for (const item of page.keys) {
        const raw = await kv.get(item.name);
        if (!raw) continue;
        try {
          const r = JSON.parse(raw);
          if (r.email) {
            subscribers.push({
              email: r.email,
              subscribedAt: r.subscribedAt || ""
            });
          }
        } catch {}
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }

  // Strictly deduplicate by normalized email
  const seen = new Set();
  const uniqueSubs = [];
  for (const s of subscribers) {
    const e = String(s.email || "").trim().toLowerCase();
    if (e && !seen.has(e)) {
      seen.add(e);
      uniqueSubs.push({
        email: e,
        subscribedAt: s.subscribedAt
      });
    }
  }

  if (format === "json") {
    return Response.json({
      success: true,
      count: uniqueSubs.length,
      subscribers: uniqueSubs
    });
  }

  const rows = [["Email Address", "Subscribed Date (IST)", "Status"]];
  for (const s of uniqueSubs) {
    const dateIST = s.subscribedAt
      ? new Date(s.subscribedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : "";
    rows.push([s.email, dateIST, "Active"]);
  }

  const csv = "\uFEFF" + rows.map(row => row.map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="PriceAlerter_Subscribers.csv"',
      "Cache-Control": "no-store"
    }
  });
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
