import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `RSS feed ingestion — ${brand.name} Help`,
}

export default function FeedsPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">For publishers</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">RSS feed ingestion</h1>
        <p className="text-wire-slate">Auto-ingesting stories from your CMS feed every 15 minutes.</p>
      </div>

      <h2>Overview</h2>
      <p>
        Instead of manually uploading each story, you can connect one or more RSS or Atom
        feeds to {brand.name}. The platform polls your feeds every 15 minutes and
        automatically adds new items to the library. This is the preferred setup for
        newsrooms with a high story volume or an existing CMS publishing workflow.
      </p>

      <h2>Adding a feed</h2>
      <p>
        Go to <strong>Dashboard → Settings → Feeds</strong> (admin only). Click
        <strong> Add feed</strong> and enter your feed&apos;s URL. {brand.name} supports
        RSS 2.0 and Atom 1.0 formats.
      </p>
      <p>
        You can add multiple feeds — for example, a section-specific feed alongside your
        main site feed.
      </p>

      <h2>Full-text vs. headline-only feeds</h2>
      <p>
        {brand.name} handles feeds differently depending on whether they include full story
        content:
      </p>
      <ul>
        <li>
          <strong>Full-text feeds</strong> — Items with a full <code>&lt;content:encoded&gt;</code> or
          <code> &lt;description&gt;</code> body are added as complete stories to the library,
          ready for republication.
        </li>
        <li>
          <strong>Headline-only feeds</strong> — Items without body content are added to
          the <strong>Headlines</strong> tab in the library. Other member newsrooms can
          request the full story through the <Link href="/wire/docs/requests">requests workflow</Link>.
        </li>
      </ul>

      <h2>Deduplication</h2>
      <p>
        {brand.name} deduplicates feed items using the item&apos;s <code>guid</code> field
        (or the item URL if no <code>guid</code> is present). If an item has already been
        ingested, it will not be added again on subsequent polls — even if the feed content
        has changed.
      </p>
      <p>
        To update an ingested story, edit it manually from your dashboard.
      </p>

      <h2>Embargo handling</h2>
      <p>
        Feed items with a future <code>pubDate</code> are ingested as embargoed stories.
        They will not appear in the library until their publication date is reached. The
        wire checks for lifted embargoes on the same 15-minute polling schedule.
      </p>

      <h2>Author attribution</h2>
      <p>
        {brand.name} reads the <code>dc:creator</code> field from feed items for author
        attribution. If present, it is used as the byline in the story and copy package.
        If absent, the byline is left blank and should be edited manually after ingestion.
      </p>

      <h2>Managing feeds</h2>
      <p>
        You can edit or delete feeds from <strong>Dashboard → Settings → Feeds</strong>.
        Deleting a feed stops future polling but does not remove stories that have already
        been ingested.
      </p>

      <h2>See also</h2>
      <ul>
        <li><Link href="/wire/docs/uploading-stories">Uploading stories</Link> — Manual upload as an alternative to feeds</li>
        <li><Link href="/wire/docs/requests">Story requests</Link> — How headline-only items can be fulfilled</li>
      </ul>
    </article>
  )
}
