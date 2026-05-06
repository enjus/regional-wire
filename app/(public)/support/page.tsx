import { createClient } from '@/lib/supabase/server'
import { brand } from '@/lib/brand'
import SupportForm from './support-form'

export const metadata = {
  title: `Contact Support — ${brand.name}`,
}

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialName = ''
  let initialEmail = ''
  let orgName = ''

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name, email, organizations(name)')
      .eq('id', user.id)
      .single()

    if (data) {
      initialName = data.display_name
      initialEmail = data.email
      orgName = (data.organizations as unknown as { name: string } | null)?.name ?? ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
      <h1 className="font-serif text-3xl font-bold text-wire-navy mb-2">Contact support</h1>
      <p className="text-wire-slate mb-8">
        Questions or issues with {brand.name}? Send us a message and we&apos;ll get back to you.
      </p>

      <SupportForm
        initialName={initialName}
        initialEmail={initialEmail}
        orgName={orgName || undefined}
      />
    </div>
  )
}
