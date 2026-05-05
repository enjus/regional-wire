import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Managing team members — ${brand.name} Help`,
}

export default function MembersDocPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif prose-headings:text-wire-navy prose-a:text-wire-red prose-a:no-underline hover:prose-a:underline max-w-none">
      <div className="not-prose mb-8 pb-8 border-b border-wire-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wire-slate/50 mb-2">For publishers</p>
        <h1 className="font-serif text-3xl font-bold text-wire-navy mb-3">Managing team members</h1>
        <p className="text-wire-slate">Adding colleagues to your newsroom, approving new members, and managing roles.</p>
      </div>

      <h2>How staff register</h2>
      <p>
        Any colleague with an email address at your newsroom&apos;s registered domain can
        create an account at <Link href="/register">/register</Link>. After verifying their
        email, they&apos;ll be placed in a <strong>pending</strong> state until an org admin
        approves them.
      </p>
      <p>
        You&apos;ll receive an email notification when someone from your domain requests access.
        Approve or deny them from <strong>Dashboard → Settings → Members</strong>.
      </p>

      <h2>Approving pending members</h2>
      <p>
        The Members settings page lists anyone who has registered and is awaiting approval
        under <strong>Awaiting Approval</strong>. Click <strong>Approve</strong> to grant
        access or <strong>Deny</strong> to remove their pending account.
      </p>
      <p>
        Approved members are assigned the <strong>Editor</strong> role by default. You can
        promote them to Admin after approval.
      </p>

      <h2>Inviting a colleague directly</h2>
      <p>
        If you&apos;d rather not wait for someone to register and request access, you can invite
        them by email. Go to <strong>Dashboard → Settings → Members</strong> and enter their
        address in the <strong>Invite a Colleague</strong> form.
      </p>
      <p>
        Invited colleagues are approved automatically when they complete registration —
        they skip the pending step entirely. This also works for addresses that don&apos;t match
        your organization&apos;s domain (for example, a freelancer or a colleague using a
        personal email address).
      </p>
      <p>
        You can cancel a pending invite from the <strong>Pending Invites</strong> list before
        it is used.
      </p>

      <h2>Roles</h2>
      <ul>
        <li>
          <strong>Editor</strong> — can browse the library, copy republication packages,
          upload stories, and manage their own alerts and digest preferences.
        </li>
        <li>
          <strong>Admin</strong> — everything an editor can do, plus: approve or deny pending
          members, invite colleagues, change member roles, remove members, and manage org
          settings (feeds, exclusions, attribution line).
        </li>
      </ul>
      <p>
        To change a member&apos;s role, use the role dropdown next to their name in the
        Active Members list. You can have multiple admins. You cannot change your own role.
      </p>

      <h2>Removing a member</h2>
      <p>
        Click <strong>Remove</strong> next to any active member to revoke their access.
        Their account is deleted from your organization; they would need to re-register
        (and be approved again) to regain access. You cannot remove yourself.
      </p>

      <h2>See also</h2>
      <ul>
        <li><Link href="/wire/docs/exclusions">Publisher exclusions</Link> — Hide another newsroom&apos;s content from your library</li>
        <li><Link href="/wire/docs/alerts">Story alerts</Link> — Get notified when member orgs publish</li>
      </ul>
    </article>
  )
}
