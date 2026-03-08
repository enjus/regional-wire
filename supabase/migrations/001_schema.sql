-- ============================================================
-- Regional Wire — Initial Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  website_url   TEXT NOT NULL,
  email_domain  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'suspended')),
  description   TEXT,
  contact_emails TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  display_name    TEXT NOT NULL,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'editor'
                    CHECK (role IN ('admin', 'editor')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stories (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id      UUID NOT NULL REFERENCES organizations(id),
  title                TEXT NOT NULL,
  byline               TEXT NOT NULL,
  body_html            TEXT NOT NULL DEFAULT '',
  body_plain           TEXT NOT NULL DEFAULT '',
  canonical_url        TEXT NOT NULL,
  slug                 TEXT NOT NULL,
  summary              TEXT,
  special_instructions TEXT,
  status               TEXT NOT NULL DEFAULT 'available'
                         CHECK (status IN ('available', 'embargoed', 'withdrawn')),
  source               TEXT NOT NULL DEFAULT 'manual'
                         CHECK (source IN ('manual', 'feed')),
  feed_guid            TEXT,
  embargo_lifts_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE story_assets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'document')),
  file_url   TEXT NOT NULL,
  caption    TEXT,
  credit     TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE org_feeds (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  feed_url        TEXT NOT NULL,
  feed_type       TEXT NOT NULL CHECK (feed_type IN ('full_text', 'headline')),
  last_polled_at  TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feed_headlines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_feed_id     UUID NOT NULL REFERENCES org_feeds(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title           TEXT NOT NULL,
  url             TEXT NOT NULL,
  summary         TEXT,
  published_at    TIMESTAMPTZ,
  guid            TEXT NOT NULL,
  UNIQUE (org_feed_id, guid)
);

CREATE TABLE republication_requests (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requesting_org_id  UUID NOT NULL REFERENCES organizations(id),
  target_org_id      UUID NOT NULL REFERENCES organizations(id),
  story_id           UUID REFERENCES stories(id),
  requested_headline TEXT,
  requested_url      TEXT,
  message            TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'fulfilled', 'declined')),
  decline_reason     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE republication_log (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id          UUID NOT NULL REFERENCES stories(id),
  republishing_org_id UUID NOT NULL REFERENCES organizations(id),
  republished_url   TEXT,
  downloaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE story_alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  keywords        TEXT[] NOT NULL DEFAULT '{}',
  alert_type      TEXT NOT NULL DEFAULT 'immediate'
                    CHECK (alert_type IN ('immediate', 'digest')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_stories_org         ON stories(organization_id);
CREATE INDEX idx_stories_status      ON stories(status);
CREATE INDEX idx_stories_published   ON stories(published_at DESC);
CREATE INDEX idx_stories_feed_guid   ON stories(feed_guid) WHERE feed_guid IS NOT NULL;
CREATE INDEX idx_story_assets_story  ON story_assets(story_id);
CREATE INDEX idx_repub_log_story     ON republication_log(story_id);
CREATE INDEX idx_repub_req_requesting ON republication_requests(requesting_org_id);
CREATE INDEX idx_repub_req_target    ON republication_requests(target_org_id);
CREATE INDEX idx_feed_headlines_feed ON feed_headlines(org_feed_id);
CREATE INDEX idx_feed_headlines_org  ON feed_headlines(organization_id);
CREATE INDEX idx_story_alerts_user   ON story_alerts(user_id);

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER — bypass RLS safely)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_approved_member()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN organizations o ON o.id = u.organization_id
    WHERE u.id = auth.uid() AND o.status = 'approved'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories                ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_assets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_feeds              ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_headlines         ENABLE ROW LEVEL SECURITY;
ALTER TABLE republication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE republication_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_alerts           ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "members_view_approved_orgs" ON organizations
  FOR SELECT USING (status = 'approved' AND is_approved_member());

CREATE POLICY "users_view_own_org" ON organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "admins_update_own_org" ON organizations
  FOR UPDATE USING (id = get_user_org_id() AND is_org_admin());

-- Users
CREATE POLICY "users_view_own_profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "members_view_org_users" ON users
  FOR SELECT USING (
    is_approved_member() AND
    EXISTS (
      SELECT 1 FROM organizations WHERE id = users.organization_id AND status = 'approved'
    )
  );

CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Stories
CREATE POLICY "members_view_stories" ON stories
  FOR SELECT USING (
    is_approved_member() AND
    status IN ('available', 'embargoed') AND
    EXISTS (
      SELECT 1 FROM organizations WHERE id = stories.organization_id AND status = 'approved'
    )
  );

CREATE POLICY "members_view_own_org_stories" ON stories
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "members_create_stories" ON stories
  FOR INSERT WITH CHECK (
    organization_id = get_user_org_id() AND is_approved_member()
  );

CREATE POLICY "members_update_own_stories" ON stories
  FOR UPDATE USING (
    organization_id = get_user_org_id() AND is_approved_member()
  );

-- Story Assets
CREATE POLICY "members_view_story_assets" ON story_assets
  FOR SELECT USING (
    is_approved_member() AND
    EXISTS (
      SELECT 1 FROM stories s
      JOIN organizations o ON o.id = s.organization_id
      WHERE s.id = story_assets.story_id AND o.status = 'approved'
        AND s.status IN ('available', 'embargoed')
    )
  );

CREATE POLICY "members_view_own_story_assets" ON story_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories WHERE id = story_assets.story_id
        AND organization_id = get_user_org_id()
    )
  );

CREATE POLICY "members_manage_own_story_assets" ON story_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stories WHERE id = story_assets.story_id
        AND organization_id = get_user_org_id()
    )
  );

-- Org Feeds
CREATE POLICY "members_view_own_feeds" ON org_feeds
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "admins_manage_own_feeds" ON org_feeds
  FOR ALL USING (organization_id = get_user_org_id() AND is_org_admin());

-- Feed Headlines
CREATE POLICY "members_view_headlines" ON feed_headlines
  FOR SELECT USING (is_approved_member());

-- Republication Requests
CREATE POLICY "orgs_view_their_requests" ON republication_requests
  FOR SELECT USING (
    requesting_org_id = get_user_org_id() OR target_org_id = get_user_org_id()
  );

CREATE POLICY "members_create_requests" ON republication_requests
  FOR INSERT WITH CHECK (
    requesting_org_id = get_user_org_id() AND is_approved_member()
  );

CREATE POLICY "target_orgs_update_requests" ON republication_requests
  FOR UPDATE USING (target_org_id = get_user_org_id());

-- Republication Log
CREATE POLICY "story_owners_view_log" ON republication_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories WHERE id = republication_log.story_id
        AND organization_id = get_user_org_id()
    ) OR republishing_org_id = get_user_org_id()
  );

CREATE POLICY "members_insert_log" ON republication_log
  FOR INSERT WITH CHECK (
    republishing_org_id = get_user_org_id() AND is_approved_member()
  );

CREATE POLICY "republishing_orgs_update_log" ON republication_log
  FOR UPDATE USING (republishing_org_id = get_user_org_id());

-- Story Alerts
CREATE POLICY "users_manage_own_alerts" ON story_alerts
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- Run these in the Supabase Storage UI or via the client lib:
-- 1. Create bucket "story-assets" with:
--    - Public: true (so published URLs work)
--    - Max file size: 524288000 (500MB for video)
--    - Allowed MIME types: image/*, video/*
-- 2. Storage RLS policies (in Storage > Policies):
--    - INSERT: authenticated users (members)
--    - SELECT: public (anyone can view story asset URLs)
-- ============================================================
