import type { createServiceClient } from '@/lib/supabase/server'
import { sendRequestFulfilledEmail } from '@/lib/email'

type ServiceClient = ReturnType<typeof createServiceClient>

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim().toLowerCase()
  if (!trimmed) return null
  return trimmed.replace(/\/+$/, '')
}

/**
 * Auto-fulfill pending republication requests when a story becomes available,
 * and notify each requesting org. Matches by story_id or (target org +
 * normalized canonical_url). Fire-and-forget: never throws.
 */
export async function autoFulfillRequestsForStory(
  serviceSupabase: ServiceClient,
  story: {
    id: string
    organization_id: string
    canonical_url: string | null
    title: string
  },
  fulfillingOrgName: string
): Promise<void> {
  try {
    const normalizedUrl = normalizeUrl(story.canonical_url)

    const orFilter = normalizedUrl
      ? `story_id.eq.${story.id},requested_url.eq.${story.canonical_url}`
      : `story_id.eq.${story.id}`

    const { data: candidates, error } = await serviceSupabase
      .from('republication_requests')
      .select('id, requesting_org_id, requested_url, story_id')
      .eq('status', 'pending')
      .eq('target_org_id', story.organization_id)
      .or(orFilter)

    if (error) {
      console.error('autoFulfillRequestsForStory: query failed', error)
      return
    }
    if (!candidates?.length) return

    // Defensive URL match: verify normalized equality for URL-only matches
    const matched = candidates.filter((r) => {
      if (r.story_id === story.id) return true
      if (!normalizedUrl) return false
      return normalizeUrl(r.requested_url) === normalizedUrl
    })

    if (!matched.length) return

    const ids = matched.map((r) => r.id)
    const { error: updateError } = await serviceSupabase
      .from('republication_requests')
      .update({
        status: 'fulfilled',
        story_id: story.id,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (updateError) {
      console.error('autoFulfillRequestsForStory: update failed', updateError)
      return
    }

    const requestingOrgIds = [...new Set(matched.map((r) => r.requesting_org_id))]
    const { data: orgs } = await serviceSupabase
      .from('organizations')
      .select('id, contact_emails')
      .in('id', requestingOrgIds)

    if (!orgs?.length) return

    const contactsByOrg = new Map<string, string[]>(
      orgs.map((o) => [o.id as string, (o.contact_emails as string[] | null) ?? []])
    )

    for (const req of matched) {
      const contacts = contactsByOrg.get(req.requesting_org_id)
      if (!contacts?.length) continue
      sendRequestFulfilledEmail(contacts, fulfillingOrgName, story.title, story.id).catch(
        (err) => console.error('Failed to send auto-fulfill email:', err)
      )
    }
  } catch (err) {
    console.error('autoFulfillRequestsForStory: unexpected error', err)
  }
}
