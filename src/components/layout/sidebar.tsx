"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Store,
  Users,
  BarChart3,
  Bot,
  Settings,
  Zap,
  HelpCircle,
  ChevronRight,
  BadgeCheck,
  X,
  Gift,
  Megaphone,
  Wallet,
  Star,
  Tag,
  Bell,
  Target,
  CreditCard,
  CalendarDays,
  MessageSquare,
  Package,
  Layers,
  Puzzle,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { mockCreatorProfile } from "@/data/mock/dashboard"

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  badge?: string
  badgeColor?: string
  isNew?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Goals", icon: Target, href: "/dashboard/goals" },
      { label: "Products", icon: ShoppingBag, href: "/dashboard/products", badge: "23" },
      { label: "Bundles", icon: Layers, href: "/dashboard/products/bundles" },
      { label: "Inventory", icon: Package, href: "/dashboard/inventory" },
      { label: "Orders", icon: ClipboardList, href: "/dashboard/orders", badge: "12", badgeColor: "bg-brand-coral/20 text-brand-coral" },
      { label: "Reviews", icon: Star, href: "/dashboard/reviews" },
      { label: "Discounts", icon: Tag, href: "/dashboard/discounts" },
    ],
  },
  {
    label: "Grow",
    items: [
      { label: "My Store", icon: Store, href: "/dashboard/store" },
      { label: "CRM", icon: Users, href: "/dashboard/crm" },
      { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
      { label: "AI Assistant", icon: Bot, href: "/dashboard/ai", isNew: true },
      { label: "Campaigns", icon: Target, href: "/dashboard/campaigns" },
      { label: "Calendar", icon: CalendarDays, href: "/dashboard/calendar" },
      { label: "Broadcast", icon: Megaphone, href: "/dashboard/broadcast" },
      { label: "Templates", icon: MessageSquare, href: "/dashboard/templates" },
      { label: "Refer & Earn", icon: Gift, href: "/dashboard/referrals", badge: "₦63k" },
      { label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
      { label: "Link-in-Bio", icon: Link2, href: "/dashboard/links" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Payouts", icon: Wallet, href: "/dashboard/payouts" },
      { label: "Billing", icon: CreditCard, href: "/dashboard/billing" },
      { label: "Integrations", icon: Puzzle, href: "/dashboard/integrations" },
      { label: "Notifications", icon: Bell, href: "/dashboard/notifications", badge: "3", badgeColor: "bg-brand-coral/20 text-brand-coral" },
      { label: "Settings", icon: Settings, href: "/dashboard/settings" },
      { label: "Help & Docs", icon: HelpCircle, href: "/dashboard/help" },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/5 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo shadow-brand-sm">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">Lummy</span>
        </Link>

        {/* Mobile close */}
        <button
          onClick={onClose}
          className="ml-auto lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Store quick-info */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-2xl bg-white/4 border border-white/6 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
            <Image src={mockCreatorProfile.avatar} alt="Store" fill className="object-cover" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-white text-xs font-semibold truncate">{mockCreatorProfile.storeName}</p>
              {mockCreatorProfile.verified && <BadgeCheck className="w-3 h-3 text-brand-purple flex-shrink-0" />}
            </div>
            <p className="text-white/40 text-[10px] truncate">{mockCreatorProfile.storeUrl}</p>
          </div>
          <Link href="/dashboard/store" className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group",
                        isActive
                          ? "bg-brand-purple/15 text-white border border-brand-purple/20"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-brand-purple" : "group-hover:text-white/80")} />
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", item.badgeColor || "bg-white/8 text-white/50")}>
                          {item.badge}
                        </span>
                      )}
                      {item.isNew && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple border border-brand-purple/20">
                          AI
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Creator profile footer */}
      <div className="flex-shrink-0 border-t border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-brand-purple/20">
            <Image src={mockCreatorProfile.avatar} alt={mockCreatorProfile.name} fill className="object-cover" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{mockCreatorProfile.name}</p>
            <p className="text-white/40 text-[10px] truncate">@{mockCreatorProfile.handle}</p>
          </div>
          <Link href="/dashboard/settings" className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 h-screen bg-brand-midnight border-r border-white/5 sticky top-0 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[240px] bg-brand-midnight border-r border-white/5 flex flex-col lg:hidden overflow-hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
