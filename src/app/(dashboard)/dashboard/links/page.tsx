"use client"

import * as React from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import {
  Link2, Plus, ExternalLink, Copy, CheckCheck, GripVertical,
  Instagram, Twitter, Music2, MessageCircle, Youtube, Globe,
  ToggleLeft, ToggleRight, Trash2, Edit3, Save, X, Eye,
  ShoppingBag, Zap, BadgeCheck, Share2,
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
  { id: "L1", type: "store",  label: "Shop My Store 🛍",   url: "https://lummy.co/sade.styles",          icon: "store",     enabled: true,  clicks: 1243 },
  { id: "L2", type: "social", label: "Chat on WhatsApp",   url: "https://wa.me/2348012345678",           icon: "whatsapp",  enabled: true,  clicks: 892  },
  { id: "L3", type: "social", label: "Follow on Instagram",url: "https://instagram.com/sade.styles",     icon: "instagram", enabled: true,  clicks: 567  },
  { id: "L4", type: "social", label: "Follow on TikTok",   url: "https://tiktok.com/@sade.styles",       icon: "tiktok",    enabled: true,  clicks: 341  },
  { id: "L5", type: "custom", label: "New Collection Drop",url: "https://lummy.co/sade.styles?filter=new",icon: "zap",      enabled: true,  clicks: 228  },
  { id: "L6", type: "social", label: "Twitter / X",        url: "https://twitter.com/sade_styles",       icon: "twitter",   enabled: false, clicks: 89   },
]

function loadLinks(): LinkItem[] {
  if (typeof window === "undefined") return DEFAULT_LINKS
  try { const v = localStorage.getItem(LINKS_KEY); return v ? JSON.parse(v) : DEFAULT_LINKS } catch { return DEFAULT_LINKS }
}

function saveLinks(links: LinkItem[]) {
  try { localStorage.setItem(LINKS_KEY, JSON.stringify(links)) } catch {}
}

function PhonePreview({ links, handle }: { links: LinkItem[]; handle: string }) {
  const activeLinks = links.filter(l => l.enabled)
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[180px] bg-brand-midnight rounded-[32px] border-4 border-foreground/20 overflow-hidden shadow-2xl"
        style={{ height: 360 }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/20 rounded-b-xl z-10" />

        {/* Screen */}
        <div className="h-full overflow-y-auto scrollbar-hide bg-gradient-to-b from-brand-purple/10 via-background to-background pt-8 px-2.5 pb-4 space-y-2">
          {/* Mini profile */}
          <div className="text-center py-2">
            <div className="w-10 h-10 rounded-full bg-brand-purple mx-auto mb-1.5 flex items-center justify-center text-white font-bold text-sm">S</div>
            <p className="text-[9px] font-bold truncate">Sade&apos;s Boutique</p>
            <div className="flex items-center justify-center gap-0.5">
              <p className="text-[8px] text-muted-foreground">@{handle}</p>
              <BadgeCheck className="h-2.5 w-2.5 text-brand-purple" />
            </div>
          </div>

          {/* Links */}
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

function AddLinkModal({ onClose, onAdd }: { onClose: () => void; onAdd: (link: LinkItem) => void }) {
  const [label, setLabel] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [icon, setIcon] = React.useState("link")

  const iconOptions = Object.entries(ICON_MAP).map(([key]) => ({
    key,
    Icon: ICON_MAP[key],
    colorCls: ICON_COLOR[key] ?? ICON_COLOR.link,
  }))

  const handleAdd = () => {
    if (!label.trim() || !url.trim()) { toast({ title: "Fill in label and URL" }); return }
    onAdd({
      id: `L${Date.now()}`,
      type: "custom",
      label: label.trim(),
      url: url.startsWith("http") ? url.trim() : `https://${url.trim()}`,
      icon,
      enabled: true,
      clicks: 0,
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

        <div className="p-5 space-y-4">
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

          <Button onClick={handleAdd} className="w-full gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Link
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function LinksPage() {
  const [links, setLinks] = React.useState<LinkItem[]>(loadLinks)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editLabel, setEditLabel] = React.useState("")
  const [editUrl, setEditUrl] = React.useState("")
  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

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
  const activeCount = links.filter(l => l.enabled).length

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
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Links",  value: activeCount.toString(),           icon: Link2,       color: "text-brand-purple" },
            { label: "Total Clicks",  value: totalClicks.toLocaleString(),      icon: Eye,         color: "text-brand-green"  },
            { label: "Top Source",    value: "Instagram",                       icon: Instagram,   color: "text-pink-500"     },
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

                    return (
                      <Reorder.Item key={link.id} value={link}
                        className={cn("flex items-center gap-3 px-4 py-3 bg-card hover:bg-accent/20 transition-colors group",
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
                              <p className="text-sm font-semibold truncate">{link.label}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
                            </>
                          )}
                        </div>

                        {/* Click count */}
                        {link.clicks > 0 && !isEditing && (
                          <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:block">
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
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-brand-purple font-bold flex-shrink-0 mt-0.5">→</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
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
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {addModalOpen && (
          <AddLinkModal
            onClose={() => setAddModalOpen(false)}
            onAdd={addLink}
          />
        )}
      </AnimatePresence>
    </>
  )
}
