'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  displayName: string
  email: string
}

export default function AccountSettingsForm({ displayName: initialName, email }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save.')
    } else {
      setSaved(true)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Display name
        </label>
        <input
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
        />
        <p className="text-xs text-wire-slate mt-1">
          Shown to other members when you upload stories or make changes.
        </p>
      </div>

      <div>
        <p className="text-sm text-wire-slate">
          <strong className="text-wire-navy">Email:</strong>{' '}
          {email}
          <span className="text-xs ml-2">(contact support to change)</span>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Profile saved.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-wire-navy text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-wire-navy-light transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
