import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!currentUser || currentUser.organization_id !== id || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { excluded_org_id } = await request.json()

    if (!excluded_org_id) {
      return NextResponse.json({ error: 'excluded_org_id is required.' }, { status: 400 })
    }
    if (excluded_org_id === id) {
      return NextResponse.json({ error: 'Cannot exclude your own organization.' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Verify target org exists and is approved
    const { data: targetOrg } = await serviceClient
      .from('organizations')
      .select('id, status')
      .eq('id', excluded_org_id)
      .single()

    if (!targetOrg || targetOrg.status !== 'approved') {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
    }

    // Check for existing exclusion in either direction
    const { data: existing } = await serviceClient
      .from('org_exclusions')
      .select('id')
      .or(
        `and(initiator_id.eq.${id},excluded_id.eq.${excluded_org_id}),and(initiator_id.eq.${excluded_org_id},excluded_id.eq.${id})`
      )
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Exclusion already exists.' }, { status: 409 })
    }

    const { data, error } = await serviceClient
      .from('org_exclusions')
      .insert({ initiator_id: id, excluded_id: excluded_org_id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Insert failed.' }, { status: 500 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
