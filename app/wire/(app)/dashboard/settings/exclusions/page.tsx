import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExclusionsManager from '@/components/dashboard/exclusions-manager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Exclusions' }

export default async function ExclusionsSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!currentUser) redirect('/register')

  if (currentUser.role !== 'admin') {
    return (
      <div className="text-sm text-wire-slate">Only org admins can manage exclusions.</div>
    )
  }

  const orgId = currentUser.organization_id
  const serviceClient = createServiceClient()

  // Fetch org mode, exclusions, and available orgs in parallel
  const [orgResult, exclusionRows, allOrgsResult] = await Promise.all([
    serviceClient.from('organizations').select('sharing_mode').eq('id', orgId).single(),
    serviceClient
      .from('org_exclusions')
      .select('id, initiator_id, excluded_id, created_at, initiator:organizations!initiator_id(name), excluded:organizations!excluded_id(name)')
      .or(`initiator_id.eq.${orgId},excluded_id.eq.${orgId}`)
      .order('created_at', { ascending: false })
      .then((r) => r.data),
    serviceClient
      .from('organizations')
      .select('id, name')
      .eq('status', 'approved')
      .neq('id', orgId)
      .order('name')
      .then((r) => r.data),
  ])

  const sharingMode = (orgResult.data?.sharing_mode ?? 'open') as 'open' | 'restricted'

  const exclusions = (exclusionRows ?? []).map((row) => {
    const isInitiator = row.initiator_id === orgId
    const otherOrgName = isInitiator
      ? (row.excluded as unknown as { name: string } | null)?.name ?? 'Unknown'
      : (row.initiator as unknown as { name: string } | null)?.name ?? 'Unknown'
    return {
      id: row.id as string,
      initiator_id: row.initiator_id as string,
      excluded_id: row.excluded_id as string,
      created_at: row.created_at as string,
      other_org_name: otherOrgName,
    }
  })

  return (
    <ExclusionsManager
      orgId={orgId}
      sharingMode={sharingMode}
      initialExclusions={exclusions}
      availableOrgs={allOrgsResult ?? []}
    />
  )
}
