import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { checkBasicAuth, verifyAdminToken } from '@/lib/utils'
import { sendOrgApprovedEmail } from '@/lib/email'
import { brand } from '@/lib/brand'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')

  // Allow either basic auth (from admin UI) OR signed token (from email link)
  const authHeader = request.headers.get('authorization')
  const validBasicAuth = checkBasicAuth(authHeader)
  const validToken = token ? verifyAdminToken(id, 'approve', token) : false

  if (!validBasicAuth && !validToken) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': `Basic realm="${brand.name} Admin"` },
    })
  }

  return handleApprove(id)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const authHeader = request.headers.get('authorization')

  if (!checkBasicAuth(authHeader)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return handleApprove(id)
}

async function handleApprove(orgId: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL!
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: org, error } = await supabase
    .from('organizations')
    .update({ status: 'approved' })
    .eq('id', orgId)
    .select()
    .single()

  if (error || !org) {
    return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
  }

  await sendOrgApprovedEmail(org).catch((err) =>
    console.error('Failed to send approval email:', err)
  )

  // Redirect to admin page if coming from email link
  return NextResponse.redirect(`${origin}/admin?approved=${orgId}`)
}
