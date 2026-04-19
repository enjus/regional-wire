import Link from 'next/link'
import Image from 'next/image'
import { Story, StoryAsset } from '@/lib/types'
import { formatDateTime, isEmbargoActive } from '@/lib/utils'

interface Props {
  story: Story
}

export default function StoryCard({ story }: Props) {
  const orgName = story.organizations?.name ?? 'Unknown'
  const primaryImage = story.story_assets?.find(
    (a: StoryAsset) => a.is_primary && a.asset_type === 'image'
  )
  const embargoed = story.status === 'embargoed' && isEmbargoActive(story.embargo_lifts_at)

  return (
    <Link
      href={`/library/${story.id}`}
      className="group bg-white border border-wire-border rounded overflow-hidden hover:shadow-md transition-shadow block"
    >
      {primaryImage && (
        <div className="relative h-40 bg-gray-100 overflow-hidden">
          <Image
            src={primaryImage.file_url}
            alt={primaryImage.caption ?? story.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {embargoed && (
            <div className="absolute inset-0 bg-wire-navy/70 flex items-center justify-center">
              <span className="text-white text-xs font-medium px-3 py-1 bg-amber-600 rounded">
                Embargoed
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-wire-red uppercase tracking-wide">
            {orgName}
          </span>
          <span className="text-wire-slate text-xs">·</span>
          <span className="text-xs text-wire-slate">
            {formatDateTime(story.published_at)}
          </span>
          {story.source === 'feed' && (
            <>
              <span className="text-wire-slate text-xs">·</span>
              <span className="text-xs text-wire-slate bg-gray-100 rounded px-1.5 py-0.5">
                Feed
              </span>
            </>
          )}
        </div>

        <h2 className="font-serif font-semibold text-wire-navy leading-snug group-hover:text-wire-red transition-colors line-clamp-3">
          {story.title}
        </h2>

        {story.summary && (
          <p className="text-wire-slate text-sm mt-2 leading-relaxed line-clamp-2">
            {story.summary}
          </p>
        )}

        <p className="text-xs text-wire-slate mt-3">{story.byline}</p>

        {embargoed && story.embargo_lifts_at && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
            Embargoed until{' '}
            {new Date(story.embargo_lifts_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short',
            })}
          </div>
        )}

        {story.status === 'withdrawn' ? (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-xs text-red-600 font-medium">Withdrawn</span>
          </div>
        ) : !embargoed && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-wire-slate">Available for republication</span>
          </div>
        )}
      </div>
    </Link>
  )
}
