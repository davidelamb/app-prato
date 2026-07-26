CREATE TABLE IF NOT EXISTS media_storage_usage (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_bytes INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO media_storage_usage (id, total_bytes, updated_at)
VALUES (1, 0, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS media_upload_usage (
  period TEXT PRIMARY KEY,
  upload_count INTEGER NOT NULL DEFAULT 0,
  uploaded_bytes INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
