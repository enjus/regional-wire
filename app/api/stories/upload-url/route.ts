import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const path = request.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'Path is required.' }, { status: 400 })
  }

  const serviceSupabase = await createServiceClient()
  const { data, error } = await serviceSupabase.storage
    .from('story-assets')
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error('Failed to create signed upload URL:', error)
    return NextResponse.json({ error: 'Failed to create upload URL.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
