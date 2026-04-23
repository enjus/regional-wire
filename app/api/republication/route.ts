import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getExcludedOrgIds } from '@/lib/exclusions'

export async function POST(request: NextRequest) {
  try {
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

    const { story_id } = await request.json()
    if (!story_id) {
      return NextResponse.json({ error: 'story_id required.' }, { status: 400 })
    }

    // Verify story exists and is not from the user's own org
    const { data: story } = await supabase
      .from('stories')
      .select('id, organization_id, status, embargo_lifts_at')
      .eq('id', story_id)
      .single()

    if (!story) {
      return NextResponse.json({ error: 'Story not found.' }, { status: 404 })
    }

    if (story.status === 'withdrawn') {
      return NextResponse.json({ error: 'Story has been withdrawn.' }, { status: 404 })
    }

    if (story.organization_id === currentUser.organization_id) {
      return NextResponse.json(
        { error: 'Cannot log republication of own story.' },
        { status: 400 }
      )
    }

    // Exclusion check — requester's org must not be excluded by the story's org
    const excludedOrgIds = await getExcludedOrgIds(supabase, currentUser.organization_id)
    if (excludedOrgIds.includes(story.organization_id)) {
      return NextResponse.json({ error: 'Story is not available.' }, { status: 403 })
    }

    // Check embargo
    if (story.status === 'embargoed' && story.embargo_lifts_at) {
      if (new Date() < new Date(story.embargo_lifts_at)) {
        return NextResponse.json(
          { error: 'Story is still embargoed.' },
          { status: 403 }
        )
      }
    }

    const serviceSupabase = await createServiceClient()
    const { data: log, error } = await serviceSupabase
      .from('republication_log')
      .insert({
        story_id,
        republishing_org_id: currentUser.organization_id,
        downloaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to log.' }, { status: 500 })
    }

    return NextResponse.json({ id: log.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
