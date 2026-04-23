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
