const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_PER_EMAIL = 3
const MAX_PER_IP = 10

interface Bucket {
  count: number
  windowStart: number
}

const emailBuckets = new Map<string, Bucket>()
const ipBuckets = new Map<string, Bucket>()

function isAllowed(map: Map<string, Bucket>, key: string, max: number): boolean {
  const now = Date.now()
  const bucket = map.get(key)
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) return true
  return bucket.count < max
}

function consume(map: Map<string, Bucket>, key: string): void {
  const now = Date.now()
  const bucket = map.get(key)

  // Evict expired entries opportunistically to prevent unbounded growth
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    map.set(key, { count: 1, windowStart: now })
  } else {
    bucket.count++
  }
}

export function checkOtpRateLimit(email: string, ip: string): { allowed: boolean; reason?: string } {
  const normalizedEmail = email.toLowerCase()

  if (!isAllowed(ipBuckets, ip, MAX_PER_IP)) {
    return { allowed: false, reason: 'Too many requests. Please try again later.' }
  }
  if (!isAllowed(emailBuckets, normalizedEmail, MAX_PER_EMAIL)) {
    return { allowed: false, reason: 'Too many codes sent to this address. Please wait 15 minutes.' }
  }

  consume(ipBuckets, ip)
  consume(emailBuckets, normalizedEmail)
  return { allowed: true }
}
