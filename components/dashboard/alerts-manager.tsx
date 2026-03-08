'use client'

import { useState } from 'react'
import { StoryAlert } from '@/lib/types'

interface Props {
  alerts: StoryAlert[]
  orgId: string
}

export default function AlertsManager({ alerts: initialAlerts, orgId }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [keywords, setKeywords] = useState('')
  const [alertType, setAlertType] = useState<'immediate' | 'digest'>('immediate')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    const kws = keywords.split(',').map((k) => k.trim()).filter(Boolean)
    if (!kws.length) {
      setError('Enter at least one keyword.')
      return
    }
    setAdding(true)
    setError('')

    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: kws, alert_type: alertType }),
    })

    if (res.ok) {
      const data = await res.json()
      setAlerts([data, ...alerts])
      setKeywords('')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to add alert.')
    }
    setAdding(false)
  }

  async function toggleAlert(alertId: string, isActive: boolean) {
    await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, is_active: !isActive } : a)))
  }

  async function deleteAlert(alertId: string) {
    if (!confirm('Delete this alert?')) return
    await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' })
    setAlerts(alerts.filter((a) => a.id !== alertId))
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Add alert */}
      <div className="bg-white border border-wire-border rounded p-4">
        <h3 className="text-sm font-semibold text-wire-navy mb-3">New alert</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-wire-slate mb-1">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="education, school board, curriculum"
              className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red"
            />
          </div>
          <div>
            <label className="block text-xs text-wire-slate mb-1">Delivery</label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as 'immediate' | 'digest')}
              className="border border-wire-border rounded px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-wire-red"
            >
              <option value="immediate">Immediate email</option>
              <option value="digest">Daily digest</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={handleAdd}
            disabled={adding}
            className="bg-wire-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-wire-navy-light disabled:opacity-50 transition-colors"
          >
            {adding ? 'Adding…' : 'Add alert'}
          </button>
        </div>
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <p className="text-sm text-wire-slate">No alerts configured.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-wire-border rounded p-4 flex items-start justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-100 rounded px-2 py-0.5 text-wire-slate">
                    {alert.alert_type === 'immediate' ? 'Immediate' : 'Daily digest'}
                  </span>
                  {!alert.is_active && (
                    <span className="text-xs text-gray-400">Paused</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {alert.keywords.map((kw) => (
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
    </div>
  )
}
