import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validatePublicFeedHostname } from '@/lib/utils'

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

    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const body = await request.json()

    // Whitelist user-editable fields only — never trust organization_id, id, created_at, etc.
    const update: Record<string, unknown> = {}
    if (typeof body.feed_url === 'string') {
      const trimmed = body.feed_url.trim()
      const hostnameError = validatePublicFeedHostname(trimmed)
      if (hostnameError) {
        return NextResponse.json({ error: hostnameError }, { status: 400 })
      }
      update.feed_url = trimmed
    }
    if (body.feed_type !== undefined) {
      if (!['full_text', 'headline'].includes(body.feed_type)) {
        return NextResponse.json({ error: 'Invalid feed_type.' }, { status: 400 })
      }
      update.feed_type = body.feed_type
    }
    if (body.is_active !== undefined) {
      if (typeof body.is_active !== 'boolean') {
        return NextResponse.json({ error: 'is_active must be boolean.' }, { status: 400 })
      }
      update.is_active = body.is_active
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()

    await serviceSupabase
      .from('org_feeds')
      .update(update)
      .eq('id', id)
      .eq('organization_id', currentUser.organization_id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const serviceSupabase = await createServiceClient()
    await serviceSupabase
      .from('org_feeds')
      .delete()
      .eq('id', id)
      .eq('organization_id', currentUser.organization_id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
