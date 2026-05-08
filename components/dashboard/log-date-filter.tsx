'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export default function LogDateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasDateFilter = searchParams.has('from') || searchParams.has('to')

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6">
      <div>
        <label className="block text-xs font-medium text-wire-slate mb-1">
          From
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
          To
        </label>
        <input
          type="date"
          value={searchParams.get('to') ?? ''}
          onChange={(e) => updateParam('to', e.target.value)}
          className="border border-wire-border rounded px-2 py-1.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
        />
      </div>
      {hasDateFilter && (
        <button
          onClick={() => router.push(pathname)}
          className="text-sm text-wire-slate hover:text-wire-navy underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
