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

    const { name, website_url, description, contact_emails, republication_guidance, attribution_template, sharing_mode } = await request.json()

    if (contact_emails !== undefined && !contact_emails?.length) {
      return NextResponse.json(
        { error: 'At least one contact email required.' },
        { status: 400 }
      )
    }

    if (sharing_mode !== undefined && !['open', 'restricted'].includes(sharing_mode)) {
      return NextResponse.json({ error: 'Invalid sharing_mode.' }, { status: 400 })
    }

    // Build update payload with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name?.trim()
    if (website_url !== undefined) updates.website_url = website_url?.trim()
    if (description !== undefined) updates.description = description || null
    if (contact_emails !== undefined) updates.contact_emails = contact_emails.filter((e: string) => e.trim())
    if (republication_guidance !== undefined) updates.republication_guidance = republication_guidance?.trim() || null
    if (attribution_template !== undefined) updates.attribution_template = attribution_template?.trim() || null
    if (sharing_mode !== undefined) updates.sharing_mode = sharing_mode

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true })
    }

    const serviceSupabase = await createServiceClient()
    const { error } = await serviceSupabase
      .from('organizations')
      .update(updates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
