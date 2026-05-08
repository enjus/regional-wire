import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendRequestFulfilledEmail } from '@/lib/email'

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
      .select('organization_id, organization:organization_id(name)')
      .eq('id', user.id)
      .single()

    if (!currentUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    const { data: req } = await supabase
      .from('republication_requests')
      .select('*, story:story_id(id, title)')
      .eq('id', id)
      .eq('target_org_id', currentUser.organization_id)
      .single()

    if (!req) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })

    const body = request.headers.get('content-type')?.includes('application/json')
      ? await request.json().catch(() => ({}))
      : {}
    const storyId: string | undefined = body.storyId

    const serviceSupabase = await createServiceClient()
    await serviceSupabase
      .from('republication_requests')
      .update({
        status: 'fulfilled',
        updated_at: new Date().toISOString(),
        ...(storyId ? { story_id: storyId } : {}),
      })
      .eq('id', id)

    const story = req.story as { id: string; title: string } | null
    const resolvedStoryId = story?.id ?? storyId

    if (resolvedStoryId) {
      const title = story?.title ?? req.requested_headline ?? 'Your requested story'
      const fulfillingOrgName =
        (currentUser.organization as unknown as { name: string } | null)?.name ?? 'A member newsroom'

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
        await sendRequestFulfilledEmail(
          recipientEmails,
          fulfillingOrgName,
          title,
          resolvedStoryId
        ).catch((err) => console.error('Failed to send fulfillment email:', err))
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
