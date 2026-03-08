'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orgId: string
  orgName: string
}

export default function AdminOrgActions({ orgId, orgName }: Props) {
  const router = useRouter()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    if (!confirm(`Approve ${orgName}?`)) return
    setLoading(true)
    await fetch(`/api/admin/orgs/${orgId}/approve`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  async function handleReject() {
    setLoading(true)
    await fetch(`/api/admin/orgs/${orgId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setLoading(false)
    setRejecting(false)
    router.refresh()
  }

  return (
    <div className="shrink-0">
      {rejecting ? (
        <div className="space-y-2 w-64">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (sent to org)…"
            rows={3}
            className="w-full border border-wire-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-wire-red resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading}
              className="text-xs bg-red-600 text-white rounded px-3 py-1.5 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Rejecting…' : 'Confirm rejection'}
            </button>
            <button
              onClick={() => setRejecting(false)}
              className="text-xs text-wire-slate hover:text-wire-navy"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="text-sm bg-wire-navy text-white rounded px-4 py-2 hover:bg-wire-navy-light disabled:opacity-50 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => setRejecting(true)}
            className="text-sm border border-red-200 text-red-600 rounded px-4 py-2 hover:bg-red-50 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
