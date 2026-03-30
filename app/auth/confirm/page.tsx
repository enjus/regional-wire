'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ConfirmContent() {
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const isValid =
    typeof tokenHash === 'string' && tokenHash.length > 0 &&
    typeof type === 'string' && type.length > 0

  if (!isValid) {
    return (
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
    )
  }

  const callbackUrl =
    `/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`

  return (
    <div className="w-full max-w-sm text-center">
      <div className="text-4xl mb-4">✉</div>
      <h1 className="font-serif text-2xl font-bold text-wire-navy mb-3">
        Confirm your sign-in
      </h1>
      <p className="text-wire-slate text-sm leading-relaxed mb-6">
        Click the button below to complete signing in to Regional Wire.
      </p>
      <a
        href={callbackUrl}
        className="inline-block bg-wire-navy text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors"
      >
        Sign in to Regional Wire
      </a>
      <p className="mt-6 text-xs text-wire-slate">
        Didn&apos;t request this?{' '}
        <Link href="/login" className="text-wire-red hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-wire-bg flex flex-col">
      <div className="border-b bg-wire-navy text-white px-6 py-4">
        <span className="font-serif text-lg font-bold tracking-tight">
          Regional Wire
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<div className="text-wire-slate text-sm">Loading…</div>}>
          <ConfirmContent />
        </Suspense>
      </div>
    </div>
  )
}
