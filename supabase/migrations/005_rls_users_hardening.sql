-- ============================================================
-- 005: RLS hardening
--
-- 1. Prevents users from escalating their own privileges by
--    modifying is_platform_admin, organization_id, or role on
--    their own `users` row via the existing
--    `users_update_own_profile` policy.
--
-- 2. Documents the intended scope of `members_view_headlines`
--    on `feed_headlines` and the requirement that
--    publisher-exclusion filtering happens at the application
--    layer.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Users table: restrict self-update to safe columns
-- ------------------------------------------------------------
--
-- The original policy (see supabase/migrations/001_schema.sql):
--
--   CREATE POLICY "users_update_own_profile" ON users
--     FOR UPDATE USING (id = auth.uid());
--
-- allowed a user to UPDATE any column on their own row,
-- including role, organization_id, and is_platform_admin.
-- We replace the policy with one that both restricts the row
-- (USING) and enforces column-level integrity against the
-- pre-update values (WITH CHECK) using a trigger.

DROP POLICY IF EXISTS "users_update_own_profile" ON users;

CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Row-level CHECK can only reference NEW values; to compare
-- NEW vs OLD on a self-update we use a BEFORE UPDATE trigger
-- that refuses changes to the privileged columns unless the
-- caller is acting as service_role (which bypasses RLS anyway
-- and is allowed to make these changes administratively).

CREATE OR REPLACE FUNCTION prevent_user_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role performs admin operations and should not be
  -- constrained by this trigger.
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Changing role is not permitted for self-update';
  END IF;

  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'Changing organization_id is not permitted for self-update';
  END IF;

  IF NEW.is_platform_admin IS DISTINCT FROM OLD.is_platform_admin THEN
    RAISE EXCEPTION 'Changing is_platform_admin is not permitted for self-update';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_user_privilege_escalation ON users;

CREATE TRIGGER trg_prevent_user_privilege_escalation
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_privilege_escalation();

-- ------------------------------------------------------------
-- 2. feed_headlines: document app-layer exclusion requirement
-- ------------------------------------------------------------
--
-- The existing policy:
--
--   CREATE POLICY "members_view_headlines" ON feed_headlines
--     FOR SELECT USING (is_approved_member());
--
-- intentionally allows every approved member to see every
-- headline. Publisher-to-publisher exclusions (see
-- supabase/migrations/004_org_exclusions.sql) are NOT enforced
-- by RLS on this table.
--
-- IMPORTANT: all code paths that surface feed_headlines to end
-- users MUST call getExcludedOrgIds() from lib/exclusions.ts
-- and filter the result set by organization_id. The library
-- tab query in app/wire/(app)/library/page.tsx is the current
-- consumer; any new consumer must do the same.
--
-- If future policy is to enforce exclusions at the DB layer,
-- replace the policy with one that joins org_exclusions on
-- initiator_id/excluded_id against get_user_org_id().

COMMENT ON POLICY "members_view_headlines" ON feed_headlines IS
  'Approved members see all headlines. Publisher exclusions are NOT enforced here; callers must filter via lib/exclusions.ts getExcludedOrgIds().';
