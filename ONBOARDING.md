# Regional Wire — Member Onboarding Guide

Welcome to Regional Wire. This guide walks your team through getting set up, sharing stories with the network, and republishing stories from other member newsrooms.

---

## Step 1: Get Your Team Signed Up

1. **Your newsroom has been approved.** Every staff member with a `@yourdomain.com` email address can create an account.

2. **Share the signup link:** `https://regionalwire.com/register`

3. **The first person to sign up** from your domain is automatically granted admin access. Admins manage org settings, feeds, incoming requests, and contact emails.

4. **Subsequent signups** receive editor access by default.

---

## Step 2: Configure Your Settings

Before sharing stories, take a few minutes to set up your newsroom profile.

1. Go to **Dashboard → Settings**
2. Confirm your **contact email addresses** — these receive republication requests and platform notifications. Add multiple addresses if more than one person should be notified.
3. Optionally add a **website URL** if not already set.

---

## Step 3: Decide How You'll Share Stories

You have two options for getting your stories into the Regional Wire library. Most newsrooms will use both.

---

### Option A: Manual Upload

Any editor can upload a story directly:

1. Go to **Dashboard → Upload Story**
2. Paste or type the story headline, byline, original URL, and body
3. Attach photos or video if applicable
4. Click **Publish to library**

The story is immediately available to all member newsrooms. Use manual upload for breaking news, one-off shares, or stories that don't fit neatly into a tag-based feed.

---

### Option B: Automated Feed (Recommended for Regular Sharing)

Connect an RSS feed to share stories automatically. Regional Wire polls your feed every 15 minutes and adds new stories to the library as they appear.

**There are two feed types:**

| Feed type | What it does |
|---|---|
| **Full-text feed** | Shares the complete story body. Regional Wire members can copy and republish immediately. |
| **Headline feed** | Shares titles and summaries only. Members can see your headlines and request the full text. |

---

#### Setting Up Your Feed

Go to **Dashboard → Settings → Feeds** and add your feed URL.

**Important:** The feed you connect to Regional Wire should contain **only stories you have the right to share for republication.** This typically means:

- Stories written by your own staff
- Stories for which you hold syndication rights

**Do not connect your main site RSS feed** unless every story in it is original staff work. Wire service stories, syndicated columns, content licensed from other publishers, and contributed pieces for which you do not hold resyndication rights must be excluded.

---

#### Creating a Dedicated Regional Wire Feed

The cleanest approach is to create a separate feed in your CMS that only includes eligible stories. Most CMS platforms support tag- or category-based RSS feeds. Create a tag such as `regional-wire` or `wire-eligible` and apply it only to stories you intend to share. Your CMS will generate a feed URL for that tag automatically.

**Feed URL examples by CMS:**

| CMS | Tag-based feed URL pattern |
|---|---|
| WordPress | `https://yoursite.com/tag/regional-wire/feed/` |
| Arc Publishing | `https://yoursite.com/arc/outboundfeeds/rss/?tags=regional-wire` |
| Drupal | `https://yoursite.com/taxonomy/term/{term-id}/feed` |
| Ghost | `https://yoursite.com/tag/regional-wire/rss/` |
| Chorus / Vox Media | Contact your platform team for tag-based feed configuration |
| TownNews / BLOX CMS | `https://yoursite.com/search/?f=rss&t=article&c=tag&q=regional-wire` |

If your CMS does not support tag-based feeds, consider a dedicated section or category (e.g., a "For Republication" channel) and use its feed URL instead.

---

#### Full-Text Feeds

For stories to be republished automatically, your feed must include the full story body — not just a summary or excerpt. This is sometimes called a "full content" or "full-text" feed and may need to be enabled in your CMS settings.

**Enabling full-text output by CMS:**

- **WordPress:** Install a plugin such as *Full Text RSS Feed* or use the `content:encoded` field if your theme supports it. Alternatively, the Yoast SEO plugin can be configured to output full content.
- **Arc Publishing:** Use the `body` field in your outbound feed template. Work with your Arc team to ensure `content:encoded` is populated.
- **Ghost:** Full content is included in RSS by default.
- **Drupal:** Configure the feed view to include the full body field rather than the trimmed summary.
- **WordPress.com:** Full-text feeds are available under *Settings → Reading → For each post in a feed, include → Full text*.

If your CMS cannot produce a full-text feed for a given tag, use the **Headline feed** option instead and fulfill requests manually via "Upload & Fulfill" from your requests dashboard.

---

## Step 4: Responding to Republication Requests

When a member newsroom requests one of your stories, everyone listed in your contact emails receives a notification.

From **Dashboard → Requests:**

- **If the story is already in the library:** Click **Mark fulfilled**. The requester is notified with a link to the story.
- **If the story is not yet in the library:** Click **Upload & fulfill**. This opens the upload form with the headline and original URL pre-filled. Complete the upload and the request is automatically marked fulfilled.
- **To decline:** Click **Decline** and optionally provide a reason. The requester is notified.

---

## Step 5: Republishing a Story from the Library

1. Browse the **Library** at `regionalwire.com/library`
2. Click any story to open the detail page
3. Read the **Special Instructions** callout if present — this may include photographer restrictions, embargo notes, or contact requirements from the originating newsroom
4. Review the **Republication Requirements** before proceeding
5. Click **Copy to clipboard** to copy the formatted story body, ready to paste into your CMS
6. After publishing, submit your published URL using the prompt that appears — this notifies the originating newsroom

### Republication Requirements Summary

- Include the attribution line linking back to the original story. Do not remove it.
- Headlines may be adapted for your audience but must retain the original meaning.
- Minor edits for style, updated time references, or clarification of genuine ambiguity are acceptable. Substantive changes to facts, tone, or conclusions are not.
- Preserve the original byline. Do not substitute your own staff name.
- Do not redistribute the story to third parties or other publications outside of Regional Wire.
- Submit your published URL so the originating newsroom can track where their story appeared.

---

## Story Alerts

Set up keyword alerts to be notified when a story matching your coverage interests is posted to the library.

1. Go to **Dashboard → Settings → Alerts**
2. Enter one or more keywords (e.g., `education, school board, property tax`)
3. Choose **Immediate** (notified as each story is posted) or **Daily digest** (one email per day summarizing all matches from the past 24 hours)

---

## Story Embargoes

When uploading a story, you can set an embargo date and time. Embargoed stories appear in the library with a lock on the republication package — other members can see the headline and summary but cannot access the full text until the embargo lifts. Embargoes lift automatically. You can edit or remove an embargo at any time from your dashboard.

---

## Questions?

Contact your Regional Wire platform administrator or email the address listed in your approval notification.
