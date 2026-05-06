import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendSupportRequest } from '@/lib/email'

// In-memory sliding-window rate limiter: 3 submissions per IP per hour
const RATE_LIMIT = 3
const WINDOW_MS = 60 * 60 * 1000
const ipLog = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (ipLog.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (timestamps.length >= RATE_LIMIT) return true
  ipLog.set(ip, [...timestamps, now])
  return false
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before submitting again.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { name, email, subject, message } = body

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.trim() ||
    typeof subject !== 'string' || !subject.trim() ||
    typeof message !== 'string' || !message.trim()
  ) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  if (message.trim().length > 5000) {
    return NextResponse.json({ error: 'Message must be 5,000 characters or fewer.' }, { status: 400 })
  }

  // Try to enrich with user/org context if there's an active session.
  // Use the session email as replyTo when available — avoids pre-filled field being changed.
  let userContext: { userId: string; orgName: string; orgId: string } | null = null
  let replyToEmail = email.trim()
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('organization_id, email, organizations(name)')
        .eq('id', user.id)
        .single()
      if (data) {
        replyToEmail = data.email
        userContext = {
          userId: user.id,
          orgId: data.organization_id,
          orgName: (data.organizations as unknown as { name: string } | null)?.name ?? 'Unknown',
        }
      }
    }
  } catch {
    // Non-fatal — proceed without user context
  }

  // Fetch all platform admin emails
  const service = createServiceClient()
  const { data: admins } = await service
    .from('users')
    .select('email')
    .eq('is_platform_admin', true)

  const adminEmails = admins?.map((a) => a.email).filter(Boolean) ?? []

  // Fall back to PLATFORM_ADMIN_EMAIL env var if no platform admins in DB
  if (!adminEmails.length) {
    const fallback = process.env.PLATFORM_ADMIN_EMAIL
    if (fallback) adminEmails.push(fallback)
  }

  if (!adminEmails.length) {
    return NextResponse.json({ error: 'No support contact configured.' }, { status: 503 })
  }

  try {
    await sendSupportRequest({
      adminEmails,
      name: name.trim(),
      email: replyToEmail,
      subject: subject.trim(),
      message: message.trim(),
      userContext,
    })
  } catch (err) {
    console.error('Failed to send support email:', err)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
