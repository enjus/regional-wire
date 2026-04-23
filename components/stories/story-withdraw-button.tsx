'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StoryWithdrawButton({ storyId }: { storyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('A reason is required.')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch(`/api/stories/${storyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'withdrawn',
        withdrawal_reason: reason.trim(),
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Withdrawal failed.')
      setLoading(false)
      return
    }
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm border border-red-200 rounded px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
      >
        Withdraw
      </button>
    )
  }

  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50 max-w-md">
      <form onSubmit={handleWithdraw}>
        <h4 className="text-sm font-semibold text-red-800 mb-2">
          Withdraw this story
        </h4>
        <p className="text-xs text-red-700 mb-3">
          All newsrooms that downloaded this story will be notified.
        </p>
        <label className="block text-sm font-medium text-red-800 mb-1">
          Reason <span className="text-red-600">*</span>
        </label>
        <textarea
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full border border-red-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none bg-white"
          placeholder="Explain why this story is being withdrawn…"
        />
        {error && (
          <p className="text-xs text-red-700 mt-1">{error}</p>
        )}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => { setOpen(false); setReason(''); setError('') }}
            className="text-sm text-red-700 hover:text-red-900 px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="text-sm bg-red-600 text-white rounded px-4 py-1.5 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Withdrawing…' : 'Withdraw and notify'}
          </button>
        </div>
      </form>
    </div>
  )
}
