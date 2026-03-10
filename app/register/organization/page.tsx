'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterOrganizationPage() {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [domain, setDomain] = useState('')
  const [contacts, setContacts] = useState([''])
  const [description, setDescription] = useState('')
  const [republication_guidance, setRepublicationGuidance] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function addContact() {
    setContacts([...contacts, ''])
  }

  function removeContact(i: number) {
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

    const validContacts = contacts.filter((c) => c.trim())
    if (validContacts.length === 0) {
      setError('At least one contact email is required.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/orgs/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        website_url: website,
        email_domain: domain.toLowerCase().replace(/^@/, ''),
        contact_emails: validContacts,
        description,
        republication_guidance,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-wire-bg flex flex-col">
        <div className="border-b bg-wire-navy text-white px-6 py-4">
          <Link href="/" className="font-serif text-lg font-bold tracking-tight">
            Regional Wire
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-sm text-center">
            <div className="text-4xl mb-4">📬</div>
            <h1 className="font-serif text-2xl font-bold text-wire-navy mb-3">
              Application received
            </h1>
            <p className="text-wire-slate text-sm leading-relaxed">
              Your newsroom's application is under review. We'll email your
              contact address once a decision has been made, typically within
              one business day.
            </p>
            <p className="mt-4 text-sm text-wire-slate">
              <Link href="/login" className="text-wire-red hover:underline">
                ← Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wire-bg flex flex-col">
      <div className="border-b bg-wire-navy text-white px-6 py-4">
        <Link href="/" className="font-serif text-lg font-bold tracking-tight">
          Regional Wire
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <h1 className="font-serif text-3xl font-bold text-wire-navy mb-1">
            Register your newsroom
          </h1>
          <p className="text-wire-slate text-sm mb-8">
            All member organizations are vetted before approval. Once approved,
            your team can sign up using email addresses on your domain.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-wire-navy mb-1">
                Organization name <span className="text-wire-red">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
                placeholder="The Daily Tribune"
                autoComplete="organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-wire-navy mb-1">
                Website URL <span className="text-wire-red">*</span>
              </label>
              <input
                type="url"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
                placeholder="https://dailytribune.com"
                autoComplete="url"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-wire-navy mb-1">
                Staff email domain <span className="text-wire-red">*</span>
              </label>
              <p className="text-xs text-wire-slate mb-1">
                Staff must have email addresses on this domain to join (e.g.{' '}
                <code className="bg-gray-100 px-1 rounded">dailytribune.com</code>
                ).
              </p>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
                placeholder="dailytribune.com"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-wire-navy mb-1">
                Contact email(s) <span className="text-wire-red">*</span>
              </label>
              <p className="text-xs text-wire-slate mb-2">
                These addresses receive republication requests and platform
                notifications. At least one required.
              </p>
              <div className="space-y-2">
                {contacts.map((contact, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="email"
                      value={contact}
                      onChange={(e) => updateContact(i, e.target.value)}
                      className="flex-1 border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent"
                      placeholder="editor@dailytribune.com"
                      autoComplete="email"
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
                + Add another contact email
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-wire-navy mb-1">
                Coverage area / focus
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent resize-none"
                placeholder="We cover local government, education, and business news in the greater Springfield area."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-wire-navy mb-1">
                Additional republication guidance
              </label>
              <p className="text-xs text-wire-slate mb-1">
                Any specific requirements for newsrooms republishing your stories — e.g. preferred credit line, geo restrictions, or contact preferences. Displayed alongside standard republication rules.
              </p>
              <textarea
                value={republication_guidance}
                onChange={(e) => setRepublicationGuidance(e.target.value)}
                rows={3}
                className="w-full border border-wire-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wire-red focus:border-transparent resize-none"
                placeholder="Please credit us as 'The Daily Tribune' and notify editor@dailytribune.com when you publish."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wire-navy text-white py-2.5 rounded text-sm font-medium hover:bg-wire-navy-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit application'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-wire-slate">
            Already a member?{' '}
            <Link href="/login" className="text-wire-red hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
