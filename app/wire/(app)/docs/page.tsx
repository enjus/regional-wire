import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Help — ${brand.name}`,
}

const SECTIONS = [
  {
    label: 'For publishers',
    items: [
      {
        href: '/wire/docs/uploading-stories',
        title: 'Uploading stories',
        desc: 'Manual upload workflow: editor, metadata, embargoes, and assets.',
      },
      {
        href: '/wire/docs/feeds',
        title: 'RSS feed ingestion',
        desc: 'Auto-ingesting stories from your CMS feed every 15 minutes.',
      },
      {
        href: '/wire/docs/alerts',
        title: 'Story alerts',
        desc: 'Receiving email digests when member organizations publish.',
      },
    ],
  },
  {
    label: 'For editors',
    items: [
      {
        href: '/wire/docs/republishing',
        title: 'Republishing stories',
        desc: 'Using the library, copying the republication package, and logging.',
      },
      {
        href: '/wire/docs/requests',
        title: 'Story requests',
        desc: 'Requesting unpublished or headline-only stories from other newsrooms.',
      },
    ],
  },
]

export default function DocsIndexPage() {
  return (
    <div>
      <div className="mb-10 pb-8 border-b border-wire-border">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-px w-8 bg-wire-red flex-shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wire-red">Help</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-wire-navy mb-4">
          {brand.name} docs
        </h1>
        <p className="text-wire-slate leading-relaxed max-w-lg">
          How to use the platform — uploading stories, setting up feeds, republishing
          content from other members, and more.
        </p>
      </div>

      <div className="space-y-10">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-4">
              {section.label}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-4 p-4 rounded-lg border border-wire-border bg-white hover:border-wire-navy/15 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-wire-navy text-sm group-hover:text-wire-red transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-wire-slate mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" className="text-wire-border group-hover:text-wire-red transition-colors flex-shrink-0 mt-0.5" aria-hidden>
                    <path d="M3.75 8a.75.75 0 01.75-.75h6.19L8.22 4.78a.75.75 0 011.06-1.06l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 11-1.06-1.06L11.25 9.5H4.5A.75.75 0 013.75 8z" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
