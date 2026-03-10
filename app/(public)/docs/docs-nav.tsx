'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  {
    label: null,
    items: [{ href: '/docs', label: 'Overview' }],
  },
  {
    label: 'Getting started',
    items: [{ href: '/docs/getting-started', label: 'Quick start guide' }],
  },
  {
    label: 'For publishers',
    items: [
      { href: '/docs/uploading-stories', label: 'Uploading stories' },
      { href: '/docs/feeds', label: 'RSS feed ingestion' },
      { href: '/docs/alerts', label: 'Story alerts' },
    ],
  },
  {
    label: 'For editors',
    items: [
      { href: '/docs/republishing', label: 'Republishing stories' },
      { href: '/docs/requests', label: 'Story requests' },
    ],
  },
]

export default function DocsNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-5">
      {SECTIONS.map((section, i) => (
        <div key={i}>
          {section.label && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-1.5 px-2">
              {section.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-2 py-1.5 rounded text-sm transition-colors ${
                      active
                        ? 'bg-wire-red/8 text-wire-red font-medium'
                        : 'text-wire-slate hover:text-wire-navy hover:bg-wire-bg'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
