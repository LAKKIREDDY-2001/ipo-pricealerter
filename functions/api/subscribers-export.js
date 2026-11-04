export async function onRequestGet({ request, env }) {
  const expected = env.SUBSCRIBER_ADMIN_KEY || "", supplied = request.headers.get("X-Admin-Key") || "";
  if (!expected || !constantTimeEqual(supplied, expected)) {
    return new Response("Unauthorized. Please provide valid X-Admin-Key.", { status: 401 });
  }

  const rows = [["Email", "Subscribed At (UTC)", "Source", "Status", "Consent"]];
  const kv = env && (env.SUBSCRIBERS || env.KV);

  if (kv) {
    let cursor;
    do {
      const page = await kv.list({ prefix: "subscriber:", cursor, limit: 1000 });
      for (const item of page.keys) {
        const raw = await kv.get(item.name);
        if (!raw) continue;
        try {
          const r = JSON.parse(raw);
          rows.push([r.email, r.subscribedAt, r.source, r.status, r.consent ? "Yes" : "No"]);
        } catch {}
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
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
