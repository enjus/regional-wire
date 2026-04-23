import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Republishing stories — ${brand.name} Help`,
}

export default function RepublishingPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">For editors</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">Republishing stories</h1>
        <p className="text-wire-slate">Using the library, copying the republication package, and logging where you published.</p>
      </div>

      <h2>Finding stories to republish</h2>
      <p>
        The story library shows all non-embargoed content shared by member newsrooms.
        You can filter the library by publishing organization, or use the search field
        to find stories by keyword.
      </p>
      <p>
        The library has two tabs:
      </p>
      <ul>
        <li>
          <strong>Stories</strong> — Full stories with body content, ready to copy and republish.
        </li>
        <li>
          <strong>Headlines</strong> — Headline-only items ingested from member feeds where
          full text wasn&apos;t available. These can be <Link href="/wire/docs/requests">requested</Link> from
          the originating newsroom.
        </li>
      </ul>
      <p>
        You can also set up <Link href="/wire/docs/alerts">story alerts</Link> to receive email
        digests when specific member organizations publish new content.
      </p>

      <h2>The Copy Package button</h2>
      <p>
        On any story detail page, click <strong>Copy Package</strong> to copy the
        republication package to your clipboard. The package is copied in two formats
        simultaneously:
      </p>
      <ul>
        <li>
          <strong>HTML</strong> — Formatted for pasting into a rich-text or HTML editor.
          Includes an <code>&lt;h1&gt;</code> headline, italic byline, sanitized body,
          and an attribution paragraph.
        </li>
        <li>
          <strong>Plain text</strong> — For plain-text editors or email systems.
        </li>
      </ul>

      <h3>What&apos;s included in the package</h3>
      <ul>
        <li>The story headline</li>
        <li>The author byline (formatted as <em>By [Name]</em>) — this is the required author credit; do not remove it</li>
        <li>The story body — sanitized to remove scripts, embeds, iframes, and images</li>
        <li>
          An attribution line: <em>This story originally appeared in [Publication] and is
          republished with permission. <a href="#">[Story title]</a></em> — with the title
          linking to the canonical URL. This is the required publisher credit; do not remove it.
        </li>
      </ul>
      <p>
        Republication requires crediting <strong>both</strong> the original author (via the byline)
        and the original publisher (via the attribution line). Both are included in the package
        and must be preserved as published.
      </p>

      <h2>Images</h2>
      <p>
        Images are <strong>not</strong> included in the copy package. This is intentional —
        each newsroom should add images through their own CMS workflow to ensure proper
        sizing, licensing, and hosting.
      </p>
      <p>
        If the originating newsroom has uploaded image assets, you can download them from
        the story detail page using the asset download links.
      </p>

      <h2>Logging a republication</h2>
      <p>
        After publishing a republished story on your site, return to the story detail page
        and enter the URL where you published it. This is optional but encouraged — it
        notifies the originating newsroom and appears in both organizations&apos; activity
        logs.
      </p>
      <p>
        Republication logs help the network understand how widely stories are being
        distributed and give originating newsrooms visibility into their content&apos;s reach.
      </p>

      <h2>Editorial responsibility</h2>
      <p>
        Member organizations are responsible for their own editorial decisions about
        which stories they republish. Republishing a story means accepting responsibility
        for publishing it on your platform, including any legal or editorial obligations
        that entails.
      </p>
      <p>
        {brand.name} does not modify story content. The sanitization process strips
        potentially unsafe HTML (scripts, embeds) but does not alter text content.
      </p>

      <h2>See also</h2>
      <ul>
        <li><Link href="/wire/docs/requests">Story requests</Link> — Request a full story from a headline-only item</li>
        <li><Link href="/wire/docs/alerts">Story alerts</Link> — Get notified when member orgs publish</li>
      </ul>
    </article>
  )
}
