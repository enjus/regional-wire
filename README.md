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

Run the migration in your Supabase project's SQL Editor:

```
supabase/migrations/001_schema.sql
```

Then run these additional statements (post-migration additions not yet in the file):

```sql
ALTER TABLE feed_headlines ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS republication_guidance TEXT;
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

Auth uses **magic link (OTP) only** — no passwords.

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
| `ALERT_DIGEST_HOUR` | UTC hour (0–23) for daily digest emails, default `7` |
| `CRON_SECRET` | Secret token sent as `Authorization: Bearer <token>` to cron endpoints |

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
0 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://nwnewswire.com/api/cron/alert-digest
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

**Auth flow (magic link):**
1. User enters email at `/login` or `/register`
2. Supabase sends OTP email → user clicks link → `/auth/callback`
3. Callback exchanges code for session, looks up org by email domain, creates `users` record
4. Middleware refreshes session on every request, redirects unauthenticated users

**Admin auth:**
HTTP Basic Auth on all `/admin/*` and `/api/admin/*` routes, enforced in `middleware.ts`. Org approve/reject email links bypass Basic Auth via HMAC-signed time-limited tokens.

---

## Security

- Magic link auth only — no passwords stored
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
