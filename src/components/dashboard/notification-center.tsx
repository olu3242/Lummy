"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, CheckCheck, X, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppNotificationRow } from "@/lib/queries/notifications"

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function NotificationCenter() {
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<AppNotificationRow[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=20")
      if (res.ok) {
        const { notifications: n, unreadCount: u } = await res.json()
        setNotifications(n ?? [])
        setUnreadCount(u ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount and when panel opens
  React.useEffect(() => { void fetchNotifications() }, [fetchNotifications])
  React.useEffect(() => { if (open) void fetchNotifications() }, [open, fetchNotifications])

  // Poll for new notifications every 60s
  React.useEffect(() => {
    const id = setInterval(() => { void fetchNotifications() }, 60_000)
    return () => clearInterval(id)
  }, [fetchNotifications])

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5 text-white/60" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-purple text-[9px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/10 bg-[#0f0f1a] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <span className="font-semibold text-sm text-white">Notifications</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => void markAllRead()}
                    className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />
                    All read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="space-y-3 p-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Bell className="h-8 w-8 text-white/15 mb-2" />
                  <p className="text-sm text-white/30">No notifications yet</p>
                  <p className="text-xs text-white/20 mt-0.5">We&apos;ll notify you of orders & milestones</p>
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { void markRead(n.id); if (n.action_url) window.location.href = n.action_url }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-white/4 transition-colors border-b border-white/5 last:border-0",
                      !n.is_read && "bg-brand-purple/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!n.is_read && (
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-purple flex-shrink-0" />
                      )}
                      {n.is_read && <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", n.is_read ? "text-white/60" : "text-white")}>
                          {n.title}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-white/25 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {n.action_url && <ExternalLink className="h-3 w-3 text-white/20 flex-shrink-0 mt-1" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
