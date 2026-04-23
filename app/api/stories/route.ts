import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { autoFulfillRequestsForStory } from '@/lib/requests/autoFulfill'

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
      .select('organization_id, organizations(name)')
      .eq('id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
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
      assets = [],
    } = body

    if (!title || !byline || !canonical_url || !body_html) {
      return NextResponse.json(
        { error: 'Title, byline, canonical URL, and body are required.' },
        { status: 400 }
      )
    }

    const status = embargo_lifts_at ? 'embargoed' : 'available'
    const slug = slugify(title)

    const serviceSupabase = await createServiceClient()

    const { data: story, error } = await serviceSupabase
      .from('stories')
      .insert({
        organization_id: currentUser.organization_id,
        title: title.trim(),
        byline: byline.trim(),
        canonical_url: canonical_url.trim(),
        body_html,
        body_plain: body_plain || '',
        slug: `${slug}-${Date.now()}`,
        summary: summary || null,
        special_instructions: special_instructions || null,
        status,
        source: 'manual',
        embargo_lifts_at: embargo_lifts_at || null,
        published_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !story) {
      console.error('Story creation error:', error)
      return NextResponse.json({ error: 'Failed to create story.' }, { status: 500 })
    }

    // Insert assets
    if (assets.length > 0) {
      const assetRows = assets.map((a: {
        asset_type: string
        file_url: string
        caption: string | null
        credit: string | null
        is_primary: boolean
      }) => ({
        story_id: story.id,
        asset_type: a.asset_type,
        file_url: a.file_url,
        caption: a.caption,
        credit: a.credit,
        is_primary: a.is_primary,
      }))

      await serviceSupabase.from('story_assets').insert(assetRows)
    }

    if (status === 'available') {
      const fulfillingOrgName =
        (currentUser.organizations as unknown as { name: string } | null)?.name ??
        'A member newsroom'
      await autoFulfillRequestsForStory(
        serviceSupabase,
        {
          id: story.id,
          organization_id: story.organization_id,
          canonical_url: story.canonical_url,
          title: story.title,
        },
        fulfillingOrgName
      )
    }

    return NextResponse.json({ id: story.id })
  } catch (err) {
    console.error('POST /api/stories error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
