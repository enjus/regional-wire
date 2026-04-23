import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDateTime, isEmbargoActive } from '@/lib/utils'
import StoryWithdrawButton from '@/components/stories/story-withdraw-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StoryManagePage({ params }: PageProps) {
  const { id } = await params
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

  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .eq('organization_id', currentUser.organization_id)
    .single()

  if (!story) notFound()

  const { data: log } = await supabase
    .from('republication_log')
    .select('*, organizations(name)')
    .eq('story_id', id)
    .order('downloaded_at', { ascending: false })

  const { data: storyChanges } = await supabase
    .from('story_changes')
    .select('*, users(display_name)')
    .eq('story_id', id)
    .order('created_at', { ascending: false })

  const embargoed = story.status === 'embargoed' && isEmbargoActive(story.embargo_lifts_at)

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/wire/dashboard"
          className="text-sm text-wire-slate hover:text-wire-navy"
        >
          ← Our Stories
        </Link>
      </div>

      <div className="bg-white border border-wire-border rounded p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-bold text-wire-navy leading-tight mb-2">
              {story.title}
            </h2>
            <p className="text-wire-slate text-sm">{story.byline}</p>
            <p className="text-xs text-wire-slate mt-1">
              {formatDate(story.published_at)}
            </p>
            {story.canonical_url && (
              <a
                href={story.canonical_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-wire-red hover:underline mt-1 inline-block"
              >
                View original ↗
              </a>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/wire/dashboard/stories/${id}/edit`}
              className="text-sm border border-wire-border rounded px-3 py-1.5 text-wire-slate hover:text-wire-navy hover:border-wire-navy transition-colors"
            >
              Edit
            </Link>
            {story.status !== 'withdrawn' && (
              <StoryWithdrawButton storyId={id} />
            )}
          </div>
        </div>

        {story.summary && (
          <div className="mt-4 pt-4 border-t border-wire-border">
            <p className="text-sm text-wire-slate leading-relaxed">{story.summary}</p>
          </div>
        )}

        {embargoed && story.embargo_lifts_at && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded p-3">
            <p className="text-sm text-amber-800">
              Embargoed until {formatDateTime(story.embargo_lifts_at)}
            </p>
          </div>
        )}

        {story.special_instructions && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-xs font-semibold text-blue-800 mb-1">
              Special Instructions
            </p>
            <p className="text-sm text-blue-900">{story.special_instructions}</p>
          </div>
        )}
      </div>

      {/* Republication log */}
      <div>
        <h3 className="font-serif text-lg font-bold text-wire-navy mb-4">
          Republication Log
        </h3>

        {!log?.length ? (
          <p className="text-sm text-wire-slate">
            This story hasn&apos;t been republished yet.
          </p>
        ) : (
          <div className="space-y-3">
            {log.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-wire-border rounded p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-wire-navy">
                    {(entry.organizations as unknown as { name: string } | null)?.name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-wire-slate mt-0.5">
                    Downloaded {formatDateTime(entry.downloaded_at)}
                  </p>
                  {entry.republished_url && (
                    <a
                      href={entry.republished_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-wire-red hover:underline mt-1 block"
                    >
                      {entry.republished_url}
                    </a>
                  )}
                </div>
                {!entry.republished_url && (
                  <span className="text-xs text-wire-slate bg-gray-50 border border-wire-border rounded px-2 py-0.5">
                    URL pending
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change history */}
      {storyChanges && storyChanges.length > 0 && (
        <div className="mt-8">
          <h3 className="font-serif text-lg font-bold text-wire-navy mb-4">
            Change History
          </h3>
          <div className="space-y-3">
            {storyChanges.map((change) => (
              <div
                key={change.id}
                className="bg-white border border-wire-border rounded p-4"
              >
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
