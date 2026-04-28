DROP TABLE IF EXISTS whitelist_chars;
DROP TABLE IF EXISTS public_cards;
DROP TABLE IF EXISTS private_cards;
DROP TABLE IF EXISTS generation_jobs;

CREATE TABLE whitelist_chars (
  character TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public_cards (
  card_id TEXT PRIMARY KEY,
  character TEXT NOT NULL UNIQUE,
  payload TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE private_cards (
  card_id TEXT PRIMARY KEY,
  browser_id TEXT NOT NULL,
  character TEXT NOT NULL,
  payload TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  job_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_private_cards_browser_character
  ON private_cards(browser_id, character);

CREATE TABLE generation_jobs (
  job_id TEXT PRIMARY KEY,
  browser_id TEXT NOT NULL,
  character TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  review_notes TEXT,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  card_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_generation_jobs_character
  ON generation_jobs(character, created_at DESC);
