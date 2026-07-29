CREATE TABLE IF NOT EXISTS push_subscriptions (
  expo_push_token TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  device_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled
  ON push_subscriptions (enabled, updated_at);
