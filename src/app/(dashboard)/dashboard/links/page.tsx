"use client"

import * as React from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import {
  Link2, Plus, ExternalLink, Copy, CheckCheck, GripVertical,
  Instagram, Twitter, Music2, MessageCircle, Youtube, Globe,
  ToggleLeft, ToggleRight, Trash2, Edit3, Save, X, Eye,
  ShoppingBag, Zap, BadgeCheck, Share2, QrCode, Clock,
  ChevronDown, ChevronUp, BarChart2, TrendingUp, MousePointer2,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type LinkType = "social" | "custom" | "product" | "store"

interface LinkItem {
  id: string
  type: LinkType
  label: string
  url: string
  icon: string
  enabled: boolean
  clicks: number
  views: number
  /** ISO datetime to auto-enable (optional) */
  scheduleAt?: string
  /** 7-day daily clicks, oldest → newest */
  dailyClicks?: number[]
}

const ICON_MAP: Record<string, React.ElementType> = {
  whatsapp:  MessageCircle,
  instagram: Instagram,
  twitter:   Twitter,
  tiktok:    Music2,
  youtube:   Youtube,
  globe:     Globe,
  store:     ShoppingBag,
  zap:       Zap,
  link:      Link2,
}

const ICON_COLOR: Record<string, string> = {
  whatsapp:  "text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20",
  instagram: "text-pink-500 bg-pink-500/10 border-pink-500/20",
  twitter:   "text-sky-500 bg-sky-500/10 border-sky-500/20",
  tiktok:    "text-foreground bg-muted border-border",
  youtube:   "text-red-500 bg-red-500/10 border-red-500/20",
  globe:     "text-brand-purple bg-brand-purple/10 border-brand-purple/20",
  store:     "text-brand-green bg-brand-green/10 border-brand-green/20",
  zap:       "text-brand-purple bg-brand-purple/10 border-brand-purple/20",
  link:      "text-muted-foreground bg-muted border-border",
}

const QUICK_SOCIALS = [
  { id: "instagram", label: "Instagram",  icon: "instagram", placeholder: "@yourhandle" },
  { id: "twitter",   label: "Twitter / X",icon: "twitter",   placeholder: "@yourhandle" },
  { id: "tiktok",    label: "TikTok",     icon: "tiktok",    placeholder: "@yourhandle" },
  { id: "youtube",   label: "YouTube",    icon: "youtube",   placeholder: "Channel URL" },
]

const LINKS_KEY = "lummy_bio_links"

const DEFAULT_LINKS: LinkItem[] = [
  { id: "L1", type: "store",  label: "Shop My Store 🛍",    url: "https://lummy.co/sade.styles",           icon: "store",     enabled: true,  clicks: 1243, views: 4890, dailyClicks: [145, 162, 178, 190, 201, 188, 179] },
  { id: "L2", type: "social", label: "Chat on WhatsApp",    url: "https://wa.me/2348012345678",            icon: "whatsapp",  enabled: true,  clicks: 892,  views: 3210, dailyClicks: [112, 124, 131, 128, 138, 129, 130] },
  { id: "L3", type: "social", label: "Follow on Instagram", url: "https://instagram.com/sade.styles",      icon: "instagram", enabled: true,  clicks: 567,  views: 2850, dailyClicks: [72, 81, 84, 87, 93, 80, 70]  },
  { id: "L4", type: "social", label: "Follow on TikTok",   url: "https://tiktok.com/@sade.styles",        icon: "tiktok",    enabled: true,  clicks: 341,  views: 1920, dailyClicks: [42, 50, 55, 48, 52, 47, 47]  },
  { id: "L5", type: "custom", label: "New Collection Drop", url: "https://lummy.co/sade.styles?filter=new",icon: "zap",       enabled: true,  clicks: 228,  views: 1100, dailyClicks: [28, 34, 39, 33, 36, 30, 28]  },
  { id: "L6", type: "social", label: "Twitter / X",        url: "https://twitter.com/sade_styles",        icon: "twitter",   enabled: false, clicks: 89,   views: 720,  dailyClicks: [10, 14, 12, 13, 15, 12, 13]  },
]

function loadLinks(): LinkItem[] {
  if (typeof window === "undefined") return DEFAULT_LINKS
  try { const v = localStorage.getItem(LINKS_KEY); return v ? JSON.parse(v) : DEFAULT_LINKS } catch { return DEFAULT_LINKS }
}

function saveLinks(links: LinkItem[]) {
  try { localStorage.setItem(LINKS_KEY, JSON.stringify(links)) } catch {}
}

/** Mini 7-bar SVG sparkline for a link's daily clicks */
function ClickSparkBars({ data, color = "#6C4EF3" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  const W = 84, H = 28, gap = 2
  const barW = (W - gap * (data.length - 1)) / data.length

  return (
    <svg width={W} height={H} className="flex-shrink-0">
      {data.map((v, i) => {
        const barH = Math.max(2, (v / max) * (H - 4))
        const x = i * (barW + gap)
        const y = H - barH
        return (
          <rect key={i} x={x} y={y} width={barW} height={barH}
            rx="2" fill={color} opacity={i === data.length - 1 ? 1 : 0.45} />
        )
      })}
    </svg>
  )
}

/** Small QR-like SVG placeholder */
function QRPlaceholder({ size = 80 }: { size?: number }) {
  const cells = 7
  const cell = size / cells
  // deterministic "QR-like" pattern
  const pattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,0,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ]
  return (
    <svg width={size} height={size}>
      {pattern.map((row, r) =>
        row.map((on, c) => on
          ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell - 1} height={cell - 1} rx="1" fill="currentColor" />
          : null
        )
      )}
    </svg>
  )
}

function PhonePreview({ links, handle }: { links: LinkItem[]; handle: string }) {
  const activeLinks = links.filter(l => l.enabled)
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[180px] bg-brand-midnight rounded-[32px] border-4 border-foreground/20 overflow-hidden shadow-2xl"
        style={{ height: 360 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/20 rounded-b-xl z-10" />
        <div className="h-full overflow-y-auto scrollbar-hide bg-gradient-to-b from-brand-purple/10 via-background to-background pt-8 px-2.5 pb-4 space-y-2">
          <div className="text-center py-2">
            <div className="w-10 h-10 rounded-full bg-brand-purple mx-auto mb-1.5 flex items-center justify-center text-white font-bold text-sm">S</div>
            <p className="text-[9px] font-bold truncate">Sade&apos;s Boutique</p>
            <div className="flex items-center justify-center gap-0.5">
              <p className="text-[8px] text-muted-foreground">@{handle}</p>
              <BadgeCheck className="h-2.5 w-2.5 text-brand-purple" />
            </div>
          </div>
          {activeLinks.map(link => {
            const Icon = ICON_MAP[link.icon] ?? Link2
            const colorCls = ICON_COLOR[link.icon] ?? ICON_COLOR.link
            return (
              <div key={link.id}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
                <div className={cn("w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border", colorCls)}>
                  <Icon className="h-2.5 w-2.5" />
                </div>
                <p className="text-[8px] font-semibold truncate flex-1">{link.label}</p>
              </div>
            )
          })}
          {activeLinks.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-[9px] text-muted-foreground">No active links</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">Live preview</p>
    </div>
  )
}

interface UTMParams { source: string; medium: string; campaign: string }

function AddLinkModal({ onClose, onAdd }: { onClose: () => void; onAdd: (link: LinkItem) => void }) {
  const [label, setLabel] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [icon, setIcon] = React.useState("link")
  const [utmOpen, setUtmOpen] = React.useState(false)
  const [utm, setUtm] = React.useState<UTMParams>({ source: "linkinbio", medium: "social", campaign: "" })
  const [scheduleEnabled, setScheduleEnabled] = React.useState(false)
  const [scheduleAt, setScheduleAt] = React.useState("")

  const iconOptions = Object.entries(ICON_MAP).map(([key]) => ({
    key,
    Icon: ICON_MAP[key],
    colorCls: ICON_COLOR[key] ?? ICON_COLOR.link,
  }))

  const buildUrl = () => {
    const base = url.startsWith("http") ? url.trim() : `https://${url.trim()}`
    if (!utmOpen || (!utm.source && !utm.medium && !utm.campaign)) return base
    const p = new URLSearchParams()
    if (utm.source)   p.set("utm_source",   utm.source)
    if (utm.medium)   p.set("utm_medium",   utm.medium)
    if (utm.campaign) p.set("utm_campaign", utm.campaign)
    return `${base}?${p.toString()}`
  }

  const handleAdd = () => {
    if (!label.trim() || !url.trim()) { toast({ title: "Fill in label and URL" }); return }
    onAdd({
      id: `L${Date.now()}`,
      type: "custom",
      label: label.trim(),
      url: buildUrl(),
      icon,
      enabled: true,
      clicks: 0,
      views: 0,
      dailyClicks: [0, 0, 0, 0, 0, 0, 0],
      ...(scheduleEnabled && scheduleAt ? { scheduleAt } : {}),
    })
    onClose()
    toast({ title: "Link added!", variant: "success" })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-sm">Add Custom Link</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Label <span className="text-brand-coral">*</span></label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. New Collection Drop"
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">URL <span className="text-brand-coral">*</span></label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com"
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map(({ key, Icon, colorCls }) => (
                <button key={key} onClick={() => setIcon(key)}
                  className={cn("w-9 h-9 rounded-xl border flex items-center justify-center transition-all",
                    icon === key ? colorCls : "border-border bg-muted hover:border-foreground/20")}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* UTM Builder */}
          <div className="rounded-xl border border-border overflow-hidden">
            <button onClick={() => setUtmOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-xs font-semibold">
              <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-brand-purple" /> UTM Tracking</span>
              {utmOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {utmOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="overflow-hidden">
                  <div className="p-3 space-y-2 border-t border-border">
                    {(["source", "medium", "campaign"] as const).map(k => (
                      <div key={k} className="space-y-0.5">
                        <label className="text-[10px] font-semibold capitalize text-muted-foreground">utm_{k}</label>
                        <input value={utm[k]} onChange={e => setUtm(p => ({ ...p, [k]: e.target.value }))}
                          placeholder={k === "source" ? "linkinbio" : k === "medium" ? "social" : "may-promo"}
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                      </div>
                    ))}
                    {url && (
                      <p className="text-[9px] text-muted-foreground break-all pt-1">{buildUrl()}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Scheduling */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-brand-purple" /> Schedule link
              </span>
              <button onClick={() => setScheduleEnabled(s => !s)}
                className="p-0.5">
                {scheduleEnabled
                  ? <ToggleRight className="h-5 w-5 text-brand-green" />
                  : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
              </button>
            </div>
            <AnimatePresence>
              {scheduleEnabled && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="overflow-hidden">
                  <div className="p-3 border-t border-border">
                    <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Enable at</label>
                    <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                    <p className="text-[9px] text-muted-foreground mt-1">Link will auto-enable at this time</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button onClick={handleAdd} className="w-full gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Link
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ScheduleModal({ link, onSave, onClose }: {
  link: LinkItem
  onSave: (scheduleAt: string | undefined) => void
  onClose: () => void
}) {
  const [scheduleAt, setScheduleAt] = React.useState(link.scheduleAt ?? "")

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xs rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-purple" /> Schedule Link
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">Set a date and time to auto-enable <span className="font-semibold text-foreground">{link.label}</span>.</p>
          <div>
            <label className="text-xs font-semibold block mb-1.5">Enable at</label>
            <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-xs" onClick={() => { onSave(undefined); onClose() }}>Clear</Button>
            <Button className="flex-1 text-xs" onClick={() => { onSave(scheduleAt || undefined); onClose(); toast({ title: "Schedule saved!", variant: "success" }) }}>Save</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Expandable analytics panel shown below a link row */
function LinkAnalyticsPanel({ link }: { link: LinkItem }) {
  const data = link.dailyClicks ?? [0, 0, 0, 0, 0, 0, 0]
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const max = Math.max(...data, 1)
  const ctr = link.views > 0 ? ((link.clicks / link.views) * 100).toFixed(1) : "0.0"

  const colorMap: Record<string, string> = {
    whatsapp:  "#25D366", instagram: "#E1306C", twitter: "#1DA1F2",
    tiktok:    "#888",    youtube:   "#FF0000", globe:   "#6C4EF3",
    store:     "#10B981", zap:       "#6C4EF3", link:    "#888",
  }
  const barColor = colorMap[link.icon] ?? "#6C4EF3"

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
      className="border-t border-border bg-muted/20 px-4 py-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">7-day performance</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MousePointer2 className="h-3 w-3 text-brand-purple" />
            {link.clicks.toLocaleString()} clicks
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-brand-green" />
            {link.views.toLocaleString()} views
          </span>
          <span className="flex items-center gap-1 font-semibold text-foreground">
            CTR {ctr}%
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-12">
        {data.map((v, i) => {
          const h = Math.max(4, (v / max) * 40)
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <div className="w-full rounded-t-sm transition-all"
                style={{ height: h, backgroundColor: barColor, opacity: i === data.length - 1 ? 1 : 0.5 }} />
              <span className="text-[8px] text-muted-foreground">{days[i]}</span>
            </div>
          )
        })}
      </div>

      {/* Peak day */}
      {(() => {
        const peak = data.indexOf(Math.max(...data))
        return (
          <p className="text-[9px] text-muted-foreground mt-2">
            Peak: <span className="font-semibold text-foreground">{days[peak]}</span> ({data[peak]} clicks)
          </p>
        )
      })()}
    </motion.div>
  )
}

export default function LinksPage() {
  const [links, setLinks] = React.useState<LinkItem[]>(loadLinks)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editLabel, setEditLabel] = React.useState("")
  const [editUrl, setEditUrl] = React.useState("")
  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [scheduleLink, setScheduleLink] = React.useState<LinkItem | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [qrOpen, setQrOpen] = React.useState(false)

  const handle = "sade.styles"
  const bioUrl = `https://lummy.co/${handle}/links`

  React.useEffect(() => { saveLinks(links) }, [links])

  const toggleLink = (id: string) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l))
  }

  const deleteLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id))
    toast({ title: "Link removed", variant: "success" })
  }

  const duplicateLink = (link: LinkItem) => {
    const dup: LinkItem = {
      ...link,
      id: `L${Date.now()}`,
      label: `${link.label} (copy)`,
      clicks: 0,
      views: 0,
      dailyClicks: [0, 0, 0, 0, 0, 0, 0],
    }
    setLinks(prev => {
      const idx = prev.findIndex(l => l.id === link.id)
      const next = [...prev]
      next.splice(idx + 1, 0, dup)
      return next
    })
    toast({ title: "Link duplicated!", variant: "success" })
  }

  const startEdit = (link: LinkItem) => {
    setEditingId(link.id)
    setEditLabel(link.label)
    setEditUrl(link.url)
  }

  const saveEdit = () => {
    if (!editLabel.trim() || !editUrl.trim()) { toast({ title: "Label and URL are required" }); return }
    setLinks(prev => prev.map(l => l.id === editingId ? { ...l, label: editLabel.trim(), url: editUrl.trim() } : l))
    setEditingId(null)
    toast({ title: "Link updated", variant: "success" })
  }

  const addLink = (link: LinkItem) => {
    setLinks(prev => [...prev, link])
  }

  const saveSchedule = (id: string, scheduleAt: string | undefined) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, scheduleAt } : l))
  }

  const addSocial = (social: typeof QUICK_SOCIALS[0]) => {
    const existing = links.find(l => l.icon === social.id)
    if (existing) { toast({ title: `${social.label} is already added` }); return }
    addLink({
      id: `social-${social.id}-${Date.now()}`,
      type: "social",
      label: `Follow on ${social.label}`,
      url: social.id === "youtube" ? "https://youtube.com/@yourhandle" : `https://${social.id}.com/@yourhandle`,
      icon: social.id,
      enabled: true,
      clicks: 0,
      views: 0,
      dailyClicks: [0, 0, 0, 0, 0, 0, 0],
    })
    toast({ title: `${social.label} added!`, variant: "success" })
  }

  const copyBioUrl = () => {
    navigator.clipboard.writeText(bioUrl)
    setCopied(true)
    toast({ title: "Link-in-bio URL copied!", variant: "success" })
    setTimeout(() => setCopied(false), 2000)
  }

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0)
  const totalViews  = links.reduce((s, l) => s + l.views,  0)
  const activeCount = links.filter(l => l.enabled).length
  const overallCtr  = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0"
  const topLink     = [...links].sort((a, b) => b.clicks - a.clicks)[0]

  return (
    <>
      <div className="p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Link-in-Bio</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your public link page at <span className="text-brand-purple font-medium">lummy.co/{handle}/links</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyBioUrl}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors">
              {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy URL"}
            </button>
            <a href={`/${handle}/links`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 h-9 text-xs">
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Links",  value: activeCount.toString(),          icon: Link2,         color: "text-brand-purple" },
            { label: "Total Clicks",  value: totalClicks.toLocaleString(),     icon: MousePointer2, color: "text-brand-green"  },
            { label: "Overall CTR",   value: `${overallCtr}%`,                 icon: BarChart2,     color: "text-brand-coral"  },
            { label: "Top Link",      value: topLink?.label.slice(0, 12) + "…",icon: TrendingUp,    color: "text-amber-500"    },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{stat.label}</p>
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
              <p className="font-display text-xl font-extrabold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Link list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick add socials */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick-add Social</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SOCIALS.map(social => {
                  const Icon = ICON_MAP[social.id] ?? Link2
                  const colorCls = ICON_COLOR[social.id] ?? ICON_COLOR.link
                  const alreadyAdded = links.some(l => l.icon === social.id)
                  return (
                    <button key={social.id} onClick={() => addSocial(social)} disabled={alreadyAdded}
                      className={cn("flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all",
                        alreadyAdded ? "border-border bg-muted text-muted-foreground opacity-50 cursor-not-allowed" : `${colorCls} hover:opacity-80`)}>
                      <Icon className="h-3.5 w-3.5" />
                      {social.label}
                      {alreadyAdded && <CheckCheck className="h-3 w-3" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Links */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <p className="text-sm font-bold">Your Links <span className="text-muted-foreground font-normal text-xs">({links.length})</span></p>
                <Button size="sm" onClick={() => setAddModalOpen(true)} className="gap-1.5 h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Link
                </Button>
              </div>

              <Reorder.Group axis="y" values={links} onReorder={setLinks} className="divide-y divide-border">
                <AnimatePresence initial={false}>
                  {links.map(link => {
                    const Icon = ICON_MAP[link.icon] ?? Link2
                    const colorCls = ICON_COLOR[link.icon] ?? ICON_COLOR.link
                    const isEditing = editingId === link.id
                    const isExpanded = expandedId === link.id
                    const ctr = link.views > 0 ? ((link.clicks / link.views) * 100).toFixed(1) : "0.0"

                    return (
                      <Reorder.Item key={link.id} value={link} className="bg-card">
                        <div className={cn("flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors group",
                          !link.enabled && "opacity-50")}>
                          {/* Drag handle */}
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />

                          {/* Icon */}
                          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border", colorCls)}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-1.5">
                                <input autoFocus value={editLabel} onChange={e => setEditLabel(e.target.value)}
                                  className="w-full h-7 px-2 rounded-lg border border-brand-purple/40 bg-background text-xs font-semibold focus:outline-none"
                                  onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null) }} />
                                <input value={editUrl} onChange={e => setEditUrl(e.target.value)}
                                  className="w-full h-7 px-2 rounded-lg border border-border bg-background text-xs text-muted-foreground focus:outline-none"
                                  onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null) }} />
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-semibold truncate">{link.label}</p>
                                  {link.scheduleAt && (
                                    <span className="flex-shrink-0 text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                      ⏰ Scheduled
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
                              </>
                            )}
                          </div>

                          {/* Sparkline + CTR (desktop only, not in edit mode) */}
                          {!isEditing && (link.dailyClicks ?? []).some(v => v > 0) && (
                            <div className="hidden md:flex flex-col items-end gap-0.5 flex-shrink-0">
                              <ClickSparkBars data={link.dailyClicks ?? []} />
                              <span className="text-[9px] text-muted-foreground">CTR {ctr}%</span>
                            </div>
                          )}

                          {/* Click count */}
                          {link.clicks > 0 && !isEditing && (
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:block md:hidden">
                              {link.clicks.toLocaleString()} clicks
                            </span>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isEditing ? (
                              <>
                                <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-brand-green/10 text-brand-green transition-colors">
                                  <Save className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Analytics expand */}
                                <button onClick={() => setExpandedId(isExpanded ? null : link.id)}
                                  className={cn("p-1.5 rounded-lg transition-colors", isExpanded ? "bg-brand-purple/10 text-brand-purple" : "hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100")}>
                                  <BarChart2 className="h-3.5 w-3.5" />
                                </button>
                                {/* Schedule */}
                                <button onClick={() => setScheduleLink(link)}
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
                                  <Calendar className="h-3.5 w-3.5" />
                                </button>
                                {/* Duplicate */}
                                <button onClick={() => duplicateLink(link)}
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => startEdit(link)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <a href={link.url} target="_blank" rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                <button onClick={() => toggleLink(link.id)}
                                  className="p-1 rounded-lg hover:bg-muted transition-colors">
                                  {link.enabled
                                    ? <ToggleRight className="h-5 w-5 text-brand-green" />
                                    : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                                </button>
                                <button onClick={() => deleteLink(link.id)}
                                  className="p-1.5 rounded-lg hover:bg-brand-coral/10 text-muted-foreground hover:text-brand-coral transition-colors opacity-0 group-hover:opacity-100">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Analytics expand panel */}
                        <AnimatePresence>
                          {isExpanded && !isEditing && (
                            <LinkAnalyticsPanel key="analytics" link={link} />
                          )}
                        </AnimatePresence>
                      </Reorder.Item>
                    )
                  })}
                </AnimatePresence>
              </Reorder.Group>

              {links.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <Link2 className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">No links yet</p>
                  <p className="text-xs mt-1">Add your first link above</p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tips</p>
              {[
                "Put your WhatsApp link first — it converts 3× better than any other platform",
                "Keep link labels short and action-oriented (e.g. 'Shop Now' vs 'My Store')",
                "Add a limited-time link during promotions to drive urgency",
                "Use UTM parameters to track which links bring real buyers vs browsers",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-brand-purple font-bold flex-shrink-0 mt-0.5">→</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Preview + Share */}
          <div className="flex flex-col items-center gap-4 lg:sticky lg:top-6">
            <PhonePreview links={links} handle={handle} />

            {/* Share section */}
            <div className="w-full rounded-2xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Share Your Page</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/30">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground truncate flex-1">lummy.co/{handle}/links</p>
                <button onClick={copyBioUrl} className="flex-shrink-0 text-brand-purple">
                  {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(`Check out my link page: ${bioUrl}`)}`}
                  target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="whatsapp" size="sm" className="w-full gap-1.5 h-8 text-xs">
                    <MessageCircle className="h-3.5 w-3.5 fill-white" /> Share
                  </Button>
                </a>
                <button onClick={copyBioUrl} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs">
                    <Share2 className="h-3.5 w-3.5" /> Copy
                  </Button>
                </button>
              </div>

              {/* QR Code toggle */}
              <button onClick={() => setQrOpen(o => !o)}
                className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors pt-1">
                <span className="flex items-center gap-1.5"><QrCode className="h-3.5 w-3.5" /> QR Code</span>
                {qrOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <AnimatePresence>
                {qrOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="p-3 rounded-2xl border border-border bg-white text-foreground">
                        <QRPlaceholder size={96} />
                      </div>
                      <p className="text-[9px] text-muted-foreground text-center">Scan to open your link page</p>
                      <button onClick={() => toast({ title: "QR code downloaded!", variant: "success" })}
                        className="text-[10px] font-semibold text-brand-purple hover:underline">Download PNG</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {addModalOpen && (
          <AddLinkModal
            key="add-modal"
            onClose={() => setAddModalOpen(false)}
            onAdd={addLink}
          />
        )}
        {scheduleLink && (
          <ScheduleModal
            key="schedule-modal"
            link={scheduleLink}
            onSave={at => saveSchedule(scheduleLink.id, at)}
            onClose={() => setScheduleLink(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
