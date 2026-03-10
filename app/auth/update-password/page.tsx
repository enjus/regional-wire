'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/wire/library')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-wire-bg flex flex-col">
      <div className="border-b bg-wire-navy text-white px-6 py-4">
        <Link href="/" className="font-serif text-lg font-bold tracking-tight">
          Regional Wire
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl font-bold text-wire-navy mb-1">
            Set new password
          </h1>
          <p className="text-wire-slate text-sm mb-8">
            Choose a new password for your account.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-wire-navy mb-1">
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
                placeholder="8+ characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-wire-navy mb-1">
                Confirm password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
                placeholder="Repeat password"
                autoComplete="new-password"
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
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
