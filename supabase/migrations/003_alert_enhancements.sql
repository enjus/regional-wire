-- Drop alert_type (everything is now hourly-batched)
ALTER TABLE story_alerts DROP COLUMN IF EXISTS alert_type;

-- Allow alerts to be keyword-based OR org-follow (keywords no longer required)
ALTER TABLE story_alerts ALTER COLUMN keywords DROP NOT NULL;
ALTER TABLE story_alerts ADD COLUMN IF NOT EXISTS followed_organization_id UUID
  REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE story_alerts ADD CONSTRAINT story_alerts_target_check
  CHECK (
    (keywords IS NOT NULL AND array_length(keywords, 1) > 0)
    OR followed_organization_id IS NOT NULL
  );
CREATE INDEX IF NOT EXISTS idx_story_alerts_followed_org
  ON story_alerts(followed_organization_id);

-- Per-user digest preferences
CREATE TABLE IF NOT EXISTS user_digest_prefs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  delivery_hour_utc SMALLINT NOT NULL DEFAULT 7
    CHECK (delivery_hour_utc BETWEEN 0 AND 23),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_digest_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_digest_prefs_self ON user_digest_prefs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Throttle log: service-role only — deny all direct user access
CREATE TABLE IF NOT EXISTS alert_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('hourly', 'daily_digest')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alert_send_log_recent
  ON alert_send_log(user_id, kind, sent_at DESC);
ALTER TABLE alert_send_log ENABLE ROW LEVEL SECURITY;
-- No policies = deny all for non-service-role clients
