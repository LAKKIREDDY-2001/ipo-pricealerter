CREATE TABLE IF NOT EXISTS stock_quote_history (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  price REAL NOT NULL,
  previous_close REAL,
  day_change REAL,
  day_change_percent REAL,
  volume INTEGER,
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL,
  quote_time TEXT,
  retrieved_at TEXT NOT NULL,
  quality_status TEXT NOT NULL DEFAULT 'UNOFFICIAL_DELAYED_OR_LATEST',
  UNIQUE(symbol, provider, quote_time)
);
CREATE INDEX IF NOT EXISTS idx_stock_quote_history_symbol_time ON stock_quote_history(symbol, retrieved_at DESC);

CREATE TABLE IF NOT EXISTS data_sync_runs (
  id TEXT PRIMARY KEY,
  sync_type TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS','FAILED','PARTIAL')),
  records_processed INTEGER NOT NULL DEFAULT 0,
  details_json TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_data_sync_runs_time ON data_sync_runs(started_at DESC);
