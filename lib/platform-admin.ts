import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

export async function requirePlatformAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/platform-admin')

  const { data: record } = await supabase
    .from('users')
    .select('is_platform_admin, display_name, email')
    .eq('id', user.id)
    .single()

  if (!record?.is_platform_admin) redirect('/wire/library')

  return {
    user,
    adminUser: record as { is_platform_admin: boolean; display_name: string; email: string },
  }
}

export async function checkPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: record } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  return record?.is_platform_admin ?? false
}

export function createAdminSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
