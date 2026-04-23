CREATE TABLE org_exclusions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  excluded_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_exclusion CHECK (initiator_id <> excluded_id),
  UNIQUE (initiator_id, excluded_id)
);

CREATE INDEX idx_org_exclusions_initiator ON org_exclusions(initiator_id);
CREATE INDEX idx_org_exclusions_excluded  ON org_exclusions(excluded_id);

ALTER TABLE org_exclusions ENABLE ROW LEVEL SECURITY;

-- Any approved member can read exclusions involving their org (needed for library filter)
CREATE POLICY "members_read_own_exclusions" ON org_exclusions
  FOR SELECT USING (
    is_approved_member() AND
    (initiator_id = get_user_org_id() OR excluded_id = get_user_org_id())
  );

-- Only org admins can create exclusions for their own org
CREATE POLICY "org_admins_insert_exclusions" ON org_exclusions
  FOR INSERT WITH CHECK (
    is_org_admin() AND initiator_id = get_user_org_id()
  );

-- Only the initiating org's admin can remove the exclusion
CREATE POLICY "org_admins_delete_exclusions" ON org_exclusions
  FOR DELETE USING (
    is_org_admin() AND initiator_id = get_user_org_id()
  );
