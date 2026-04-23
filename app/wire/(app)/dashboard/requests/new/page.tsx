'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RequestFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orgId = searchParams.get('org') ?? ''
  const headline = decodeURIComponent(searchParams.get('headline') ?? '')
  const url = decodeURIComponent(searchParams.get('url') ?? '')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_org_id: orgId,
        requested_headline: headline,
        requested_url: url,
        message: message.trim() || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to send request.')
      setLoading(false)
      return
    }

    router.push('/wire/dashboard/requests/outgoing')
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/wire/library?tab=headlines"
          className="text-sm text-wire-slate hover:text-wire-navy"
        >
          ← Back to headline feed
        </Link>
      </div>

      <h2 className="font-serif text-xl font-bold text-wire-navy mb-1">
        Request Story
      </h2>
      <p className="text-wire-slate text-sm mb-6">
        Your request will be emailed to the newsroom&apos;s editors. They&apos;ll upload the
        full story and notify you when it&apos;s available.
      </p>

      <div className="bg-wire-bg border border-wire-border rounded p-4 mb-6">
        <p className="text-xs text-wire-slate uppercase tracking-wide font-medium mb-1">
          Requesting
        </p>
        <p className="font-serif font-semibold text-wire-navy leading-snug">{headline}</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-wire-red hover:underline mt-1 block"
          >
            {url}
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-wire-navy mb-1">
            Message{' '}
            <span className="text-wire-slate font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red resize-none"
            placeholder="Tell the newsroom why you'd like to republish this story…"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !orgId}
            className="bg-wire-navy text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-wire-navy-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send request'}
          </button>
          <Link
            href="/wire/library?tab=headlines"
            className="text-sm text-wire-slate hover:text-wire-navy px-4 py-2.5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function NewRequestPage() {
  return (
    <Suspense>
      <RequestFormContent />
    </Suspense>
  )
}
