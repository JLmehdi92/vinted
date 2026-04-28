-- ==========================================================================
-- 003_profiles_plan.sql
-- Adds plan & limit columns to the existing profiles table.
-- ==========================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan                  text        DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_repost_limit    integer     DEFAULT 15;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_message_limit   integer     DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_repost_limit  integer     DEFAULT 300;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at      timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id    text;
