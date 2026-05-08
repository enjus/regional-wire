import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import LogDateFilter from '@/components/dashboard/log-date-filter'

export const metadata = { title: 'Activity Log' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function ActivityLogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const fromDate = params.from ?? ''
  const toDate = params.to ?? ''

  const supabase = await createClient()
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

  // First get this org's story IDs
  const { data: orgStories } = await supabase
    .from('stories')
    .select('id')
    .eq('organization_id', currentUser.organization_id)

  const storyIds = orgStories?.map((s) => s.id) ?? []

  // Build both queries with shared date filters, run in parallel
  type LogRow = {
    id: string
    story_id: string | null
    republishing_org_id: string
    republished_url: string | null
    downloaded_at: string
    stories: { title: string } | null
    organizations: { name: string } | null
  }

  let analyticsQuery = supabase
    .from('republication_log')
    .select('id, story_id, republishing_org_id, republished_url, downloaded_at, stories(title), organizations:republishing_org_id(name)')
    .order('downloaded_at', { ascending: false })

  let logQuery = supabase
    .from('republication_log')
    .select('*, stories(title), organizations:republishing_org_id(name)')
    .order('downloaded_at', { ascending: false })
    .limit(100)

  if (storyIds.length) {
    analyticsQuery = analyticsQuery.in('story_id', storyIds) as typeof analyticsQuery
    logQuery = logQuery.in('story_id', storyIds) as typeof logQuery
  }
  if (fromDate) {
    analyticsQuery = analyticsQuery.gte('downloaded_at', fromDate) as typeof analyticsQuery
    logQuery = logQuery.gte('downloaded_at', fromDate) as typeof logQuery
  }
  if (toDate) {
    analyticsQuery = analyticsQuery.lte('downloaded_at', toDate + 'T23:59:59') as typeof analyticsQuery
    logQuery = logQuery.lte('downloaded_at', toDate + 'T23:59:59') as typeof logQuery
  }

  const [{ data: analyticsRaw }, { data: rawLog }] = storyIds.length
    ? await Promise.all([analyticsQuery, logQuery])
    : [{ data: [] as LogRow[] }, { data: [] as LogRow[] }]

  // Deduplicate analytics: one entry per (story, republishing org).
  // Prefer entry with a published URL; otherwise keep most recent (DESC order).
  const analyticsSeen = new Map<string, LogRow>()
  for (const entry of (analyticsRaw ?? []) as LogRow[]) {
    const key = `${entry.story_id ?? '__deleted__'}:${entry.republishing_org_id}`
    const existing = analyticsSeen.get(key)
    if (!existing || (!existing.republished_url && entry.republished_url)) {
      analyticsSeen.set(key, entry)
    }
  }
  const dedupedEntries = Array.from(analyticsSeen.values())

  // Compute summary stats from deduplicated entries
  const totalRepublications = dedupedEntries.length
  const uniqueNewsrooms = new Set(dedupedEntries.map((e) => e.republishing_org_id)).size
  const publishedUrlCount = dedupedEntries.filter((e) => e.republished_url).length

  const storyCountMap = new Map<string, { title: string; count: number }>()
  for (const entry of dedupedEntries) {
    const key = entry.story_id ?? '__deleted__'
    const title = entry.stories?.title ?? 'Deleted story'
    const ex = storyCountMap.get(key)
    storyCountMap.set(key, { title, count: (ex?.count ?? 0) + 1 })
  }
  const topStories = Array.from(storyCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const orgCountMap = new Map<string, { name: string; count: number }>()
  for (const entry of dedupedEntries) {
    const name =
      (entry.organizations as unknown as { name: string } | null)?.name ?? 'Unknown'
    const ex = orgCountMap.get(entry.republishing_org_id)
    orgCountMap.set(entry.republishing_org_id, { name, count: (ex?.count ?? 0) + 1 })
  }
  const topOrgs = Array.from(orgCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Deduplicate flat log display (same logic, applied to the 100-item fetch)
  const seen = new Map<string, NonNullable<typeof rawLog>[0]>()
  for (const entry of rawLog ?? []) {
    const key = `${entry.story_id}:${entry.republishing_org_id}`
    const existing = seen.get(key)
    if (!existing || (!existing.republished_url && entry.republished_url)) {
      seen.set(key, entry)
    }
  }
  const outgoingLog = Array.from(seen.values())

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-wire-navy mb-1">
        Activity Log
      </h2>
      <p className="text-sm text-wire-slate mb-6">
        Every republication package download from your stories.
      </p>

      <Suspense fallback={<div className="h-10 mb-6" />}>
        <LogDateFilter />
      </Suspense>

      {/* Analytics summary */}
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-wire-border rounded p-4">
            <p className="text-xs font-medium text-wire-slate mb-1">Republications</p>
            <p className="text-2xl font-bold text-wire-navy">{totalRepublications}</p>
          </div>
          <div className="bg-white border border-wire-border rounded p-4">
            <p className="text-xs font-medium text-wire-slate mb-1">Unique Newsrooms</p>
            <p className="text-2xl font-bold text-wire-navy">{uniqueNewsrooms}</p>
          </div>
          <div className="bg-white border border-wire-border rounded p-4">
            <p className="text-xs font-medium text-wire-slate mb-1">Published URLs Reported</p>
            <p className="text-2xl font-bold text-wire-navy">{publishedUrlCount}</p>
          </div>
        </div>

        {dedupedEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-medium text-wire-slate uppercase tracking-wide mb-2">
                Top Stories
              </h3>
              <div className="space-y-1">
                {topStories.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white border border-wire-border rounded px-3 py-2"
                  >
                    <p className="text-sm text-wire-navy truncate mr-3">{s.title}</p>
                    <span className="text-xs font-medium text-wire-slate shrink-0">
                      {s.count} {s.count === 1 ? 'republication' : 'republications'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-wire-slate uppercase tracking-wide mb-2">
                Top Republishing Newsrooms
              </h3>
              <div className="space-y-1">
                {topOrgs.map((o, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white border border-wire-border rounded px-3 py-2"
                  >
                    <p className="text-sm text-wire-navy truncate mr-3">{o.name}</p>
                    <span className="text-xs font-medium text-wire-slate shrink-0">
                      {o.count} {o.count === 1 ? 'republication' : 'republications'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-wire-slate">
            {fromDate || toDate ? 'No activity in this date range.' : 'No activity yet.'}
          </p>
        )}
      </div>

      {/* Flat log */}
      {outgoingLog.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-wire-slate uppercase tracking-wide mb-2">
            Download Log
          </h3>
          <div className="space-y-2">
            {outgoingLog.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-wire-border rounded px-4 py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-wire-navy">
                    {(entry.stories as { title: string } | null)?.title ?? 'Unknown story'}
                  </p>
                  <p className="text-xs text-wire-slate mt-0.5">
                    Downloaded by{' '}
                    {(entry.organizations as unknown as { name: string } | null)?.name ?? 'Unknown'}{' '}
                    · {formatDateTime(entry.downloaded_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {entry.republished_url ? (
                    <a
                      href={entry.republished_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-wire-red hover:underline"
                    >
                      Published ↗
                    </a>
                  ) : (
                    <span className="text-xs text-wire-slate">URL pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
