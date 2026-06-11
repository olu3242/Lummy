"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Bot,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

const TAB_ITEMS = [
  { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Products", icon: ShoppingBag, href: "/dashboard/products" },
  { label: "Orders", icon: ClipboardList, href: "/dashboard/orders" },
  { label: "AI", icon: Bot, href: "/dashboard/ai" },
  { label: "Alerts", icon: Bell, href: "/dashboard/notifications" },
]

const NOTIFICATION_BADGE: Record<string, string> = {
  "/dashboard/orders": "12",
  "/dashboard/notifications": "3",
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden pb-safe">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md border-t border-border" />

      <div className="relative flex items-center justify-around px-2 h-16">
        {TAB_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const badge = NOTIFICATION_BADGE[item.href]

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 group"
            >
              <div className="relative">
                {/* Active pill background */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", damping: 24, stiffness: 300 }}
                      className="absolute inset-0 -m-1.5 rounded-xl bg-brand-purple/10"
                    />
                  )}
                </AnimatePresence>

                <item.icon
                  className={cn(
                    "h-5 w-5 relative transition-colors duration-150",
                    isActive ? "text-brand-purple" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />

                {/* Notification badge */}
                {badge && !isActive && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center text-[9px] font-black text-white bg-brand-coral rounded-full px-0.5 leading-none">
                    {badge}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "text-[9px] font-semibold transition-colors duration-150",
                  isActive ? "text-brand-purple" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* iOS home indicator spacing */}
      <div className="h-safe-bottom bg-background/90" />
    </nav>
  )
}
