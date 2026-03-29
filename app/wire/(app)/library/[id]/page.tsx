import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/platform-admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatDateTime, isEmbargoActive, sanitizeStoryHtml } from '@/lib/utils'
import RepublicationPackage from '@/components/stories/republication-package'
import AssetRequestButton from '@/components/stories/asset-request-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('organization_id, is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!currentUser) redirect('/register')

  const isPlatformAdmin = (currentUser as { organization_id: string | null; is_platform_admin?: boolean }).is_platform_admin === true
  const queryClient = isPlatformAdmin ? createAdminSupabase() : supabase

  const { data: story } = await queryClient
    .from('stories')
    .select(
      `
      *,
      organizations(id, name, website_url, republication_guidance),
      story_assets(*)
    `
    )
    .eq('id', id)
    .single()

  if (!story) notFound()

  // Fetch change history for this story
  const { data: storyChanges } = await queryClient
    .from('story_changes')
    .select('*, users(display_name)')
    .eq('story_id', id)
    .order('created_at', { ascending: false })

  const corrections = (storyChanges ?? []).filter((c) => c.change_type === 'correction')
  const allChanges = storyChanges ?? []

  // Can't access own org's story for republication package (but can still view via dashboard)
  const isOwnOrg = !isPlatformAdmin && story.organization_id === currentUser.organization_id
  const embargoed = story.status === 'embargoed' && isEmbargoActive(story.embargo_lifts_at)
  const org = story.organizations as { id: string; name: string; website_url: string; republication_guidance: string | null } | null
  const rawAssets = (story.story_assets ?? []) as {
    id: string
    asset_type: string
    file_url: string
    caption: string | null
    credit: string | null
    is_primary: boolean
  }[]

  // Generate signed URLs for private bucket assets
  let assets: (typeof rawAssets[0] & { displayUrl: string })[] = rawAssets.map(a => ({ ...a, displayUrl: '' }))
  if (rawAssets.length > 0) {
    const serviceClient = await createServiceClient()
    const { data: signedData } = await serviceClient.storage
      .from('story-assets')
      .createSignedUrls(rawAssets.map(a => a.file_url), 3600)
    const urlMap: Record<string, string> = {}
    signedData?.forEach(item => { if (item.signedUrl && item.path) urlMap[item.path] = item.signedUrl })
    assets = rawAssets.map(a => ({ ...a, displayUrl: urlMap[a.file_url] ?? '' }))
  }

  const primaryImage = assets.find((a) => a.is_primary && a.asset_type === 'image')
  const additionalImages = assets.filter((a) => !a.is_primary && a.asset_type === 'image')
  const video = assets.find((a) => a.asset_type === 'video')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/wire/library"
          className="text-sm text-wire-slate hover:text-wire-navy"
        >
          ← Story Library
        </Link>
      </div>

      {/* Story header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-wire-red uppercase tracking-wide">
            {org?.name}
          </span>
          <span className="text-wire-slate text-sm">·</span>
          <span className="text-sm text-wire-slate">{formatDate(story.published_at)}</span>
          {story.source === 'feed' && (
            <>
              <span className="text-wire-slate text-sm">·</span>
              <span className="text-xs bg-gray-100 rounded px-2 py-0.5 text-wire-slate">
                Feed
              </span>
            </>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-wire-navy leading-tight mb-3">
          {story.title}
        </h1>

        <p className="text-wire-slate text-sm">
          {story.byline}
          <span className="mx-2">·</span>
          <span>{story.body_plain.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
        </p>

        {story.canonical_url && (
          <a
            href={story.canonical_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-wire-red hover:underline mt-2 inline-block"
          >
            Original story ↗
          </a>
        )}
      </div>

      {/* Correction notices */}
      {corrections.length > 0 && (
        <div className="mb-8 space-y-3">
          {corrections.map((c) => (
            <div key={c.id} className="bg-amber-50 border border-amber-300 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                Correction
              </p>
              <p className="text-sm text-amber-900 leading-relaxed">
                {c.correction_text}
              </p>
              <p className="text-xs text-amber-700 mt-2">
                &mdash; {org?.name}, {formatDateTime(c.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Primary image */}
      {primaryImage && (
        <figure className="mb-8">
          <div className="relative w-full h-64 sm:h-80 rounded overflow-hidden bg-gray-100">
            <Image
              src={primaryImage.displayUrl}
              alt={primaryImage.caption ?? story.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
          <figcaption className="mt-2">
            <AssetMeta caption={primaryImage.caption} credit={primaryImage.credit} url={primaryImage.displayUrl} />
          </figcaption>
        </figure>
      )}

      {/* Embargo notice */}
      {embargoed && story.embargo_lifts_at && (
        <div className="mb-8 bg-amber-50 border border-amber-300 rounded-lg p-4">
          <p className="text-amber-800 font-medium text-sm">
            This story is embargoed until{' '}
            {new Date(story.embargo_lifts_at).toLocaleString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short',
            })}
            .
          </p>
          <p className="text-amber-700 text-xs mt-1">
            The republication package will be unlocked when the embargo lifts.
          </p>
        </div>
      )}

      {/* Special instructions callout — shown before body */}
      {story.special_instructions && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
            Special Instructions from {org?.name}
          </p>
          <p className="text-blue-900 text-sm leading-relaxed">
            {story.special_instructions}
          </p>
        </div>
      )}

      {/* Story body */}
      <div
        className="prose prose-wire max-w-none mb-10"
        dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(story.body_html) }}
      />

      {/* Additional images */}
      {additionalImages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-wire-navy uppercase tracking-wide mb-3">
            Additional Images
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {additionalImages.map((img) => (
              <figure key={img.id}>
                <div className="relative h-32 rounded overflow-hidden bg-gray-100">
                  <Image
                    src={img.displayUrl}
                    alt={img.caption ?? ''}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
                <figcaption className="mt-1">
                  <AssetMeta caption={img.caption} credit={img.credit} url={img.displayUrl} />
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* Video */}
      {video && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-wire-navy uppercase tracking-wide mb-3">
            Video
          </h3>
          <video controls className="w-full rounded" src={video.displayUrl}>
            Your browser does not support video.
          </video>
          <AssetMeta caption={video.caption} credit={video.credit} url={video.displayUrl} />
        </div>
      )}

      {/* Media section: request button for feed stories, or summary for uploaded stories */}
      {!isOwnOrg && !embargoed && (
        <div className="mb-8 border border-wire-border rounded-lg p-5">
          <p className="text-xs font-semibold text-wire-navy uppercase tracking-wide mb-2">
            Media
          </p>
          {story.source === 'feed' ? (
            <>
              <p className="text-sm text-wire-slate mb-3">
                This story was ingested from a feed. Images and video are not stored here — request them directly from {org?.name ?? 'the originating newsroom'}.
              </p>
              <AssetRequestButton storyId={story.id} orgName={org?.name ?? 'the originating newsroom'} />
            </>
          ) : assets.length === 0 ? (
            <p className="text-sm text-wire-slate">No media assets were uploaded with this story.</p>
          ) : (
            <p className="text-sm text-wire-slate">
              {[
                assets.filter(a => a.asset_type === 'image').length > 0
                  ? `${assets.filter(a => a.asset_type === 'image').length} image${assets.filter(a => a.asset_type === 'image').length !== 1 ? 's' : ''}`
                  : null,
                assets.find(a => a.asset_type === 'video') ? 'video' : null,
              ].filter(Boolean).join(' and ')}{' '}
              available above. Use the Download links to save files for your CMS.
            </p>
          )}
        </div>
      )}

      {/* Republication rules */}
      {!isOwnOrg && (
        <div className="border border-wire-border rounded-lg p-5 mb-8 bg-wire-bg">
          <p className="text-xs font-semibold text-wire-navy uppercase tracking-wide mb-3">
            Republication Requirements
          </p>
          <ul className="space-y-2 text-sm text-wire-slate">
            <li className="flex gap-2">
              <span className="text-wire-navy font-bold shrink-0">1.</span>
              <span><strong className="text-wire-navy">Attribution is required.</strong> The republished story must include a link back to the original story on the originating newsroom's website. Do not remove or alter the attribution line.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-wire-navy font-bold shrink-0">2.</span>
              <span><strong className="text-wire-navy">Headlines may be adapted.</strong> You may edit the headline for style or to better fit your audience, but the edited headline must retain the original meaning.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-wire-navy font-bold shrink-0">3.</span>
              <span><strong className="text-wire-navy">Minor edits are acceptable.</strong> Small changes for style, updated time references (e.g. replacing "Wednesday" with a specific date), or clarifications that resolve genuine ambiguity are permitted. Substantive changes to facts, tone, or conclusions are not.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-wire-navy font-bold shrink-0">4.</span>
              <span><strong className="text-wire-navy">Preserve the byline.</strong> The original author's name must appear as written. Do not substitute your own staff byline.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-wire-navy font-bold shrink-0">5.</span>
              <span><strong className="text-wire-navy">No resyndication.</strong> You may not redistribute this story to third parties or other publications outside of Regional Wire.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-wire-navy font-bold shrink-0">6.</span>
              <span><strong className="text-wire-navy">Notify the originating newsroom.</strong> Submit your published URL after republishing so the originating newsroom can track where their story appeared.</span>
            </li>
          </ul>
        </div>
      )}

      {/* Additional publisher guidance */}
      {!isOwnOrg && org?.republication_guidance && (
        <div className="border border-wire-border rounded-lg p-5 mb-8 bg-wire-bg">
          <p className="text-xs font-semibold text-wire-navy uppercase tracking-wide mb-3">
            Additional publisher guidance
          </p>
          <p className="text-sm text-wire-slate leading-relaxed whitespace-pre-line">
            {org.republication_guidance}
          </p>
        </div>
      )}

      {/* Republication package */}
      <div className="border-t border-wire-border pt-8">
        {isOwnOrg ? (
          <div className="bg-wire-bg border border-wire-border rounded p-4 text-sm text-wire-slate text-center">
            This is your organization&apos;s story. View it in your{' '}
            <Link href="/wire/dashboard" className="text-wire-red hover:underline">
              dashboard
            </Link>
            .
          </div>
        ) : (
          <RepublicationPackage
            story={{
              id: story.id,
              title: story.title,
              byline: story.byline,
              canonical_url: story.canonical_url,
              body_html: story.body_html,
              body_plain: story.body_plain,
              special_instructions: story.special_instructions,
              organizations: org ? { name: org.name } : undefined,
            }}
            assets={assets}
            embargoed={embargoed}
            embargoLiftsAt={story.embargo_lifts_at}
          />
        )}
      </div>

      {/* Change history */}
      {allChanges.length > 0 && (
        <div className="border-t border-wire-border pt-8 mt-8">
          <h3 className="text-sm font-semibold text-wire-navy uppercase tracking-wide mb-4">
            Change History
          </h3>
          <div className="space-y-3">
            {allChanges.map((change) => (
              <div key={change.id} className="border border-wire-border rounded p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium rounded px-2 py-0.5 ${
                      change.change_type === 'correction'
                        ? 'bg-amber-100 text-amber-800'
                        : change.change_type === 'withdrawal'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {change.change_type === 'correction'
                      ? 'Correction'
                      : change.change_type === 'withdrawal'
                      ? 'Withdrawn'
                      : 'Update'}
                  </span>
                  <span className="text-xs text-wire-slate">
                    {formatDateTime(change.created_at)}
                  </span>
                  <span className="text-xs text-wire-slate">
                    by {(change.users as unknown as { display_name: string } | null)?.display_name ?? 'Unknown'}
                  </span>
                </div>
                {change.change_note && (
                  <p className="text-sm text-wire-slate mt-1">{change.change_note}</p>
                )}
                {change.correction_text && (
                  <p className="text-sm text-amber-900 mt-1 italic">{change.correction_text}</p>
                )}
                {change.withdrawal_reason && (
                  <p className="text-sm text-red-800 mt-1">{change.withdrawal_reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AssetMeta({
  caption,
  credit,
  url,
}: {
  caption: string | null
  credit: string | null
  url: string
}) {
  return (
    <div className="mt-1 flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        {caption && (
          <p className="text-xs text-wire-slate">
            <span className="font-medium text-wire-navy select-none">Caption: </span>
            {caption}
          </p>
        )}
        {credit && (
          <p className="text-xs text-wire-slate">
            <span className="font-medium text-wire-navy select-none">Credit: </span>
            {credit}
          </p>
        )}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-wire-red hover:underline shrink-0"
      >
        Download ↓
      </a>
    </div>
  )
}
