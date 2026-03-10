import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Post-login landing: routes the user to the right destination based on account type.
export default async function AuthLandingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: record } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (record?.is_platform_admin) {
    redirect('/platform-admin')
  }

  redirect('/wire/library')
}
