"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, ShoppingBag, Star, Megaphone, CheckCircle2,
  Zap, Settings, CheckCheck, Trash2, X, MessageCircle,
  Mail, Smartphone, Moon, Clock, Volume2, VolumeX,
  ToggleLeft, ToggleRight, ChevronDown, Search,
  Pin, PinOff, AlarmClock, EyeOff, ExternalLink,
  TrendingUp, Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

type NotifType = "order" | "review" | "system" | "promo" | "payout"

interface Notification {
  id: string; type: NotifType; title: string; body: string
  time: string; read: boolean; group: "today" | "yesterday" | "week" | "earlier"
  pinned?: boolean
  snoozedUntil?: string   // "1h" | "3h" | "tomorrow" (display label only)
  cta?: { label: string; href: string }
}

interface ChannelPrefs { inApp: boolean; email: boolean; whatsapp: boolean; push: boolean }
interface CategoryPref { enabled: boolean; channels: ChannelPrefs }
type CategoryPrefs = Record<NotifType, CategoryPref>
type DigestFreq = "immediate" | "hourly" | "daily" | "weekly"

interface NotifPrefs {
  categories: CategoryPrefs
  quietHours: { enabled: boolean; from: string; to: string }
  digest: DigestFreq
  sound: boolean
}

const PREFS_KEY = "lummy_notif_prefs"

const DEFAULT_PREFS: NotifPrefs = {
  categories: {
    order:  { enabled: true,  channels: { inApp: true, email: true,  whatsapp: true,  push: true  } },
    review: { enabled: true,  channels: { inApp: true, email: true,  whatsapp: false, push: true  } },
    payout: { enabled: true,  channels: { inApp: true, email: true,  whatsapp: true,  push: true  } },
    promo:  { enabled: true,  channels: { inApp: true, email: false, whatsapp: false, push: false } },
    system: { enabled: true,  channels: { inApp: true, email: false, whatsapp: false, push: false } },
  },
  quietHours: { enabled: false, from: "22:00", to: "08:00" },
  digest: "immediate",
  sound: true,
}

function loadPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try { const v = localStorage.getItem(PREFS_KEY); return v ? JSON.parse(v) : DEFAULT_PREFS } catch { return DEFAULT_PREFS }
}

const mockNotifications: Notification[] = [
  { id: "N1",  type: "order",  title: "New Order Received",    body: "Chidi N. ordered Ankara Peplum Top (×2) — ₦28,000",                               time: "2 min ago",  read: false, group: "today",     pinned: true, cta: { label: "View order", href: "/dashboard/orders/LM1042" } },
  { id: "N2",  type: "payout", title: "Payout Processed",      body: "₦125,000 has been sent to your GTBank account ending 4521",                        time: "1h ago",     read: false, group: "today",     cta: { label: "View payout", href: "/dashboard/payouts" } },
  { id: "N3",  type: "review", title: "New 5-Star Review",     body: "Amaka O. left a glowing review on Lace Iro & Buba: \"Absolutely beautiful fabric!\"",time: "3h ago",     read: false, group: "today",     cta: { label: "See review", href: "/dashboard/reviews" } },
  { id: "N4",  type: "order",  title: "Order Confirmed",       body: "Funmi A. confirmed delivery of Men's Agbada Set — ₦45,000",                        time: "5h ago",     read: true,  group: "today",     cta: { label: "View order", href: "/dashboard/orders/LM1041" } },
  { id: "N5",  type: "order",  title: "New Order Received",    body: "Bisi K. ordered Embroidered Kaftan (×1) — ₦22,500",                                time: "6h ago",     read: true,  group: "today",     cta: { label: "View order", href: "/dashboard/orders/LM1040" } },
  { id: "N6",  type: "system", title: "WhatsApp Connected",    body: "Your WhatsApp Business number is now verified and active",                         time: "Yesterday",  read: true,  group: "yesterday" },
  { id: "N7",  type: "promo",  title: "Tip: Boost Your Sales", body: "Stores that reply within 1 hr get 3× more conversions. You're at 94% — great work!", time: "Yesterday", read: true,  group: "yesterday" },
  { id: "N8",  type: "order",  title: "New Order Received",    body: "Tunde B. ordered Dashiki Shirt (×1) — ₦12,500",                                   time: "2 days ago", read: true,  group: "week",      cta: { label: "View order", href: "/dashboard/orders/LM1039" } },
  { id: "N9",  type: "review", title: "New 4-Star Review",     body: "Ngozi M. reviewed Adire Gown — \"Love it, but delivery took a bit long.\"",        time: "3 days ago", read: true,  group: "week",      cta: { label: "Respond", href: "/dashboard/reviews" } },
  { id: "N10", type: "system", title: "Product Restocked",     body: "Your automation restocked Men's Agbada Set to 15 units",                          time: "4 days ago", read: true,  group: "week" },
  { id: "N11", type: "payout", title: "Payout Scheduled",      body: "₦87,500 will be processed this Friday (May 9)",                                    time: "5 days ago", read: true,  group: "earlier",   cta: { label: "View payouts", href: "/dashboard/payouts" } },
  { id: "N12", type: "promo",  title: "Flash Sale Reminder",   body: "Your weekend flash sale starts in 2 days. 47 customers are on your broadcast list.", time: "6 days ago", read: true,  group: "earlier" },
]

// Activity heatmap data: 7 days × 6 time slots
const DAYS = ["M", "T", "W", "T", "F", "S", "S"]
const SLOTS = ["6am", "9am", "12pm", "3pm", "6pm", "9pm"]
const HEATMAP: number[][] = [
  [0, 1, 2, 3, 2, 1],
  [1, 2, 4, 5, 3, 2],
  [0, 1, 3, 4, 2, 1],
  [2, 3, 5, 6, 4, 2],
  [1, 2, 4, 7, 5, 3],
  [0, 1, 2, 3, 2, 1],
  [0, 0, 1, 2, 1, 0],
]

const typeConfig: Record<NotifType, { label: string; icon: React.ElementType; bg: string; color: string }> = {
  order:  { label: "Orders",   icon: ShoppingBag,  bg: "bg-brand-purple/10", color: "text-brand-purple" },
  review: { label: "Reviews",  icon: Star,         bg: "bg-amber-500/10",    color: "text-amber-500"    },
  system: { label: "System",   icon: Zap,          bg: "bg-brand-green/10",  color: "text-brand-green"  },
  promo:  { label: "Tips",     icon: Megaphone,    bg: "bg-brand-coral/10",  color: "text-brand-coral"  },
  payout: { label: "Payouts",  icon: CheckCircle2, bg: "bg-brand-green/10",  color: "text-brand-green"  },
}

const DIGEST_OPTIONS: { id: DigestFreq; label: string; sub: string }[] = [
  { id: "immediate", label: "Immediate",  sub: "Get notified as it happens"      },
  { id: "hourly",    label: "Hourly",     sub: "Bundled every hour"               },
  { id: "daily",     label: "Daily",      sub: "One summary each morning"         },
  { id: "weekly",    label: "Weekly",     sub: "Monday morning summary"           },
]

const CHANNEL_CONFIG: { key: keyof ChannelPrefs; label: string; icon: React.ElementType; color: string }[] = [
  { key: "inApp",    label: "In-app",   icon: Bell,          color: "text-brand-purple" },
  { key: "email",    label: "Email",    icon: Mail,          color: "text-brand-indigo" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-[#25D366]"   },
  { key: "push",     label: "Push",     icon: Smartphone,    color: "text-brand-coral"  },
]

const filterTabs = ["All", "Unread", "Orders", "Reviews", "Payouts", "Pinned"] as const
const GROUP_LABELS: Record<Notification["group"], string> = { today: "Today", yesterday: "Yesterday", week: "This week", earlier: "Earlier" }
const GROUP_ORDER: Notification["group"][] = ["today", "yesterday", "week", "earlier"]
const SNOOZE_OPTIONS = [
  { label: "1 hour",    value: "1h"       },
  { label: "3 hours",   value: "3h"       },
  { label: "Tomorrow",  value: "tomorrow" },
]

// ── Activity Heatmap ─────────────────────────────────────────────────────────
function ActivityHeatmap() {
  const maxVal = Math.max(...HEATMAP.flat())
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-brand-purple" />
        <p className="text-sm font-semibold">Activity Pattern</p>
        <span className="ml-auto text-[10px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="flex gap-1">
        {/* Slot labels */}
        <div className="flex flex-col gap-1 pt-5 pr-1">
          {SLOTS.map(s => (
            <div key={s} className="h-6 flex items-center text-[9px] text-muted-foreground w-7 text-right">{s}</div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex-1">
          <div className="flex gap-1 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">{d}</div>
            ))}
          </div>
          <div className="flex gap-1">
            {HEATMAP.map((daySlots, di) => (
              <div key={di} className="flex-1 flex flex-col gap-1">
                {daySlots.map((v, si) => (
                  <div key={si} title={`${DAYS[di]} ${SLOTS[si]}: ${v} notifications`}
                    className="h-6 rounded-md transition-colors"
                    style={{ background: v === 0 ? "var(--muted)" : `rgba(108,78,243,${0.12 + (v / maxVal) * 0.7})` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Peak: <span className="font-semibold text-brand-purple">Fri 6pm</span></p>
    </div>
  )
}

// ── Snooze Menu ───────────────────────────────────────────────────────────────
function SnoozeMenu({ onSnooze, onClose }: { onSnooze: (val: string) => void; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-8 right-0 z-20 w-36 rounded-xl border border-border bg-background shadow-lg p-1">
      {SNOOZE_OPTIONS.map(opt => (
        <button key={opt.value} onClick={() => { onSnooze(opt.value); onClose() }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-accent transition-colors">
          <AlarmClock className="h-3 w-3 text-muted-foreground" />{opt.label}
        </button>
      ))}
    </motion.div>
  )
}

// ── Preferences Panel ────────────────────────────────────────────────────────
function PreferencesPanel({ prefs, onChange, onClose }: {
  prefs: NotifPrefs; onChange: (p: NotifPrefs) => void; onClose: () => void
}) {
  const [local, setLocal] = React.useState<NotifPrefs>(prefs)
  const [digestOpen, setDigestOpen] = React.useState(false)

  const update = (patch: Partial<NotifPrefs>) => setLocal(prev => ({ ...prev, ...patch }))
  const updateCategory = (type: NotifType, patch: Partial<CategoryPref>) =>
    setLocal(prev => ({ ...prev, categories: { ...prev.categories, [type]: { ...prev.categories[type], ...patch } } }))
  const updateChannel = (type: NotifType, ch: keyof ChannelPrefs, val: boolean) =>
    setLocal(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [type]: { ...prev.categories[type], channels: { ...prev.categories[type].channels, [ch]: val } },
      },
    }))

  const save = () => {
    onChange(local)
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(local)) } catch {}
    onClose()
    toast({ title: "Preferences saved", variant: "success" })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-card overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-purple/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-brand-purple" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm">Notification Preferences</h2>
              <p className="text-[10px] text-muted-foreground">Customise what you get notified about</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Sound toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              {local.sound ? <Volume2 className="h-4 w-4 text-brand-purple" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-semibold">Notification sound</p>
                <p className="text-[10px] text-muted-foreground">Play a sound for new notifications</p>
              </div>
            </div>
            <button onClick={() => update({ sound: !local.sound })} className="p-1">
              {local.sound
                ? <ToggleRight className="h-6 w-6 text-brand-purple" />
                : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
            </button>
          </div>

          {/* Digest frequency */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Delivery Frequency</p>
            <div className="relative">
              <button onClick={() => setDigestOpen(v => !v)}
                className="w-full flex items-center justify-between h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium hover:bg-accent transition-colors">
                <span>{DIGEST_OPTIONS.find(d => d.id === local.digest)?.label}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", digestOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {digestOpen && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    {DIGEST_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => { update({ digest: opt.id }); setDigestOpen(false) }}
                        className={cn("w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-colors text-left",
                          local.digest === opt.id && "text-brand-purple")}>
                        <div>
                          <p className="text-sm font-semibold">{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground">{opt.sub}</p>
                        </div>
                        {local.digest === opt.id && <CheckCheck className="h-4 w-4 flex-shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quiet hours */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-brand-indigo" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quiet Hours</p>
                  <p className="text-[10px] text-muted-foreground">Mute notifications during set hours</p>
                </div>
              </div>
              <button onClick={() => update({ quietHours: { ...local.quietHours, enabled: !local.quietHours.enabled } })} className="p-1">
                {local.quietHours.enabled
                  ? <ToggleRight className="h-6 w-6 text-brand-purple" />
                  : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
              </button>
            </div>
            <AnimatePresence>
              {local.quietHours.enabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase">From</label>
                      <input type="time" value={local.quietHours.from}
                        onChange={e => update({ quietHours: { ...local.quietHours, from: e.target.value } })}
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase">To</label>
                      <input type="time" value={local.quietHours.to}
                        onChange={e => update({ quietHours: { ...local.quietHours, to: e.target.value } })}
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Per-category */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Categories &amp; Channels</p>
            <div className="space-y-1">
              {(Object.entries(local.categories) as [NotifType, CategoryPref][]).map(([type, pref]) => {
                const cfg = typeConfig[type]
                const Icon = cfg.icon
                return (
                  <div key={type} className={cn("rounded-2xl border border-border overflow-hidden transition-colors", !pref.enabled && "opacity-60")}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", cfg.bg)}>
                        <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                      </div>
                      <p className="text-sm font-semibold flex-1">{cfg.label}</p>
                      <button onClick={() => updateCategory(type, { enabled: !pref.enabled })} className="p-1">
                        {pref.enabled
                          ? <ToggleRight className="h-5 w-5 text-brand-purple" />
                          : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                      </button>
                    </div>
                    {pref.enabled && (
                      <div className="flex items-center gap-2 px-4 pb-3">
                        {CHANNEL_CONFIG.map(ch => {
                          const ChIcon = ch.icon
                          const active = pref.channels[ch.key]
                          return (
                            <button key={ch.key} onClick={() => updateChannel(type, ch.key, !active)} title={ch.label}
                              className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all",
                                active ? `${ch.color} bg-current/10 border-current/20` : "border-border text-muted-foreground hover:border-foreground/20")}>
                              <ChIcon className="h-3 w-3" />{ch.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-border p-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 h-9 text-xs" onClick={save}>Save Preferences</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications)
  const [activeTab, setActiveTab] = React.useState<typeof filterTabs[number]>("All")
  const [prefsOpen, setPrefsOpen] = React.useState(false)
  const [prefs, setPrefs] = React.useState<NotifPrefs>(DEFAULT_PREFS)
  const [search, setSearch] = React.useState("")
  const [snoozeOpenId, setSnoozeOpenId] = React.useState<string | null>(null)
  const [showHeatmap, setShowHeatmap] = React.useState(false)

  React.useEffect(() => {
    setPrefs(loadPrefs())
  }, [])

  const unreadCount = notifications.filter(n => !n.read && !n.snoozedUntil).length

  const tabCounts = React.useMemo(() => ({
    All:     notifications.filter(n => !n.snoozedUntil).length,
    Unread:  notifications.filter(n => !n.read && !n.snoozedUntil).length,
    Orders:  notifications.filter(n => n.type === "order" && !n.snoozedUntil).length,
    Reviews: notifications.filter(n => n.type === "review" && !n.snoozedUntil).length,
    Payouts: notifications.filter(n => n.type === "payout" && !n.snoozedUntil).length,
    Pinned:  notifications.filter(n => n.pinned).length,
  }), [notifications])

  const filtered = notifications.filter(n => {
    if (n.snoozedUntil && activeTab !== "Pinned") return false
    const catEnabled = prefs.categories[n.type]?.enabled !== false
    if (!catEnabled && activeTab === "All") return false
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.body.toLowerCase().includes(search.toLowerCase())) return false
    if (activeTab === "Unread")  return !n.read
    if (activeTab === "Orders")  return n.type === "order"
    if (activeTab === "Reviews") return n.type === "review"
    if (activeTab === "Payouts") return n.type === "payout"
    if (activeTab === "Pinned")  return !!n.pinned
    return true
  })

  // Pinned items float to top
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })

  const grouped = GROUP_ORDER.reduce<Record<string, Notification[]>>((acc, g) => {
    const items = sorted.filter(n => n.group === g)
    if (items.length) acc[g] = items
    return acc
  }, {})

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead    = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const deleteNotif = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id))
  const clearAllRead = () => {
    const count = notifications.filter(n => n.read).length
    setNotifications(prev => prev.filter(n => !n.read))
    toast({ title: `Cleared ${count} read notification${count !== 1 ? "s" : ""}`, variant: "success" })
  }
  const togglePin = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
  }
  const snooze = (id: string, val: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, snoozedUntil: val, read: true } : n))
    const label = SNOOZE_OPTIONS.find(s => s.value === val)?.label ?? val
    toast({ title: `Snoozed until ${label}`, variant: "success" })
  }
  const unsnoozeAll = () => {
    const count = notifications.filter(n => !!n.snoozedUntil).length
    setNotifications(prev => prev.map(n => ({ ...n, snoozedUntil: undefined })))
    toast({ title: `${count} notification${count !== 1 ? "s" : ""} unsnoozed` })
  }

  const disabledCount = Object.values(prefs.categories).filter(c => !c.enabled).length
  const snoozedCount  = notifications.filter(n => !!n.snoozedUntil).length

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
              Notifications
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span key="badge" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                    className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-brand-coral text-white text-xs font-bold px-1.5">
                    {unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Stay on top of your store activity</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowHeatmap(v => !v)}
              className={cn("flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-colors",
                showHeatmap ? "border-brand-purple/30 bg-brand-purple/5 text-brand-purple" : "border-border text-muted-foreground hover:bg-accent")}>
              <Activity className="h-3.5 w-3.5" /> Activity
            </button>
            {snoozedCount > 0 && (
              <button onClick={unsnoozeAll}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-600 text-xs font-semibold hover:bg-amber-500/10 transition-colors">
                <AlarmClock className="h-3.5 w-3.5" /> {snoozedCount} snoozed
              </button>
            )}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                  <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 text-xs h-8">
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            {notifications.some(n => n.read) && (
              <Button variant="outline" size="sm" onClick={clearAllRead} className="gap-1.5 text-xs h-8 text-muted-foreground">
                <Trash2 className="h-3.5 w-3.5" /> Clear read
              </Button>
            )}
            <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-8", prefsOpen && "border-brand-purple/40 text-brand-purple")}
              onClick={() => setPrefsOpen(true)}>
              <Settings className="h-3.5 w-3.5" /> Preferences
              {disabledCount > 0 && (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-coral text-white text-[9px] font-bold">{disabledCount}</span>
              )}
            </Button>
          </div>
        </div>

        {/* Activity heatmap */}
        <AnimatePresence>
          {showHeatmap && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <ActivityHeatmap />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quiet hours banner */}
        {prefs.quietHours.enabled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-brand-indigo/20 bg-brand-indigo/5">
            <Moon className="h-4 w-4 text-brand-indigo flex-shrink-0" />
            <p className="text-xs font-medium">
              Quiet hours active: <span className="font-bold">{prefs.quietHours.from} – {prefs.quietHours.to}</span>
              {" "}— sounds are muted.
            </p>
            <button onClick={() => setPrefsOpen(true)} className="ml-auto text-[10px] text-brand-indigo font-semibold hover:underline flex-shrink-0">Edit</button>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {filterTabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                activeTab === tab ? "bg-brand-purple text-white border-brand-purple" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20")}>
              {tab}
              {tabCounts[tab] > 0 && (
                <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                  activeTab === tab ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">
              {search ? "No notifications match your search" : "No notifications here"}
            </p>
            {disabledCount > 0 && !search && (
              <p className="text-xs text-muted-foreground mt-1">
                {disabledCount} categor{disabledCount > 1 ? "ies are" : "y is"} muted.{" "}
                <button onClick={() => setPrefsOpen(true)} className="text-brand-purple font-semibold hover:underline">Manage preferences →</button>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pinned group in Pinned tab is shown inline; in other tabs pinned items appear at top */}
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {GROUP_LABELS[group as Notification["group"]]}
                </p>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {items.map((n, i) => {
                      const cfg = typeConfig[n.type]
                      const Icon = cfg.icon
                      return (
                        <motion.div key={n.id} layout="position"
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, scale: 0.97 }}
                          transition={{ duration: 0.2, delay: i * 0.02 }}
                          onClick={() => markRead(n.id)}
                          className={cn("group relative flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all",
                            n.read ? "border-border bg-card" : "border-brand-purple/20 bg-brand-purple/5",
                            n.pinned && "ring-1 ring-amber-500/30",
                            n.snoozedUntil && "opacity-50")}>

                          {/* Unread dot */}
                          {!n.read && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="absolute top-4 right-10 h-2 w-2 rounded-full bg-brand-purple" />
                          )}

                          {/* Pinned indicator */}
                          {n.pinned && (
                            <div className="absolute top-3 right-3">
                              <Pin className="h-3 w-3 text-amber-500" />
                            </div>
                          )}

                          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 mt-0.5", cfg.bg)}>
                            <Icon className={cn("h-4 w-4", cfg.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-semibold leading-snug", !n.read && "text-foreground")}>{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />{n.snoozedUntil ? `Snoozed · ${n.snoozedUntil}` : n.time}
                              </p>
                              {n.cta && (
                                <a href={n.cta.href} onClick={e => e.stopPropagation()}
                                  className="flex items-center gap-1 text-[10px] font-semibold text-brand-purple hover:underline">
                                  {n.cta.label} <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Hover actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {/* Pin / unpin */}
                            <button onClick={e => { e.stopPropagation(); togglePin(n.id) }}
                              title={n.pinned ? "Unpin" : "Pin"}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              {n.pinned ? <PinOff className="h-3.5 w-3.5 text-amber-500" /> : <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
                            </button>
                            {/* Snooze */}
                            <div className="relative">
                              <button onClick={e => { e.stopPropagation(); setSnoozeOpenId(snoozeOpenId === n.id ? null : n.id) }}
                                title="Snooze"
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                <AlarmClock className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                              <AnimatePresence>
                                {snoozeOpenId === n.id && (
                                  <SnoozeMenu
                                    onSnooze={(val) => snooze(n.id, val)}
                                    onClose={() => setSnoozeOpenId(null)}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            {/* Mute type */}
                            <button onClick={e => { e.stopPropagation(); toast({ title: `${cfg.label} muted`, description: "You can re-enable in Preferences" }) }}
                              title="Mute this type"
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            {/* Delete */}
                            <button onClick={e => { e.stopPropagation(); deleteNotif(n.id) }}
                              title="Delete"
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Digest / summary card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-muted/20 p-4 flex gap-3">
          <TrendingUp className="h-4 w-4 text-brand-green flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground flex-1">
            <p className="font-semibold text-foreground mb-0.5">This week at a glance</p>
            <p>You received <span className="font-semibold text-foreground">5 new orders</span>, <span className="font-semibold text-foreground">2 reviews</span>, and <span className="font-semibold text-foreground">1 payout</span>. Peak activity was <span className="font-semibold text-foreground">Friday 6pm</span>.</p>
          </div>
          <button onClick={() => setShowHeatmap(v => !v)} className="text-brand-purple text-[10px] font-semibold hover:underline flex-shrink-0">
            {showHeatmap ? "Hide" : "View"} heatmap
          </button>
        </motion.div>

        {/* Enable browser push tip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3">
          <Bell className="h-4 w-4 text-brand-purple flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-0.5">Get notified faster</p>
            <p>Enable browser notifications to get instant alerts for new orders, even when Lummy isn&apos;t open.</p>
            <button onClick={() => { if (typeof Notification !== "undefined") Notification.requestPermission() }}
              className="mt-2 text-brand-purple font-semibold hover:underline">
              Enable notifications →
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {prefsOpen && <PreferencesPanel prefs={prefs} onChange={setPrefs} onClose={() => setPrefsOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
