-- Columns added directly in Supabase SQL Editor after initial migration.
-- Safe to run against existing DB (IF NOT EXISTS guards).

ALTER TABLE feed_headlines
  ADD COLUMN IF NOT EXISTS author TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS republication_guidance TEXT,
  ADD COLUMN IF NOT EXISTS attribution_template TEXT;
