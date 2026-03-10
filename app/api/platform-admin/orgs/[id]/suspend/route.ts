import { NextResponse, type NextRequest } from 'next/server'
import { checkPlatformAdmin, createAdminSupabase } from '@/lib/platform-admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await checkPlatformAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminSupabase()

  const { error } = await supabase
    .from('organizations')
    .update({ status: 'suspended' })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
