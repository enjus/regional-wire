import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieOption = Record<string, unknown>

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/wire/library'
  // Only allow relative paths to prevent open redirect attacks
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/wire/library'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing-code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOption }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`)
  }

  // Check if user already has a users record
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', data.user.id)
    .single()

  if (existingUser) {
    // Redirect platform admins to their dedicated dashboard
    const { data: record } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', data.user.id)
      .single()
    if (record?.is_platform_admin) {
      return NextResponse.redirect(`${origin}/platform-admin`)
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Use service role for org lookup and user creation (bypasses RLS)
  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Look up their org by email domain
  const domain = data.user.email?.split('@')[1]?.toLowerCase()

  if (!domain) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/register?error=no-org`)
  }

  const { data: orgs } = await serviceSupabase
    .from('organizations')
    .select('id')
    .eq('email_domain', domain)
    .eq('status', 'approved')
    .limit(1)

  const org = orgs?.[0] ?? null

  if (!org) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/register?error=no-org`)
  }

  // Check if this is the first user for this org (make them admin)
  const { count } = await serviceSupabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)

  const role = count === 0 ? 'admin' : 'editor'

  await serviceSupabase.from('users').insert({
    id: data.user.id,
    organization_id: org.id,
    display_name: data.user.user_metadata?.name ?? data.user.email ?? 'User',
    email: data.user.email!,
    role,
  })

  // Send welcome email (fire-and-forget)
  fetch(`${origin}/api/auth/welcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: data.user.id }),
  }).catch(() => {})

  return NextResponse.redirect(`${origin}${next}`)
}
