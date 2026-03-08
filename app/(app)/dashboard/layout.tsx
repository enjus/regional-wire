import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('role, organization_id, organizations(name)')
    .eq('id', user.id)
    .single()

  const isAdmin = currentUser?.role === 'admin'
  const orgName = (currentUser?.organizations as unknown as { name: string } | null)?.name

  const { count: pendingRequestCount } = await supabase
    .from('republication_requests')
    .select('id', { count: 'exact', head: true })
    .eq('target_org_id', currentUser?.organization_id)
    .eq('status', 'pending')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-wire-navy">{orgName}</h1>
        <p className="text-wire-slate text-sm">Newsroom Dashboard</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="hidden sm:block w-48 shrink-0">
          <ul className="space-y-1">
            <SidebarLink href="/dashboard" label="Our Stories" exact />
            <SidebarLink href="/dashboard/requests" label="Requests" badge={pendingRequestCount ?? 0} />
            <SidebarLink href="/dashboard/republished" label="Republished" />
            <SidebarLink href="/dashboard/log" label="Activity Log" />
            {isAdmin && (
              <>
                <li className="pt-3 pb-1">
                  <span className="text-xs text-wire-slate font-medium uppercase tracking-wide">
                    Admin
                  </span>
                </li>
                <SidebarLink href="/dashboard/settings" label="Settings" />
                <SidebarLink href="/dashboard/settings/feeds" label="Feeds" />
                <SidebarLink href="/dashboard/settings/alerts" label="Alerts" />
              </>
            )}
          </ul>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}

function SidebarLink({
  href,
  label,
  exact,
  badge,
}: {
  href: string
  label: string
  exact?: boolean
  badge?: number
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between px-3 py-2 rounded text-sm text-wire-slate hover:text-wire-navy hover:bg-wire-bg transition-colors"
      >
        {label}
        {badge != null && badge > 0 && (
          <span className="ml-2 bg-wire-red text-white text-xs font-medium rounded-full px-1.5 py-0.5 leading-none">
            {badge}
          </span>
        )}
      </Link>
    </li>
  )
}
