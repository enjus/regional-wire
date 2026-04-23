// Edge-runtime-safe auth helpers (Web Crypto only — no Node.js crypto).
// Used exclusively by middleware.ts.

function timingSafeEqualStr(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length)
  let result = a.length === b.length ? 0 : 1
  for (let i = 0; i < maxLen; i++) {
    result |= (a.charCodeAt(i % a.length) ^ b.charCodeAt(i % b.length))
  }
  return result === 0
}

export function checkBasicAuth(authHeader: string | null): boolean {
  if (!authHeader?.startsWith('Basic ')) return false
  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
  const colonIdx = decoded.indexOf(':')
  if (colonIdx === -1) return false
  const username = decoded.slice(0, colonIdx)
  const password = decoded.slice(colonIdx + 1)
  const expectedUser = process.env.ADMIN_USERNAME ?? ''
  const expectedPass = process.env.ADMIN_PASSWORD ?? ''
  if (!expectedUser || !expectedPass) return false
  return timingSafeEqualStr(username, expectedUser) &&
         timingSafeEqualStr(password, expectedPass)
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyAdminToken(
  orgId: string, action: string, token: string
): Promise<boolean> {
  const secret = process.env.ADMIN_TOKEN_SECRET
  if (!secret) return false
  const hour = Math.floor(Date.now() / 3_600_000)
  for (const h of [hour, hour - 1]) {
    const expected = await hmacHex(secret, `${orgId}:${action}:${h}`)
    if (timingSafeEqualStr(token, expected)) return true
  }
  return false
}
