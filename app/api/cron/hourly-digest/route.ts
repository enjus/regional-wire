import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sendConsolidatedAlertEmail, sendDailyDigestEmail, type AlertStory } from '@/lib/email'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const currentHour = new Date().getUTCHours()
  let alertsSent = 0
  let digestsSent = 0

  // ----------------------------------------------------------------
  // 1. Consolidated alert pass — stories from the last ~61 minutes
  // ----------------------------------------------------------------
  const ALERT_WINDOW_MS = 65 * 60 * 1000 // 65 min story lookback
  const DEDUP_WINDOW_MS = 65 * 60 * 1000 // same window for dedup guard
  const alertSince = new Date(Date.now() - ALERT_WINDOW_MS).toISOString()

  const [{ data: alerts }, { data: recentStories }] = await Promise.all([
    supabase
      .from('story_alerts')
      .select('id, user_id, organization_id, keywords, followed_organization_id, users(email)')
      .eq('is_active', true),
    supabase
      .from('stories')
      .select('id, title, summary, body_plain, organization_id, published_at, organizations(name)')
      .eq('status', 'available')
      .gte('created_at', alertSince),
  ])

  if (alerts?.length && recentStories?.length) {
    // Republication counts for these stories
    const storyIds = recentStories.map((s) => s.id)
    const { data: repRows } = await supabase
      .from('republication_log')
      .select('story_id')
      .in('story_id', storyIds)

    const repCountMap = new Map<string, number>()
    for (const row of repRows ?? []) {
      repCountMap.set(row.story_id, (repCountMap.get(row.story_id) ?? 0) + 1)
    }

    // Group alerts by user
    type UserAlertGroup = {
      email: string
      orgId: string
      alerts: typeof alerts
    }
    const byUser = new Map<string, UserAlertGroup>()
    for (const alert of alerts) {
      const email = (alert.users as unknown as { email: string } | null)?.email
      if (!email) continue
      if (!byUser.has(alert.user_id)) {
        byUser.set(alert.user_id, { email, orgId: alert.organization_id, alerts: [] })
      }
      byUser.get(alert.user_id)!.alerts.push(alert)
    }

    // Users already sent an hourly alert in the last 55 minutes
    const { data: recentSends } = await supabase
      .from('alert_send_log')
      .select('user_id')
      .eq('kind', 'hourly')
      .gte('sent_at', new Date(Date.now() - DEDUP_WINDOW_MS).toISOString())

    const recentlySent = new Set((recentSends ?? []).map((r) => r.user_id))

    const sortByRep = (ids: Set<string>, details?: Map<string, string[]>): AlertStory[] =>
      [...ids]
        .map((id) => recentStories.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => s !== undefined)
        .sort((a, b) => {
          const diff = (repCountMap.get(b.id) ?? 0) - (repCountMap.get(a.id) ?? 0)
          if (diff !== 0) return diff
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        })
        .map((story) => ({
          title: story.title,
          orgName: (story.organizations as unknown as { name: string } | null)?.name ?? 'Unknown',
          storyId: story.id,
          summary: story.summary ?? null,
          matchedKeywords: details?.get(story.id),
        }))

    for (const [userId, { email, orgId, alerts: userAlerts }] of byUser) {
      try {
        if (recentlySent.has(userId)) continue

        const keywordMatchedIds = new Set<string>()
        const keywordMatchDetails = new Map<string, string[]>()
        const orgFollowMatchedIds = new Set<string>()

        for (const alert of userAlerts) {
          for (const story of recentStories) {
            if (story.organization_id === orgId) continue

            if (alert.followed_organization_id) {
              if (story.organization_id === alert.followed_organization_id) {
                orgFollowMatchedIds.add(story.id)
              }
            } else if (alert.keywords) {
              const text = [story.title, story.summary, story.body_plain]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
              const matched = (alert.keywords as string[]).filter((kw) =>
                text.includes(kw.toLowerCase())
              )
              if (matched.length > 0) {
                keywordMatchedIds.add(story.id)
                const prev = keywordMatchDetails.get(story.id) ?? []
                keywordMatchDetails.set(story.id, [...new Set([...prev, ...matched])])
              }
            }
          }
        }

        if (keywordMatchedIds.size === 0 && orgFollowMatchedIds.size === 0) continue

        const keywordMatches = sortByRep(keywordMatchedIds, keywordMatchDetails)
        const orgFollowMatches = sortByRep(orgFollowMatchedIds)

        await sendConsolidatedAlertEmail(email, keywordMatches, orgFollowMatches).catch((err) =>
          console.error('[hourly-digest] Consolidated alert error:', err)
        )
        const { error: logErr } = await supabase
          .from('alert_send_log')
          .insert({ user_id: userId, kind: 'hourly' })
        if (logErr) console.error('[hourly-digest] Failed to log hourly send:', logErr)
        alertsSent++
      } catch (err) {
        console.error(`[hourly-digest] Alert iteration failed for user ${userId}:`, err)
      }
    }
  }

  // ----------------------------------------------------------------
  // 2. Daily digest pass — users who want it at this UTC hour
  // ----------------------------------------------------------------
  const { data: digestPrefs } = await supabase
    .from('user_digest_prefs')
    .select('user_id, users(email, organization_id)')
    .eq('daily_digest_enabled', true)
    .eq('delivery_hour_utc', currentHour)

  if (digestPrefs?.length) {
    const digestSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: dailyStories } = await supabase
      .from('stories')
      .select('id, title, summary, organization_id, published_at, organizations(name)')
      .eq('status', 'available')
      .gte('created_at', digestSince)

    if (dailyStories?.length) {
      const dailyIds = dailyStories.map((s) => s.id)
      const { data: dailyRepRows } = await supabase
        .from('republication_log')
        .select('story_id')
        .in('story_id', dailyIds)

      const dailyRepCountMap = new Map<string, number>()
      for (const row of dailyRepRows ?? []) {
        dailyRepCountMap.set(row.story_id, (dailyRepCountMap.get(row.story_id) ?? 0) + 1)
      }

      // Guard against double-sending daily digest within same day (23h window)
      const { data: todaySends } = await supabase
        .from('alert_send_log')
        .select('user_id')
        .eq('kind', 'daily_digest')
        .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const sentToday = new Set((todaySends ?? []).map((r) => r.user_id))

      for (const pref of digestPrefs) {
        try {
          if (sentToday.has(pref.user_id)) continue
          const userInfo = pref.users as unknown as {
            email: string
            organization_id: string
          } | null
          if (!userInfo) continue

          const stories: AlertStory[] = dailyStories
            .filter((s) => s.organization_id !== userInfo.organization_id)
            .sort((a, b) => {
              const diff =
                (dailyRepCountMap.get(b.id) ?? 0) - (dailyRepCountMap.get(a.id) ?? 0)
              if (diff !== 0) return diff
              return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
            })
            .slice(0, 10)
            .map((story) => ({
              title: story.title,
              orgName:
                (story.organizations as unknown as { name: string } | null)?.name ?? 'Unknown',
              storyId: story.id,
              summary: story.summary ?? null,
            }))

          if (!stories.length) continue

          await sendDailyDigestEmail(userInfo.email, stories).catch((err) =>
            console.error('[hourly-digest] Daily digest error:', err)
          )
          const { error: digestLogErr } = await supabase
            .from('alert_send_log')
            .insert({ user_id: pref.user_id, kind: 'daily_digest' })
          if (digestLogErr) console.error('[hourly-digest] Failed to log daily digest send:', digestLogErr)
          digestsSent++
        } catch (err) {
          console.error(`[hourly-digest] Daily digest iteration failed for user ${pref.user_id}:`, err)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, alertsSent, digestsSent })
}
