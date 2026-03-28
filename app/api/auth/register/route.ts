import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const cookieStore = await cookies()

    // Use service role to check domain against approved orgs
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    const { data: orgs } = await serviceSupabase
      .from('organizations')
      .select('id, name')
      .eq('email_domain', domain)
      .eq('status', 'approved')
      .limit(1)

    const org = orgs?.[0] ?? null

    if (!org) {
      return NextResponse.json(
        {
          error:
            'Your email domain is not associated with a member organization. Register your newsroom first.',
        },
        { status: 400 }
      )
    }

    // Send magic link via anon client
    const anonSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          },
        },
      }
    )

    const { error: otpError } = await anonSupabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: { name },
      },
    })

    if (otpError) {
      return NextResponse.json({ error: otpError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
