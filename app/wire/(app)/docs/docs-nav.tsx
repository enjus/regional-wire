'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  {
    label: null,
    items: [{ href: '/wire/docs', label: 'Overview' }],
  },
  {
    label: 'For publishers',
    items: [
      { href: '/wire/docs/uploading-stories', label: 'Uploading stories' },
      { href: '/wire/docs/feeds', label: 'RSS feed ingestion' },
      { href: '/wire/docs/alerts', label: 'Story alerts' },
      { href: '/wire/docs/exclusions', label: 'Publisher exclusions' },
    ],
  },
  {
    label: 'For editors',
    items: [
      { href: '/wire/docs/republishing', label: 'Republishing stories' },
      { href: '/wire/docs/requests', label: 'Story requests' },
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
