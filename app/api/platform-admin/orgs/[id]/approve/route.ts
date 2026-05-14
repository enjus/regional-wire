import { NextResponse, type NextRequest } from 'next/server'
import { checkPlatformAdmin, createAdminSupabase } from '@/lib/platform-admin'
import { sendOrgApprovedEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await checkPlatformAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminSupabase()

  const { data: org, error } = await supabase
    .from('organizations')
    .update({ status: 'approved' })
    .eq('id', id)
    .select()
    .single()

  if (error || !org) {
    return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
  }

  // Seed invites for contact emails so they get active+admin status on registration
  // without relying on the first-user heuristic. Critical for orgs with no email domain.
  try {
    const contactEmails: string[] = Array.isArray(org.contact_emails) ? org.contact_emails : []
    const normalized = contactEmails
      .filter((e): e is string => typeof e === 'string' && e.trim().length > 0)
      .map((e) => e.trim().toLowerCase())

    if (normalized.length > 0) {
      const { data: existing } = await supabase
        .from('org_invites')
        .select('email')
        .eq('org_id', org.id)
        .is('used_at', null)

      const existingSet = new Set((existing ?? []).map((row: { email: string }) => row.email.toLowerCase()))
      const toInsert = Array.from(new Set(normalized))
        .filter((email) => !existingSet.has(email))
        .map((email) => ({ org_id: org.id, email, invited_by: null, used_at: null }))

      if (toInsert.length > 0) {
        const { error: inviteError } = await supabase.from('org_invites').insert(toInsert)
        if (inviteError) {
          console.error('Failed to seed org invites for contact emails:', inviteError)
        }
      }
    }
  } catch (err) {
    console.error('Failed to seed org invites for contact emails:', err)
  }

  await sendOrgApprovedEmail(org).catch((err) =>
    console.error('Failed to send approval email:', err)
  )

  return NextResponse.json({ ok: true })
}
