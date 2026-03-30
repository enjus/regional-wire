import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']
const ALLOWED_VIDEO_EXTS = ['mp4', 'mov', 'webm', 'avi', 'mkv']

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('organization_id, organizations(status)')
    .eq('id', user.id)
    .single()

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  const org = currentUser.organizations as unknown as { status: string } | null
  if (org?.status !== 'approved') {
    return NextResponse.json({ error: 'Organization not approved.' }, { status: 403 })
  }

  const type = request.nextUrl.searchParams.get('type')
  const ext = request.nextUrl.searchParams.get('ext')?.toLowerCase().replace(/^\./, '')

  if (type !== 'image' && type !== 'video') {
    return NextResponse.json({ error: 'Invalid type.' }, { status: 400 })
  }

  const allowedExts = type === 'image' ? ALLOWED_IMAGE_EXTS : ALLOWED_VIDEO_EXTS
  if (!ext || !allowedExts.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file extension.' }, { status: 400 })
  }

  const folder = type === 'image' ? 'images' : 'videos'
  const path = `${folder}/${currentUser.organization_id}/${Date.now()}-${crypto.randomUUID()}.${ext}`

  const serviceSupabase = await createServiceClient()
  const { data, error } = await serviceSupabase.storage
    .from('story-assets')
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error('Failed to create signed upload URL:', error)
    return NextResponse.json({ error: 'Failed to create upload URL.' }, { status: 500 })
  }

  return NextResponse.json({ token: data.token, path: data.path })
}
