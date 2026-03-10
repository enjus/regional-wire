import { requirePlatformAdmin } from '@/lib/platform-admin'
import AdminNav from '@/components/platform-admin/admin-nav'

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { adminUser } = await requirePlatformAdmin()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 flex flex-col shrink-0 fixed inset-y-0 left-0 z-10">
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="text-wire-red font-bold text-xs tracking-widest uppercase">
            Regional Wire
          </div>
          <div className="text-white font-semibold text-sm mt-0.5">Platform Admin</div>
        </div>

        <AdminNav />

        <div className="px-5 py-4 border-t border-slate-700">
          <p className="text-slate-400 text-xs truncate">{adminUser.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 min-h-screen">{children}</main>
    </div>
  )
}
