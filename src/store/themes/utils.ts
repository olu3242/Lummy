import type { ThemeTokens } from "../schema/types"

export const FONT_MAP: Record<ThemeTokens["font"], string> = {
  inter: "'Inter', system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  poppins: "'Poppins', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
}

export const RADIUS_MAP: Record<ThemeTokens["radius"], string> = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
}

export const SHADOW_MAP: Record<ThemeTokens["shadow"], string> = {
  none: "none",
  sm: "0 2px 8px rgba(0,0,0,0.08)",
  md: "0 4px 16px rgba(0,0,0,0.12)",
  lg: "0 8px 32px rgba(0,0,0,0.18)",
}

export function getButtonRadius(theme: ThemeTokens): string {
  if (theme.buttonStyle === "pill") return "9999px"
  if (theme.buttonStyle === "sharp") return "0.25rem"
  return RADIUS_MAP[theme.radius]
}

export function getFontFamily(font: ThemeTokens["font"]): string {
  return FONT_MAP[font]
}

export function getCardRadius(theme: ThemeTokens): string {
  return RADIUS_MAP[theme.radius]
}

export function getCardShadow(theme: ThemeTokens): string {
  return SHADOW_MAP[theme.shadow]
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function accentWithAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}
