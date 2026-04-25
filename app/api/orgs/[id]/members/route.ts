import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendUserInviteEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getAdminContext(orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentUser } = await supabase
    .from('users')
    .select('id, organization_id, role, display_name, email')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.organization_id !== orgId || currentUser.role !== 'admin') {
    return null
  }
  return currentUser
}

// GET /api/orgs/[id]/members — list members and pending invites
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid organization id.' }, { status: 400 })
    }

    const admin = await getAdminContext(id)
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

    const service = createServiceClient()

    const [{ data: members }, { data: invites }] = await Promise.all([
      service
        .from('users')
        .select('id, display_name, email, role, status, created_at')
        .eq('organization_id', id)
        .order('created_at', { ascending: true }),
      service
        .from('org_invites')
        .select('id, email, created_at')
        .eq('org_id', id)
        .is('used_at', null)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({ members: members ?? [], invites: invites ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// POST /api/orgs/[id]/members — invite a user by email
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid organization id.' }, { status: 400 })
    }

    const admin = await getAdminContext(id)
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required.' }, { status: 400 })
    }
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const service = createServiceClient()

    // Check if email already belongs to a user in this org
    const { data: existingUser } = await service
      .from('users')
      .select('id')
      .eq('organization_id', id)
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: 'This person is already a member.' }, { status: 409 })
    }

    // Check for duplicate open invite
    const { data: existingInvite } = await service
      .from('org_invites')
      .select('id')
      .eq('org_id', id)
      .eq('email', normalizedEmail)
      .is('used_at', null)
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json({ error: 'An invite has already been sent to this email.' }, { status: 409 })
    }

    // Create invite record
    const { data: newInvite, error: insertError } = await service
      .from('org_invites')
      .insert({ org_id: id, email: normalizedEmail, invited_by: admin.id })
      .select('id')
      .single()

    if (insertError || !newInvite) {
      return NextResponse.json({ error: 'Failed to create invite.' }, { status: 500 })
    }

    // Fetch org name for the invite email
    const { data: org } = await service
      .from('organizations')
      .select('name')
      .eq('id', id)
      .single()

    const orgName = org?.name ?? ''

    // Send invite email (fire-and-forget)
    sendUserInviteEmail(normalizedEmail, orgName, admin.display_name).catch(() => {})

    return NextResponse.json({ ok: true, id: newInvite.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
