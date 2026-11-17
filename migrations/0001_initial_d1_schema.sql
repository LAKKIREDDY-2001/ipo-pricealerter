PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  email_verified INTEGER NOT NULL DEFAULT 0,
  preferences_json TEXT NOT NULL DEFAULT '{"emailAlerts":true,"browserNotifications":false,"ipoReminders":true,"gmpAlerts":true}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('ipo','stock')),
  item_key TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, item_type, item_key)
);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist_items(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS price_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  company_name TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('PRICE_ABOVE','PRICE_BELOW','PCT_CHANGE_UP','PCT_CHANGE_DOWN')),
  target_value REAL NOT NULL,
  baseline_price REAL,
  enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','TRIGGERED','PAUSED')),
  triggered_at TEXT,
  triggered_price REAL,
  history_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON price_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_enabled ON price_alerts(enabled, status);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('IPO_REMINDER','GMP_CHANGE','PRICE_ALERT','MARKET_UPDATE')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '/',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ipo_offerings (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'snapshot',
  source_updated_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ipo_status ON ipo_offerings(status, category);

CREATE TABLE IF NOT EXISTS stock_instruments (
  symbol TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  exchange TEXT,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stock_name ON stock_instruments(company_name);

CREATE TABLE IF NOT EXISTS stock_quotes (
  symbol TEXT PRIMARY KEY,
  price REAL,
  previous_close REAL,
  day_change REAL,
  day_change_percent REAL,
  volume INTEGER,
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL,
  quote_time TEXT,
  retrieved_at TEXT NOT NULL,
  quality_status TEXT NOT NULL DEFAULT 'UNOFFICIAL_DELAYED_OR_LATEST',
  raw_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_quotes_retrieved ON stock_quotes(retrieved_at DESC);

CREATE TABLE IF NOT EXISTS ipo_gmp_history (
  id TEXT PRIMARY KEY,
  ipo_slug TEXT NOT NULL,
  gmp REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  source TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  source_url TEXT,
  UNIQUE(ipo_slug, source, observed_at)
);
CREATE INDEX IF NOT EXISTS idx_gmp_slug_time ON ipo_gmp_history(ipo_slug, observed_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  actor_email TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  window_started_at INTEGER NOT NULL
);
