import type { SupabaseClient } from '@supabase/supabase-js'

export async function getExcludedOrgIds(
  client: SupabaseClient,
  orgId: string
): Promise<string[]> {
  const { data } = await client
    .from('org_exclusions')
    .select('initiator_id, excluded_id')
    .or(`initiator_id.eq.${orgId},excluded_id.eq.${orgId}`)

  return (data ?? []).map((r: { initiator_id: string; excluded_id: string }) =>
    r.initiator_id === orgId ? r.excluded_id : r.initiator_id
  )
}

export type SharingFilter =
  | { type: 'allowlist'; orgIds: string[] }
  | { type: 'blocklist'; orgIds: string[] }

export async function getSharingFilter(
  client: SupabaseClient,
  viewerOrgId: string
): Promise<SharingFilter> {
  // Single query: fetch viewer's own mode + all restricted orgs together.
  // For open viewers with no restricted orgs in the network (common early case) this is the only query needed.
  const { data: orgs } = await client
    .from('organizations')
    .select('id, sharing_mode')
    .or(`id.eq.${viewerOrgId},sharing_mode.eq.restricted`)

  const viewerMode = orgs?.find((o: { id: string }) => o.id === viewerOrgId)?.sharing_mode ?? 'open'

  if (viewerMode === 'restricted') {
    const { data: partners } = await client
      .from('org_sharing_partners')
      .select('partner_id')
      .eq('org_id', viewerOrgId)
    return { type: 'allowlist', orgIds: (partners ?? []).map((p: { partner_id: string }) => p.partner_id) }
  }

  // Open viewer: blocked = restricted orgs that haven't listed viewer as a partner
  const restrictedIds = (orgs ?? [])
    .filter((o: { id: string; sharing_mode: string }) => o.id !== viewerOrgId && o.sharing_mode === 'restricted')
    .map((o: { id: string }) => o.id)

  if (!restrictedIds.length) return { type: 'blocklist', orgIds: [] }

  const { data: partnerships } = await client
    .from('org_sharing_partners')
    .select('org_id')
    .eq('partner_id', viewerOrgId)
    .in('org_id', restrictedIds)

  const partnered = new Set((partnerships ?? []).map((p: { org_id: string }) => p.org_id))
  return {
    type: 'blocklist',
    orgIds: restrictedIds.filter((id) => !partnered.has(id)),
  }
}

// Returns true if the given org's stories should be visible to the viewer.
// Exclusions always apply first — each org controls who can see its content.
export function isOrgVisible(
  orgId: string,
  excludedOrgIds: string[],
  sharingFilter: SharingFilter
): boolean {
  if (excludedOrgIds.includes(orgId)) return false
  if (sharingFilter.type === 'allowlist') return sharingFilter.orgIds.includes(orgId)
  return !sharingFilter.orgIds.includes(orgId)
}

// Applies org visibility constraints to a Supabase query builder chain.
export function applyOrgVisibilityFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  sharingFilter: SharingFilter,
  excludedOrgIds: string[],
  column = 'organization_id'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (sharingFilter.type === 'allowlist') {
    const allowed = sharingFilter.orgIds.filter((id) => !excludedOrgIds.includes(id))
    // Use a null UUID when no partners exist so the query returns 0 rows safely.
    return query.in(column, allowed.length > 0 ? allowed : ['00000000-0000-0000-0000-000000000000'])
  }
  const allHidden = [...new Set([...sharingFilter.orgIds, ...excludedOrgIds])]
  if (allHidden.length > 0) {
    return query.not(column, 'in', `(${allHidden.join(',')})`)
  }
  return query
}
