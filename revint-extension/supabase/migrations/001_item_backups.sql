-- ==========================================================================
-- 001_item_backups.sql
-- Stores a full snapshot of each Vinted item so it can be restocked later.
-- ==========================================================================

CREATE TABLE item_backups (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vinted_item_id  bigint        NOT NULL,
  title           text,
  description     text,
  price           numeric(10,2),
  currency        text          DEFAULT 'EUR',
  brand           text,
  size_id         integer,
  catalog_id      integer,
  status_id       integer,
  color_ids       jsonb         DEFAULT '[]',
  photo_urls      jsonb         DEFAULT '[]',
  full_payload    jsonb,
  created_at      timestamptz   DEFAULT now(),
  updated_at      timestamptz   DEFAULT now(),
  UNIQUE(user_id, vinted_item_id)
);

-- Row-Level Security -------------------------------------------------------
ALTER TABLE item_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own backups"
  ON item_backups
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes ------------------------------------------------------------------
CREATE INDEX idx_item_backups_user
  ON item_backups(user_id);

CREATE INDEX idx_item_backups_vinted_id
  ON item_backups(user_id, vinted_item_id);
