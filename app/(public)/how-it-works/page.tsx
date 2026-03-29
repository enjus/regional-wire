import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How it works — Regional Wire',
  description: 'A step-by-step walkthrough of the Regional Wire platform: from organization approval to uploading, browsing, and republishing stories.',
}

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-wire-bg border-b border-wire-border">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-8 bg-wire-red flex-shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wire-red">Platform overview</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-wire-navy mb-5">
            How Regional Wire works
          </h1>
          <p className="text-lg text-wire-slate leading-relaxed max-w-2xl">
            Regional Wire is built around a simple exchange: member newsrooms share their
            stories, and other members republish them with full attribution. Here&apos;s
            how that works in practice.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="space-y-0 divide-y divide-wire-border">

          {/* Step 00 */}
          <div className="py-14 grid sm:grid-cols-[5rem_1fr] gap-8 items-start">
            <div className="font-serif text-[4rem] font-bold text-wire-border leading-none">00</div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-wire-navy mb-4">Organization approval</h2>
              <p className="text-wire-slate leading-relaxed mb-5">
                Regional Wire is an invite-only network. Newsrooms are approved by the
                platform administrator before anyone from the organization can sign
                in. Once approved, any staff member with a matching email domain can create
                an account.
              </p>
              <ul className="space-y-2 text-sm text-wire-slate">
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Invited newsrooms register at <Link href="/register/organization" className="text-wire-red hover:underline">/register/organization</Link> with their details and primary contact</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Approval typically takes 1–2 business days; you&apos;ll receive an email when your org is approved</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Once approved, staff sign up at <Link href="/register" className="text-wire-red hover:underline">/register</Link> using their work email address</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>The first user from your organization is automatically designated admin and can manage feeds, alerts, and settings</span></li>
              </ul>
            </div>
          </div>

          {/* Step 01 */}
          <div className="py-14 grid sm:grid-cols-[5rem_1fr] gap-8 items-start">
            <div className="font-serif text-[4rem] font-bold text-wire-border leading-none">01</div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-wire-navy mb-4">Upload stories to the wire</h2>
              <p className="text-wire-slate leading-relaxed mb-5">
                Editors contribute stories using the built-in rich-text editor. Each story
                includes a headline, byline, canonical URL, and optional embargo date.
                Stories can also enter the wire automatically via RSS or Atom feed ingestion —
                useful if your CMS already publishes a feed.
              </p>
              <ul className="space-y-2 text-sm text-wire-slate">
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Write or paste story content in the editor; format with headings, lists, and blockquotes</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Set an embargo date to hold a story until its planned publication time</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Attach downloadable image assets separately — images are stripped from the copy package but available for download</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Or connect your RSS/Atom feed in Settings; the wire polls every 15 minutes and deduplicates automatically</span></li>
              </ul>
            </div>
          </div>

          {/* Step 02 */}
          <div className="py-14 grid sm:grid-cols-[5rem_1fr] gap-8 items-start">
            <div className="font-serif text-[4rem] font-bold text-wire-border leading-none">02</div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-wire-navy mb-4">Browse the shared library</h2>
              <p className="text-wire-slate leading-relaxed mb-5">
                All member newsrooms can browse the full story library. Filter by
                organization, search by keyword, or switch between full stories and
                headline-only feeds. Story alerts let you receive email digests when
                specific member organizations publish new content.
              </p>
              <ul className="space-y-2 text-sm text-wire-slate">
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>The library shows all non-embargoed stories from all member organizations</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Filter by publishing organization to focus on specific sources</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Headline-only items (from feeds without full text) can be requested — the publisher decides whether to share the full body</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Set per-organization story alerts to receive a digest email at your configured hour</span></li>
              </ul>
            </div>
          </div>

          {/* Step 03 */}
          <div className="py-14 grid sm:grid-cols-[5rem_1fr] gap-8 items-start">
            <div className="font-serif text-[4rem] font-bold text-wire-border leading-none">03</div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-wire-navy mb-4">Republish with one click</h2>
              <p className="text-wire-slate leading-relaxed mb-5">
                On any story detail page, the <strong className="text-wire-navy">Copy Package</strong> button
                copies a fully formatted republication package to your clipboard as both
                HTML and plain text. Paste it directly into your CMS. Logging your
                republication notifies the originating newsroom and keeps the network
                activity log accurate.
              </p>
              <ul className="space-y-2 text-sm text-wire-slate">
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>The package includes: headline, byline, sanitized body HTML, and an attribution line with a canonical link</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Images, scripts, and embeds are stripped from the package for safety; download images separately</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Optionally enter the URL where you published the story so the originating newsroom can see it</span></li>
                <li className="flex gap-3"><span className="text-wire-red font-bold flex-shrink-0">→</span><span>Republication logs appear in both newsrooms&apos; dashboards</span></li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-wire-border bg-wire-bg">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-wire-navy mb-1">Already a member?</h3>
            <p className="text-sm text-wire-slate">Sign in to access the story library and your dashboard.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="bg-wire-red text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-wire-red-dark transition-colors">
              Sign in →
            </Link>
            <Link href="/docs" className="border border-wire-border bg-white text-wire-navy px-5 py-2.5 rounded text-sm font-medium hover:border-wire-navy/20 transition-colors">
              Read the docs
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
