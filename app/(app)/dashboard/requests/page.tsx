import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import RequestActions from '@/components/dashboard/request-actions'

export const metadata = { title: 'Requests' }

export default async function RequestsPage() {
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

  const { data: incoming } = await supabase
    .from('republication_requests')
    .select(
      `
      *,
      requesting_org:requesting_org_id(name),
      story:story_id(id, title)
    `
    )
    .eq('target_org_id', currentUser.organization_id)
    .order('created_at', { ascending: false })

  const pending = incoming?.filter((r) => r.status === 'pending') ?? []
  const resolved = incoming?.filter((r) => r.status !== 'pending') ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-bold text-wire-navy">
          Incoming Requests
        </h2>
        <Link
          href="/dashboard/requests/outgoing"
          className="text-sm text-wire-slate hover:text-wire-navy"
        >
          View outgoing →
        </Link>
      </div>

      {pending.length === 0 && resolved.length === 0 ? (
        <p className="text-sm text-wire-slate">No republication requests yet.</p>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-wire-navy uppercase tracking-wide mb-3">
                Pending ({pending.length})
              </h3>
              <div className="space-y-3">
                {pending.map((req) => (
                  <RequestCard key={req.id} req={req} showActions />
                ))}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-wire-navy uppercase tracking-wide mb-3">
                Resolved
              </h3>
              <div className="space-y-3">
                {resolved.map((req) => (
                  <RequestCard key={req.id} req={req} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RequestCard({
  req,
  showActions,
}: {
  req: {
    id: string
    status: string
    requesting_org: { name: string } | null
    requested_headline: string | null
    requested_url: string | null
    message: string | null
    created_at: string
    story: { id: string; title: string } | null
    decline_reason: string | null
  }
  showActions?: boolean
}) {
  const requestingOrg = (req.requesting_org as unknown as { name: string } | null)?.name ?? 'Unknown'
  const story = req.story as { id: string; title: string } | null
  const headline = story?.title ?? req.requested_headline ?? 'Untitled'

  return (
    <div className="bg-white border border-wire-border rounded p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-wire-navy">{requestingOrg}</span>
            <span className="text-xs text-wire-slate">·</span>
            <span className="text-xs text-wire-slate">{formatDate(req.created_at)}</span>
            <StatusPill status={req.status} />
          </div>
          <p className="font-serif font-semibold text-wire-navy leading-snug">
            {headline}
          </p>
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
          {req.message && (
            <p className="text-sm text-wire-slate mt-2 italic">
              &ldquo;{req.message}&rdquo;
            </p>
          )}
          {req.decline_reason && (
            <p className="text-xs text-wire-slate mt-1">
              Declined: {req.decline_reason}
            </p>
          )}
        </div>

        {showActions && req.status === 'pending' && (
          <RequestActions
            requestId={req.id}
            storyId={story?.id ?? null}
            requestedHeadline={headline}
            requestedUrl={req.requested_url}
          />
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    fulfilled: 'bg-green-100 text-green-800',
    declined: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs rounded px-2 py-0.5 font-medium ${styles[status] ?? ''}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
