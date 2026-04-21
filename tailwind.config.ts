import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

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
          red: '#2c6330',
          'red-dark': '#1e4522',
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
              color: '#2c6330',
              '&:hover': { color: '#1e4522' },
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
