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

    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { is_active } = await request.json()

    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be a boolean.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()

    await serviceSupabase
      .from('story_alerts')
      .update({ is_active })
      .eq('id', id)
      .eq('user_id', user.id)

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

    const serviceSupabase = await createServiceClient()
    await serviceSupabase
      .from('story_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
