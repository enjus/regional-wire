import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import { brand, brandCssVars } from '@/lib/brand'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
})

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s — ${brand.name}`,
  },
  description: brand.description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`} style={brandCssVars as React.CSSProperties}>
      <body>{children}</body>
    </html>
  )
}
