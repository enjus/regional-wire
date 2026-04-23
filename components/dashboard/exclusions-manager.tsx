'use client'

import { useState } from 'react'

interface ExclusionRow {
  id: string
  initiator_id: string
  excluded_id: string
  created_at: string
  other_org_name: string
}

interface AvailableOrg {
  id: string
  name: string
}

interface Props {
  orgId: string
  initialExclusions: ExclusionRow[]
  availableOrgs: AvailableOrg[]
}

export default function ExclusionsManager({ orgId, initialExclusions, availableOrgs }: Props) {
  const [exclusions, setExclusions] = useState(initialExclusions)
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedOrgName = availableOrgs.find((o) => o.id === selectedOrgId)?.name ?? ''

  const alreadyExcludedIds = new Set(exclusions.map((e) =>
    e.initiator_id === orgId ? e.excluded_id : e.initiator_id
  ))
  const pickableOrgs = availableOrgs.filter((o) => !alreadyExcludedIds.has(o.id))

  async function handleExclude() {
    if (!selectedOrgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/exclusions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excluded_org_id: selectedOrgId }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      const row = await res.json()
      setExclusions((prev) => [
        ...prev,
        { ...row, other_org_name: selectedOrgName },
      ])
      setSelectedOrgId('')
      setConfirming(false)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(exclusion: ExclusionRow) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/orgs/${orgId}/exclusions/${exclusion.excluded_id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      setExclusions((prev) => prev.filter((e) => e.id !== exclusion.id))
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-wire-navy mb-1">
          Excluded Organizations
        </h2>
        <p className="text-sm text-wire-slate">
          When you exclude a publisher, their stories are hidden from your library — and your stories are hidden from theirs. Exclusions are mutual.
        </p>
      </div>

      {exclusions.length > 0 ? (
        <ul className="divide-y divide-wire-border border border-wire-border rounded">
          {exclusions.map((ex) => {
            const isInitiator = ex.initiator_id === orgId
            return (
              <li
                key={ex.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium text-sm text-wire-navy truncate">
                    {ex.other_org_name}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 font-medium shrink-0">
                    Excluded
                  </span>
                  <span className="text-xs text-wire-slate shrink-0">
                    {new Date(ex.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {isInitiator && (
                  <button
                    onClick={() => handleRemove(ex)}
                    disabled={loading}
                    className="shrink-0 text-xs text-wire-slate hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-wire-slate">No exclusions configured.</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {pickableOrgs.length > 0 && (
        <div className="border border-wire-border rounded p-4 space-y-3">
          <p className="text-sm font-medium text-wire-navy">Exclude an organization</p>
          <select
            value={selectedOrgId}
            onChange={(e) => {
              setSelectedOrgId(e.target.value)
              setConfirming(false)
              setError(null)
            }}
            className="block w-full max-w-sm border border-wire-border rounded px-3 py-2 text-sm text-wire-navy bg-white focus:outline-none focus:ring-2 focus:ring-wire-red"
          >
            <option value="">Select a publisher…</option>
            {pickableOrgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          {selectedOrgId && !confirming && (
            <div className="space-y-2">
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                This will hide <strong>{selectedOrgName}</strong>&apos;s content from your library and hide your content from theirs.
              </p>
              <button
                onClick={() => setConfirming(true)}
                className="text-sm font-medium text-white bg-wire-red hover:bg-wire-red-dark rounded px-4 py-1.5 transition-colors"
              >
                Exclude {selectedOrgName}
              </button>
            </div>
          )}

          {confirming && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-wire-navy">Are you sure?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleExclude}
                  disabled={loading}
                  className="text-sm font-medium text-white bg-wire-red hover:bg-wire-red-dark rounded px-4 py-1.5 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Confirm exclusion'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  className="text-sm text-wire-slate hover:text-wire-navy transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
