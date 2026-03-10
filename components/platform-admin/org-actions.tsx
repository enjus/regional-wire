'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type OrgStatus = 'pending' | 'approved' | 'suspended'

interface Props {
  orgId: string
  orgName: string
  status: OrgStatus
}

export default function OrgActions({ orgId, orgName, status }: Props) {
  const router = useRouter()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function callAction(endpoint: string, body?: object) {
    setLoading(true)
    await fetch(`/api/platform-admin/orgs/${orgId}/${endpoint}`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    setLoading(false)
    setRejecting(false)
    router.refresh()
  }

  if (status === 'pending') {
    if (rejecting) {
      return (
        <div className="space-y-2 w-64 shrink-0">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (emailed to org)…"
            rows={3}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => callAction('reject', { reason })}
              disabled={loading}
              className="text-xs bg-red-600 text-white rounded px-3 py-1.5 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Rejecting…' : 'Confirm rejection'}
            </button>
            <button
              onClick={() => setRejecting(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={() => callAction('approve')}
          disabled={loading}
          className="text-sm bg-slate-900 text-white rounded px-4 py-2 hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={() => setRejecting(true)}
          disabled={loading}
          className="text-sm border border-red-200 text-red-600 rounded px-4 py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    )
  }

  if (status === 'approved') {
    return (
      <button
        onClick={() => {
          if (
            !confirm(
              `Suspend ${orgName}? Their members won't be able to log in until re-approved.`
            )
          )
            return
          callAction('suspend')
        }}
        disabled={loading}
        className="text-xs border border-amber-200 text-amber-700 rounded px-3 py-1.5 hover:bg-amber-50 transition-colors disabled:opacity-50 shrink-0"
      >
        {loading ? 'Suspending…' : 'Suspend'}
      </button>
    )
  }

  // suspended
  return (
    <button
      onClick={() => {
        if (!confirm(`Re-approve ${orgName}?`)) return
        callAction('approve')
      }}
      disabled={loading}
      className="text-xs border border-green-200 text-green-700 rounded px-3 py-1.5 hover:bg-green-50 transition-colors disabled:opacity-50 shrink-0"
    >
      {loading ? 'Approving…' : 'Re-approve'}
    </button>
  )
}
