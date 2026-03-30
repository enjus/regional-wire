import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation — Regional Wire',
  description: 'How Regional Wire works: applying for membership, onboarding your newsroom, and what to expect.',
}

export default function DocsIndexPage() {
  return (
    <div>
      <div className="mb-10 pb-8 border-b border-wire-border">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-px w-8 bg-wire-red flex-shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wire-red">Documentation</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-wire-navy mb-4">
          Regional Wire docs
        </h1>
        <p className="text-wire-slate leading-relaxed max-w-lg">
          Everything you need to get your newsroom approved and onboarded. Full
          platform documentation is available to members after sign-in.
        </p>
      </div>

      <div className="space-y-2">
        <Link
          href="/docs/getting-started"
          className="group flex items-start gap-4 p-4 rounded-lg border border-wire-border bg-white hover:border-wire-navy/15 hover:shadow-sm transition-all"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-wire-navy text-sm group-hover:text-wire-red transition-colors">
              Quick start guide
            </p>
            <p className="text-xs text-wire-slate mt-0.5 leading-relaxed">
              From application to your first story on the wire — eligibility, approval, and account setup.
            </p>
          </div>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" className="text-wire-border group-hover:text-wire-red transition-colors flex-shrink-0 mt-0.5" aria-hidden>
            <path d="M3.75 8a.75.75 0 01.75-.75h6.19L8.22 4.78a.75.75 0 011.06-1.06l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 11-1.06-1.06L11.25 9.5H4.5A.75.75 0 013.75 8z" />
          </svg>
        </Link>
      </div>

      <div className="mt-12 pt-8 border-t border-wire-border">
        <p className="text-sm text-wire-slate">
          Already a member?{' '}
          <Link href="/login" className="text-wire-red hover:underline font-medium">
            Sign in for full documentation →
          </Link>
        </p>
      </div>
    </div>
  )
}
