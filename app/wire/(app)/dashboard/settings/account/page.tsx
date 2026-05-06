import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountSettingsForm from '@/components/dashboard/account-settings-form'

export const dynamic = 'force-dynamic'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  if (!data) redirect('/onboard')

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-wire-navy mb-6">Profile</h2>
      <AccountSettingsForm displayName={data.display_name} email={data.email} />
    </div>
  )
}
