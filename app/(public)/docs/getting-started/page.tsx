import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Quick start guide — ${brand.name} Docs`,
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
        {brand.name} is a closed network. Before anyone from your newsroom can sign in,
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
        <li>Your newsroom&apos;s name</li>
		<li>Your newsroom&apos;s website URL (e.g. <code>https://example.com</code>)</li>
        <li>Your staff email domain (e.g. <code>mail.example.com</code>)</li>
        <li>A contact email address for the application</li>
      </ul>
      <p>
        Approval typically takes one business day. You&apos;ll receive an email when your
        organization is approved or if there are questions about your application.
      </p>

      <h2>Step 2: Create your account</h2>
      <p>
        Once your organization is approved, any staff member with a matching email address
        can sign up at <Link href="/register">/register</Link>. Enter your name and work
        email — the domain must match the one associated with your organization.
      </p>
      <p>
        You&apos;ll receive an email with a 6-digit code. Enter it on the next screen to
        complete sign-up. The <strong>first user</strong> from your organization is
        automatically designated as admin. If your organization already has members, your
        account will require approval from an org admin before you can access the platform.
      </p>

      <h2>Step 3: Explore your dashboard</h2>
      <p>
        After signing in, you&apos;ll land in the story library — a browsable feed of all
        stories shared by member newsrooms. Your dashboard (accessible from the top navigation)
        is where you manage your organization&apos;s contributed stories and settings.
      </p>
      <p>
        All users have access to <strong>Alerts</strong> under their account — configure
        keyword and org-follow alerts, plus a daily digest. If you&apos;re the{' '}
        <strong>admin</strong> for your organization, you&apos;ll also have access to:
      </p>
      <ul>
        <li><strong>Settings</strong> — Update your organization&apos;s profile</li>
        <li><strong>Members</strong> — Manage team access and pending approvals</li>
        <li><strong>Feeds</strong> — Connect an RSS or Atom feed for automatic story ingestion</li>
        <li><strong>Exclusions</strong> — Hide stories from specific publishers</li>
      </ul>

      <h2>Roles</h2>
      <p>There are two roles within an organization:</p>
      <ul>
        <li>
          <strong>Admin</strong> — Can upload and manage stories, access all settings, manage
          feeds and alerts and see the full activity log. The first user from an org is
          automatically admin.
        </li>
        <li>
          <strong>Editor</strong> — Can upload and manage stories and browse the library.
          Cannot access organization settings.
        </li>
      </ul>

      <h2>Membership expectations</h2>
      <p>
        {brand.name} is a reciprocal network. Members are expected to contribute at
        least as many stories as they republish from other member newsrooms — the wire
        is not a one-way distribution channel. Content shared to the wire should be
        publication-ready and of genuine interest to other member newsrooms.
      </p>

      <h2>Republication requirements</h2>
      <p>
        All stories on {brand.name} are shared under a common set of republication
        requirements. By republishing a story, your newsroom agrees to the following:
      </p>
      <ol>
        <li><strong>Attribution is required.</strong> The republished story must include a link back to the original on the originating newsroom&apos;s website. Do not remove or alter the attribution line.</li>
        <li><strong>Headlines may be adapted.</strong> You may edit the headline for style or to better fit your audience, but it must retain the original meaning.</li>
        <li><strong>Minor edits are acceptable.</strong> Small changes for style, updated time references (e.g. replacing &ldquo;Wednesday&rdquo; with a date) or minor clarifications are permitted. Do not alter facts, tone or conclusions.</li>
        <li><strong>Preserve the byline.</strong> The original author&apos;s name must appear exactly as written. Do not substitute your own staff name or remove the byline.</li>
        <li><strong>No resyndication.</strong> Do not redistribute this story to third parties or other publications.</li>
        <li><strong>Media is licensed for one-time use.</strong> Photos and video may be used only in connection with this story — including to promote it on social media — with credit to the creator and to the originating newsroom. Do not use assets for other stories or unrelated purposes.</li>
        <li><strong>Notify the originating newsroom.</strong> Submit your published URL after republishing so the originating newsroom can track where their story appeared.</li>
      </ol>
      <p>
        Individual newsrooms may add requirements beyond these — those appear on the story detail page when present.
      </p>

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
