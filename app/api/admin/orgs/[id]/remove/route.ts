import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { checkBasicAuth } from '@/lib/utils'
import { sendOrgRemovalEmail } from '@/lib/email'

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

  // Verify the org exists and is currently approved
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (orgError || !org) {
    return NextResponse.json(
      { error: 'Organization not found or not currently approved.' },
      { status: 404 }
    )
  }

  // 1. Get all story IDs for this org (needed for asset cleanup)
  const { data: stories } = await supabase
    .from('stories')
    .select('id')
    .eq('organization_id', id)

  const storyIds = (stories ?? []).map((s: { id: string }) => s.id)

  // 2. Delete asset files from Supabase Storage
  if (storyIds.length > 0) {
    const { data: assets } = await supabase
      .from('story_assets')
      .select('file_url')
      .in('story_id', storyIds)

    const filePaths = (assets ?? [])
      .map((a: { file_url: string }) => a.file_url)
      .filter(Boolean)

    if (filePaths.length > 0) {
      await supabase.storage.from('story-assets').remove(filePaths)
    }

    // 3. Delete story_assets rows
    await supabase.from('story_assets').delete().in('story_id', storyIds)
  }

  // 4. Withdraw all stories
  await supabase
    .from('stories')
    .update({ status: 'withdrawn' })
    .eq('organization_id', id)

  // 5. Deactivate feeds
  await supabase
    .from('org_feeds')
    .update({ is_active: false })
    .eq('organization_id', id)

  // 6. Delete feed headlines
  await supabase
    .from('feed_headlines')
    .delete()
    .eq('organization_id', id)

  // 7. Auto-decline pending republication requests involving this org
  await supabase
    .from('republication_requests')
    .update({ status: 'declined', decline_reason: 'Organization removed from Regional Wire' })
    .eq('requesting_org_id', id)
    .eq('status', 'pending')

  await supabase
    .from('republication_requests')
    .update({ status: 'declined', decline_reason: 'Organization removed from Regional Wire' })
    .eq('target_org_id', id)
    .eq('status', 'pending')

  // 8. Deactivate story alerts for org users
  const { data: orgUsers } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', id)

  const userIds = (orgUsers ?? []).map((u: { id: string }) => u.id)
  if (userIds.length > 0) {
    await supabase
      .from('story_alerts')
      .update({ is_active: false })
      .in('user_id', userIds)
  }

  // 9. Suspend the organization
  await supabase
    .from('organizations')
    .update({ status: 'suspended' })
    .eq('id', id)

  // 10. Send removal notification email
  await sendOrgRemovalEmail(org, reason).catch((err) =>
    console.error('Failed to send removal email:', err)
  )

  return NextResponse.json({ ok: true })
}
