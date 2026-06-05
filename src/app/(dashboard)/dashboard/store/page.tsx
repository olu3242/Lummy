"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import {
  Store, Camera, Share2, ExternalLink, Copy, CheckCheck,
  MessageCircle, Instagram, Twitter, MapPin, Link2,
  BadgeCheck, ChevronRight, Globe, Search, Megaphone,
  GripVertical, Eye, EyeOff, Palette, Settings, AlertCircle,
  Clock, ChevronDown, X, Sparkles, LayoutGrid, List, Package,
  Star, Users, ShoppingBag, Tag, Plus, Trash2, Wand2,
} from "lucide-react"
import { PublishToggle } from "@/components/dashboard/publish-toggle"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useStoreSchema } from "@/store/hooks/use-store-schema"
import { useUpload } from "@/hooks/use-upload"
import { StorefrontPreview } from "@/store/preview/storefront-preview"
import { ThemeEditorPanel } from "@/store/editor/theme-editor-panel"
import { SectionListEditor } from "@/store/editor/section-list-editor"
import { SectionSettingsEditor } from "@/store/editor/section-settings-editor"
import { SectionAddDialog } from "@/store/editor/section-add-dialog"
import type { StorefrontCreator } from "@/store/schema/types"

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { name: "Purple",  value: "#6C4EF3" },
  { name: "Green",   value: "#10B981" },
  { name: "Coral",   value: "#F97316" },
  { name: "Rose",    value: "#F43F5E" },
  { name: "Sky",     value: "#0EA5E9" },
  { name: "Amber",   value: "#F59E0B" },
  { name: "Indigo",  value: "#4F46E5" },
  { name: "Fuchsia", value: "#D946EF" },
]

const FONTS: { value: StoreSettings["font"]; label: string; desc: string }[] = [
  { value: "inter",    label: "Inter",    desc: "Clean & modern" },
  { value: "playfair", label: "Playfair", desc: "Elegant serif" },
  { value: "poppins",  label: "Poppins",  desc: "Rounded & friendly" },
  { value: "mono",     label: "Mono",     desc: "Tech-forward" },
]

const LAYOUTS = [
  { value: "grid-2", label: "2 cols",  icon: LayoutGrid },
  { value: "grid-3", label: "3 cols",  icon: LayoutGrid },
  { value: "list",   label: "List",    icon: List },
] as const

type LayoutValue = typeof LAYOUTS[number]["value"]

interface StoreSection {
  id: string
  label: string
  icon: React.ElementType
  visible: boolean
}

const DEFAULT_SECTIONS: StoreSection[] = [
  { id: "featured",     label: "Featured Products",  icon: Star,       visible: true  },
  { id: "products",     label: "All Products",        icon: Package,    visible: true  },
  { id: "collections",  label: "Collections",         icon: Tag,        visible: true  },
  { id: "testimonials", label: "Reviews",             icon: Star,       visible: true  },
  { id: "about",        label: "About Me",            icon: Users,      visible: true  },
  { id: "socials",      label: "Social Links",        icon: Link2,      visible: false },
]

interface AnnouncementBar {
  enabled: boolean
  text: string
  ctaLabel: string
  ctaUrl: string
  style: "purple" | "coral" | "green" | "amber"
}

interface StoreHours {
  enabled: boolean
  timezone: string
  schedule: { day: string; open: string; close: string; closed: boolean }[]
}

interface StoreSettings {
  accent: string
  font: "inter" | "playfair" | "poppins" | "mono"
  layout: LayoutValue
  sections: StoreSection[]
  announcement: AnnouncementBar
  seo: { title: string; description: string; keywords: string }
  hours: StoreHours
  customDomain: string
  showReviews: boolean
  showStock: boolean
  currency: string
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const DEFAULT_SETTINGS: StoreSettings = {
  accent: "#6C4EF3",
  font: "inter",
  layout: "grid-3",
  sections: DEFAULT_SECTIONS,
  announcement: { enabled: false, text: "🎉 Free delivery on orders above ₦15,000!", ctaLabel: "Shop now", ctaUrl: "", style: "purple" },
  seo: { title: "", description: "", keywords: "" },
  hours: {
    enabled: false,
    timezone: "Africa/Lagos",
    schedule: DAYS.map(day => ({ day, open: "09:00", close: "18:00", closed: day === "Sun" })),
  },
  customDomain: "",
  showReviews: true,
  showStock: true,
  currency: "NGN",
}

type StoreDetails = {
  storeName: string
  handle: string
  bio: string
  whatsapp: string
  location: string
  avatarUrl: string
  coverUrl: string
  socialLinks: {
    instagram: string
    twitter: string
    tiktok: string
  }
}

type AccountConfigResponse = {
  profile?: {
    full_name?: string | null
    phone?: string | null
    avatar_url?: string | null
  } | null
  organization?: {
    name?: string | null
  } | null
  storefront?: {
    handle?: string | null
    bio?: string | null
    hero_image?: string | null
    social_links?: Record<string, string | null> | null
    theme?: Partial<StoreSettings> | null
    store_schema?: { theme?: { accent?: string; font?: StoreSettings["font"]; layout?: LayoutValue } } | null
  } | null
}

type StoreSchemaThemePayload = {
  theme?: {
    accent?: string
    font?: StoreSettings["font"]
    layout?: LayoutValue
  }
} | null

const emptyStoreDetails: StoreDetails = {
  storeName: "",
  handle: "",
  bio: "",
  whatsapp: "",
  location: "",
  avatarUrl: "",
  coverUrl: "",
  socialLinks: { instagram: "", twitter: "", tiktok: "" },
}

function isDummyCreatorText(value?: string) {
  return /sade|sadeboutique|sade\.styles|ankara|nigerian designer/i.test(value ?? "")
}

function normalizeStoreSettings(theme?: Partial<StoreSettings> | null, schemaTheme?: StoreSchemaThemePayload): StoreSettings {
  const schemaTokens = schemaTheme?.theme ?? null
  return {
    ...DEFAULT_SETTINGS,
    ...(theme ?? {}),
    accent: theme?.accent ?? schemaTokens?.accent ?? DEFAULT_SETTINGS.accent,
    font: theme?.font ?? schemaTokens?.font ?? DEFAULT_SETTINGS.font,
    layout: theme?.layout ?? schemaTokens?.layout ?? DEFAULT_SETTINGS.layout,
    sections: theme?.sections ?? DEFAULT_SETTINGS.sections,
    announcement: { ...DEFAULT_SETTINGS.announcement, ...(theme?.announcement ?? {}) },
    seo: { ...DEFAULT_SETTINGS.seo, ...(theme?.seo ?? {}) },
    hours: { ...DEFAULT_SETTINGS.hours, ...(theme?.hours ?? {}) },
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, color = "bg-brand-purple" }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn("relative h-5 w-9 rounded-full transition-all duration-200", checked ? color : "bg-muted")}
    >
      <span className={cn(
        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0.5"
      )} />
    </button>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, children }: { icon: React.ElementType; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-2.5">
        <div className="rounded-xl bg-brand-purple/10 p-2 flex-shrink-0">
          <Icon className="h-4 w-4 text-brand-purple" />
        </div>
        <div>
          <p className="text-sm font-bold">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

type TabKey = "appearance" | "sections" | "announcement" | "seo" | "hours" | "domain" | "details" | "customizer"

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StorePage() {
  const [settings, setSettings] = React.useState<StoreSettings>(DEFAULT_SETTINGS)
  const [storeDetails, setStoreDetails] = React.useState<StoreDetails>(emptyStoreDetails)
  const [activeTab, setActiveTab] = React.useState<TabKey>("details")
  const [saving, setSaving] = React.useState(false)
  const [copiedUrl, setCopiedUrl] = React.useState(false)
  const [domainError, setDomainError] = React.useState("")

  // Deep Store Customizer state
  const storeSchema = useStoreSchema()
  const [customizerTab, setCustomizerTab] = React.useState<"sections" | "theme">("sections")
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = React.useState(false)

  // Store media upload
  const [coverUrl, setCoverUrl] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState("")
  const coverInputRef = React.useRef<HTMLInputElement>(null)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)
  const { upload: uploadCover, uploading: coverUploading } = useUpload({
    type: "banner",
    onSuccess: (url) => {
      setCoverUrl(url)
      setStoreDetails(prev => ({ ...prev, coverUrl: url }))
      fetch("/api/account/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storefront: { hero_image: url } }) }).catch(() => {})
      toast({ title: "Cover updated", variant: "success" })
    },
    onError: (msg) => toast({ title: "Upload failed", description: msg, variant: "error" }),
  })
  const { upload: uploadAvatar, uploading: avatarUploading } = useUpload({
    type: "avatar",
    onSuccess: (url) => {
      setAvatarUrl(url)
      setStoreDetails(prev => ({ ...prev, avatarUrl: url }))
      fetch("/api/account/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: { avatar_url: url } }) }).catch(() => {})
      toast({ title: "Avatar updated", variant: "success" })
    },
    onError: (msg) => toast({ title: "Upload failed", description: msg, variant: "error" }),
  })

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/account/config")
      .then(async (res) => {
        const payload = await res.json() as AccountConfigResponse
        if (!res.ok) throw new Error("Failed to load storefront")
        return payload
      })
      .then((payload) => {
        if (cancelled) return
        const social = payload.storefront?.social_links ?? {}
        const nextDetails: StoreDetails = {
          storeName: payload.organization?.name ?? "",
          handle: payload.storefront?.handle ?? "",
          bio: payload.storefront?.bio ?? "",
          whatsapp: payload.profile?.phone ?? "",
          location: "",
          avatarUrl: payload.profile?.avatar_url ?? "",
          coverUrl: payload.storefront?.hero_image ?? "",
          socialLinks: {
            instagram: social.instagram ?? "",
            twitter: social.twitter ?? "",
            tiktok: social.tiktok ?? "",
          },
        }
        setStoreDetails(nextDetails)
        setCoverUrl(nextDetails.coverUrl)
        setAvatarUrl(nextDetails.avatarUrl)
        const persistedSettings = normalizeStoreSettings(payload.storefront?.theme ?? null, payload.storefront?.store_schema ?? null)
        setSettings({
          ...persistedSettings,
          seo: {
            ...persistedSettings.seo,
            title: !persistedSettings.seo.title || isDummyCreatorText(persistedSettings.seo.title) ? (nextDetails.storeName ? `${nextDetails.storeName} | Lummy` : "") : persistedSettings.seo.title,
            description: !persistedSettings.seo.description || isDummyCreatorText(persistedSettings.seo.description) ? nextDetails.bio : persistedSettings.seo.description,
            keywords: isDummyCreatorText(persistedSettings.seo.keywords) ? "" : persistedSettings.seo.keywords,
          },
        })
      })
      .catch((error) => toast({ title: "Storefront load failed", description: error instanceof Error ? error.message : "Failed to load storefront", variant: "error" }))
    return () => { cancelled = true }
  }, [])

  const update = (patch: Partial<StoreSettings>) => setSettings(prev => ({ ...prev, ...patch }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/account/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization: { name: storeDetails.storeName },
          profile: { phone: storeDetails.whatsapp, avatar_url: storeDetails.avatarUrl },
          storefront: {
            handle: storeDetails.handle,
            bio: storeDetails.bio,
            hero_image: storeDetails.coverUrl,
            social_links: storeDetails.socialLinks,
            theme: settings,
            store_schema: {
              ...storeSchema.schema,
              theme: {
                ...storeSchema.schema.theme,
                accent: settings.accent,
                font: settings.font,
                layout: settings.layout,
              },
            },
          },
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || "Failed to save storefront")
      await storeSchema.persist({
        ...storeSchema.schema,
        theme: {
          ...storeSchema.schema.theme,
          accent: settings.accent,
          font: settings.font,
          layout: settings.layout,
        },
      })
      setSaving(false)
      toast({ title: "Store saved!", description: "Your changes are live on the storefront.", variant: "success" })
    } catch (error) {
      setSaving(false)
      toast({ title: "Store save failed", description: error instanceof Error ? error.message : "Failed to save storefront", variant: "error" })
    }
  }

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(`https://${storeUrl}`)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
    toast({ title: "URL copied!" })
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "details",      label: "Store Info",   icon: Store },
    { key: "customizer",   label: "Customizer",   icon: Wand2 },
    { key: "appearance",   label: "Appearance",   icon: Palette },
    { key: "sections",     label: "Sections",     icon: LayoutGrid },
    { key: "announcement", label: "Announcement", icon: Megaphone },
    { key: "seo",          label: "SEO",          icon: Search },
    { key: "hours",        label: "Hours",        icon: Clock },
    { key: "domain",       label: "Domain",       icon: Globe },
  ]

  const storeUrl = storeDetails.handle ? `lummy.co/${storeDetails.handle}` : "lummy.co/"
  const previewHref = storeDetails.handle ? `/${storeDetails.handle}` : "/dashboard/store"
  const initial = (storeDetails.storeName || "Store").charAt(0).toUpperCase()
  const previewCreator: StorefrontCreator = {
    name: storeDetails.storeName || "Your store",
    handle: storeDetails.handle,
    storeName: storeDetails.storeName || "Your store",
    avatar: storeDetails.avatarUrl,
    cover: storeDetails.coverUrl,
    bio: storeDetails.bio,
    location: storeDetails.location,
    verified: Boolean(storeDetails.handle),
    whatsapp: storeDetails.whatsapp,
    socialLinks: storeDetails.socialLinks,
    stats: { totalOrders: 0, avgRating: 0, reviewCount: 0 },
    publicProducts: [],
    categories: ["All"],
    reviewSummary: { average: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold">My Store</h1>
          <p className="text-sm text-muted-foreground">Customize how your store looks and works</p>
          <PublishToggle handle={storeDetails.handle} />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2 text-xs font-bold text-white hover:bg-brand-purple/90 disabled:opacity-70 transition-all"
          >
            {saving ? (
              <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
            ) : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Store URL banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-3">
        <div className="rounded-xl bg-brand-purple/15 p-2 flex-shrink-0">
          <Store className="h-4 w-4 text-brand-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">Your store URL</p>
          <p className="text-sm font-bold font-mono truncate">{storeUrl}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={copyStoreUrl} className="flex items-center gap-1.5 text-xs font-semibold text-brand-purple hover:underline">
            {copiedUrl ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedUrl ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={() => {
              const msg = encodeURIComponent(`Hey! Check out my store on Lummy 🛍️\n\nhttps://${storeUrl}`)
              window.open(`https://wa.me/?text=${msg}`, "_blank")
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#25D366]/10 text-[#25D366] px-3 py-1.5 text-xs font-semibold hover:bg-[#25D366]/20 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide rounded-xl border border-border bg-card p-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0",
                activeTab === tab.key ? "bg-brand-purple text-white" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── Store Info ────────────────────────────────────────────────── */}
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Cover + avatar */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="relative h-36 bg-muted group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                  {coverUrl ? (
                    <Image src={coverUrl} alt="Cover" fill className="object-cover group-hover:opacity-75 transition-opacity" unoptimized />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-2 text-white text-xs font-semibold">
                      {coverUploading
                        ? <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                        : <><Camera className="h-3.5 w-3.5" /> Change Cover</>}
                    </div>
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f) }} />
                </div>
                <div className="px-5 pb-4">
                  <div className="relative -mt-8 mb-3 w-fit">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-background border border-border cursor-pointer group"
                      onClick={() => avatarInputRef.current?.click()}>
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={storeDetails.storeName || "Store avatar"} fill className="object-cover group-hover:opacity-75 transition-opacity" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-purple/10 text-lg font-bold text-brand-purple">{initial}</div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        {avatarUploading
                          ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Camera className="h-4 w-4 text-white" />}
                      </div>
                      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold">{storeDetails.storeName || "Your store"}</p>
                    {storeDetails.handle && <BadgeCheck className="h-4 w-4 text-brand-purple" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{storeUrl}</p>
                </div>
              </div>

              {/* Form */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <p className="text-sm font-bold">Store Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Store Name</label>
                    <input value={storeDetails.storeName} onChange={e => setStoreDetails(prev => ({ ...prev, storeName: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Handle</label>
                    <div className="flex items-center rounded-xl border border-border bg-background overflow-hidden">
                      <span className="px-3 text-xs text-muted-foreground border-r border-border py-2.5 bg-muted/40 flex-shrink-0">lummy.co/</span>
                      <input value={storeDetails.handle} onChange={e => setStoreDetails(prev => ({ ...prev, handle: e.target.value }))} className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold">Bio / Description</label>
                    <textarea value={storeDetails.bio} onChange={e => setStoreDetails(prev => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">WhatsApp</label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                      <MessageCircle className="h-3.5 w-3.5 text-[#25D366] flex-shrink-0" />
                      <input value={storeDetails.whatsapp} onChange={e => setStoreDetails(prev => ({ ...prev, whatsapp: e.target.value }))} className="flex-1 text-sm bg-transparent outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Location</label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <input value={storeDetails.location} onChange={e => setStoreDetails(prev => ({ ...prev, location: e.target.value }))} className="flex-1 text-sm bg-transparent outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <p className="text-sm font-bold">Social Links</p>
                {[
                  { key: "instagram" as const, label: "Instagram", icon: Instagram, color: "text-pink-400" },
                  { key: "twitter" as const, label: "Twitter / X", icon: Twitter, color: "text-sky-400" },
                  { key: "tiktok" as const, label: "TikTok", icon: Link2, color: "text-red-400" },
                ].map(({ key, label, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-muted flex-shrink-0", color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <input
                      value={storeDetails.socialLinks[key]}
                      onChange={e => setStoreDetails(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: e.target.value } }))}
                      placeholder={`@your${label.toLowerCase()}handle`}
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Display preferences */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <p className="text-sm font-bold">Display Preferences</p>
                {[
                  { key: "showReviews" as const, label: "Show reviews on storefront", sub: "Customers can see product ratings" },
                  { key: "showStock" as const, label: "Show stock levels", sub: "Display \"Only X left\" for low stock" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                    </div>
                    <Toggle
                      checked={settings[item.key]}
                      onChange={v => update({ [item.key]: v })}
                    />
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Revenue", value: "₦2.85M", icon: ShoppingBag, color: "text-brand-green" },
                  { label: "Orders", value: "1,234", icon: Package, color: "text-brand-purple" },
                  { label: "Views", value: "18,429", icon: Eye, color: "text-brand-coral" },
                  { label: "Rating", value: "0★", icon: Star, color: "text-amber-500" },
                ].map(s => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                      <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Customizer ──────────────────────────────────────────────── */}
          {activeTab === "customizer" && (
            <div className="space-y-3">
              {/* Header bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
                  {(["sections", "theme"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setCustomizerTab(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                        customizerTab === t ? "bg-brand-purple text-white" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t === "sections" ? "Sections" : "Theme"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={storeSchema.reset}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={storeSchema.save}
                    className="rounded-xl bg-brand-purple px-4 py-2 text-xs font-bold text-white hover:bg-brand-purple/90 transition-colors"
                  >
                    Save &amp; Publish
                  </button>
                </div>
              </div>

              {/* Split pane */}
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[600px]">
                {/* Left: editor */}
                <div className="rounded-2xl border border-border bg-card p-4 overflow-y-auto max-h-[80vh] lg:max-h-none">
                  {customizerTab === "theme" ? (
                    <ThemeEditorPanel
                      theme={storeSchema.schema.theme}
                      onUpdateTheme={storeSchema.updateTheme}
                      onApplyPreset={storeSchema.applyPreset}
                    />
                  ) : (
                    <div className="space-y-4">
                      <SectionListEditor
                        sections={storeSchema.sortedSections}
                        selectedId={selectedSectionId}
                        onSelect={setSelectedSectionId}
                        onToggle={storeSchema.toggleSection}
                        onRemove={storeSchema.removeSection}
                        onReorder={storeSchema.reorderSections}
                        onAdd={() => setShowAddDialog(true)}
                      />
                      {selectedSectionId && (() => {
                        const sec = storeSchema.schema.sections.find(s => s.id === selectedSectionId)
                        if (!sec) return null
                        return (
                          <div className="mt-4 pt-4 border-t border-border">
                            <SectionSettingsEditor
                              section={sec}
                              onUpdate={patch => storeSchema.updateSection(selectedSectionId, patch)}
                            />
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>

                {/* Right: live preview */}
                <div className="rounded-2xl border border-border bg-muted/30 p-3 min-h-[500px]">
                  <StorefrontPreview schema={storeSchema.schema} creator={previewCreator} />
                </div>
              </div>

              <SectionAddDialog
                open={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onAdd={type => { storeSchema.addSection(type); setShowAddDialog(false) }}
              />
            </div>
          )}

          {/* ── Appearance ───────────────────────────────────────────────── */}
          {activeTab === "appearance" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
                <SectionHeader icon={Palette} title="Accent Colour" subtitle="Used for buttons, links, and highlights" />
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => update({ accent: c.value })}
                      title={c.name}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div
                        className="w-9 h-9 rounded-xl transition-all"
                        style={{
                          backgroundColor: c.value,
                          outline: settings.accent === c.value ? `3px solid ${c.value}` : "3px solid transparent",
                          outlineOffset: "3px",
                        }}
                      />
                      <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <SectionHeader icon={Settings} title="Font" subtitle="Typography style for your storefront" />
                <div className="grid grid-cols-2 gap-2">
                  {FONTS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => update({ font: f.value })}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        settings.font === f.value ? "border-brand-purple/40 bg-brand-purple/5" : "border-border hover:border-foreground/20"
                      )}
                    >
                      <p className={cn("text-sm font-bold", settings.font === f.value && "text-brand-purple")}>{f.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <SectionHeader icon={LayoutGrid} title="Product Grid Layout" subtitle="How products are displayed in your store" />
                <div className="grid grid-cols-3 gap-2">
                  {LAYOUTS.map(l => {
                    const Icon = l.icon
                    return (
                      <button
                        key={l.value}
                        onClick={() => update({ layout: l.value })}
                        className={cn(
                          "rounded-xl border p-4 flex flex-col items-center gap-2 text-center transition-all",
                          settings.layout === l.value ? "border-brand-purple/40 bg-brand-purple/5" : "border-border hover:border-foreground/20"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", settings.layout === l.value ? "text-brand-purple" : "text-muted-foreground")} />
                        <span className={cn("text-xs font-semibold", settings.layout === l.value ? "text-brand-purple" : "text-muted-foreground")}>{l.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Preview swatch */}
              <div className="rounded-2xl border border-dashed border-brand-purple/20 bg-brand-purple/3 p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow"
                  style={{ backgroundColor: settings.accent }}
                >
                  S
                </div>
                <div>
                  <p className="text-sm font-semibold">Live preview</p>
                  <p className="text-[11px] text-muted-foreground">Accent: <span className="font-mono">{settings.accent}</span> · Font: {settings.font} · Layout: {settings.layout}</p>
                </div>
                <a href={previewHref} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-xs text-brand-purple hover:underline flex-shrink-0">
                  <ExternalLink className="h-3 w-3" /> Preview store
                </a>
              </div>
            </div>
          )}

          {/* ── Sections ─────────────────────────────────────────────────── */}
          {activeTab === "sections" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <SectionHeader
                  icon={LayoutGrid}
                  title="Store Sections"
                  subtitle="Drag to reorder. Toggle visibility per section."
                />
                <Reorder.Group
                  axis="y"
                  values={settings.sections}
                  onReorder={(sections) => update({ sections })}
                  className="space-y-2"
                >
                  {settings.sections.map(section => {
                    const Icon = section.icon
                    return (
                      <Reorder.Item
                        key={section.id}
                        value={section}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 bg-background cursor-grab active:cursor-grabbing transition-all",
                          section.visible ? "border-border" : "border-border/50 opacity-50"
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className={cn("rounded-lg p-1.5 flex-shrink-0", section.visible ? "bg-brand-purple/10" : "bg-muted")}>
                          <Icon className={cn("h-3.5 w-3.5", section.visible ? "text-brand-purple" : "text-muted-foreground")} />
                        </div>
                        <span className="flex-1 text-sm font-medium">{section.label}</span>
                        <button
                          onClick={() => update({
                            sections: settings.sections.map(s =>
                              s.id === section.id ? { ...s, visible: !s.visible } : s
                            )
                          })}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                        >
                          {section.visible
                            ? <Eye className="h-4 w-4 text-brand-purple" />
                            : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </Reorder.Item>
                    )
                  })}
                </Reorder.Group>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 flex gap-3 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 text-brand-purple flex-shrink-0 mt-0.5" />
                <p>Sections are displayed on your storefront in the order shown above. Hiding a section doesn&apos;t delete its content — you can re-enable it anytime.</p>
              </div>
            </div>
          )}

          {/* ── Announcement ─────────────────────────────────────────────── */}
          {activeTab === "announcement" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader icon={Megaphone} title="Announcement Banner" subtitle="Sticky bar shown at the top of your store" />
                  <Toggle
                    checked={settings.announcement.enabled}
                    onChange={v => update({ announcement: { ...settings.announcement, enabled: v } })}
                  />
                </div>

                <AnimatePresence>
                  {settings.announcement.enabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-1">
                        {/* Preview */}
                        <div className={cn(
                          "rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2",
                          settings.announcement.style === "purple" ? "bg-brand-purple text-white" :
                          settings.announcement.style === "coral" ? "bg-brand-coral text-white" :
                          settings.announcement.style === "green" ? "bg-brand-green text-white" :
                          "bg-amber-500 text-white"
                        )}>
                          <span className="flex-1">{settings.announcement.text || "Your announcement text…"}</span>
                          {settings.announcement.ctaLabel && (
                            <span className="bg-white/20 rounded-lg px-2 py-1 text-[10px] font-bold flex-shrink-0">{settings.announcement.ctaLabel}</span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Message</label>
                            <input
                              value={settings.announcement.text}
                              onChange={e => update({ announcement: { ...settings.announcement, text: e.target.value } })}
                              placeholder="🎉 Free delivery on orders above ₦15,000!"
                              maxLength={100}
                              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold">CTA label</label>
                              <input
                                value={settings.announcement.ctaLabel}
                                onChange={e => update({ announcement: { ...settings.announcement, ctaLabel: e.target.value } })}
                                placeholder="Shop now"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold">CTA URL</label>
                              <input
                                value={settings.announcement.ctaUrl}
                                onChange={e => update({ announcement: { ...settings.announcement, ctaUrl: e.target.value } })}
                                placeholder="/products"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Colour</label>
                            <div className="flex gap-2">
                              {(["purple", "coral", "green", "amber"] as const).map(style => (
                                <button
                                  key={style}
                                  onClick={() => update({ announcement: { ...settings.announcement, style } })}
                                  className={cn(
                                    "flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition-all",
                                    style === "purple" ? "bg-brand-purple" : style === "coral" ? "bg-brand-coral" : style === "green" ? "bg-brand-green" : "bg-amber-500",
                                    "text-white",
                                    settings.announcement.style === style ? "ring-2 ring-offset-2 ring-foreground/20" : "opacity-60 hover:opacity-80"
                                  )}
                                >
                                  {style}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ── SEO ──────────────────────────────────────────────────────── */}
          {activeTab === "seo" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <SectionHeader icon={Search} title="Search Engine Optimisation" subtitle="Help customers find your store via Google" />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Page Title</label>
                    <input
                      value={settings.seo.title}
                      onChange={e => update({ seo: { ...settings.seo, title: e.target.value } })}
                      maxLength={70}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{settings.seo.title.length}/70</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Meta Description</label>
                    <textarea
                      value={settings.seo.description}
                      onChange={e => update({ seo: { ...settings.seo, description: e.target.value } })}
                      rows={3}
                      maxLength={160}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{settings.seo.description.length}/160</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Keywords</label>
                    <input
                      value={settings.seo.keywords}
                      onChange={e => update({ seo: { ...settings.seo, keywords: e.target.value } })}
                      placeholder="comma separated keywords"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-purple/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Google preview */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Google preview</p>
                <div className="rounded-xl border border-border bg-white/2 p-4 space-y-1.5">
                  <p className="text-xs text-muted-foreground">{storeUrl}</p>
                  <p className="text-[15px] font-semibold text-brand-indigo leading-snug">{settings.seo.title || "Your Store Title"}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{settings.seo.description || "Your store description will appear here…"}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Hours ────────────────────────────────────────────────────── */}
          {activeTab === "hours" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader icon={Clock} title="Store Hours" subtitle="Show customers when you're available to take orders" />
                  <Toggle
                    checked={settings.hours.enabled}
                    onChange={v => update({ hours: { ...settings.hours, enabled: v } })}
                  />
                </div>

                <AnimatePresence>
                  {settings.hours.enabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-1">
                        {settings.hours.schedule.map((entry, i) => (
                          <div key={entry.day} className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 transition-all",
                            entry.closed ? "border-border/50 bg-muted/20 opacity-60" : "border-border bg-background"
                          )}>
                            <div className="w-8 text-xs font-semibold text-muted-foreground flex-shrink-0">{entry.day}</div>
                            {!entry.closed ? (
                              <>
                                <input
                                  type="time"
                                  value={entry.open}
                                  onChange={e => {
                                    const schedule = [...settings.hours.schedule]
                                    schedule[i] = { ...schedule[i], open: e.target.value }
                                    update({ hours: { ...settings.hours, schedule } })
                                  }}
                                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand-purple/50 transition-colors"
                                />
                                <span className="text-xs text-muted-foreground">to</span>
                                <input
                                  type="time"
                                  value={entry.close}
                                  onChange={e => {
                                    const schedule = [...settings.hours.schedule]
                                    schedule[i] = { ...schedule[i], close: e.target.value }
                                    update({ hours: { ...settings.hours, schedule } })
                                  }}
                                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand-purple/50 transition-colors"
                                />
                              </>
                            ) : (
                              <span className="flex-1 text-xs text-muted-foreground">Closed</span>
                            )}
                            <button
                              onClick={() => {
                                const schedule = [...settings.hours.schedule]
                                schedule[i] = { ...schedule[i], closed: !schedule[i].closed }
                                update({ hours: { ...settings.hours, schedule } })
                              }}
                              className="ml-auto text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {entry.closed ? "Open" : "Close"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {settings.hours.enabled && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p>Store hours are displayed as a banner on your storefront. Orders can still be placed outside these hours — this is informational only.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Domain ───────────────────────────────────────────────────── */}
          {activeTab === "domain" && (
            <div className="space-y-4">
              {/* Free subdomain */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <SectionHeader icon={Globe} title="Your Lummy Domain" />
                <div className="flex items-center gap-2 rounded-xl bg-brand-purple/5 border border-brand-purple/15 px-4 py-3">
                  <Globe className="h-4 w-4 text-brand-purple flex-shrink-0" />
                  <span className="flex-1 text-sm font-mono font-semibold">{storeUrl}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/20">Active</span>
                </div>
              </div>

              {/* Custom domain */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <SectionHeader
                  icon={Link2}
                  title="Custom Domain"
                  subtitle="Connect your own domain (e.g. shop.sadesfashion.com)"
                >
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">Pro feature</span>
                </SectionHeader>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <input
                        value={settings.customDomain}
                        onChange={e => { setSettings(prev => ({ ...prev, customDomain: e.target.value })); setDomainError("") }}
                        placeholder="shop.yourdomain.com"
                        className="flex-1 text-sm bg-transparent outline-none"
                      />
                      {settings.customDomain && (
                        <button onClick={() => update({ customDomain: "" })} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (!settings.customDomain.includes(".")) {
                          setDomainError("Enter a valid domain like shop.yourdomain.com")
                          return
                        }
                        toast({ title: "Domain verification started", description: "Add the CNAME record below to your DNS provider." })
                      }}
                      className="rounded-xl bg-brand-purple px-4 py-2 text-xs font-semibold text-white hover:bg-brand-purple/90 transition-colors flex-shrink-0"
                    >
                      Connect
                    </button>
                  </div>
                  {domainError && (
                    <p className="text-xs text-brand-coral flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> {domainError}
                    </p>
                  )}
                </div>

                {/* DNS instructions */}
                <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-3">
                  <p className="text-xs font-semibold">DNS Configuration</p>
                  <p className="text-[11px] text-muted-foreground">Add this CNAME record to your domain provider (Namecheap, GoDaddy, etc.):</p>
                  <div className="rounded-lg bg-background border border-border overflow-hidden">
                    <div className="grid grid-cols-[80px_1fr_1fr] gap-px bg-border text-[10px]">
                      {[["Type", "Host", "Value"], ["CNAME", "@", "stores.lummy.co"]].map((row, ri) => (
                        <React.Fragment key={ri}>
                          {row.map((cell, ci) => (
                            <div key={ci} className={cn("px-3 py-2 bg-background", ri === 0 && "bg-muted/60 font-semibold text-muted-foreground")}>
                              {cell}
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">DNS propagation can take up to 48 hours.</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sticky save hint */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-xs text-muted-foreground">Changes sync to your account when you click <strong>Save Changes</strong>.</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2 text-xs font-bold text-white hover:bg-brand-purple/90 disabled:opacity-70 transition-all"
        >
          {saving ? <><span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
