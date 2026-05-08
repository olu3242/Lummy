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
import { mockCreatorProfile } from "@/data/mock/dashboard"

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
