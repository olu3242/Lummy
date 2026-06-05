"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingBag, Star, MessageCircle, CheckCircle2,
  Wallet, User, Zap, ArrowRight, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ActivityType = "order" | "review" | "whatsapp" | "payout" | "customer" | "system"

interface Activity {
  id: string
  type: ActivityType
  title: string
  body: string
  time: string
  href?: string
  amount?: number
}

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  order:    { icon: ShoppingBag,  bg: "bg-brand-purple/10", color: "text-brand-purple" },
  review:   { icon: Star,         bg: "bg-amber-500/10",    color: "text-amber-500"    },
  whatsapp: { icon: MessageCircle,bg: "bg-[#25D366]/10",    color: "text-[#25D366]"    },
  payout:   { icon: Wallet,       bg: "bg-brand-green/10",  color: "text-brand-green"  },
  customer: { icon: User,         bg: "bg-brand-indigo/10", color: "text-brand-indigo" },
  system:   { icon: Zap,          bg: "bg-brand-coral/10",  color: "text-brand-coral"  },
}

const INITIAL_ACTIVITIES: Activity[] = [
  { id: "a1",  type: "order",    title: "New order",        body: "Chidi N. ordered Ankara Print Dress ×2",       time: "2 min ago",  href: "/dashboard/orders",          amount: 40 },
  { id: "a2",  type: "whatsapp", title: "WhatsApp click",   body: "Funmi A. clicked your Leather Mini Bag link",  time: "5 min ago"  },
  { id: "a3",  type: "review",   title: "5-star review",    body: "Amaka O. left a review on Beaded Necklace Set",time: "12 min ago", href: "/dashboard/reviews"  },
  { id: "a4",  type: "order",    title: "Order delivered",  body: "Tunde B.'s Dashiki Shirt marked as delivered",  time: "31 min ago", href: "/dashboard/orders"           },
  { id: "a5",  type: "customer", title: "New customer",     body: "Ngozi M. joined from your Instagram link",      time: "1h ago",     href: "/dashboard/crm"     },
  { id: "a6",  type: "whatsapp", title: "WhatsApp click",   body: "3 people clicked Perfume Collection Box",       time: "1h ago"     },
  { id: "a7",  type: "payout",   title: "Payout sent",      body: "$125 deposited to bank ••4521",                time: "2h ago",     href: "/dashboard/payouts",         amount: 125 },
  { id: "a8",  type: "order",    title: "New order",        body: "Kemi A. ordered Beaded Necklace Set ×1",       time: "3h ago",     href: "/dashboard/orders",          amount: 8  },
  { id: "a9",  type: "review",   title: "4-star review",    body: "Emeka I. reviewed Aso-Oke Fila",               time: "4h ago",     href: "/dashboard/reviews"  },
  { id: "a10", type: "system",   title: "AI brief ready",   body: "Your weekly growth brief has 3 new tips",      time: "5h ago",     href: "/dashboard/ai"      },
]

const NEW_ACTIVITY: Activity = {
  id: "a0", type: "order", title: "New order", body: "Blessing E. ordered Silk Blouse ×1", time: "Just now",
  href: "/dashboard/orders", amount: 14,
}

export function ActivityFeed() {
  const [activities, setActivities] = React.useState<Activity[]>(INITIAL_ACTIVITIES)
  const [pulsing, setPulsing] = React.useState(false)
  const [liveCount, setLiveCount] = React.useState(0)

  const simulateLive = React.useCallback(() => {
    setPulsing(true)
    setTimeout(() => setPulsing(false), 600)
    setActivities((prev) => [{ ...NEW_ACTIVITY, id: `live-${Date.now()}`, time: "Just now" }, ...prev.slice(0, 9)])
    setLiveCount((c) => c + 1)
  }, [])

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold">Live Activity</p>
          <span className={cn(
            "relative flex h-2 w-2",
            pulsing ? "scale-125" : ""
          )}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green" />
          </span>
        </div>
        <button onClick={simulateLive}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
          <RefreshCw className="h-3 w-3" /> Simulate
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-border scrollbar-hide">
        <AnimatePresence initial={false}>
          {activities.map((activity, i) => {
            const cfg = typeConfig[activity.type]
            const Icon = cfg.icon
            const Wrapper = activity.href ? Link : "div"

            return (
              <motion.div key={activity.id}
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}>
                <Wrapper
                  href={(activity.href ?? "") as string}
                  className={cn("flex items-start gap-3 px-4 py-3 transition-colors",
                    activity.href ? "hover:bg-accent/40 cursor-pointer" : "",
                    i === 0 && liveCount > 0 ? "bg-brand-green/3" : ""
                  )}>
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", cfg.color, activity.type === "whatsapp" ? "fill-[#25D366]/50" : "")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold truncate">{activity.title}</p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{activity.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed truncate">{activity.body}</p>
                    {activity.amount && (
                      <p className="text-[11px] font-bold text-brand-purple mt-0.5">${activity.amount.toLocaleString()}</p>
                    )}
                  </div>
                </Wrapper>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border px-4 py-2.5">
        <Link href="/dashboard/notifications"
          className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors group">
          <span>View all notifications</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
