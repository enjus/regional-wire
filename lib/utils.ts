import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import slugifyLib from 'slugify'
import crypto from 'crypto'
import sanitizeHtml from 'sanitize-html'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true })
}

const DISPLAY_TZ = 'America/Los_Angeles'

export function formatDate(date: string | Date): string {
  return format(toZonedTime(new Date(date), DISPLAY_TZ), 'MMMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(toZonedTime(new Date(date), DISPLAY_TZ), "MMMM d, yyyy 'at' h:mm a")
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? ''
}

// Block private/internal/loopback hosts to prevent SSRF when fetching feed URLs.
// Returns null if safe, or an error message string if the hostname should be rejected.
export function validatePublicFeedHostname(urlString: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(urlString.trim())
  } catch {
    return 'Invalid feed URL.'
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'Feed URL must use HTTP or HTTPS.'
  }

  const host = parsed.hostname.toLowerCase()

  // Reject empty or bracketed literal forms
  if (!host) return 'Invalid feed URL hostname.'

  // Reject suspicious TLDs and loopback names
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return 'Feed URL cannot target localhost.'
  }
  if (host.endsWith('.local') || host.endsWith('.internal')) {
    return 'Feed URL cannot target internal network hosts.'
  }

  // IPv6 loopback (URL parses to "::1" -> hostname becomes "[::1]" unwrapped to "::1" by WHATWG)
  if (host === '::1' || host === '[::1]') {
    return 'Feed URL cannot target a loopback address.'
  }

  // IPv4 literal checks
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const octets = ipv4Match.slice(1, 5).map((n) => Number(n))
    if (octets.some((o) => o < 0 || o > 255)) {
      return 'Invalid feed URL hostname.'
    }
    const [a, b] = octets
    // 127.0.0.0/8 loopback
    if (a === 127) return 'Feed URL cannot target a loopback address.'
    // 10.0.0.0/8
    if (a === 10) return 'Feed URL cannot target a private network.'
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return 'Feed URL cannot target a private network.'
    // 192.168.0.0/16
    if (a === 192 && b === 168) return 'Feed URL cannot target a private network.'
    // 169.254.0.0/16 link-local
    if (a === 169 && b === 254) return 'Feed URL cannot target a link-local address.'
    // 0.0.0.0/8
    if (a === 0) return 'Invalid feed URL hostname.'
  }

  return null
}

export function isEmbargoActive(embargoLiftsAt: string | null): boolean {
  if (!embargoLiftsAt) return false
  return new Date() < new Date(embargoLiftsAt)
}

// Constant-time string compare that tolerates unequal lengths
// (crypto.timingSafeEqual throws on length mismatch).
function timingSafeEqualStr(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf-8')
  const bBuf = Buffer.from(b, 'utf-8')
  if (aBuf.length !== bBuf.length) {
    // Still do a constant-time compare against a same-length buffer
    // so the short-circuit timing doesn't leak length information.
    try {
      crypto.timingSafeEqual(aBuf, Buffer.alloc(aBuf.length))
    } catch {
      // ignore
    }
    return false
  }
  try {
    return crypto.timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

function getAdminTokenSecret(): string {
  const secret = process.env.ADMIN_TOKEN_SECRET
  if (!secret) {
    throw new Error('ADMIN_TOKEN_SECRET is not configured.')
  }
  return secret
}

// Generate a signed admin token for approve/reject email links
export function generateAdminToken(orgId: string, action: string): string {
  const hour = Math.floor(Date.now() / 3_600_000)
  const secret = getAdminTokenSecret()
  return crypto
    .createHmac('sha256', secret)
    .update(`${orgId}:${action}:${hour}`)
    .digest('hex')
}

// Verify admin token — valid for current hour and the previous hour
export function verifyAdminToken(orgId: string, action: string, token: string): boolean {
  const hour = Math.floor(Date.now() / 3_600_000)
  const secret = getAdminTokenSecret()
  for (const h of [hour, hour - 1]) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orgId}:${action}:${h}`)
      .digest('hex')
    if (timingSafeEqualStr(token, expected)) return true
  }
  return false
}

// Check HTTP Basic Auth header
export function checkBasicAuth(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) return false
  const b64 = authHeader.slice(6)
  const decoded = Buffer.from(b64, 'base64').toString('utf-8')
  const [username, password] = decoded.split(':')
  const expectedUser = process.env.ADMIN_USERNAME ?? ''
  const expectedPass = process.env.ADMIN_PASSWORD ?? ''
  if (!expectedUser || !expectedPass) return false
  const userOk = timingSafeEqualStr(username ?? '', expectedUser)
  const passOk = timingSafeEqualStr(password ?? '', expectedPass)
  return userOk && passOk
}

// Strip HTML elements that are non-republishable or CMS-hostile:
// interactive embeds, scripts, styles, forms, and media that can't transfer.
// Also strips event handlers and javascript: hrefs to prevent XSS.
export function sanitizeStoryHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u',
      'a', 'ul', 'ol', 'li', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'pre', 'code', 'hr',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? ''
        const isExternal = /^https?:\/\//i.test(href)
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(isExternal ? { rel: 'noopener noreferrer' } : {}),
          },
        }
      },
    },
  })
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
