import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieOption = Record<string, unknown>

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const rawNext = searchParams.get('next') ?? '/wire/library'
  // Only allow relative paths to prevent open redirect attacks
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/wire/library'

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

  // Three ways to arrive here:
  // 1. code  — PKCE flow (OAuth or PKCE magic link)
  // 2. token_hash + type — token-hash flow (confirm page click or direct OTP)
  // 3. neither — session already set by client-side verifyOtp; just do user setup
  let userId: string
  let userEmail: string | undefined
  let userMeta: Record<string, unknown> | undefined

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth-failed`)
    }
    userId = data.user.id
    userEmail = data.user.email
    userMeta = data.user.user_metadata
  } else if (tokenHash && type) {
    // Accept 'email' (OTP code flow) and 'magiclink' (token_hash flow).
    // Rejecting other values prevents token reuse across unrelated flow types.
    if (type !== 'email' && type !== 'magiclink') {
      return NextResponse.redirect(`${origin}/login?error=auth-failed`)
    }
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type === 'magiclink' ? 'magiclink' : 'email',
    })
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth-failed`)
    }
    userId = data.user.id
    userEmail = data.user.email
    userMeta = data.user.user_metadata
  } else {
    // Session was established client-side (OTP code entered in browser)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=missing-code`)
    }
    userId = user.id
    userEmail = user.email
    userMeta = user.user_metadata
  }

  // Check if user already has a users record
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (existingUser) {
    // Redirect platform admins to their dedicated dashboard
    const { data: record } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', userId)
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
  const domain = userEmail?.split('@')[1]?.toLowerCase()

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

  let org = orgs?.[0] ?? null

  if (!org && userEmail) {
    const { data: allowedOrgs } = await serviceSupabase
      .from('organizations')
      .select('id')
      .eq('status', 'approved')
      .contains('allowed_emails', [userEmail.toLowerCase()])
      .limit(1)
    org = allowedOrgs?.[0] ?? null
  }

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
    id: userId,
    organization_id: org.id,
    display_name: userMeta?.name ?? userEmail ?? 'User',
    email: userEmail!,
    role,
  })

  // Send welcome email (fire-and-forget)
  fetch(`${origin}/api/auth/welcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  }).catch(() => {})

  return NextResponse.redirect(`${origin}${next}`)
}
