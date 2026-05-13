-- ============================================================
-- Regional Wire — Preserve contribution counts across story purges
-- ============================================================

-- Tracks stories that have been hard-deleted by the cleanup cron.
-- Incremented before deletion so the admin org page can show
-- accurate all-time contribution counts even after purging.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS purged_story_count INT NOT NULL DEFAULT 0;

-- Called by the cleanup cron immediately before hard-deleting story rows.
-- Increments purged_story_count for each org whose stories are being purged.
CREATE OR REPLACE FUNCTION increment_purged_story_count(p_cutoff TIMESTAMPTZ)
RETURNS void AS $$
  UPDATE organizations o
  SET purged_story_count = purged_story_count + sub.cnt
  FROM (
    SELECT organization_id, COUNT(*)::INT AS cnt
    FROM stories
    WHERE published_at < p_cutoff
    GROUP BY organization_id
  ) sub
  WHERE o.id = sub.organization_id;
$$ LANGUAGE sql SECURITY DEFINER;
