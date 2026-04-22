'use client'

import { useState } from 'react'
import { StoryAlert, UserDigestPrefs } from '@/lib/types'

interface Props {
  alerts: StoryAlert[]
  orgId: string
  organizations: { id: string; name: string }[]
  digestPrefs: UserDigestPrefs | null
}

const UTC_HOURS = Array.from({ length: 24 }, (_, i) => i)

// Convert UTC hour to Pacific Time for display
function utcToPacific(utcHour: number): number {
  // Pacific is UTC-8 (standard) or UTC-7 (daylight). Use UTC-8 as a standard offset.
  let pacificHour = utcHour - 8
  if (pacificHour < 0) pacificHour += 24
  return pacificHour
}

// Convert Pacific hour back to UTC for storage
function pacificToUtc(pacificHour: number): number {
  let utcHour = pacificHour + 8
  if (utcHour >= 24) utcHour -= 24
  return utcHour
}

function formatHour(utcHour: number) {
  const pacificHour = utcToPacific(utcHour)
  const period = pacificHour < 12 ? 'AM' : 'PM'
  const display = pacificHour % 12 === 0 ? 12 : pacificHour % 12
  return `${display}:00 ${period}`
}

export default function AlertsManager({ alerts: initialAlerts, orgId, organizations, digestPrefs: initialPrefs }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts)

  // Keyword alert form
  const [keywords, setKeywords] = useState('')
  const [addingKeyword, setAddingKeyword] = useState(false)
  const [keywordError, setKeywordError] = useState('')

  // Org follow form
  const [followOrgId, setFollowOrgId] = useState('')
  const [addingFollow, setAddingFollow] = useState(false)
  const [followError, setFollowError] = useState('')

  // Daily digest prefs (stored as UTC, but displayed as Pacific)
  const [digestEnabled, setDigestEnabled] = useState(initialPrefs?.daily_digest_enabled ?? false)
  const [deliveryHourUtc, setDeliveryHourUtc] = useState(initialPrefs?.delivery_hour_utc ?? 15) // 15 UTC = 7 AM Pacific
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsMessage, setPrefsMessage] = useState('')

  async function handleAddKeywordAlert() {
    const kws = keywords.split(',').map((k) => k.trim()).filter(Boolean)
    if (!kws.length) {
      setKeywordError('Enter at least one keyword.')
      return
    }
    setAddingKeyword(true)
    setKeywordError('')

    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: kws }),
    })

    if (res.ok) {
      const data = await res.json()
      setAlerts([data, ...alerts])
      setKeywords('')
    } else {
      const data = await res.json()
      setKeywordError(data.error ?? 'Failed to add alert.')
    }
    setAddingKeyword(false)
  }

  async function handleAddOrgFollow() {
    if (!followOrgId) {
      setFollowError('Select a newsroom.')
      return
    }
    setAddingFollow(true)
    setFollowError('')

    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followed_organization_id: followOrgId }),
    })

    if (res.ok) {
      const data = await res.json()
      const orgName = organizations.find((o) => o.id === followOrgId)?.name ?? 'Unknown'
      setAlerts([{ ...data, followed_org: { id: followOrgId, name: orgName } }, ...alerts])
      setFollowOrgId('')
    } else {
      const data = await res.json()
      setFollowError(data.error ?? 'Failed to add follow.')
    }
    setAddingFollow(false)
  }

  async function toggleAlert(alertId: string, isActive: boolean) {
    const res = await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    if (!res.ok) {
      alert('Failed to update alert. Please try again.')
      return
    }
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, is_active: !isActive } : a)))
  }

  async function deleteAlert(alertId: string) {
    if (!confirm('Delete this alert?')) return
    const res = await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('Failed to delete alert. Please try again.')
      return
    }
    setAlerts(alerts.filter((a) => a.id !== alertId))
  }

  async function saveDigestPrefs() {
    setSavingPrefs(true)
    setPrefsMessage('')
    const res = await fetch('/api/digest-prefs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_digest_enabled: digestEnabled, delivery_hour_utc: deliveryHourUtc }),
    })
    setSavingPrefs(false)
    setPrefsMessage(res.ok ? 'Saved.' : 'Failed to save.')
    if (res.ok) setTimeout(() => setPrefsMessage(''), 2000)
  }

  const keywordAlerts = alerts.filter((a) => a.keywords?.length)
  const orgFollowAlerts = alerts.filter((a) => a.followed_organization_id)

  // Orgs already followed (to prevent duplicates in picker)
  const followedOrgIds = new Set(alerts.map((a) => a.followed_organization_id).filter(Boolean))
  const availableOrgs = organizations.filter((o) => !followedOrgIds.has(o.id))

  return (
    <div className="space-y-8 max-w-lg">

      {/* ── Keyword alerts ── */}
      <section>
        <h3 className="text-sm font-semibold text-wire-navy mb-3">Keyword alerts</h3>
        <div className="bg-white border border-wire-border rounded p-4 mb-3">
          <label className="block text-xs text-wire-slate mb-1">
            Keywords (comma-separated)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeywordAlert()}
              placeholder="education, school board, budget"
              className="flex-1 border border-wire-border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-wire-red"
            />
            <button
              onClick={handleAddKeywordAlert}
              disabled={addingKeyword}
              className="bg-wire-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-wire-navy-light disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {addingKeyword ? 'Adding…' : 'Add'}
            </button>
          </div>
          {keywordError && <p className="text-xs text-red-600 mt-1">{keywordError}</p>}
        </div>

        {keywordAlerts.length === 0 ? (
          <p className="text-sm text-wire-slate">No keyword alerts configured.</p>
        ) : (
          <div className="space-y-2">
            {keywordAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white border border-wire-border rounded p-3 flex items-start justify-between gap-4"
              >
                <div>
                  {!alert.is_active && (
                    <span className="text-xs text-gray-400 block mb-1">Paused</span>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {alert.keywords!.map((kw) => (
                      <span
                        key={kw}
                        className="text-xs bg-wire-bg border border-wire-border rounded px-2 py-0.5 text-wire-navy"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleAlert(alert.id, alert.is_active)}
                    className="text-xs text-wire-slate hover:text-wire-navy underline"
                  >
                    {alert.is_active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Newsroom follows ── */}
      <section>
        <h3 className="text-sm font-semibold text-wire-navy mb-3">Follow a newsroom</h3>
        {availableOrgs.length > 0 && (
          <div className="bg-white border border-wire-border rounded p-4 mb-3">
            <label className="block text-xs text-wire-slate mb-1">
              Get alerts whenever a newsroom adds a story
            </label>
            <div className="flex gap-2">
              <select
                value={followOrgId}
                onChange={(e) => setFollowOrgId(e.target.value)}
                className="flex-1 border border-wire-border rounded px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-wire-red"
              >
                <option value="">Select a newsroom…</option>
                {availableOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddOrgFollow}
                disabled={addingFollow}
                className="bg-wire-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-wire-navy-light disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {addingFollow ? 'Adding…' : 'Follow'}
              </button>
            </div>
            {followError && <p className="text-xs text-red-600 mt-1">{followError}</p>}
          </div>
        )}

        {orgFollowAlerts.length === 0 ? (
          <p className="text-sm text-wire-slate">Not following any newsrooms.</p>
        ) : (
          <div className="space-y-2">
            {orgFollowAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white border border-wire-border rounded p-3 flex items-center justify-between gap-4"
              >
                <div>
                  {!alert.is_active && (
                    <span className="text-xs text-gray-400 block mb-0.5">Paused</span>
                  )}
                  <span className="text-sm text-wire-navy">
                    {(alert.followed_org as { name: string } | null)?.name ?? 'Unknown newsroom'}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleAlert(alert.id, alert.is_active)}
                    className="text-xs text-wire-slate hover:text-wire-navy underline"
                  >
                    {alert.is_active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Daily digest ── */}
      <section>
        <h3 className="text-sm font-semibold text-wire-navy mb-1">Daily digest</h3>
        <p className="text-xs text-wire-slate mb-3">
          A daily email with up to 10 recent stories from all member newsrooms, sorted by popularity.
        </p>
        <div className="bg-white border border-wire-border rounded p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={digestEnabled}
              onChange={(e) => setDigestEnabled(e.target.checked)}
              className="w-4 h-4 accent-wire-red"
            />
            <span className="text-sm text-wire-navy">Enable daily digest</span>
          </label>

          {digestEnabled && (
            <div>
              <label className="block text-xs text-wire-slate mb-1">Delivery time (Pacific Time)</label>
              <select
                value={deliveryHourUtc}
                onChange={(e) => setDeliveryHourUtc(Number(e.target.value))}
                className="border border-wire-border rounded px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-wire-red"
              >
                {UTC_HOURS.map((utcH) => (
                  <option key={utcH} value={utcH}>
                    {formatHour(utcH)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={saveDigestPrefs}
              disabled={savingPrefs}
              className="bg-wire-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-wire-navy-light disabled:opacity-50 transition-colors"
            >
              {savingPrefs ? 'Saving…' : 'Save'}
            </button>
            {prefsMessage && (
              <span className="text-xs text-wire-slate">{prefsMessage}</span>
            )}
          </div>
        </div>
      </section>

      <p className="text-xs text-wire-slate">
        Alerts are delivered at most once per hour. Your own newsroom's stories are excluded.
      </p>
    </div>
  )
}
