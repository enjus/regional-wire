import { requirePlatformAdmin, createAdminSupabase } from '@/lib/platform-admin'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { brand } from '@/lib/brand'

export const dynamic = 'force-dynamic'
export const metadata = { title: `Admin Overview — ${brand.name}` }

export default async function PlatformAdminPage() {
  await requirePlatformAdmin()
  const supabase = createAdminSupabase()

  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: storyCount },
    { count: userCount },
    { data: pendingOrgs },
    { data: recentStories },
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'available'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('id, name, email_domain, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('stories')
      .select('id, title, status, published_at, organizations(name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const stats = [
    {
      label: 'Pending Applications',
      value: pendingCount ?? 0,
      href: '/platform-admin/orgs',
      highlight: (pendingCount ?? 0) > 0,
    },
    {
      label: 'Approved Members',
      value: approvedCount ?? 0,
      href: '/platform-admin/orgs',
      highlight: false,
    },
    {
      label: 'Available Stories',
      value: storyCount ?? 0,
      href: '/platform-admin/stories',
      highlight: false,
    },
    {
      label: 'Total Users',
      value: userCount ?? 0,
      href: '/platform-admin/users',
      highlight: false,
    },
  ]

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-bold text-slate-900 mb-6">Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, href, highlight }) => (
          <Link
            key={label}
            href={href}
            className={`rounded-lg p-5 border transition-colors ${
              highlight
                ? 'border-wire-red bg-red-50 hover:bg-red-100'
                : 'border-gray-200 bg-white hover:border-slate-300'
            }`}
          >
            <p
              className={`text-3xl font-bold ${
                highlight ? 'text-wire-red' : 'text-slate-900'
              }`}
            >
              {value}
            </p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending applications */}
        <section>
          <h2 className="font-semibold text-slate-900 mb-3">
            Pending Applications
            <Link
              href="/platform-admin/orgs"
              className="ml-2 text-xs text-wire-red hover:underline font-normal"
            >
              View all →
            </Link>
          </h2>
          {!pendingOrgs?.length ? (
            <p className="text-sm text-slate-500 bg-white border border-gray-200 rounded p-4">
              No pending applications.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingOrgs.map((org) => (
                <div key={org.id} className="bg-white border border-gray-200 rounded p-3">
                  <p className="text-sm font-medium text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">
                    {org.email_domain} · {formatDate(org.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent stories */}
        <section>
          <h2 className="font-semibold text-slate-900 mb-3">
            Recent Stories
            <Link
              href="/platform-admin/stories"
              className="ml-2 text-xs text-wire-red hover:underline font-normal"
            >
              View all →
            </Link>
          </h2>
          {!recentStories?.length ? (
            <p className="text-sm text-slate-500 bg-white border border-gray-200 rounded p-4">
              No stories yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentStories.map((story) => {
                const orgName = (
                  story.organizations as unknown as { name: string } | null
                )?.name
                return (
                  <div key={story.id} className="bg-white border border-gray-200 rounded p-3">
                    <p className="text-sm font-medium text-slate-900 truncate">{story.title}</p>
                    <p className="text-xs text-slate-500">
                      {orgName} · {story.status} · {formatDate(story.published_at)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
