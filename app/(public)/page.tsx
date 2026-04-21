import Link from 'next/link'
import { MEMBER_ORGS } from '@/lib/member-orgs'
import { brand } from '@/lib/brand'

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-wire-bg border-b border-wire-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-32">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px w-8 bg-wire-red flex-shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wire-red">
              Member Newsroom Platform
            </span>
          </div>

          <h1 className="font-serif text-[clamp(2.75rem,6vw,5rem)] font-bold text-wire-navy leading-[1.06] mb-8">
            Regional journalism is<br className="hidden sm:block" />
            {' '}stronger together.
          </h1>

          <p className="text-lg text-wire-slate max-w-xl mb-10 leading-relaxed">
            {brand.name} is a closed content-sharing platform for member newsrooms.
            Upload stories, browse the shared library, and republish with full
            attribution — all without the back-and-forth.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 bg-wire-red text-white px-6 py-3.5 rounded text-sm font-medium hover:bg-wire-red-dark transition-colors"
            >
              How it works
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
                <path d="M3.75 8a.75.75 0 01.75-.75h6.19L8.22 4.78a.75.75 0 011.06-1.06l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 11-1.06-1.06L11.25 9.5H4.5A.75.75 0 013.75 8z" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-wire-border bg-white text-wire-navy px-6 py-3.5 rounded text-sm font-medium hover:border-wire-navy/25 transition-colors"
            >
              Member sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Benefits strip ───────────────────────────────────────────── */}
      <div className="bg-wire-navy text-white border-b border-white/5">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px] text-white/55 sm:justify-start justify-center">
            {[
              'Free content sharing',
              'Story-level embargo control',
              'Full attribution preserved',
              'RSS feed ingestion',
              'Email digest alerts',
            ].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" className="text-white/30 flex-shrink-0" aria-hidden>
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-wire-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px w-8 bg-wire-red flex-shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wire-slate/70">
              How it works
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-10 sm:gap-14">
            {[
              {
                n: '01',
                title: 'Upload',
                body: 'Editors share stories using the built-in editor or by connecting an RSS feed. Set embargo dates, add bylines, and attach downloadable image assets.',
              },
              {
                n: '02',
                title: 'Browse',
                body: 'Member newsrooms browse the shared library, filter by organization, and request stories. Set alerts to be notified when member orgs publish.',
              },
              {
                n: '03',
                title: 'Republish',
                body: 'One click copies a formatted package — headline, byline, sanitized body, and attribution link — ready to paste directly into your CMS.',
              },
            ].map((step) => (
              <div key={step.n} className="group">
                <div className="font-serif text-[3.5rem] font-bold text-wire-border leading-none mb-5 group-hover:text-wire-red/15 transition-colors select-none">
                  {step.n}
                </div>
                <h3 className="font-serif text-xl font-bold text-wire-navy mb-3">{step.title}</h3>
                <p className="text-sm text-wire-slate leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-wire-border">
            <Link href="/how-it-works" className="text-sm font-medium text-wire-red hover:underline">
              Read the full walkthrough →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Member logos ─────────────────────────────────────────────── */}
      <section className="bg-wire-bg border-b border-wire-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px w-8 bg-wire-red flex-shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wire-slate/70">
              Member newsrooms
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-wire-navy mb-10">
            Our member newsrooms.
          </h2>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-8">
            {MEMBER_ORGS.map((org) => (
              <div
                key={org.initials}
                title={org.name}
                className="aspect-square bg-white rounded-lg border border-wire-border flex items-center justify-center hover:border-wire-navy/15 hover:shadow-sm transition-all"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: org.color }}
                >
                  {org.initials}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-wire-slate">
            <Link href="/members" className="text-wire-red hover:underline">
              See all member newsrooms →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-wire-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px w-8 bg-wire-red flex-shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wire-slate/70">
              Who it&apos;s for
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-wire-navy mb-10">
            Built for the regional<br />journalism ecosystem.
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Regional newspapers',
                desc: 'Daily and weekly papers sharing local coverage to reach audiences beyond their immediate market.',
              },
              {
                title: 'Nonprofit newsrooms',
                desc: 'Mission-driven organizations covering underrepresented communities and distributing their work more broadly.',
              },
              {
                title: 'University news organizations',
                desc: 'Student journalism programs sharing campus and local community coverage with professional outlets.',
              },
              {
                title: 'Broadcast with digital',
                desc: 'Local TV and radio stations with online news operations contributing to and drawing from the wire.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-wire-border rounded-lg p-5 bg-wire-bg hover:border-wire-navy/15 transition-colors"
              >
                <h3 className="font-semibold text-wire-navy text-sm mb-1.5">{item.title}</h3>
                <p className="text-sm text-wire-slate leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── On republication ─────────────────────────────────────────── */}
      <section className="bg-wire-bg border-b border-wire-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
          <div className="border-l-2 border-wire-red pl-6 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-red mb-3">
              On republication
            </p>
            <p className="text-wire-navy text-base leading-relaxed">
              Republishing via {brand.name} means publishing an original story on your own
              platform with full attribution — including the original author&apos;s byline and a
              link back to the canonical source. Member organizations are responsible for
              their own editorial decisions about what they republish. {brand.name} does not
              modify story content and holds no copyright over shared material.
            </p>
          </div>
        </div>
      </section>

      {/* ── Docs CTA ─────────────────────────────────────────────────── */}
      <section className="bg-wire-navy text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-serif text-2xl font-bold mb-2">
              Read the documentation.
            </h2>
            <p className="text-white/50 text-sm max-w-sm leading-relaxed">
              Learn how story sharing works, what to expect as a member, and how the
              platform handles attribution and republication.
            </p>
          </div>
          <Link
            href="/docs"
            className="flex-shrink-0 border border-white/25 text-white px-6 py-3 rounded text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Browse documentation →
          </Link>
        </div>
      </section>
    </>
  )
}
