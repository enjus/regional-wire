'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StoryWithdrawButton({ storyId }: { storyId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleWithdraw() {
    if (!confirm('Withdraw this story from the library? Editors who have already downloaded the package are not notified.')) return
    setLoading(true)
    await fetch(`/api/stories/${storyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'withdrawn' }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleWithdraw}
      disabled={loading}
      className="text-sm border border-red-200 rounded px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? 'Withdrawing…' : 'Withdraw'}
    </button>
  )
}
