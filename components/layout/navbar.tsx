import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NavbarClient from './navbar-client'
import { brand } from '@/lib/brand'

export default async function Navbar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let displayName = ''
  let orgName = ''

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name, organizations(name)')
      .eq('id', user.id)
      .single()

    if (data) {
      displayName = data.display_name
      orgName = (data.organizations as unknown as { name: string } | null)?.name ?? ''
    }
  }

  return (
    <header className="bg-wire-navy text-white border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link
            href="/wire/library"
            className="font-serif text-lg font-bold tracking-tight hover:text-white/90 transition-colors"
          >
            {brand.name}
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/75">
            <Link href="/wire/library" className="hover:text-white transition-colors">
              Library
            </Link>
            <Link href="/wire/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/wire/directory" className="hover:text-white transition-colors">
              Directory
            </Link>
            <Link href="/wire/docs" className="hover:text-white transition-colors">
              Help
            </Link>
          </nav>
        </div>

        <NavbarClient displayName={displayName} orgName={orgName} />
      </div>
    </header>
  )
}
