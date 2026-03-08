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

    const { keywords, alert_type } = await request.json()

    if (!keywords?.length) {
      return NextResponse.json({ error: 'Keywords required.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()
    const { data: alert, error } = await serviceSupabase
      .from('story_alerts')
      .insert({
        user_id: user.id,
        organization_id: currentUser.organization_id,
        keywords,
        alert_type: alert_type ?? 'immediate',
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
