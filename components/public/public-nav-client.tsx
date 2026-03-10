'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PublicNavClient() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="sm:hidden p-1 text-wire-navy"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-wire-border shadow-md z-40">
            <div className="px-5 py-4 flex flex-col gap-1">
              <Link href="/how-it-works" className="py-2 text-sm text-wire-slate hover:text-wire-navy transition-colors" onClick={() => setOpen(false)}>How it works</Link>
              <Link href="/members" className="py-2 text-sm text-wire-slate hover:text-wire-navy transition-colors" onClick={() => setOpen(false)}>Members</Link>
              <Link href="/docs" className="py-2 text-sm text-wire-slate hover:text-wire-navy transition-colors" onClick={() => setOpen(false)}>Documentation</Link>
              <div className="border-t border-wire-border mt-2 pt-3 flex flex-col gap-1">
                <Link href="/login" className="py-2 text-sm text-wire-slate hover:text-wire-navy transition-colors" onClick={() => setOpen(false)}>Sign in</Link>
                <Link href="/register/organization" className="py-2 text-sm font-medium text-wire-red" onClick={() => setOpen(false)}>Join the network →</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
