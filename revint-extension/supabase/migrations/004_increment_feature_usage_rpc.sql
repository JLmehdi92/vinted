-- Atomic feature usage increment — prevents race conditions
CREATE OR REPLACE FUNCTION increment_feature_usage(
  p_user_id uuid,
  p_feature text,
  p_date date,
  p_month text
) RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO feature_usage (user_id, feature, date, month, daily_count, monthly_count)
  VALUES (p_user_id, p_feature, p_date, p_month, 1, 1)
  ON CONFLICT (user_id, feature, date)
  DO UPDATE SET
    daily_count = feature_usage.daily_count + 1,
    monthly_count = feature_usage.monthly_count + 1;
$$;
