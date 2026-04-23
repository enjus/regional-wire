'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

interface Props {
  orgs: { id: string; name: string }[]
  currentOrgId: string
}

export default function LibraryFilters({ orgs }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  function clearAll() {
    const tab = searchParams.get('tab')
    if (tab) {
      router.push(`${pathname}?tab=${tab}`)
    } else {
      router.push(pathname)
    }
  }

  const hasFilters =
    searchParams.has('org') ||
    searchParams.has('from') ||
    searchParams.has('to') ||
    searchParams.has('source')

  return (
    <div className="flex flex-wrap items-end gap-3 mb-5">
      <div>
        <label className="block text-xs font-medium text-wire-slate mb-1">
          Newsroom
        </label>
        <select
          value={searchParams.get('org') ?? ''}
          onChange={(e) => updateParam('org', e.target.value)}
          className="border border-wire-border rounded px-2 py-1.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
        >
          <option value="">All newsrooms</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-wire-slate mb-1">
          Source
        </label>
        <select
          value={searchParams.get('source') ?? ''}
          onChange={(e) => updateParam('source', e.target.value)}
          className="border border-wire-border rounded px-2 py-1.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
        >
          <option value="">All sources</option>
          <option value="manual">Manual upload</option>
          <option value="feed">Feed</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-wire-slate mb-1">
          From date
        </label>
        <input
          type="date"
          value={searchParams.get('from') ?? ''}
          onChange={(e) => updateParam('from', e.target.value)}
          className="border border-wire-border rounded px-2 py-1.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-wire-slate mb-1">
          To date
        </label>
        <input
          type="date"
          value={searchParams.get('to') ?? ''}
          onChange={(e) => updateParam('to', e.target.value)}
          className="border border-wire-border rounded px-2 py-1.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
        />
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-sm text-wire-slate hover:text-wire-navy underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
