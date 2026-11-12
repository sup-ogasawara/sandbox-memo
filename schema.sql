-- 備忘録テーブル
CREATE TABLE IF NOT EXISTS memos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL,                 -- いつ（YYYY-MM-DD）
  flag        TEXT NOT NULL,                 -- business / private
  content     TEXT NOT NULL,                 -- 内容
  url         TEXT NOT NULL DEFAULT '',      -- URL（空可）
  review_date TEXT NOT NULL DEFAULT '',      -- 確認日（振返日、空可）
  status      TEXT NOT NULL DEFAULT 'unconfirmed', -- unconfirmed / confirmed
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
