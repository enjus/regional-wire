import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkBasicAuth, verifyAdminToken } from './lib/edge-auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ----------------------------------------------------------------
  // Admin routes: HTTP Basic Auth
  // ----------------------------------------------------------------
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Allow token-signed approve/reject links from email (no Basic Auth needed)
    const tokenRouteMatch = pathname.match(/^\/api\/admin\/orgs\/([^/]+)\/(approve|reject)$/)
    if (tokenRouteMatch) {
      const token = request.nextUrl.searchParams.get('token')
      if (token && await verifyAdminToken(tokenRouteMatch[1], tokenRouteMatch[2], token)) {
        return NextResponse.next()
      }
    }

    const authHeader = request.headers.get('authorization')
    if (!checkBasicAuth(authHeader)) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': `Basic realm="${process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Regional Wire'} Admin"`,
        },
      })
    }
    // Admin routes don't need Supabase session
    return NextResponse.next()
  }

  // ----------------------------------------------------------------
  // Public routes: skip auth entirely
  // ----------------------------------------------------------------
  const publicPaths = [
    '/login',
    '/register',
    '/auth/callback',
    '/auth/confirm',
    '/auth/landing',
    '/pending',
    '/api/orgs/register',
    '/api/auth/register',
    '/api/auth/notify-pending',
    '/api/cron',
  ]
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const requiresAuth =
    pathname.startsWith('/wire') ||
    pathname.startsWith('/platform-admin') ||
    pathname.startsWith('/library') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/directory') ||
    (pathname.startsWith('/api/') &&
      !pathname.startsWith('/api/orgs/register') &&
      !pathname.startsWith('/api/auth/register') &&
      !pathname.startsWith('/api/cron'))

  if (!requiresAuth) {
    return NextResponse.next()
  }

  // ----------------------------------------------------------------
  // Protected routes: refresh Supabase session
  // ----------------------------------------------------------------
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Parameters<typeof supabaseResponse.cookies.set>[2] }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not authenticated — redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated — check they have an active users record (org association)
  if (pathname !== '/auth/callback' && !pathname.startsWith('/api/')) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, organization_id, status')
      .eq('id', user.id)
      .single()

    if (!userRecord) {
      // Signed up but no org match — redirect to register with message
      const url = request.nextUrl.clone()
      url.pathname = '/register'
      url.searchParams.set('error', 'no-org')
      return NextResponse.redirect(url)
    }

    if (userRecord.status === 'pending') {
      const url = request.nextUrl.clone()
      url.pathname = '/pending'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
