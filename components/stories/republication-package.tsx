'use client'

import { useState } from 'react'
import { generateRepublicationPackage, sanitizeStoryHtml } from '@/lib/utils'

interface Asset {
  id: string
  asset_type: string
  file_url: string
  displayUrl?: string
  caption: string | null
  credit: string | null
  is_primary: boolean
}

interface Props {
  story: {
    id: string
    title: string
    byline: string
    canonical_url: string
    body_html: string
    body_plain: string
    special_instructions?: string | null
    organizations?: { name: string }
  }
  assets: Asset[]
  embargoed: boolean
  embargoLiftsAt: string | null
}

export default function RepublicationPackage({
  story,
  assets,
  embargoed,
  embargoLiftsAt,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [logId, setLogId] = useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = useState('')
  const [urlSubmitted, setUrlSubmitted] = useState(false)
  const [showUrlPrompt, setShowUrlPrompt] = useState(false)

  const packageText = generateRepublicationPackage(story, assets)

  async function logDownload(): Promise<string | null> {
    try {
      const res = await fetch('/api/republication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: story.id }),
      })
      if (res.ok) {
        const data = await res.json()
        return data.id ?? null
      }
    } catch {
      // non-blocking
    }
    return null
  }

  async function handleCopy() {
    const orgName = (story.organizations as unknown as { name: string } | null)?.name ?? 'the original publisher'
    const attributionLine = `<p><em>This story originally appeared in ${orgName}: <a href="${story.canonical_url}">${story.title}</a></em></p>`
    const strippedHtml = sanitizeStoryHtml(story.body_html)
    const bylineFormatted = /^by\s/i.test(story.byline.trim()) ? story.byline.trim() : `By ${story.byline.trim()}`
    const html = `<h1>${story.title}</h1><p><em>${bylineFormatted}</em></p>${strippedHtml}${attributionLine}`
    const plain = `${story.title}\n${bylineFormatted}\n\n${story.body_plain}\n\nThis story originally appeared in ${orgName}: ${story.title} — ${story.canonical_url}`

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ])
    } catch {
      await navigator.clipboard.writeText(plain)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    const id = await logDownload()
    setLogId(id)
    setShowUrlPrompt(true)
  }

  function handleDownload() {
    const blob = new Blob([packageText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `republication-${story.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)

    logDownload().then((id) => {
      setLogId(id)
      setShowUrlPrompt(true)
    })
  }

  async function submitPublishedUrl() {
    if (!logId || !publishedUrl.trim()) return
    try {
      await fetch(`/api/republication/${logId}/url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: publishedUrl.trim() }),
      })
      setUrlSubmitted(true)
    } catch {
      // non-blocking
    }
  }

  if (embargoed && embargoLiftsAt) {
    return (
      <div className="text-center py-8">
        <div className="inline-block bg-amber-50 border border-amber-200 rounded-lg px-6 py-4">
          <p className="text-amber-800 font-medium">
            Republication package locked
          </p>
          <p className="text-amber-700 text-sm mt-1">
            Available after{' '}
            {new Date(embargoLiftsAt).toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short',
            })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-wire-navy mb-4">
        Republication Package
      </h2>

      {story.special_instructions && (
        <div className="mb-5 bg-blue-50 border-l-4 border-blue-500 rounded p-4">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">
            Read before republishing
          </p>
          <p className="text-blue-900 text-sm leading-relaxed">
            {story.special_instructions}
          </p>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-wire-navy text-white text-sm font-medium px-4 py-2.5 rounded hover:bg-wire-navy-light transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to clipboard
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 border border-wire-border text-wire-navy text-sm font-medium px-4 py-2.5 rounded hover:bg-wire-bg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download .txt
        </button>
      </div>


      {showUrlPrompt && !urlSubmitted && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded p-4">
          <p className="text-sm font-medium text-green-800 mb-2">
            Package downloaded. Where will this story be published?
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={publishedUrl}
              onChange={(e) => setPublishedUrl(e.target.value)}
              placeholder="https://yournewsroom.com/story/..."
              className="flex-1 border border-green-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
            />
            <button
              onClick={submitPublishedUrl}
              disabled={!publishedUrl.trim()}
              className="text-sm bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              Submit
            </button>
            <button
              onClick={() => setShowUrlPrompt(false)}
              className="text-sm text-green-700 hover:underline px-2"
            >
              Later
            </button>
          </div>
          <p className="text-xs text-green-700 mt-1">
            You can also submit from your dashboard after publishing.
          </p>
        </div>
      )}

      {urlSubmitted && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
          Published URL recorded. Thank you!
        </div>
      )}
    </div>
  )
}
