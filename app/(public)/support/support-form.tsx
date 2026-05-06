'use client'

import { useState } from 'react'

interface Props {
  initialName?: string
  initialEmail?: string
  orgName?: string
}

export default function SupportForm({ initialName = '', initialEmail = '', orgName }: Props) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-6 text-sm text-green-800">
        <p className="font-medium mb-1">Message sent.</p>
        <p>We&apos;ll get back to you at {email}.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {orgName && (
        <p className="text-sm text-wire-slate bg-wire-bg border border-wire-border rounded px-3 py-2">
          Submitting as a member of <strong className="text-wire-navy">{orgName}</strong>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-wire-navy mb-1">
            Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-wire-navy mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Subject
        </label>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Message
        </label>
        <textarea
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent resize-y"
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
        className="bg-wire-navy text-white text-sm font-medium px-6 py-2.5 rounded hover:bg-wire-navy-light transition-colors disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
