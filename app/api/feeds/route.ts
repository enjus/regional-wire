import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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

    const { feed_url, feed_type } = await request.json()

    if (!feed_url || !['full_text', 'headline'].includes(feed_type)) {
      return NextResponse.json({ error: 'feed_url and feed_type required.' }, { status: 400 })
    }

    // Only allow http/https to prevent SSRF via internal URLs or other protocols
    let parsedUrl: URL
    try {
      parsedUrl = new URL(feed_url.trim())
    } catch {
      return NextResponse.json({ error: 'Invalid feed URL.' }, { status: 400 })
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Feed URL must use HTTP or HTTPS.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()
    const { data: feed, error } = await serviceSupabase
      .from('org_feeds')
      .insert({
        organization_id: currentUser.organization_id,
        feed_url: feed_url.trim(),
        feed_type,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to add feed.' }, { status: 500 })
    }

    return NextResponse.json(feed)
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
