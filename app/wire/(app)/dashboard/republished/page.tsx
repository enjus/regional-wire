import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import RepublishedUrlUpdater from '@/components/dashboard/republished-url-updater'
import Pagination from '@/components/ui/pagination'

export const metadata = { title: 'Stories We\'ve Republished' }

const PAGE_SIZE = 25

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function RepublishedPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('organization_id, organizations(website_url)')
    .eq('id', user.id)
    .single()

  if (!currentUser) redirect('/register')

  const orgWebsiteUrl = (currentUser.organizations as unknown as { website_url: string } | null)?.website_url ?? null

  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const { data: log, count } = await supabase
    .from('republication_log')
    .select('*, stories(id, title, organizations(name))', { count: 'exact' })
    .eq('republishing_org_id', currentUser.organization_id)
    .order('downloaded_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-wire-navy mb-6">
        Stories We&apos;ve Republished
      </h2>

      {!log?.length ? (
        <p className="text-sm text-wire-slate">
          You haven&apos;t downloaded any republication packages yet.
        </p>
      ) : (
        <div className="space-y-3">
          {log.map((entry) => {
            const story = entry.stories as {
              id: string
              title: string
              organizations: { name: string } | null
            } | null

            return (
              <div
                key={entry.id}
                className="bg-white border border-wire-border rounded p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-wire-slate mb-0.5">
                      {story?.organizations?.name}
                    </p>
                    <p className="font-serif font-semibold text-wire-navy leading-snug">
                      {story?.title ?? 'Unknown story'}
                    </p>
                    <p className="text-xs text-wire-slate mt-1">
                      Downloaded {formatDateTime(entry.downloaded_at)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {entry.republished_url ? (
                      <a
                        href={entry.republished_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-wire-red hover:underline"
                      >
                        {entry.republished_url.slice(0, 40)}…
                      </a>
                    ) : null}
                  </div>
                </div>
                <RepublishedUrlUpdater
                  logId={entry.id}
                  currentUrl={entry.republished_url}
                  orgWebsiteUrl={orgWebsiteUrl}
                />
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/wire/dashboard/republished" />
    </div>
  )
}
