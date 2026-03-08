import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlertsManager from '@/components/dashboard/alerts-manager'

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

  const { data: alerts } = await supabase
    .from('story_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-xl font-bold text-wire-navy">Story Alerts</h2>
        <p className="text-wire-slate text-sm mt-1">
          Get notified when new stories matching your keywords enter the library.
        </p>
      </div>
      <AlertsManager alerts={alerts ?? []} orgId={currentUser.organization_id} />
    </div>
  )
}
