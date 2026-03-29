-- ============================================================
-- Regional Wire — Story Changes (corrections, updates, withdrawals)
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Track every edit to a story with type classification
CREATE TABLE IF NOT EXISTS story_changes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id          UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id),
  change_type       TEXT NOT NULL CHECK (change_type IN ('update', 'correction', 'withdrawal')),
  change_note       TEXT,
  correction_text   TEXT,
  withdrawal_reason TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_changes_story ON story_changes(story_id);

-- Flag on stories for quick "has correction" checks without joining
ALTER TABLE stories ADD COLUMN IF NOT EXISTS has_correction BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE story_changes ENABLE ROW LEVEL SECURITY;

-- Any approved member can view change history for stories they can see
CREATE POLICY "members_view_story_changes" ON story_changes
  FOR SELECT USING (
    is_approved_member() AND
    EXISTS (
      SELECT 1 FROM stories s
      JOIN organizations o ON o.id = s.organization_id
      WHERE s.id = story_changes.story_id
        AND o.status = 'approved'
    )
  );

-- Own-org members can also see changes on their own stories (including withdrawn)
CREATE POLICY "members_view_own_story_changes" ON story_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories WHERE id = story_changes.story_id
        AND organization_id = get_user_org_id()
    )
  );
