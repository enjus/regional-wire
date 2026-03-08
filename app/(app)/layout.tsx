import Navbar from '@/components/layout/navbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-wire-bg">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
