import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrgSettingsForm from '@/components/dashboard/org-settings-form'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!currentUser) redirect('/register')

  if (currentUser.role !== 'admin') {
    return (
      <div className="text-sm text-wire-slate">
        Only org admins can manage settings.
      </div>
    )
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', currentUser.organization_id)
    .single()

  if (!org) redirect('/wire/dashboard')

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-wire-navy mb-6">
        Organization Settings
      </h2>
      <OrgSettingsForm org={org} />
    </div>
  )
}
