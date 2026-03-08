import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!currentUser || currentUser.organization_id !== id || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { name, website_url, description, contact_emails } = await request.json()

    if (!contact_emails?.length) {
      return NextResponse.json(
        { error: 'At least one contact email required.' },
        { status: 400 }
      )
    }

    const serviceSupabase = await createServiceClient()
    const { error } = await serviceSupabase
      .from('organizations')
      .update({
        name: name?.trim(),
        website_url: website_url?.trim(),
        description: description || null,
        contact_emails: contact_emails.filter((e: string) => e.trim()),
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
