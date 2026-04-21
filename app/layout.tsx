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
  const cssVarBlock = Object.entries(brandCssVars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')

  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <head>
        <style>{`:root{${cssVarBlock}}`}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
