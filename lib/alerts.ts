import { createServerClient } from '@supabase/ssr'
import { sendStoryAlertEmail } from './email'

/**
 * Check all active story alerts against a newly available story.
 * Called fire-and-forget after story creation/embargo lift.
 */
export async function checkStoryAlerts(
  storyId: string,
  request: { url: string }
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: story } = await supabase
    .from('stories')
    .select('title, summary, body_plain, organization_id')
    .eq('id', storyId)
    .single()

  if (!story) return

  const searchText = [story.title, story.summary, story.body_plain]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  // Get all active immediate alerts from other orgs
  const { data: alerts } = await supabase
    .from('story_alerts')
    .select('id, user_id, keywords, alert_type, users(email)')
    .eq('is_active', true)
    .neq('organization_id', story.organization_id)

  if (!alerts?.length) return

  for (const alert of alerts) {
    const keywords = alert.keywords as string[]
    const matched = keywords.filter((kw) =>
      searchText.includes(kw.toLowerCase())
    )

    if (matched.length === 0) continue

    if (alert.alert_type === 'immediate') {
      const email = (alert.users as unknown as { email: string } | null)?.email
      if (email) {
        await sendStoryAlertEmail(
          email,
          matched,
          story.title,
          'a member newsroom',
          story.summary,
          storyId
        ).catch((err) => console.error('Alert email error:', err))
      }
    }
    // digest type is handled by the daily cron job
  }
}
