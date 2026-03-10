import Link from 'next/link'
import type { Metadata } from 'next'
import { MEMBER_ORGS } from '@/lib/member-orgs'

export const metadata: Metadata = {
  title: 'Member newsrooms — Regional Wire',
  description: 'Regional Wire member newsrooms — approved regional newspapers, nonprofit newsrooms, and digital outlets sharing stories across the network.',
}

export default function MembersPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-wire-bg border-b border-wire-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-8 bg-wire-red flex-shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wire-red">Network</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-wire-navy mb-5">
            Member newsrooms
          </h1>
          <p className="text-lg text-wire-slate leading-relaxed max-w-2xl">
            Regional Wire members are approved regional newsrooms that share and republish
            stories across the network. Membership is by application and subject to
            editorial review.
          </p>
        </div>
      </div>

      {/* Member grid */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-14">
          {MEMBER_ORGS.map((org) => (
            <div
              key={org.initials}
              className="bg-white border border-wire-border rounded-lg p-5 flex items-center gap-4 hover:border-wire-navy/15 hover:shadow-sm transition-all"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: org.color }}
              >
                {org.initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-wire-navy text-sm leading-snug">{org.name}</p>
                <p className="text-xs text-wire-slate mt-0.5">{org.type}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Apply CTA */}
        <div className="border border-dashed border-wire-border rounded-xl p-10 text-center bg-wire-bg">
          <div className="w-12 h-12 rounded-full bg-wire-red/8 flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-wire-red" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v11m-5.5-5.5h11" />
            </svg>
          </div>
          <h3 className="font-serif text-xl font-bold text-wire-navy mb-2">
            Is your newsroom a good fit?
          </h3>
          <p className="text-sm text-wire-slate mb-6 max-w-sm mx-auto leading-relaxed">
            Regional Wire welcomes applications from regional newspapers, nonprofit newsrooms,
            university news organizations, and local broadcast outlets with digital operations.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/register/organization"
              className="inline-flex items-center gap-2 bg-wire-red text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-wire-red-dark transition-colors"
            >
              Apply to join the network →
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center border border-wire-border text-wire-navy px-5 py-2.5 rounded text-sm font-medium hover:border-wire-navy/20 bg-white transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
