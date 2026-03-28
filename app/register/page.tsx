'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

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

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-4">✉</div>
        <h1 className="font-serif text-2xl font-bold text-wire-navy mb-3">
          Check your email
        </h1>
        <p className="text-wire-slate text-sm leading-relaxed">
          We've sent a sign-in link to <strong>{email}</strong>. Click it
          to complete your registration and access your dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-3xl font-bold text-wire-navy mb-1">
        Create account
      </h1>
      <p className="text-wire-slate text-sm mb-8">
        Your email must match a member newsroom's domain.{' '}
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
            className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
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
            className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
            placeholder="you@newsroom.com"
            autoComplete="email"
          />
        </div>

        {error && (
          <div className="text-sm bg-amber-50 border border-amber-200 rounded px-3 py-2">
            <p className="text-amber-800">{error}</p>
            {error.includes('not associated') && (
              <Link
                href="/register/organization"
                className="text-wire-red hover:underline block mt-1 font-medium"
              >
                Register your newsroom →
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-wire-navy text-white py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending link…' : 'Continue with email'}
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
          Regional Wire
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
