import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string; partner_id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, partner_id } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(partner_id)) {
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

    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('org_sharing_partners')
      .delete()
      .eq('org_id', id)
      .eq('partner_id', partner_id)

    if (error) return NextResponse.json({ error: 'Delete failed.' }, { status: 500 })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
