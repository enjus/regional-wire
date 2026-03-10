'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/platform-admin', label: 'Overview' },
  { href: '/platform-admin/orgs', label: 'Organizations' },
  { href: '/platform-admin/stories', label: 'Stories' },
  { href: '/platform-admin/users', label: 'Users' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map(({ href, label }) => {
        const active =
          pathname === href ||
          (href !== '/platform-admin' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
              active
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
