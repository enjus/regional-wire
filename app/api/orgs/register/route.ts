import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { slugify, generateAdminToken } from '@/lib/utils'
import { sendOrgRegistrationNotification } from '@/lib/email'

// Simple in-memory IP rate limiter. Best-effort: resets on deploy/restart and is
// per-process, but the app runs on a single droplet so that's acceptable.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 5
const rateLimitMap = new Map<string, number[]>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const hits = (rateLimitMap.get(ip) ?? []).filter((t) => t > windowStart)
  if (hits.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, hits)
    return false
  }
  hits.push(now)
  rateLimitMap.set(ip, hits)

  // Opportunistic cleanup to keep the map from growing unbounded
  if (rateLimitMap.size > 10_000) {
    for (const [k, v] of rateLimitMap) {
      const fresh = v.filter((t) => t > windowStart)
      if (fresh.length === 0) rateLimitMap.delete(k)
      else rateLimitMap.set(k, fresh)
    }
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for') ?? ''
    const ip = forwarded.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, website_url, email_domain, contact_emails, description, republication_guidance } = body

    if (!name || !website_url || !email_domain || !contact_emails?.length) {
      return NextResponse.json(
        { error: 'Name, website, email domain, and at least one contact email are required.' },
        { status: 400 }
      )
    }

    const validContacts = (contact_emails as string[]).filter((e) => e.trim())
    if (!validContacts.length) {
      return NextResponse.json(
        { error: 'At least one contact email is required.' },
        { status: 400 }
      )
    }

    const domain = email_domain.toLowerCase().replace(/^@/, '').trim()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    // Check domain not already registered
    const { data: existing } = await supabase
      .from('organizations')
      .select('id, status')
      .eq('email_domain', domain)
      .single()

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'An application for this domain is already pending review.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        {
          error: 'This domain is already registered as a member organization.',
          code: 'domain_registered',
        },
        { status: 400 }
      )
    }

    const slug = slugify(name)

    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        slug: `${slug}-${Date.now()}`,
        website_url: website_url.trim(),
        email_domain: domain,
        contact_emails: validContacts,
        description: description?.trim() || null,
        republication_guidance: republication_guidance?.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error || !org) {
      return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 })
    }

    // Send notification to platform admin
    const approveToken = generateAdminToken(org.id, 'approve')
    const rejectToken = generateAdminToken(org.id, 'reject')

    await sendOrgRegistrationNotification(org, approveToken, rejectToken).catch(
      (err) => console.error('Failed to send admin notification:', err)
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
