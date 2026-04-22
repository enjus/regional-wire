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
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!currentUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    const body = await request.json()
    const { keywords, followed_organization_id } = body

    const hasKeywords = Array.isArray(keywords) && keywords.length > 0
    const hasOrgFollow = typeof followed_organization_id === 'string' && followed_organization_id

    if (!hasKeywords && !hasOrgFollow) {
      return NextResponse.json(
        { error: 'Provide keywords or a newsroom to follow.' },
        { status: 400 }
      )
    }

    const serviceSupabase = await createServiceClient()
    const { data: alert, error } = await serviceSupabase
      .from('story_alerts')
      .insert({
        user_id: user.id,
        organization_id: currentUser.organization_id,
        keywords: hasKeywords ? keywords : null,
        followed_organization_id: hasOrgFollow ? followed_organization_id : null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create alert.' }, { status: 500 })
    }

    return NextResponse.json(alert)
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
