import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Story alerts — ${brand.name} Help`,
}

export default function AlertsPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">For publishers</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">Story alerts</h1>
        <p className="text-wire-slate">Email notifications when member organizations publish new content.</p>
      </div>

      <h2>What are story alerts?</h2>
      <p>
        Story alerts notify you by email when specific member organizations publish new
        stories to the wire. Instead of checking the library manually, you&apos;ll be
        notified automatically when sources you care about have new content available.
      </p>
      <p>
        There are two types of alerts: <strong>hourly alerts</strong> for near-real-time
        notification, and an optional <strong>daily digest</strong> delivered at a time
        you choose.
      </p>

      <h2>Hourly alerts</h2>
      <p>
        Hourly alerts fire within about an hour of a new story being published by an
        organization you&apos;ve enabled alerts for. All new stories from your alerted
        organizations since the last send are bundled into a single email — you won&apos;t
        receive one email per story.
      </p>
      <p>
        To set up hourly alerts, go to <strong>Dashboard → Settings → Alerts</strong>
        (org admin only) and toggle alerts on for the organizations you want to follow.
        Alerts are configured per organization, not per story.
      </p>

      <h2>Daily digest</h2>
      <p>
        The daily digest is a separate opt-in email summarizing up to 10 recent stories
        from across the wire, sorted by how widely they&apos;ve been republished. It&apos;s
        useful if you prefer a single morning briefing over near-real-time alerts.
      </p>
      <p>
        Each user configures their own digest preferences — including whether to receive
        it and what UTC hour to receive it — from their personal account settings. The
        daily digest and hourly alerts operate independently; you can use either or both.
      </p>

      <h2>When alerts fire</h2>
      <p>
        Hourly alerts are triggered when:
      </p>
      <ul>
        <li>A new story is manually uploaded by a member organization you&apos;ve alerted</li>
        <li>A new story enters the library via feed ingestion from that organization</li>
        <li>An embargoed story from that organization lifts (becomes publicly visible)</li>
      </ul>
      <p>
        Alerts do <strong>not</strong> fire for headline-only feed items — only for stories
        with full body content that are ready to republish.
      </p>

      <h2>Managing alerts</h2>
      <p>
        You can enable or disable hourly alerts for any member organization at any time
        from <strong>Dashboard → Settings → Alerts</strong>. Changes take effect
        immediately for the next digest cycle.
      </p>

      <h2>See also</h2>
      <ul>
        <li><Link href="/wire/docs/republishing">Republishing stories</Link> — What to do once an alert brings you to a story</li>
        <li><Link href="/wire/docs/feeds">RSS feed ingestion</Link> — How stories enter the library from feeds</li>
      </ul>
    </article>
  )
}
