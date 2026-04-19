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
cd /home/deploy/regional-wire && git pull && npm run build && pm2 restart regional-wire
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
- **Service role client** (`createServiceClient()`): for admin operations, org lookups during auth flow, and anywhere RLS would block a legitimate server-side operation. Uses empty cookie arrays: `{ cookies: { getAll: () => [], setAll: () => {} } }`.

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

- `/api/cron/poll-feeds` (every 15 min): ingests RSS feeds, deduplicates by `feed_guid`, lifts expired embargoes, triggers story alerts.
- `/api/cron/alert-digest` (hourly): sends digest emails only at the hour configured by `ALERT_DIGEST_HOUR`.

### Schema Notes

The migration is in `supabase/migrations/001_schema.sql`. Post-migration additions made directly in Supabase SQL Editor (not yet in the migration file):
- `feed_headlines.author TEXT` — added to capture `dc:creator` from RSS items
- `users.is_platform_admin BOOLEAN NOT NULL DEFAULT false` — platform admin flag
- `organizations.republication_guidance TEXT` — optional guidance for republishers

When adding columns not in the migration, run `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` in the Supabase SQL Editor.

### Story Corrections & Withdrawals

Stories support two tiers of post-publication changes tracked in the `story_changes` table:

- **Update**: minor fixes — added detail, formatting, rewording. Optional change note (visible to members, not emailed). No notification sent.
- **Correction**: error of fact — wrong name, wrong number, misattribution. Requires publication-ready correction text. Emailed to all orgs in `republication_log`. Correction notices displayed prominently on the library detail page (stacked, newest first). Sets `stories.has_correction = true`.
- **Withdrawal**: story pulled from library. Requires a reason. All republishing orgs notified by email.

The edit form (`story-upload-form.tsx`) shows a change classification section in edit mode (radio: update/correction, change note field, correction text field). The withdraw button (`story-withdraw-button.tsx`) shows an inline form requiring a reason.

The PATCH endpoint (`/api/stories/[id]`) validates change metadata, inserts `story_changes` rows via service role, and fires off notification emails (fire-and-forget). The migration is in `supabase/migrations/002_story_changes.sql`.

### Admin Dashboard

`/admin` is a server component protected by HTTP Basic Auth (credentials in `.env.local`). It uses a service role Supabase client with no-op cookies. Approve/reject actions are in `/app/admin/admin-org-actions.tsx` (client component) and hit `/api/admin/orgs/[id]/approve` and `/api/admin/orgs/[id]/reject`.

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
ALERT_DIGEST_HOUR                 # 0–23, default 7
```
