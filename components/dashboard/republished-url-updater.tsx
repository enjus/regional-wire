'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  logId: string
  currentUrl: string | null
  notRepublished: boolean
  orgWebsiteUrl?: string | null
}

export default function RepublishedUrlUpdater({ logId, currentUrl, notRepublished, orgWebsiteUrl }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(currentUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function handleSave() {
    if (!url.trim()) return
    setSaving(true)
    await fetch(`/api/republication/${logId}/url`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    })
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  async function handleNotRepublished(value: boolean) {
    if (toggling) return
    setToggling(true)
    await fetch(`/api/republication/${logId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ not_republished: value }),
    })
    router.refresh()
  }

  if (notRepublished) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-wire-slate italic">Marked as not published</span>
        <button
          onClick={() => handleNotRepublished(false)}
          disabled={toggling}
          className="text-xs text-wire-slate hover:text-wire-navy underline disabled:opacity-50"
        >
          Undo
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-wire-slate hover:text-wire-navy underline"
        >
          {currentUrl ? 'Update published URL' : 'Submit published URL'}
        </button>
        {!currentUrl && (
          <button
            onClick={() => handleNotRepublished(true)}
            disabled={toggling}
            className="text-xs text-wire-slate hover:text-wire-navy underline disabled:opacity-50"
          >
            Not published
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={orgWebsiteUrl ? `${orgWebsiteUrl}/story/...` : 'https://example.com/story/...'}
        className="flex-1 border border-wire-border rounded px-2 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-wire-red"
      />
      <button
        onClick={handleSave}
        disabled={saving || !url.trim()}
        className="text-xs bg-wire-navy text-white rounded px-3 py-1.5 hover:bg-wire-navy-light disabled:opacity-50"
      >
        {saving ? '…' : 'Save'}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-wire-slate hover:text-wire-navy"
      >
        Cancel
      </button>
    </div>
  )
}
