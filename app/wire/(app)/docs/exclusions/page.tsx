import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Publisher exclusions — ${brand.name} Help`,
}

export default function ExclusionsPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">For publishers</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">Publisher exclusions</h1>
        <p className="text-wire-slate">Hiding content from specific member organizations.</p>
      </div>

      <h2>What are exclusions?</h2>
      <p>
        Exclusions let your organization opt out of a content-sharing relationship with a
        specific member publisher. When you exclude another organization, their stories no
        longer appear in your library — and your stories no longer appear in theirs.
      </p>
      <p>
        Exclusions are <strong>mutual and automatic</strong>. You do not need the other
        organization&apos;s approval to create an exclusion, and they are not notified. Both
        sides&apos; libraries are affected immediately.
      </p>

      <h2>Setting up an exclusion</h2>
      <p>
        Go to <strong>Dashboard → Settings → Exclusions</strong> (org admin only). Select
        a publisher from the dropdown and click <strong>Exclude organization</strong>. A
        confirmation step will remind you that the exclusion applies in both directions
        before it takes effect.
      </p>

      <h2>Removing an exclusion</h2>
      <p>
        Only the organization that created the exclusion can remove it. If your organization
        initiated the exclusion, you&apos;ll see a <strong>Remove</strong> button next to the
        entry on the Exclusions settings page. If another organization excluded you, the
        entry will appear in your list as informational — you&apos;ll need to contact that
        organization to request removal.
      </p>

      <h2>What exclusions affect</h2>
      <ul>
        <li>Stories in the main library grid</li>
        <li>The headline feed tab</li>
        <li>The organization filter dropdown in the library</li>
        <li>Direct story URLs — excluded organizations cannot access each other&apos;s story detail pages</li>
      </ul>

      <h2>What exclusions do not affect</h2>
      <ul>
        <li>Story alerts and email digests — alerts already configured for an excluded organization will continue to fire</li>
        <li>Republication history — past republications remain in the activity log</li>
        <li>Story requests already in progress</li>
      </ul>
    </article>
  )
}
