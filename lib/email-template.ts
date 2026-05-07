// Shared HTML email template system.
// All functions return strings. No side effects, no Resend dependency.

export type AlertStoryItem = {
  title: string
  orgName: string
  storyId: string
  summary: string | null
  matchedKeywords?: string[]
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escUrl(url: string): string {
  return url.replace(/&/g, '&amp;')
}

// ── Inline content helpers ────────────────────────────────────────────────────

export function renderHeading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#111827;line-height:1.3;letter-spacing:-0.3px;">${esc(text)}</h2>`
}

export function renderParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#111827;line-height:1.6;">${esc(text)}</p>`
}

export function renderParagraphLast(text: string): string {
  return `<p style="margin:0;font-size:15px;color:#111827;line-height:1.6;">${esc(text)}</p>`
}

export function renderNote(text: string): string {
  return `<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">${esc(text)}</p>`
}

export function renderSectionLabel(text: string): string {
  return `<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111827;">${esc(text)}</p>`
}

export function renderButton(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td style="background-color:#2c6330;border-radius:4px;"><a href="${escUrl(url)}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">${esc(label)}</a></td></tr></table>`
}

export function renderLinkList(items: Array<{ label: string; url: string }>): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:4px 0;"><span style="font-size:14px;color:#6b7280;">→&nbsp;</span><a href="${escUrl(item.url)}" style="font-size:14px;color:#2c6330;text-decoration:underline;">${esc(item.label)}</a></td></tr>`
    )
    .join('')
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">${rows}</table>`
}

export function renderMetaTable(rows: Array<{ label: string; value: string }>): string {
  const rowHtml = rows
    .map((row, i) => {
      const bg = i % 2 === 0 ? 'background-color:#f9f9f7;' : ''
      const border = i < rows.length - 1 ? 'border-bottom:1px solid #e5e7eb;' : ''
      return `<tr style="${bg}"><td style="padding:10px 16px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;width:130px;${border}">${esc(row.label)}</td><td style="padding:10px 16px;font-size:14px;color:#111827;line-height:1.5;${border}">${esc(row.value)}</td></tr>`
    })
    .join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:4px;">${rowHtml}</table>`
}

// ── Row-level helpers (return <tr> elements) ──────────────────────────────────

export function renderSection(html: string): string {
  return `<tr><td style="padding:32px 32px 28px;">${html}</td></tr>`
}

export function renderCriticalBanner(title: string, detail: string): string {
  return `<tr><td style="padding:0 32px 24px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border:1px solid #fcd34d;border-radius:4px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.06em;">${esc(title)}</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#78350f;line-height:1.6;">${esc(detail)}</p></td></tr></table></td></tr>`
}

export function renderStorySection(
  stories: AlertStoryItem[],
  appUrl: string,
  options: { showKeywords?: boolean; label?: string } = {}
): string {
  const { showKeywords = false, label } = options

  const labelRow = label
    ? `<tr><td style="padding:20px 32px 0;"><p style="margin:0 0 0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">${esc(label)}</p></td></tr>`
    : ''

  const storyRows = stories
    .map((story) => {
      const kwTags =
        showKeywords && story.matchedKeywords?.length
          ? `<p style="margin:4px 0 8px;">${story.matchedKeywords.map((kw) => `<span style="display:inline-block;font-size:11px;font-weight:600;color:#2c6330;background-color:#f0f7f0;border:1px solid #c6dfc7;border-radius:3px;padding:2px 8px;margin-right:4px;">${esc(kw)}</span>`).join('')}</p>`
          : ''
      const summary = story.summary
        ? `<p style="margin:0 0 10px;font-size:14px;color:#6b7280;line-height:1.5;">${esc(story.summary)}</p>`
        : ''
      const storyUrl = escUrl(`${appUrl}/wire/library/${story.storyId}`)
      return `<tr><td style="padding:0 32px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e7eb;"><tr><td style="padding:20px 0;"><p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">${esc(story.orgName)}</p><p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:bold;color:#111827;line-height:1.35;"><a href="${storyUrl}" style="color:#111827;text-decoration:none;">${esc(story.title)}</a></p>${kwTags}${summary}<p style="margin:0;font-size:13px;"><a href="${storyUrl}" style="color:#2c6330;text-decoration:underline;font-weight:600;">Read story →</a></p></td></tr></table></td></tr>`
    })
    .join('')

  return labelRow + storyRows
}

// ── Layout ────────────────────────────────────────────────────────────────────

export function renderEmailHtml(options: {
  preheader?: string
  title: string
  content: string
  brandName: string
  appUrl: string
  footerLinkLabel?: string
  footerLinkUrl?: string
  variant?: 'default' | 'critical'
}): string {
  const {
    preheader = '',
    title,
    content,
    brandName,
    appUrl,
    footerLinkLabel = 'Visit platform',
    footerLinkUrl = appUrl,
    variant = 'default',
  } = options

  const isCritical = variant === 'critical'

  const criticalBadge = isCritical
    ? `<td align="right"><span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#fbbf24;letter-spacing:0.06em;text-transform:uppercase;">Action Required</span></td>`
    : ''

  const accentStripe = isCritical
    ? `<tr><td style="background-color:#d97706;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>`
    : ''

  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;color:#f9f9f7;">${esc(preheader)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f9f7;">
${preheaderHtml}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f7;">
<tr><td align="center" style="padding:32px 16px 48px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr><td style="background-color:#111827;padding:20px 32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:-0.3px;">${esc(brandName)}</span></td>
${criticalBadge}
</tr></table>
</td></tr>
${accentStripe}
${content}
<tr><td style="padding:0 32px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e5e7eb;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
<tr><td style="background-color:#f9f9f7;padding:18px 32px 22px;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;line-height:1.6;">This email was sent by ${esc(brandName)}.&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${escUrl(footerLinkUrl)}" style="color:#6b7280;text-decoration:underline;">${esc(footerLinkLabel)}</a></p></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}
