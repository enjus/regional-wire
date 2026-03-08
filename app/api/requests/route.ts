import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendRepublicationRequestEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id, organizations(name)')
      .eq('id', user.id)
      .single()

    if (!currentUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    const { target_org_id, story_id, requested_headline, requested_url, message } =
      await request.json()

    if (!target_org_id) {
      return NextResponse.json({ error: 'target_org_id required.' }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()

    const { data: req, error } = await serviceSupabase
      .from('republication_requests')
      .insert({
        requesting_org_id: currentUser.organization_id,
        target_org_id,
        story_id: story_id || null,
        requested_headline: requested_headline || null,
        requested_url: requested_url || null,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error || !req) {
      return NextResponse.json({ error: 'Failed to create request.' }, { status: 500 })
    }

    // Get target org contact emails
    const { data: targetOrg } = await serviceSupabase
      .from('organizations')
      .select('contact_emails, name')
      .eq('id', target_org_id)
      .single()

    if (targetOrg?.contact_emails?.length) {
      const requestingOrgName =
        (currentUser.organizations as unknown as { name: string } | null)?.name ?? 'A member newsroom'
      await sendRepublicationRequestEmail(
        targetOrg.contact_emails,
        requestingOrgName,
        requested_headline ?? 'Unknown headline',
        requested_url ?? null,
        message ?? null,
        req.id
      ).catch((err) => console.error('Failed to send request email:', err))
    }

    return NextResponse.json({ id: req.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
