import Link from 'next/link'
import PublicNavClient from '@/components/public/public-nav-client'
import { brand } from '@/lib/brand'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-wire-bg">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-wire-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between relative">
          <Link href="/" className="font-serif text-lg font-bold text-wire-navy tracking-tight">
            {brand.name}
          </Link>

          <nav className="hidden sm:flex items-center gap-8 text-[13px] text-wire-slate">
            <Link href="/how-it-works" className="hover:text-wire-navy transition-colors">How it works</Link>
            <Link href="/docs" className="hover:text-wire-navy transition-colors">Docs</Link>
          </nav>

          <div className="hidden sm:flex items-center gap-5">
            <Link href="/login" className="text-[13px] text-wire-slate hover:text-wire-navy transition-colors">
              Sign in
            </Link>
            <Link
              href="/register/organization"
              className="bg-wire-red text-white text-[13px] font-medium px-4 py-2 rounded hover:bg-wire-red-dark transition-colors"
            >
              Join the network
            </Link>
          </div>

          <PublicNavClient />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-wire-navy text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 pb-10 border-b border-white/10">
            <div className="col-span-2">
              <span className="font-serif text-xl font-bold block mb-3">{brand.name}</span>
              <p className="text-sm text-white/45 leading-relaxed max-w-xs">
                A content-sharing platform built for regional newsrooms. Member organizations share and republish stories across the network.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-4">Platform</p>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-4">Account</p>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Create account</Link></li>
                <li><Link href="/register/organization" className="hover:text-white transition-colors">Join as newsroom</Link></li>
              </ul>
            </div>
          </div>
          <p className="pt-6 text-xs text-white/20">
            © {new Date().getFullYear()} {brand.name}. Built for local journalism.
          </p>
        </div>
      </footer>
    </div>
  )
}
