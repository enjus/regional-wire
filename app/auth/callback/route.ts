import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendUserPendingApprovalEmail } from '@/lib/email'

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

  // Use service role for all DB operations in this handler — more reliable than
  // the anon client (bypasses RLS, avoids session-cookie timing issues) and lets
  // us distinguish a genuine "no rows" result from a transient Supabase error.
  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Single query for id, status, and platform-admin flag (avoids a second round-trip)
  const { data: existingUser, error: existingUserError } = await serviceSupabase
    .from('users')
    .select('id, status, is_platform_admin')
    .eq('id', userId)
    .single()

  // PGRST116 = "no rows returned" — anything else is a real DB error.
  // Don't fall through to user-creation on a real error: the record may already
  // exist and the INSERT would fail, signing the user out and showing "no-org".
  if (existingUserError && existingUserError.code !== 'PGRST116') {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`)
  }

  if (existingUser) {
    if (existingUser.status === 'pending') {
      return NextResponse.redirect(`${origin}/pending`)
    }
    if (existingUser.is_platform_admin) {
      return NextResponse.redirect(`${origin}/platform-admin`)
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Atomically consume an open invite for this email. Using UPDATE + RETURNING
  // means only one concurrent request can win — the second sees no rows back
  // because used_at is no longer NULL after the first write.
  let inviteOrgId: string | null = null

  if (userEmail) {
    const { data: claimed } = await serviceSupabase
      .from('org_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('email', userEmail.toLowerCase())
      .is('used_at', null)
      .select('id, org_id')

    if (claimed && claimed.length > 0) {
      inviteOrgId = claimed[0].org_id as string
    }
  }

  // Determine which org this user belongs to
  let org: { id: string; name: string } | null = null

  if (inviteOrgId) {
    const { data: inviteOrg } = await serviceSupabase
      .from('organizations')
      .select('id, name')
      .eq('id', inviteOrgId)
      .eq('status', 'approved')
      .maybeSingle()
    org = inviteOrg
  }

  if (!org) {
    // Fall back to domain / allowed_emails match
    const domain = userEmail?.split('@')[1]?.toLowerCase()

    if (!domain) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/register?error=no-org`)
    }

    const { data: orgs } = await serviceSupabase
      .from('organizations')
      .select('id, name')
      .eq('email_domain', domain)
      .eq('status', 'approved')
      .limit(1)

    org = orgs?.[0] ?? null

    if (!org && userEmail) {
      const { data: allowedOrgs } = await serviceSupabase
        .from('organizations')
        .select('id, name')
        .eq('status', 'approved')
        .contains('allowed_emails', [userEmail.toLowerCase()])
        .limit(1)
      org = allowedOrgs?.[0] ?? null
    }
  }

  if (!org) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/register?error=no-org`)
  }

  // Count only active users for the first-user/admin check. If the org has no
  // active users yet (everyone else is pending), this new user becomes admin.
  const { count } = await serviceSupabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('status', 'active')

  const role = count === 0 ? 'admin' : 'editor'

  // Invited users and the first active user per org are immediately active;
  // all other self-registered users start pending until an admin approves them.
  const status = (inviteOrgId || count === 0) ? 'active' : 'pending'

  const displayName = (userMeta?.name as string | undefined) ?? userEmail ?? 'User'

  const { error: insertError } = await serviceSupabase.from('users').insert({
    id: userId,
    organization_id: org.id,
    display_name: displayName,
    email: userEmail!,
    role,
    status,
  })

  if (insertError) {
    // Insert failed (e.g. the user already exists in another org, or a DB error).
    // Sign out to avoid leaving the user in a broken state.
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/register?error=no-org`)
  }

  if (status === 'active') {
    // Send welcome email (fire-and-forget)
    fetch(`${origin}/api/auth/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {})

    return NextResponse.redirect(`${origin}${next}`)
  }

  // Pending user: notify org admins inline (fire-and-forget, non-blocking)
  const orgName = org.name
  ;(async () => {
    const { data: admins } = await serviceSupabase
      .from('users')
      .select('email')
      .eq('organization_id', org.id)
      .eq('role', 'admin')
      .eq('status', 'active')
    const adminEmails = (admins ?? []).map((a: { email: string }) => a.email)
    if (adminEmails.length > 0) {
      await sendUserPendingApprovalEmail(adminEmails, displayName, userEmail!, orgName)
    }
  })().catch(() => {})

  return NextResponse.redirect(`${origin}/pending`)
}
