"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar,
  ShoppingBag, Megaphone, Radio, Zap, Clock,
  MessageCircle, Copy, CheckCheck, ExternalLink,
  Tag, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

type EventType = "drop" | "campaign" | "broadcast" | "promo"

interface CalendarEvent {
  id: string
  type: EventType
  title: string
  date: string          // "YYYY-MM-DD"
  time?: string
  channel?: string
  note?: string
  product?: string
}

const EVENT_CONFIG: Record<EventType, { label: string; color: string; bg: string; border: string; dot: string; icon: React.ElementType }> = {
  drop:      { label: "Product Drop", color: "text-brand-purple", bg: "bg-brand-purple/15", border: "border-brand-purple/25", dot: "bg-brand-purple", icon: ShoppingBag },
  campaign:  { label: "Campaign",     color: "text-brand-coral",  bg: "bg-brand-coral/15",  border: "border-brand-coral/25",  dot: "bg-brand-coral",  icon: Megaphone },
  broadcast: { label: "Broadcast",    color: "text-brand-green",  bg: "bg-brand-green/15",  border: "border-brand-green/25",  dot: "bg-brand-green",  icon: Radio },
  promo:     { label: "Promotion",    color: "text-amber-500",    bg: "bg-amber-500/15",    border: "border-amber-500/25",    dot: "bg-amber-400",    icon: Tag },
}

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: "e1",  type: "drop",      title: "New Ankara Collection Drop",      date: "2026-05-14", time: "10:00 AM", product: "Ankara Peplum Top",    channel: "Instagram + WhatsApp" },
  { id: "e2",  type: "campaign",  title: "Mother's Day Flash Sale",         date: "2026-05-10", time: "12:00 PM", channel: "WhatsApp",              note: "40% off selected items" },
  { id: "e3",  type: "broadcast", title: "Restock Alert — Leather Bags",    date: "2026-05-12", time: "9:00 AM",  channel: "WhatsApp Broadcast",    note: "Notify 847 subscribers" },
  { id: "e4",  type: "promo",     title: "SAVE5K Code Launch",              date: "2026-05-15", channel: "All channels" },
  { id: "e5",  type: "drop",      title: "Aso-Oke Gele Set — Limited Run",  date: "2026-05-20", time: "8:00 AM",  product: "Aso-Oke Gele",         channel: "TikTok + WhatsApp" },
  { id: "e6",  type: "campaign",  title: "Children's Day Promo",            date: "2026-05-27", time: "11:00 AM", channel: "Instagram",              note: "Targeting young mothers" },
  { id: "e7",  type: "broadcast", title: "Weekly Deals Broadcast",          date: "2026-05-18", time: "7:00 AM",  channel: "WhatsApp Broadcast" },
  { id: "e8",  type: "drop",      title: "Premium Perfume Restock",         date: "2026-05-25", time: "2:00 PM",  product: "Perfume Collection Box", channel: "Instagram" },
  { id: "e9",  type: "promo",     title: "VIP25 Loyalty Code",              date: "2026-05-28", channel: "WhatsApp",                                note: "VIP customers only" },
  { id: "e10", type: "campaign",  title: "End of Month Clearance",          date: "2026-05-30", time: "9:00 AM",  channel: "All channels",           note: "Clear excess inventory" },
  { id: "e11", type: "broadcast", title: "June Preview Teaser",             date: "2026-05-31", time: "6:00 PM",  channel: "WhatsApp Broadcast" },
]

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
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

function CreateDrawer({ open, onClose, defaultDate, onCreate }: {
  open: boolean; onClose: () => void; defaultDate?: string; onCreate: (e: CalendarEvent) => void
}) {
  const [form, setForm] = React.useState({
    title: "", type: "drop" as EventType, date: defaultDate ?? "2026-05-14",
    time: "", channel: "", note: "", product: "",
  })

  React.useEffect(() => {
    if (open) setForm(f => ({ ...f, date: defaultDate ?? f.date, title: "", time: "", channel: "", note: "", product: "" }))
  }, [open, defaultDate])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = () => {
    if (!form.title.trim()) { toast({ title: "Add a title for this event" }); return }
    onCreate({
      id: `e${Date.now()}`, type: form.type, title: form.title, date: form.date,
      time: form.time || undefined, channel: form.channel || undefined,
      note: form.note || undefined, product: form.product || undefined,
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
      className={cn("w-full text-left text-[9px] font-semibold px-1.5 py-0.5 rounded-md truncate", cfg.bg, cfg.color, "hover:opacity-80 transition-opacity")}
    >
      {event.title}
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

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

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

  // Upcoming events (next 30 days)
  const upcoming = events
    .filter(e => e.date >= toDateStr(year, month, 1))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold">Content Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plan your drops, campaigns, and broadcasts</p>
        </div>
        <Button className="gap-1.5" onClick={() => openCreate()}>
          <Plus className="h-4 w-4" /> Schedule Event
        </Button>
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
      </div>

      <div className="lg:flex lg:gap-6">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <button onClick={prevMonth} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <h2 className="font-display font-bold text-sm">
                {MONTH_NAMES[month]} {year}
              </h2>
              <button onClick={nextMonth} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

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

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 px-1">
            {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                {cfg.label}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div className="lg:w-64 flex-shrink-0 mt-5 lg:mt-0">
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
                      <p className="text-xs font-semibold truncate">{ev.title}</p>
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
