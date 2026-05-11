"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Store,
  Camera,
  Share2,
  ExternalLink,
  Copy,
  CheckCheck,
  MessageCircle,
  Instagram,
  Twitter,
  MapPin,
  Link2,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { mockCreatorProfile } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"

const THEME_KEY = "lummy_store_theme"

const ACCENT_COLORS = [
  { name: "Purple",  value: "#6C4EF3", label: "Lummy Purple" },
  { name: "Green",   value: "#10B981", label: "Emerald"      },
  { name: "Coral",   value: "#F97316", label: "Coral"        },
  { name: "Rose",    value: "#F43F5E", label: "Rose"         },
  { name: "Sky",     value: "#0EA5E9", label: "Sky Blue"     },
  { name: "Amber",   value: "#F59E0B", label: "Amber"        },
  { name: "Indigo",  value: "#4F46E5", label: "Indigo"       },
  { name: "Fuchsia", value: "#D946EF", label: "Fuchsia"      },
]

const LAYOUTS = [
  { value: "grid-2", label: "2 columns", desc: "Larger cards" },
  { value: "grid-3", label: "3 columns", desc: "Default" },
  { value: "list",   label: "List view",  desc: "Compact rows" },
] as const

type LayoutValue = typeof LAYOUTS[number]["value"]

interface StoreTheme { accent: string; layout: LayoutValue }

function loadTheme(): StoreTheme {
  if (typeof window === "undefined") return { accent: "#6C4EF3", layout: "grid-3" }
  try { const v = localStorage.getItem(THEME_KEY); return v ? JSON.parse(v) : { accent: "#6C4EF3", layout: "grid-3" } } catch { return { accent: "#6C4EF3", layout: "grid-3" } }
}

function ThemeCustomizer() {
  const [theme, setTheme] = React.useState<StoreTheme>(loadTheme)
  const [saved, setSaved] = React.useState(false)

  const save = () => {
    try { localStorage.setItem(THEME_KEY, JSON.stringify(theme)) } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    toast({ title: "Store theme saved", description: "Your store appearance has been updated.", variant: "success" })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-base">Store Theme</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Personalise your store accent colour and layout</p>
        </div>
        <Button size="sm" onClick={save} className="h-8 text-xs gap-1.5">
          {saved ? <><CheckCheck className="h-3.5 w-3.5" />Saved!</> : "Apply theme"}
        </Button>
      </div>
      <Separator />

      {/* Accent colour picker */}
      <div>
        <p className="text-xs font-semibold mb-3">Accent colour</p>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_COLORS.map((c) => (
            <button key={c.value} onClick={() => setTheme((t) => ({ ...t, accent: c.value }))}
              title={c.label}
              className="group relative flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-xl ring-2 transition-all"
                style={{
                  backgroundColor: c.value,
                  outline: theme.accent === c.value ? `3px solid ${c.value}` : "3px solid transparent",
                  outlineOffset: "2px",
                }}
              />
              <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout picker */}
      <div>
        <p className="text-xs font-semibold mb-3">Product grid layout</p>
        <div className="grid grid-cols-3 gap-2">
          {LAYOUTS.map((l) => (
            <button key={l.value} onClick={() => setTheme((t) => ({ ...t, layout: l.value }))}
              className={cn(
                "p-3 rounded-xl border text-left transition-all",
                theme.layout === l.value ? "border-brand-purple bg-brand-purple/5" : "border-border hover:border-foreground/20"
              )}>
              <p className={cn("text-xs font-semibold", theme.layout === l.value ? "text-brand-purple" : "text-foreground")}>{l.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{l.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview swatch */}
      <div className="rounded-xl border border-border p-3 flex items-center gap-3 bg-muted/30">
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: theme.accent }}>S</div>
        <div className="flex-1">
          <p className="text-xs font-semibold">Preview: Sade&apos;s Boutique</p>
          <p className="text-[10px] text-muted-foreground">Accent <span className="font-mono">{theme.accent}</span> · Layout: {theme.layout}</p>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

export default function StorePage() {
  const [isSaving, setIsSaving] = React.useState(false)
  const p = mockCreatorProfile

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1200)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">My Store</h1>
          <p className="text-sm text-muted-foreground">Customize how your store looks to customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Store URL card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex-shrink-0">
          <Store className="h-5 w-5 text-brand-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Your store URL</p>
          <p className="text-xs text-muted-foreground font-mono">{p.storeUrl}</p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={`https://${p.storeUrl}`} />
          <Button size="sm" variant="outline" className="gap-1.5 h-8">
            <Share2 className="h-3 w-3" />
            Share
          </Button>
        </div>
      </motion.div>

      {/* Cover image */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="relative h-40 overflow-hidden bg-muted group cursor-pointer">
          <Image src={p.cover} alt="Cover" fill className="object-cover group-hover:opacity-75 transition-opacity" unoptimized />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-2 text-white text-sm font-semibold">
              <Camera className="h-4 w-4" />
              Change Cover
            </div>
          </div>
        </div>

        {/* Avatar + basic info */}
        <div className="px-5 pb-5">
          <div className="relative -mt-10 mb-4 w-fit">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-background border border-border bg-muted cursor-pointer group">
              <Image src={p.avatar} alt={p.name} fill className="object-cover group-hover:opacity-75 transition-opacity" unoptimized />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="font-display text-xl font-bold">{p.storeName}</p>
            {p.verified && <BadgeCheck className="h-5 w-5 text-brand-purple" />}
            <Badge variant="brand" size="sm" className="ml-1">Verified</Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {p.location}
          </p>
        </div>
      </div>

      {/* Form fields */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <h3 className="font-display font-bold text-base">Store Details</h3>
        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Store Name</Label>
            <Input defaultValue={p.storeName} />
          </div>
          <div className="space-y-1.5">
            <Label>Store Handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                lummy.co/
              </span>
              <Input defaultValue={p.handle} className="pl-[76px]" />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Bio / Store Description</Label>
            <textarea
              defaultValue={p.bio}
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp Number</Label>
            <Input
              defaultValue={p.whatsapp}
              type="tel"
              icon={<MessageCircle className="h-4 w-4 text-[#25D366]" />}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input
              defaultValue={p.location}
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* Social links */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <h3 className="font-display font-bold text-base">Social Links</h3>
        <Separator />
        <div className="space-y-3">
          {[
            { label: "Instagram", icon: Instagram, color: "text-pink-400", value: p.socialLinks.instagram, placeholder: "@yourhandle" },
            { label: "Twitter / X", icon: Twitter, color: "text-sky-400", value: p.socialLinks.twitter, placeholder: "@yourhandle" },
            { label: "TikTok", icon: Link2, color: "text-red-400", value: p.socialLinks.tiktok, placeholder: "@yourhandle" },
          ].map(({ label, icon: Icon, color, value, placeholder }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-muted flex-shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <Input defaultValue={value} placeholder={placeholder} className="h-9" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Theme customizer */}
      <ThemeCustomizer />

      {/* Store stats summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-base mb-4">Store Performance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: "₦2.85M", color: "text-brand-green" },
            { label: "Total Orders", value: "1,234", color: "text-brand-purple" },
            { label: "Store Views", value: "18,429", color: "text-brand-coral" },
            { label: "Avg Rating", value: `${p.stats.avgRating} ★`, color: "text-amber-500" },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50">
              <p className={`font-display text-xl font-extrabold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
