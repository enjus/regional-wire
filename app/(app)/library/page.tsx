import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Story } from '@/lib/types'
import StoryCard from '@/components/stories/story-card'
import LibraryFilters from '@/components/stories/library-filters'

interface PageProps {
  searchParams: Promise<{
    org?: string
    from?: string
    to?: string
    source?: string
    tab?: string
    page?: string
  }>
}

const PAGE_SIZE = 20

export default async function LibraryPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!currentUser) redirect('/register')

  const page = parseInt(params.page ?? '1', 10)
  const offset = (page - 1) * PAGE_SIZE
  const tab = params.tab ?? 'library'

  // Fetch all approved orgs for filter dropdown
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('status', 'approved')
    .neq('id', currentUser.organization_id)
    .order('name')

  // ----------------------------------------------------------------
  // Headline feed tab
  // ----------------------------------------------------------------
  if (tab === 'headlines') {
    let headlineQuery = supabase
      .from('feed_headlines')
      .select('*, organizations(id, name)', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (params.org) headlineQuery = headlineQuery.eq('organization_id', params.org)

    const { data: headlines, count } = await headlineQuery
    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

    // Match headlines to library stories by canonical URL
    const headlineUrls = (headlines ?? []).map((h) => h.url).filter(Boolean)
    const libraryByUrl: Record<string, { id: string; published_at: string }> = {}
    if (headlineUrls.length > 0) {
      const { data: matchedStories } = await supabase
        .from('stories')
        .select('id, canonical_url, published_at')
        .in('canonical_url', headlineUrls)
        .in('status', ['available', 'embargoed'])
        .neq('organization_id', currentUser.organization_id)
      for (const s of matchedStories ?? []) {
        if (s.canonical_url) libraryByUrl[s.canonical_url] = { id: s.id, published_at: s.published_at }
      }
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <LibraryHeader />
        <LibraryFilters orgs={orgs ?? []} currentOrgId={currentUser.organization_id} />
        <TabNav active="headlines" />

        {!headlines?.length ? (
          <EmptyState message="No headline feed items found." />
        ) : (
          <div className="space-y-3">
            {headlines.map((h) => {
              const libraryStory = libraryByUrl[h.url] ?? null
              const maybeUpdated = libraryStory && h.published_at
                && new Date(h.published_at) > new Date(libraryStory.published_at)
              return (
                <div
                  key={h.id}
                  className="bg-white border border-wire-border rounded p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-wire-slate uppercase tracking-wide">
                        {(h.organizations as unknown as { name: string } | null)?.name}
                      </span>
                      {h.published_at && (
                        <span className="text-xs text-wire-slate">
                          ·{' '}
                          {new Date(h.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {libraryStory && (
                        <span className="text-xs bg-green-100 text-green-800 rounded px-1.5 py-0.5 font-medium">
                          In library
                        </span>
                      )}
                      {maybeUpdated && (
                        <span className="text-xs bg-amber-100 text-amber-800 rounded px-1.5 py-0.5 font-medium">
                          May have been updated
                        </span>
                      )}
                    </div>
                    <a
                      href={h.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif font-semibold text-wire-navy hover:text-wire-red transition-colors leading-snug"
                    >
                      {h.title}
                    </a>
                    {h.author && (
                      <p className="text-xs text-wire-slate mt-0.5">{h.author}</p>
                    )}
                    {h.summary && (
                      <p className="text-sm text-wire-slate mt-1 line-clamp-2">
                        {h.summary}
                      </p>
                    )}
                  </div>
                  {libraryStory ? (
                    <Link
                      href={`/library/${libraryStory.id}`}
                      className="shrink-0 text-xs font-medium bg-wire-navy text-white rounded px-3 py-1.5 hover:bg-wire-navy-light transition-colors whitespace-nowrap"
                    >
                      Republish story →
                    </Link>
                  ) : (
                    <RequestStoryButton
                      headlineId={h.id}
                      orgId={(h.organizations as { id: string } | null)?.id ?? ''}
                      orgName={(h.organizations as unknown as { name: string } | null)?.name ?? ''}
                      headline={h.title}
                      url={h.url}
                    />
                  )}
                </div>
              )
            })}</div>
        )}

        <Pagination page={page} totalPages={totalPages} params={params} />
      </div>
    )
  }

  // ----------------------------------------------------------------
  // Main library tab
  // ----------------------------------------------------------------
  let query = supabase
    .from('stories')
    .select(
      `
      id, title, byline, summary, status, source, published_at, organization_id, embargo_lifts_at,
      organizations(id, name),
      story_assets(id, file_url, asset_type, is_primary, caption)
    `,
      { count: 'exact' }
    )
    .neq('organization_id', currentUser.organization_id)
    .in('status', ['available', 'embargoed'])
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (params.org) query = query.eq('organization_id', params.org)
  if (params.source) query = query.eq('source', params.source)
  if (params.from) query = query.gte('published_at', params.from)
  if (params.to) query = query.lte('published_at', params.to + 'T23:59:59')

  const { data: stories, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <LibraryHeader />
      <LibraryFilters orgs={orgs ?? []} currentOrgId={currentUser.organization_id} />
      <TabNav active="library" />

      {!stories?.length ? (
        <EmptyState message="No stories available yet. Check back soon." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story as unknown as Story} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} params={params} />
    </div>
  )
}

function LibraryHeader() {
  return (
    <div className="mb-6">
      <h1 className="font-serif text-3xl font-bold text-wire-navy">
        Story Library
      </h1>
      <p className="text-wire-slate text-sm mt-1">
        Stories available for republication from member newsrooms.
      </p>
    </div>
  )
}

function TabNav({ active }: { active: 'library' | 'headlines' }) {
  return (
    <div className="flex gap-1 mb-6 border-b border-wire-border">
      <Link
        href="/library"
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          active === 'library'
            ? 'border-wire-red text-wire-navy'
            : 'border-transparent text-wire-slate hover:text-wire-navy'
        }`}
      >
        Available stories
      </Link>
      <Link
        href="/library?tab=headlines"
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          active === 'headlines'
            ? 'border-wire-red text-wire-navy'
            : 'border-transparent text-wire-slate hover:text-wire-navy'
        }`}
      >
        Headline feed
      </Link>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-wire-slate">
      <p className="text-sm">{message}</p>
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number
  totalPages: number
  params: Record<string, string | undefined>
}) {
  if (totalPages <= 1) return null

  const buildUrl = (p: number) => {
    const qs = new URLSearchParams(
      Object.entries({ ...params, page: String(p) }).filter(
        ([, v]) => v !== undefined
      ) as [string, string][]
    )
    return `/library?${qs}`
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      {page > 1 && (
        <Link
          href={buildUrl(page - 1)}
          className="text-sm text-wire-slate hover:text-wire-navy"
        >
          ← Previous
        </Link>
      )}
      <span className="text-sm text-wire-slate">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={buildUrl(page + 1)}
          className="text-sm text-wire-slate hover:text-wire-navy"
        >
          Next →
        </Link>
      )}
    </div>
  )
}

function RequestStoryButton({
  headlineId,
  orgId,
  orgName,
  headline,
  url,
}: {
  headlineId: string
  orgId: string
  orgName: string
  headline: string
  url: string
}) {
  // Client interaction handled via a client component wrapper below
  // For server rendering we output a link to the request flow
  return (
    <Link
      href={`/dashboard/requests/new?org=${orgId}&headline=${encodeURIComponent(headline)}&url=${encodeURIComponent(url)}`}
      className="shrink-0 text-xs font-medium border border-wire-navy text-wire-navy rounded px-3 py-1.5 hover:bg-wire-navy hover:text-white transition-colors whitespace-nowrap"
    >
      Request story
    </Link>
  )
}
