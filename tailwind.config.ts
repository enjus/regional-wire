import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const ACCENT = process.env.NEXT_PUBLIC_BRAND_ACCENT ?? '#c41230'
const ACCENT_DARK = process.env.NEXT_PUBLIC_BRAND_ACCENT_DARK ?? '#9a0e26'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--font-lora)', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        wire: {
          red: ACCENT,
          'red-dark': ACCENT_DARK,
          navy: '#111827',
          'navy-light': '#1f2937',
          slate: '#6b7280',
          'border': '#e5e7eb',
          'bg': '#f9f9f7',
          'surface': '#ffffff',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#111827',
            a: {
              color: '#c41230',
              '&:hover': { color: '#9a0e26' },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
