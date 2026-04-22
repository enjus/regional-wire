import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlertsManager from '@/components/dashboard/alerts-manager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Story Alerts' }

export default async function AlertsSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('id, organization_id')
    .eq('id', user.id)
    .single()

  if (!currentUser) redirect('/register')

  const [{ data: alerts }, { data: orgs }, { data: digestPrefs }] = await Promise.all([
    supabase
      .from('story_alerts')
      .select('*, followed_org:organizations!followed_organization_id(id, name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('organizations')
      .select('id, name')
      .eq('status', 'approved')
      .neq('id', currentUser.organization_id)
      .order('name'),
    supabase
      .from('user_digest_prefs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-xl font-bold text-wire-navy">Story Alerts</h2>
        <p className="text-wire-slate text-sm mt-1">
          Get notified when new stories enter the library. Alerts are batched and sent at most once per hour.
        </p>
      </div>
      <AlertsManager
        alerts={alerts ?? []}
        orgId={currentUser.organization_id}
        organizations={orgs ?? []}
        digestPrefs={digestPrefs ?? null}
      />
    </div>
  )
}
