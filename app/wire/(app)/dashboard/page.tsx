import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDateTime, isEmbargoActive } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
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

  const { data: stories } = await supabase
    .from('stories')
    .select(
      `
      id, title, status, source, published_at, embargo_lifts_at, created_at,
      republication_log(count),
      story_assets(id, asset_type, is_primary)
    `
    )
    .eq('organization_id', currentUser.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-bold text-wire-navy">Our Stories</h2>
        <Link
          href="/wire/dashboard/stories/new"
          className="bg-wire-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-wire-navy-light transition-colors"
        >
          + Upload story
        </Link>
      </div>

      {!stories?.length ? (
        <div className="text-center py-16 border border-dashed border-wire-border rounded-lg">
          <p className="text-wire-slate text-sm mb-4">No stories uploaded yet.</p>
          <Link
            href="/wire/dashboard/stories/new"
            className="text-sm text-wire-red hover:underline"
          >
            Upload your first story →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => {
            const repubCount =
              (story.republication_log as { count: number }[])?.[0]?.count ?? 0
            const embargoed =
              story.status === 'embargoed' && isEmbargoActive(story.embargo_lifts_at)

            return (
              <div
                key={story.id}
                className="bg-white border border-wire-border rounded p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge status={story.status} embargoed={embargoed} />
                    <span className="text-xs text-wire-slate bg-gray-100 rounded px-1.5 py-0.5">
                      {story.source === 'feed' ? 'Feed' : 'Manual'}
                    </span>
                    <span className="text-xs text-wire-slate">
                      {formatDate(story.published_at)}
                    </span>
                  </div>
                  <h3 className="font-serif font-semibold text-wire-navy leading-snug">
                    {story.title}
                  </h3>
                  {embargoed && story.embargo_lifts_at && (
                    <p className="text-xs text-amber-700 mt-1">
                      Embargo lifts {formatDateTime(story.embargo_lifts_at)}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-wire-slate">
                      {repubCount} republication{repubCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/stories/${story.id}`}
                    className="text-xs border border-wire-border rounded px-3 py-1.5 text-wire-slate hover:text-wire-navy hover:border-wire-navy transition-colors"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/dashboard/stories/${story.id}/edit`}
                    className="text-xs text-wire-slate hover:text-wire-navy"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusBadge({
  status,
  embargoed,
}: {
  status: string
  embargoed: boolean
}) {
  if (status === 'withdrawn') {
    return (
      <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 font-medium">
        Withdrawn
      </span>
    )
  }
  if (embargoed) {
    return (
      <span className="text-xs bg-amber-100 text-amber-800 rounded px-2 py-0.5 font-medium">
        Embargoed
      </span>
    )
  }
  return (
    <span className="text-xs bg-green-100 text-green-800 rounded px-2 py-0.5 font-medium">
      Available
    </span>
  )
}
