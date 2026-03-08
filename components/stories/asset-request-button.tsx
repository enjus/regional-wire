'use client'

import { useState } from 'react'

interface Props {
  storyId: string
  orgName: string
}

export default function AssetRequestButton({ storyId, orgName }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleRequest() {
    setState('loading')
    try {
      const res = await fetch('/api/asset-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId }),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-4 py-3">
        Request sent. {orgName} will receive an email and can reply directly with the media files.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleRequest}
        disabled={state === 'loading'}
        className="text-sm font-medium border border-wire-navy text-wire-navy rounded px-4 py-2 hover:bg-wire-navy hover:text-white transition-colors disabled:opacity-50"
      >
        {state === 'loading' ? 'Sending request…' : 'Request images / video'}
      </button>
      {state === 'error' && (
        <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
      )}
    </div>
  )
}
