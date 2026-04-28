-- ==========================================================================
-- 002_feature_usage.sql
-- Tracks daily & monthly usage counts per feature per user (rate-limiting).
-- ==========================================================================

CREATE TABLE feature_usage (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature        text          NOT NULL,
  date           date          NOT NULL DEFAULT CURRENT_DATE,
  month          text          NOT NULL,
  daily_count    integer       DEFAULT 0,
  monthly_count  integer       DEFAULT 0,
  created_at     timestamptz   DEFAULT now(),
  UNIQUE(user_id, feature, date)
);

-- Row-Level Security -------------------------------------------------------
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own usage"
  ON feature_usage
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes ------------------------------------------------------------------
CREATE INDEX idx_feature_usage_lookup
  ON feature_usage(user_id, feature, date);
