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
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!currentUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    const { data: req } = await supabase
      .from('republication_requests')
      .select('*, story:story_id(id, title), requesting_org:requesting_org_id(contact_emails, name)')
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

    // Notify requesting org
    const requestingOrg = req.requesting_org as {
      contact_emails: string[]
      name: string
    } | null
    const story = req.story as { id: string; title: string } | null
    const resolvedStoryId = story?.id ?? storyId

    if (requestingOrg?.contact_emails?.length && resolvedStoryId) {
      const title = story?.title ?? req.requested_headline ?? 'Your requested story'
      await sendRequestFulfilledEmail(
        requestingOrg.contact_emails,
        'the target newsroom',
        title,
        resolvedStoryId
      ).catch((err) => console.error('Failed to send fulfillment email:', err))
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
