"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, MessageCircle, ShoppingBag, Users, TrendingUp,
  Star, Download, Phone, MapPin, Clock, X,
  CheckCircle2, Package, Truck, Home, ChevronRight,
  SortAsc, UserPlus, GripVertical, AlertTriangle,
  Cake, ChevronDown, ChevronUp, Filter, ArrowUpDown,
  Sparkles, Heart, BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Customer {
  id: string; name: string; phone: string; location: string
  totalOrders: number; totalSpend: number; lastOrderDate: string
  lastOrderDays: number
  lastProduct: string; segment: "vip" | "repeat" | "new" | "at-risk"; isOnWhatsApp: boolean
  email?: string; notes?: string
  birthday?: string        // "MM-DD" format
  ltv: number              // lifetime value score 0-100
  joinedDate: string
}

type SortKey = "spend" | "orders" | "recent" | "ltv" | "name"
type SortDir = "asc" | "desc"

const mockCustomers: Customer[] = [
  { id: "c1",  name: "Adaeze Okonkwo",    phone: "+234 803 456 7890", location: "Victoria Island, Lagos", totalOrders: 12, totalSpend: 184500, lastOrderDate: "2 days ago",   lastOrderDays: 2,  lastProduct: "Ankara Print Dress",     segment: "vip",      isOnWhatsApp: true,  email: "adaeze@gmail.com", notes: "Loves Ankara prints. Prefers sizes M-L. Always pays on time.", birthday: "03-15", ltv: 94, joinedDate: "Jan 2025" },
  { id: "c2",  name: "Kemi Adeyemi",      phone: "+234 806 123 4567", location: "Ikeja, Lagos",           totalOrders: 8,  totalSpend: 96200,  lastOrderDate: "5 days ago",   lastOrderDays: 5,  lastProduct: "Beaded Necklace Set",    segment: "vip",      isOnWhatsApp: true,  notes: "Birthday in March. Interested in jewellery bundles.", birthday: "05-20", ltv: 79, joinedDate: "Mar 2025" },
  { id: "c3",  name: "Funmilayo Lawal",   phone: "+234 810 987 6543", location: "Lekki Phase 1, Lagos",  totalOrders: 5,  totalSpend: 67300,  lastOrderDate: "1 week ago",   lastOrderDays: 7,  lastProduct: "Leather Mini Bag",       segment: "repeat",   isOnWhatsApp: true,  ltv: 62, joinedDate: "Apr 2025" },
  { id: "c4",  name: "Blessing Eze",      phone: "+234 814 234 5678", location: "Abuja, FCT",            totalOrders: 4,  totalSpend: 54800,  lastOrderDate: "2 weeks ago",  lastOrderDays: 14, lastProduct: "Perfume Collection Box", segment: "repeat",   isOnWhatsApp: true,  birthday: "06-02", ltv: 55, joinedDate: "Feb 2025" },
  { id: "c5",  name: "Chisom Nwachukwu", phone: "+234 802 345 6789", location: "Port Harcourt, Rivers", totalOrders: 2,  totalSpend: 28500,  lastOrderDate: "3 weeks ago",  lastOrderDays: 21, lastProduct: "Silk Blouse",            segment: "new",      isOnWhatsApp: false, ltv: 28, joinedDate: "Apr 2026" },
  { id: "c6",  name: "Ngozi Obi",         phone: "+234 808 567 8901", location: "Enugu",                 totalOrders: 3,  totalSpend: 41200,  lastOrderDate: "1 month ago",  lastOrderDays: 32, lastProduct: "Gold Hoop Earrings",     segment: "at-risk",  isOnWhatsApp: true,  ltv: 40, joinedDate: "Jan 2025" },
  { id: "c7",  name: "Tolani Bakare",     phone: "+234 817 890 1234", location: "Surulere, Lagos",       totalOrders: 6,  totalSpend: 78900,  lastOrderDate: "3 days ago",   lastOrderDays: 3,  lastProduct: "Embroidered Set",        segment: "repeat",   isOnWhatsApp: true,  ltv: 71, joinedDate: "Nov 2024" },
  { id: "c8",  name: "Amaka Eze",         phone: "+234 903 456 7890", location: "Ibadan, Oyo",           totalOrders: 1,  totalSpend: 12000,  lastOrderDate: "4 days ago",   lastOrderDays: 4,  lastProduct: "Beaded Bracelet",        segment: "new",      isOnWhatsApp: true,  ltv: 12, joinedDate: "May 2026" },
  { id: "c9",  name: "Folake Adesanya",   phone: "+234 705 123 4567", location: "Ajah, Lagos",           totalOrders: 9,  totalSpend: 113400, lastOrderDate: "1 week ago",   lastOrderDays: 8,  lastProduct: "Aso-Oke Gele",           segment: "vip",      isOnWhatsApp: true,  birthday: "05-28", ltv: 85, joinedDate: "Sep 2024" },
  { id: "c10", name: "Ifeoma Chukwu",     phone: "+234 816 234 5678", location: "Warri, Delta",          totalOrders: 2,  totalSpend: 32600,  lastOrderDate: "6 weeks ago",  lastOrderDays: 44, lastProduct: "Lace Blouse",            segment: "at-risk",  isOnWhatsApp: false, ltv: 31, joinedDate: "Dec 2024" },
  { id: "c11", name: "Uju Nwosu",         phone: "+234 811 345 6789", location: "Asaba, Delta",          totalOrders: 7,  totalSpend: 89400,  lastOrderDate: "10 days ago",  lastOrderDays: 10, lastProduct: "Kaftan Maxi Dress",      segment: "repeat",   isOnWhatsApp: true,  birthday: "06-10", ltv: 74, joinedDate: "Jun 2024" },
  { id: "c12", name: "Titi Ogunleye",     phone: "+234 705 678 9012", location: "Mushin, Lagos",         totalOrders: 11, totalSpend: 156700, lastOrderDate: "1 day ago",    lastOrderDays: 1,  lastProduct: "Gold Bangle Set",        segment: "vip",      isOnWhatsApp: true,  ltv: 91, joinedDate: "Aug 2024" },
]

const mockOrderHistory = [
  { id: "LM1001", product: "Ankara Print Dress",    amount: 18500, status: "delivered" as const, date: "May 1, 2026" },
  { id: "LM0998", product: "Beaded Necklace Set",   amount: 24000, status: "delivered" as const, date: "Apr 18, 2026" },
  { id: "LM0972", product: "Embroidered Top",       amount: 15500, status: "delivered" as const, date: "Mar 29, 2026" },
]

const orderStatusIcons = {
  confirmed: CheckCircle2, processing: Package, shipped: Truck, delivered: Home,
} as const

const segmentConfig = {
  vip:      { label: "VIP",     color: "text-amber-500",    bg: "bg-amber-500/10 border-amber-500/20",       dot: "bg-amber-400",    hex: "#F59E0B" },
  repeat:   { label: "Repeat",  color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20", dot: "bg-brand-purple", hex: "#6C4EF3" },
  new:      { label: "New",     color: "text-brand-green",  bg: "bg-brand-green/10 border-brand-green/20",   dot: "bg-brand-green",  hex: "#10B981" },
  "at-risk":{ label: "At Risk", color: "text-brand-coral",  bg: "bg-brand-coral/10 border-brand-coral/20",   dot: "bg-brand-coral",  hex: "#F97316" },
}

const segments = ["All", "VIP", "Repeat", "New", "At Risk"]

const stats = [
  { label: "Total Customers",  value: "1,247",   icon: Users,      color: "text-brand-purple", change: "+23 this month" },
  { label: "Avg. Order Value", value: "₦18,400", icon: ShoppingBag,color: "text-brand-green",  change: "+12% vs last month" },
  { label: "Repeat Rate",      value: "64%",      icon: TrendingUp, color: "text-amber-500",    change: "Industry avg: 40%" },
  { label: "VIP Customers",    value: "89",       icon: Star,       color: "text-brand-coral",  change: "7.1% of base" },
]

const SORT_LABELS: Record<SortKey, string> = {
  spend: "Total Spend", orders: "Orders", recent: "Last Active", ltv: "LTV Score", name: "Name",
}

// ── Segment Donut ────────────────────────────────────────────────────────────
function SegmentDonut({ customers }: { customers: Customer[] }) {
  const counts = { vip: 0, repeat: 0, new: 0, "at-risk": 0 }
  customers.forEach(c => { counts[c.segment]++ })
  const total = customers.length || 1

  const segOrder: Customer["segment"][] = ["vip", "repeat", "new", "at-risk"]
  const r = 40, cx = 52, cy = 52, circumference = 2 * Math.PI * r
  let offset = 0

  const slices = segOrder.map(seg => {
    const pct = counts[seg] / total
    const dash = pct * circumference
    const gap  = circumference - dash
    const slice = { seg, pct, dash, gap, offset }
    offset += dash
    return slice
  })

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-brand-purple" />
        <p className="text-sm font-semibold">Segment Breakdown</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width={104} height={104} viewBox="0 0 104 104">
            {slices.map(({ seg, dash, gap, offset }) => (
              <circle key={seg}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={segmentConfig[seg].hex}
                strokeWidth={14}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                style={{ transform: "rotate(-90deg)", transformOrigin: "52px 52px" }}
              />
            ))}
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
              className="font-bold" style={{ fontSize: 16, fill: "currentColor" }}>
              {total}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 8, fill: "#888" }}>
              total
            </text>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
          {segOrder.map(seg => (
            <div key={seg} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: segmentConfig[seg].hex }} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold">{segmentConfig[seg].label}</p>
                <p className="text-[10px] text-muted-foreground">{counts[seg]} ({Math.round((counts[seg] / total) * 100)}%)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── LTV Bar ──────────────────────────────────────────────────────────────────
function LTVBar({ score, segment }: { score: number; segment: Customer["segment"] }) {
  const color = segment === "vip" ? "#F59E0B" : segment === "repeat" ? "#6C4EF3" : segment === "new" ? "#10B981" : "#F97316"
  return (
    <div className="flex items-center gap-1.5" title={`LTV score: ${score}/100`}>
      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{score}</span>
    </div>
  )
}

// ── Upcoming Birthdays ───────────────────────────────────────────────────────
function UpcomingBirthdays({ customers }: { customers: Customer[] }) {
  const today = new Date()
  const upcoming = customers
    .filter(c => c.birthday)
    .map(c => {
      const [mm, dd] = c.birthday!.split("-").map(Number)
      const next = new Date(today.getFullYear(), mm - 1, dd)
      if (next < today) next.setFullYear(today.getFullYear() + 1)
      const daysAway = Math.ceil((next.getTime() - today.getTime()) / 86400000)
      return { ...c, daysAway, nextDate: next }
    })
    .filter(c => c.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway)

  if (upcoming.length === 0) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cake className="h-4 w-4 text-brand-coral" />
        <p className="text-sm font-semibold">Upcoming Birthdays</p>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-coral/10 text-brand-coral border border-brand-coral/20">
          Next 30 days
        </span>
      </div>
      <div className="space-y-2.5">
        {upcoming.slice(0, 4).map(c => (
          <div key={c.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-purple/10 flex items-center justify-center text-xs font-bold text-brand-purple flex-shrink-0">
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {c.daysAway === 0 ? "Today! 🎉" : c.daysAway === 1 ? "Tomorrow" : `In ${c.daysAway} days`}
              </p>
            </div>
            {c.isOnWhatsApp && (
              <a href={`https://wa.me/${c.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Happy Birthday ${c.name.split(" ")[0]}! 🎂🎉 Wishing you a wonderful day! Here's a special gift from us — use code BDAY15 for 15% off your next order! 🛍`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors flex-shrink-0"
                title="Send birthday wish">
                <Heart className="h-3 w-3 fill-[#25D366]" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Re-engagement Queue ──────────────────────────────────────────────────────
function ReengagementQueue({ customers }: { customers: Customer[] }) {
  const [sent, setSent] = React.useState<Set<string>>(new Set())
  const atRisk = customers
    .filter(c => c.segment === "at-risk" && c.isOnWhatsApp)
    .sort((a, b) => b.lastOrderDays - a.lastOrderDays)

  if (atRisk.length === 0) return null

  const markSent = (id: string) => {
    setSent(prev => { const n = new Set(prev); n.add(id); return n })
    toast({ title: "Message sent!", description: "WhatsApp opened in a new tab", variant: "success" })
  }

  return (
    <div className="rounded-2xl border border-brand-coral/25 bg-brand-coral/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-brand-coral" />
        <p className="text-sm font-semibold text-brand-coral">Re-engagement Queue</p>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-coral/10 text-brand-coral border border-brand-coral/20">
          {atRisk.length - sent.size} remaining
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">These customers haven't ordered in 30+ days. A personal message can win them back.</p>
      <div className="space-y-2">
        {atRisk.map(c => (
          <div key={c.id} className={cn(
            "flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all",
            sent.has(c.id) ? "opacity-40" : "bg-background/60"
          )}>
            <div className="w-7 h-7 rounded-lg bg-brand-coral/10 flex items-center justify-center text-xs font-bold text-brand-coral flex-shrink-0">
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">{c.lastOrderDate} · {c.lastProduct}</p>
            </div>
            {sent.has(c.id) ? (
              <CheckCircle2 className="h-4 w-4 text-brand-green flex-shrink-0" />
            ) : (
              <a href={`https://wa.me/${c.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hi ${c.name.split(" ")[0]}! 👋 We miss you at Sade's Boutique! It's been a while since your last order. Come check out what's new — we have beautiful pieces just added 🛍✨`)}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => markSent(c.id)}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#25D366] text-white hover:bg-[#22c55e] transition-colors">
                Message
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Add Customer Modal ───────────────────────────────────────────────────────
function AddCustomerModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Customer) => void }) {
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", location: "", notes: "", segment: "new" as Customer["segment"] })
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Name and phone are required", variant: "error" })
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      const newCustomer: Customer = {
        id: `c${Date.now()}`,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email || undefined,
        location: form.location || "Nigeria",
        notes: form.notes || undefined,
        segment: form.segment,
        isOnWhatsApp: true,
        totalOrders: 0,
        totalSpend: 0,
        lastOrderDate: "Never",
        lastOrderDays: 999,
        lastProduct: "—",
        ltv: 5,
        joinedDate: "May 2026",
      }
      onAdd(newCustomer)
      toast({ title: "Customer added", description: form.name, variant: "success" })
      onClose()
    }, 600)
  }

  const field = (label: string, key: keyof typeof form, type = "text", required = false) => (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1">{label}{required && <span className="text-brand-coral ml-0.5">*</span>}</label>
      <input type={type} value={form[key] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand-purple" />
            <h2 className="font-display font-bold text-base">Add Customer</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {field("Full Name", "name", "text", true)}
          {field("WhatsApp / Phone", "phone", "tel", true)}
          {field("Email", "email", "email")}
          {field("Location", "location")}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Segment</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(segmentConfig) as [Customer["segment"], typeof segmentConfig["vip"]][]).map(([key, cfg]) => (
                <button key={key} type="button"
                  onClick={() => setForm(p => ({ ...p, segment: key }))}
                  className={cn("px-2 py-1.5 rounded-xl border text-[11px] font-semibold transition-all",
                    form.segment === key ? cn(cfg.bg, cfg.color) : "border-border text-muted-foreground hover:border-foreground/20")}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              placeholder="Preferences, notes, referral source…"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30 placeholder:text-muted-foreground" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" className="flex-1 h-9" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" className="flex-1 h-9 gap-1.5" disabled={submitting}>
              {submitting ? <><span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />Adding…</> : <><UserPlus className="h-3.5 w-3.5" />Add Customer</>}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

// ── Bulk Segment Move ────────────────────────────────────────────────────────
function BulkActionsBar({ selected, onClear, onMoveSegment, onWhatsApp }: {
  selected: Set<string>; onClear: () => void
  onMoveSegment: (seg: Customer["segment"]) => void; onWhatsApp: () => void
}) {
  const [segOpen, setSegOpen] = React.useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="rounded-xl border border-brand-purple/30 bg-brand-purple/5 px-4 py-2.5 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-semibold text-brand-purple">{selected.size} selected</span>
      <div className="flex items-center gap-2 flex-wrap flex-1">
        <div className="relative">
          <button onClick={() => setSegOpen(v => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-accent transition-colors">
            <GripVertical className="h-3 w-3" /> Move to segment <ChevronDown className="h-3 w-3 ml-0.5" />
          </button>
          <AnimatePresence>
            {segOpen && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="absolute left-0 top-full mt-1 z-20 w-36 rounded-xl border border-border bg-background shadow-lg p-1">
                {(Object.entries(segmentConfig) as [Customer["segment"], typeof segmentConfig["vip"]][]).map(([key, cfg]) => (
                  <button key={key} onClick={() => { onMoveSegment(key); setSegOpen(false) }}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-accent transition-colors", cfg.color)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />{cfg.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={onWhatsApp}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#22c55e] transition-colors">
          <MessageCircle className="h-3 w-3 fill-white" /> Broadcast
        </button>
      </div>
      <button onClick={onClear} className="ml-auto p-1 rounded-lg hover:bg-accent transition-colors">
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </motion.div>
  )
}

// ── Customer Panel ───────────────────────────────────────────────────────────
function CustomerPanel({ customer, onClose, onUpdate }: {
  customer: Customer; onClose: () => void; onUpdate: (c: Customer) => void
}) {
  const [note, setNote] = React.useState(customer.notes ?? "")
  const [editingNote, setEditingNote] = React.useState(false)
  const [composeOpen, setComposeOpen] = React.useState(false)
  const [customMsg, setCustomMsg] = React.useState("")
  const seg = segmentConfig[customer.segment]

  React.useEffect(() => {
    setNote(customer.notes ?? "")
    setComposeOpen(false)
    setCustomMsg("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id])

  const saveNote = () => {
    setEditingNote(false)
    onUpdate({ ...customer, notes: note })
    toast({ title: "Note saved", variant: "success" })
  }

  const buildWA = (c: Customer) => {
    const clean = c.phone.replace(/\D/g, "")
    const firstName = c.name.split(" ")[0]
    const text = encodeURIComponent(`Hi ${firstName}! 👋 It's Sade from Sade's Boutique. We have new arrivals you might love based on your last order (${c.lastProduct}). Come see! 🛍`)
    return `https://wa.me/${clean}?text=${text}`
  }

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border bg-background shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <h2 className="font-display font-bold text-base">Customer Profile</h2>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-xl font-bold text-brand-purple flex-shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{customer.name}</p>
              <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5", seg.bg, seg.color)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", seg.dot)} />
                {seg.label}
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Customer since {customer.joinedDate}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{customer.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{customer.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Last order: {customer.lastOrderDate}</span>
            </div>
          </div>
        </div>

        {/* Stats + LTV */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          <div className="px-4 py-4 text-center">
            <p className="font-display font-extrabold text-xl">{customer.totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Orders</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="font-display font-extrabold text-xl text-brand-purple">₦{(customer.totalSpend / 1000).toFixed(0)}k</p>
            <p className="text-xs text-muted-foreground mt-0.5">Spent</p>
          </div>
          <div className="px-4 py-4 text-center">
            <div className="flex justify-center mb-1">
              <Sparkles className="h-4 w-4" style={{ color: segmentConfig[customer.segment].hex }} />
            </div>
            <p className="font-display font-extrabold text-xl" style={{ color: segmentConfig[customer.segment].hex }}>{customer.ltv}</p>
            <p className="text-xs text-muted-foreground mt-0.5">LTV</p>
          </div>
        </div>

        {/* Segment update */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Move to segment</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(segmentConfig) as [Customer["segment"], typeof segmentConfig["vip"]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => {
                onUpdate({ ...customer, segment: key })
                toast({ title: `Moved to ${cfg.label}`, variant: "success" })
              }}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all",
                  customer.segment === key ? cn(cfg.bg, cfg.color) : "border-border text-muted-foreground hover:border-foreground/20"
                )}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order history */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent Orders</p>
          <div className="space-y-2">
            {mockOrderHistory.map((order) => {
              const Icon = orderStatusIcons[order.status]
              return (
                <div key={order.id} className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/10 flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-brand-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{order.product}</p>
                    <p className="text-[10px] text-muted-foreground">{order.date}</p>
                  </div>
                  <p className="text-xs font-bold text-brand-purple flex-shrink-0">₦{order.amount.toLocaleString()}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
            <button onClick={() => setEditingNote(true)} className="text-xs text-brand-purple font-semibold hover:underline">
              {editingNote ? "" : note ? "Edit" : "+ Add note"}
            </button>
          </div>
          {editingNote ? (
            <div className="space-y-2">
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                rows={3} placeholder="Add a private note about this customer…"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30 placeholder:text-muted-foreground" />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveNote} className="h-7 text-xs flex-1">Save note</Button>
                <Button size="sm" variant="outline" onClick={() => { setNote(customer.notes ?? ""); setEditingNote(false) }} className="h-7 text-xs">Cancel</Button>
              </div>
            </div>
          ) : (
            note
              ? <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-xl p-3">{note}</p>
              : <p className="text-xs text-muted-foreground italic">No notes yet.</p>
          )}
        </div>
      </div>

      {/* Compose message */}
      <AnimatePresence>
        {composeOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden flex-shrink-0 border-t border-border">
            <div className="p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Custom WhatsApp message</p>
              <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={3} placeholder="Type a message to send…"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30 placeholder:text-muted-foreground leading-relaxed" />
              <a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(customMsg)}`}
                target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" size="sm" className="w-full gap-1.5 h-8 text-xs" disabled={!customMsg.trim()}>
                  <MessageCircle className="h-3 w-3 fill-white" /> Send via WhatsApp
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer actions */}
      <div className="flex-shrink-0 border-t border-border p-4 flex gap-2">
        {customer.isOnWhatsApp && (
          <Button variant="whatsapp" size="sm" className="flex-1 gap-1.5 h-9 text-xs"
            onClick={() => setComposeOpen(v => !v)}>
            <MessageCircle className="h-3.5 w-3.5 fill-white" />
            {composeOpen ? "Close" : "Message"}
          </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1 h-9 text-xs gap-1.5">
          <ShoppingBag className="h-3.5 w-3.5" /> View orders
        </Button>
      </div>
    </motion.div>
  )
}

function exportCustomersCSV(customers: Customer[]) {
  const headers = ["Name", "Phone", "Email", "Location", "Orders", "Total Spend (₦)", "Segment", "LTV Score", "Last Order", "Last Product", "On WhatsApp"]
  const rows = customers.map(c => [
    c.name, c.phone, c.email ?? "", c.location,
    c.totalOrders, c.totalSpend, c.segment, c.ltv, c.lastOrderDate, c.lastProduct, c.isOnWhatsApp ? "Yes" : "No",
  ])
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = `lummy-customers-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

type ApiCustomer = {
  id: string; customer_identifier: string | null; email: string | null; phone: string | null
  total_orders: number; total_revenue: number; lifecycle_stage: string | null
  ai_summary: string | null; last_interaction_at: string | null
}

const LIFECYCLE_TO_SEGMENT: Record<string, Customer["segment"]> = {
  vip: "vip", loyal: "vip", repeat: "repeat", active: "repeat",
  new: "new", "at-risk": "at-risk", churned: "at-risk",
}

function apiCustomerToCRM(c: ApiCustomer, index: number): Customer {
  const daysSince = c.last_interaction_at
    ? Math.round((Date.now() - new Date(c.last_interaction_at).getTime()) / 86_400_000)
    : 999
  const seg = LIFECYCLE_TO_SEGMENT[c.lifecycle_stage ?? ""] ?? "new"
  return {
    id: c.id,
    name: c.customer_identifier ?? c.email ?? c.phone ?? `Customer ${index + 1}`,
    phone: c.phone ?? "",
    location: "",
    totalOrders: c.total_orders ?? 0,
    totalSpend: c.total_revenue ?? 0,
    lastOrderDate: c.last_interaction_at ? `${daysSince}d ago` : "Never",
    lastOrderDays: daysSince,
    lastProduct: "",
    segment: seg,
    isOnWhatsApp: !!(c.phone),
    email: c.email ?? undefined,
    notes: c.ai_summary ?? undefined,
    ltv: Math.min(100, Math.round((c.total_revenue ?? 0) / 1000)),
    joinedDate: "",
  }
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CRMPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [crmLoading, setCrmLoading] = React.useState(true)
  const [search, setSearch]       = React.useState("")
  const [activeSegment, setActiveSegment] = React.useState("All")
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [sortKey, setSortKey]     = React.useState<SortKey>("spend")
  const [sortDir, setSortDir]     = React.useState<SortDir>("desc")
  const [sortOpen, setSortOpen]   = React.useState(false)
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [showSidePanels, setShowSidePanels] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/customers/memory")
      .then(r => r.json())
      .then(({ customers: apiList }) => {
        if (Array.isArray(apiList) && apiList.length > 0) {
          setCustomers(apiList.map((c: ApiCustomer, i: number) => apiCustomerToCRM(c, i)))
        }
      })
      .catch(() => null)
      .finally(() => setCrmLoading(false))
  }, [])

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase()
    return customers.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(q) || c.phone.includes(q) ||
        c.location.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q)
      const matchSegment = activeSegment === "All" || segmentConfig[c.segment].label === activeSegment
      return matchSearch && matchSegment
    }).sort((a, b) => {
      let val = 0
      if (sortKey === "spend")  val = a.totalSpend - b.totalSpend
      if (sortKey === "orders") val = a.totalOrders - b.totalOrders
      if (sortKey === "recent") val = b.lastOrderDays - a.lastOrderDays
      if (sortKey === "ltv")    val = a.ltv - b.ltv
      if (sortKey === "name")   val = a.name.localeCompare(b.name)
      return sortDir === "desc" ? -val : val
    })
  }, [customers, search, activeSegment, sortKey, sortDir])

  const updateCustomer = (updated: Customer) => {
    setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    setSelectedCustomer(updated)
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const bulkMoveSegment = (seg: Customer["segment"]) => {
    setCustomers(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, segment: seg } : c))
    toast({ title: `${selectedIds.size} customers moved to ${segmentConfig[seg].label}`, variant: "success" })
    setSelectedIds(new Set())
  }

  const bulkWhatsApp = () => {
    const targets = customers.filter(c => selectedIds.has(c.id) && c.isOnWhatsApp)
    toast({ title: `Opening ${targets.length} WhatsApp chats…`, description: "Your browser may block multiple tabs. Allow popups if prompted.", variant: "default" })
    targets.slice(0, 5).forEach(c => {
      const clean = c.phone.replace(/\D/g, "")
      const text = encodeURIComponent(`Hi ${c.name.split(" ")[0]}! 👋 It's Sade from Sade's Boutique. We have exciting news for you! 🛍`)
      window.open(`https://wa.me/${clean}?text=${text}`, "_blank")
    })
  }

  const segCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: customers.length, VIP: 0, Repeat: 0, New: 0, "At Risk": 0 }
    customers.forEach(c => { counts[segmentConfig[c.segment].label]++ })
    return counts
  }, [customers])

  const cycleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
    setSortOpen(false)
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-5">
        {/* Page header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Customers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage relationships, track LTV, and drive repeat sales</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-xs"
              onClick={() => exportCustomersCSV(customers)}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" className="gap-1.5 h-9 text-xs"
              onClick={() => setShowAddModal(true)}>
              <UserPlus className="h-3.5 w-3.5" /> Add Customer
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
              <p className="font-display text-xl font-extrabold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Main content: list + side panels */}
        <div className="flex gap-4 items-start">
          {/* Left: customer list */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Filters + sort row */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone, email, location…"
                  className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
              </div>
              {/* Sort dropdown */}
              <div className="relative">
                <button onClick={() => setSortOpen(v => !v)}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-accent transition-colors">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  {SORT_LABELS[sortKey]}
                  {sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                      className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-background shadow-lg p-1">
                      {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                        <button key={key} onClick={() => cycleSort(key)}
                          className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-accent transition-colors",
                            sortKey === key ? "font-semibold text-brand-purple" : "text-muted-foreground")}>
                          {label}
                          {sortKey === key && (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Side panels toggle */}
              <button onClick={() => setShowSidePanels(v => !v)}
                className={cn("flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-colors",
                  showSidePanels ? "border-brand-purple/30 bg-brand-purple/5 text-brand-purple" : "border-border bg-background text-muted-foreground hover:bg-accent")}>
                <Filter className="h-3.5 w-3.5" />
                Insights
              </button>
            </div>

            {/* Segment tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {segments.map((seg) => (
                <button key={seg} onClick={() => setActiveSegment(seg)}
                  className={cn("flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    activeSegment === seg ? "bg-brand-purple text-white border-brand-purple" : "border-border text-muted-foreground hover:border-foreground/20")}>
                  {seg}
                  <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                    activeSegment === seg ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>
                    {segCounts[seg]}
                  </span>
                </button>
              ))}
            </div>

            {/* Bulk actions */}
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <BulkActionsBar
                  selected={selectedIds}
                  onClear={() => setSelectedIds(new Set())}
                  onMoveSegment={bulkMoveSegment}
                  onWhatsApp={bulkWhatsApp}
                />
              )}
            </AnimatePresence>

            {/* Customer list */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="hidden sm:grid grid-cols-[32px_minmax(180px,1fr)_130px_80px_90px_80px_90px_60px] gap-3 px-4 py-2.5 border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                <span />
                <span>Customer</span>
                <span>Location</span>
                <span>
                  <button onClick={() => cycleSort("orders")} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                    Orders <SortAsc className="h-2.5 w-2.5" />
                  </button>
                </span>
                <span>
                  <button onClick={() => cycleSort("spend")} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                    Spent <SortAsc className="h-2.5 w-2.5" />
                  </button>
                </span>
                <span>
                  <button onClick={() => cycleSort("ltv")} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                    LTV <SortAsc className="h-2.5 w-2.5" />
                  </button>
                </span>
                <span>Segment</span>
                <span />
              </div>

              <div className="divide-y divide-border">
                {filtered.map((customer, i) => {
                  const seg = segmentConfig[customer.segment]
                  const isSelected = selectedIds.has(customer.id)
                  return (
                    <motion.div key={customer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        "grid grid-cols-1 sm:grid-cols-[32px_minmax(180px,1fr)_130px_80px_90px_80px_90px_60px] gap-3 px-4 py-3.5 transition-colors cursor-pointer",
                        isSelected ? "bg-brand-purple/5 hover:bg-brand-purple/8" : "hover:bg-accent/50"
                      )}
                      onClick={() => setSelectedCustomer(customer)}>
                      {/* Checkbox */}
                      <div className="flex items-center" onClick={e => toggleSelect(customer.id, e)}>
                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                          isSelected ? "bg-brand-purple border-brand-purple" : "border-border hover:border-brand-purple/50")}>
                          {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      {/* Name */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-purple/10 flex items-center justify-center text-sm font-bold text-brand-purple flex-shrink-0">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{customer.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />{customer.phone}
                          </p>
                        </div>
                      </div>
                      {/* Location */}
                      <div className="flex items-center sm:block">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">{customer.location}</span>
                        </p>
                      </div>
                      {/* Orders */}
                      <div className="flex items-center sm:block">
                        <p className="text-sm font-semibold">{customer.totalOrders}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />{customer.lastOrderDate}
                        </p>
                      </div>
                      {/* Spend */}
                      <div className="flex items-center sm:block">
                        <p className="text-sm font-semibold text-brand-purple">₦{customer.totalSpend.toLocaleString()}</p>
                      </div>
                      {/* LTV */}
                      <div className="flex items-center sm:block">
                        <LTVBar score={customer.ltv} segment={customer.segment} />
                      </div>
                      {/* Segment */}
                      <div className="flex items-center sm:block">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border", seg.bg, seg.color)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", seg.dot)} />{seg.label}
                        </span>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                        {customer.isOnWhatsApp && (
                          <a href={`https://wa.me/${customer.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hi ${customer.name.split(" ")[0]}! 👋`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors"
                            title="Message on WhatsApp">
                            <MessageCircle className="h-3.5 w-3.5 fill-[#25D366]" />
                          </a>
                        )}
                        <Link href={`/dashboard/customers/${customer.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors"
                          onClick={(e) => e.stopPropagation()}>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {crmLoading ? (
                <div className="py-16 text-center text-sm text-muted-foreground">Loading customers…</div>
              ) : filtered.length === 0 && (
                <div className="py-16 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold">
                    {customers.length === 0 ? "No customers yet" : "No customers found"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {customers.length === 0 ? "Customers appear here after their first order" : "Try a different search or filter"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right side panels */}
          <AnimatePresence>
            {showSidePanels && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="hidden xl:block flex-shrink-0 w-64 space-y-3 overflow-hidden">
                <SegmentDonut customers={customers} />
                <UpcomingBirthdays customers={customers} />
                <ReengagementQueue customers={customers} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile side panels (below list on small screens) */}
        <div className="xl:hidden space-y-3">
          <SegmentDonut customers={customers} />
          <UpcomingBirthdays customers={customers} />
          <ReengagementQueue customers={customers} />
        </div>
      </div>

      {/* Customer detail panel */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedCustomer(null)} />
            <CustomerPanel
              customer={selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
              onUpdate={updateCustomer}
            />
          </>
        )}
      </AnimatePresence>

      {/* Add customer modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)} />
            <AddCustomerModal
              onClose={() => setShowAddModal(false)}
              onAdd={(c) => setCustomers(prev => [c, ...prev])}
            />
          </>
        )}
      </AnimatePresence>
    </>
  )
}
