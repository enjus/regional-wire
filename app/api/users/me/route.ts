import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { display_name } = await request.json()
  if (!display_name?.trim()) {
    return NextResponse.json({ error: 'Display name is required.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .update({ display_name: display_name.trim() })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
