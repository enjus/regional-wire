import { createServerClient } from '@supabase/ssr'
import { formatDate } from '@/lib/utils'
import AdminOrgActions, { AdminRemoveAction } from './admin-org-actions'
import { brand } from '@/lib/brand'

export const dynamic = 'force-dynamic'
export const metadata = { title: `Admin — ${brand.name}` }

async function getAdminData() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const [{ data: pending }, { data: approved }, { data: suspended }] =
    await Promise.all([
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

  return { pending: pending ?? [], approved: approved ?? [], suspended: suspended ?? [] }
}

export default async function AdminPage() {
  const { pending, approved, suspended } = await getAdminData()

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-wire-navy">
          Platform Admin
        </h1>
        <p className="text-wire-slate text-sm mt-1">{brand.name}</p>
      </div>

      {/* Pending */}
      <section className="mb-10">
        <h2 className="font-serif text-xl font-bold text-wire-navy mb-4 flex items-center gap-2">
          Pending Applications
          {pending.length > 0 && (
            <span className="text-sm bg-wire-red text-white rounded-full px-2 py-0.5">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="text-sm text-wire-slate">No pending applications.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((org) => (
              <div
                key={org.id}
                className="bg-white border border-wire-border rounded p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-wire-navy text-lg">
                      {org.name}
                    </h3>
                    <p className="text-sm text-wire-slate mt-0.5">
                      <a
                        href={org.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {org.website_url}
                      </a>
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-wire-slate">
                      <p>
                        <span className="font-medium text-wire-navy">Domain:</span>{' '}
                        {org.email_domain}
                      </p>
                      <p>
                        <span className="font-medium text-wire-navy">Contacts:</span>{' '}
                        {org.contact_emails.join(', ')}
                      </p>
                      {org.description && (
                        <p>
                          <span className="font-medium text-wire-navy">Coverage:</span>{' '}
                          {org.description}
                        </p>
                      )}
                      <p>
                        <span className="font-medium text-wire-navy">Submitted:</span>{' '}
                        {formatDate(org.created_at)}
                      </p>
                    </div>
                  </div>

                  <AdminOrgActions orgId={org.id} orgName={org.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section className="mb-10">
        <h2 className="font-serif text-xl font-bold text-wire-navy mb-4">
          Approved Members ({approved.length})
        </h2>
        <div className="space-y-2">
          {approved.map((org) => (
            <div
              key={org.id}
              className="bg-white border border-wire-border rounded px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-wire-navy">{org.name}</p>
                <p className="text-xs text-wire-slate">
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
                <AdminRemoveAction orgId={org.id} orgName={org.name} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suspended / Rejected */}
      {suspended.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold text-wire-navy mb-4">
            Rejected / Suspended ({suspended.length})
          </h2>
          <div className="space-y-2">
            {suspended.map((org) => (
              <div
                key={org.id}
                className="bg-white border border-wire-border rounded px-4 py-3 flex items-center justify-between opacity-60"
              >
                <div>
                  <p className="text-sm font-medium text-wire-navy">{org.name}</p>
                  <p className="text-xs text-wire-slate">{org.email_domain}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
