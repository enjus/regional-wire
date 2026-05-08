import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendRequestDeclinedEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!currentUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    const { reason = '' } = await request.json().catch(() => ({}))

    const { data: req } = await supabase
      .from('republication_requests')
      .select('id, requesting_org_id, requesting_user_id, requested_headline, story:story_id(title)')
      .eq('id', id)
      .eq('target_org_id', currentUser.organization_id)
      .single()

    if (!req) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })

    const serviceSupabase = await createServiceClient()
    await serviceSupabase
      .from('republication_requests')
      .update({
        status: 'declined',
        decline_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    const story = req.story as unknown as { title: string } | null
    const headline = story?.title ?? req.requested_headline ?? 'Untitled'

    const { data: targetOrgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', currentUser.organization_id)
      .single()
    const targetOrgName = targetOrgData?.name ?? 'The newsroom'

    const recipientSet = new Set<string>()
    if (req.requesting_user_id) {
      const { data: authUser } = await serviceSupabase.auth.admin.getUserById(req.requesting_user_id)
      if (authUser.user?.email) recipientSet.add(authUser.user.email)
    }
    const { data: requestingOrg } = await serviceSupabase
      .from('organizations')
      .select('contact_emails')
      .eq('id', req.requesting_org_id)
      .single()
    for (const email of requestingOrg?.contact_emails ?? []) recipientSet.add(email)
    const recipientEmails = [...recipientSet]

    if (recipientEmails.length) {
      await sendRequestDeclinedEmail(
        recipientEmails,
        targetOrgName,
        headline,
        reason || null
      ).catch((err) => console.error('Failed to send decline email:', err))
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
