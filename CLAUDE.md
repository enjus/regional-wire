# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start local dev server at localhost:3000
npm run build    # Production build (catches TypeScript and prerender errors)
npm run lint     # ESLint
```

There are no tests. The build is the primary correctness check — run `npm run build` after significant changes.

To trigger cron jobs locally (no auth required in development):
```
GET http://localhost:3000/api/cron/poll-feeds
GET http://localhost:3000/api/cron/alert-digest
```

## Architecture

Regional Wire is a Next.js 15 App Router application. Member newsrooms share stories for republication. The platform handles org approval, story upload/ingestion, a browsable library, republication packaging, and email notifications.

### Auth & Access Control

- **Supabase Auth** handles signup/login. Email confirmation is required.
- **`middleware.ts`** enforces auth on all routes: refreshes the Supabase session, redirects unauthenticated users, and checks that authenticated users have a `users` record (org association). Admin routes (`/admin`, `/api/admin/*`) use HTTP Basic Auth instead.
- **`/auth/callback`** exchanges the Supabase code for a session, looks up the user's org by email domain, creates the `users` record, and assigns `admin` (first user from that domain) or `editor` role.
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

`sanitizeStoryHtml()` in `lib/utils.ts` strips scripts, iframes, embeds, forms, figures, and images before rendering or copying. This must be applied to feed-ingested HTML before display.

### Republication Package (Clipboard)

`/components/stories/republication-package.tsx` handles the copy-to-clipboard flow. It writes both `text/html` and `text/plain` via `ClipboardItem`. The HTML includes: `<h1>` headline, `<p><em>By byline</em></p>`, sanitized body, and an italicized attribution line with the story title as SEO-optimized anchor text linking to the canonical URL. Images are stripped; the originating org's uploaded assets are separately available for download on the story detail page.

### Email

`lib/email.ts` uses Resend. The client is lazy-initialized via `getResend()` to avoid build-time errors when `RESEND_API_KEY` is absent. All email functions are fire-and-forget at call sites (`.catch()` to log, never throw).

### Cron Jobs

Defined in `vercel.json`. Both routes check `Authorization: Bearer {CRON_SECRET}` in production but skip auth in development.

- `/api/cron/poll-feeds` (every 15 min): ingests RSS feeds, deduplicates by `feed_guid`, lifts expired embargoes, triggers story alerts.
- `/api/cron/alert-digest` (hourly): sends digest emails only at the hour configured by `ALERT_DIGEST_HOUR`.

### Schema Notes

The migration is in `supabase/migrations/001_schema.sql`. Post-migration additions made directly in Supabase SQL Editor (not yet in the migration file):
- `feed_headlines.author TEXT` — added to capture `dc:creator` from RSS items

When adding columns not in the migration, run `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` in the Supabase SQL Editor.

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
