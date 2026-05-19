"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar,
  ShoppingBag, Megaphone, Radio, Clock,
  MessageCircle, Copy, CheckCheck, ExternalLink,
  Tag, Info, Download, LayoutGrid, Rows3,
  Repeat2, ChevronDown, ChevronUp, Lightbulb,
  BarChart2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

type EventType = "drop" | "campaign" | "broadcast" | "promo"
type RecurringType = "weekly" | "biweekly" | "monthly"
type ViewMode = "month" | "week"

interface CalendarEvent {
  id: string
  type: EventType
  title: string
  date: string          // "YYYY-MM-DD"
  time?: string
  channel?: string
  note?: string
  product?: string
  recurring?: RecurringType
}

const EVENT_CONFIG: Record<EventType, { label: string; color: string; bg: string; border: string; dot: string; icon: React.ElementType }> = {
  drop:      { label: "Product Drop", color: "text-brand-purple", bg: "bg-brand-purple/15", border: "border-brand-purple/25", dot: "bg-brand-purple", icon: ShoppingBag },
  campaign:  { label: "Campaign",     color: "text-brand-coral",  bg: "bg-brand-coral/15",  border: "border-brand-coral/25",  dot: "bg-brand-coral",  icon: Megaphone },
  broadcast: { label: "Broadcast",    color: "text-brand-green",  bg: "bg-brand-green/15",  border: "border-brand-green/25",  dot: "bg-brand-green",  icon: Radio },
  promo:     { label: "Promotion",    color: "text-amber-500",    bg: "bg-amber-500/15",    border: "border-amber-500/25",    dot: "bg-amber-400",    icon: Tag },
}

const CONTENT_TEMPLATES: Record<EventType, { caption: string; hashtags: string }> = {
  drop: {
    caption: "🔥 NEW DROP ALERT! Our latest collection just landed — limited pieces, so don't sleep! Tap the link in bio to shop now 👆",
    hashtags: "#NewDrop #FashionNigeria #LimitedEdition #ShopNow #AnkaraDrop",
  },
  campaign: {
    caption: "💃🏾 Big sale is HERE! Get up to 40% off your favourite styles this week only. Use code SAVE at checkout ✨ Shop the link in bio!",
    hashtags: "#FlashSale #AfricanFashion #SaleAlert #ShopNow #NigerianFashion",
  },
  broadcast: {
    caption: "📦 Great news — your favourite items are BACK IN STOCK! We restocked based on your requests 🙌 Reply to this message to order.",
    hashtags: "#Restock #BackInStock #WhatsAppShopping #DontMissOut",
  },
  promo: {
    caption: "🎁 Exclusive promo just for you! Use this code for a special discount on your next order. Valid for 48 hours only ⏰",
    hashtags: "#PromoCode #ExclusiveDeal #LummyPromo #NaijaFashion",
  },
}

const RECURRING_LABELS: Record<RecurringType, string> = {
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  monthly: "Every month",
}

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: "e1",  type: "drop",      title: "New Ankara Collection Drop",      date: "2026-05-14", time: "10:00 AM", product: "Ankara Peplum Top",    channel: "Instagram + WhatsApp" },
  { id: "e2",  type: "campaign",  title: "Mother's Day Flash Sale",         date: "2026-05-10", time: "12:00 PM", channel: "WhatsApp",              note: "40% off selected items" },
  { id: "e3",  type: "broadcast", title: "Restock Alert — Leather Bags",    date: "2026-05-12", time: "9:00 AM",  channel: "WhatsApp Broadcast",    note: "Notify 847 subscribers" },
  { id: "e4",  type: "promo",     title: "SAVE5K Code Launch",              date: "2026-05-15", channel: "All channels" },
  { id: "e5",  type: "drop",      title: "Aso-Oke Gele Set — Limited Run",  date: "2026-05-20", time: "8:00 AM",  product: "Aso-Oke Gele",         channel: "TikTok + WhatsApp" },
  { id: "e6",  type: "campaign",  title: "Children's Day Promo",            date: "2026-05-27", time: "11:00 AM", channel: "Instagram",              note: "Targeting young mothers" },
  { id: "e7",  type: "broadcast", title: "Weekly Deals Broadcast",          date: "2026-05-18", time: "7:00 AM",  channel: "WhatsApp Broadcast",    recurring: "weekly" },
  { id: "e8",  type: "drop",      title: "Premium Perfume Restock",         date: "2026-05-25", time: "2:00 PM",  product: "Perfume Collection Box", channel: "Instagram" },
  { id: "e9",  type: "promo",     title: "VIP25 Loyalty Code",              date: "2026-05-28", channel: "WhatsApp",                                note: "VIP customers only" },
  { id: "e10", type: "campaign",  title: "End of Month Clearance",          date: "2026-05-30", time: "9:00 AM",  channel: "All channels",           note: "Clear excess inventory" },
  { id: "e11", type: "broadcast", title: "June Preview Teaser",             date: "2026-05-31", time: "6:00 PM",  channel: "WhatsApp Broadcast" },
]

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function pad(n: number) { return String(n).padStart(2, "0") }

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function dayOfWeek(dateStr: string) {
  return new Date(dateStr).getDay()
}

function exportICS(events: CalendarEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lummy//Creator Calendar//EN",
    "CALSCALE:GREGORIAN",
  ]
  events.forEach(ev => {
    const dt = ev.date.replace(/-/g, "")
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@lummy.co`,
      `DTSTART:${dt}`,
      `SUMMARY:${ev.title}`,
      ev.note ? `DESCRIPTION:${ev.note}` : "",
      ev.channel ? `LOCATION:${ev.channel}` : "",
      "END:VEVENT"
    )
  })
  lines.push("END:VCALENDAR")
  const blob = new Blob([lines.filter(Boolean).join("\r\n")], { type: "text/calendar" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "lummy-calendar.ics"; a.click()
  URL.revokeObjectURL(url)
  toast({ title: "Calendar exported!", description: "Open the .ics file to import into Google Calendar." })
}

function ContentBriefPanel({ type }: { type: EventType }) {
  const [open, setOpen] = React.useState(false)
  const [copiedCaption, setCopiedCaption] = React.useState(false)
  const [copiedTags, setCopiedTags] = React.useState(false)
  const tpl = CONTENT_TEMPLATES[type]

  const copy = (text: string, which: "caption" | "tags") => {
    navigator.clipboard.writeText(text)
    if (which === "caption") { setCopiedCaption(true); setTimeout(() => setCopiedCaption(false), 2000) }
    else { setCopiedTags(true); setTimeout(() => setCopiedTags(false), 2000) }
    toast({ title: "Copied to clipboard" })
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          Content brief
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-border pt-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Caption</p>
                  <button onClick={() => copy(tpl.caption, "caption")}
                    className="flex items-center gap-1 text-[10px] font-semibold text-brand-purple hover:underline">
                    {copiedCaption ? <CheckCheck className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                    {copiedCaption ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-[11px] text-foreground leading-relaxed bg-background rounded-lg p-2 border border-border">{tpl.caption}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Hashtags</p>
                  <button onClick={() => copy(tpl.hashtags, "tags")}
                    className="flex items-center gap-1 text-[10px] font-semibold text-brand-purple hover:underline">
                    {copiedTags ? <CheckCheck className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                    {copiedTags ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-[11px] text-brand-purple bg-brand-purple/5 rounded-lg p-2 border border-brand-purple/15 leading-relaxed">{tpl.hashtags}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EventsByWeekday({ events }: { events: CalendarEvent[] }) {
  const counts = DAYS_FULL.map((day, i) => ({
    day: DAYS_OF_WEEK[i],
    count: events.filter(e => dayOfWeek(e.date) === i).length,
  }))
  const max = Math.max(...counts.map(c => c.count), 1)

  return (
    <div className="rounded-2xl border border-border bg-card p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Events by weekday</p>
      </div>
      <div className="flex items-end gap-1.5 h-14">
        {counts.map(({ day, count }) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md bg-brand-purple/15 relative overflow-hidden" style={{ height: 40 }}>
              <motion.div
                initial={{ scaleY: 0 }} animate={{ scaleY: count / max }}
                transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
                style={{ transformOrigin: "bottom" }}
                className="absolute inset-x-0 bottom-0 bg-brand-purple rounded-t-md"
              />
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">{day[0]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeekView({ year, month, weekStart, events, onEventClick, onDayClick }: {
  year: number; month: number; weekStart: Date
  events: CalendarEvent[]; onEventClick: (e: CalendarEvent) => void; onDayClick: (date: string) => void
}) {
  const today = toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return {
      dateStr: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()),
      dayNum: d.getDate(),
      dayLabel: DAYS_OF_WEEK[d.getDay()],
      isToday: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()) === today,
    }
  })

  const eventsByDate = React.useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e) })
    return map
  }, [events])

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {days.map(({ dayLabel, dayNum, dateStr, isToday }) => (
          <div
            key={dateStr}
            onClick={() => onDayClick(dateStr)}
            className={cn(
              "py-2.5 px-1 text-center cursor-pointer hover:bg-muted/30 transition-colors border-r border-border last:border-r-0",
              isToday && "bg-brand-purple/5"
            )}
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">{dayLabel}</p>
            <div className={cn(
              "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-xl text-sm font-bold",
              isToday ? "bg-brand-purple text-white" : "text-foreground"
            )}>{dayNum}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-[180px]">
        {days.map(({ dateStr }) => {
          const dayEvts = eventsByDate[dateStr] ?? []
          return (
            <div key={dateStr} className="border-r border-border last:border-r-0 p-1.5 space-y-0.5 min-h-[140px]">
              {dayEvts.map(ev => {
                const cfg = EVENT_CONFIG[ev.type]
                return (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    className={cn(
                      "w-full text-left rounded-lg p-1.5 text-[10px] font-semibold transition-opacity hover:opacity-80",
                      cfg.bg, cfg.color
                    )}
                  >
                    <p className="truncate leading-snug">{ev.title}</p>
                    {ev.time && <p className="font-normal opacity-70 mt-0.5">{ev.time}</p>}
                    {ev.recurring && (
                      <div className="flex items-center gap-0.5 mt-0.5 opacity-70">
                        <Repeat2 className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CreateDrawer({ open, onClose, defaultDate, onCreate }: {
  open: boolean; onClose: () => void; defaultDate?: string; onCreate: (e: CalendarEvent) => void
}) {
  const [form, setForm] = React.useState({
    title: "", type: "drop" as EventType, date: defaultDate ?? "2026-05-14",
    time: "", channel: "", note: "", product: "", recurring: "" as RecurringType | "",
  })

  React.useEffect(() => {
    if (open) setForm(f => ({ ...f, date: defaultDate ?? f.date, title: "", time: "", channel: "", note: "", product: "", recurring: "" }))
  }, [open, defaultDate])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = () => {
    if (!form.title.trim()) { toast({ title: "Add a title for this event" }); return }
    onCreate({
      id: `e${Date.now()}`, type: form.type, title: form.title, date: form.date,
      time: form.time || undefined, channel: form.channel || undefined,
      note: form.note || undefined, product: form.product || undefined,
      recurring: (form.recurring as RecurringType) || undefined,
    })
    onClose()
    toast({ title: "Event scheduled!", description: `${form.title} added to your calendar.` })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-card border-l border-border flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <h2 className="font-display font-bold text-sm">Schedule Event</h2>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Event type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => (
                    <button key={type} onClick={() => set("type", type)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all",
                        form.type === type ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border hover:bg-muted text-muted-foreground"
                      )}>
                      <cfg.icon className="h-3.5 w-3.5 flex-shrink-0" />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Title *</label>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder={form.type === "drop" ? "e.g. New Ankara Drop" : form.type === "campaign" ? "e.g. Mother's Day Sale" : "e.g. Weekly Deals Broadcast"}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Date *</label>
                  <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Time (optional)</label>
                  <input value={form.time} onChange={e => set("time", e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                </div>
              </div>

              {/* Channel */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Channel (optional)</label>
                <select value={form.channel} onChange={e => set("channel", e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30">
                  <option value="">Select channel</option>
                  <option>WhatsApp</option>
                  <option>WhatsApp Broadcast</option>
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>Instagram + WhatsApp</option>
                  <option>TikTok + WhatsApp</option>
                  <option>All channels</option>
                </select>
              </div>

              {/* Recurring */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Repeat (optional)</label>
                <select value={form.recurring} onChange={e => set("recurring", e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30">
                  <option value="">Does not repeat</option>
                  <option value="weekly">Every week</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Every month</option>
                </select>
              </div>

              {/* Product (only for drops) */}
              {form.type === "drop" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Product (optional)</label>
                  <input value={form.product} onChange={e => set("product", e.target.value)}
                    placeholder="e.g. Ankara Peplum Top"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Note (optional)</label>
                <textarea value={form.note} onChange={e => set("note", e.target.value)}
                  rows={2} placeholder="Any additional details…"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none" />
              </div>

              {/* Content brief preview */}
              <ContentBriefPanel type={form.type} />
            </div>

            <div className="flex-shrink-0 p-5 border-t border-border flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 gap-1.5" onClick={handleCreate}>
                <Plus className="h-4 w-4" /> Schedule
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const cfg = EVENT_CONFIG[event.type]
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn("w-full text-left text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5", cfg.bg, cfg.color, "hover:opacity-80 transition-opacity")}
    >
      <span className="truncate flex-1">{event.title}</span>
      {event.recurring && <Repeat2 className="h-2 w-2 flex-shrink-0 opacity-60" />}
    </button>
  )
}

function EventDetail({ event, onClose, onDelete }: { event: CalendarEvent; onClose: () => void; onDelete: (id: string) => void }) {
  const cfg = EVENT_CONFIG[event.type]
  const Icon = cfg.icon
  const [copied, setCopied] = React.useState(false)

  const whatsappMsg = `📅 Reminder: ${event.title}${event.time ? ` at ${event.time}` : ""}${event.note ? `\n\n${event.note}` : ""}`

  const copyMsg = () => {
    navigator.clipboard.writeText(whatsappMsg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Message copied!" })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className={cn("px-5 py-4 flex items-center justify-between", cfg.bg, cfg.border, "border-b")}>
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", cfg.color)} />
            <span className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</span>
            {event.recurring && (
              <div className={cn("flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/20", cfg.color)}>
                <Repeat2 className="h-2.5 w-2.5" />
                {RECURRING_LABELS[event.recurring]}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <h3 className="font-display font-bold text-base leading-snug">{event.title}</h3>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{event.date.replace(/-/g, " / ")}{event.time ? ` · ${event.time}` : ""}</span>
            </div>
            {event.channel && (
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{event.channel}</span>
              </div>
            )}
            {event.product && (
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{event.product}</span>
              </div>
            )}
            {event.note && (
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{event.note}</span>
              </div>
            )}
          </div>

          {/* WhatsApp reminder */}
          <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp reminder</p>
            <p className="text-xs whitespace-pre-line">{whatsappMsg}</p>
            <div className="flex gap-2 pt-1">
              <button onClick={copyMsg} className="flex items-center gap-1 text-[11px] font-semibold text-brand-purple hover:underline">
                {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-[#25D366] hover:underline">
                <ExternalLink className="h-3 w-3" /> Open in WhatsApp
              </a>
            </div>
          </div>

          {/* Content brief */}
          <ContentBriefPanel type={event.type} />
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs h-9 text-destructive border-destructive/20 hover:bg-destructive/5"
            onClick={() => { onDelete(event.id); onClose(); toast({ title: "Event deleted" }) }}>
            Delete
          </Button>
          <Button size="sm" className="flex-1 text-xs h-9" onClick={onClose}>Done</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function CalendarPage() {
  const [year, setYear] = React.useState(2026)
  const [month, setMonth] = React.useState(4) // May = index 4
  const [events, setEvents] = React.useState<CalendarEvent[]>(INITIAL_EVENTS)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [defaultDate, setDefaultDate] = React.useState<string | undefined>()
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null)
  const [activeTypeFilter, setActiveTypeFilter] = React.useState<EventType | "all">("all")
  const [viewMode, setViewMode] = React.useState<ViewMode>("month")
  const [weekOffset, setWeekOffset] = React.useState(0)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const eventsThisMonth = events.filter(e => {
    const [y, m] = e.date.split("-").map(Number)
    return y === year && m === month + 1
  })

  const filtered = activeTypeFilter === "all" ? eventsThisMonth : eventsThisMonth.filter(e => e.type === activeTypeFilter)

  const eventsByDate = React.useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    filtered.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [filtered])

  const today = toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const currentMonthStr = `2026-${pad(month + 1)}`

  // Week start for week view: start of current week + weekOffset weeks
  const weekStart = React.useMemo(() => {
    const now = new Date(year, month, 1)
    const dow = now.getDay()
    now.setDate(now.getDate() - dow + weekOffset * 7)
    return now
  }, [year, month, weekOffset])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const jumpToday = () => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setWeekOffset(0)
  }

  const isCurrentMonthToday = year === new Date().getFullYear() && month === new Date().getMonth()

  const openCreate = (date?: string) => {
    setDefaultDate(date)
    setDrawerOpen(true)
  }

  const handleCreate = (e: CalendarEvent) => {
    setEvents(prev => [...prev, e])
  }

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  // Upcoming events (next 30 days from month start)
  const upcoming = events
    .filter(e => e.date >= toDateStr(year, month, 1))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  // Next event countdown
  const nextEvent = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  const daysUntilNext = nextEvent
    ? Math.ceil((new Date(nextEvent.date).getTime() - new Date(today).getTime()) / 86400000)
    : null

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold">Content Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plan your drops, campaigns, and broadcasts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs" onClick={() => exportICS(events)}>
            <Download className="h-3.5 w-3.5" /> Export ICS
          </Button>
          <Button className="gap-1.5" onClick={() => openCreate()}>
            <Plus className="h-4 w-4" /> Schedule Event
          </Button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveTypeFilter("all")}
          className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border", activeTypeFilter === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}
        >
          All
        </button>
        {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => (
          <button key={type} onClick={() => setActiveTypeFilter(type)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5",
              activeTypeFilter === type ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border text-muted-foreground hover:text-foreground"
            )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
          </button>
        ))}

        {/* View mode toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-border p-0.5 bg-muted/30">
          <button onClick={() => setViewMode("month")}
            className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
              viewMode === "month" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            <LayoutGrid className="h-3 w-3" /> Month
          </button>
          <button onClick={() => setViewMode("week")}
            className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
              viewMode === "week" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            <Rows3 className="h-3 w-3" /> Week
          </button>
        </div>
      </div>

      <div className="lg:flex lg:gap-6">
        {/* Calendar */}
        <div className="flex-1 min-w-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <button onClick={viewMode === "month" ? prevMonth : () => setWeekOffset(w => w - 1)}
                className="p-1.5 rounded-xl hover:bg-muted transition-colors border border-border">
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={viewMode === "month" ? nextMonth : () => setWeekOffset(w => w + 1)}
                className="p-1.5 rounded-xl hover:bg-muted transition-colors border border-border">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <h2 className="font-display font-bold text-sm">
              {MONTH_NAMES[month]} {year}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {eventsThisMonth.length} event{eventsThisMonth.length !== 1 ? "s" : ""}
              </span>
            </h2>
            {!isCurrentMonthToday ? (
              <button onClick={jumpToday}
                className="text-xs font-semibold text-brand-purple hover:underline flex items-center gap-1">
                <Clock className="h-3 w-3" /> Today
              </button>
            ) : (
              <div className="w-14" />
            )}
          </div>

          {viewMode === "month" ? (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {DAYS_OF_WEEK.map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const dayNum = idx - firstDay + 1
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth
                  const dateStr = isValid ? toDateStr(year, month, dayNum) : ""
                  const dayEvents = isValid ? (eventsByDate[dateStr] ?? []) : []
                  const isToday = dateStr === today
                  const isWeekend = idx % 7 === 0 || idx % 7 === 6

                  return (
                    <div
                      key={idx}
                      onClick={() => isValid && openCreate(dateStr)}
                      className={cn(
                        "min-h-[80px] p-1.5 border-r border-b border-border last:border-r-0 transition-colors cursor-pointer group",
                        !isValid && "bg-muted/20 cursor-default",
                        isValid && "hover:bg-muted/30",
                        isWeekend && isValid && "bg-muted/10",
                        idx % 7 === 6 && "border-r-0",
                      )}
                    >
                      {isValid && (
                        <>
                          <div className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-lg mb-1 text-xs font-semibold",
                            isToday ? "bg-brand-purple text-white" : "text-muted-foreground group-hover:text-foreground"
                          )}>
                            {dayNum}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 2).map(ev => (
                              <EventChip key={ev.id} event={ev} onClick={() => setSelectedEvent(ev)} />
                            ))}
                            {dayEvents.length > 2 && (
                              <p className="text-[9px] text-muted-foreground pl-1">+{dayEvents.length - 2} more</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <WeekView
              year={year} month={month} weekStart={weekStart}
              events={filtered}
              onEventClick={setSelectedEvent}
              onDayClick={(date) => openCreate(date)}
            />
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 px-1">
            {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                {cfg.label}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Repeat2 className="h-3 w-3" />
              Recurring
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0 mt-5 lg:mt-0">
          {/* Next event countdown */}
          {nextEvent && daysUntilNext !== null && (
            <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4 mb-3">
              <p className="text-[10px] font-semibold text-brand-purple uppercase tracking-wide mb-1">Next event</p>
              <p className="font-display font-bold text-sm truncate">{nextEvent.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {daysUntilNext === 0 ? "Today!" : daysUntilNext === 1 ? "Tomorrow" : `In ${daysUntilNext} days`}
                {nextEvent.time && ` · ${nextEvent.time}`}
              </p>
            </div>
          )}

          {/* Upcoming */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border">
              <h3 className="font-display font-bold text-sm">Upcoming</h3>
            </div>
            <div className="divide-y divide-border">
              {upcoming.length === 0 && (
                <div className="p-5 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No upcoming events</p>
                </div>
              )}
              {upcoming.map(ev => {
                const cfg = EVENT_CONFIG[ev.type]
                const Icon = cfg.icon
                const [, , day] = ev.date.split("-")
                return (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left group"
                  >
                    <div className={cn("mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0", cfg.bg)}>
                      <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold truncate">{ev.title}</p>
                        {ev.recurring && <Repeat2 className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {MONTH_NAMES[month].slice(0, 3)} {parseInt(day)}{ev.time ? ` · ${ev.time}` : ""}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="p-3 border-t border-border">
              <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5" onClick={() => openCreate()}>
                <Plus className="h-3.5 w-3.5" /> Add event
              </Button>
            </div>
          </div>

          {/* This month summary */}
          <div className="rounded-2xl border border-border bg-card p-4 mt-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This month</p>
            {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => {
              const count = eventsThisMonth.filter(e => e.type === type).length
              return (
                <div key={type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                    <span className="text-muted-foreground">{cfg.label}s</span>
                  </div>
                  <span className="font-bold">{count}</span>
                </div>
              )
            })}
            <div className="pt-1 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{eventsThisMonth.length}</span>
            </div>
          </div>

          {/* Events by weekday bar chart */}
          <EventsByWeekday events={eventsThisMonth} />
        </div>
      </div>

      <CreateDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} defaultDate={defaultDate} onCreate={handleCreate} />

      <AnimatePresence>
        {selectedEvent && (
          <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} onDelete={handleDelete} />
        )}
      </AnimatePresence>
    </div>
  )
}
