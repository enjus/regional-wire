# AWS Migration Guide

This guide covers migrating Regional Wire from a DigitalOcean droplet to AWS, replacing Resend with AWS SES for email, and replacing the crontab-based cron jobs with EventBridge. Supabase can remain as a managed service (no changes required) or be self-hosted on AWS — see the appendix at the end of this guide.

---

## Architecture After Migration

```
User browser
  ↕ HTTPS
AWS App Runner  (Next.js app)
  ↕ Supabase JS SDK
Supabase  (auth + Postgres + Storage)
  ↕ AWS SDK
AWS SES  (transactional email)

AWS EventBridge Scheduler
  → AWS Lambda  (triggers cron endpoints every 15 min / 1 hour)
```

**What changes:**
- App hosting: DigitalOcean droplet → AWS App Runner
- Email: Resend → AWS SES
- Cron jobs: crontab → EventBridge + Lambda
- Secrets: `.env` → AWS Systems Manager Parameter Store

**What stays the same:**
- Supabase (auth, Postgres, Storage) — no changes
- All application code — except `lib/email.ts` (SES swap)
- Domain DNS — you can keep your existing registrar and just point to App Runner

---

## Step 1: Prerequisites

1. An AWS account with billing configured
2. AWS CLI installed and configured: `aws configure`
3. Your domain's DNS management access (Route 53 or your existing registrar)
4. The GitHub repository at `github.com/enjus/regional-wire`

Install the AWS CLI if needed:
```bash
# macOS
brew install awscli

# Windows
winget install Amazon.AWSCLI
```

Configure it:
```bash
aws configure
# Enter: Access Key ID, Secret Access Key, region (e.g. us-east-1), output format (json)
```

---

## Step 2: Set Up AWS SES for Email

This replaces Resend. SES requires domain verification and a one-time request to leave the sandbox before you can send to arbitrary recipients.

### 2a. Verify your sending domain

In the AWS Console → **SES → Verified identities → Create identity**:

1. Select **Domain**
2. Enter your domain (e.g. `regionalwire.com`)
3. Enable **Easy DKIM** (RSA 2048-bit)
4. Click **Create identity**

AWS will display DNS records to add:
- **3 DKIM CNAME records** — required for deliverability
- **1 DMARC TXT record** — recommended

Add these to your DNS provider. Verification usually takes a few minutes.

### 2b. Verify a sending email address

In SES → Verified identities → Create identity:

1. Select **Email address**
2. Enter the address you want to send from (e.g. `noreply@regionalwire.com`)
3. Click the confirmation link that arrives in your inbox

### 2c. Request production access (leave the sandbox)

By default, SES is in sandbox mode — you can only send to verified addresses. You must request production access before launch.

In SES → **Account dashboard → Request production access**:

- Select **Transactional** email type
- Describe the use case: "Transactional notifications for a private content-sharing platform for regional newsrooms. Emails include signup confirmations, story alerts, and republication request notifications."
- Estimated daily volume: start low (e.g. 500/day)
- Submit the request

AWS typically responds within 24 hours.

### 2d. Update the application to use SES

Install the AWS SES v2 SDK:
```bash
npm install @aws-sdk/client-sesv2
```

Replace `lib/email.ts` with the following (same interface, SES backend):

```typescript
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { Organization } from './types'

let _ses: SESv2Client | null = null
function getSES(): SESv2Client {
  if (!_ses) {
    _ses = new SESv2Client({ region: process.env.AWS_SES_REGION ?? 'us-east-1' })
  }
  return _ses
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const FROM_ADDRESS = 'Regional Wire <noreply@regionalwire.com>'

async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string | string[]
  subject: string
  text: string
}) {
  const toAddresses = Array.isArray(to) ? to : [to]
  const command = new SendEmailCommand({
    FromEmailAddress: FROM_ADDRESS,
    Destination: { ToAddresses: toAddresses },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Text: { Data: text, Charset: 'UTF-8' } },
      },
    },
  })
  return getSES().send(command)
}
```

Then replace every `getResend().emails.send({ from, to, subject, text })` call with `sendEmail({ to, subject, text })`. The `from` field is now hardcoded in `sendEmail`, so remove it from each call site.

The full updated `lib/email.ts` after the swap: every exported function body changes only its final `return` statement from:
```typescript
return getResend().emails.send({ from: FROM_ADDRESS, to, subject, text })
```
to:
```typescript
return sendEmail({ to, subject, text })
```

### 2e. SES credentials for the app

The App Runner service (Step 3) will use an IAM role, so no access keys are needed in environment variables for SES — the SDK picks up credentials automatically from the instance role.

Add one environment variable:
```
AWS_SES_REGION=us-east-1   # or whichever region you verified the domain in
```

For local development, the SDK will use your `aws configure` credentials automatically. No changes needed for local dev.

---

## Step 3: Deploy the App with AWS App Runner

App Runner is the simplest deployment path: connect your GitHub repo, and App Runner builds and runs the container automatically with zero infrastructure to manage.

### 3a. Create an ECR-based or source-based service

In the AWS Console → **App Runner → Create service**:

1. **Source:** Select **Source code repository**
2. **Connect to GitHub:** Authorize AWS App Runner and select `enjus/regional-wire`
3. **Branch:** `main`
4. **Deployment trigger:** Automatic (redeploys on every push to `main`)

### 3b. Configure the build

App Runner will detect Node.js. Set:

- **Runtime:** Node.js 22 (or 20; Node.js 18 is deprecated)
- **Build command:** `npm ci && npm run build`
- **Start command:** `npm start`
- **Port:** `3000`

### 3c. Configure the service

- **CPU:** 1 vCPU (upgrade if needed)
- **Memory:** 2 GB
- **Auto scaling:** Minimum 1 instance, maximum as needed

### 3d. Attach an IAM role for SES

App Runner needs permission to send email via SES.

1. In IAM → **Roles → Create role**
2. Trusted entity: **App Runner**
3. Attach policy: **AmazonSESFullAccess** (or a narrower custom policy — see below)
4. Name it: `regional-wire-apprunner-role`

Narrower SES policy (recommended):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": "*"
    }
  ]
}
```

Back in App Runner → your service → **Configuration → Security → Instance role**: attach `regional-wire-apprunner-role`.

### 3e. Add environment variables

In App Runner → your service → **Configuration → Environment variables**, add all variables from `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PLATFORM_ADMIN_EMAIL
ADMIN_USERNAME
ADMIN_PASSWORD
NEXT_PUBLIC_APP_URL          # your production domain, e.g. https://regionalwire.com
ALERT_DIGEST_HOUR
CRON_SECRET                  # generate a random string: openssl rand -hex 32
AWS_SES_REGION               # e.g. us-east-1
```

`RESEND_API_KEY` is no longer needed after the SES migration.

**Recommended:** Store secrets in AWS Systems Manager Parameter Store instead of plain environment variables (see Step 5).

### 3f. Deploy

Click **Create and deploy**. App Runner will pull the source, build it, and start the service. The first deploy takes 3–5 minutes.

App Runner provides an HTTPS URL like `https://abc123.us-east-1.awsapprunner.com`. You can use this directly or map a custom domain (Step 4).

---

## Step 4: Custom Domain and HTTPS

App Runner handles TLS automatically for custom domains.

### 4a. Add the domain in App Runner

In your App Runner service → **Custom domains → Add domain**:

1. Enter your domain: `regionalwire.com` (and optionally `www.regionalwire.com`)
2. App Runner will display **CNAME records** to add to your DNS

### 4b. Add DNS records

In your DNS provider (Route 53 or your registrar), add the CNAME records App Runner provides. If using Route 53:

1. Hosted zones → your domain → **Create record**
2. Record type: CNAME
3. Value: the App Runner domain shown in the console

TLS provisioning completes within a few minutes of DNS propagation.

### 4c. Update Supabase auth redirect URLs

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://regionalwire.com`
- **Redirect URLs:** add
  - `https://regionalwire.com/auth/callback`
  - `https://regionalwire.com/auth/update-password`

---

## Step 5: Secrets Management with Parameter Store (Recommended)

Rather than pasting secrets as plain text in App Runner's environment variable UI, store them in AWS Systems Manager Parameter Store and reference them by name.

### 5a. Store each secret

```bash
aws ssm put-parameter \
  --name "/regional-wire/SUPABASE_SERVICE_ROLE_KEY" \
  --value "your-secret-key" \
  --type SecureString \
  --region us-east-1
```

Repeat for each secret: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` (if keeping Resend), `ADMIN_PASSWORD`, `CRON_SECRET`.

Non-sensitive values (`NEXT_PUBLIC_SUPABASE_URL`, `ALERT_DIGEST_HOUR`, etc.) can remain as plain environment variables in App Runner.

### 5b. Grant App Runner access to Parameter Store

Add this policy to the `regional-wire-apprunner-role` IAM role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:us-east-1:YOUR_ACCOUNT_ID:parameter/regional-wire/*"
    },
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "arn:aws:kms:us-east-1:YOUR_ACCOUNT_ID:key/YOUR_KMS_KEY_ID"
    }
  ]
}
```

### 5c. Reference parameters in App Runner

In App Runner → Environment variables, instead of pasting the value directly, choose **Parameter Store** as the source and enter the parameter name (e.g. `/regional-wire/SUPABASE_SERVICE_ROLE_KEY`). App Runner fetches and injects the value at runtime.

---

## Step 6: Replace crontab with EventBridge + Lambda

The two cron jobs are plain HTTP GET endpoints protected by `Authorization: Bearer {CRON_SECRET}`. Currently they're triggered via crontab on the DigitalOcean droplet. On AWS, EventBridge Scheduler triggers a Lambda function on a schedule, and the Lambda calls the endpoint.

### 6a. Create the Lambda function

In the AWS Console → **Lambda → Create function**:

- **Runtime:** Node.js 20.x
- **Name:** `regional-wire-cron`

Paste this as the function code:

```javascript
const https = require('https')

exports.handler = async (event) => {
  const path = event.path  // passed from EventBridge
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: process.env.APP_HOSTNAME,
        path,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      },
      (res) => {
        let body = ''
        res.on('data', (d) => (body += d))
        res.on('end', () => {
          console.log(`${path} → ${res.statusCode}: ${body}`)
          resolve({ statusCode: res.statusCode, body })
        })
      }
    )
    req.on('error', reject)
    req.end()
  })
}
```

**Environment variables** on the Lambda:
```
APP_HOSTNAME   regionalwire.com
CRON_SECRET    (same value as in the app)
```

### 6b. Create EventBridge schedules

In **EventBridge → Schedules → Create schedule**, create two schedules:

**Poll feeds (every 15 minutes):**
- Schedule expression: `rate(15 minutes)`
- Target: Lambda function `regional-wire-cron`
- Input (constant JSON): `{ "path": "/api/cron/poll-feeds" }`

**Alert digest (hourly):**
- Schedule expression: `rate(1 hour)`
- Target: Lambda function `regional-wire-cron`
- Input (constant JSON): `{ "path": "/api/cron/alert-digest" }`

### 6c. Grant EventBridge permission to invoke Lambda

EventBridge needs permission to call the Lambda. When creating the schedule, AWS will offer to create an execution role automatically — accept this. Or manually add a resource-based policy:

```bash
aws lambda add-permission \
  --function-name regional-wire-cron \
  --statement-id eventbridge-poll-feeds \
  --action lambda:InvokeFunction \
  --principal scheduler.amazonaws.com
```

---

## Step 7: Update Supabase Auth for Production

If you haven't already:

1. In Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://regionalwire.com`
   - Redirect URLs: `https://regionalwire.com/auth/callback`, `https://regionalwire.com/auth/update-password`

2. In Supabase → **Authentication → Providers → Email**:
   - Disable **Auto-confirm email** (was enabled for local dev)
   - Ensure Supabase's own SMTP or your SES SMTP relay is configured for confirmation emails

**Supabase auth emails via SES (optional):**

Supabase sends its own confirmation and password reset emails. By default it uses its built-in mailer. To send these through SES instead:

1. In SES, create SMTP credentials: **SES → SMTP settings → Create SMTP credentials**
2. In Supabase → **Project Settings → Auth → SMTP Settings**, enable custom SMTP and enter:
   - Host: `email-smtp.us-east-1.amazonaws.com` (or your region)
   - Port: `587`
   - Username/Password: the SMTP credentials from step 1
   - Sender email: `noreply@regionalwire.com`

---

## Step 8: CI/CD with GitHub Actions (Optional)

App Runner's automatic deployment from GitHub is sufficient for most cases. If you need more control (run tests, lint before deploy), add a GitHub Actions workflow:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: https://regionalwire.com
```

Store secrets in GitHub → repository **Settings → Secrets and variables → Actions**.

App Runner's GitHub integration handles the actual deployment trigger — this workflow just gates on lint and build passing first.

---

---

## Appendix: Self-Hosting Supabase on AWS

If you need everything running within your own AWS account — for compliance, data residency, or cost control at scale — you can self-host Supabase on EC2. The application code and Supabase SDK require **no changes**; only environment variables differ.

Supabase self-hosting uses Docker Compose and bundles PostgreSQL, the PostgREST API, GoTrue auth, Kong API gateway, and the Storage API. For production, you replace the bundled PostgreSQL with RDS and the bundled storage with S3.

### Architecture (self-hosted)

```
User browser
  ↕ HTTPS
AWS App Runner  (Next.js app)
  ↕ Supabase JS SDK (same as before)
EC2 instance  (Supabase Docker stack)
  ├── GoTrue  (auth)
  ├── PostgREST  (database API)
  ├── Kong  (API gateway, port 8000/8443)
  └── Storage API  → S3 bucket (replaces Supabase Storage)
       ↕
RDS PostgreSQL  (replaces bundled Postgres)

ALB  (HTTPS termination for Supabase endpoints)
ACM  (TLS certificate)
```

---

### A. Launch an EC2 Instance

In the AWS Console → **EC2 → Launch instance**:

- **AMI:** Ubuntu 24.04 LTS
- **Instance type:** `t3.medium` minimum (2 vCPU, 4 GB RAM); `t3.large` recommended for production
- **Storage:** 30 GB gp3 (more if you store files locally; use S3 to avoid this)
- **Security group:** open ports 22 (SSH, restrict to your IP), 80, 443, and 8000 (Supabase Kong — restrict to App Runner's IP range or VPC)
- **Key pair:** create or select one for SSH access

Allocate an **Elastic IP** and associate it with the instance so the address doesn't change on restart.

---

### B. Set Up RDS PostgreSQL

Supabase requires PostgreSQL 15.

In **RDS → Create database**:

- **Engine:** PostgreSQL 15
- **Template:** Production (Multi-AZ for high availability) or Dev/Test
- **Instance class:** `db.t3.micro` for small networks, `db.t3.small` for production
- **Storage:** 20 GB gp3, autoscaling enabled
- **VPC:** same VPC as your EC2 instance
- **Security group:** allow port 5432 from the EC2 instance's security group only
- **Initial database name:** `postgres`
- Note the **endpoint hostname**, **username**, and **password**

---

### C. Set Up S3 for Storage

Supabase's self-hosted Storage API supports S3 as a backend, replacing its local filesystem.

1. In **S3 → Create bucket**:
   - Name: `regional-wire-assets`
   - Region: same as your EC2 instance
   - **Block all public access:** off (story assets must be publicly readable via URL)

2. Add a bucket policy for public read:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::regional-wire-assets/*"
    }
  ]
}
```

3. Create an **IAM user** for Supabase Storage with `AmazonS3FullAccess` on `regional-wire-assets` only. Note the access key and secret.

---

### D. Install Docker on EC2

SSH into the instance:
```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

Install Docker:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker
```

---

### E. Configure Supabase

Clone the Supabase Docker setup:
```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

Edit `.env` with your values. Key variables to set:

```bash
# Secrets — generate with: openssl rand -hex 32
POSTGRES_PASSWORD=your-strong-password
JWT_SECRET=your-jwt-secret-min-32-chars
ANON_KEY=          # generated from JWT_SECRET — see below
SERVICE_ROLE_KEY=  # generated from JWT_SECRET — see below

# Point to RDS instead of bundled Postgres
POSTGRES_HOST=your-rds-endpoint.rds.amazonaws.com
POSTGRES_DB=postgres
POSTGRES_PORT=5432

# Your Supabase instance's public URL (set after you configure the ALB)
SITE_URL=https://supabase.regionalwire.com
API_EXTERNAL_URL=https://supabase.regionalwire.com

# S3 storage backend
STORAGE_BACKEND=s3
GLOBAL_S3_BUCKET=regional-wire-assets
REGION=us-east-1
AWS_ACCESS_KEY_ID=your-iam-access-key
AWS_SECRET_ACCESS_KEY=your-iam-secret-key

# SMTP for auth emails (use SES SMTP credentials from Step 2e)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_SENDER_NAME=Regional Wire
```

**Generating ANON_KEY and SERVICE_ROLE_KEY:**

These are JWTs signed with `JWT_SECRET`. Use the Supabase CLI:
```bash
npm install -g supabase
supabase init  # creates a local project
# Then generate keys:
supabase gen keys --jwt-secret your-jwt-secret
```

Or use the generator at `supabase.com/docs/guides/self-hosting/docker#generate-api-keys` (paste your JWT_SECRET and copy the output).

---

### F. Start Supabase

```bash
docker compose up -d
```

Verify all containers are running:
```bash
docker compose ps
```

You should see: `supabase-kong`, `supabase-auth`, `supabase-rest`, `supabase-storage`, `supabase-db` (or pointing to RDS), and others all as `healthy`.

Supabase Studio (the dashboard) runs on port 3000 of the EC2 instance. Access it temporarily via `http://YOUR_ELASTIC_IP:3000` to verify the setup and run your migration SQL.

---

### G. Run the Database Migration

In Supabase Studio → **SQL Editor**, run the migrations in order:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_story_changes.sql
```

Then run the post-migration column additions:
```sql
ALTER TABLE feed_headlines ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS republication_guidance TEXT;
```

---

### H. Expose Supabase via HTTPS (ALB + ACM)

Kong listens on port 8000 (HTTP) and 8443 (HTTPS). For production, put it behind an Application Load Balancer.

1. **ACM:** Request a certificate for `supabase.regionalwire.com` in **Certificate Manager**. Validate via DNS.

2. **ALB:** Create an Application Load Balancer:
   - Listeners: 443 (HTTPS) → forward to target group on port 8000
   - Target group: your EC2 instance
   - SSL certificate: the ACM certificate above

3. **DNS:** Add a CNAME record `supabase.regionalwire.com` → your ALB DNS name.

4. Update `.env` on the EC2 instance:
   ```
   SITE_URL=https://supabase.regionalwire.com
   API_EXTERNAL_URL=https://supabase.regionalwire.com
   ```
   Then restart: `docker compose restart`

---

### I. Update App Environment Variables

In App Runner, update the Supabase environment variables to point to your self-hosted instance:

```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.regionalwire.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-generated-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-generated-service-role-key
```

No application code changes are needed. The Supabase JS SDK works identically against self-hosted and managed instances.

---

### Self-Hosted Cost Estimate

| Service | Estimated monthly cost |
|---|---|
| EC2 `t3.medium` (Supabase stack) | ~$30 |
| RDS `db.t3.small` PostgreSQL | ~$25 |
| S3 storage (first 5 GB) | < $1 |
| ALB | ~$16 |
| Data transfer | ~$1–5 |
| **Total (Supabase self-hosted)** | **~$75–80/month** |

Compare to managed Supabase Pro at $25/month. Self-hosting makes economic sense at higher scale (many GB of storage, high connection counts) or when data residency requirements rule out managed services.

---

### Self-Hosted Maintenance Considerations

- **Updates:** Pull new Supabase Docker images periodically (`docker compose pull && docker compose up -d`). Check the Supabase changelog for breaking changes before upgrading.
- **Backups:** Enable automated RDS snapshots (daily, 7-day retention minimum). Supabase's managed service handles this automatically; self-hosting makes it your responsibility.
- **Monitoring:** Add CloudWatch alarms on EC2 CPU/memory and RDS connections. Consider enabling RDS Performance Insights.
- **High availability:** For production, run the EC2 Supabase stack with an Auto Scaling Group (min 1) behind the ALB, and use RDS Multi-AZ. This adds ~$25–30/month but provides automatic failover.

---

## Post-Migration Checklist

- [ ] SES domain verified (check DKIM CNAME records are propagated)
- [ ] SES production access granted (out of sandbox)
- [ ] `lib/email.ts` updated to use SES SDK, `@aws-sdk/client-sesv2` installed
- [ ] App Runner service deployed and healthy
- [ ] Custom domain added to App Runner and DNS CNAME records added
- [ ] All environment variables set in App Runner (or Parameter Store)
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Supabase auth redirect URLs updated to production domain
- [ ] Supabase email auto-confirm disabled
- [ ] EventBridge schedules created for both cron endpoints
- [ ] Lambda function deployed and environment variables set
- [ ] Test: register a new account and confirm email arrives
- [ ] Test: upload a story and verify it appears in the library
- [ ] Test: edit a story with a correction and confirm republisher notification emails are sent
- [ ] Test: withdraw a story and confirm republisher notification emails are sent
- [ ] Test: trigger `/api/cron/poll-feeds` manually and confirm feed ingestion
- [ ] Test: magic link sign-in flow end-to-end

---

## Cost Estimate

All figures are approximate and depend on traffic.

| Service | Estimated monthly cost |
|---|---|
| App Runner (1 vCPU / 2 GB, low traffic) | ~$20–40 |
| SES (first 62,000 emails/month free from EC2/App Runner) | $0–5 |
| EventBridge Scheduler (2 rules, ~4,500 invocations/month) | < $1 |
| Lambda (minimal compute) | < $1 |
| Parameter Store (standard parameters) | Free |
| **Total** | **~$25–50/month** |

Supabase free tier covers the database for development and small production workloads. The Pro plan ($25/month) is recommended for production (higher connection limits, daily backups, no pausing).
