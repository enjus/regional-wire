import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendUserWelcomeEmail, sendUserPendingApprovalEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id
  const userEmail = user.email

  const serviceSupabase = createServiceClient()

  // Idempotent: if the user already has a row, just redirect them in.
  const { data: existingUser } = await serviceSupabase
    .from('users')
    .select('status')
    .eq('id', userId)
    .maybeSingle()

  if (existingUser) {
    const dest = existingUser.status === 'pending' ? `${origin}/pending` : `${origin}/wire/library`
    return NextResponse.json({ redirect: dest })
  }

  if (!userEmail) {
    return NextResponse.json({ error: 'No email on account.' }, { status: 400 })
  }

  // userEmail is string from here on.

  let name: string
  try {
    const body = await request.json()
    name = body?.name
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  const displayName = name.trim()

  // Atomically consume an open invite — same logic as /auth/callback.
  let inviteOrgId: string | null = null
  const { data: claimed } = await serviceSupabase
    .from('org_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('email', userEmail.toLowerCase())
    .is('used_at', null)
    .select('id, org_id')

  if (claimed && claimed.length > 0) {
    inviteOrgId = claimed[0].org_id as string
  }

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
    const domain = userEmail.split('@')[1]?.toLowerCase()
    if (domain) {
      const { data: orgs } = await serviceSupabase
        .from('organizations')
        .select('id, name')
        .eq('email_domain', domain)
        .eq('status', 'approved')
        .limit(1)
      org = orgs?.[0] ?? null
    }

    if (!org) {
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
    return NextResponse.json(
      { error: 'Your email is not associated with a member organization.' },
      { status: 400 }
    )
  }

  const { count } = await serviceSupabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('status', 'active')

  const role = count === 0 ? 'admin' : 'editor'
  const status = (inviteOrgId || count === 0) ? 'active' : 'pending'

  const { error: insertError } = await serviceSupabase.from('users').insert({
    id: userId,
    organization_id: org.id,
    display_name: displayName,
    email: userEmail,
    role,
    status,
  })

  if (insertError) {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'Account setup failed. Please try again.' }, { status: 500 })
  }

  if (status === 'active') {
    sendUserWelcomeEmail(userEmail, displayName, org.name).catch(() => {})
    return NextResponse.json({ redirect: `${origin}/wire/library` })
  }

  // Pending: notify org admins (fire-and-forget)
  const orgName = org.name
  ;(async () => {
    const { data: admins } = await serviceSupabase
      .from('users')
      .select('email')
      .eq('organization_id', org!.id)
      .eq('role', 'admin')
      .eq('status', 'active')
    const adminEmails = (admins ?? []).map((a: { email: string }) => a.email)
    if (adminEmails.length > 0) {
      await sendUserPendingApprovalEmail(adminEmails, displayName, userEmail, orgName)
    }
  })().catch(() => {})

  return NextResponse.json({ redirect: `${origin}/pending` })
}
