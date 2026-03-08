import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { checkBasicAuth } from '@/lib/utils'
import { sendOrgRejectedEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const authHeader = request.headers.get('authorization')

  if (!checkBasicAuth(authHeader)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { reason = '' } = await request.json().catch(() => ({}))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: org, error } = await supabase
    .from('organizations')
    .update({ status: 'suspended' })
    .eq('id', id)
    .select()
    .single()

  if (error || !org) {
    return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
  }

  await sendOrgRejectedEmail(org, reason).catch((err) =>
    console.error('Failed to send rejection email:', err)
  )

  return NextResponse.json({ ok: true })
}
