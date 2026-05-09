# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

Regional Wire (production: **Northwest Newswire**) is a B2B republication platform for professional journalists at vetted newsrooms. Member orgs share stories; other member orgs can copy and republish them. There is no public-facing reader UX.

**Users are trusted professionals**, not anonymous members of the public. Error messages can be informative, flows can assume good faith, and UX friction should be low.

**Single operator** (Elliot), no engineering team. Prefer straightforward implementations over clever abstractions — a readable 50-line route beats a reusable pattern that saves 10 lines. No need for audit trails, feature flags, or multi-admin change controls.

**Reliability over features.** Newsrooms depend on republication notifications to do their jobs. A missed email or silent failure is worse than a missing UI affordance.

**Solo-maintained on modest infrastructure** (single DigitalOcean droplet, Supabase, Resend). Minimize subscription costs where reasonable, but paid tiers are acceptable when they meaningfully reduce complexity or improve reliability. Avoid solutions that require horizontal scaling or managed queues.

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

## Architecture

Regional Wire is a Next.js 15 App Router application. Member newsrooms share stories for republication. The platform handles org approval, story upload/ingestion, a browsable library, republication packaging, and email notifications.

### Auth & Access Control

- **Supabase Auth** handles signup/login via **6-digit OTP code only** — no passwords, no magic links. Users enter their email, receive a code, and enter it on the login page. Magic links were abandoned due to email prefetching consuming tokens before users could click them.
- **`middleware.ts`** enforces auth on all routes: refreshes the Supabase session, redirects unauthenticated users, and checks that authenticated users have a `users` record (org association). Admin routes (`/admin`, `/api/admin/*`) use HTTP Basic Auth instead. Approve/reject email links bypass Basic Auth via HMAC-signed tokens (`verifyAdminToken`).
- **`/api/auth/login`** and **`/api/auth/register`** are server-side API routes that gate OTP sending on org approval status. Three-step org lookup: domain match → `allowed_emails` → open `org_invites`. Both return `code: 'org_pending'` with a user-facing message when the email's domain matches a pending (not yet approved) org, preventing orphaned `auth.users` entries.
- **`/auth/callback`** handles post-OTP session setup. If the user has no `users` row and no `name` in Supabase user metadata (i.e., they came through `/login` rather than `/register`), redirects to `/onboard` before any DB writes. Otherwise: claims an open `org_invites` row atomically (UPDATE … RETURNING); falls back to domain/`allowed_emails` match if no invite. Creates the `users` record. Role: `admin` if the org has zero active users, `editor` otherwise. Status: `active` if the user was invited or is the first active user; `pending` otherwise (requires org admin approval). Uses `NEXT_PUBLIC_APP_URL` for all redirects (not `request.nextUrl.origin`) to work correctly behind a reverse proxy.
- **`/onboard`** is a client-side name-collection page shown to first-time users who authenticated via `/login` (which does not collect a name). The session is already established; the page just collects the name and POSTs to `/api/auth/onboard`. `/onboard` and `/api/auth/onboard` are in middleware `publicPaths` so the "no users row" guard does not redirect away from them. The onboard API runs the same invite-claim + org-lookup + user-insert logic as the callback.
- **`/register`** requires the email domain (or an open invite) to match an approved org. Returns a pending-org error if the domain matches an org that is still under review.
- **Org approval** (`/api/admin/orgs/[id]/approve`) automatically seeds `org_invites` rows for all `contact_emails` on the org record. This ensures contact emails get `status = 'active'` (not `pending`) when they self-register after approval.
- **`users.status`**: `active` = full access; `pending` = authenticated but blocked (org admin must approve). `is_approved_member()` RLS helper requires `status = 'active'`.
- All Supabase tables have RLS. Three `SECURITY DEFINER` helper functions (`get_user_org_id()`, `is_approved_member()`, `is_org_admin()`) are used in policies to avoid recursive lookups.
- **OTP rate limiting** is enforced in `lib/otp-rate-limit.ts` before the Supabase call in both `/api/auth/login` and `/api/auth/register`: 3 sends per email and 10 per IP per 15-minute window. The store is in-memory (module-level Maps) — fine for a single PM2 instance, but would need to move to Redis if the app ever runs on multiple instances.

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

The attribution line is org-customizable via `organizations.attribution_template`. Rendering logic lives in `lib/attribution.ts` (`renderAttributionHtml` / `renderAttributionPlain`). Supported placeholders: `{{headline}}` (hyperlink in HTML, plain text in plain-text), `{{url}}` (raw URL), `{{org}}` (organization name), `{{website}}` (hyperlink in HTML, raw URL in plain-text). Falls back to `DEFAULT_ATTRIBUTION_TEMPLATE` when `attribution_template` is null.

### Email

`lib/email.ts` uses Resend. The client is lazy-initialized via `getResend()` to avoid build-time errors when `RESEND_API_KEY` is absent. All email functions are fire-and-forget at call sites (`.catch()` to log, never throw).

All 20 notification functions send both `html` and `text`. HTML is composed using helpers from `lib/email-template.ts` — a pure string-building module with no side effects. Two visual variants:

- **`default`** — standard navy header, white content card, green CTA button.
- **`critical`** — adds an amber accent stripe and "Action Required" badge. Use for corrections, withdrawals, and org removal.

**To add a new email:** import the helpers you need from `lib/email-template.ts`, build a `content` string by composing `renderSection()`, `renderHeading()`, `renderParagraph()`, `renderButton()`, etc., then pass it to `renderEmailHtml()`. Always include a plain-text `text` fallback. User-supplied strings passed to inline helpers (`renderParagraph`, `renderHeading`, etc.) are HTML-escaped automatically. URLs passed to `renderButton` and `renderLinkList` use `escUrl()` internally (escapes `&` in query strings).

### Story Assets

Assets are stored in the `story-assets` Supabase Storage bucket as **private** (not public). The upload form stores the relative path (`data.path`), not the public URL. The story detail page generates signed URLs at render time via the service role client (`createSignedUrls`, 1-hour expiry). `next.config.mjs` allows the signed URL hostname pattern (`*.supabase.co/storage/v1/object/sign/**`) for `next/image`.

### Cron Jobs

Defined via `crontab` on the DigitalOcean droplet (not Vercel). All routes check `Authorization: Bearer {CRON_SECRET}` in production but skip auth in development.

- `/api/cron/poll-feeds` (every 15 min): ingests RSS feeds, deduplicates by `feed_guid`, lifts expired embargoes.
- `/api/cron/hourly-digest` (every hour): sends alerts and daily digests. Two passes per run:
  1. **Consolidated alert pass** — stories from the last ~61 minutes matched against all active `story_alerts` (keyword match or org follow). All of a user's matches are merged into one email, at most once per 55 minutes, tracked in `alert_send_log`.
  2. **Daily digest pass** — for users with `user_digest_prefs.daily_digest_enabled = true` whose `delivery_hour_utc` matches the current UTC hour. Pulls up to 10 stories from last 24h, sorted by republication count (from `republication_log`) then recency. Guarded by `alert_send_log` (23h window).
- `/api/cron/cleanup` (daily at 3am UTC): two-pass purge. Pass 1: deletes Storage files and `story_assets` rows for stories published >30 days ago. Pass 2: hard-deletes story rows published >90 days ago (cascades `story_assets`, `story_changes`; nulls `republication_log.story_id` and `republication_requests.story_id`). Republication log rows are intentionally preserved for contributor reach reporting.

To trigger locally (no auth required in development):
```
GET http://localhost:3000/api/cron/hourly-digest
GET http://localhost:3000/api/cron/cleanup
```

### Schema Notes

`organizations.allowed_emails TEXT[] NOT NULL DEFAULT '{}'` — **not in any numbered migration** (added directly via Supabase SQL editor). If recreating the schema from migrations, run `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS allowed_emails TEXT[] NOT NULL DEFAULT '{}'`, or use `supabase/migrations/010_allowed_emails.sql`.

`republication_log.story_id` and `republication_requests.story_id` are nullable with `ON DELETE SET NULL` — history rows intentionally survive when a story is hard-deleted by the cleanup cron.

`feed_headlines` RLS allows all approved members to read all headlines; publisher exclusion filtering must be applied at the application layer via `getExcludedOrgIds()` in `lib/exclusions.ts`.

When adding columns not in the migrations, run `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` in the Supabase SQL Editor.

### Publisher Exclusions

Org admins can exclude other publishers via **Dashboard → Settings → Exclusions**. Exclusions are mutual in effect: when Org A excludes Org B, neither sees the other's stories in the library or on direct story URLs. Only the initiating org can remove the exclusion.

**Schema:** `org_exclusions` table with `initiator_id` and `excluded_id` (both reference `organizations.id`). A single row represents one exclusion. The mutual effect is achieved by querying both directions at the application layer, not by storing two rows.

**`lib/exclusions.ts`** exports `getExcludedOrgIds(client, orgId)` — pass the anon Supabase client and the current user's org ID; returns an array of org IDs that should be hidden. Queries both `initiator_id = orgId` and `excluded_id = orgId` in one call. Returns `[]` if no exclusions exist.

Exclusions affect library visibility only — story alerts, email digests, and republication log history are unaffected. Platform admins bypass all exclusion filtering.

**API routes:**
- `POST /api/orgs/[id]/exclusions` — create exclusion (initiating org admin only; checks for existing exclusion in either direction, returns 409 on duplicate)
- `DELETE /api/orgs/[id]/exclusions/[excluded_org_id]` — remove exclusion (initiating org admin only; returns 404 if no matching row)

Both routes use the service role client for the write; application-layer auth check is the gate.

### Story Corrections & Withdrawals

Stories support two tiers of post-publication changes tracked in the `story_changes` table:

- **Update**: minor fixes — added detail, formatting, rewording. Optional change note (visible to members, not emailed). No notification sent.
- **Correction**: error of fact — wrong name, wrong number, misattribution. Requires publication-ready correction text. Emailed to all orgs in `republication_log`. Correction notices displayed prominently on the library detail page (stacked, newest first). Sets `stories.has_correction = true`.
- **Withdrawal**: story pulled from library. Requires a reason. All republishing orgs notified by email.

The PATCH endpoint (`/api/stories/[id]`) validates change metadata, inserts `story_changes` rows via service role, and fires off notification emails (fire-and-forget).

### Admin Dashboard

`/admin` uses HTTP Basic Auth (credentials in `.env.local`) and a service role Supabase client with no-op cookies.

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
