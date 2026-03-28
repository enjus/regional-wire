import { Resend } from 'resend'
import { Organization } from './types'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  }
  return _resend
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const FROM_ADDRESS = 'Regional Wire <noreply@updates.nwnewswire.com>'

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
New Newsroom Registration — Regional Wire

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
${org.name} — Regional Wire Membership Approved

Your newsroom has been approved for Regional Wire membership.

You can now invite your team to sign up at:
${APP_URL}/register

Once signed up, your editors can:
  - Upload stories for other members to republish
  - Browse the story library and download republication packages
  - Connect RSS feeds to automatically share stories

Questions? Reply to this email.

— Regional Wire
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: org.contact_emails,
    subject: `Welcome to Regional Wire — ${org.name} is approved`,
    text,
  })
}

// ----------------------------------------------------------------
// 3. Org rejected
// ----------------------------------------------------------------
export async function sendOrgRejectedEmail(org: Organization, reason: string) {
  const text = `
${org.name} — Regional Wire Membership

Thank you for your interest in Regional Wire. After review, we're unable to approve your newsroom's membership at this time.

${reason ? `Reason: ${reason}\n` : ''}
If you believe this is an error or have additional information, please contact us by replying to this email.

— Regional Wire
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: org.contact_emails,
    subject: `Regional Wire — membership update for ${org.name}`,
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
Welcome to Regional Wire, ${displayName}

You've joined ${orgName}'s account on Regional Wire, the regional newsroom content-sharing platform.

Get started:
  Browse the story library: ${APP_URL}/library
  Upload a story: ${APP_URL}/dashboard/stories/new
  Your dashboard: ${APP_URL}/dashboard

Regional Wire allows member newsrooms to share stories for republication. When you download a republication package, you'll receive the full story text along with SEO instructions to protect the original publisher's search ranking.

Questions? Contact your organization's admin or reply to this email.

— Regional Wire
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: 'Welcome to Regional Wire',
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
Republication Request — Regional Wire

${requestingOrgName} is requesting permission to republish:
  Headline: ${headline}
  ${url ? `URL: ${url}` : ''}
  ${message ? `Message: ${message}` : ''}

To fulfill or decline this request, visit your dashboard:
${APP_URL}/dashboard/requests

— Regional Wire
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
Story Available — Regional Wire

${targetOrgName} has fulfilled your republication request for:
  "${headline}"

The full story is now available in the Regional Wire library:
${APP_URL}/library/${storyId}

— Regional Wire
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
Republication Request — Regional Wire

${targetOrgName} has declined your request for:
  "${headline}"

${reason ? `Their note: ${reason}\n` : ''}
You can browse the full story library at ${APP_URL}/library or reach out to the newsroom directly via the member directory at ${APP_URL}/directory.

— Regional Wire
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: requestingOrgContacts,
    subject: `Request declined: "${headline}"`,
    text,
  })
}

// ----------------------------------------------------------------
// 8. Story alert — immediate
// ----------------------------------------------------------------
export async function sendStoryAlertEmail(
  toEmail: string,
  matchedKeywords: string[],
  storyTitle: string,
  orgName: string,
  summary: string | null,
  storyId: string
) {
  const text = `
Story Alert — Regional Wire

A new story matching your alert (${matchedKeywords.join(', ')}) is available:

  Headline: ${storyTitle}
  From: ${orgName}
  ${summary ? `Summary: ${summary}\n` : ''}
  Read & republish: ${APP_URL}/library/${storyId}

— Regional Wire
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `Alert: "${storyTitle}"`,
    text,
  })
}

// ----------------------------------------------------------------
// 9. Story alert — daily digest
// ----------------------------------------------------------------
export async function sendAlertDigestEmail(
  toEmail: string,
  stories: { title: string; orgName: string; storyId: string; summary: string | null }[]
) {
  const storyLines = stories
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}\n   From: ${s.orgName}\n   ${s.summary ? s.summary + '\n   ' : ''}${APP_URL}/library/${s.storyId}`
    )
    .join('\n\n')

  const text = `
Regional Wire — Daily Story Alert

${stories.length} new ${stories.length === 1 ? 'story matches' : 'stories match'} your alerts from the past 24 hours:

${storyLines}

Manage your alerts: ${APP_URL}/dashboard/settings/alerts

— Regional Wire
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `Regional Wire alert digest — ${stories.length} new ${stories.length === 1 ? 'story' : 'stories'}`,
    text,
  })
}

// ----------------------------------------------------------------
// 10. Media asset request — to originating org
// ----------------------------------------------------------------
export async function sendAssetRequestEmail(
  targetOrgContacts: string[],
  requestingOrgName: string,
  storyTitle: string,
  storyId: string
) {
  const text = `
Media Asset Request — Regional Wire

${requestingOrgName} is requesting images or video for your story:
  "${storyTitle}"

They are preparing to republish this story and would like the original media assets. Please reply to this email with the files or a download link.

You can also view the story on your dashboard:
${APP_URL}/dashboard/stories/${storyId}

— Regional Wire
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
Story Republished — Regional Wire

${republishingOrgName} has published your story and submitted their URL:

  Story: ${storyTitle}
  Republished at: ${republishedUrl}

— Regional Wire
`.trim()

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: originOrgContacts,
    subject: `"${storyTitle}" republished by ${republishingOrgName}`,
    text,
  })
}
