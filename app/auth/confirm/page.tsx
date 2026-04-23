'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { brand } from '@/lib/brand'

function ConfirmContent() {
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const isValid =
    typeof tokenHash === 'string' && tokenHash.length > 0 &&
    typeof type === 'string' && type.length > 0

  const callbackUrl = isValid
    ? `/auth/callback?token_hash=${encodeURIComponent(tokenHash!)}&type=${encodeURIComponent(type!)}`
    : null

  if (!callbackUrl) {
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

  return (
    <div className="w-full max-w-sm text-center">
      <div className="text-4xl mb-4">✉</div>
      <h1 className="font-serif text-2xl font-bold text-wire-navy mb-3">
        Confirm your sign-in
      </h1>
      <p className="text-wire-slate text-sm leading-relaxed mb-6">
        Click the button below to complete signing in to {brand.name}.
      </p>
      <button
        onClick={() => { window.location.href = callbackUrl }}
        className="bg-wire-navy text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors cursor-pointer"
      >
        Sign in to {brand.name}
      </button>
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
          {brand.name}
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
