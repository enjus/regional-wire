const BRAND_ACCENT = process.env.NEXT_PUBLIC_BRAND_ACCENT ?? '#2c6330'
const BRAND_ACCENT_DARK = process.env.NEXT_PUBLIC_BRAND_ACCENT_DARK ?? '#1e4522'

function hexToRgbChannels(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r} ${g} ${b}`
}

export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Regional Wire',
  description:
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ??
    'A content-sharing platform for regional news organizations. Share and republish stories across your newsroom network.',
  accentHex: BRAND_ACCENT,
  accentDarkHex: BRAND_ACCENT_DARK,
}

export const brandCssVars: Record<string, string> = {
  '--brand-accent-rgb': hexToRgbChannels(BRAND_ACCENT),
  '--brand-accent-dark-rgb': hexToRgbChannels(BRAND_ACCENT_DARK),
}
