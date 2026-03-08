import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sendAlertDigestEmail } from '@/lib/email'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const digestHour = parseInt(process.env.ALERT_DIGEST_HOUR ?? '7', 10)
  const currentHour = new Date().getUTCHours()

  // Only run at the configured hour
  if (currentHour !== digestHour && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Get all active digest alerts
  const { data: alerts } = await supabase
    .from('story_alerts')
    .select('id, user_id, keywords, organization_id, users(email)')
    .eq('is_active', true)
    .eq('alert_type', 'digest')

  if (!alerts?.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Get stories from last 24h
  const { data: recentStories } = await supabase
    .from('stories')
    .select('id, title, summary, body_plain, organization_id, organizations(name)')
    .eq('status', 'available')
    .gte('published_at', since)

  if (!recentStories?.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let sent = 0

  for (const alert of alerts) {
    const keywords = alert.keywords as string[]
    const userEmail = (alert.users as unknown as { email: string } | null)?.email
    if (!userEmail) continue

    const matched = recentStories
      .filter((story) => {
        if (story.organization_id === alert.organization_id) return false
        const text = [story.title, story.summary, story.body_plain]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return keywords.some((kw) => text.includes(kw.toLowerCase()))
      })
      .map((story) => ({
        title: story.title,
        orgName: (story.organizations as unknown as { name: string } | null)?.name ?? 'Unknown',
        storyId: story.id,
        summary: story.summary,
      }))

    if (!matched.length) continue

    await sendAlertDigestEmail(userEmail, matched).catch((err) =>
      console.error('Digest email error:', err)
    )
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
