'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  requestId: string
  storyId: string | null
  requestedHeadline: string
  requestedUrl: string | null
}

export default function RequestActions({
  requestId,
  storyId,
  requestedHeadline,
  requestedUrl,
}: Props) {
  const router = useRouter()
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleFulfill() {
    setLoading(true)
    await fetch(`/api/requests/${requestId}/fulfill`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  async function handleDecline() {
    setLoading(true)
    await fetch(`/api/requests/${requestId}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setLoading(false)
    setDeclining(false)
    router.refresh()
  }

  return (
    <div className="shrink-0">
      {declining ? (
        <div className="space-y-2 w-56">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional, sent to requester)…"
            rows={2}
            className="w-full border border-wire-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-wire-red resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDecline}
              disabled={loading}
              className="text-xs bg-red-600 text-white rounded px-3 py-1.5 hover:bg-red-700 disabled:opacity-50"
            >
              Confirm decline
            </button>
            <button
              onClick={() => setDeclining(false)}
              className="text-xs text-wire-slate hover:text-wire-navy"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {storyId ? (
            <button
              onClick={handleFulfill}
              disabled={loading}
              className="text-xs bg-wire-navy text-white rounded px-3 py-1.5 hover:bg-wire-navy-light disabled:opacity-50 transition-colors"
            >
              Mark fulfilled
            </button>
          ) : (
            <Link
              href={`/wire/dashboard/stories/new?headline=${encodeURIComponent(requestedHeadline)}&url=${encodeURIComponent(requestedUrl ?? '')}&requestId=${requestId}`}
              className="text-xs bg-wire-navy text-white rounded px-3 py-1.5 hover:bg-wire-navy-light transition-colors text-center"
            >
              Upload & fulfill
            </Link>
          )}
          <button
            onClick={() => setDeclining(true)}
            className="text-xs border border-red-200 text-red-600 rounded px-3 py-1.5 hover:bg-red-50 transition-colors"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  )
}
