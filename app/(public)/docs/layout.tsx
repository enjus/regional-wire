import DocsNav from './docs-nav'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <div className="flex gap-14">
        {/* Sidebar */}
        <aside className="hidden sm:block w-48 flex-shrink-0">
          <div className="sticky top-24">
            <DocsNav />
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}
