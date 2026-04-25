-- ============================================================
-- 006: User approval workflow
-- Run in Supabase SQL Editor
-- ============================================================

-- Add status column to users (pending = awaiting org admin approval, active = approved)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active'));

-- All existing users are already active
UPDATE users SET status = 'active' WHERE status = 'pending';

-- Org-initiated invites table
-- When an org admin invites someone by email, a row is inserted here.
-- The auth callback checks this table to auto-approve invited users.
CREATE TABLE IF NOT EXISTS org_invites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  invited_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at     TIMESTAMPTZ,
  UNIQUE (org_id, email)
);

ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admins_manage_invites" ON org_invites
  FOR ALL USING (org_id = get_user_org_id() AND is_org_admin());

-- Update is_approved_member() to also require status = 'active'.
-- Pending users are authenticated but cannot access any protected data.
CREATE OR REPLACE FUNCTION is_approved_member()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN organizations o ON o.id = u.organization_id
    WHERE u.id = auth.uid()
      AND o.status = 'approved'
      AND u.status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Allow org admins to update status and role of users in their own org.
-- The 005 hardening migration restricted UPDATE to own profile only; this
-- adds an admin-scoped policy for approving/role-changing org members.
CREATE POLICY "org_admins_manage_org_users" ON users
  FOR UPDATE
  USING (
    organization_id = get_user_org_id()
    AND is_org_admin()
    AND id <> auth.uid()  -- admins cannot modify their own record via this policy
  );

-- Org admins can delete (remove) users from their org, except themselves.
CREATE POLICY "org_admins_remove_org_users" ON users
  FOR DELETE
  USING (
    organization_id = get_user_org_id()
    AND is_org_admin()
    AND id <> auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_users_org_status ON users(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites(email) WHERE used_at IS NULL;
