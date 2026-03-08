import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendUserWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    const { data: user } = await supabase
      .from('users')
      .select('email, display_name, organizations(name)')
      .eq('id', userId)
      .single()

    if (user) {
      const orgName = (user.organizations as unknown as { name: string } | null)?.name ?? ''
      await sendUserWelcomeEmail(user.email, user.display_name, orgName)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Always return success — fire-and-forget
  }
}
