import { Resend } from 'resend'
import { Organization } from './types'
import { brand } from './brand'
import {
  renderEmailHtml,
  renderSection,
  renderHeading,
  renderParagraph,
  renderParagraphLast,
  renderNote,
  renderSectionLabel,
  renderButton,
  renderLinkList,
  renderMetaTable,
  renderCriticalBanner,
  renderStorySection,
} from './email-template'

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
  approveToken: string
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

  const html = renderEmailHtml({
    preheader: `New registration from ${org.name}`,
    title: `New registration: ${org.name}`,
    content: renderSection(
      renderHeading(`New registration: ${org.name}`) +
      renderParagraph('A new newsroom has submitted a membership application. Review the details below and take action.') +
      renderMetaTable([
        { label: 'Organization', value: org.name },
        { label: 'Website', value: org.website_url },
        { label: 'Email domain', value: org.email_domain },
        { label: 'Contact', value: org.contact_emails.join(', ') },
        { label: 'Submitted', value: new Date(org.created_at).toLocaleString() },
        { label: 'Description', value: org.description ?? 'None provided' },
      ]) +
      renderButton('Approve membership →', approveUrl) +
      `<p style="margin:12px 0 0;font-size:13px;color:#6b7280;"><a href="${rejectUrl}" style="color:#6b7280;text-decoration:underline;">Review and reject in admin panel</a></p>`
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Go to admin panel',
    footerLinkUrl: `${APP_URL}/admin`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: process.env.PLATFORM_ADMIN_EMAIL!,
    subject: `New registration: ${org.name}`,
    text,
    html,
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

— ${brand.name}
`.trim()

  const html = renderEmailHtml({
    preheader: `${org.name} is now approved for ${brand.name} membership`,
    title: `${org.name} approved`,
    content: renderSection(
      renderHeading(`${org.name} is approved`) +
      renderParagraph(`Your newsroom has been approved for ${brand.name} membership. You can now invite your team and begin sharing stories.`) +
      renderSectionLabel('Next steps:') +
      renderLinkList([
        { label: 'Invite your team members', url: `${APP_URL}/register` },
        { label: 'Browse the story library', url: `${APP_URL}/wire/library` },
        { label: 'Upload your first story', url: `${APP_URL}/wire/dashboard/stories/new` },
      ]) +
      renderButton('Get started →', `${APP_URL}/wire/library`)
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit your dashboard',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: org.contact_emails,
    subject: `Welcome to ${brand.name} — ${org.name} is approved`,
    text,
    html,
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
— ${brand.name}
`.trim()

  const html = renderEmailHtml({
    preheader: `Membership update for ${org.name}`,
    title: `Membership update — ${org.name}`,
    content: renderSection(
      renderHeading(`Membership update for ${org.name}`) +
      renderParagraph(`Thank you for your interest in ${brand.name}. After review, we're unable to approve your newsroom's membership at this time.`) +
      (reason ? renderParagraphLast(`Reason: ${reason}`) : renderNote('No specific reason was provided.'))
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit platform',
    footerLinkUrl: APP_URL,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: org.contact_emails,
    subject: `${brand.name} — membership update for ${org.name}`,
    text,
    html,
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

  const html = renderEmailHtml({
    preheader: `You've joined ${orgName} on ${brand.name}`,
    title: `Welcome to ${brand.name}`,
    content: renderSection(
      renderHeading(`Welcome to ${brand.name}, ${displayName}`) +
      renderParagraph(`You've joined ${orgName}'s account on ${brand.name}, the regional newsroom content-sharing platform.`) +
      renderParagraph(`${brand.name} allows member newsrooms to share stories for republication. When you download a republication package, you'll receive the full story text along with SEO instructions to protect the original publisher's search ranking.`) +
      renderSectionLabel('Get started:') +
      renderLinkList([
        { label: 'Browse the story library', url: `${APP_URL}/wire/library` },
        { label: 'Upload a story', url: `${APP_URL}/wire/dashboard/stories/new` },
        { label: 'Your dashboard', url: `${APP_URL}/wire/dashboard` },
      ]) +
      renderButton('Go to your dashboard →', `${APP_URL}/wire/dashboard`)
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Manage account settings',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Welcome to ${brand.name}`,
    text,
    html,
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
  message: string | null
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

  const metaRows = [{ label: 'Headline', value: headline }]
  if (url) metaRows.push({ label: 'URL', value: url })
  if (message) metaRows.push({ label: 'Message', value: message })

  const html = renderEmailHtml({
    preheader: `${requestingOrgName} is requesting permission to republish "${headline}"`,
    title: 'Republication request',
    content: renderSection(
      renderHeading(`Republication request from ${requestingOrgName}`) +
      renderParagraph(`${requestingOrgName} is requesting permission to republish the following story. Review the details below and respond from your dashboard.`) +
      renderMetaTable(metaRows) +
      renderButton('Review request →', `${APP_URL}/wire/dashboard/requests`)
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit your dashboard',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: targetOrgContacts,
    subject: `Republication request from ${requestingOrgName}: "${headline}"`,
    text,
    html,
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

  const html = renderEmailHtml({
    preheader: `"${headline}" is now available in the library`,
    title: 'Story available',
    content: renderSection(
      renderHeading('Story available for republication') +
      renderParagraph(`${targetOrgName} has fulfilled your republication request for "${headline}". The full story is now available in the library.`) +
      renderButton('View story →', `${APP_URL}/wire/library/${storyId}`)
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit your dashboard',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: requestingOrgContacts,
    subject: `Story available: "${headline}"`,
    text,
    html,
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

  const html = renderEmailHtml({
    preheader: `${targetOrgName} has declined your request for "${headline}"`,
    title: 'Republication request declined',
    content: renderSection(
      renderHeading('Republication request declined') +
      renderParagraph(`${targetOrgName} has declined your request to republish "${headline}".`) +
      (reason ? renderParagraph(`Their note: ${reason}`) : '') +
      renderSectionLabel('What to do next:') +
      renderLinkList([
        { label: 'Browse the story library', url: `${APP_URL}/wire/library` },
        { label: 'View the member directory', url: `${APP_URL}/wire/directory` },
      ])
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit your dashboard',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: requestingOrgContacts,
    subject: `Request declined: "${headline}"`,
    text,
    html,
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

  const allKeywords = [
    ...new Set(keywordMatches.flatMap((s) => s.matchedKeywords ?? [])),
  ]
  const keywordLabel = allKeywords.length
    ? `Keyword matches — ${allKeywords.join(', ')}`
    : 'Keyword matches'

  const htmlContent =
    renderSection(
      renderHeading(`${totalCount} new ${totalCount === 1 ? 'story' : 'stories'} matching your alerts`)
    ) +
    (keywordMatches.length
      ? renderStorySection(keywordMatches, APP_URL, { showKeywords: true, label: keywordLabel })
      : '') +
    (orgFollowMatches.length
      ? renderStorySection(orgFollowMatches, APP_URL, { label: 'From newsrooms you follow' })
      : '') +
    renderSection(renderButton('Browse the library →', `${APP_URL}/wire/library`))

  const html = renderEmailHtml({
    preheader: `${totalCount} new ${totalCount === 1 ? 'story' : 'stories'} matching your alert settings`,
    title: 'New stories matching your alerts',
    content: htmlContent,
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Manage alert preferences',
    footerLinkUrl: `${APP_URL}/wire/dashboard/settings/alerts`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `${brand.name}: ${totalCount} new ${totalCount === 1 ? 'story' : 'stories'} matching your alerts`,
    text,
    html,
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

  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const htmlContent =
    renderSection(
      renderHeading('Daily Digest') +
      `<p style="margin:0;font-size:14px;color:#6b7280;">${dateLabel} · ${stories.length} new ${stories.length === 1 ? 'story' : 'stories'}</p>`
    ) +
    renderStorySection(stories, APP_URL) +
    renderSection(renderButton('Browse all new stories →', `${APP_URL}/wire/library`))

  const html = renderEmailHtml({
    preheader: `${stories.length} new ${stories.length === 1 ? 'story' : 'stories'} from the past 24 hours`,
    title: `${brand.name} Daily Digest`,
    content: htmlContent,
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Manage alert preferences',
    footerLinkUrl: `${APP_URL}/wire/dashboard/settings/alerts`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `${brand.name} Daily Digest — ${stories.length} new ${stories.length === 1 ? 'story' : 'stories'}`,
    text,
    html,
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

  const html = renderEmailHtml({
    preheader: `${org.name}'s membership in ${brand.name} has been removed`,
    title: `Membership removed — ${org.name}`,
    content:
      renderSection(
        renderHeading(`${org.name}'s membership has been removed`) +
        renderParagraph(`Your newsroom's membership in ${brand.name} has been removed by a platform administrator.`) +
        renderParagraph('All previously shared stories have been withdrawn from the library. Existing republications by other members are not affected.') +
        renderNote('If you believe this is an error, please contact us by replying to this email.')
      ) +
      (reason ? renderCriticalBanner('Reason for removal', reason) : ''),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit platform',
    footerLinkUrl: APP_URL,
    variant: 'critical',
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: org.contact_emails,
    subject: `${brand.name} — membership removed for ${org.name}`,
    text,
    html,
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

  const html = renderEmailHtml({
    preheader: `${requestingOrgName} is requesting media assets for "${storyTitle}"`,
    title: 'Media asset request',
    content: renderSection(
      renderHeading(`Media asset request from ${requestingOrgName}`) +
      renderParagraph(`${requestingOrgName} is preparing to republish your story and would like the original images or video.`) +
      renderMetaTable([{ label: 'Story', value: storyTitle }]) +
      renderParagraphLast('Please reply to this email with the files or a download link.') +
      renderButton('View story on dashboard →', `${APP_URL}/wire/dashboard/stories/${storyId}`)
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit your dashboard',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: targetOrgContacts,
    subject: `Media request from ${requestingOrgName}: "${storyTitle}"`,
    text,
    html,
  })
}

// ----------------------------------------------------------------
// 12. Republication link-back received — to originating org
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

  const html = renderEmailHtml({
    preheader: `${republishingOrgName} has republished "${storyTitle}"`,
    title: 'Story republished',
    content: renderSection(
      renderHeading(`"${storyTitle}" republished`) +
      renderParagraph(`${republishingOrgName} has published your story and submitted their URL.`) +
      renderMetaTable([
        { label: 'Story', value: storyTitle },
        { label: 'Republished at', value: republishedUrl },
      ])
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit your dashboard',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: originOrgContacts,
    subject: `"${storyTitle}" republished by ${republishingOrgName}`,
    text,
    html,
  })
}

// ----------------------------------------------------------------
// 13. Story correction notice — to republishing orgs
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

  const html = renderEmailHtml({
    preheader: `Correction issued for "${storyTitle}" by ${originOrgName}`,
    title: `Story correction: "${storyTitle}"`,
    content:
      renderSection(
        renderHeading(`Story correction from ${originOrgName}`) +
        renderParagraph(`${originOrgName} has issued a correction for a story your newsroom republished. If you have published this story, please update your version with the corrected information.`) +
        renderMetaTable([{ label: 'Story', value: storyTitle }])
      ) +
      renderCriticalBanner('Correction Notice', correctionText) +
      renderSection(renderButton('View updated story →', `${APP_URL}/wire/library/${storyId}`)),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit your dashboard',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
    variant: 'critical',
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: republisherContacts,
    subject: `Correction: "${storyTitle}"`,
    text,
    html,
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

  const html = renderEmailHtml({
    preheader: `${userName} is requesting to join ${orgName}`,
    title: `New member pending approval`,
    content: renderSection(
      renderHeading('New member pending approval') +
      renderParagraph(`${userName} has registered and is awaiting your approval to join ${orgName} on ${brand.name}.`) +
      renderMetaTable([
        { label: 'Name', value: userName },
        { label: 'Email', value: userEmail },
        { label: 'Organization', value: orgName },
      ]) +
      renderButton('Review and approve →', membersUrl)
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Go to admin panel',
    footerLinkUrl: membersUrl,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: adminEmails,
    subject: `${userName} is requesting to join ${orgName} on ${brand.name}`,
    text,
    html,
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

Your account for ${orgName} on ${brand.name} has been approved. You can now access the platform — your existing session is still active, so just return to the site.

Go to your dashboard: ${APP_URL}/wire/library

— ${brand.name}
`.trim()

  const html = renderEmailHtml({
    preheader: `Your ${brand.name} account has been approved`,
    title: 'Account approved',
    content: renderSection(
      renderHeading(`Your account has been approved`) +
      renderParagraph(`Hi ${displayName}, your account for ${orgName} on ${brand.name} has been approved.`) +
      renderParagraphLast('Your existing session is still active — just return to the site to get started.') +
      renderButton('Go to the library →', `${APP_URL}/wire/library`)
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Manage account settings',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Your ${brand.name} account has been approved`,
    text,
    html,
  })
}

// ----------------------------------------------------------------
// 16. User registration denied — to the pending user
// ----------------------------------------------------------------
export async function sendUserDeniedEmail(
  email: string,
  displayName: string,
  orgName: string
) {
  const text = `
Registration not approved — ${brand.name}

Hi ${displayName},

Your request to join ${orgName} on ${brand.name} was not approved by the organization's administrator.

If you believe this was done in error, please contact your organization admin directly.

— ${brand.name}
`.trim()

  const html = renderEmailHtml({
    preheader: `Your ${brand.name} registration was not approved`,
    title: 'Registration not approved',
    content: renderSection(
      renderHeading('Registration not approved') +
      renderParagraph(`Hi ${displayName}, your request to join ${orgName} on ${brand.name} was not approved by the organization's administrator.`) +
      renderNote('If you believe this was done in error, please contact your organization admin directly.')
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit platform',
    footerLinkUrl: APP_URL,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Your ${brand.name} registration was not approved`,
    text,
    html,
  })
}

// ----------------------------------------------------------------
// 17. User removed from org — to the removed user
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

  const html = renderEmailHtml({
    preheader: `Your access to ${orgName} on ${brand.name} has been removed`,
    title: 'Access removed',
    content: renderSection(
      renderHeading('Your access has been removed') +
      renderParagraph(`Hi ${displayName}, your account has been removed from ${orgName} on ${brand.name} by an organization administrator.`) +
      renderNote('If you believe this was done in error, please contact your organization admin directly.')
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit platform',
    footerLinkUrl: APP_URL,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Your ${brand.name} access has been removed`,
    text,
    html,
  })
}

// ----------------------------------------------------------------
// 18. Org admin invite — to invited user
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

  const html = renderEmailHtml({
    preheader: `${inviterName} has invited you to join ${orgName} on ${brand.name}`,
    title: `You've been invited to ${brand.name}`,
    content: renderSection(
      renderHeading(`You've been invited to ${brand.name}`) +
      renderParagraph(`${inviterName} has invited you to join ${orgName} on ${brand.name}, the regional newsroom content-sharing platform.`) +
      renderParagraphLast(`To accept, sign up at the link below using your email address (${email}).`) +
      renderButton('Create your account →', `${APP_URL}/register`)
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit platform',
    footerLinkUrl: APP_URL,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `You've been invited to join ${orgName} on ${brand.name}`,
    text,
    html,
  })
}

// ----------------------------------------------------------------
// 19. Support request — to all platform admins
// ----------------------------------------------------------------
export async function sendSupportRequest({
  adminEmails,
  name,
  email,
  subject,
  message,
  userContext,
}: {
  adminEmails: string[]
  name: string
  email: string
  subject: string
  message: string
  userContext?: { userId: string; orgName: string; orgId: string } | null
}) {
  const contextBlock = userContext
    ? `
Submitted by authenticated user:
  Name: ${name}
  Email: ${email}
  Organization: ${userContext.orgName}
  Org ID: ${userContext.orgId}
  User ID: ${userContext.userId}
`.trim()
    : `Submitted by unauthenticated visitor:\n  Name: ${name}\n  Email: ${email}`

  const text = `
Support Request — ${brand.name}

Subject: ${subject}

${contextBlock}

Message:
${message}
`.trim()

  const metaRows = userContext
    ? [
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Organization', value: userContext.orgName },
        { label: 'Org ID', value: userContext.orgId },
        { label: 'User ID', value: userContext.userId },
      ]
    : [
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Status', value: 'Unauthenticated visitor' },
      ]

  const html = renderEmailHtml({
    preheader: `Support request: ${subject}`,
    title: `[Support] ${subject}`,
    content: renderSection(
      renderHeading(`Support request: ${subject}`) +
      renderMetaTable(metaRows) +
      renderSectionLabel('Message:') +
      renderParagraphLast(message)
    ),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Go to admin panel',
    footerLinkUrl: `${APP_URL}/admin`,
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: adminEmails,
    replyTo: email,
    subject: `[Support] ${subject}`,
    text,
    html,
  })
}

// ----------------------------------------------------------------
// 20. Story withdrawal notice — to republishing orgs
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

  const html = renderEmailHtml({
    preheader: `"${storyTitle}" has been withdrawn by ${originOrgName}`,
    title: `Story withdrawn: "${storyTitle}"`,
    content:
      renderSection(
        renderHeading(`Story withdrawn by ${originOrgName}`) +
        renderParagraph(`${originOrgName} has withdrawn a story your newsroom downloaded. If you have published this story, we strongly recommend removing it or appending an editor's note.`) +
        renderMetaTable([{ label: 'Story', value: storyTitle }])
      ) +
      renderCriticalBanner('Withdrawal Reason', withdrawalReason) +
      renderSection(renderButton('View story page →', `${APP_URL}/wire/library/${storyId}`)),
    brandName: brand.name,
    appUrl: APP_URL,
    footerLinkLabel: 'Visit your dashboard',
    footerLinkUrl: `${APP_URL}/wire/dashboard`,
    variant: 'critical',
  })

  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: republisherContacts,
    subject: `Withdrawn: "${storyTitle}"`,
    text,
    html,
  })
}
