import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string; excluded_org_id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, excluded_org_id } = await params
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

    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient
      .from('org_exclusions')
      .delete()
      .eq('initiator_id', id)
      .eq('excluded_id', excluded_org_id)
      .select('id')

    if (error) return NextResponse.json({ error: 'Delete failed.' }, { status: 500 })
    if (!data?.length) return NextResponse.json({ error: 'Exclusion not found.' }, { status: 404 })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
