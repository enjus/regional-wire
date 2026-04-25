'use client'

import { useState } from 'react'

interface Member {
  id: string
  display_name: string
  email: string
  role: 'admin' | 'editor'
  status: 'pending' | 'active'
  created_at: string
}

interface Invite {
  id: string
  email: string
  created_at: string
}

interface Props {
  orgId: string
  currentUserId: string
  initialMembers: Member[]
  initialInvites: Invite[]
}

export default function MembersManager({ orgId, currentUserId, initialMembers, initialInvites }: Props) {
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const pending = members.filter((m) => m.status === 'pending')
  const active = members.filter((m) => m.status === 'active')

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  async function handleApprove(member: Member) {
    setLoadingId(member.id)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, status: 'active' } : m))
      setSuccess(`${member.display_name} has been approved.`)
    } catch {
      setError('Network error.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleChangeRole(member: Member, newRole: 'admin' | 'editor') {
    setLoadingId(member.id)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_role', role: newRole }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, role: newRole } : m))
    } catch {
      setError('Network error.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDenyMember(member: Member) {
    if (!confirm(`Deny ${member.display_name}'s request to join?`)) return
    setLoadingId(member.id)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${member.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
    } catch {
      setError('Network error.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleRemoveMember(member: Member) {
    if (!confirm(`Remove ${member.display_name} from your organization?`)) return
    setLoadingId(member.id)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${member.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      setSuccess(`${member.display_name} has been removed.`)
    } catch {
      setError('Network error.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleCancelInvite(invite: Invite) {
    setLoadingId(invite.id)
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/invites/${invite.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        return
      }
      setInvites((prev) => prev.filter((i) => i.id !== invite.id))
    } catch {
      setError('Network error.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong.')
        return
      }
      setSuccess(`Invite sent to ${inviteEmail}.`)
      setInvites((prev) => [
        { id: body.id, email: inviteEmail.toLowerCase(), created_at: new Date().toISOString() },
        ...prev,
      ])
      setInviteEmail('')
    } catch {
      setError('Network error.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</p>
      )}

      {/* Pending approvals */}
      {pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-wire-navy uppercase tracking-wide mb-3">
            Awaiting Approval ({pending.length})
          </h3>
          <ul className="divide-y divide-wire-border border border-wire-border rounded">
            {pending.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-wire-navy truncate">{member.display_name}</p>
                  <p className="text-xs text-wire-slate truncate">{member.email}</p>
                  <p className="text-xs text-wire-slate mt-0.5">Registered {formatDate(member.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(member)}
                    disabled={loadingId === member.id}
                    className="text-xs font-medium text-white bg-wire-red hover:bg-wire-red-dark rounded px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {loadingId === member.id ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleDenyMember(member)}
                    disabled={loadingId === member.id}
                    className="text-xs text-wire-slate hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Active members */}
      <section>
        <h3 className="text-sm font-semibold text-wire-navy uppercase tracking-wide mb-3">
          Active Members ({active.length})
        </h3>
        {active.length === 0 ? (
          <p className="text-sm text-wire-slate">No active members yet.</p>
        ) : (
          <ul className="divide-y divide-wire-border border border-wire-border rounded">
            {active.map((member) => {
              const isSelf = member.id === currentUserId
              return (
                <li key={member.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-wire-navy truncate">
                      {member.display_name}
                      {isSelf && <span className="ml-1.5 text-xs text-wire-slate font-normal">(you)</span>}
                    </p>
                    <p className="text-xs text-wire-slate truncate">{member.email}</p>
                    <p className="text-xs text-wire-slate mt-0.5">Joined {formatDate(member.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {!isSelf ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member, e.target.value as 'admin' | 'editor')}
                          disabled={loadingId === member.id}
                          className="text-xs border border-wire-border rounded px-2 py-1 text-wire-navy bg-white focus:outline-none focus:ring-1 focus:ring-wire-red disabled:opacity-50"
                        >
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={loadingId === member.id}
                          className="text-xs text-wire-slate hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-wire-slate capitalize">{member.role}</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Invite by email */}
      <section>
        <h3 className="text-sm font-semibold text-wire-navy uppercase tracking-wide mb-3">
          Invite a Colleague
        </h3>
        <form onSubmit={handleInvite} className="flex gap-2 max-w-sm">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@newsroom.com"
            className="flex-1 border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="shrink-0 text-sm font-medium text-white bg-wire-navy hover:bg-wire-navy-light rounded px-4 py-2 transition-colors disabled:opacity-50"
          >
            {inviting ? 'Sending…' : 'Send invite'}
          </button>
        </form>
        <p className="text-xs text-wire-slate mt-2">
          Invited users are approved automatically when they register.
        </p>
      </section>

      {/* Pending invites */}
      {invites.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-wire-navy uppercase tracking-wide mb-3">
            Pending Invites ({invites.length})
          </h3>
          <ul className="divide-y divide-wire-border border border-wire-border rounded">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-wire-navy truncate">{invite.email}</p>
                  <p className="text-xs text-wire-slate mt-0.5">Sent {formatDate(invite.created_at)}</p>
                </div>
                <button
                  onClick={() => handleCancelInvite(invite)}
                  disabled={loadingId === invite.id}
                  className="shrink-0 text-xs text-wire-slate hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {loadingId === invite.id ? 'Cancelling…' : 'Cancel'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
