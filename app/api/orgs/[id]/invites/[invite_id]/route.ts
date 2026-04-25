import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string; invite_id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// DELETE /api/orgs/[id]/invites/[invite_id] — cancel a pending invite
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, invite_id } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(invite_id)) {
      return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!currentUser || currentUser.organization_id !== id || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const service = createServiceClient()

    const { error } = await service
      .from('org_invites')
      .delete()
      .eq('id', invite_id)
      .eq('org_id', id)
      .is('used_at', null)

    if (error) return NextResponse.json({ error: 'Delete failed.' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
