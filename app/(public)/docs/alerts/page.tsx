import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Story alerts — Regional Wire Docs',
}

export default function AlertsPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">For publishers</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">Story alerts</h1>
        <p className="text-wire-slate">Receiving email digests when member organizations publish new content.</p>
      </div>

      <h2>What are story alerts?</h2>
      <p>
        Story alerts send you an email digest when specific member organizations publish
        new stories to the wire. Instead of checking the library manually, you&apos;ll be
        notified automatically when sources you care about have new content available.
      </p>

      <h2>Setting up alerts</h2>
      <p>
        Go to <strong>Dashboard → Settings → Alerts</strong> (admin only). You&apos;ll see
        a list of all member organizations. Toggle alerts on for any organizations whose
        new content you want to be notified about.
      </p>
      <p>
        Alerts are configured per organization, not per story. You&apos;ll receive a
        single digest email covering all new stories from that organization since the last
        digest was sent.
      </p>

      <h2>Digest timing</h2>
      <p>
        Alert digests are sent hourly, at the hour configured by the platform
        administrator (<code>ALERT_DIGEST_HOUR</code>, default 7 a.m.). If no new stories
        have been published by any of your alerted organizations, no digest is sent.
      </p>
      <p>
        The digest email includes the headline, byline, and a direct link to each new
        story in the library.
      </p>

      <h2>When alerts fire</h2>
      <p>
        Alerts are triggered when:
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
        You can enable or disable alerts for any member organization at any time from the
        Alerts settings page. Changes take effect immediately for the next digest cycle.
      </p>

      <h2>See also</h2>
      <ul>
        <li><Link href="/docs/republishing">Republishing stories</Link> — What to do once an alert brings you to a story</li>
        <li><Link href="/docs/feeds">RSS feed ingestion</Link> — How stories enter the library from feeds</li>
      </ul>
    </article>
  )
}
