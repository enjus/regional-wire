'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { brand } from '@/lib/brand'

function RegisterForm() {
  const searchParams = useSearchParams()
  const initialError = searchParams.get('error')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(
    initialError === 'no-org'
      ? 'Your email domain is not associated with a member organization. Register your newsroom first.'
      : ''
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
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
    window.location.href = '/auth/callback'
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">✉</div>
          <h1 className="font-serif text-2xl font-bold text-wire-navy mb-2">
            Check your email
          </h1>
          <p className="text-wire-slate text-sm leading-relaxed">
            We&apos;ve sent a 6-digit code to <strong>{email}</strong>.
            Enter it below to complete your registration.
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
              className="w-full border border-wire-border rounded px-3 py-2 text-base text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
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
          onClick={() => { setSuccess(false); setOtp(''); setError('') }}
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
        Create account
      </h1>
      <p className="text-wire-slate text-sm mb-8">
        Your email must match a member newsroom&apos;s domain.{' '}
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
            Full name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
            placeholder="Jane Smith"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-wire-navy mb-1">
            Work email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
            placeholder="you@newsroom.com"
            autoComplete="email"
          />
        </div>

        {error && (
          <div className="text-sm bg-amber-50 border border-amber-200 rounded px-3 py-2">
            <p className="text-amber-800">{error}</p>
            {error.includes('not associated') && (
              <div className="mt-2 flex flex-col gap-1">
                <Link
                  href="/register/organization"
                  className="text-wire-red hover:underline font-medium"
                >
                  Register your newsroom →
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/auth/signout', { method: 'POST' })
                    window.location.href = '/login'
                  }}
                  className="text-wire-slate hover:text-wire-navy text-left"
                >
                  Sign out and use a different email →
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-wire-navy text-white py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending code…' : 'Continue with email'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-wire-slate">
        Already have an account?{' '}
        <Link href="/login" className="text-wire-red hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-wire-bg flex flex-col">
      <div className="border-b bg-wire-navy text-white px-6 py-4">
        <Link href="/" className="font-serif text-lg font-bold tracking-tight">
          {brand.name}
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<div className="text-wire-slate text-sm">Loading…</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
