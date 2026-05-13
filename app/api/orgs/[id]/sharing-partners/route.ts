import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid organization id.' }, { status: 400 })
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

    const { partner_id } = await request.json()

    if (!partner_id || typeof partner_id !== 'string' || !UUID_RE.test(partner_id)) {
      return NextResponse.json({ error: 'Invalid partner_id.' }, { status: 400 })
    }
    if (partner_id === id) {
      return NextResponse.json({ error: 'Cannot partner with your own organization.' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: targetOrg } = await serviceClient
      .from('organizations')
      .select('id, status')
      .eq('id', partner_id)
      .single()

    if (!targetOrg || targetOrg.status !== 'approved') {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
    }

    const { data: existing } = await serviceClient
      .from('org_sharing_partners')
      .select('id')
      .eq('org_id', id)
      .eq('partner_id', partner_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Partnership already exists.' }, { status: 409 })
    }

    const { data, error } = await serviceClient
      .from('org_sharing_partners')
      .insert({ org_id: id, partner_id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Insert failed.' }, { status: 500 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
