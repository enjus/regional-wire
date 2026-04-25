import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MembersManager from '@/components/dashboard/members-manager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Members' }

export default async function MembersSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('id, organization_id, role')
    .eq('id', user.id)
    .single()

  if (!currentUser) redirect('/register')

  if (currentUser.role !== 'admin') {
    return (
      <div className="text-sm text-wire-slate">Only org admins can manage members.</div>
    )
  }

  const orgId = currentUser.organization_id
  const service = createServiceClient()

  const [{ data: members }, { data: invites }] = await Promise.all([
    service
      .from('users')
      .select('id, display_name, email, role, status, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true }),
    service
      .from('org_invites')
      .select('id, email, created_at')
      .eq('org_id', orgId)
      .is('used_at', null)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-xl font-bold text-wire-navy">Members</h2>
        <p className="text-wire-slate text-sm mt-1">
          Approve new members, manage roles, and invite colleagues to your newsroom.
        </p>
      </div>

      <MembersManager
        orgId={orgId}
        currentUserId={currentUser.id}
        initialMembers={members ?? []}
        initialInvites={invites ?? []}
      />
    </div>
  )
}
