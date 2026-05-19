"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Phone, MapPin, Mail, MessageCircle, ShoppingBag,
  Star, Edit3, Save, X, Package, Truck, Home, CheckCircle2,
  Clock, TrendingUp, Calendar, Tag, ChevronRight, BadgeCheck,
  BarChart3, Repeat, AlertTriangle, Sparkles, ExternalLink,
  Zap, Copy, Check, Plus, Minus, Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Customer {
  id: string; name: string; phone: string; location: string
  totalOrders: number; totalSpend: number; lastOrderDate: string
  lastProduct: string; segment: "vip" | "repeat" | "new" | "at-risk"; isOnWhatsApp: boolean
  email?: string; notes?: string; joinedDate: string; avgOrderValue: number
  favouriteCategory: string; daysSinceLastOrder: number
}

interface OrderRecord {
  id: string; product: string; amount: number
  status: "confirmed" | "processing" | "shipped" | "delivered"; date: string
  items: number; category: string
}

interface ActivityItem {
  id: string; type: "order" | "message" | "review" | "segment_change" | "note"
  title: string; body: string; date: string
}

const mockCustomers: Customer[] = [
  { id: "c1", name: "Adaeze Okonkwo",    phone: "+234 803 456 7890", location: "Victoria Island, Lagos", totalOrders: 12, totalSpend: 184500, lastOrderDate: "May 10, 2026", lastProduct: "Ankara Print Dress",     segment: "vip",      isOnWhatsApp: true,  email: "adaeze@gmail.com", notes: "Loves Ankara prints. Prefers sizes M-L. Always pays on time.", joinedDate: "Jan 12, 2025", avgOrderValue: 15375, favouriteCategory: "Fashion",        daysSinceLastOrder: 2  },
  { id: "c2", name: "Kemi Adeyemi",      phone: "+234 806 123 4567", location: "Ikeja, Lagos",           totalOrders: 8,  totalSpend: 96200,  lastOrderDate: "May 7, 2026",  lastProduct: "Beaded Necklace Set",    segment: "vip",      isOnWhatsApp: true,  notes: "Birthday in March. Interested in jewellery bundles.",            joinedDate: "Mar 5, 2025",  avgOrderValue: 12025, favouriteCategory: "Jewellery",      daysSinceLastOrder: 5  },
  { id: "c3", name: "Funmilayo Lawal",   phone: "+234 810 987 6543", location: "Lekki Phase 1, Lagos",  totalOrders: 5,  totalSpend: 67300,  lastOrderDate: "May 5, 2026",  lastProduct: "Leather Mini Bag",       segment: "repeat",   isOnWhatsApp: true,  joinedDate: "Jun 20, 2025",  avgOrderValue: 13460, favouriteCategory: "Accessories",    daysSinceLastOrder: 7  },
  { id: "c4", name: "Blessing Eze",      phone: "+234 814 234 5678", location: "Abuja, FCT",            totalOrders: 4,  totalSpend: 54800,  lastOrderDate: "Apr 28, 2026", lastProduct: "Perfume Collection Box", segment: "repeat",   isOnWhatsApp: true,  joinedDate: "Aug 14, 2025",  avgOrderValue: 13700, favouriteCategory: "Beauty",         daysSinceLastOrder: 14 },
  { id: "c5", name: "Chisom Nwachukwu", phone: "+234 802 345 6789", location: "Port Harcourt, Rivers", totalOrders: 2,  totalSpend: 28500,  lastOrderDate: "Apr 21, 2026", lastProduct: "Silk Blouse",            segment: "new",      isOnWhatsApp: false, joinedDate: "Apr 1, 2026",   avgOrderValue: 14250, favouriteCategory: "Fashion",        daysSinceLastOrder: 21 },
  { id: "c6", name: "Ngozi Obi",         phone: "+234 808 567 8901", location: "Enugu",                 totalOrders: 3,  totalSpend: 41200,  lastOrderDate: "Apr 12, 2026", lastProduct: "Gold Hoop Earrings",     segment: "at-risk",  isOnWhatsApp: true,  joinedDate: "Nov 3, 2024",   avgOrderValue: 13733, favouriteCategory: "Jewellery",      daysSinceLastOrder: 30 },
  { id: "c7", name: "Tolani Bakare",     phone: "+234 817 890 1234", location: "Surulere, Lagos",       totalOrders: 6,  totalSpend: 78900,  lastOrderDate: "May 9, 2026",  lastProduct: "Embroidered Set",        segment: "repeat",   isOnWhatsApp: true,  joinedDate: "Feb 28, 2025",  avgOrderValue: 13150, favouriteCategory: "Fashion",        daysSinceLastOrder: 3  },
  { id: "c8", name: "Amaka Eze",         phone: "+234 903 456 7890", location: "Ibadan, Oyo",           totalOrders: 1,  totalSpend: 12000,  lastOrderDate: "May 8, 2026",  lastProduct: "Beaded Bracelet",        segment: "new",      isOnWhatsApp: true,  joinedDate: "May 5, 2026",   avgOrderValue: 12000, favouriteCategory: "Jewellery",      daysSinceLastOrder: 4  },
  { id: "c9", name: "Folake Adesanya",   phone: "+234 705 123 4567", location: "Ajah, Lagos",           totalOrders: 9,  totalSpend: 113400, lastOrderDate: "May 5, 2026",  lastProduct: "Aso-Oke Gele",           segment: "vip",      isOnWhatsApp: true,  joinedDate: "Dec 1, 2024",   avgOrderValue: 12600, favouriteCategory: "Traditional Wear", daysSinceLastOrder: 7  },
  { id: "c10",name: "Ifeoma Chukwu",     phone: "+234 816 234 5678", location: "Warri, Delta",          totalOrders: 2,  totalSpend: 32600,  lastOrderDate: "Mar 30, 2026", lastProduct: "Lace Blouse",            segment: "at-risk",  isOnWhatsApp: false, joinedDate: "Jan 20, 2026",  avgOrderValue: 16300, favouriteCategory: "Fashion",        daysSinceLastOrder: 43 },
]

const mockOrdersByCustomer: Record<string, OrderRecord[]> = {
  c1: [
    { id: "LM1058", product: "Ankara Print Dress", amount: 18500, status: "delivered", date: "May 10, 2026", items: 1, category: "Fashion" },
    { id: "LM1021", product: "Embroidered Blouse", amount: 14500, status: "delivered", date: "Apr 18, 2026", items: 1, category: "Fashion" },
    { id: "LM0998", product: "Beaded Necklace Set", amount: 24000, status: "delivered", date: "Mar 29, 2026", items: 2, category: "Jewellery" },
    { id: "LM0972", product: "Ankara Wrap Skirt",   amount: 12500, status: "delivered", date: "Mar 2, 2026",  items: 1, category: "Fashion" },
    { id: "LM0941", product: "Leather Tote Bag",    amount: 32000, status: "delivered", date: "Feb 14, 2026", items: 1, category: "Accessories" },
    { id: "LM0901", product: "Silk Headband Set",   amount: 8500,  status: "delivered", date: "Jan 20, 2026", items: 3, category: "Accessories" },
  ],
  c2: [
    { id: "LM1044", product: "Beaded Necklace Set", amount: 24000, status: "delivered", date: "May 7, 2026",  items: 2, category: "Jewellery" },
    { id: "LM1009", product: "Gold Hoop Earrings",  amount: 18500, status: "delivered", date: "Apr 10, 2026", items: 1, category: "Jewellery" },
    { id: "LM0980", product: "Pearl Bracelet",       amount: 14000, status: "delivered", date: "Mar 15, 2026", items: 1, category: "Jewellery" },
  ],
  c3: [
    { id: "LM1037", product: "Leather Mini Bag", amount: 28500, status: "delivered", date: "May 5, 2026",  items: 1, category: "Accessories" },
    { id: "LM1002", product: "Silk Scarf",         amount: 12000, status: "delivered", date: "Apr 8, 2026",  items: 1, category: "Accessories" },
  ],
}

const activityByCustomer: Record<string, ActivityItem[]> = {
  c1: [
    { id: "a1", type: "order",          title: "Order placed",         body: "Ankara Print Dress · ₦18,500",         date: "May 10, 2026" },
    { id: "a2", type: "message",        title: "WhatsApp sent",        body: "New arrivals message sent",             date: "May 3, 2026"  },
    { id: "a3", type: "order",          title: "Order placed",         body: "Embroidered Blouse · ₦14,500",          date: "Apr 18, 2026" },
    { id: "a4", type: "review",         title: "Left a 5-star review", body: "\"Beautiful craftsmanship!\"",          date: "Apr 20, 2026" },
    { id: "a5", type: "segment_change", title: "Upgraded to VIP",      body: "Crossed ₦100k lifetime spend",         date: "Mar 15, 2026" },
    { id: "a6", type: "order",          title: "Order placed",         body: "Beaded Necklace Set · ₦24,000",        date: "Mar 29, 2026" },
    { id: "a7", type: "note",           title: "Note added",           body: "Prefers M-L, loves Ankara prints",     date: "Feb 20, 2026" },
    { id: "a8", type: "order",          title: "Order placed",         body: "Leather Tote Bag · ₦32,000",           date: "Feb 14, 2026" },
  ],
}

const segmentConfig = {
  vip:       { label: "VIP",     icon: Star,          color: "text-amber-500",    bg: "bg-amber-500/10 border-amber-500/20",       dot: "bg-amber-400" },
  repeat:    { label: "Repeat",  icon: Repeat,        color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20", dot: "bg-brand-purple" },
  new:       { label: "New",     icon: Sparkles,      color: "text-brand-green",  bg: "bg-brand-green/10 border-brand-green/20",   dot: "bg-brand-green" },
  "at-risk": { label: "At Risk", icon: AlertTriangle, color: "text-brand-coral",  bg: "bg-brand-coral/10 border-brand-coral/20",   dot: "bg-brand-coral" },
}

const statusConfig = {
  confirmed:  { label: "Confirmed",  icon: CheckCircle2, color: "text-brand-purple", bg: "bg-brand-purple/10" },
  processing: { label: "Processing", icon: Package,      color: "text-amber-500",    bg: "bg-amber-500/10" },
  shipped:    { label: "Shipped",    icon: Truck,        color: "text-blue-500",     bg: "bg-blue-500/10" },
  delivered:  { label: "Delivered",  icon: Home,         color: "text-brand-green",  bg: "bg-brand-green/10" },
}

const activityTypeConfig: Record<ActivityItem["type"], { icon: React.ElementType; color: string; bg: string }> = {
  order:          { icon: ShoppingBag, color: "text-brand-purple", bg: "bg-brand-purple/10" },
  message:        { icon: MessageCircle, color: "text-[#25D366]",  bg: "bg-[#25D366]/10"   },
  review:         { icon: Star,         color: "text-amber-500",   bg: "bg-amber-500/10"   },
  segment_change: { icon: BadgeCheck,   color: "text-brand-green", bg: "bg-brand-green/10" },
  note:           { icon: Edit3,        color: "text-brand-coral", bg: "bg-brand-coral/10" },
}

const NOTES_KEY = "lummy_customer_notes"
const TAGS_KEY  = "lummy_customer_tags"

function loadNote(id: string, fallback?: string): string {
  if (typeof window === "undefined") return fallback ?? ""
  return localStorage.getItem(`${NOTES_KEY}_${id}`) ?? (fallback ?? "")
}
function saveNoteLS(id: string, note: string) { localStorage.setItem(`${NOTES_KEY}_${id}`, note) }

function loadTags(id: string): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(`${TAGS_KEY}_${id}`) ?? "[]") } catch { return [] }
}
function saveTagsLS(id: string, tags: string[]) { localStorage.setItem(`${TAGS_KEY}_${id}`, JSON.stringify(tags)) }

function generateDiscountCode(name: string): string {
  const prefix = name.split(" ")[0].toUpperCase().slice(0, 4)
  const num = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}${num}`
}

// ── Next Best Action ──────────────────────────────────────────────────────────
function NextBestAction({ customer }: { customer: Customer }) {
  const actions: Record<Customer["segment"], { icon: React.ElementType; title: string; body: string; cta: string; color: string }> = {
    vip:      { icon: Star,          title: "Exclusive preview",   body: "Send this VIP an early look at your next collection before it goes live.", cta: "Send preview",    color: "text-amber-500"    },
    repeat:   { icon: Repeat,        title: "Unlock loyalty perk", body: "They're close to VIP status. A small loyalty discount could tip them over.", cta: "Send offer",      color: "text-brand-purple" },
    new:      { icon: Sparkles,      title: "Nurture first-timer", body: "Follow up 3 days after their order. Personal touch converts new to repeat.",   cta: "Send follow-up",  color: "text-brand-green"  },
    "at-risk":{ icon: AlertTriangle, title: "Win-back campaign",   body: `${customer.name.split(" ")[0]} hasn't ordered in ${customer.daysSinceLastOrder} days. A discount code could bring them back.`, cta: "Send discount", color: "text-brand-coral" },
  }
  const a = actions[customer.segment]
  const Icon = a.icon
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-3.5 w-3.5 text-brand-purple" />
        <p className="text-[10px] font-semibold text-brand-purple uppercase tracking-wider">AI Suggestion</p>
      </div>
      <div className="flex items-start gap-2.5">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-background border border-border")}>
          <Icon className={cn("h-3.5 w-3.5", a.color)} />
        </div>
        <div>
          <p className="text-xs font-semibold">{a.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{a.body}</p>
          <button onClick={() => toast({ title: a.cta + " sent!", variant: "success" })}
            className="mt-2 text-[10px] text-brand-purple font-semibold hover:underline flex items-center gap-0.5">
            {a.cta} <ChevronRight className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Discount Generator ────────────────────────────────────────────────────────
function DiscountGenerator({ customer }: { customer: Customer }) {
  const [code, setCode] = React.useState(() => generateDiscountCode(customer.name))
  const [discount, setDiscount] = React.useState(10)
  const [copied, setCopied] = React.useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
      toast({ title: `Code ${code} copied!`, variant: "success" })
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Generate Discount</p>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setDiscount(d => Math.max(5, d - 5))} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <Minus className="h-3 w-3" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-display font-extrabold text-xl text-brand-purple">{discount}%</p>
          <p className="text-[9px] text-muted-foreground">off next order</p>
        </div>
        <button onClick={() => setDiscount(d => Math.min(50, d + 5))} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-dashed border-border mb-2">
        <span className="flex-1 text-xs font-mono font-bold text-center tracking-widest">{code}</span>
        <button onClick={copy} className="p-1 rounded-lg hover:bg-background transition-colors">
          {copied ? <Check className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => setCode(generateDiscountCode(customer.name))}
          className="flex-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Regenerate</button>
        {customer.isOnWhatsApp && (
          <a href={`https://wa.me/${customer.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hi ${customer.name.split(" ")[0]}! 🎁 Here's a special ${discount}% off code just for you: *${code}*. Use it on your next order! 💜`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-[10px] font-semibold text-[#25D366] hover:underline">
            Send on WhatsApp
          </a>
        )}
      </div>
    </motion.div>
  )
}

// ── Customer Tags ─────────────────────────────────────────────────────────────
function CustomerTags({ customerId }: { customerId: string }) {
  const [tags, setTags]       = React.useState<string[]>(() => loadTags(customerId))
  const [input, setInput]     = React.useState("")
  const [adding, setAdding]   = React.useState(false)

  const addTag = () => {
    const t = input.trim().toLowerCase()
    if (!t || tags.includes(t)) { setInput(""); setAdding(false); return }
    const next = [...tags, t]
    setTags(next); saveTagsLS(customerId, next); setInput(""); setAdding(false)
  }
  const removeTag = (t: string) => {
    const next = tags.filter(x => x !== t)
    setTags(next); saveTagsLS(customerId, next)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tags</p>
        <button onClick={() => setAdding(v => !v)} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className="group flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-[10px] font-semibold text-brand-purple">
            {t}
            <button onClick={() => removeTag(t)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        {tags.length === 0 && !adding && (
          <p className="text-[10px] text-muted-foreground italic">No tags yet</p>
        )}
      </div>
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
            <div className="flex gap-1.5 mt-1">
              <input autoFocus value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addTag(); if (e.key === "Escape") { setAdding(false); setInput("") } }}
                placeholder="e.g. early-adopter"
                className="flex-1 h-7 px-2.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple/40" />
              <button onClick={addTag} className="h-7 px-2.5 rounded-lg bg-brand-purple text-white text-[10px] font-semibold">Add</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
function ActivityFeed({ customerId }: { customerId: string }) {
  const items = activityByCustomer[customerId] ?? []
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-12 text-center">
        <Activity className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No activity recorded yet</p>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interaction Timeline</p>
      </div>
      <div className="divide-y divide-border/60">
        {items.map((item, i) => {
          const cfg = activityTypeConfig[item.type]
          const Icon = cfg.icon
          return (
            <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 px-5 py-3 hover:bg-accent/30 transition-colors">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 mt-0.5", cfg.bg)}>
                <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.body}</p>
              </div>
              <p className="text-[10px] text-muted-foreground flex-shrink-0">{item.date}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomerProfilePage() {
  const params   = useParams()
  const router   = useRouter()
  const customerId = params.customerId as string
  const customer   = mockCustomers.find((c) => c.id === customerId)

  const [note, setNote]           = React.useState("")
  const [editingNote, setEditingNote] = React.useState(false)
  const [composeOpen, setComposeOpen] = React.useState(false)
  const [customMsg, setCustomMsg]   = React.useState("")
  const [activeTab, setActiveTab]   = React.useState<"orders" | "analytics" | "activity">("orders")

  React.useEffect(() => {
    if (customer) setNote(loadNote(customer.id, customer.notes))
  }, [customer])

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold">Customer not found</p>
        <Link href="/dashboard/crm">
          <Button size="sm" variant="outline" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back to CRM</Button>
        </Link>
      </div>
    )
  }

  const seg = segmentConfig[customer.segment]
  const SegIcon = seg.icon
  const orders = mockOrdersByCustomer[customer.id] ?? []

  const buildWA = (msg?: string) => {
    const clean = customer.phone.replace(/\D/g, "")
    const firstName = customer.name.split(" ")[0]
    const text = msg ?? `Hi ${firstName}! 👋 It's Sade from Sade's Boutique. We have new arrivals you might love based on your last order (${customer.lastProduct}). Come see! 🛍`
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`
  }

  const handleSaveNote = () => {
    saveNoteLS(customer.id, note)
    setEditingNote(false)
    toast({ title: "Note saved", variant: "success" })
  }

  // Predicted next order: avg order interval in days
  const intervalDays = Math.round(365 / Math.max(customer.totalOrders, 1))
  const nextOrderIn  = Math.max(0, intervalDays - customer.daysSinceLastOrder)
  const spendRank    = customer.segment === "vip" ? "Top 10%" : customer.segment === "repeat" ? "Top 30%" : "All customers"

  const statCards = [
    { label: "Lifetime Value",  value: `₦${customer.totalSpend.toLocaleString()}`,   icon: TrendingUp, color: "text-brand-purple", sub: spendRank },
    { label: "Total Orders",    value: customer.totalOrders.toString(),               icon: ShoppingBag,color: "text-brand-green",  sub: `Avg ₦${customer.avgOrderValue.toLocaleString()}` },
    { label: "Fav Category",    value: customer.favouriteCategory,                    icon: Tag,        color: "text-amber-500",    sub: "Most purchased" },
    { label: "Next Order",      value: nextOrderIn === 0 ? "Overdue" : `~${nextOrderIn}d`, icon: Calendar, color: nextOrderIn === 0 ? "text-brand-coral" : "text-brand-green", sub: `Avg every ${intervalDays} days` },
  ]

  // Spend by month (last 6)
  const spendMonths = orders.length > 0
    ? orders.slice(0, 6).map(o => o.amount).reverse()
    : [12000, 24000, 8500, 32000, 14500, 18500]
  const maxSpend = Math.max(...spendMonths)

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      {/* Back nav */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <span>/</span>
        <Link href="/dashboard/crm" className="hover:text-foreground transition-colors">Customers</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{customer.name}</span>
      </div>

      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-2xl font-bold text-brand-purple border border-brand-purple/15">
              {customer.name.charAt(0)}
            </div>
            {customer.isOnWhatsApp && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center border-2 border-background">
                <MessageCircle className="h-2.5 w-2.5 text-white fill-white" />
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-xl font-extrabold">{customer.name}</h1>
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border", seg.bg, seg.color)}>
                <SegIcon className="h-3 w-3" />{seg.label}
              </span>
              {customer.segment === "vip" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500">
                  <BadgeCheck className="h-2.5 w-2.5" /> Verified VIP
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{customer.email}</span>}
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{customer.location}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Since {customer.joinedDate}</span>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {customer.isOnWhatsApp && (
              <a href={buildWA()} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" size="sm" className="gap-1.5 h-9 text-xs">
                  <MessageCircle className="h-3.5 w-3.5 fill-white" /> Message
                </Button>
              </a>
            )}
            <Link href={`/dashboard/orders?customer=${customer.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs">
                <ShoppingBag className="h-3.5 w-3.5" /> Orders
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
              <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
            </div>
            <p className="font-display text-lg font-extrabold leading-tight">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl border border-border bg-muted/30 w-fit">
            {(["orders", "analytics", "activity"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                  activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {tab === "orders" ? "Orders" : tab === "analytics" ? "Analytics" : "Activity"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-border bg-card overflow-hidden">
                {orders.length === 0 ? (
                  <div className="py-16 text-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-semibold">No orders yet</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden sm:grid grid-cols-[1fr_120px_100px_80px] gap-4 px-5 py-2.5 border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                      <span>Product</span><span>Date</span><span>Status</span><span className="text-right">Amount</span>
                    </div>
                    <div className="divide-y divide-border">
                      {orders.map((order, i) => {
                        const sc = statusConfig[order.status]
                        const StatusIcon = sc.icon
                        return (
                          <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_120px_100px_80px] gap-2 sm:gap-4 px-5 py-3.5 items-center hover:bg-accent/30 transition-colors">
                            <div>
                              <p className="text-sm font-semibold">{order.product}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">#{order.id} · {order.items} item{order.items !== 1 ? "s" : ""} · {order.category}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{order.date}</p>
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit", sc.bg, sc.color)}>
                              <StatusIcon className="h-2.5 w-2.5" />{sc.label}
                            </span>
                            <p className="text-sm font-bold text-right text-brand-purple">₦{order.amount.toLocaleString()}</p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-3">
                {/* Spend over time */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Spend Over Time</p>
                  <div className="flex items-end gap-1.5 h-24">
                    {spendMonths.map((v, i) => {
                      const pct = (v / maxSpend) * 100
                      const isLast = i === spendMonths.length - 1
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`₦${v.toLocaleString()}`}>
                          <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                            transition={{ delay: i * 0.08, type: "spring", damping: 20 }}
                            className={cn("w-full rounded-t-md transition-colors",
                              isLast ? "bg-brand-purple hover:bg-brand-purple/80" : "bg-brand-purple/20 hover:bg-brand-purple/40")}
                            style={{ minHeight: 4 }} />
                          {isLast && (
                            <span className="text-[8px] font-bold text-brand-purple">NOW</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    {["Dec", "Jan", "Feb", "Mar", "Apr", "May"].map((m) => (
                      <p key={m} className="flex-1 text-center text-[9px] text-muted-foreground">{m}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Total: <span className="font-semibold text-foreground">₦{customer.totalSpend.toLocaleString()}</span> across {customer.totalOrders} orders</p>
                </div>

                {/* Category breakdown */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Category Breakdown</p>
                  <div className="space-y-3">
                    {[
                      { category: customer.favouriteCategory, pct: 62, amount: Math.round(customer.totalSpend * 0.62) },
                      { category: "Accessories",              pct: 25, amount: Math.round(customer.totalSpend * 0.25) },
                      { category: "Other",                    pct: 13, amount: Math.round(customer.totalSpend * 0.13) },
                    ].map((row, i) => (
                      <div key={row.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{row.category}</span>
                          <span className="text-xs text-muted-foreground">₦{row.amount.toLocaleString()} ({row.pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${row.pct}%` }}
                            transition={{ delay: i * 0.1 + 0.2, type: "spring", damping: 20 }}
                            className="h-full rounded-full bg-brand-purple" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Behaviour insights */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Behaviour Insights</p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Payment method",     value: "Bank transfer" },
                      { label: "Preferred contact",  value: customer.isOnWhatsApp ? "WhatsApp" : "Email" },
                      { label: "Order frequency",    value: `Every ~${intervalDays} days` },
                      { label: "Predicted next order", value: nextOrderIn === 0 ? "Overdue!" : `In ~${nextOrderIn} days` },
                      { label: "Repeat customer since", value: customer.joinedDate },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className={cn("text-xs font-semibold", row.label === "Predicted next order" && nextOrderIn === 0 ? "text-brand-coral" : "")}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "activity" && (
              <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <ActivityFeed customerId={customer.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Notes */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Private Notes</p>
              {!editingNote ? (
                <button onClick={() => setEditingNote(true)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={handleSaveNote} className="p-1 rounded-lg hover:bg-brand-green/10 text-brand-green transition-colors"><Save className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { setNote(loadNote(customer.id, customer.notes)); setEditingNote(false) }}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
            {editingNote ? (
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
                placeholder="Add a private note about this customer…"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30 placeholder:text-muted-foreground leading-relaxed"
                autoFocus />
            ) : note ? (
              <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-xl p-3">{note}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">No notes yet. Click edit to add one.</p>
            )}
          </motion.div>

          {/* Tags */}
          <CustomerTags customerId={customer.id} />

          {/* Next best action */}
          <NextBestAction customer={customer} />

          {/* Discount generator */}
          <DiscountGenerator customer={customer} />

          {/* WhatsApp quick messages */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Message</p>
              <button onClick={() => setComposeOpen(v => !v)} className={cn("p-1 rounded-lg transition-colors text-muted-foreground hover:text-foreground", composeOpen ? "bg-muted" : "hover:bg-muted")}>
                <MessageCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "New arrivals",   msg: `Hi ${customer.name.split(" ")[0]}! 👋 We have new arrivals based on your last purchase. Come check them out! 🛍` },
                { label: "Special offer",  msg: `Hi ${customer.name.split(" ")[0]}! 🎉 Special offer just for you — 10% off. Use code LOYAL10!` },
                { label: "Re-engage",      msg: `Hi ${customer.name.split(" ")[0]}! 👋 We miss you! It's been a while — come see what's new 🌟` },
                { label: "Birthday wish",  msg: `Happy Birthday ${customer.name.split(" ")[0]}! 🎂🎉 Here's 15% off as a birthday gift — code: BDAY15 💜` },
              ].map((tpl) => (
                <a key={tpl.label} href={buildWA(tpl.msg)} target="_blank" rel="noopener noreferrer"
                  className={cn("flex items-center justify-between w-full px-3 py-2 rounded-xl border border-border text-left hover:border-[#25D366]/40 hover:bg-[#25D366]/5 transition-colors group",
                    !customer.isOnWhatsApp && "opacity-40 pointer-events-none")}>
                  <span className="text-xs font-medium">{tpl.label}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-[#25D366] transition-colors" />
                </a>
              ))}
            </div>
            <AnimatePresence>
              {composeOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3">
                  <textarea value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} rows={3}
                    placeholder="Type a custom message…"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 placeholder:text-muted-foreground leading-relaxed" />
                  <a href={buildWA(customMsg)} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    <Button variant="whatsapp" size="sm" className="w-full gap-1.5 h-8 text-xs" disabled={!customMsg.trim() || !customer.isOnWhatsApp}>
                      <MessageCircle className="h-3 w-3 fill-white" /> Send via WhatsApp
                    </Button>
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
            {!customer.isOnWhatsApp && (
              <p className="text-[10px] text-muted-foreground mt-3 text-center">This customer is not on WhatsApp</p>
            )}
          </motion.div>

          {/* Quick links */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Links</p>
            <div className="space-y-1">
              {[
                { label: "View all orders",  href: `/dashboard/orders?customer=${customer.id}`, icon: ShoppingBag },
                { label: "Send broadcast",   href: "/dashboard/broadcast",                       icon: BarChart3   },
                { label: "Add to campaign",  href: "/dashboard/campaigns",                       icon: Tag         },
              ].map((link) => (
                <Link key={link.label} href={link.href}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-accent transition-colors group">
                  <div className="flex items-center gap-2.5 text-xs font-medium">
                    <link.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-brand-purple transition-colors" />
                    {link.label}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
