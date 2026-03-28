import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import slugifyLib from 'slugify'
import crypto from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "MMMM d, yyyy 'at' h:mm a")
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? ''
}

export function isEmbargoActive(embargoLiftsAt: string | null): boolean {
  if (!embargoLiftsAt) return false
  return new Date() < new Date(embargoLiftsAt)
}

// Generate a signed admin token for approve/reject email links
export function generateAdminToken(orgId: string, action: string): string {
  const hour = Math.floor(Date.now() / 3_600_000)
  const secret = process.env.ADMIN_PASSWORD ?? 'fallback-secret'
  return crypto
    .createHmac('sha256', secret)
    .update(`${orgId}:${action}:${hour}`)
    .digest('hex')
}

// Verify admin token — valid for current hour and the previous hour
export function verifyAdminToken(orgId: string, action: string, token: string): boolean {
  const hour = Math.floor(Date.now() / 3_600_000)
  const secret = process.env.ADMIN_PASSWORD ?? 'fallback-secret'
  for (const h of [hour, hour - 1]) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orgId}:${action}:${h}`)
      .digest('hex')
    if (token === expected) return true
  }
  return false
}

// Check HTTP Basic Auth header
export function checkBasicAuth(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) return false
  const b64 = authHeader.slice(6)
  const decoded = Buffer.from(b64, 'base64').toString('utf-8')
  const [username, password] = decoded.split(':')
  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  )
}

// Strip HTML elements that are non-republishable or CMS-hostile:
// interactive embeds, scripts, styles, forms, and media that can't transfer.
// Also strips event handlers and javascript: hrefs to prevent XSS.
export function sanitizeStoryHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    // Strip event handler attributes (onclick, onload, onerror, etc.)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // Strip javascript: and data: URIs from href/src/action attributes
    .replace(/\b(href|src|action)\s*=\s*(?:"(javascript|data):[^"]*"|'(javascript|data):[^']*')/gi, '')
}

export function generateRepublicationPackage(
  story: {
    title: string
    byline: string
    canonical_url: string
    body_plain: string
    special_instructions?: string | null
    organizations?: { name: string }
  },
  assets: {
    asset_type: string
    file_url: string
    displayUrl?: string
    caption?: string | null
    credit?: string | null
    is_primary: boolean
  }[]
): string {
  const orgName = story.organizations?.name ?? 'Unknown Organization'
  const primaryImage = assets.find((a) => a.is_primary && a.asset_type === 'image')
  const additionalImages = assets.filter(
    (a) => !a.is_primary && a.asset_type === 'image'
  )
  const video = assets.find((a) => a.asset_type === 'video')

  const lines: string[] = [
    `[REPUBLICATION PACKAGE — ${orgName}]`,
    `Headline: ${story.title}`,
    `Byline: ${story.byline}`,
    `Original URL: ${story.canonical_url}`,
    '',
    story.body_plain,
    '',
    '---',
    `This story was originally published by ${orgName}. Read the original here: ${story.canonical_url}`,
    '---',
  ]

  if (primaryImage || additionalImages.length > 0 || video) {
    lines.push('')
    lines.push('[ASSETS]')

    if (primaryImage) {
      lines.push(`Primary image: ${primaryImage.displayUrl ?? primaryImage.file_url}`)
      if (primaryImage.caption) lines.push(`  Caption: ${primaryImage.caption}`)
      if (primaryImage.credit) lines.push(`  Credit: ${primaryImage.credit}`)
    }

    if (additionalImages.length > 0) {
      lines.push('')
      lines.push('[ADDITIONAL IMAGES]')
      for (const img of additionalImages) {
        const parts = [img.displayUrl ?? img.file_url]
        if (img.caption) parts.push(`Caption: ${img.caption}`)
        if (img.credit) parts.push(`Credit: ${img.credit}`)
        lines.push(`  ${parts.join(' | ')}`)
      }
    }

    if (video) {
      lines.push('')
      lines.push('[VIDEO]')
      const parts = [video.displayUrl ?? video.file_url]
      if (video.caption) parts.push(`Caption: ${video.caption}`)
      if (video.credit) parts.push(`Credit: ${video.credit}`)
      lines.push(`  ${parts.join(' | ')}`)
    }
  }

  return lines.join('\n')
}
