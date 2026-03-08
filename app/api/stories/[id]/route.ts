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
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    // Verify the story belongs to this org
    const { data: existing } = await supabase
      .from('stories')
      .select('id, organization_id')
      .eq('id', id)
      .single()

    if (!existing || existing.organization_id !== currentUser.organization_id) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      byline,
      canonical_url,
      body_html,
      body_plain,
      summary,
      special_instructions,
      embargo_lifts_at,
      status,
    } = body

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title.trim()
    if (byline !== undefined) updates.byline = byline.trim()
    if (canonical_url !== undefined) updates.canonical_url = canonical_url.trim()
    if (body_html !== undefined) updates.body_html = body_html
    if (body_plain !== undefined) updates.body_plain = body_plain
    if (summary !== undefined) updates.summary = summary || null
    if (special_instructions !== undefined)
      updates.special_instructions = special_instructions || null
    if (embargo_lifts_at !== undefined) updates.embargo_lifts_at = embargo_lifts_at || null
    if (status !== undefined) updates.status = status

    // If embargo is being cleared, set status to available
    if ('embargo_lifts_at' in updates && !updates.embargo_lifts_at) {
      updates.status = 'available'
    }

    const serviceSupabase = await createServiceClient()
    const { data: updated, error } = await serviceSupabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
    }

    return NextResponse.json({ id: updated.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: story } = await supabase
      .from('stories')
      .select('*, organizations(name), story_assets(*)')
      .eq('id', id)
      .single()

    if (!story) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    return NextResponse.json(story)
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
