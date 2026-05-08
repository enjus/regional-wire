import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import Pagination from '@/components/ui/pagination'

export const metadata = { title: 'Outgoing Requests' }

const PAGE_SIZE = 25

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function OutgoingRequestsPage({ searchParams }: PageProps) {
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

  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const { data: requests, count } = await supabase
    .from('republication_requests')
    .select(
      `
      *,
      target_org:target_org_id(name),
      story:story_id(id, title)
    `,
      { count: 'exact' }
    )
    .eq('requesting_org_id', currentUser.organization_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-bold text-wire-navy">Outgoing Requests</h2>
        <Link
          href="/wire/dashboard/requests"
          className="text-sm text-wire-slate hover:text-wire-navy"
        >
          ← Incoming requests
        </Link>
      </div>

      {!requests?.length ? (
        <p className="text-sm text-wire-slate">
          You haven&apos;t made any republication requests yet.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const targetOrg = (req.target_org as unknown as { name: string } | null)?.name ?? 'Unknown'
            const story = req.story as { id: string; title: string } | null
            const headline = story?.title ?? req.requested_headline ?? 'Untitled'

            return (
              <div key={req.id} className="bg-white border border-wire-border rounded p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-wire-navy">
                        {targetOrg}
                      </span>
                      <span className="text-xs text-wire-slate">·</span>
                      <span className="text-xs text-wire-slate">
                        {formatDate(req.created_at)}
                      </span>
                    </div>
                    <p className="font-serif font-semibold text-wire-navy">{headline}</p>
                    {req.requested_url && (
                      <a
                        href={req.requested_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-wire-red hover:underline"
                      >
                        {req.requested_url}
                      </a>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`text-xs rounded px-2 py-0.5 font-medium ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'fulfilled'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                    {req.status === 'fulfilled' && story && (
                      <Link
                        href={`/wire/library/${story.id}`}
                        className="block text-xs text-wire-red hover:underline mt-1"
                      >
                        View story →
                      </Link>
                    )}
                  </div>
                </div>
                {req.decline_reason && (
                  <p className="text-xs text-wire-slate mt-2">
                    Reason: {req.decline_reason}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/wire/dashboard/requests/outgoing" />
    </div>
  )
}
