import { requirePlatformAdmin, createAdminSupabase } from '@/lib/platform-admin'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Stories — Admin' }

const STATUS_OPTIONS = ['all', 'available', 'embargoed', 'withdrawn'] as const

const statusBadge: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  embargoed: 'bg-amber-100 text-amber-800',
  withdrawn: 'bg-gray-100 text-gray-600',
}

export default async function AdminStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requirePlatformAdmin()
  const supabase = createAdminSupabase()

  const { status = 'all' } = await searchParams

  let query = supabase
    .from('stories')
    .select('id, title, byline, status, source, published_at, organizations(name)')
    .order('published_at', { ascending: false })
    .limit(100)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: stories } = await query

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-bold text-slate-900 mb-6">Stories</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={
              s === 'all' ? '/platform-admin/stories' : `/platform-admin/stories?status=${s}`
            }
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              status === s
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-gray-200 text-slate-600 hover:border-slate-400'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {!stories?.length ? (
          <p className="text-sm text-slate-500 p-6">No stories found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Org
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Source
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Published
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stories.map((story) => {
                  const orgName = (
                    story.organizations as unknown as { name: string } | null
                  )?.name
                  return (
                    <tr key={story.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <Link
                          href={`/wire/library/${story.id}`}
                          target="_blank"
                          className="font-medium text-slate-900 hover:text-wire-red line-clamp-1"
                        >
                          {story.title}
                        </Link>
                        <p className="text-xs text-slate-400">{story.byline}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {orgName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge[story.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {story.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{story.source}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(story.published_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(stories?.length ?? 0) === 100 && (
        <p className="text-xs text-slate-400 mt-3">Showing most recent 100 stories.</p>
      )}
    </div>
  )
}
