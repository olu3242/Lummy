import type { StoreSchema, StoreSection, SectionType, ThemeTokens } from "./types"

export const DEFAULT_THEME: ThemeTokens = {
  accent: "#6C4EF3",
  accentFg: "#ffffff",
  font: "inter",
  layout: "grid-3",
  radius: "lg",
  shadow: "md",
  buttonStyle: "default",
}

type SectionDefaults = Omit<StoreSection, "id" | "order">

export const SECTION_DEFAULTS: Record<SectionType, SectionDefaults> = {
  AnnouncementBar: {
    type: "AnnouncementBar",
    label: "Announcement Bar",
    iconKey: "Megaphone",
    enabled: true,
    settings: {
      enabled: true,
      text: "🎉 Free delivery on orders above ₦15,000!",
      ctaLabel: "Shop Now",
      ctaUrl: "",
      style: "purple",
    },
  },
  Hero: {
    type: "Hero",
    label: "Hero Banner",
    iconKey: "Sparkles",
    enabled: true,
    settings: {
      headline: "Quality pieces, delivered to you",
      subheadline: "Authentic fashion & lifestyle products, straight from the creator",
      ctaLabel: "Shop Now",
      layout: "centered",
      showStats: true,
      backgroundStyle: "gradient",
    },
  },
  CreatorBio: {
    type: "CreatorBio",
    label: "Creator Bio",
    iconKey: "User",
    enabled: true,
    settings: {
      showStats: true,
      showSocials: true,
      showLocation: true,
      layout: "full",
    },
  },
  ProductGrid: {
    type: "ProductGrid",
    label: "Products",
    iconKey: "ShoppingBag",
    enabled: true,
    settings: {
      title: "Products",
      subtitle: "",
      maxProducts: 12,
      showSearch: true,
      showFilter: true,
      showStock: true,
    },
  },
  FeaturedCollection: {
    type: "FeaturedCollection",
    label: "Featured Collection",
    iconKey: "Star",
    enabled: false,
    settings: {
      title: "Featured Picks",
      subtitle: "Hand-selected favourites",
      maxProducts: 4,
      productIds: [],
    },
  },
  Testimonials: {
    type: "Testimonials",
    label: "Reviews",
    iconKey: "MessageSquare",
    enabled: true,
    settings: {
      title: "What customers say",
      maxCount: 4,
      layout: "grid",
    },
  },
  Gallery: {
    type: "Gallery",
    label: "Gallery",
    iconKey: "Image",
    enabled: false,
    settings: {
      title: "Gallery",
      maxImages: 9,
      columns: 3,
    },
  },
  CTA: {
    type: "CTA",
    label: "WhatsApp CTA",
    iconKey: "MessageCircle",
    enabled: true,
    settings: {
      headline: "Questions? Let's chat!",
      subtext: "Drop a message on WhatsApp and get a reply within minutes.",
      ctaLabel: "Chat on WhatsApp",
      style: "accent",
    },
  },
  FAQ: {
    type: "FAQ",
    label: "FAQ",
    iconKey: "HelpCircle",
    enabled: false,
    settings: {
      title: "Frequently Asked Questions",
      items: [
        { q: "How long does delivery take?", a: "Delivery typically takes 1-3 business days within Lagos and 3-5 days for other states." },
        { q: "What payment methods do you accept?", a: "We accept bank transfers, Paystack, and WhatsApp payments." },
        { q: "Can I return or exchange an item?", a: "Yes! Returns are accepted within 7 days of delivery for unused items in original packaging." },
      ],
    },
  },
  SocialLinks: {
    type: "SocialLinks",
    label: "Social Links",
    iconKey: "Link2",
    enabled: false,
    settings: {
      title: "Follow me",
      showLabels: true,
    },
  },
}

export const DEFAULT_SECTIONS: StoreSection[] = [
  { id: "s-bio",      ...SECTION_DEFAULTS.CreatorBio,        order: 0 },
  { id: "s-announce", ...SECTION_DEFAULTS.AnnouncementBar,   order: 1 },
  { id: "s-products", ...SECTION_DEFAULTS.ProductGrid,       order: 2 },
  { id: "s-featured", ...SECTION_DEFAULTS.FeaturedCollection, order: 3 },
  { id: "s-reviews",  ...SECTION_DEFAULTS.Testimonials,      order: 4 },
  { id: "s-cta",      ...SECTION_DEFAULTS.CTA,               order: 5 },
]

export const DEFAULT_SCHEMA: StoreSchema = {
  version: 2,
  theme: DEFAULT_THEME,
  sections: DEFAULT_SECTIONS,
  announcement: {
    enabled: true,
    text: "🎉 Free delivery on orders above ₦15,000!",
    ctaLabel: "Shop Now",
    ctaUrl: "",
    style: "purple",
  },
  seo: {
    title: "",
    description: "",
    keywords: "",
  },
  hours: {
    enabled: false,
    timezone: "Africa/Lagos",
    schedule: [
      { day: "Monday", open: "09:00", close: "18:00", closed: false },
      { day: "Tuesday", open: "09:00", close: "18:00", closed: false },
      { day: "Wednesday", open: "09:00", close: "18:00", closed: false },
      { day: "Thursday", open: "09:00", close: "18:00", closed: false },
      { day: "Friday", open: "09:00", close: "18:00", closed: false },
      { day: "Saturday", open: "10:00", close: "16:00", closed: false },
      { day: "Sunday", open: "10:00", close: "14:00", closed: true },
    ],
  },
  customDomain: "",
  showReviews: true,
  showStock: true,
}
