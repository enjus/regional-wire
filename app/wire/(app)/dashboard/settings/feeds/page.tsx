import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import FeedManager from '@/components/dashboard/feed-manager'

export const metadata = { title: 'Feed Settings' }

export default async function FeedsSettingsPage() {
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
      <div className="text-sm text-wire-slate">Only org admins can manage feeds.</div>
    )
  }

  const { data: feeds } = await supabase
    .from('org_feeds')
    .select('*')
    .eq('organization_id', currentUser.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-xl font-bold text-wire-navy">Feed Settings</h2>
        <p className="text-wire-slate text-sm mt-1">
          Connect RSS/Atom feeds. Full-text feeds auto-populate the library;
          headline feeds surface stories for request.
        </p>
      </div>

      <FeedManager feeds={feeds ?? []} orgId={currentUser.organization_id} />
    </div>
  )
}
