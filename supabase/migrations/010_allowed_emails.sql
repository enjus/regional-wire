-- Add allowed_emails column to organizations.
-- This column was added directly via the Supabase SQL editor before being tracked here.
-- Whitelists specific email addresses that can register/login regardless of email_domain match.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS allowed_emails TEXT[] NOT NULL DEFAULT '{}';
