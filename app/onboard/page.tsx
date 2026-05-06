'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { brand } from '@/lib/brand'

export default function OnboardPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      // If the user already has a users row, they don't need onboarding.
      const { data } = await supabase.from('users').select('status').eq('id', session.user.id).maybeSingle()
      if (data) {
        router.push(data.status === 'pending' ? '/pending' : '/wire/library')
        return
      }
      setChecking(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    window.location.href = data.redirect
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-wire-bg flex flex-col">
        <div className="border-b bg-wire-navy text-white px-6 py-4">
          <span className="font-serif text-lg font-bold tracking-tight">{brand.name}</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-wire-slate text-sm">Loading…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wire-bg flex flex-col">
      <div className="border-b bg-wire-navy text-white px-6 py-4">
        <span className="font-serif text-lg font-bold tracking-tight">{brand.name}</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl font-bold text-wire-navy mb-1">
            One last step
          </h1>
          <p className="text-wire-slate text-sm mb-8">
            What should we call you? This is how your name will appear to other members.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-wire-navy mb-1">
                Full name
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
                placeholder="Jane Smith"
                autoComplete="name"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-wire-navy text-white py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting up your account…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
