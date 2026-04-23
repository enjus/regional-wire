import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Uploading stories — ${brand.name} Help`,
}

export default function UploadingStoriesPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">For publishers</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">Uploading stories</h1>
        <p className="text-wire-slate">The manual upload workflow: editor, metadata, embargoes, and assets.</p>
      </div>

      <h2>Overview</h2>
      <p>
        Stories can enter the {brand.name} library in two ways: manual upload via the
        editor, or automatic ingestion via an RSS/Atom feed. This page covers manual
        upload. For feed ingestion, see <Link href="/wire/docs/feeds">RSS feed ingestion</Link>.
      </p>

      <h2>Creating a story</h2>
      <p>
        Navigate to <strong>Dashboard → Upload story</strong> (or use the link in the
        navigation menu). The upload form has two sections: story metadata and body content.
      </p>

      <h3>Metadata fields</h3>
      <ul>
        <li>
          <strong>Headline</strong> — The story&apos;s title. This appears in the library
          and is included in the republication package as an <code>&lt;h1&gt;</code>.
        </li>
        <li>
          <strong>Byline</strong> — The author&apos;s name as it should appear in print
          (e.g. <em>Jane Smith</em>). Included in the copy package.
        </li>
        <li>
          <strong>Canonical URL</strong> — The URL where the story is published on your
          site. This becomes the attribution link in the copy package.
        </li>
        <li>
          <strong>Embargo date</strong> — Optional. If set, the story will not appear in
          the library until this date and time. Embargoed stories are visible only to your
          own organization until they lift.
        </li>
      </ul>

      <h3>Body content</h3>
      <p>
        The body editor supports rich text: headings (H2/H3), paragraphs, bold, italic,
        links, bulleted and numbered lists, and blockquotes. Images are not embeddable in
        the body — upload them as separate downloadable assets instead.
      </p>
      <p>
        You can paste content from a word processor or CMS. Formatting is preserved where
        supported. Scripts, iframes, and embeds are stripped on paste and on display.
      </p>

      <h2>Uploading image assets</h2>
      <p>
        Attach images and other files to a story using the asset upload section on the
        story detail page. Uploaded assets are available for download by any member
        newsroom viewing the story — they are not included in the clipboard copy package,
        which is intentional (each newsroom should add images through their own CMS
        workflow to ensure proper sizing and licensing).
      </p>

      <h2>Editing and withdrawing stories</h2>
      <p>
        Stories can be edited at any time from your dashboard. Navigate to the story and
        use the <strong>Edit</strong> button. Changes take effect immediately in the library.
      </p>
      <p>
        To remove a story from the library, use the <strong>Withdraw</strong> button on the
        story detail page. Withdrawn stories are removed from the public library but remain
        in your dashboard&apos;s story list. Republications that have already been logged
        are not affected.
      </p>

      <h2>Embargo behavior</h2>
      <p>
        Embargoed stories are hidden from other member newsrooms until the embargo lifts.
        Your own organization can see them in your dashboard at any time. The wire checks
        for lifted embargoes every 15 minutes — the same schedule as feed polling. When an
        embargo lifts, any member organizations with alerts configured for your org will
        receive a notification in their next digest.
      </p>

      <h2>See also</h2>
      <ul>
        <li><Link href="/wire/docs/feeds">RSS feed ingestion</Link> — Automate story uploads from your CMS</li>
        <li><Link href="/wire/docs/alerts">Story alerts</Link> — Let other newsrooms know when you publish</li>
      </ul>
    </article>
  )
}
