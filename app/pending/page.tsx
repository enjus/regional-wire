'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { brand } from '@/lib/brand'

export default function PendingPage() {
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-wire-bg flex flex-col">
      <div className="border-b bg-wire-navy text-white px-6 py-4">
        <Link href="/" className="font-serif text-lg font-bold tracking-tight">
          {brand.name}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="font-serif text-2xl font-bold text-wire-navy mb-3">
            Approval pending
          </h1>
          <p className="text-wire-slate text-sm leading-relaxed mb-2">
            Your account is awaiting approval by your organization&apos;s admin.
          </p>
          <p className="text-wire-slate text-sm leading-relaxed mb-8">
            You&apos;ll receive an email once your account has been approved.
          </p>
          <button
            onClick={handleSignOut}
            className="text-sm text-wire-red hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
