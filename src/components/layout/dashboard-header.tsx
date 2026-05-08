"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, Search, Bell, X, ShoppingBag, CreditCard, Bot, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { mockNotifications, mockCreatorProfile } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"

const notifIcons: Record<string, React.ElementType> = {
  order: ShoppingBag,
  payment: CreditCard,
  ai: Bot,
  store: Store,
}

interface DashboardHeaderProps {
  onMenuClick: () => void
  title?: string
}

export function DashboardHeader({ onMenuClick, title }: DashboardHeaderProps) {
  const [notifOpen, setNotifOpen] = React.useState(false)
  const unread = mockNotifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title (mobile/desktop) */}
      {title && (
        <h1 className="font-display text-base font-bold lg:hidden">{title}</h1>
      )}

      {/* Search — desktop */}
      <div className="hidden lg:flex flex-1 max-w-xs items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            placeholder="Search products, orders…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-coral border-2 border-background" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 z-40 w-80 rounded-2xl border border-border bg-card shadow-brand overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">Notifications</p>
                    {unread > 0 && (
                      <span className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-full px-2 py-0.5">
                        {unread} new
                      </span>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="ml-2 p-0.5 rounded hover:bg-muted">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <ul className="max-h-72 overflow-y-auto">
                    {mockNotifications.map((notif) => {
                      const Icon = notifIcons[notif.type] || Bell
                      return (
                        <li
                          key={notif.id}
                          className={cn(
                            "flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0",
                            !notif.read && "bg-brand-purple/[0.03]"
                          )}
                        >
                          <div className={cn(
                            "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl",
                            notif.type === "order" && "bg-brand-purple/10 text-brand-purple",
                            notif.type === "payment" && "bg-brand-green/10 text-brand-green",
                            notif.type === "ai" && "bg-brand-indigo/10 text-brand-indigo",
                            notif.type === "store" && "bg-amber-500/10 text-amber-500",
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{notif.time}</p>
                          </div>
                          {!notif.read && (
                            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-purple flex-shrink-0" />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  <div className="px-4 py-2.5 border-t border-border">
                    <button className="text-xs text-primary font-semibold hover:underline w-full text-center">
                      Mark all as read
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <Link href="/dashboard/settings" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-brand-purple/40 transition-all">
            <Image src={mockCreatorProfile.avatar} alt={mockCreatorProfile.name} fill className="object-cover" unoptimized />
          </div>
        </Link>
      </div>
    </header>
  )
}
