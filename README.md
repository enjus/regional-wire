# Regional Wire

A content-sharing platform for regional news organizations. Member newsrooms share stories for republication, generating clean packages with embedded SEO attribution instructions.

**Production:** https://nwnewswire.com

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account with a verified sending domain

### 1. Clone and install

```bash
git clone <repo-url>
cd regional-wire
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values — see **Environment Variables** below.

### 3. Supabase setup

#### Schema

Run all migrations in order in your Supabase project's SQL Editor:

```
supabase/migrations/001_schema.sql   — core schema, RLS policies, helper functions
supabase/migrations/002_story_changes.sql   — story corrections and withdrawals
supabase/migrations/003_alert_enhancements.sql   — org-follow alerts, daily digest prefs
supabase/migrations/004_org_exclusions.sql   — publisher exclusions
```

Then run these additional statements (post-migration additions not yet in the migration files):

```sql
ALTER TABLE feed_headlines ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS republication_guidance TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS attribution_template TEXT;
```

#### Storage bucket

In Supabase → Storage, create a bucket named `story-assets`:
- **Public:** No (private — signed URLs are generated at render time)
- **Allowed MIME types:** `image/*,video/*`
- **Max upload size:** 524288000 (500MB)

Set storage policies:
- **INSERT:** Authenticated users only
- **SELECT:** Authenticated users only (service role used server-side for signed URLs)

#### Auth settings

In Supabase → Authentication → URL Configuration:
- Set **Site URL** to `http://localhost:3000`
- Add **Redirect URLs:**
  - `http://localhost:3000/auth/callback`
  - `https://nwnewswire.com/auth/callback`

Auth uses **6-digit OTP code only** — no passwords, no magic links.

### 4. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, bypasses RLS) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `PLATFORM_ADMIN_EMAIL` | Email address that receives new org registration notifications |
| `ADMIN_USERNAME` | Username for HTTP Basic Auth on `/admin` |
| `ADMIN_PASSWORD` | Password for HTTP Basic Auth on `/admin` |
| `NEXT_PUBLIC_APP_URL` | Full URL of your deployment, no trailing slash (e.g. `https://nwnewswire.com`) |
| `CRON_SECRET` | Secret token sent as `Authorization: Bearer <token>` to cron endpoints |
| `NEXT_PUBLIC_BRAND_NAME` | Platform name shown in nav, footer, emails, and page titles (default: `Regional Wire`) |
| `NEXT_PUBLIC_BRAND_DESCRIPTION` | One-sentence description used in page metadata (default: generic) |

---

## Member Newsrooms

The homepage "Our member newsrooms" section is driven by the array in [`lib/member-orgs.ts`](lib/member-orgs.ts). Each entry is a plain object — add, remove, or reorder entries there and the homepage updates automatically.

### Fields

| Field | Required | Description |
|---|---|---|
| `initials` | Yes | 2–3 letter abbreviation shown in the avatar when no logo is provided |
| `name` | Yes | Full organization name, shown on the card |
| `location` | Yes | Location or org type shown below the name (e.g. `"Portland, Oregon"`, `"Nonprofit newsroom"`) |
| `color` | Yes | Hex color for the initials avatar background (e.g. `"#2D5A8B"`) |
| `url` | No | If provided, the entire card becomes a link to this URL (opens in a new tab) |
| `logo` | No | Path to a logo file relative to `/public` (e.g. `'/logos/foo.svg'`). If provided, replaces the initials circle with the logo inside a square container |

### Adding a member

```ts
{ initials: 'OL', name: 'OregonLive', type: 'Regional newspaper', color: '#1a1a1a', url: 'https://oregonlive.com' },
```

### Adding a logo

Drop the logo file into `public/logos/`, then reference it by path:

```ts
{
  initials: 'OL',
  name: 'OregonLive',
  type: 'Regional newspaper',
  color: '#1a1a1a',
  url: 'https://oregonlive.com',
  logo: '/logos/oregonlive.svg',
},
```

SVG and PNG both work. The logo renders at 48×48px with `object-contain` padding.

---

## Branding & Customization

This codebase is designed to be deployable under a custom brand without maintaining separate branches. The current production deployment runs as **Northwest Newswire**.

### Name and description

Set in `.env.local` on the server — read at runtime, so no rebuild required:

```
NEXT_PUBLIC_BRAND_NAME=Northwest Newswire
NEXT_PUBLIC_BRAND_DESCRIPTION=A content-sharing platform for Northwest newsrooms.
```

These flow through `lib/brand.ts` into page metadata, nav/footer wordmarks, and all transactional emails.

### Accent color

The accent color is hardcoded in `tailwind.config.ts` and baked into the CSS at build time:

```ts
// tailwind.config.ts
wire: {
  red: '#2c6330',       // primary accent
  'red-dark': '#1e4522', // hover/active state
  ...
}
```

To change the accent color for a new deployment, edit those two values and rebuild. The color keys are named `wire-red`/`wire-red-dark` throughout the codebase for historical reasons — the names don't reflect the actual color in production.

The typography plugin's link color is also set in `tailwind.config.ts` under `theme.extend.typography`.

---

## Production Deployment (DigitalOcean)

The app runs on a DigitalOcean Ubuntu droplet:
- **Node.js 20** + **PM2** (process manager, auto-restart on boot)
- **Nginx** reverse proxy with **Certbot** SSL
- **Cron jobs** via `crontab` (feed polling every 15 min, alert digest hourly)

See `DEPLOYMENT-GUIDE.html` (gitignored) for full step-by-step instructions.

### Deploying updates

```bash
ssh deploy@YOUR_DROPLET_IP
cd ~/regional-wire
git pull && npm install && npm run build && pm2 restart regional-wire
```

### Cron jobs

```bash
# In crontab -e on the server:
*/15 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://nwnewswire.com/api/cron/poll-feeds
0 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://nwnewswire.com/api/cron/hourly-digest
```

---

## Architecture Overview

```
User browser
  ↕ HTTPS
Nginx (reverse proxy, SSL)
  ↕
Next.js App Router (Node.js, PM2, port 3000)
  ↕ Supabase JS SDK (@supabase/ssr)
Supabase (auth + Postgres + Storage)
  ↕
Resend (transactional email)
```

**Auth flow (OTP):**
1. User enters email at `/login` or `/register`
2. Supabase sends a 6-digit code to that email
3. User enters the code on the login page → `/auth/callback`
4. Callback exchanges code for session, looks up org by email domain, creates `users` record
5. Middleware refreshes session on every request, redirects unauthenticated users

**Admin auth:**
HTTP Basic Auth on all `/admin/*` and `/api/admin/*` routes, enforced in `middleware.ts`. Org approve/reject email links bypass Basic Auth via HMAC-signed time-limited tokens.

---

## Security

- OTP-only auth — no passwords stored, no magic links (abandoned due to email prefetching consuming tokens)
- HTTP Basic Auth protects `/admin` dashboard
- RLS enabled on all Supabase tables; service role key is server-only
- `sanitizeStoryHtml()` strips scripts, iframes, SVGs, event handlers, and `javascript:` URIs from feed-ingested HTML before display
- Feed URLs validated to `http/https` only (SSRF prevention)
- Auth callback `next` param validated as relative path (open redirect prevention)

---

## Planned Features (Phase 4)

### Coverage Collaboration Threads

A member org posts a collaboration proposal for a regional story angle or breaking event and invites other orgs to coordinate. Orgs opt in and claim a geography or angle. Stories uploaded and tagged to the collaboration appear together in a dedicated view.

### Weekly Network Digest Email

Optional weekly email summarizing most-republished stories, new member orgs, and recent library additions.

### Database-driven Homepage Member List

The homepage member list is currently hardcoded in `lib/member-orgs.ts`. For multi-deployment setups, it should be driven by the `organizations` table instead — approved orgs would appear automatically, and adding `website_url` and `logo_path` columns would cover links and logos. Each deployment's own database would keep the lists naturally separate without any code divergence.
