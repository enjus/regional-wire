'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/auth/landing'
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [error, setError] = useState(
    errorParam === 'missing-code' ? 'That sign-in link is invalid or has expired. Request a new one below.' : ''
  )
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // emailRedirectTo is used as the post-verification destination when
        // the user clicks the magic link (after the /auth/confirm step).
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    })

    if (authError) {
      setError('Could not send sign-in link. Please try again.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setVerifying(true)
    setError('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'email',
    })

    if (verifyError) {
      setError('Invalid or expired code. Check your email and try again.')
      setVerifying(false)
      return
    }

    // Session is now set client-side; hand off to callback for user setup
    window.location.href = `/auth/callback?next=${encodeURIComponent(redirect)}`
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">✉</div>
          <h1 className="font-serif text-2xl font-bold text-wire-navy mb-2">
            Check your email
          </h1>
          <p className="text-wire-slate text-sm leading-relaxed">
            We&apos;ve sent a sign-in link to <strong>{email}</strong>.
            Click it, or enter the code below.
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-wire-navy mb-1">
              Sign-in code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-wire-border rounded px-3 py-2 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
              placeholder="000000"
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={verifying || otp.length < 6}
            className="w-full bg-wire-navy text-white py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors disabled:opacity-50"
          >
            {verifying ? 'Verifying…' : 'Verify code'}
          </button>
        </form>

        <button
          onClick={() => { setSent(false); setOtp(''); setError('') }}
          className="mt-4 w-full text-center text-sm text-wire-slate hover:text-wire-navy"
        >
          ← Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-3xl font-bold text-wire-navy mb-1">
        Sign in
      </h1>
      <p className="text-wire-slate text-sm mb-8">
        Member newsrooms only. We'll email you a sign-in link.{' '}
        <Link
          href="/register/organization"
          className="text-wire-red hover:underline"
        >
          Register your newsroom →
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-wire-navy mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
            placeholder="you@newsroom.com"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-wire-navy text-white py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending link…' : 'Send sign-in link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-wire-slate">
        Don't have an account?{' '}
        <Link href="/register" className="text-wire-red hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-wire-bg flex flex-col">
      <div className="border-b bg-wire-navy text-white px-6 py-4">
        <span className="font-serif text-lg font-bold tracking-tight">
          Regional Wire
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<div className="text-wire-slate text-sm">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
