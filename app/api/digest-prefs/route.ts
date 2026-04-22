import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data } = await supabase
      .from('user_digest_prefs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json(data ?? null)
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { daily_digest_enabled, delivery_hour_utc } = await request.json()

    if (typeof daily_digest_enabled !== 'boolean') {
      return NextResponse.json({ error: 'daily_digest_enabled required.' }, { status: 400 })
    }
    if (
      typeof delivery_hour_utc !== 'number' ||
      delivery_hour_utc < 0 ||
      delivery_hour_utc > 23
    ) {
      return NextResponse.json({ error: 'delivery_hour_utc must be 0–23.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_digest_prefs')
      .upsert(
        {
          user_id: user.id,
          daily_digest_enabled,
          delivery_hour_utc,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to save preferences.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
