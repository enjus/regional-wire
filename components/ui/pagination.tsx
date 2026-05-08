import Link from 'next/link'

export default function Pagination({
  page,
  totalPages,
  basePath,
  extraParams,
}: {
  page: number
  totalPages: number
  basePath: string
  extraParams?: Record<string, string>
}) {
  if (totalPages <= 1) return null

  const buildUrl = (p: number) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries({ ...extraParams, page: String(p) }).filter(([, v]) => v != null)
      )
    )
    return `${basePath}?${qs}`
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      {page > 1 && (
        <Link href={buildUrl(page - 1)} className="text-sm text-wire-slate hover:text-wire-navy">
          ← Previous
        </Link>
      )}
      <span className="text-sm text-wire-slate">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link href={buildUrl(page + 1)} className="text-sm text-wire-slate hover:text-wire-navy">
          Next →
        </Link>
      )}
    </div>
  )
}
