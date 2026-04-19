'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ConfirmPage() {
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const isValid =
      hash.length > 0 &&
      supabaseUrl.length > 0 &&
      hash.startsWith(supabaseUrl + '/auth/v1/verify')
    setConfirmationUrl(isValid ? hash : null)
    setChecked(true)
  }, [supabaseUrl])

  if (!checked) {
    return (
      <div className="min-h-screen bg-wire-bg flex flex-col">
        <div className="border-b bg-wire-navy text-white px-6 py-4">
          <span className="font-serif text-lg font-bold tracking-tight">Regional Wire</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-wire-slate text-sm">Loading…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wire-bg flex flex-col">
      <div className="border-b bg-wire-navy text-white px-6 py-4">
        <span className="font-serif text-lg font-bold tracking-tight">Regional Wire</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        {confirmationUrl ? (
          <div className="w-full max-w-sm text-center">
            <div className="text-4xl mb-4">✉</div>
            <h1 className="font-serif text-2xl font-bold text-wire-navy mb-3">
              Confirm your sign-in
            </h1>
            <p className="text-wire-slate text-sm leading-relaxed mb-6">
              Click the button below to complete signing in to Regional Wire.
            </p>
            <button
              onClick={() => { window.location.href = confirmationUrl }}
              className="bg-wire-navy text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors cursor-pointer"
            >
              Sign in to Regional Wire
            </button>
            <p className="mt-6 text-xs text-wire-slate">
              Didn&apos;t request this?{' '}
              <Link href="/login" className="text-wire-red hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-sm text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="font-serif text-2xl font-bold text-wire-navy mb-3">
              Invalid sign-in link
            </h1>
            <p className="text-wire-slate text-sm leading-relaxed mb-6">
              This link is missing or malformed. Please request a new sign-in link.
            </p>
            <Link
              href="/login"
              className="inline-block bg-wire-navy text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
