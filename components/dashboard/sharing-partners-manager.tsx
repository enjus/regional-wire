'use client'

import { useState } from 'react'

interface PartnerRow {
  id: string
  partner_id: string
  created_at: string
  partner_name: string
}

interface AvailableOrg {
  id: string
  name: string
}

interface Props {
  orgId: string
  initialSharingMode: 'open' | 'restricted'
  initialPartners: PartnerRow[]
  availableOrgs: AvailableOrg[]
}

export default function SharingPartnersManager({
  orgId,
  initialSharingMode,
  initialPartners,
  availableOrgs: initialAvailableOrgs,
}: Props) {
  const [sharingMode, setSharingMode] = useState(initialSharingMode)
  const [partners, setPartners] = useState(initialPartners)
  const [availableOrgs, setAvailableOrgs] = useState(initialAvailableOrgs)
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [confirmingRestricted, setConfirmingRestricted] = useState(false)
  const [modeLoading, setModeLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleModeChange(newMode: 'open' | 'restricted') {
    setModeLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharing_mode: newMode }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      setSharingMode(newMode)
    } catch {
      setError('Network error.')
    } finally {
      setModeLoading(false)
    }
  }

  async function handleAddPartner() {
    if (!selectedOrgId) return
    setLoading(true)
    setError(null)
    const partnerName = availableOrgs.find((o) => o.id === selectedOrgId)?.name ?? ''
    try {
      const res = await fetch(`/api/orgs/${orgId}/sharing-partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: selectedOrgId }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      const row = await res.json()
      setPartners((prev) => [{ ...row, partner_name: partnerName }, ...prev])
      setAvailableOrgs((prev) => prev.filter((o) => o.id !== selectedOrgId))
      setSelectedOrgId('')
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(partner: PartnerRow) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/sharing-partners/${partner.partner_id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      setPartners((prev) => prev.filter((p) => p.id !== partner.id))
      setAvailableOrgs((prev) =>
        [...prev, { id: partner.partner_id, name: partner.partner_name }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      )
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Sharing mode toggle */}
      <div>
        <h2 className="font-serif text-xl font-bold text-wire-navy mb-1">Sharing Mode</h2>
        <p className="text-sm text-wire-slate mb-4">
          Controls who can see your stories and whose stories you can see.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => { setConfirmingRestricted(false); if (sharingMode !== 'open') handleModeChange('open') }}
            disabled={modeLoading}
            className={`flex-1 rounded border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
              sharingMode === 'open'
                ? 'border-wire-red bg-wire-red/5 ring-1 ring-wire-red'
                : 'border-wire-border hover:border-wire-navy'
            }`}
          >
            <p className="font-medium text-sm text-wire-navy">Open</p>
            <p className="text-xs text-wire-slate mt-0.5">
              Your stories are visible to all network members. You can see everyone&apos;s stories.
            </p>
          </button>
          <button
            onClick={() => {
              if (sharingMode !== 'restricted') setConfirmingRestricted(true)
            }}
            disabled={modeLoading}
            className={`flex-1 rounded border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
              sharingMode === 'restricted'
                ? 'border-wire-red bg-wire-red/5 ring-1 ring-wire-red'
                : 'border-wire-border hover:border-wire-navy'
            }`}
          >
            <p className="font-medium text-sm text-wire-navy">Selective</p>
            <p className="text-xs text-wire-slate mt-0.5">
              Your stories are only visible to your listed partners. You can only see their stories.
            </p>
          </button>
        </div>

        {confirmingRestricted && (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
            <p className="text-sm text-amber-800">
              Switching to selective mode takes effect immediately. Your stories will become invisible to everyone except your listed partners, and you will only see their stories. You can switch back to open mode at any time.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmingRestricted(false); handleModeChange('restricted') }}
                disabled={modeLoading}
                className="text-sm font-medium text-white bg-wire-red hover:bg-wire-red-dark rounded px-4 py-1.5 transition-colors disabled:opacity-50"
              >
                {modeLoading ? 'Saving…' : 'Switch to selective'}
              </button>
              <button
                onClick={() => setConfirmingRestricted(false)}
                disabled={modeLoading}
                className="text-sm text-wire-slate hover:text-wire-navy transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {!confirmingRestricted && modeLoading && <p className="text-xs text-wire-slate mt-2">Saving…</p>}
      </div>

      {/* Partner list */}
      <div>
        <h2 className="font-serif text-xl font-bold text-wire-navy mb-1">
          Sharing Partners
        </h2>
        <p className="text-sm text-wire-slate mb-4">
          {sharingMode === 'restricted'
            ? 'These organizations can see your stories and you can see theirs.'
            : 'Configured partners — these take effect if you switch to selective mode.'}
        </p>

        {partners.length > 0 ? (
          <ul className="divide-y divide-wire-border border border-wire-border rounded mb-4">
            {partners.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium text-sm text-wire-navy truncate">
                    {p.partner_name}
                  </span>
                  <span className="text-xs text-wire-slate shrink-0">
                    {new Date(p.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(p)}
                  disabled={loading}
                  className="shrink-0 text-xs text-wire-slate hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-wire-slate mb-4">No sharing partners configured.</p>
        )}

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {availableOrgs.length > 0 && (
          <div className="border border-wire-border rounded p-4 space-y-3">
            <p className="text-sm font-medium text-wire-navy">Add a sharing partner</p>
            <div className="flex gap-2">
              <select
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value)
                  setError(null)
                }}
                className="flex-1 max-w-sm border border-wire-border rounded px-3 py-2 text-base text-wire-navy bg-white focus:outline-none focus:ring-2 focus:ring-wire-red"
              >
                <option value="">Select a publisher…</option>
                {availableOrgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddPartner}
                disabled={!selectedOrgId || loading}
                className="text-sm font-medium text-white bg-wire-red hover:bg-wire-red-dark rounded px-4 py-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
