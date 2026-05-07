'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  displayName: string
  orgName: string
  variant?: 'dark' | 'light'
}

export default function NavbarClient({ displayName, orgName, variant = 'dark' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-sm transition-colors ${
          variant === 'light'
            ? 'text-wire-slate hover:text-wire-navy'
            : 'text-white/80 hover:text-white'
        }`}
      >
        <span className="hidden sm:block">{orgName}</span>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          variant === 'light'
            ? 'bg-wire-navy/10 text-wire-navy'
            : 'bg-white/20 text-white'
        }`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded shadow-lg border border-wire-border z-40 text-wire-navy">
            <div className="px-4 py-3 border-b border-wire-border">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-wire-slate mt-0.5">{orgName}</p>
            </div>
            <div className="py-1">
              <Link
                href="/wire/dashboard"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-wire-bg transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/wire/dashboard/stories/new"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-wire-bg transition-colors"
              >
                Upload story
              </Link>
              <Link
                href="/wire/library"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-wire-bg transition-colors"
              >
                Library
              </Link>
              <Link
                href="/wire/dashboard/settings"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-wire-bg transition-colors"
              >
                Settings
              </Link>
              <hr className="my-1 border-wire-border" />
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-wire-slate hover:bg-wire-bg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
