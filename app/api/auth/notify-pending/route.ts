import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendUserPendingApprovalEmail } from '@/lib/email'

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

    const { data: pendingUser } = await supabase
      .from('users')
      .select('email, display_name, organization_id, organizations(name)')
      .eq('id', userId)
      .single()

    if (!pendingUser) return NextResponse.json({ ok: true })

    const orgName = (pendingUser.organizations as unknown as { name: string } | null)?.name ?? ''

    // Find active admins for this org
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('organization_id', pendingUser.organization_id)
      .eq('role', 'admin')
      .eq('status', 'active')

    const adminEmails = (admins ?? []).map((a) => a.email)
    if (adminEmails.length > 0) {
      await sendUserPendingApprovalEmail(
        adminEmails,
        pendingUser.display_name,
        pendingUser.email,
        orgName
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Always return success — fire-and-forget
  }
}
