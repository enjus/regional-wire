import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Story requests — ${brand.name} Help`,
}

export default function RequestsPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">For editors</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">Story requests</h1>
        <p className="text-wire-slate">Requesting unpublished or headline-only stories from other newsrooms.</p>
      </div>

      <h2>What are story requests?</h2>
      <p>
        Some member newsrooms connect RSS feeds that publish headlines only, without full
        story text. These appear in the library&apos;s <strong>Headlines</strong> tab. If
        you&apos;d like to republish one of these stories, you can send a request to the
        originating newsroom.
      </p>
      <p>
        The originating newsroom can then fulfill the request by uploading the full story
        body, or decline it. You&apos;ll receive an email notification either way.
      </p>

      <h2>Sending a request</h2>
      <p>
        From the <strong>Headlines</strong> tab in the library, find the story you&apos;re
        interested in and click <strong>Request story</strong>. You can optionally include
        a note to the originating newsroom explaining your interest or intended use.
      </p>
      <p>
        Requests are visible to the originating newsroom in their dashboard under
        <strong> Requests → Incoming</strong>.
      </p>

      <h2>Tracking your outgoing requests</h2>
      <p>
        View the status of requests you&apos;ve sent from <strong>Dashboard → Requests →
        Outgoing</strong>. Statuses are:
      </p>
      <ul>
        <li><strong>Pending</strong> — Awaiting a response from the originating newsroom.</li>
        <li><strong>Fulfilled</strong> — The story has been added to the library and is ready to republish.</li>
        <li><strong>Declined</strong> — The originating newsroom chose not to share the full story.</li>
      </ul>

      <h2>Fulfilling an incoming request (for publishers)</h2>
      <p>
        When another newsroom requests one of your headline-only stories, you&apos;ll see
        it in <strong>Dashboard → Requests → Incoming</strong>. You can:
      </p>
      <ul>
        <li>
          <strong>Fulfill</strong> — Upload the full story body. Once fulfilled, the story
          appears in the library and the requesting newsroom is notified.
        </li>
        <li>
          <strong>Decline</strong> — If you can&apos;t or don&apos;t want to share the
          full text, decline the request. The requesting newsroom is notified by email.
        </li>
      </ul>
      <p>
        Incoming requests that need attention are flagged with a badge count in your
        dashboard navigation.
      </p>

      <h2>See also</h2>
      <ul>
        <li><Link href="/wire/docs/republishing">Republishing stories</Link> — Copy package and logging workflow</li>
        <li><Link href="/wire/docs/feeds">RSS feed ingestion</Link> — How headline-only items enter the library</li>
      </ul>
    </article>
  )
}
