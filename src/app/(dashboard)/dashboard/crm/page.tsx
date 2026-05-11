"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, MessageCircle, ShoppingBag, Users, TrendingUp,
  Star, Download, Phone, MapPin, Clock, X,
  CheckCircle2, Package, Truck, Home, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Customer {
  id: string; name: string; phone: string; location: string
  totalOrders: number; totalSpend: number; lastOrderDate: string
  lastProduct: string; segment: "vip" | "repeat" | "new" | "at-risk"; isOnWhatsApp: boolean
  email?: string; notes?: string
}

const mockCustomers: Customer[] = [
  { id: "c1", name: "Adaeze Okonkwo", phone: "+234 803 456 7890", location: "Victoria Island, Lagos", totalOrders: 12, totalSpend: 184500, lastOrderDate: "2 days ago", lastProduct: "Ankara Print Dress", segment: "vip", isOnWhatsApp: true, email: "adaeze@gmail.com", notes: "Loves Ankara prints. Prefers sizes M-L. Always pays on time." },
  { id: "c2", name: "Kemi Adeyemi", phone: "+234 806 123 4567", location: "Ikeja, Lagos", totalOrders: 8, totalSpend: 96200, lastOrderDate: "5 days ago", lastProduct: "Beaded Necklace Set", segment: "vip", isOnWhatsApp: true, notes: "Birthday in March. Interested in jewellery bundles." },
  { id: "c3", name: "Funmilayo Lawal", phone: "+234 810 987 6543", location: "Lekki Phase 1, Lagos", totalOrders: 5, totalSpend: 67300, lastOrderDate: "1 week ago", lastProduct: "Leather Mini Bag", segment: "repeat", isOnWhatsApp: true },
  { id: "c4", name: "Blessing Eze", phone: "+234 814 234 5678", location: "Abuja, FCT", totalOrders: 4, totalSpend: 54800, lastOrderDate: "2 weeks ago", lastProduct: "Perfume Collection Box", segment: "repeat", isOnWhatsApp: true },
  { id: "c5", name: "Chisom Nwachukwu", phone: "+234 802 345 6789", location: "Port Harcourt, Rivers", totalOrders: 2, totalSpend: 28500, lastOrderDate: "3 weeks ago", lastProduct: "Silk Blouse", segment: "new", isOnWhatsApp: false },
  { id: "c6", name: "Ngozi Obi", phone: "+234 808 567 8901", location: "Enugu", totalOrders: 3, totalSpend: 41200, lastOrderDate: "1 month ago", lastProduct: "Gold Hoop Earrings", segment: "at-risk", isOnWhatsApp: true },
  { id: "c7", name: "Tolani Bakare", phone: "+234 817 890 1234", location: "Surulere, Lagos", totalOrders: 6, totalSpend: 78900, lastOrderDate: "3 days ago", lastProduct: "Embroidered Set", segment: "repeat", isOnWhatsApp: true },
  { id: "c8", name: "Amaka Eze", phone: "+234 903 456 7890", location: "Ibadan, Oyo", totalOrders: 1, totalSpend: 12000, lastOrderDate: "4 days ago", lastProduct: "Beaded Bracelet", segment: "new", isOnWhatsApp: true },
  { id: "c9", name: "Folake Adesanya", phone: "+234 705 123 4567", location: "Ajah, Lagos", totalOrders: 9, totalSpend: 113400, lastOrderDate: "1 week ago", lastProduct: "Aso-Oke Gele", segment: "vip", isOnWhatsApp: true },
  { id: "c10", name: "Ifeoma Chukwu", phone: "+234 816 234 5678", location: "Warri, Delta", totalOrders: 2, totalSpend: 32600, lastOrderDate: "6 weeks ago", lastProduct: "Lace Blouse", segment: "at-risk", isOnWhatsApp: false },
]

const mockOrderHistory = [
  { id: "LM1001", product: "Ankara Print Dress", amount: 18500, status: "delivered" as const, date: "May 1, 2026" },
  { id: "LM0998", product: "Beaded Necklace Set", amount: 24000, status: "delivered" as const, date: "Apr 18, 2026" },
  { id: "LM0972", product: "Embroidered Top", amount: 15500, status: "delivered" as const, date: "Mar 29, 2026" },
]

const orderStatusIcons = {
  confirmed: CheckCircle2, processing: Package, shipped: Truck, delivered: Home,
} as const

const segmentConfig = {
  vip:      { label: "VIP",     color: "text-amber-500",    bg: "bg-amber-500/10 border-amber-500/20",    dot: "bg-amber-400" },
  repeat:   { label: "Repeat",  color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20", dot: "bg-brand-purple" },
  new:      { label: "New",     color: "text-brand-green",  bg: "bg-brand-green/10 border-brand-green/20",   dot: "bg-brand-green" },
  "at-risk":{ label: "At Risk", color: "text-brand-coral",  bg: "bg-brand-coral/10 border-brand-coral/20",   dot: "bg-brand-coral" },
}

const segments = ["All", "VIP", "Repeat", "New", "At Risk"]

const stats = [
  { label: "Total Customers",  value: "1,247",   icon: Users,      color: "text-brand-purple", change: "+23 this month" },
  { label: "Avg. Order Value", value: "₦18,400", icon: ShoppingBag,color: "text-brand-green",  change: "+12% vs last month" },
  { label: "Repeat Rate",      value: "64%",      icon: TrendingUp, color: "text-amber-500",    change: "Industry avg: 40%" },
  { label: "VIP Customers",    value: "89",       icon: Star,       color: "text-brand-coral",  change: "7.1% of base" },
]

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
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{customer.phone}</span>
            </div>
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

        {/* Stats */}
        <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
          <div className="px-5 py-4 text-center">
            <p className="font-display font-extrabold text-xl">{customer.totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Orders</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="font-display font-extrabold text-xl text-brand-purple">₦{(customer.totalSpend / 1000).toFixed(0)}k</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total spent</p>
          </div>
        </div>

        {/* Segment update */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Segment</p>
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
              <a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(customMsg || buildWA(customer).split("?text=")[1])}`}
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
  const headers = ["Name", "Phone", "Email", "Location", "Orders", "Total Spend (₦)", "Segment", "Last Order", "Last Product", "On WhatsApp"]
  const rows = customers.map(c => [
    c.name, c.phone, c.email ?? "", c.location,
    c.totalOrders, c.totalSpend, c.segment, c.lastOrderDate, c.lastProduct, c.isOnWhatsApp ? "Yes" : "No",
  ])
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `lummy-customers-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function CRMPage() {
  const [customers, setCustomers] = React.useState<Customer[]>(mockCustomers)
  const [search, setSearch] = React.useState("")
  const [activeSegment, setActiveSegment] = React.useState("All")
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) || c.location.toLowerCase().includes(search.toLowerCase())
    const matchSegment = activeSegment === "All" || segmentConfig[c.segment].label === activeSegment
    return matchSearch && matchSegment
  })

  const updateCustomer = (updated: Customer) => {
    setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    setSelectedCustomer(updated)
  }

  const buildWA = (customer: Customer) => {
    const clean = customer.phone.replace(/\D/g, "")
    const firstName = customer.name.split(" ")[0]
    const text = encodeURIComponent(`Hi ${firstName}! 👋 It's Sade from Sade's Boutique. We have new arrivals you might love based on your last order (${customer.lastProduct}). Come see! 🛍`)
    return `https://wa.me/${clean}?text=${text}`
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Customers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your customer base and nurture relationships</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 h-9 text-xs flex-shrink-0"
            onClick={() => exportCustomersCSV(customers)}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or location…"
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {segments.map((seg) => (
              <button key={seg} onClick={() => setActiveSegment(seg)}
                className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  activeSegment === seg ? "bg-brand-purple text-white border-brand-purple" : "border-border text-muted-foreground hover:border-foreground/20")}>
                {seg}
              </button>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-[minmax(200px,1fr)_140px_100px_100px_120px_80px] gap-4 px-4 py-2.5 border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
            <span>Customer</span><span>Location</span><span>Orders</span>
            <span>Total Spent</span><span>Segment</span><span />
          </div>

          <div className="divide-y divide-border">
            {filtered.map((customer, i) => {
              const seg = segmentConfig[customer.segment]
              return (
                <motion.div key={customer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-1 sm:grid-cols-[minmax(200px,1fr)_140px_100px_100px_120px_80px] gap-3 sm:gap-4 px-4 py-3.5 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}>
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
                  <div className="flex items-center sm:block">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                      <span className="truncate">{customer.location}</span>
                    </p>
                  </div>
                  <div className="flex items-center sm:block">
                    <p className="text-sm font-semibold">{customer.totalOrders}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />{customer.lastOrderDate}
                    </p>
                  </div>
                  <div className="flex items-center sm:block">
                    <p className="text-sm font-semibold text-brand-purple">₦{customer.totalSpend.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center sm:block">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border", seg.bg, seg.color)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", seg.dot)} />{seg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                    {customer.isOnWhatsApp && (
                      <a href={buildWA(customer)} target="_blank" rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors"
                        title="Message on WhatsApp">
                        <MessageCircle className="h-3.5 w-3.5 fill-[#25D366]" />
                      </a>
                    )}
                    <button onClick={() => setSelectedCustomer(customer)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold">No customers found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search or filter</p>
            </div>
          )}
        </div>

        {/* WhatsApp broadcast nudge */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-4 w-4 text-[#25D366] fill-[#25D366]/30" />
            </div>
            <div>
              <p className="text-sm font-semibold">Re-engage at-risk customers</p>
              <p className="text-xs text-muted-foreground mt-0.5">2 customers haven&apos;t ordered in 6+ weeks. A quick WhatsApp message could win them back.</p>
            </div>
          </div>
          <Button size="sm" variant="whatsapp" className="gap-1.5 flex-shrink-0 text-xs h-8">
            <MessageCircle className="h-3.5 w-3.5 fill-white" /> Message them
          </Button>
        </motion.div>
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
    </>
  )
}
