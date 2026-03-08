'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Organization } from '@/lib/types'

interface Props {
  org: Organization
}

export default function OrgSettingsForm({ org }: Props) {
  const router = useRouter()
  const [name, setName] = useState(org.name)
  const [website, setWebsite] = useState(org.website_url)
  const [description, setDescription] = useState(org.description ?? '')
  const [contacts, setContacts] = useState<string[]>(org.contact_emails)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function addContact() {
    setContacts([...contacts, ''])
  }

  function removeContact(i: number) {
    if (contacts.length <= 1) return
    setContacts(contacts.filter((_, idx) => idx !== i))
  }

  function updateContact(i: number, value: string) {
    const updated = [...contacts]
    updated[i] = value
    setContacts(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const validContacts = contacts.filter((c) => c.trim())
    if (!validContacts.length) {
      setError('At least one contact email is required.')
      setLoading(false)
      return
    }

    const res = await fetch(`/api/orgs/${org.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        website_url: website.trim(),
        description: description.trim() || null,
        contact_emails: validContacts,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to save.')
    } else {
      setSaved(true)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Organization name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Website URL
        </label>
        <input
          type="url"
          required
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-wire-navy mb-1">
          Coverage description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-wire-navy mb-2">
          Contact emails
        </label>
        <div className="space-y-2">
          {contacts.map((contact, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="email"
                value={contact}
                onChange={(e) => updateContact(i, e.target.value)}
                className="flex-1 border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
              />
              {contacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeContact(i)}
                  className="text-wire-slate hover:text-red-600 text-sm px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addContact}
          className="mt-2 text-sm text-wire-red hover:underline"
        >
          + Add contact email
        </button>
      </div>

      <div>
        <p className="text-sm text-wire-slate">
          <strong className="text-wire-navy">Email domain:</strong>{' '}
          {org.email_domain}
          <span className="text-xs ml-2">(contact support to change)</span>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Settings saved.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-wire-navy text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-wire-navy-light transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  )
}
