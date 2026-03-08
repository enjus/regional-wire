# Regional Wire

A content-sharing platform for regional news organizations. Member newsrooms share stories for republication, generating clean packages with embedded SEO attribution instructions.

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account

### 1. Clone and install

```bash
git clone <repo-url>
cd regional-wire
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

See **Environment Variables** below for details.

### 3. Supabase setup

#### Schema

Run the migration in your Supabase project's SQL Editor:

```
supabase/migrations/001_schema.sql
```

This creates all tables, indexes, RLS policies, and helper functions.

Then run this additional statement to add the author column (not yet in the migration file):

```sql
ALTER TABLE feed_headlines ADD COLUMN IF NOT EXISTS author text;
```

#### Storage bucket

In Supabase → Storage, create a bucket named `story-assets`:
- **Public:** Yes (so asset URLs are accessible in republication packages)
- **Allowed MIME types:** `image/*,video/*`
- **Max upload size:** 524288000 (500MB)

Set storage policies:
- **INSERT:** Authenticated users only
- **SELECT:** Public (anyone with the URL)

#### Auth settings

In Supabase → Authentication → URL Configuration:
- Set **Site URL** to `http://localhost:3000`
- Add **Redirect URLs:**
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/update-password`

For local development, enable **Auto-confirm email** in Auth → Providers → Email (so you don't need to click confirmation emails during testing).

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
| `ADMIN_USERNAME` | Username for HTTP basic auth on `/admin` |
| `ADMIN_PASSWORD` | Password for HTTP basic auth on `/admin` |
| `NEXT_PUBLIC_APP_URL` | Full URL of your deployment, no trailing slash (e.g. `https://regionalwire.com`) |
| `ALERT_DIGEST_HOUR` | UTC hour (0–23) for daily digest emails, default `7` |
| `CRON_SECRET` | Secret token Vercel Cron sends as `Authorization: Bearer <token>` |

---

## Vercel Deployment

1. Push to GitHub (or GitLab/Bitbucket).
2. Import the repo in Vercel.
3. Set all environment variables under **Project Settings → Environment Variables**.
4. Deploy. Vercel will detect `vercel.json` and configure the cron jobs automatically.
5. In Supabase → Auth → URL Configuration, add your Vercel production URL:
   - Site URL: `https://your-deployment.vercel.app`
   - Redirect URLs:
     - `https://your-deployment.vercel.app/auth/callback`
     - `https://your-deployment.vercel.app/auth/update-password`

---

## AWS Migration Guide

The app is built to be AWS-portable. Only Vercel Cron is a Vercel-specific dependency.

### Deploying the Next.js app

**Option A — EC2/ECS:** Build with `npm run build`, run with `npm start`. Use an Application Load Balancer + Auto Scaling Group or ECS Fargate.

**Option B — AWS App Runner:** Connect your GitHub repo; App Runner handles builds and scaling with zero infrastructure config.

**Option C — Lambda + API Gateway via SST or Serverless Framework:** Adapters exist to run Next.js on Lambda, but large file uploads (500MB video) require careful configuration of API Gateway payload limits.

### Replacing Vercel Cron

The cron jobs are plain HTTP GET endpoints:
- `/api/cron/poll-feeds` — run every 15 minutes
- `/api/cron/alert-digest` — run every hour (checks `ALERT_DIGEST_HOUR` internally)

**Replacement steps:**

1. Create an **AWS EventBridge rule** with a schedule expression:
   - Feed polling: `rate(15 minutes)`
   - Alert digest: `rate(1 hour)`

2. Create a **Lambda function** for each rule. The handler issues an authenticated HTTP request to the Next.js endpoint:

```javascript
// lambda/poll-feeds.js
const https = require('https')

exports.handler = async () => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: process.env.APP_HOSTNAME, // e.g. 'regionalwire.com'
        path: '/api/cron/poll-feeds',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      },
      (res) => {
        let body = ''
        res.on('data', (d) => (body += d))
        res.on('end', () => resolve({ statusCode: res.statusCode, body }))
      }
    )
    req.on('error', reject)
    req.end()
  })
}
```

3. Set Lambda environment variables: `APP_HOSTNAME`, `CRON_SECRET`.

4. In the EventBridge rule, set the Lambda function as the target.

Alternatively, move the feed polling logic into the Lambda directly — import `rss-parser` and the Supabase service client, replicate the logic from `app/api/cron/poll-feeds/route.ts`. This avoids an HTTP hop but requires maintaining the logic in two places.

### Environment variables on AWS

Store all secrets in **AWS Secrets Manager** or **Systems Manager Parameter Store**. Reference them in ECS task definitions or Lambda environment variables.

---

## Architecture Overview

```
User browser
  ↕ HTTPS
Next.js App Router (Vercel / AWS)
  ↕ Supabase JS SDK (@supabase/ssr)
Supabase (auth + Postgres + Storage)
  ↕ Service role key (server-only)
Resend (transactional email)
```

**Auth flow:**
1. User signs up at `/register` → `POST /api/auth/register` checks email domain
2. Supabase sends confirmation email → user clicks → `/auth/callback` creates `users` record
3. Middleware refreshes session on every request, redirects unauthenticated users

**Admin auth:**
HTTP Basic Auth on all `/admin/*` and `/api/admin/*` routes, enforced in `middleware.ts`.

---

## Planned Features (Phase 4)

### Coverage Collaboration Threads

A member org posts a collaboration proposal for a regional story angle or breaking event and invites other orgs to coordinate. Orgs opt in and claim a geography or angle. Stories uploaded and tagged to the collaboration appear together in a dedicated view. Any member can pull republication packages from any contribution. Useful for regionwide breaking news (protests, disasters, elections) where multiple orgs cover the same story from different locations.

### Weekly Network Digest Email

Optional weekly email summarizing: most-republished stories, new member orgs, active collaboration threads, and recent library additions. Helps keep the network visible to editors who don't log in regularly.

---

## Security Notes

- **Admin dashboard** uses HTTP Basic Auth. Before production, replace with a proper role-based auth system (e.g., Supabase admin role + protected routes).
- **Row Level Security** is enabled on all Supabase tables. Service role key is used server-side only and never exposed to the client.
- **Contact emails** are visible only to authenticated, approved members.
- **Original URL** is required for all stories and is used to generate an SEO-optimized attribution link included in every republication package.
