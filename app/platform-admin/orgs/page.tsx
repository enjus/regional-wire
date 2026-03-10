import { requirePlatformAdmin, createAdminSupabase } from '@/lib/platform-admin'
import { formatDate } from '@/lib/utils'
import OrgActions from '@/components/platform-admin/org-actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Organizations — Admin' }

export default async function AdminOrgsPage() {
  await requirePlatformAdmin()
  const supabase = createAdminSupabase()

  const [{ data: pending }, { data: approved }, { data: suspended }] = await Promise.all([
    supabase
      .from('organizations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('organizations')
      .select('id, name, email_domain, website_url, contact_emails, created_at')
      .eq('status', 'approved')
      .order('name'),
    supabase
      .from('organizations')
      .select('id, name, email_domain, created_at')
      .eq('status', 'suspended')
      .order('name'),
  ])

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-bold text-slate-900 mb-8">Organizations</h1>

      {/* Pending applications */}
      <section className="mb-10">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          Pending Applications
          {(pending?.length ?? 0) > 0 && (
            <span className="text-xs bg-wire-red text-white rounded-full px-2 py-0.5">
              {pending!.length}
            </span>
          )}
        </h2>
        {!pending?.length ? (
          <p className="text-sm text-slate-500">No pending applications.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((org) => (
              <div key={org.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{org.name}</h3>
                    <a
                      href={org.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 hover:underline"
                    >
                      {org.website_url}
                    </a>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium">Domain:</span> {org.email_domain}
                      </p>
                      <p>
                        <span className="font-medium">Contacts:</span>{' '}
                        {org.contact_emails?.join(', ')}
                      </p>
                      {org.description && (
                        <p>
                          <span className="font-medium">Coverage:</span> {org.description}
                        </p>
                      )}
                      {org.republication_guidance && (
                        <p>
                          <span className="font-medium">Republication guidance:</span>{' '}
                          {org.republication_guidance}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Submitted:</span>{' '}
                        {formatDate(org.created_at)}
                      </p>
                    </div>
                  </div>
                  <OrgActions orgId={org.id} orgName={org.name} status="pending" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved members */}
      <section className="mb-10">
        <h2 className="font-semibold text-slate-900 mb-4">
          Approved Members ({approved?.length ?? 0})
        </h2>
        {!approved?.length ? (
          <p className="text-sm text-slate-500">No approved members.</p>
        ) : (
          <div className="space-y-2">
            {approved.map((org) => (
              <div
                key={org.id}
                className="bg-white border border-gray-200 rounded p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">
                    {org.email_domain} · Approved {formatDate(org.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={org.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-wire-red hover:underline"
                  >
                    Website ↗
                  </a>
                  <OrgActions orgId={org.id} orgName={org.name} status="approved" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Suspended / rejected */}
      {(suspended?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-semibold text-slate-900 mb-4">
            Suspended / Rejected ({suspended!.length})
          </h2>
          <div className="space-y-2">
            {suspended!.map((org) => (
              <div
                key={org.id}
                className="bg-white border border-gray-200 rounded p-4 flex items-center justify-between opacity-70"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">{org.email_domain}</p>
                </div>
                <OrgActions orgId={org.id} orgName={org.name} status="suspended" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
