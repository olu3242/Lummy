"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Search,
  MessageCircle,
  ShoppingBag,
  Users,
  TrendingUp,
  MoreHorizontal,
  Star,
  Filter,
  Download,
  Phone,
  MapPin,
  Clock,
  ChevronDown,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Customer {
  id: string
  name: string
  avatar?: string
  phone: string
  location: string
  totalOrders: number
  totalSpend: number
  lastOrderDate: string
  lastProduct: string
  segment: "vip" | "repeat" | "new" | "at-risk"
  isOnWhatsApp: boolean
}

const mockCustomers: Customer[] = [
  { id: "c1", name: "Adaeze Okonkwo", phone: "+234 803 456 7890", location: "Victoria Island, Lagos", totalOrders: 12, totalSpend: 184500, lastOrderDate: "2 days ago", lastProduct: "Ankara Print Dress", segment: "vip", isOnWhatsApp: true },
  { id: "c2", name: "Kemi Adeyemi", phone: "+234 806 123 4567", location: "Ikeja, Lagos", totalOrders: 8, totalSpend: 96200, lastOrderDate: "5 days ago", lastProduct: "Beaded Necklace Set", segment: "vip", isOnWhatsApp: true },
  { id: "c3", name: "Funmilayo Lawal", phone: "+234 810 987 6543", location: "Lekki Phase 1, Lagos", totalOrders: 5, totalSpend: 67300, lastOrderDate: "1 week ago", lastProduct: "Leather Mini Bag", segment: "repeat", isOnWhatsApp: true },
  { id: "c4", name: "Blessing Eze", phone: "+234 814 234 5678", location: "Abuja, FCT", totalOrders: 4, totalSpend: 54800, lastOrderDate: "2 weeks ago", lastProduct: "Perfume Collection Box", segment: "repeat", isOnWhatsApp: true },
  { id: "c5", name: "Chisom Nwachukwu", phone: "+234 802 345 6789", location: "Port Harcourt, Rivers", totalOrders: 2, totalSpend: 28500, lastOrderDate: "3 weeks ago", lastProduct: "Silk Blouse", segment: "new", isOnWhatsApp: false },
  { id: "c6", name: "Ngozi Obi", phone: "+234 808 567 8901", location: "Enugu", totalOrders: 3, totalSpend: 41200, lastOrderDate: "1 month ago", lastProduct: "Gold Hoop Earrings", segment: "at-risk", isOnWhatsApp: true },
  { id: "c7", name: "Tolani Bakare", phone: "+234 817 890 1234", location: "Surulere, Lagos", totalOrders: 6, totalSpend: 78900, lastOrderDate: "3 days ago", lastProduct: "Embroidered Set", segment: "repeat", isOnWhatsApp: true },
  { id: "c8", name: "Amaka Eze", phone: "+234 903 456 7890", location: "Ibadan, Oyo", totalOrders: 1, totalSpend: 12000, lastOrderDate: "4 days ago", lastProduct: "Beaded Bracelet", segment: "new", isOnWhatsApp: true },
  { id: "c9", name: "Folake Adesanya", phone: "+234 705 123 4567", location: "Ajah, Lagos", totalOrders: 9, totalSpend: 113400, lastOrderDate: "1 week ago", lastProduct: "Aso-Oke Gele", segment: "vip", isOnWhatsApp: true },
  { id: "c10", name: "Ifeoma Chukwu", phone: "+234 816 234 5678", location: "Warri, Delta", totalOrders: 2, totalSpend: 32600, lastOrderDate: "6 weeks ago", lastProduct: "Lace Blouse", segment: "at-risk", isOnWhatsApp: false },
]

const segmentConfig = {
  vip: { label: "VIP", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  repeat: { label: "Repeat", color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20", dot: "bg-brand-purple" },
  new: { label: "New", color: "text-brand-green", bg: "bg-brand-green/10 border-brand-green/20", dot: "bg-brand-green" },
  "at-risk": { label: "At Risk", color: "text-brand-coral", bg: "bg-brand-coral/10 border-brand-coral/20", dot: "bg-brand-coral" },
}

const segments = ["All", "VIP", "Repeat", "New", "At Risk"]

const stats = [
  { label: "Total Customers", value: "1,247", icon: Users, color: "text-brand-purple", change: "+23 this month" },
  { label: "Avg. Order Value", value: "₦18,400", icon: ShoppingBag, color: "text-brand-green", change: "+12% vs last month" },
  { label: "Repeat Rate", value: "64%", icon: TrendingUp, color: "text-amber-500", change: "Industry avg: 40%" },
  { label: "VIP Customers", value: "89", icon: Star, color: "text-brand-coral", change: "7.1% of base" },
]

export default function CRMPage() {
  const [search, setSearch] = React.useState("")
  const [activeSegment, setActiveSegment] = React.useState("All")
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)

  const filtered = mockCustomers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) || c.location.toLowerCase().includes(search.toLowerCase())
    const matchSegment = activeSegment === "All" ||
      segmentConfig[c.segment].label === activeSegment
    return matchSearch && matchSegment
  })

  const buildWhatsAppMessage = (customer: Customer) => {
    const clean = customer.phone.replace(/\D/g, "")
    const firstName = customer.name.split(" ")[0]
    const text = encodeURIComponent(`Hi ${firstName}! 👋 It's Sade from Sade's Boutique. I wanted to check in — we have new arrivals you might love based on your last order (${customer.lastProduct}). Come see! 🛍`)
    return `https://wa.me/${clean}?text=${text}`
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your customer base and nurture relationships</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 h-9 text-xs flex-shrink-0">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or location…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {segments.map((seg) => (
            <button
              key={seg}
              onClick={() => setActiveSegment(seg)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                activeSegment === seg
                  ? "bg-brand-purple text-white border-brand-purple"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              )}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="hidden sm:grid grid-cols-[minmax(200px,1fr)_140px_100px_100px_120px_80px] gap-4 px-4 py-2.5 border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
          <span>Customer</span>
          <span>Location</span>
          <span>Orders</span>
          <span>Total Spent</span>
          <span>Segment</span>
          <span />
        </div>

        <div className="divide-y divide-border">
          {filtered.map((customer, i) => {
            const seg = segmentConfig[customer.segment]
            return (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-1 sm:grid-cols-[minmax(200px,1fr)_140px_100px_100px_120px_80px] gap-3 sm:gap-4 px-4 py-3.5 hover:bg-accent/50 transition-colors"
              >
                {/* Name + phone */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-purple/10 flex items-center justify-center text-sm font-bold text-brand-purple flex-shrink-0">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{customer.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5" />
                      {customer.phone}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center sm:block">
                  <span className="text-xs text-muted-foreground sm:hidden mr-2">Location: </span>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate">{customer.location}</span>
                  </p>
                </div>

                {/* Orders */}
                <div className="flex items-center sm:block">
                  <span className="text-xs text-muted-foreground sm:hidden mr-2">Orders: </span>
                  <div>
                    <p className="text-sm font-semibold">{customer.totalOrders}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {customer.lastOrderDate}
                    </p>
                  </div>
                </div>

                {/* Spend */}
                <div className="flex items-center sm:block">
                  <span className="text-xs text-muted-foreground sm:hidden mr-2">Spent: </span>
                  <p className="text-sm font-semibold text-brand-purple">₦{customer.totalSpend.toLocaleString()}</p>
                </div>

                {/* Segment */}
                <div className="flex items-center sm:block">
                  <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border", seg.bg, seg.color)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", seg.dot)} />
                    {seg.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 justify-end relative">
                  {customer.isOnWhatsApp && (
                    <a
                      href={buildWhatsAppMessage(customer)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors"
                      title="Message on WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5 fill-[#25D366]" />
                    </a>
                  )}
                  <button
                    onClick={() => setOpenMenu(openMenu === customer.id ? null : customer.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {openMenu === customer.id && (
                    <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border bg-card shadow-lg py-1">
                      <button className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors">View order history</button>
                      <button className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors">Add note</button>
                      <button className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors text-brand-coral">Mark at-risk</button>
                    </div>
                  )}
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 flex items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-4 w-4 text-[#25D366] fill-[#25D366]/30" />
          </div>
          <div>
            <p className="text-sm font-semibold">Re-engage at-risk customers</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              2 customers haven't ordered in 6+ weeks. A quick WhatsApp message could win them back.
            </p>
          </div>
        </div>
        <Button size="sm" variant="whatsapp" className="gap-1.5 flex-shrink-0 text-xs h-8">
          <MessageCircle className="h-3.5 w-3.5 fill-white" />
          Message them
        </Button>
      </motion.div>
    </div>
  )
}
