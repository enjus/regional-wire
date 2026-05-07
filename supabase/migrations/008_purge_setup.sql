-- ============================================================
-- Regional Wire — Story purge FK setup
-- Preserves republication history when stories are deleted.
-- ============================================================

-- Verify actual constraint names before running in production:
-- SELECT constraint_name FROM information_schema.table_constraints
-- WHERE table_name IN ('republication_log', 'republication_requests')
-- AND constraint_type = 'FOREIGN KEY';
-- Expected: republication_log_story_id_fkey, republication_requests_story_id_fkey

-- republication_log: make story_id nullable and set ON DELETE SET NULL
-- so log rows (used for contributor reach reporting) survive story deletion.
ALTER TABLE republication_log ALTER COLUMN story_id DROP NOT NULL;
ALTER TABLE republication_log
  DROP CONSTRAINT republication_log_story_id_fkey,
  ADD CONSTRAINT republication_log_story_id_fkey
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL;

-- republication_requests: add ON DELETE SET NULL (column is already nullable)
ALTER TABLE republication_requests
  DROP CONSTRAINT republication_requests_story_id_fkey,
  ADD CONSTRAINT republication_requests_story_id_fkey
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL;
