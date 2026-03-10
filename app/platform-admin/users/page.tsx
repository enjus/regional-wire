import { requirePlatformAdmin, createAdminSupabase } from '@/lib/platform-admin'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Users — Admin' }

export default async function AdminUsersPage() {
  await requirePlatformAdmin()
  const supabase = createAdminSupabase()

  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, email, role, created_at, is_platform_admin, organizations(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-bold text-slate-900 mb-6">
        Users ({users?.length ?? 0})
      </h1>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {!users?.length ? (
          <p className="text-sm text-slate-500 p-6">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Organization
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const orgName = (
                    user.organizations as unknown as { name: string } | null
                  )?.name
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {user.display_name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{user.email}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {orgName ?? (
                          <span className="text-slate-400 italic">Platform admin</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.is_platform_admin ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-900 text-white">
                            platform admin
                          </span>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
