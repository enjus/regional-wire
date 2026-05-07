import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Correcting and withdrawing stories — ${brand.name} Help`,
}

export default function CorrectionsPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">For publishers</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">Correcting and withdrawing stories</h1>
        <p className="text-wire-slate">How to issue corrections, note minor updates and remove stories from the library.</p>
      </div>

      <h2>Types of changes</h2>
      <p>
        When you edit a story, you are asked to classify the change. There are three options:
      </p>
      <ul>
        <li>
          <strong>Update</strong> — A minor revision: added detail, a reworded sentence,
          a formatting fix. No notification is sent. An optional change note can be left
          for member newsrooms viewing the story — it appears on the story detail page
          but is not emailed.
        </li>
        <li>
          <strong>Correction</strong> — An error of fact: a wrong name, incorrect figure,
          misattribution or similar. Requires a correction statement written in publication-ready
          language. The correction statement is emailed to every newsroom that has logged
          a republication of the story and displayed prominently on the story detail page.
        </li>
        <li>
          <strong>Withdrawal</strong> — The story is removed from the library entirely.
          Requires a reason. All newsrooms that have logged a republication are notified
          by email. The story remains in your dashboard but is no longer visible to other members.
        </li>
      </ul>

      <h2>Issuing a correction</h2>
      <p>
        Navigate to the story from your dashboard and click <strong>Edit</strong>. Under
        the change classification section, select <strong>Correction</strong> and enter the
        correction text. Write it as you would a published correction — in full sentences,
        stating what was wrong and what the correct information is. Example:
      </p>
      <blockquote>
        <em>
          An earlier version of this story incorrectly stated the vote was 4–3.
          The vote was 5–2. The story has been updated.
        </em>
      </blockquote>
      <p>
        When you save, the correction is immediately added to the story detail page and
        an email is sent to all newsrooms that have logged republications. Multiple corrections
        stack on the story detail page, newest first.
      </p>

      <h2>Withdrawing a story</h2>
      <p>
        Navigate to the story detail page and click <strong>Withdraw</strong>. You will be
        prompted to enter a reason — this is included in the notification email sent to
        republishing newsrooms. Once withdrawn, the story is removed from the library
        immediately.
      </p>
      <p>
        Withdrawal notifications are a courtesy to newsrooms that have already republished.
        If you need a newsroom to take down a republished story, contact them directly —
        the platform does not have the ability to remove content from other newsrooms&apos; sites.
      </p>

      <h2>What republishing newsrooms receive</h2>
      <p>
        Newsrooms that have logged a republication URL will receive an email when a correction
        or withdrawal is issued. The email includes:
      </p>
      <ul>
        <li>The story headline and originating newsroom</li>
        <li>The type of change (correction or withdrawal)</li>
        <li>The correction text or withdrawal reason</li>
        <li>A link back to the story detail page</li>
      </ul>
      <p>
        Newsrooms that republished but did not log a URL will not receive the notification.
        This is another reason to encourage republishing members to log their published URLs.
      </p>

      <h2>Timing</h2>
      <p>
        Stories are automatically removed from the library 90 days after publication. Corrections
        and withdrawal notifications can only be issued while the story still exists in the
        platform. If a story has aged out, you will need to contact republishing newsrooms
        directly.
      </p>

      <h2>See also</h2>
      <ul>
        <li><Link href="/wire/docs/uploading-stories">Uploading stories</Link> — The full upload and edit workflow, including story retention</li>
        <li><Link href="/wire/docs/republishing">Republishing stories</Link> — How to log a republication URL</li>
      </ul>
    </article>
  )
}
