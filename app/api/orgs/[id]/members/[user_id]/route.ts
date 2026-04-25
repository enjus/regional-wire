import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendUserApprovedEmail, sendUserRemovedEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string; user_id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getAdminContext(orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, authUserId: null }

  const { data: currentUser } = await supabase
    .from('users')
    .select('id, organization_id, role')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.organization_id !== orgId || currentUser.role !== 'admin') {
    return { admin: null, authUserId: user.id }
  }
  return { admin: currentUser, authUserId: user.id }
}

// PATCH /api/orgs/[id]/members/[user_id] — approve or change role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, user_id } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(user_id)) {
      return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })
    }

    const { admin, authUserId } = await getAdminContext(id)
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    if (user_id === authUserId) {
      return NextResponse.json({ error: 'Cannot modify your own account.' }, { status: 400 })
    }

    const body = await request.json()
    const { action, role } = body as { action?: string; role?: string }

    if (action !== 'approve' && action !== 'change_role') {
      return NextResponse.json({ error: 'action must be approve or change_role.' }, { status: 400 })
    }
    if (action === 'change_role' && role !== 'admin' && role !== 'editor') {
      return NextResponse.json({ error: 'role must be admin or editor.' }, { status: 400 })
    }

    const service = createServiceClient()

    // Verify target user belongs to this org
    const { data: targetUser } = await service
      .from('users')
      .select('id, email, display_name, status, organization_id, organizations(name)')
      .eq('id', user_id)
      .single()

    if (!targetUser || targetUser.organization_id !== id) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const orgName = (targetUser.organizations as unknown as { name: string } | null)?.name ?? ''

    if (action === 'approve') {
      if (targetUser.status === 'active') {
        return NextResponse.json({ error: 'User is already active.' }, { status: 409 })
      }
      const { error } = await service
        .from('users')
        .update({ status: 'active' })
        .eq('id', user_id)

      if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })

      sendUserApprovedEmail(targetUser.email, targetUser.display_name, orgName).catch(() => {})
    } else {
      const { error } = await service
        .from('users')
        .update({ role })
        .eq('id', user_id)

      if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// DELETE /api/orgs/[id]/members/[user_id] — remove user from org
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, user_id } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(user_id)) {
      return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })
    }

    const { admin, authUserId } = await getAdminContext(id)
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    if (user_id === authUserId) {
      return NextResponse.json({ error: 'Cannot remove yourself.' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: targetUser } = await service
      .from('users')
      .select('id, email, display_name, organization_id, organizations(name)')
      .eq('id', user_id)
      .single()

    if (!targetUser || targetUser.organization_id !== id) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const orgName = (targetUser.organizations as unknown as { name: string } | null)?.name ?? ''

    const { error } = await service.from('users').delete().eq('id', user_id)
    if (error) return NextResponse.json({ error: 'Delete failed.' }, { status: 500 })

    sendUserRemovedEmail(targetUser.email, targetUser.display_name, orgName).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
