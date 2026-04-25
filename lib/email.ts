import { Resend } from 'resend'
import { Organization } from './types'
import { brand } from './brand'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  }
  return _resend
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@updates.nwnewswire.com'
const FROM_ADDRESS = `${brand.name} <${FROM_EMAIL}>`

// ----------------------------------------------------------------
// 1. New org registration — notify platform admin
// ----------------------------------------------------------------
export async function sendOrgRegistrationNotification(
  org: Organization,
  approveToken: string,
  rejectToken: string
) {
  const approveUrl = `${APP_URL}/api/admin/orgs/${org.id}/approve?token=${approveToken}`
  const rejectUrl = `${APP_URL}/admin?review=${org.id}`

  const text = `
New Newsroom Registration — ${brand.name}

Organization: ${org.name}
Website: ${org.website_url}
Email domain: ${org.email_domain}
Contact email(s): ${org.contact_emails.join(', ')}
Description: ${org.description ?? 'None provided'}
Submitted: ${new Date(org.created_at).toLocaleString()}

Actions:
  Approve: ${approveUrl}
  Review & Reject: ${rejectUrl}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: process.env.PLATFORM_ADMIN_EMAIL!,
    subject: `New registration: ${org.name}`,
    text,
  })
}

// ----------------------------------------------------------------
// 2. Org approved
// ----------------------------------------------------------------
export async function sendOrgApprovedEmail(org: Organization) {
  const text = `
${org.name} — ${brand.name} Membership Approved

Your newsroom has been approved for ${brand.name} membership.

You can now invite your team to sign up at:
${APP_URL}/register

Once signed up, your editors can:
  - Upload stories for other members to republish
  - Browse the story library and download republication packages
  - Connect RSS feeds to automatically share stories

Questions? Reply to this email.

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: org.contact_emails,
    subject: `Welcome to ${brand.name} — ${org.name} is approved`,
    text,
  })
}

// ----------------------------------------------------------------
// 3. Org rejected
// ----------------------------------------------------------------
export async function sendOrgRejectedEmail(org: Organization, reason: string) {
  const text = `
${org.name} — ${brand.name} Membership

Thank you for your interest in ${brand.name}. After review, we're unable to approve your newsroom's membership at this time.

${reason ? `Reason: ${reason}\n` : ''}
If you believe this is an error or have additional information, please contact us by replying to this email.

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: org.contact_emails,
    subject: `${brand.name} — membership update for ${org.name}`,
    text,
  })
}

// ----------------------------------------------------------------
// 4. User welcome
// ----------------------------------------------------------------
export async function sendUserWelcomeEmail(
  email: string,
  displayName: string,
  orgName: string
) {
  const text = `
Welcome to ${brand.name}, ${displayName}

You've joined ${orgName}'s account on ${brand.name}, the regional newsroom content-sharing platform.

Get started:
  Browse the story library: ${APP_URL}/library
  Upload a story: ${APP_URL}/dashboard/stories/new
  Your dashboard: ${APP_URL}/dashboard

${brand.name} allows member newsrooms to share stories for republication. When you download a republication package, you'll receive the full story text along with SEO instructions to protect the original publisher's search ranking.

Questions? Contact your organization's admin or reply to this email.

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Welcome to ${brand.name}`,
    text,
  })
}

// ----------------------------------------------------------------
// 5. Republication request received — to target org
// ----------------------------------------------------------------
export async function sendRepublicationRequestEmail(
  targetOrgContacts: string[],
  requestingOrgName: string,
  headline: string,
  url: string | null,
  message: string | null,
  requestId: string
) {
  const text = `
Republication Request — ${brand.name}

${requestingOrgName} is requesting permission to republish:
  Headline: ${headline}
  ${url ? `URL: ${url}` : ''}
  ${message ? `Message: ${message}` : ''}

To fulfill or decline this request, visit your dashboard:
${APP_URL}/dashboard/requests

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: targetOrgContacts,
    subject: `Republication request from ${requestingOrgName}: "${headline}"`,
    text,
  })
}

// ----------------------------------------------------------------
// 6. Request fulfilled — to requesting org
// ----------------------------------------------------------------
export async function sendRequestFulfilledEmail(
  requestingOrgContacts: string[],
  targetOrgName: string,
  headline: string,
  storyId: string
) {
  const text = `
Story Available — ${brand.name}

${targetOrgName} has fulfilled your republication request for:
  "${headline}"

The full story is now available in the ${brand.name} library:
${APP_URL}/library/${storyId}

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: requestingOrgContacts,
    subject: `Story available: "${headline}"`,
    text,
  })
}

// ----------------------------------------------------------------
// 7. Request declined — to requesting org
// ----------------------------------------------------------------
export async function sendRequestDeclinedEmail(
  requestingOrgContacts: string[],
  targetOrgName: string,
  headline: string,
  reason: string | null
) {
  const text = `
Republication Request — ${brand.name}

${targetOrgName} has declined your request for:
  "${headline}"

${reason ? `Their note: ${reason}\n` : ''}
You can browse the full story library at ${APP_URL}/library or reach out to the newsroom directly via the member directory at ${APP_URL}/directory.

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: requestingOrgContacts,
    subject: `Request declined: "${headline}"`,
    text,
  })
}

// ----------------------------------------------------------------
// 8. Consolidated hourly alert — keyword matches + org follows
// ----------------------------------------------------------------
export type AlertStory = {
  title: string
  orgName: string
  storyId: string
  summary: string | null
  matchedKeywords?: string[]
}

export async function sendConsolidatedAlertEmail(
  toEmail: string,
  keywordMatches: AlertStory[],
  orgFollowMatches: AlertStory[]
) {
  if (!keywordMatches.length && !orgFollowMatches.length) return
  const formatStory = (s: AlertStory, i: number) => {
    const kwLine = s.matchedKeywords?.length ? `   Keywords: ${s.matchedKeywords.join(', ')}\n` : ''
    return `${i + 1}. ${s.title}\n   From: ${s.orgName}\n${kwLine}${s.summary ? `   ${s.summary}\n` : ''}   ${APP_URL}/library/${s.storyId}`
  }

  const sections: string[] = []

  if (keywordMatches.length) {
    sections.push(
      `Matching your keywords:\n\n${keywordMatches.map(formatStory).join('\n\n')}`
    )
  }
  if (orgFollowMatches.length) {
    sections.push(
      `From newsrooms you follow:\n\n${orgFollowMatches.map(formatStory).join('\n\n')}`
    )
  }

  const totalCount = keywordMatches.length + orgFollowMatches.length

  const text = `
${brand.name} — New ${totalCount === 1 ? 'Story' : 'Stories'} Matching Your Alerts

${sections.join('\n\n---\n\n')}

Manage your alerts: ${APP_URL}/dashboard/settings/alerts

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `${brand.name}: ${totalCount} new ${totalCount === 1 ? 'story' : 'stories'} matching your alerts`,
    text,
  })
}

// ----------------------------------------------------------------
// 9. Daily digest
// ----------------------------------------------------------------
export async function sendDailyDigestEmail(
  toEmail: string,
  stories: AlertStory[]
) {
  const storyLines = stories
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}\n   From: ${s.orgName}\n${s.summary ? `   ${s.summary}\n` : ''}   ${APP_URL}/library/${s.storyId}`
    )
    .join('\n\n')

  const text = `
${brand.name} — Daily Digest

${stories.length} ${stories.length === 1 ? 'story' : 'stories'} from the past 24 hours, sorted by popularity:

${storyLines}

Manage your digest settings: ${APP_URL}/dashboard/settings/alerts

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `${brand.name} Daily Digest — ${stories.length} new ${stories.length === 1 ? 'story' : 'stories'}`,
    text,
  })
}

// ----------------------------------------------------------------
// 10. Org removed — notify org contacts
// ----------------------------------------------------------------
export async function sendOrgRemovalEmail(org: Organization, reason: string) {
  const text = `
${org.name} — ${brand.name} Membership Removed

Your newsroom's membership in ${brand.name} has been removed by a platform administrator.

${reason ? `Reason: ${reason}\n` : ''}All previously shared stories have been withdrawn from the library. Existing republications by other members are not affected.

If you believe this is an error, please contact us by replying to this email.

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: org.contact_emails,
    subject: `${brand.name} — membership removed for ${org.name}`,
    text,
  })
}

// ----------------------------------------------------------------
// 11. Media asset request — to originating org
// ----------------------------------------------------------------
export async function sendAssetRequestEmail(
  targetOrgContacts: string[],
  requestingOrgName: string,
  storyTitle: string,
  storyId: string
) {
  const text = `
Media Asset Request — ${brand.name}

${requestingOrgName} is requesting images or video for your story:
  "${storyTitle}"

They are preparing to republish this story and would like the original media assets. Please reply to this email with the files or a download link.

You can also view the story on your dashboard:
${APP_URL}/dashboard/stories/${storyId}

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: targetOrgContacts,
    subject: `Media request from ${requestingOrgName}: "${storyTitle}"`,
    text,
  })
}

// ----------------------------------------------------------------
// 11. Republication link-back received — to originating org
// ----------------------------------------------------------------
export async function sendLinkBackEmail(
  originOrgContacts: string[],
  republishingOrgName: string,
  storyTitle: string,
  republishedUrl: string
) {
  const text = `
Story Republished — ${brand.name}

${republishingOrgName} has published your story and submitted their URL:

  Story: ${storyTitle}
  Republished at: ${republishedUrl}

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: originOrgContacts,
    subject: `"${storyTitle}" republished by ${republishingOrgName}`,
    text,
  })
}

// ----------------------------------------------------------------
// 12. Story correction notice — to republishing orgs
// ----------------------------------------------------------------
export async function sendCorrectionNotice(
  republisherContacts: string[],
  originOrgName: string,
  storyTitle: string,
  correctionText: string,
  storyId: string
) {
  const text = `
STORY CORRECTION — ${brand.name}

${originOrgName} has issued a correction for a story your newsroom republished:

  "${storyTitle}"

Correction notice:
  ${correctionText}

Updated story: ${APP_URL}/library/${storyId}

If you have published this story, please update your version with the corrected information above.

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: republisherContacts,
    subject: `Correction: "${storyTitle}"`,
    text,
  })
}

// ----------------------------------------------------------------
// 14. New user pending approval — to org admins
// ----------------------------------------------------------------
export async function sendUserPendingApprovalEmail(
  adminEmails: string[],
  userName: string,
  userEmail: string,
  orgName: string
) {
  const membersUrl = `${APP_URL}/wire/dashboard/settings/members`
  const text = `
New member pending approval — ${brand.name}

${userName} (${userEmail}) has registered and is awaiting your approval to join ${orgName} on ${brand.name}.

Review and approve:
${membersUrl}

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: adminEmails,
    subject: `${userName} is requesting to join ${orgName} on ${brand.name}`,
    text,
  })
}

// ----------------------------------------------------------------
// 15. User approved — to the newly approved user
// ----------------------------------------------------------------
export async function sendUserApprovedEmail(
  email: string,
  displayName: string,
  orgName: string
) {
  const text = `
Your account has been approved — ${brand.name}

Hi ${displayName},

Your account for ${orgName} on ${brand.name} has been approved. You can now sign in and access the platform.

Sign in: ${APP_URL}/login

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Your ${brand.name} account has been approved`,
    text,
  })
}

// ----------------------------------------------------------------
// 16. User removed from org — to the removed user
// ----------------------------------------------------------------
export async function sendUserRemovedEmail(
  email: string,
  displayName: string,
  orgName: string
) {
  const text = `
Your access has been removed — ${brand.name}

Hi ${displayName},

Your account has been removed from ${orgName} on ${brand.name} by an organization administrator.

If you believe this was done in error, please contact your organization admin directly.

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Your ${brand.name} access has been removed`,
    text,
  })
}

// ----------------------------------------------------------------
// 17. Org admin invite — to invited user
// ----------------------------------------------------------------
export async function sendUserInviteEmail(
  email: string,
  orgName: string,
  inviterName: string
) {
  const text = `
You've been invited to ${brand.name}

${inviterName} has invited you to join ${orgName} on ${brand.name}, the regional newsroom content-sharing platform.

To accept, go to:
${APP_URL}/register

Enter your email address (${email}) and follow the prompts to create your account.

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `You've been invited to join ${orgName} on ${brand.name}`,
    text,
  })
}

// ----------------------------------------------------------------
// 13. Story withdrawal notice — to republishing orgs
// ----------------------------------------------------------------
export async function sendWithdrawalNotice(
  republisherContacts: string[],
  originOrgName: string,
  storyTitle: string,
  withdrawalReason: string,
  storyId: string
) {
  const text = `
STORY WITHDRAWN — ${brand.name}

${originOrgName} has withdrawn a story your newsroom downloaded:

  "${storyTitle}"

Reason:
  ${withdrawalReason}

Story page: ${APP_URL}/library/${storyId}

If you have published this story, we strongly recommend removing it or appending an editor's note.

— ${brand.name}
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: republisherContacts,
    subject: `Withdrawn: "${storyTitle}"`,
    text,
  })
}
