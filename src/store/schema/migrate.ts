import type { StoreSchema, ThemeTokens } from "./types"
import { DEFAULT_SCHEMA } from "./defaults"

interface LegacyStoreSettings {
  accent?: string
  font?: string
  layout?: string
  announcement?: {
    enabled: boolean
    text: string
    ctaLabel: string
    ctaUrl: string
    style: string
  }
  seo?: {
    title: string
    description: string
    keywords: string
  }
  hours?: {
    enabled: boolean
    timezone: string
    schedule: Array<{ day: string; open: string; close: string; closed: boolean }>
  }
  customDomain?: string
  showReviews?: boolean
  showStock?: boolean
}

export function migrateToStoreSchema(raw: unknown): StoreSchema {
  if (raw && typeof raw === "object" && (raw as Record<string, unknown>).version === 2) {
    return raw as StoreSchema
  }

  const old = (raw as LegacyStoreSettings) ?? {}

  const theme: ThemeTokens = {
    accent: old.accent ?? "#6C4EF3",
    accentFg: "#ffffff",
    font: (old.font as ThemeTokens["font"]) ?? "inter",
    layout: (old.layout as ThemeTokens["layout"]) ?? "grid-3",
    radius: "lg",
    shadow: "md",
    buttonStyle: "default",
  }

  return {
    ...DEFAULT_SCHEMA,
    theme,
    announcement: old.announcement
      ? {
          enabled: old.announcement.enabled ?? true,
          text: old.announcement.text ?? DEFAULT_SCHEMA.announcement.text,
          ctaLabel: old.announcement.ctaLabel ?? "Shop Now",
          ctaUrl: old.announcement.ctaUrl ?? "",
          style: (old.announcement.style as "purple" | "coral" | "green" | "amber") ?? "purple",
        }
      : DEFAULT_SCHEMA.announcement,
    seo: old.seo ?? DEFAULT_SCHEMA.seo,
    hours: old.hours ?? DEFAULT_SCHEMA.hours,
    customDomain: old.customDomain ?? "",
    showReviews: old.showReviews ?? true,
    showStock: old.showStock ?? true,
  }
}
