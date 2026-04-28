export const DEFAULT_ATTRIBUTION_TEMPLATE =
  'This story originally appeared in {{org}}: {{headline}}'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Only allow http/https hrefs to prevent javascript: / data: XSS
function safeHref(url: string): string {
  return /^https?:\/\//i.test(url) ? escapeHtml(url) : '#'
}

interface AttributionParams {
  template?: string | null
  orgName: string
  orgWebsite: string
  title: string
  url: string
}

export function renderAttributionHtml({
  template,
  orgName,
  orgWebsite,
  title,
  url,
}: AttributionParams): string {
  const tpl = template?.trim() || DEFAULT_ATTRIBUTION_TEMPLATE

  const parts = tpl.split(/({{headline}}|{{url}}|{{org}}|{{website}})/g)
  const html = parts
    .map((part) => {
      if (part === '{{headline}}') {
        return `<a href="${safeHref(url)}">${escapeHtml(title)}</a>`
      }
      if (part === '{{website}}') {
        return orgWebsite
          ? `<a href="${safeHref(orgWebsite)}">${escapeHtml(orgWebsite)}</a>`
          : ''
      }
      if (part === '{{url}}') {
        return escapeHtml(url)
      }
      if (part === '{{org}}') {
        return escapeHtml(orgName)
      }
      return escapeHtml(part)
    })
    .join('')

  return `<p><em>${html}</em></p>`
}

export function renderAttributionPlain({
  template,
  orgName,
  orgWebsite,
  title,
  url,
}: AttributionParams): string {
  const tpl = template?.trim() || DEFAULT_ATTRIBUTION_TEMPLATE
  return tpl
    .replace(/{{headline}}/g, title)
    .replace(/{{url}}/g, url)
    .replace(/{{org}}/g, orgName)
    .replace(/{{website}}/g, orgWebsite)
}
