import { NextResponse, type NextRequest } from 'next/server'
import { checkPlatformAdmin, createAdminSupabase } from '@/lib/platform-admin'
import { sendOrgApprovedEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await checkPlatformAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminSupabase()

  const { data: org, error } = await supabase
    .from('organizations')
    .update({ status: 'approved' })
    .eq('id', id)
    .select()
    .single()

  if (error || !org) {
    return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
  }

  await sendOrgApprovedEmail(org).catch((err) =>
    console.error('Failed to send approval email:', err)
  )

  return NextResponse.json({ ok: true })
}
