"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, ShoppingBag, Star, Megaphone, CheckCircle2,
  Zap, Settings, CheckCheck, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

type NotifType = "order" | "review" | "system" | "promo" | "payout"

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  read: boolean
  group: "today" | "yesterday" | "week" | "earlier"
}

const mockNotifications: Notification[] = [
  { id: "N1", type: "order",  title: "New Order Received",      body: "Chidi N. ordered Ankara Peplum Top (×2) — ₦28,000",                             time: "2 min ago",   read: false, group: "today"    },
  { id: "N2", type: "payout", title: "Payout Processed",        body: "₦125,000 has been sent to your GTBank account ending 4521",                      time: "1h ago",      read: false, group: "today"    },
  { id: "N3", type: "review", title: "New 5-Star Review",       body: "Amaka O. left a glowing review on Lace Iro & Buba",                              time: "3h ago",      read: false, group: "today"    },
  { id: "N4", type: "order",  title: "Order Confirmed",         body: "Funmi A. confirmed delivery of Men's Agbada Set",                                time: "5h ago",      read: true,  group: "today"    },
  { id: "N5", type: "system", title: "WhatsApp Connected",      body: "Your WhatsApp Business number is now verified and active",                       time: "Yesterday",   read: true,  group: "yesterday"},
  { id: "N6", type: "promo",  title: "Tip: Boost Your Sales",   body: "Stores that reply within 1hr get 3× more conversions. You're at 94% — great work!", time: "Yesterday",read: true,  group: "yesterday"},
  { id: "N7", type: "order",  title: "New Order Received",      body: "Tunde B. ordered Dashiki Shirt (×1) — ₦12,500",                                 time: "2 days ago",  read: true,  group: "week"     },
  { id: "N8", type: "review", title: "New 4-Star Review",       body: "Ngozi M. reviewed Adire Gown — with a comment",                                 time: "3 days ago",  read: true,  group: "week"     },
  { id: "N9", type: "system", title: "Product Restocked",       body: "Your automation restocked Men's Agbada Set to 15 units",                        time: "4 days ago",  read: true,  group: "week"     },
  { id: "N10",type: "payout", title: "Payout Scheduled",        body: "₦87,500 will be processed this Friday (May 9)",                                  time: "5 days ago",  read: true,  group: "earlier"  },
]

const typeConfig: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  order:   { icon: ShoppingBag,  bg: "bg-brand-purple/10", color: "text-brand-purple" },
  review:  { icon: Star,         bg: "bg-amber-500/10",    color: "text-amber-500"    },
  system:  { icon: Zap,          bg: "bg-brand-green/10",  color: "text-brand-green"  },
  promo:   { icon: Megaphone,    bg: "bg-brand-coral/10",  color: "text-brand-coral"  },
  payout:  { icon: CheckCircle2, bg: "bg-brand-green/10",  color: "text-brand-green"  },
}

const filterTabs = ["All", "Unread", "Orders", "Reviews", "Payouts"] as const

const GROUP_LABELS: Record<Notification["group"], string> = {
  today:     "Today",
  yesterday: "Yesterday",
  week:      "This week",
  earlier:   "Earlier",
}

const GROUP_ORDER: Notification["group"][] = ["today", "yesterday", "week", "earlier"]

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications)
  const [activeTab, setActiveTab] = React.useState<typeof filterTabs[number]>("All")

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (activeTab === "Unread")  return !n.read
    if (activeTab === "Orders")  return n.type === "order"
    if (activeTab === "Reviews") return n.type === "review"
    if (activeTab === "Payouts") return n.type === "payout"
    return true
  })

  // Build date groups from filtered list
  const grouped = GROUP_ORDER.reduce<Record<string, Notification[]>>((acc, g) => {
    const items = filtered.filter(n => n.group === g)
    if (items.length) acc[g] = items
    return acc
  }, {})

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const deleteNotif = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id))

  const clearAllRead = () => {
    const readCount = notifications.filter(n => n.read).length
    setNotifications(prev => prev.filter(n => !n.read))
    toast({ title: `Cleared ${readCount} read notification${readCount !== 1 ? "s" : ""}`, variant: "success" })
  }

  const hasRead = notifications.some(n => n.read)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
            Notifications
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-coral text-white text-xs font-bold"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Stay on top of your store activity</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 text-xs h-8">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          {hasRead && (
            <Button variant="outline" size="sm" onClick={clearAllRead} className="gap-1.5 text-xs h-8 text-muted-foreground">
              <Trash2 className="h-3.5 w-3.5" /> Clear read
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Settings className="h-3.5 w-3.5" /> Preferences
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {filterTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              activeTab === tab ? "bg-brand-purple text-white border-brand-purple" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            )}>
            {tab}
          </button>
        ))}
      </div>

      {/* Notification list — date grouped */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">No notifications here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                {GROUP_LABELS[group as Notification["group"]]}
              </p>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {items.map((n, i) => {
                    const cfg = typeConfig[n.type]
                    const Icon = cfg.icon
                    return (
                      <motion.div
                        key={n.id}
                        layout="position"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, scale: 0.97 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          "group relative flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all",
                          n.read ? "border-border bg-card" : "border-brand-purple/20 bg-brand-purple/5"
                        )}
                      >
                        {!n.read && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 h-2 w-2 rounded-full bg-brand-purple"
                          />
                        )}
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 mt-0.5", cfg.bg)}>
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-semibold leading-snug", !n.read && "text-foreground")}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5">{n.time}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteNotif(n.id) }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-muted transition-all ml-1 flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enable browser notifications tip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3">
        <Bell className="h-4 w-4 text-brand-purple flex-shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-0.5">Get notified faster</p>
          <p>Enable browser notifications to get instant alerts for new orders, even when Lummy isn&apos;t open.</p>
          <button
            onClick={() => {
              if (typeof Notification !== "undefined") {
                Notification.requestPermission()
              }
            }}
            className="mt-2 text-brand-purple font-semibold hover:underline"
          >
            Enable notifications →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
