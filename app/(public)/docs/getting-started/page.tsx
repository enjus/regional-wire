import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quick start guide — Regional Wire Docs',
}

export default function GettingStartedPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">Getting started</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">Quick start guide</h1>
        <p className="text-wire-slate">From application to your first story on the wire.</p>
      </div>

      <h2>Prerequisites</h2>
      <p>
        Regional Wire is a closed network. Before anyone from your newsroom can sign in,
        your organization must be approved by the platform administrator. Approval is based
        on your newsroom&apos;s email domain — once approved, any staff member with a
        matching email address can create an account.
      </p>

      <h2>Step 1: Apply for organization approval</h2>
      <p>
        Submit your newsroom&apos;s application at{' '}
        <Link href="/register/organization">/register/organization</Link>. You&apos;ll need:
      </p>
      <ul>
        <li>Your newsroom&apos;s full legal name</li>
        <li>Your primary email domain (e.g. <code>northfieldherald.com</code>)</li>
        <li>A contact email address for the application</li>
      </ul>
      <p>
        Approval typically takes 1–2 business days. You&apos;ll receive an email when your
        organization is approved or if there are questions about your application.
      </p>

      <h2>Step 2: Create your account</h2>
      <p>
        Once your organization is approved, any staff member with your registered email domain
        can sign up at <Link href="/register">/register</Link>. Use your work email address —
        the domain must match the one on your organization&apos;s application.
      </p>
      <p>
        You&apos;ll receive a confirmation email. Click the link to verify your address and
        complete sign-up. The <strong>first user</strong> from your organization is
        automatically designated as admin.
      </p>

      <h2>Step 3: Explore your dashboard</h2>
      <p>
        After signing in, you&apos;ll land in the story library — a browsable feed of all
        stories shared by member newsrooms. Your dashboard (accessible from the top navigation)
        is where you manage your organization&apos;s contributed stories and settings.
      </p>
      <p>
        If you&apos;re the <strong>admin</strong> for your organization, you&apos;ll also
        have access to:
      </p>
      <ul>
        <li><strong>Settings</strong> — Update your organization&apos;s profile</li>
        <li><strong>Feeds</strong> — Connect an RSS or Atom feed for automatic story ingestion</li>
        <li><strong>Alerts</strong> — Configure email digest notifications for member activity</li>
      </ul>

      <h2>Roles</h2>
      <p>There are two roles within an organization:</p>
      <ul>
        <li>
          <strong>Admin</strong> — Can upload and manage stories, access all settings, manage
          feeds and alerts, and see the full activity log. The first user from an org is
          automatically admin.
        </li>
        <li>
          <strong>Editor</strong> — Can upload and manage stories and browse the library.
          Cannot access organization settings.
        </li>
      </ul>

      <h2>Next steps</h2>
      <p>Once you&apos;re signed in, the full platform documentation is available under <strong>Help</strong> in the navigation.</p>
      <ul>
        <li><Link href="/wire/docs/uploading-stories">Uploading your first story</Link></li>
        <li><Link href="/wire/docs/feeds">Connecting an RSS feed</Link></li>
        <li><Link href="/wire/docs/republishing">Republishing stories from other members</Link></li>
      </ul>
    </article>
  )
}
