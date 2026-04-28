'use client'

import { useState } from 'react'
import { OrgFeed } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

interface Props {
  feeds: OrgFeed[]
  orgId: string
}

export default function FeedManager({ feeds: initialFeeds }: Props) {
  const [feeds, setFeeds] = useState(initialFeeds)
  const [newUrl, setNewUrl] = useState('')
  const [newType, setNewType] = useState<'full_text' | 'headline'>('full_text')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!newUrl.trim()) return
    setAdding(true)
    setError('')

    const res = await fetch('/api/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feed_url: newUrl.trim(), feed_type: newType }),
    })

    if (res.ok) {
      const data = await res.json()
      setFeeds([data, ...feeds])
      setNewUrl('')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to add feed.')
    }
    setAdding(false)
  }

  async function toggleActive(feedId: string, isActive: boolean) {
    await fetch(`/api/feeds/${feedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    setFeeds(feeds.map((f) => (f.id === feedId ? { ...f, is_active: !isActive } : f)))
  }

  async function handleDelete(feedId: string) {
    if (!confirm('Remove this feed?')) return
    await fetch(`/api/feeds/${feedId}`, { method: 'DELETE' })
    setFeeds(feeds.filter((f) => f.id !== feedId))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Add feed form */}
      <div className="bg-white border border-wire-border rounded p-4">
        <h3 className="text-sm font-semibold text-wire-navy mb-3">Add feed</h3>
        <div className="flex gap-2 flex-wrap">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://yoursite.com/tag/regional-wire/feed/"
            className="flex-1 min-w-48 border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'full_text' | 'headline')}
            className="border border-wire-border rounded px-2 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-wire-red"
          >
            <option value="full_text">Full-text</option>
            <option value="headline">Headline only</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={adding || !newUrl.trim()}
            className="bg-wire-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-wire-navy-light disabled:opacity-50 transition-colors"
          >
            {adding ? 'Adding…' : 'Add feed'}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-2">{error}</p>
        )}
        <div className="mt-3 text-xs text-wire-slate space-y-1">
          <p>
            <strong>Full-text feed:</strong> Stories auto-imported and available for
            republication immediately.
          </p>
          <p>
            <strong>Headline feed:</strong> Headlines surface in the discovery tab; other
            members can request the full story.
          </p>
        </div>
      </div>

      {/* Feed list */}
      {feeds.length === 0 ? (
        <p className="text-sm text-wire-slate">No feeds configured.</p>
      ) : (
        <div className="space-y-3">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="bg-white border border-wire-border rounded p-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium rounded px-1.5 py-0.5 ${
                      feed.feed_type === 'full_text'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {feed.feed_type === 'full_text' ? 'Full-text' : 'Headline'}
                  </span>
                  {!feed.is_active && (
                    <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                      Paused
                    </span>
                  )}
                </div>
                <p className="text-sm font-mono text-wire-navy break-all">
                  {feed.feed_url}
                </p>
                {feed.last_polled_at && (
                  <p className="text-xs text-wire-slate mt-1">
                    Last polled {formatDateTime(feed.last_polled_at)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(feed.id, feed.is_active)}
                  className="text-xs text-wire-slate hover:text-wire-navy underline"
                >
                  {feed.is_active ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => handleDelete(feed.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
