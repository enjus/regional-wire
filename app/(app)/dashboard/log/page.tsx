import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Activity Log' }

export default async function ActivityLogPage() {
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

  // Get all log entries for stories this org originated
  const { data: outgoingLog } = storyIds.length
    ? await supabase
        .from('republication_log')
        .select(
          `
          *,
          stories(title),
          organizations:republishing_org_id(name)
        `
        )
        .in('story_id', storyIds)
        .order('downloaded_at', { ascending: false })
        .limit(100)
    : { data: [] }

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-wire-navy mb-6">
        Activity Log
      </h2>
      <p className="text-sm text-wire-slate mb-4">
        Every republication package download from your stories.
      </p>

      {!outgoingLog?.length ? (
        <p className="text-sm text-wire-slate">No activity yet.</p>
      ) : (
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
      )}
    </div>
  )
}
