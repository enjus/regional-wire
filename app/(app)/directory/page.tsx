import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Member Directory' }

export default async function DirectoryPage() {
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

  const { data: orgs } = await supabase
    .from('organizations')
    .select(
      `
      id, name, website_url, description, contact_emails,
      stories_count:stories(count),
      feeds_count:org_feeds(count)
    `
    )
    .eq('status', 'approved')
    .order('name')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-wire-navy">Member Directory</h1>
        <p className="text-wire-slate text-sm mt-1">
          {orgs?.length ?? 0} member newsroom{orgs?.length !== 1 ? 's' : ''}. Contact
          emails are visible to authenticated members only.
        </p>
      </div>

      <div className="space-y-4">
        {orgs?.map((org) => {
          const storiesCount =
            (org.stories_count as { count: number }[])?.[0]?.count ?? 0
          const feedsCount =
            (org.feeds_count as { count: number }[])?.[0]?.count ?? 0
          const isOwnOrg = org.id === currentUser.organization_id

          return (
            <div
              key={org.id}
              className={`bg-white border rounded p-5 ${
                isOwnOrg ? 'border-wire-navy/30' : 'border-wire-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-serif text-xl font-bold text-wire-navy">
                      {org.name}
                    </h2>
                    {isOwnOrg && (
                      <span className="text-xs bg-wire-navy text-white rounded px-2 py-0.5">
                        Your org
                      </span>
                    )}
                  </div>

                  {org.description && (
                    <p className="text-sm text-wire-slate leading-relaxed mt-1">
                      {org.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-wire-slate">
                    <span>{storiesCount} stories shared</span>
                    {feedsCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {feedsCount} active feed{feedsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <p className="text-xs text-wire-slate">
                      <span className="font-medium text-wire-navy">Contact: </span>
                      {org.contact_emails.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <a
                    href={org.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-wire-red hover:underline block"
                  >
                    Website ↗
                  </a>
                  {!isOwnOrg && storiesCount > 0 && (
                    <Link
                      href={`/library?org=${org.id}`}
                      className="text-xs text-wire-slate hover:text-wire-navy block mt-1"
                    >
                      View stories →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
