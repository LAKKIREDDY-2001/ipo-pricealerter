type D1Result<T = Record<string, unknown>> = { results?: T[]; success?: boolean; meta?: { changes?: number } };
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}
interface D1Database {
  prepare(query: string): D1Statement;
  batch<T = unknown>(statements: D1Statement[]): Promise<D1Result<T>[]>;
}
export interface D1Env {
  DB?: D1Database;
  ADMIN_EMAIL?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  SITE_URL?: string;
  ANGELONE_API_KEY?: string;
  ANGEL_API_KEY?: string;
  ANGELONE_AUTH_TOKEN?: string;
  ANGEL_AUTH_TOKEN?: string;
  ANGELONE_CLIENT_CODE?: string;
  ANGEL_CLIENT_CODE?: string;
  ANGELONE_PIN?: string;
  ANGELONE_PASSWORD?: string;
  ANGELONE_TOTP_KEY?: string;
}
const encoder = new TextEncoder();
const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
});
const fail = (message: string, status: number) => json({ error: message }, status);
const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
async function digest(value: string): Promise<string> {
  return toB64(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}
async function newPasswordHash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return `pbkdf2_sha256$100000$${toB64(salt)}$${toB64(new Uint8Array(bits))}`;
}
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, rounds, saltText, hashText] = stored.split("$");
    if (scheme !== "pbkdf2_sha256") return false;
    const iterations = Math.min(Number(rounds) || 100000, 100000);
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromB64(saltText), iterations, hash: "SHA-256" }, key, 256));
    const expected = fromB64(hashText);
    if (bits.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
    return diff === 0;
  } catch { return false; }
}
function publicUser(row: any) {
  let preferences = {};
  try { preferences = JSON.parse(row.preferences_json || "{}"); } catch { /* use empty preferences */ }
  return {
    id: row.id, name: row.name, email: row.email, role: row.role,
    emailVerified: Boolean(row.email_verified), createdAt: row.created_at,
    preferences: { emailAlerts: true, browserNotifications: false, ipoReminders: true, gmpAlerts: true, ...preferences },
  };
}
async function readBody(request: Request): Promise<any> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 32_000) throw new Error("Request body is too large.");
  return await request.json();
}
async function sendPasswordResetEmail(env: D1Env, to: string, name: string, resetUrl: string): Promise<boolean> {
  const apiKey = (env.RESEND_API_KEY || "").trim();
  if (!apiKey) return false;
  const from = (env.MAIL_FROM || "PriceAlerter <no-reply@pricealerter.in>").trim();
  const safeName = name.replace(/[<>&"]/g, "");
  const text = "Hello " + name + ",\n\nWe received a request to reset your PriceAlerter password.\nOpen this link within 30 minutes: " + resetUrl + "\n\nIf you did not request this, ignore this email.";
  const html = "<div style='font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#152338'><h2>Reset your PriceAlerter password</h2><p>Hello " + safeName + ",</p><p>This one-time link expires in 30 minutes.</p><p><a href='" + resetUrl + "'>Set a new password</a></p><p>If you did not request this, ignore this email.</p></div>";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: "Bearer " + apiKey, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: "Reset your PriceAlerter password", text, html }),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch { return false; }
}
async function authenticate(request: Request, db: D1Database): Promise<any | null> {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token || token.length > 256) return null;
  const tokenHash = await digest(token);
  const row = await db.prepare(`SELECT u.*, s.id AS session_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? LIMIT 1`).bind(tokenHash, nowIso()).first<any>();
  if (!row) return null;
  await db.prepare("UPDATE sessions SET last_seen_at=? WHERE id=?").bind(nowIso(), row.session_id).run();
  return row;
}
async function issueSession(db: D1Database, userId: string): Promise<string> {
  const raw = toB64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const timestamp = nowIso();
  await db.prepare("INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at,last_seen_at) VALUES (?,?,?,?,?,?)")
    .bind(id("ses"), userId, await digest(raw), new Date(Date.now() + 30 * 86400000).toISOString(), timestamp, timestamp).run();
  return raw;
}
async function rateLimit(db: D1Database, key: string, max: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const row = await db.prepare("SELECT hits,window_started_at FROM rate_limits WHERE key=?").bind(key).first<any>();
  if (!row || now - Number(row.window_started_at) >= windowMs) {
    await db.prepare("INSERT INTO rate_limits(key,hits,window_started_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET hits=excluded.hits,window_started_at=excluded.window_started_at")
      .bind(key, 1, now).run();
    return true;
  }
  if (Number(row.hits) >= max) return false;
  await db.prepare("UPDATE rate_limits SET hits=hits+1 WHERE key=?").bind(key).run();
  return true;
}
function rowToAlert(row: any) {
  let history = [];
  try { history = JSON.parse(row.history_json || "[]"); } catch { /* ignore malformed history */ }
  return {
    id: row.id, userId: row.user_id, symbol: row.symbol, companyName: row.company_name,
    conditionType: row.condition_type, targetValue: Number(row.target_value),
    baselinePrice: row.baseline_price == null ? null : Number(row.baseline_price),
    enabled: Boolean(row.enabled), status: row.status, triggeredAt: row.triggered_at,
    triggeredPrice: row.triggered_price == null ? null : Number(row.triggered_price),
    createdAt: row.created_at, updatedAt: row.updated_at, history,
  };
}
function rowToWatchlist(row: any) {
  return { id: row.id, userId: row.user_id, itemType: row.item_type, itemKey: row.item_key, label: row.label, createdAt: row.created_at };
}
function rowToNotification(row: any) {
  return { id: row.id, userId: row.user_id, category: row.category, title: row.title, message: row.message, link: row.link, read: Boolean(row.is_read), createdAt: row.created_at };
}
export async function handleD1Api(request: Request, url: URL, env: D1Env): Promise<Response | null> {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();
  const isAccountRoute = path.startsWith("/api/auth/") || path === "/api/watchlist" || path.startsWith("/api/watchlist/") ||
    path === "/api/alerts" || path.startsWith("/api/alerts/") || path === "/api/notifications" || path.startsWith("/api/notifications/");
  if (!isAccountRoute && path !== "/api/health") return null;
  // Never pretend account routes work without durable storage. Returning an
  // explicit setup error is safer than accepting credentials into ephemeral state.
  if (!env.DB) {
    if (path.startsWith("/api/auth/") || path.startsWith("/api/watchlist") ||
        path.startsWith("/api/alerts") || path.startsWith("/api/notifications")) {
      return json({
        ok: false,
        code: "AUTH_BACKEND_NOT_CONFIGURED",
        error: "Sign-in and account features are not enabled yet. The site owner must connect the Cloudflare D1 database binding named DB and apply the database migrations.",
      }, 503);
    }
    return null;
  }
  const db = env.DB;
  const requiredTables = [
    "users", "sessions", "watchlist_items", "price_alerts", "notifications",
    "ipo_offerings", "stock_instruments", "stock_quotes", "ipo_gmp_history",
    "audit_logs", "contact_messages", "rate_limits", "stock_quote_history",
    "data_sync_runs", "password_reset_tokens",
  ];
  const tableRows = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN (" +
    requiredTables.map(() => "?").join(",") + ")"
  ).bind(...requiredTables).all<{ name: string }>();
  const existingTables = new Set((tableRows.results || []).map((row) => row.name));
  const missingTables = requiredTables.filter((name) => !existingTables.has(name));
  if (missingTables.length) {
    return json({
      ok: false,
      code: "DATABASE_MIGRATIONS_REQUIRED",
      error: "The D1 database is connected, but its schema is not installed. Apply all migrations in the migrations folder, then redeploy.",
      missingTables,
    }, 503);
  }

  if (path === "/api/health" && method === "GET") {
    const counts = await db.prepare("SELECT (SELECT COUNT(*) FROM users) AS users,(SELECT COUNT(*) FROM watchlist_items) AS watchlistItems,(SELECT COUNT(*) FROM price_alerts) AS alerts,(SELECT COUNT(*) FROM ipo_offerings) AS ipos,(SELECT COUNT(*) FROM stock_instruments) AS stocks").first<any>();
    return json({ status: "ok", platform: "PriceAlerter", runtime: "cloudflare-pages-functions", database: "connected", databaseType: "Cloudflare D1", persistentDatabaseConfigured: true, accountFeaturesEnabled: true, counts, timestamp: nowIso() });
  }

  if (path === "/api/auth/register" && method === "POST") {
    const body = await readBody(request);
    const name = String(body.name || "").trim().slice(0, 80);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      return fail("Enter a valid name and email. Password must be 10–128 characters.", 400);
    if (!(await rateLimit(db, `register:${email}`, 5, 3600000))) return fail("Too many registration attempts. Try again later.", 429);
    const existing = await db.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
    if (existing) return fail("An account with this email already exists.", 409);
    const userId = id("usr");
    const timestamp = nowIso();
    const adminEmail = (env.ADMIN_EMAIL || "").trim().toLowerCase();
    const role = adminEmail && adminEmail === email ? "admin" : "user";
    await db.prepare("INSERT INTO users(id,name,email,password_hash,role,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,0,?,?)")
      .bind(userId, name, email, await newPasswordHash(password), role, timestamp, timestamp).run();
    const user = await db.prepare("SELECT * FROM users WHERE id=?").bind(userId).first<any>();
    const token = await issueSession(db, userId);
    return json({ user: publicUser(user), token }, 201);
  }

  if (path === "/api/auth/login" && method === "POST") {
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return fail("Email and password are required.", 400);
    if (!(await rateLimit(db, `login:${email}`, 8, 15 * 60000))) return fail("Too many login attempts. Try again in 15 minutes.", 429);
    const user = await db.prepare("SELECT * FROM users WHERE email=?").bind(email).first<any>();
    if (!user || !(await verifyPassword(password, user.password_hash))) return fail("Invalid email or password.", 401);
    const token = await issueSession(db, user.id);
    return json({ user: publicUser(user), token });
  }

  if (path === "/api/auth/me" && method === "GET") {
    const user = await authenticate(request, db);
    return json({ user: user ? publicUser(user) : null });
  }
  if (path === "/api/auth/forgot-password" && method === "POST") {
    if (!(env.RESEND_API_KEY || "").trim()) return json({ error: "Password reset email is not configured. The site owner must add RESEND_API_KEY and MAIL_FROM in Cloudflare Pages settings.", code: "PASSWORD_RESET_EMAIL_NOT_CONFIGURED" }, 503);
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.", 400);
    if (!(await rateLimit(db, "forgot:" + email, 3, 15 * 60_000))) return fail("Too many reset requests. Try again later.", 429);
    const genericMessage = "If an account exists for that email, a password reset link has been sent.";
    const user = await db.prepare("SELECT id,name,email FROM users WHERE email=?").bind(email).first<any>();
    if (!user) return json({ message: genericMessage });
    await db.prepare("DELETE FROM password_reset_tokens WHERE user_id=?").bind(user.id).run();
    const token = toB64(crypto.getRandomValues(new Uint8Array(32))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
    const timestamp = nowIso();
    await db.prepare("INSERT INTO password_reset_tokens(id,user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)")
      .bind(id("prt"), user.id, await digest(token), new Date(Date.now() + 30 * 60_000).toISOString(), timestamp).run();
    const resetUrl = new URL("/reset-password", (env.SITE_URL || url.origin).trim());
    resetUrl.searchParams.set("token", token);
    if (!(await sendPasswordResetEmail(env, user.email, user.name, resetUrl.toString()))) {
      await db.prepare("DELETE FROM password_reset_tokens WHERE user_id=?").bind(user.id).run();
      return fail("We could not send the reset email. Please try again later or contact support.", 502);
    }
    return json({ message: genericMessage });
  }
  if (path === "/api/auth/reset-password" && method === "POST") {
    const body = await readBody(request);
    const token = String(body.token || "").trim();
    const password = String(body.password || "");
    if (!token || token.length > 256) return fail("This password reset link is invalid or expired.", 400);
    if (password.length < 10 || password.length > 128 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return fail("Password must be 10–128 characters and include at least one letter and one number.", 400);
    const reset = await db.prepare("SELECT id,user_id FROM password_reset_tokens WHERE token_hash=? AND expires_at>?")
      .bind(await digest(token), nowIso()).first<any>();
    if (!reset) return fail("This password reset link is invalid or expired. Request a new one.", 400);
    const claimed = await db.prepare("DELETE FROM password_reset_tokens WHERE id=? AND user_id=? AND expires_at>?")
      .bind(reset.id, reset.user_id, nowIso()).run();
    if (Number(claimed.meta?.changes || 0) !== 1) return fail("This password reset link has already been used or expired. Request a new one.", 400);
    const timestamp = nowIso();
    await db.batch([
      db.prepare("UPDATE users SET password_hash=?,updated_at=? WHERE id=?").bind(await newPasswordHash(password), timestamp, reset.user_id),
      db.prepare("DELETE FROM sessions WHERE user_id=?").bind(reset.user_id),
      db.prepare("DELETE FROM password_reset_tokens WHERE user_id=?").bind(reset.user_id),
    ]);
    return json({ message: "Your password has been reset. Please sign in with your new password." });
  }
  if (path === "/api/auth/logout" && (method === "POST" || method === "DELETE")) {
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (token) await db.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await digest(token)).run();
    return json({ ok: true });
  }

  const user = await authenticate(request, db);
  if (!user) return fail("Authentication required. Please sign in again.", 401);

  if (path === "/api/auth/preferences" && method === "PATCH") {
    const body = await readBody(request);
    const current = publicUser(user);
    const preferences: Record<string, boolean> = { ...current.preferences, ...(body.preferences || {}) };
    const allowed = ["emailAlerts", "browserNotifications", "ipoReminders", "gmpAlerts"];
    for (const key of allowed) preferences[key] = Boolean(preferences[key]);
    const name = body.name == null ? current.name : String(body.name).trim().slice(0, 80);
    await db.prepare("UPDATE users SET name=?,preferences_json=?,updated_at=? WHERE id=?")
      .bind(name, JSON.stringify(preferences), nowIso(), user.id).run();
    const updated = await db.prepare("SELECT * FROM users WHERE id=?").bind(user.id).first<any>();
    return json({ user: publicUser(updated) });
  }
  if (path === "/api/auth/change-password" && method === "POST") {
    const body = await readBody(request);
    if (!(await verifyPassword(String(body.currentPassword || ""), user.password_hash))) return fail("Current password is incorrect.", 400);
    const next = String(body.newPassword || "");
    if (next.length < 10 || next.length > 128 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) return fail("New password must be 10–128 characters and include at least one letter and one number.", 400);
    await db.prepare("UPDATE users SET password_hash=?,updated_at=? WHERE id=?").bind(await newPasswordHash(next), nowIso(), user.id).run();
    await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id).run();
    return json({ message: "Password changed. Please sign in again." });
  }
  if (path === "/api/auth/export" && method === "GET") {
    const [watchlist, alerts, notifications] = await Promise.all([
      db.prepare("SELECT * FROM watchlist_items WHERE user_id=?").bind(user.id).all<any>(),
      db.prepare("SELECT * FROM price_alerts WHERE user_id=?").bind(user.id).all<any>(),
      db.prepare("SELECT * FROM notifications WHERE user_id=?").bind(user.id).all<any>(),
    ]);
    return json({ user: publicUser(user), watchlist: (watchlist.results || []).map(rowToWatchlist), alerts: (alerts.results || []).map(rowToAlert), notifications: (notifications.results || []).map(rowToNotification) });
  }
  if (path === "/api/auth/account" && method === "DELETE") {
    const body = await readBody(request);
    if (!(await verifyPassword(String(body.password || ""), user.password_hash))) return fail("Password is incorrect.", 400);
    await db.prepare("DELETE FROM users WHERE id=?").bind(user.id).run();
    return json({ ok: true });
  }

  if (path === "/api/watchlist" && method === "GET") {
    const result = await db.prepare("SELECT * FROM watchlist_items WHERE user_id=? ORDER BY created_at DESC").bind(user.id).all<any>();
    return json({ items: (result.results || []).map(rowToWatchlist) });
  }
  if (path === "/api/watchlist" && method === "POST") {
    const body = await readBody(request);
    const itemType = body.itemType === "ipo" ? "ipo" : body.itemType === "stock" ? "stock" : null;
    const itemKey = String(body.itemKey || "").trim().slice(0, 100);
    const label = String(body.label || itemKey).trim().slice(0, 180);
    if (!itemType || !itemKey || !label) return fail("A valid item type, key and label are required.", 400);
    const timestamp = nowIso();
    const itemId = id("wl");
    await db.prepare("INSERT INTO watchlist_items(id,user_id,item_type,item_key,label,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,item_type,item_key) DO UPDATE SET label=excluded.label")
      .bind(itemId, user.id, itemType, itemKey, label, timestamp).run();
    const row = await db.prepare("SELECT * FROM watchlist_items WHERE user_id=? AND item_type=? AND item_key=?").bind(user.id, itemType, itemKey).first<any>();
    return json({ item: rowToWatchlist(row) }, 201);
  }
  if (path.startsWith("/api/watchlist/") && method === "DELETE") {
    const key = decodeURIComponent(path.slice("/api/watchlist/".length));
    await db.prepare("DELETE FROM watchlist_items WHERE user_id=? AND (id=? OR item_key=?)").bind(user.id, key, key).run();
    return json({ ok: true });
  }

  if (path === "/api/alerts" && method === "GET") {
    const result = await db.prepare("SELECT * FROM price_alerts WHERE user_id=? ORDER BY created_at DESC").bind(user.id).all<any>();
    return json({ alerts: (result.results || []).map(rowToAlert) });
  }
  if (path === "/api/alerts" && method === "POST") {
    const body = await readBody(request);
    const symbol = String(body.symbol || "").trim().toUpperCase().slice(0, 30);
    const condition = String(body.conditionType || "");
    const target = Number(body.targetValue);
    if (!symbol || !["PRICE_ABOVE","PRICE_BELOW","PCT_CHANGE_UP","PCT_CHANGE_DOWN"].includes(condition) || !Number.isFinite(target) || target <= 0)
      return fail("Provide a valid symbol, condition and positive target.", 400);
    const timestamp = nowIso();
    const alertId = id("alert");
    const stock = await db.prepare("SELECT company_name,payload_json FROM stock_instruments WHERE symbol=?").bind(symbol).first<any>();
    let companyName = stock?.company_name || symbol;
    if (stock?.payload_json) { try { companyName = JSON.parse(stock.payload_json).companyName || companyName; } catch { /* ignore */ } }
    const history = [{ timestamp, event: `Alert created: ${condition} ${target}`, priceAtEvent: null }];
    await db.prepare("INSERT INTO price_alerts(id,user_id,symbol,company_name,condition_type,target_value,baseline_price,enabled,status,history_json,created_at,updated_at) VALUES(?,?,?,?,?,?,NULL,1,'ACTIVE',?,?,?)")
      .bind(alertId,user.id,symbol,companyName,condition,target,JSON.stringify(history),timestamp,timestamp).run();
    const row = await db.prepare("SELECT * FROM price_alerts WHERE id=?").bind(alertId).first<any>();
    return json({ alert: rowToAlert(row) }, 201);
  }
  if (path.startsWith("/api/alerts/") && method === "PATCH") {
    const alertId = decodeURIComponent(path.slice("/api/alerts/".length));
    const body = await readBody(request);
    const row = await db.prepare("SELECT * FROM price_alerts WHERE id=? AND user_id=?").bind(alertId,user.id).first<any>();
    if (!row) return fail("Alert not found.",404);
    const enabled = body.enabled == null ? Boolean(row.enabled) : Boolean(body.enabled);
    const target = body.targetValue == null ? Number(row.target_value) : Number(body.targetValue);
    const condition = body.conditionType == null ? row.condition_type : String(body.conditionType);
    if (!Number.isFinite(target) || target <= 0 || !["PRICE_ABOVE","PRICE_BELOW","PCT_CHANGE_UP","PCT_CHANGE_DOWN"].includes(condition)) return fail("Invalid alert settings.",400);
    const timestamp=nowIso();
    await db.prepare("UPDATE price_alerts SET enabled=?,status=?,target_value=?,condition_type=?,updated_at=? WHERE id=? AND user_id=?")
      .bind(enabled?1:0,enabled?"ACTIVE":"PAUSED",target,condition,timestamp,alertId,user.id).run();
    const updated=await db.prepare("SELECT * FROM price_alerts WHERE id=?").bind(alertId).first<any>();
    return json({alert:rowToAlert(updated)});
  }
  if (path.startsWith("/api/alerts/") && method === "DELETE") {
    const alertId=decodeURIComponent(path.slice("/api/alerts/".length));
    await db.prepare("DELETE FROM price_alerts WHERE id=? AND user_id=?").bind(alertId,user.id).run();
    return json({ok:true});
  }
  if (path === "/api/alerts/evaluate" && method === "POST") return fail("Alert evaluation requires a configured scheduled quote worker. No alert has been marked as triggered.",503);

  if (path === "/api/notifications" && method === "GET") {
    const result=await db.prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100").bind(user.id).all<any>();
    return json({notifications:(result.results||[]).map(rowToNotification)});
  }
  if (path === "/api/notifications/read-all" && method === "POST") {
    await db.prepare("UPDATE notifications SET is_read=1 WHERE user_id=?").bind(user.id).run();
    return json({ok:true});
  }
  if (path.startsWith("/api/notifications/") && path.endsWith("/read") && method === "POST") {
    const notificationId=decodeURIComponent(path.slice("/api/notifications/".length,-5).replace(/\/$/,""));
    const row=await db.prepare("SELECT * FROM notifications WHERE id=? AND user_id=?").bind(notificationId,user.id).first<any>();
    if(!row) return fail("Notification not found.",404);
    await db.prepare("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?").bind(notificationId,user.id).run();
    const updated=await db.prepare("SELECT * FROM notifications WHERE id=?").bind(notificationId).first<any>();
    return json({notification:rowToNotification(updated)});
  }
  if (path === "/api/admin/subscribers" && method === "GET") {
    if (user.role !== "admin") return fail("Administrator access required.", 403);
    const rows = await db.prepare("SELECT id, name, email, role, preferences_json, created_at FROM users ORDER BY created_at DESC").all<any>();
    const subscribers = (rows.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      preferences: (() => {
        try { return JSON.parse(row.preferences_json || "{}"); } catch { return {}; }
      })(),
    }));
    return json({
      total: subscribers.length,
      subscribers,
    });
  }

  if (path === "/api/admin/broadcast" && method === "POST") {
    if (user.role !== "admin") return fail("Administrator access required.", 403);
    const body = await readBody(request);
    const subject = String(body.subject || "").trim();
    const title = String(body.title || subject).trim();
    const message = String(body.message || "").trim();
    const category = String(body.category || "ALL").toUpperCase();
    const ctaLabel = String(body.ctaLabel || "View on PriceAlerter").trim();
    const ctaUrl = String(body.ctaUrl || "https://pricealerter.in").trim();

    if (!subject || !message) {
      return fail("Subject and message are required.", 400);
    }

    const rows = await db.prepare("SELECT id, name, email, preferences_json FROM users").all<any>();
    const recipients: Array<{ id: string; name: string; email: string }> = [];

    for (const row of rows.results || []) {
      let prefs: any = {};
      try { prefs = JSON.parse(row.preferences_json || "{}"); } catch {}
      let eligible = false;
      if (category === "ALL") eligible = true;
      else if (category === "PRICE_ALERT" && prefs.emailAlerts) eligible = true;
      else if (category === "IPO_REMINDER" && prefs.ipoReminders) eligible = true;
      else if (category === "GMP_CHANGE" && prefs.gmpAlerts) eligible = true;
      else if (category === "MARKET_UPDATE") eligible = true;

      if (eligible && row.email) {
        recipients.push({ id: row.id, name: row.name, email: row.email });
      }
    }

    const timestamp = nowIso();
    const notifCategory = ["IPO_REMINDER", "GMP_CHANGE", "PRICE_ALERT", "MARKET_UPDATE"].includes(category)
      ? category
      : "MARKET_UPDATE";

    const notifStatements: D1Statement[] = [];
    for (const r of recipients) {
      notifStatements.push(
        db.prepare(
          "INSERT INTO notifications (id, user_id, category, title, message, link, is_read, created_at) VALUES (?,?,?,?,?,?,0,?)"
        ).bind(id("notif"), r.id, notifCategory, title, message.slice(0, 500), ctaUrl, timestamp)
      );
    }
    for (let i = 0; i < notifStatements.length; i += 50) {
      await db.batch(notifStatements.slice(i, i + 50));
    }

    let emailsSent = 0;
    const apiKey = (env.RESEND_API_KEY || "").trim();
    const from = (env.MAIL_FROM || "PriceAlerter <no-reply@pricealerter.in>").trim();

    if (apiKey && recipients.length > 0) {
      const emailBatch = recipients.map((r) => {
        const safeName = r.name.replace(/[<>&"]/g, "");
        const formattedBody = message
          .split("\n\n")
          .map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#152338;">${p.replace(/[<>&"]/g, "").replace(/\n/g, "<br/>")}</p>`)
          .join("");

        const html = `
          <div style="font-family:system-ui,-apple-system,sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#152338;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
            <div style="font-size:12px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">PriceAlerter &bull; ${notifCategory.replace(/_/g, " ")}</div>
            <h2 style="margin:0 0 16px;color:#14263F;font-size:20px;">${title.replace(/[<>&"]/g, "")}</h2>
            <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">Hello <strong>${safeName}</strong>,</p>
            <div style="background:#f8fafc;padding:16px;border-radius:8px;border-left:4px solid #059669;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin-bottom:20px;">
              ${formattedBody}
            </div>
            <p style="margin:24px 0;text-align:center;">
              <a href="${ctaUrl}" style="display:inline-block;background:#14263F;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">${ctaLabel.replace(/[<>&"]/g, "")} &rarr;</a>
            </p>
            <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0;" />
            <p style="font-size:12px;color:#64748b;line-height:1.5;margin:0;">
              You received this alert based on your PriceAlerter notification preferences.<br/>
              Update preferences anytime at <a href="https://pricealerter.in/profile" style="color:#2563eb;">pricealerter.in/profile</a>.
            </p>
          </div>
        `;
        const text = `Hello ${r.name},\n\n${title}\n\n${message}\n\nLink: ${ctaUrl}\n\nManage preferences: https://pricealerter.in/profile`;
        return { from, to: [r.email], subject, html, text };
      });

      for (let i = 0; i < emailBatch.length; i += 100) {
        try {
          const res = await fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
            body: JSON.stringify(emailBatch.slice(i, i + 100)),
            signal: AbortSignal.timeout(15000),
          });
          if (res.ok) emailsSent += emailBatch.slice(i, i + 100).length;
        } catch { /* ignore */ }
      }
    }

    return json({
      ok: true,
      recipientsCount: recipients.length,
      notificationsCreated: recipients.length,
      emailsSent,
      mailerConfigured: Boolean(apiKey),
    });
  }

  return null;
}


export async function syncMarketSnapshotToD1(request: Request, env: D1Env, snapshot: any, stocks: any[]): Promise<Response> {
  if (!env.DB) return fail("Cloudflare D1 is not connected. Add a D1 binding named DB and redeploy.", 503);
  const user = await authenticate(request, env.DB);
  if (!user) return fail("Authentication required.", 401);
  if (user.role !== "admin") return fail("Administrator access required.", 403);
  const timestamp = nowIso();
  let ipoCount = 0;
  let stockCount = 0;
  const statements: D1Statement[] = [];
  for (const ipo of Array.isArray(snapshot.ipos) ? snapshot.ipos : []) {
    if (!ipo?.id || !ipo?.slug || !ipo?.companyName) continue;
    statements.push(env.DB.prepare(`INSERT INTO ipo_offerings(id,slug,company_name,status,category,payload_json,source,source_updated_at,updated_at)
      VALUES(?,?,?,?,?,?,'published-market-snapshot',?,?)
      ON CONFLICT(slug) DO UPDATE SET id=excluded.id,company_name=excluded.company_name,status=excluded.status,category=excluded.category,payload_json=excluded.payload_json,source=excluded.source,source_updated_at=excluded.source_updated_at,updated_at=excluded.updated_at`)
      .bind(String(ipo.id),String(ipo.slug),String(ipo.companyName),String(ipo.status||"Unknown"),String(ipo.category||"Mainboard"),JSON.stringify(ipo),ipo.provenance?.retrievedAt||snapshot.lastSyncTime||null,timestamp));
    ipoCount++;
    const gmpPoints = Array.isArray(ipo.gmp?.history) ? ipo.gmp.history : [];
    for (const point of gmpPoints) {
      if (point?.date == null || point?.gmp == null || !Number.isFinite(Number(point.gmp))) continue;
      const observedAt = String(point.date).length === 10 ? `${point.date}T12:00:00.000Z` : String(point.date);
      statements.push(env.DB.prepare("INSERT OR IGNORE INTO ipo_gmp_history(id,ipo_slug,gmp,source,observed_at,source_url) VALUES(?,?,?,?,?,?)")
        .bind(id("gmp"),String(ipo.slug),Number(point.gmp),String(ipo.gmp?.source||"snapshot"),observedAt,ipo.provenance?.sourceUrl||null));
    }
    const latestGmp = ipo.gmp?.latestGmp;
    const latestObservedAt = ipo.gmp?.lastUpdated || ipo.provenance?.retrievedAt;
    if (latestGmp != null && Number.isFinite(Number(latestGmp)) && latestObservedAt) {
      statements.push(env.DB.prepare("INSERT OR IGNORE INTO ipo_gmp_history(id,ipo_slug,gmp,source,observed_at,source_url) VALUES(?,?,?,?,?,?)")
        .bind(id("gmp"),String(ipo.slug),Number(latestGmp),String(ipo.gmp?.source||"snapshot"),String(latestObservedAt),ipo.provenance?.sourceUrl||null));
    }
  }
  for (const stock of stocks) {
    const symbol = String(stock?.symbol||"").trim().toUpperCase();
    if (!symbol || !stock?.companyName) continue;
    statements.push(env.DB.prepare(`INSERT INTO stock_instruments(symbol,company_name,exchange,payload_json,updated_at) VALUES(?,?,?,?,?)
      ON CONFLICT(symbol) DO UPDATE SET company_name=excluded.company_name,exchange=excluded.exchange,payload_json=excluded.payload_json,updated_at=excluded.updated_at`)
      .bind(symbol,String(stock.companyName),String(stock.exchange||""),JSON.stringify(stock),timestamp));
    stockCount++;
  }
  for (let i=0;i<statements.length;i+=50) await env.DB.batch(statements.slice(i,i+50));
  await env.DB.prepare("INSERT INTO audit_logs(id,actor_user_id,actor_email,entity_type,entity_id,action,details_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(id("audit"),user.id,user.email,"MARKET_DATA","snapshot","SYNC_SNAPSHOT",JSON.stringify({ipoCount,stockCount,generatedAt:snapshot.generatedAt||null}),timestamp).run();
  await env.DB.prepare("INSERT INTO data_sync_runs(id,sync_type,source,status,records_processed,details_json,started_at,completed_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(id("sync"),"SNAPSHOT_IMPORT","published-market-snapshot","SUCCESS",ipoCount+stockCount,JSON.stringify({ipoCount,stockCount,generatedAt:snapshot.generatedAt||null}),timestamp,nowIso()).run();
  return json({ok:true,ipoCount,stockCount,generatedAt:snapshot.generatedAt||null,syncedAt:timestamp});
}
