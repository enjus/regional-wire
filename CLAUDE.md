# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start local dev server at localhost:3000
npm run build    # Production build (catches TypeScript and prerender errors)
npm run lint     # ESLint
```

There are no tests. The build is the primary correctness check — run `npm run build` after significant changes.

## Deployment

Hosted on a DigitalOcean droplet, managed by PM2. To deploy:

```bash
# On the droplet (ssh deploy@nwnewswire.com)
cd /home/deploy/regional-wire && git pull && npm install && npm run build && pm2 restart regional-wire
```

To trigger cron jobs locally (no auth required in development):
```
GET http://localhost:3000/api/cron/poll-feeds
GET http://localhost:3000/api/cron/alert-digest
```

## Architecture

Regional Wire is a Next.js 15 App Router application. Member newsrooms share stories for republication. The platform handles org approval, story upload/ingestion, a browsable library, republication packaging, and email notifications.

### Auth & Access Control

- **Supabase Auth** handles signup/login via **6-digit OTP code only** — no passwords, no magic links. Users enter their email, receive a code, and enter it on the login page. Magic links were abandoned due to email prefetching consuming tokens before users could click them.
- **`middleware.ts`** enforces auth on all routes: refreshes the Supabase session, redirects unauthenticated users, and checks that authenticated users have a `users` record (org association). Admin routes (`/admin`, `/api/admin/*`) use HTTP Basic Auth instead. Approve/reject email links bypass Basic Auth via HMAC-signed tokens (`verifyAdminToken`).
- **`/auth/callback`** handles post-OTP session setup: looks up the user's org by email domain, creates the `users` record, and assigns `admin` (first user from that domain) or `editor` role. Uses `NEXT_PUBLIC_APP_URL` for all redirects (not `request.nextUrl.origin`) to work correctly behind a reverse proxy.
- **`/register`** requires the email domain to match an approved org. The domain check uses the service role client to bypass RLS.
- All Supabase tables have RLS. Three `SECURITY DEFINER` helper functions (`get_user_org_id()`, `is_approved_member()`, `is_org_admin()`) are used in policies to avoid recursive lookups.

### Supabase Client Usage

There are two patterns — use the right one or queries will silently fail due to RLS:

- **Anon client** (`createClient()` / `createServerClient` with anon key): for user-scoped reads/writes where RLS should apply.
- **Service role client** (`createServiceClient()`): for admin operations, org lookups during auth flow, and anywhere RLS would block a legitimate server-side operation. Uses plain `@supabase/supabase-js` `createClient` (not the SSR client) with `auth: { autoRefreshToken: false, persistSession: false }` — this ensures the service role key is used for the `authorization` header rather than the user's session JWT.

Supabase join results are typed as arrays by TypeScript even when they return a single object. Always cast through `unknown`:
```ts
(data.join_field as unknown as { name: string } | null)?.name
```

Pages that call Supabase at render time need `export const dynamic = 'force-dynamic'` to prevent build-time prerendering failures.

### Story Sources & HTML Sanitization

Stories enter the library two ways:
- **Manual upload**: editors use the Tiptap rich-text editor. Body stored as `body_html` + `body_plain`.
- **Feed ingestion** (`/api/cron/poll-feeds`): RSS parser runs every 15 minutes. Full-text feeds create `stories` records; headline feeds create `feed_headlines` records.

`sanitizeStoryHtml()` in `lib/utils.ts` strips scripts, iframes, embeds, forms, figures, images, SVGs, event handler attributes, and `javascript:`/`data:` URIs. This must be applied to feed-ingested HTML before display.

### Republication Package (Clipboard)

`/components/stories/republication-package.tsx` handles the copy-to-clipboard flow. It writes both `text/html` and `text/plain` via `ClipboardItem`. The HTML includes: `<h1>` headline, `<p><em>By byline</em></p>`, sanitized body, and an italicized attribution line with the story title as SEO-optimized anchor text linking to the canonical URL. Images are stripped; the originating org's uploaded assets are separately available for download on the story detail page.

### Email

`lib/email.ts` uses Resend. The client is lazy-initialized via `getResend()` to avoid build-time errors when `RESEND_API_KEY` is absent. All email functions are fire-and-forget at call sites (`.catch()` to log, never throw).

### Story Assets

Assets are stored in the `story-assets` Supabase Storage bucket as **private** (not public). The upload form stores the relative path (`data.path`), not the public URL. The story detail page generates signed URLs at render time via the service role client (`createSignedUrls`, 1-hour expiry). `next.config.mjs` allows the signed URL hostname pattern (`*.supabase.co/storage/v1/object/sign/**`) for `next/image`.

### Cron Jobs

Defined via `crontab` on the DigitalOcean droplet (not Vercel). Both routes check `Authorization: Bearer {CRON_SECRET}` in production but skip auth in development.

- `/api/cron/poll-feeds` (every 15 min): ingests RSS feeds, deduplicates by `feed_guid`, lifts expired embargoes.
- `/api/cron/hourly-digest` (every hour): sends alerts and daily digests. Two passes per run:
  1. **Consolidated alert pass** — stories from the last ~61 minutes matched against all active `story_alerts` (keyword match or org follow). All of a user's matches are merged into one email, at most once per 55 minutes, tracked in `alert_send_log`.
  2. **Daily digest pass** — for users with `user_digest_prefs.daily_digest_enabled = true` whose `delivery_hour_utc` matches the current UTC hour. Pulls up to 10 stories from last 24h, sorted by republication count (from `republication_log`) then recency. Guarded by `alert_send_log` (23h window).

To trigger locally (no auth required in development):
```
GET http://localhost:3000/api/cron/hourly-digest
```

### Schema Notes

The migration is in `supabase/migrations/001_schema.sql`. Post-migration additions made directly in Supabase SQL Editor (not yet in the migration file):
- `feed_headlines.author TEXT` — added to capture `dc:creator` from RSS items
- `users.is_platform_admin BOOLEAN NOT NULL DEFAULT false` — platform admin flag
- `organizations.republication_guidance TEXT` — optional guidance for republishers

`supabase/migrations/003_alert_enhancements.sql` adds:
- `story_alerts.followed_organization_id UUID` — org-follow alert type (either this or `keywords` required)
- `story_alerts.keywords` — made nullable (was NOT NULL)
- `story_alerts.alert_type` — dropped (all alerts now batch hourly)
- `user_digest_prefs` table — per-user daily digest opt-in and `delivery_hour_utc`
- `alert_send_log` table — dedup/throttle log for hourly and daily_digest sends

`supabase/migrations/004_org_exclusions.sql` adds:
- `org_exclusions` table — org-to-org exclusion relationships (see Publisher Exclusions below)

When adding columns not in the migration, run `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` in the Supabase SQL Editor.

### Publisher Exclusions

Org admins can exclude other publishers via **Dashboard → Settings → Exclusions**. Exclusions are mutual in effect: when Org A excludes Org B, neither sees the other's stories in the library or on direct story URLs. Only the initiating org can remove the exclusion.

**Schema:** `org_exclusions` table with `initiator_id` and `excluded_id` (both reference `organizations.id`). A single row represents one exclusion. The mutual effect is achieved by querying both directions at the application layer, not by storing two rows.

**`lib/exclusions.ts`** exports `getExcludedOrgIds(client, orgId)` — pass the anon Supabase client and the current user's org ID; returns an array of org IDs that should be hidden. Queries both `initiator_id = orgId` and `excluded_id = orgId` in one call. Returns `[]` if no exclusions exist.

**Enforcement points:**
- `app/wire/(app)/library/page.tsx` — filters excluded orgs from the stories query, org filter dropdown, and headlines tab feed query. All three sites check `excludedOrgIds.length > 0` before applying the filter.
- `app/wire/(app)/library/[id]/page.tsx` — calls `getExcludedOrgIds` after fetching the story; returns `notFound()` if the story's org is excluded.
- Platform admins bypass all exclusion filtering.

**Scope:** Exclusions affect library visibility only. Story alerts, email digests, and republication log history are unaffected.

**API routes:**
- `POST /api/orgs/[id]/exclusions` — create exclusion (initiating org admin only; checks for existing exclusion in either direction, returns 409 on duplicate)
- `DELETE /api/orgs/[id]/exclusions/[excluded_org_id]` — remove exclusion (initiating org admin only; returns 404 if no matching row)

Both routes use the service role client for the write; application-layer auth check is the gate.

### Story Corrections & Withdrawals

Stories support two tiers of post-publication changes tracked in the `story_changes` table:

- **Update**: minor fixes — added detail, formatting, rewording. Optional change note (visible to members, not emailed). No notification sent.
- **Correction**: error of fact — wrong name, wrong number, misattribution. Requires publication-ready correction text. Emailed to all orgs in `republication_log`. Correction notices displayed prominently on the library detail page (stacked, newest first). Sets `stories.has_correction = true`.
- **Withdrawal**: story pulled from library. Requires a reason. All republishing orgs notified by email.

The edit form (`story-upload-form.tsx`) shows a change classification section in edit mode (radio: update/correction, change note field, correction text field). The withdraw button (`story-withdraw-button.tsx`) shows an inline form requiring a reason.

The PATCH endpoint (`/api/stories/[id]`) validates change metadata, inserts `story_changes` rows via service role, and fires off notification emails (fire-and-forget). The migration is in `supabase/migrations/002_story_changes.sql`.

### Admin Dashboard

`/admin` is a server component protected by HTTP Basic Auth (credentials in `.env.local`). It uses a service role Supabase client with no-op cookies. Approve/reject actions are in `/app/admin/admin-org-actions.tsx` (client component) and hit `/api/admin/orgs/[id]/approve` and `/api/admin/orgs/[id]/reject`.

### Branding

The production deployment runs as **Northwest Newswire**. The codebase supports deploy-time customization without branching:

- **Name / description**: `NEXT_PUBLIC_BRAND_NAME` and `NEXT_PUBLIC_BRAND_DESCRIPTION` in `.env.local`. Read at runtime via `lib/brand.ts`. Used in nav/footer wordmarks, page `<title>`, and all transactional email copy.
- **Accent color**: Hardcoded in `tailwind.config.ts` (`wire.red` / `wire.red-dark`). Must be changed in code and rebuilt — env vars are not reliably available to Tailwind during `next build`. Current values: `#2c6330` / `#1e4522` (forest green).

The color keys are named `wire-red`/`wire-red-dark` throughout the codebase for historical reasons. Don't rename them — there are 55+ files using these class names.

### Key Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
PLATFORM_ADMIN_EMAIL
ADMIN_USERNAME / ADMIN_PASSWORD   # HTTP Basic Auth for /admin
NEXT_PUBLIC_APP_URL
CRON_SECRET
NEXT_PUBLIC_BRAND_NAME            # Platform name (default: "Regional Wire")
NEXT_PUBLIC_BRAND_DESCRIPTION     # Page metadata description
```
