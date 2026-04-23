import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendAssetRequestEmail } from '@/lib/email'
import { getExcludedOrgIds } from '@/lib/exclusions'

export async function POST(request: NextRequest) {
  try {
    const { story_id } = await request.json()
    if (!story_id) return NextResponse.json({ error: 'story_id required.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id, organizations(name)')
      .eq('id', user.id)
      .single()

    if (!currentUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    const requestingOrgName =
      (currentUser.organizations as unknown as { name: string } | null)?.name ?? 'A member newsroom'

    const serviceSupabase = await createServiceClient()
    const { data: story } = await serviceSupabase
      .from('stories')
      .select('id, title, status, organization_id, organizations(contact_emails)')
      .eq('id', story_id)
      .single()

    if (!story) return NextResponse.json({ error: 'Story not found.' }, { status: 404 })

    if (story.status === 'withdrawn') {
      return NextResponse.json({ error: 'Story has been withdrawn.' }, { status: 404 })
    }

    if (story.organization_id === currentUser.organization_id) {
      return NextResponse.json({ error: 'Cannot request assets from your own story.' }, { status: 400 })
    }

    const excludedOrgIds = await getExcludedOrgIds(supabase, currentUser.organization_id)
    if (excludedOrgIds.includes(story.organization_id)) {
      return NextResponse.json({ error: 'Story is not available.' }, { status: 403 })
    }

    const contacts =
      (story.organizations as unknown as { contact_emails: string[] } | null)?.contact_emails ?? []

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No contact emails found for this organization.' }, { status: 400 })
    }

    await sendAssetRequestEmail(contacts, requestingOrgName, story.title, story.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
