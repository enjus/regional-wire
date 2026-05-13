import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SharingPartnersManager from '@/components/dashboard/sharing-partners-manager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sharing Partners' }

export default async function SharingPartnersSettingsPage() {
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
      <div className="text-sm text-wire-slate">Only org admins can manage sharing partners.</div>
    )
  }

  const orgId = currentUser.organization_id
  const serviceClient = createServiceClient()

  const [{ data: org }, { data: partnerRows }, { data: allOrgs }] = await Promise.all([
    serviceClient.from('organizations').select('id, sharing_mode').eq('id', orgId).single(),
    serviceClient
      .from('org_sharing_partners')
      .select('id, partner_id, created_at, partner:organizations!partner_id(name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    serviceClient.from('organizations').select('id, name').eq('status', 'approved').neq('id', orgId).order('name'),
  ])

  const partners = (partnerRows ?? []).map((row) => ({
    id: row.id as string,
    partner_id: row.partner_id as string,
    created_at: row.created_at as string,
    partner_name: (row.partner as unknown as { name: string } | null)?.name ?? 'Unknown',
  }))

  const alreadyPartneredIds = new Set(partners.map((p) => p.partner_id))
  const availableOrgs = (allOrgs ?? []).filter((o) => !alreadyPartneredIds.has(o.id))

  return (
    <SharingPartnersManager
      orgId={orgId}
      initialSharingMode={(org?.sharing_mode ?? 'open') as 'open' | 'restricted'}
      initialPartners={partners}
      availableOrgs={availableOrgs}
    />
  )
}
