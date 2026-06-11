export type SectionType =
  | "AnnouncementBar"
  | "Hero"
  | "CreatorBio"
  | "ProductGrid"
  | "FeaturedCollection"
  | "Testimonials"
  | "Gallery"
  | "CTA"
  | "FAQ"
  | "SocialLinks"

export interface StoreSection {
  id: string
  type: SectionType
  label: string
  iconKey: string
  enabled: boolean
  order: number
  settings: Record<string, unknown>
}

export interface ThemeTokens {
  accent: string
  accentFg: string
  font: "inter" | "playfair" | "poppins" | "mono"
  layout: "grid-2" | "grid-3" | "list"
  radius: "sm" | "md" | "lg" | "xl" | "full"
  shadow: "none" | "sm" | "md" | "lg"
  buttonStyle: "default" | "pill" | "sharp"
}

export interface AnnouncementSettings {
  enabled: boolean
  text: string
  ctaLabel: string
  ctaUrl: string
  style: "purple" | "coral" | "green" | "amber"
}

export interface SEOSettings {
  title: string
  description: string
  keywords: string
}

export interface DaySchedule {
  day: string
  open: string
  close: string
  closed: boolean
}

export interface StoreHoursSettings {
  enabled: boolean
  timezone: string
  schedule: DaySchedule[]
}

export interface StoreSchema {
  version: 2
  theme: ThemeTokens
  sections: StoreSection[]
  announcement: AnnouncementSettings
  seo: SEOSettings
  hours: StoreHoursSettings
  customDomain: string
  showReviews: boolean
  showStock: boolean
}

export interface StorePreset {
  id: string
  name: string
  preview: string
  description: string
  theme: ThemeTokens
}

export interface HeroSettings {
  headline: string
  subheadline: string
  ctaLabel: string
  layout: "centered" | "split-left" | "split-right"
  showStats: boolean
  backgroundStyle: "solid" | "gradient"
}

export interface ProductGridSettings {
  title: string
  subtitle: string
  maxProducts: number
  showSearch: boolean
  showFilter: boolean
  showStock: boolean
}

export interface FeaturedCollectionSettings {
  title: string
  subtitle: string
  maxProducts: number
  productIds: string[]
}

export interface TestimonialsSettings {
  title: string
  maxCount: number
  layout: "grid" | "list"
}

export interface CTASettings {
  headline: string
  subtext: string
  ctaLabel: string
  style: "accent" | "dark" | "minimal"
}

export interface FAQItem {
  q: string
  a: string
}

export interface FAQSettings {
  title: string
  items: FAQItem[]
}

export interface CreatorBioSettings {
  showStats: boolean
  showSocials: boolean
  showLocation: boolean
  layout: "compact" | "full"
}

export interface SocialLinksSettings {
  title: string
  showLabels: boolean
}

export interface GallerySettings {
  title: string
  maxImages: number
  columns: 2 | 3 | 4
}

export type StorefrontCreator = {
  name: string
  handle: string
  storeName: string
  avatar: string
  cover: string
  bio: string
  location: string
  verified: boolean
  whatsapp: string
  socialLinks: {
    instagram?: string
    twitter?: string
    tiktok?: string
  }
  stats: {
    totalOrders: number
    avgRating: number
    reviewCount: number
  }
  publicProducts: {
    id: string
    name: string
    description: string
    price: number
    currency?: string
    image: string
    category: string
    stock: number | null
    sales: number
    views: number
    status: string
  }[]
  categories: string[]
  reviewSummary: {
    average: number
    total: number
    breakdown: Record<number, number>
  }
}

export interface SectionProps {
  section: StoreSection
  theme: ThemeTokens
  creator: StorefrontCreator
}
