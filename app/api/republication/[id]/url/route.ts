import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendLinkBackEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
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

    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: 'URL required.' }, { status: 400 })
    }

    // Verify log entry belongs to this org
    const { data: logEntry } = await supabase
      .from('republication_log')
      .select('id, story_id, republishing_org_id')
      .eq('id', id)
      .eq('republishing_org_id', currentUser.organization_id)
      .single()

    if (!logEntry) {
      return NextResponse.json({ error: 'Log entry not found.' }, { status: 404 })
    }

    const serviceSupabase = await createServiceClient()
    await serviceSupabase
      .from('republication_log')
      .update({ republished_url: url })
      .eq('id', id)

    // Notify original org
    const { data: storyData } = await serviceSupabase
      .from('stories')
      .select('title, organizations(contact_emails, name)')
      .eq('id', logEntry.story_id)
      .single()

    const { data: republishingOrg } = await serviceSupabase
      .from('organizations')
      .select('name')
      .eq('id', currentUser.organization_id)
      .single()

    if (storyData) {
      const origOrg = storyData.organizations as unknown as {
        contact_emails: string[]
        name: string
      } | null
      if (origOrg?.contact_emails?.length) {
        await sendLinkBackEmail(
          origOrg.contact_emails,
          republishingOrg?.name ?? 'A member newsroom',
          storyData.title,
          url
        ).catch((err) => console.error('Failed to send link-back email:', err))
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
