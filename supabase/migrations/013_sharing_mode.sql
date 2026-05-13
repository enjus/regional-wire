ALTER TABLE organizations
  ADD COLUMN sharing_mode TEXT NOT NULL DEFAULT 'open'
    CHECK (sharing_mode IN ('open', 'restricted'));

CREATE TABLE org_sharing_partners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  partner_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_partner CHECK (org_id <> partner_id),
  UNIQUE (org_id, partner_id)
);

ALTER TABLE org_sharing_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_view_sharing_partners" ON org_sharing_partners
  FOR SELECT USING (is_approved_member());

CREATE POLICY "admins_manage_own_sharing_partners" ON org_sharing_partners
  FOR ALL USING (
    is_org_admin() AND org_id = get_user_org_id()
  );
