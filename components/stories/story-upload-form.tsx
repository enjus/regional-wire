'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TiptapEditor = dynamic(() => import('@/components/editor/tiptap-editor'), {
  ssr: false,
  loading: () => (
    <div className="border border-wire-border rounded h-64 bg-wire-bg animate-pulse" />
  ),
})

interface AssetField {
  file: File | null
  caption: string
  credit: string
  preview: string
}

function emptyAsset(): AssetField {
  return { file: null, caption: '', credit: '', preview: '' }
}

interface Props {
  orgName: string
  requestId?: string
  initialData?: {
    id?: string
    title?: string
    byline?: string
    canonical_url?: string
    body_html?: string
    summary?: string
    special_instructions?: string
    embargo_lifts_at?: string
  }
}

export default function StoryUploadForm({ orgName, initialData, requestId }: Props) {
  const router = useRouter()
  const isEdit = !!initialData?.id

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [byline, setByline] = useState(
    initialData?.byline ?? `Your Name, ${orgName}`
  )
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonical_url ?? '')
  const [bodyHtml, setBodyHtml] = useState(initialData?.body_html ?? '')
  const [bodyPlain, setBodyPlain] = useState('')
  const [summary, setSummary] = useState(initialData?.summary ?? '')
  const [specialInstructions, setSpecialInstructions] = useState(
    initialData?.special_instructions ?? ''
  )
  const [embargoEnabled, setEmbargoEnabled] = useState(!!initialData?.embargo_lifts_at)
  const [embargoLiftsAt, setEmbargoLiftsAt] = useState(
    initialData?.embargo_lifts_at?.slice(0, 16) ?? ''
  )

  // Assets
  const [primaryImage, setPrimaryImage] = useState<AssetField>(emptyAsset())
  const [additionalImages, setAdditionalImages] = useState<AssetField[]>([])
  const [video, setVideo] = useState<AssetField>(emptyAsset())

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleImageFile(
    file: File,
    setter: React.Dispatch<React.SetStateAction<AssetField>>
  ) {
    if (file.size > 20 * 1024 * 1024) {
      setError('Images must be under 20MB.')
      return
    }
    const preview = URL.createObjectURL(file)
    setter((prev) => ({ ...prev, file, preview }))
  }

  function handleVideoFile(file: File) {
    if (file.size > 500 * 1024 * 1024) {
      setError('Video must be under 500MB.')
      return
    }
    const preview = URL.createObjectURL(file)
    setVideo((prev) => ({ ...prev, file, preview }))
  }

  function addAdditionalImage() {
    if (additionalImages.length >= 4) return
    setAdditionalImages([...additionalImages, emptyAsset()])
  }

  function updateAdditionalImage(
    i: number,
    updater: (prev: AssetField) => AssetField
  ) {
    const updated = [...additionalImages]
    updated[i] = updater(updated[i])
    setAdditionalImages(updated)
  }

  async function uploadFile(file: File, path: string): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('story-assets')
      .upload(path, file, { upsert: true })
    if (error) throw new Error(`Upload failed: ${error.message}`)
    return data.path
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!bodyHtml.trim() || bodyHtml === '<p></p>') {
      setError('Story body is required.')
      setLoading(false)
      return
    }

    try {
      // Upload files to Supabase Storage
      const storySlug = `${Date.now()}`
      const uploadedAssets: {
        asset_type: string
        file_url: string
        caption: string | null
        credit: string | null
        is_primary: boolean
      }[] = []

      if (primaryImage.file) {
        const url = await uploadFile(
          primaryImage.file,
          `images/${storySlug}/primary.${primaryImage.file.name.split('.').pop()}`
        )
        uploadedAssets.push({
          asset_type: 'image',
          file_url: url,
          caption: primaryImage.caption || null,
          credit: primaryImage.credit || null,
          is_primary: true,
        })
      }

      for (let i = 0; i < additionalImages.length; i++) {
        const img = additionalImages[i]
        if (!img.file) continue
        const url = await uploadFile(
          img.file,
          `images/${storySlug}/additional-${i}.${img.file.name.split('.').pop()}`
        )
        uploadedAssets.push({
          asset_type: 'image',
          file_url: url,
          caption: img.caption || null,
          credit: img.credit || null,
          is_primary: false,
        })
      }

      if (video.file) {
        const url = await uploadFile(
          video.file,
          `videos/${storySlug}/video.${video.file.name.split('.').pop()}`
        )
        uploadedAssets.push({
          asset_type: 'video',
          file_url: url,
          caption: video.caption || null,
          credit: video.credit || null,
          is_primary: false,
        })
      }

      // Create story
      const method = isEdit ? 'PATCH' : 'POST'
      const url = isEdit
        ? `/api/stories/${initialData!.id}`
        : '/api/stories'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          byline: byline.trim(),
          canonical_url: canonicalUrl.trim(),
          body_html: bodyHtml,
          body_plain: bodyPlain,
          summary: summary.trim() || null,
          special_instructions: specialInstructions.trim() || null,
          embargo_lifts_at: embargoEnabled && embargoLiftsAt
            ? new Date(embargoLiftsAt).toISOString()
            : null,
          assets: uploadedAssets,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save story')
      }

      const data = await res.json()

      if (requestId) {
        await fetch(`/api/requests/${requestId}/fulfill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId: data.id }),
        })
      }

      router.push(`/dashboard/stories/${data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Headline <span className="text-wire-red">*</span>
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-wire-border rounded px-3 py-2 font-serif text-lg focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
          placeholder="Story headline"
        />
      </div>

      {/* Byline */}
      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Byline <span className="text-wire-red">*</span>
        </label>
        <input
          type="text"
          required
          value={byline}
          onChange={(e) => setByline(e.target.value)}
          className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
          placeholder="Jane Smith, The Daily Tribune"
        />
      </div>

      {/* Canonical URL */}
      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Original URL <span className="text-wire-red">*</span>
        </label>
        <p className="text-xs text-wire-slate mb-1">
          The permanent URL of this story on your site. Included in the republication
          package as an attribution link back to your newsroom.
        </p>
        <input
          type="url"
          required
          value={canonicalUrl}
          onChange={(e) => setCanonicalUrl(e.target.value)}
          className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
          placeholder="https://dailytribune.com/story/..."
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Story body <span className="text-wire-red">*</span>
        </label>
        <TiptapEditor
          content={initialData?.body_html}
          onChange={(html, plain) => {
            setBodyHtml(html)
            setBodyPlain(plain)
          }}
        />
      </div>

      {/* Summary */}
      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Summary{' '}
          <span className="text-wire-slate font-normal">(optional)</span>
        </label>
        <p className="text-xs text-wire-slate mb-1">
          2–3 sentences shown on story cards and in request notifications.
        </p>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent resize-none"
          placeholder="A brief summary for editors browsing the library…"
        />
      </div>

      {/* Special instructions */}
      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Special instructions{' '}
          <span className="text-wire-slate font-normal">(optional)</span>
        </label>
        <p className="text-xs text-wire-slate mb-1">
          Displayed prominently to editors before they copy the package. E.g.
          "Do not crop lead photo", "Contact editor before publishing".
        </p>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          rows={2}
          className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent resize-none"
          placeholder="Do not crop the lead photo."
        />
      </div>

      {/* Embargo */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => setEmbargoEnabled(!embargoEnabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              embargoEnabled ? 'bg-wire-navy' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                embargoEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <label className="text-sm font-medium text-wire-navy cursor-pointer" onClick={() => setEmbargoEnabled(!embargoEnabled)}>
            Embargo this story
          </label>
        </div>

        {embargoEnabled && (
          <div>
            <label className="block text-xs text-wire-slate mb-1">
              Embargo lifts at
            </label>
            <input
              type="datetime-local"
              required={embargoEnabled}
              value={embargoLiftsAt}
              onChange={(e) => setEmbargoLiftsAt(e.target.value)}
              className="border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
            />
            <p className="text-xs text-wire-slate mt-1">
              The story will appear in the library with a lock on the
              republication package until this time.
            </p>
          </div>
        )}
      </div>

      {/* Primary image */}
      <div className="border-t border-wire-border pt-6">
        <h3 className="text-sm font-semibold text-wire-navy mb-4">Media</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-wire-navy mb-1">
            Primary image{' '}
            <span className="text-wire-slate font-normal">(optional, max 20MB)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageFile(file, setPrimaryImage)
            }}
            className="block text-sm text-wire-slate file:mr-3 file:py-1.5 file:px-3 file:border file:border-wire-border file:rounded file:text-xs file:bg-wire-bg file:text-wire-navy hover:file:bg-gray-100"
          />
          {primaryImage.preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.preview}
              alt="Preview"
              className="mt-2 h-32 w-auto rounded border border-wire-border object-cover"
            />
          )}
          {primaryImage.file && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={primaryImage.caption}
                onChange={(e) =>
                  setPrimaryImage((p) => ({ ...p, caption: e.target.value }))
                }
                placeholder="Caption"
                className="border border-wire-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-wire-red"
              />
              <input
                type="text"
                value={primaryImage.credit}
                onChange={(e) =>
                  setPrimaryImage((p) => ({ ...p, credit: e.target.value }))
                }
                placeholder="Photo credit"
                className="border border-wire-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-wire-red"
              />
            </div>
          )}
        </div>

        {/* Additional images */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-wire-navy mb-2">
            Additional images{' '}
            <span className="text-wire-slate font-normal">
              (optional, up to 4, max 20MB each)
            </span>
          </label>
          {additionalImages.map((img, i) => (
            <div key={i} className="mb-3 pl-3 border-l-2 border-wire-border">
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      updateAdditionalImage(i, (prev) => ({
                        ...prev,
                        file,
                        preview: URL.createObjectURL(file),
                      }))
                  }}
                  className="block text-sm text-wire-slate file:mr-3 file:py-1 file:px-2 file:border file:border-wire-border file:rounded file:text-xs file:bg-wire-bg file:text-wire-navy"
                />
                <button
                  type="button"
                  onClick={() =>
                    setAdditionalImages(additionalImages.filter((_, idx) => idx !== i))
                  }
                  className="text-xs text-wire-slate hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              {img.preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.preview}
                  alt=""
                  className="h-24 w-auto rounded border border-wire-border object-cover mb-1"
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={img.caption}
                  onChange={(e) =>
                    updateAdditionalImage(i, (p) => ({ ...p, caption: e.target.value }))
                  }
                  placeholder="Caption"
                  className="border border-wire-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-wire-red"
                />
                <input
                  type="text"
                  value={img.credit}
                  onChange={(e) =>
                    updateAdditionalImage(i, (p) => ({ ...p, credit: e.target.value }))
                  }
                  placeholder="Photo credit"
                  className="border border-wire-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-wire-red"
                />
              </div>
            </div>
          ))}
          {additionalImages.length < 4 && (
            <button
              type="button"
              onClick={addAdditionalImage}
              className="text-sm text-wire-red hover:underline"
            >
              + Add image
            </button>
          )}
        </div>

        {/* Video */}
        <div>
          <label className="block text-sm font-medium text-wire-navy mb-1">
            Video{' '}
            <span className="text-wire-slate font-normal">(optional, max 500MB)</span>
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleVideoFile(file)
            }}
            className="block text-sm text-wire-slate file:mr-3 file:py-1.5 file:px-3 file:border file:border-wire-border file:rounded file:text-xs file:bg-wire-bg file:text-wire-navy hover:file:bg-gray-100"
          />
          {video.file && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={video.caption}
                onChange={(e) =>
                  setVideo((p) => ({ ...p, caption: e.target.value }))
                }
                placeholder="Caption"
                className="border border-wire-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-wire-red"
              />
              <input
                type="text"
                value={video.credit}
                onChange={(e) =>
                  setVideo((p) => ({ ...p, credit: e.target.value }))
                }
                placeholder="Credit"
                className="border border-wire-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-wire-red"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-wire-navy text-white text-sm font-medium px-6 py-2.5 rounded hover:bg-wire-navy-light transition-colors disabled:opacity-50"
        >
          {loading
            ? 'Saving…'
            : isEdit
            ? 'Save changes'
            : 'Publish to library'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-wire-slate hover:text-wire-navy px-4"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
