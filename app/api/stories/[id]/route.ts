import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendCorrectionNotice, sendWithdrawalNotice } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function notifyRepublishers(
  serviceSupabase: Awaited<ReturnType<typeof createServiceClient>>,
  storyId: string,
  originOrgName: string,
  storyTitle: string,
  type: 'correction' | 'withdrawal',
  text: string
) {
  // Get all distinct republishing orgs
  const { data: logEntries } = await serviceSupabase
    .from('republication_log')
    .select('republishing_org_id')
    .eq('story_id', storyId)

  if (!logEntries?.length) return

  // Deduplicate by org ID
  const orgIds = [...new Set(logEntries.map((e) => e.republishing_org_id))]

  // Get contact emails for each org
  const { data: orgs } = await serviceSupabase
    .from('organizations')
    .select('contact_emails')
    .in('id', orgIds)

  if (!orgs?.length) return

  for (const org of orgs) {
    if (!org.contact_emails?.length) continue
    if (type === 'correction') {
      sendCorrectionNotice(org.contact_emails, originOrgName, storyTitle, text, storyId).catch(
        (err) => console.error('Failed to send correction notice:', err)
      )
    } else {
      sendWithdrawalNotice(org.contact_emails, originOrgName, storyTitle, text, storyId).catch(
        (err) => console.error('Failed to send withdrawal notice:', err)
      )
    }
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    // Verify the story belongs to this org
    const { data: existing } = await supabase
      .from('stories')
      .select('id, organization_id, title')
      .eq('id', id)
      .single()

    if (!existing || existing.organization_id !== currentUser.organization_id) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      byline,
      canonical_url,
      body_html,
      body_plain,
      summary,
      special_instructions,
      embargo_lifts_at,
      status,
      // Change tracking fields
      change_type,
      change_note,
      correction_text,
      withdrawal_reason,
    } = body

    // Validate correction requires correction_text
    if (change_type === 'correction' && !correction_text?.trim()) {
      return NextResponse.json(
        { error: 'Correction text is required for corrections.' },
        { status: 400 }
      )
    }

    // Validate withdrawal requires reason
    if (status === 'withdrawn' && !withdrawal_reason?.trim()) {
      return NextResponse.json(
        { error: 'A reason is required when withdrawing a story.' },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title.trim()
    if (byline !== undefined) updates.byline = byline.trim()
    if (canonical_url !== undefined) updates.canonical_url = canonical_url.trim()
    if (body_html !== undefined) updates.body_html = body_html
    if (body_plain !== undefined) updates.body_plain = body_plain
    if (summary !== undefined) updates.summary = summary || null
    if (special_instructions !== undefined)
      updates.special_instructions = special_instructions || null
    if (embargo_lifts_at !== undefined) updates.embargo_lifts_at = embargo_lifts_at || null
    if (status !== undefined) updates.status = status

    // If embargo is being cleared, set status to available
    if ('embargo_lifts_at' in updates && !updates.embargo_lifts_at) {
      updates.status = 'available'
    }

    // Set has_correction flag if this is a correction
    if (change_type === 'correction') {
      updates.has_correction = true
    }

    const serviceSupabase = await createServiceClient()
    const { data: updated, error } = await serviceSupabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
    }

    // Record the change (for edits with change_type, or withdrawals)
    const effectiveChangeType = status === 'withdrawn' ? 'withdrawal' : change_type
    if (effectiveChangeType) {
      await serviceSupabase.from('story_changes').insert({
        story_id: id,
        user_id: user.id,
        change_type: effectiveChangeType,
        change_note: change_note?.trim() || null,
        correction_text: effectiveChangeType === 'correction' ? correction_text.trim() : null,
        withdrawal_reason: effectiveChangeType === 'withdrawal' ? withdrawal_reason?.trim() || null : null,
      })
    }

    // Send notifications for corrections and withdrawals
    if (effectiveChangeType === 'correction' || effectiveChangeType === 'withdrawal') {
      // Get the org name for the notification
      const { data: org } = await serviceSupabase
        .from('organizations')
        .select('name')
        .eq('id', existing.organization_id)
        .single()

      const orgName = org?.name ?? 'A member newsroom'
      const storyTitle = (title?.trim() as string) || existing.title

      if (effectiveChangeType === 'correction') {
        notifyRepublishers(
          serviceSupabase,
          id,
          orgName,
          storyTitle,
          'correction',
          correction_text.trim()
        )
      } else {
        notifyRepublishers(
          serviceSupabase,
          id,
          orgName,
          storyTitle,
          'withdrawal',
          withdrawal_reason.trim()
        )
      }
    }

    return NextResponse.json({ id: updated.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: story } = await supabase
      .from('stories')
      .select('*, organizations(name), story_assets(*)')
      .eq('id', id)
      .single()

    if (!story) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    return NextResponse.json(story)
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
