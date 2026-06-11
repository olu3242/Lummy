"use client"

import * as React from "react"
import {
  MessageCircle, CheckCheck, Phone, User,
  RefreshCw, Filter, Zap, TrendingUp, Users, AlertTriangle,
  ChevronDown, Copy, Smartphone, ExternalLink, CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { formatMoney } from "@/lib/globalization"
import type { InboxMessage, InboxFilter } from "@/lib/whatsapp/inbox"
import { detectIntent, generateSuggestedReply } from "@/lib/ai-conversion"
import { buildWhatsAppLink, buildStorefrontShareMessage } from "@/lib/whatsapp/share"
import { formatMinorMoney } from "@/lib/globalization"

// ─── Types ────────────────────────────────────────────────────────────────────

interface InboxData {
  messages: InboxMessage[]
  total: number
  unreadCount: number
  stats: {
    totalConversations: number
    unread: number
    followedUp: number
    last7dCount: number
    repeatSenders: number
    topSenders: Array<{ phone: string; name: string | null; count: number; lastAt: string }>
  } | null
  creatorProfile: { handle: string; whatsappNumber: string | null } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatPhone(phone: string | null): string {
  if (!phone) return "Unknown number"
  const digits = phone.replace(/\D/g, "")
  return `+${digits.slice(0, 3)} *** ${digits.slice(-4)}`
}

type Product = { id: string; title: string; price: number; currency: string; image_url: string | null }

const INTENT_LABELS: Record<string, string> = {
  pricing_inquiry:  "Pricing inquiry",
  purchase_intent:  "Purchase intent",
  booking_intent:   "Booking inquiry",
  delivery_inquiry: "Delivery inquiry",
  support_request:  "Support request",
  low_intent:       "General message",
}

// ─── Quick reply panel ────────────────────────────────────────────────────────

function QuickReplyPanel({
  message,
  creatorHandle,
}: {
  message: InboxMessage
  creatorHandle: string
}) {
  const [copied, setCopied]           = React.useState(false)
  const [products, setProducts]       = React.useState<Product[] | null>(null)
  const [loadingProducts, setLoadingProducts] = React.useState(false)
  const [showPicker, setShowPicker]   = React.useState(false)
  const [sendingLink, setSendingLink] = React.useState(false)
  const [linkSent, setLinkSent]       = React.useState(!!message.linkSentAt)

  const { intent } = React.useMemo(
    () => (message.messageBody ? detectIntent(message.messageBody) : { intent: "low_intent" as const }),
    [message.messageBody]
  )

  const suggestedReply = React.useMemo(
    () => (message.messageBody
      ? generateSuggestedReply({ intent, handle: creatorHandle })
      : `Thanks for reaching out! Reply here to continue our conversation.`),
    [intent, message.messageBody, creatorHandle]
  )

  const replyLink = message.senderPhone
    ? buildWhatsAppLink(message.senderPhone, suggestedReply)
    : null

  const storefrontLink = message.senderPhone
    ? buildWhatsAppLink(message.senderPhone, buildStorefrontShareMessage("my store", creatorHandle))
    : null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestedReply)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const handleLoadProducts = async () => {
    if (products !== null) { setShowPicker(p => !p); return }
    setLoadingProducts(true)
    try {
      const res = await fetch("/api/whatsapp/inbox/products")
      const data = await res.json() as { products: Product[] }
      setProducts(data.products ?? [])
      setShowPicker(true)
    } catch {
      toast({ title: "Failed to load products", variant: "error" })
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleSendPaymentLink = async (product: Product) => {
    setSendingLink(true)
    try {
      const res = await fetch("/api/whatsapp/inbox/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: message.id, productId: product.id }),
      })
      const data = await res.json() as { waLink?: string; productName?: string; error?: string }
      if (!res.ok || !data.waLink) {
        toast({ title: data.error ?? "Failed to generate link", variant: "error" })
        return
      }
      window.open(data.waLink, "_blank", "noopener,noreferrer")
      setLinkSent(true)
      setShowPicker(false)
      toast({ title: `Payment link sent for ${data.productName ?? product.title}`, variant: "success" })
    } catch {
      toast({ title: "Failed to generate link", variant: "error" })
    } finally {
      setSendingLink(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
      {/* Intent badge + suggested reply */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] bg-brand-purple/15 text-brand-purple px-2 py-0.5 rounded-full border border-brand-purple/20">
            {INTENT_LABELS[intent] ?? "General message"}
          </span>
          <span className="text-[10px] text-white/25">AI suggested reply</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed bg-white/3 rounded-xl p-2.5 border border-white/6">
          {suggestedReply}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/8 transition-colors"
        >
          <Copy className="h-3 w-3" />
          {copied ? "Copied!" : "Copy reply"}
        </button>
        {replyLink && (
          <a
            href={replyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors"
          >
            <Smartphone className="h-3 w-3" />
            Reply on WhatsApp
          </a>
        )}
        {storefrontLink && (
          <a
            href={storefrontLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/8 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Send storefront link
          </a>
        )}
        {/* Payment link — only when we have a sender phone */}
        {message.senderPhone && (
          <button
            onClick={handleLoadProducts}
            disabled={loadingProducts || sendingLink}
            className={cn(
              "flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors",
              linkSent
                ? "bg-brand-purple/10 text-brand-purple/60 cursor-default"
                : "bg-brand-purple/15 text-brand-purple hover:bg-brand-purple/25"
            )}
          >
            {loadingProducts
              ? <RefreshCw className="h-3 w-3 animate-spin" />
              : <CreditCard className="h-3 w-3" />
            }
            {linkSent ? "Link sent ✓" : "Send payment link"}
          </button>
        )}
      </div>

      {/* Product picker */}
      {showPicker && products && (
        products.length === 0 ? (
          <p className="text-[11px] text-white/30 pl-0.5">
            No active products found — add products in the dashboard first.
          </p>
        ) : (
          <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
            <p className="text-[10px] text-white/25 uppercase tracking-wider px-3 pt-2.5 pb-1.5">
              Select product to send
            </p>
            {products.slice(0, 6).map(p => {
              const displayPrice = formatMinorMoney(p.price, p.currency || "USD")
              return (
                <button
                  key={p.id}
                  onClick={() => handleSendPaymentLink(p)}
                  disabled={sendingLink}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 text-left transition-colors border-t border-white/5 disabled:opacity-50"
                >
                  <span className="text-xs text-white/70 truncate pr-2">{p.title}</span>
                  <span className="text-[11px] text-white/40 font-mono flex-shrink-0">{displayPrice}</span>
                </button>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

// ─── InboxCard ────────────────────────────────────────────────────────────────

function InboxCard({
  message,
  onRead,
  onFollowUp,
  expanded,
  onToggleExpand,
  creatorHandle,
}: {
  message: InboxMessage
  onRead: (id: string) => void
  onFollowUp: (id: string) => void
  expanded: boolean
  onToggleExpand: (id: string) => void
  creatorHandle: string
}) {
  const preview = message.messageBody
    ? message.messageBody.slice(0, 120) + (message.messageBody.length > 120 ? "…" : "")
    : message.messageType === "image" ? "📷 Image"
    : message.messageType === "audio" ? "🎤 Voice message"
    : "Message received"

  return (
    <div className={cn(
      "rounded-2xl border p-4 transition-all",
      message.isRead
        ? "border-white/8 bg-white/2"
        : "border-brand-purple/30 bg-brand-purple/5"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
            message.isRead ? "bg-white/8" : "bg-brand-purple/20"
          )}>
            <User className={cn("h-4 w-4", message.isRead ? "text-white/40" : "text-brand-purple")} />
          </div>
          <div className="min-w-0">
            <p className={cn("font-medium text-sm truncate", message.isRead ? "text-white/70" : "text-white")}>
              {message.senderName ?? "Customer"}
            </p>
            <p className="text-[11px] text-white/30 font-mono">{formatPhone(message.senderPhone)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!message.isRead && (
            <span className="h-2 w-2 rounded-full bg-brand-purple" />
          )}
          {message.isFollowedUp && (
            <CheckCheck className="h-3.5 w-3.5 text-brand-green" />
          )}
          {message.linkSentAt && (
            <span className="text-[10px] bg-brand-purple/10 text-brand-purple/60 px-1.5 py-0.5 rounded-full border border-brand-purple/15 leading-none">
              link sent
            </span>
          )}
          <span className="text-[11px] text-white/25">{timeAgo(message.createdAt)}</span>
        </div>
      </div>

      {/* Message preview */}
      <p className={cn("text-sm leading-relaxed mb-3 pl-11", message.isRead ? "text-white/40" : "text-white/70")}>
        {preview}
      </p>

      {/* Attribution + actions */}
      <div className="flex items-center justify-between pl-11">
        <div className="flex items-center gap-2">
          {message.attributionSource && (
            <span className="text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded-full">
              via {message.attributionSource}
            </span>
          )}
          {message.creatorNote && (
            <span className="text-[10px] text-white/25 italic truncate max-w-[120px]">
              {message.creatorNote}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!message.isRead && (
            <button
              onClick={() => onRead(message.id)}
              className="text-[11px] text-white/40 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              Mark read
            </button>
          )}
          {!message.isFollowedUp && (
            <button
              onClick={() => onFollowUp(message.id)}
              className="text-[11px] text-brand-green/70 hover:text-brand-green px-2 py-1 rounded-lg hover:bg-brand-green/10 transition-colors"
            >
              Followed up ✓
            </button>
          )}
        </div>
      </div>

      {/* Quick reply toggle — only when we have a phone to reply to */}
      {message.senderPhone && (
        <div className="pl-11 mt-2.5">
          <button
            onClick={() => onToggleExpand(message.id)}
            className={cn(
              "flex items-center gap-1 text-[11px] transition-colors",
              expanded ? "text-white/40 hover:text-white/60" : "text-brand-purple/60 hover:text-brand-purple"
            )}
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-150", expanded && "rotate-180")} />
            {expanded ? "Close" : "Quick reply"}
          </button>
        </div>
      )}

      {/* Quick reply panel */}
      {expanded && message.senderPhone && (
        <QuickReplyPanel message={message} creatorHandle={creatorHandle} />
      )}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: InboxFilter }) {
  const copy = {
    all: { icon: MessageCircle, title: "No conversations yet", sub: "WhatsApp messages from customers will appear here once your storefront is shared." },
    unread: { icon: CheckCheck, title: "All caught up!", sub: "No unread messages." },
    followed_up: { icon: Zap, title: "No follow-ups logged", sub: "Mark conversations as followed up to track them here." },
  }[filter]
  const Icon = copy.icon
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-white/20" />
      </div>
      <p className="text-white/50 font-medium mb-1">{copy.title}</p>
      <p className="text-sm text-white/25 max-w-xs">{copy.sub}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FILTERS: { value: InboxFilter; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "unread",      label: "Unread" },
  { value: "followed_up", label: "Followed up" },
]

export default function WhatsAppInboxPage() {
  const [data, setData]         = React.useState<InboxData | null>(null)
  const [filter, setFilter]     = React.useState<InboxFilter>("all")
  const [page, setPage]         = React.useState(1)
  const [loading, setLoading]   = React.useState(true)
  const [updating, setUpdating] = React.useState<string | null>(null)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const fetchInbox = React.useCallback(async (f: InboxFilter, p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/inbox?filter=${f}&page=${p}&stats=true`, { cache: "no-store" })
      if (res.ok) setData(await res.json() as InboxData)
    } catch {
      toast({ title: "Failed to load inbox", variant: "error" })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchInbox(filter, 1)
    setPage(1)
    setExpandedId(null)
  }, [filter, fetchInbox])

  const handleRead = React.useCallback(async (id: string) => {
    setUpdating(id)
    try {
      await fetch("/api/whatsapp/inbox", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, action: "read" }) })
      setData(prev => prev ? { ...prev, messages: prev.messages.map(m => m.id === id ? { ...m, isRead: true } : m), unreadCount: Math.max(0, prev.unreadCount - 1) } : prev)
    } catch { /* ignore */ } finally {
      setUpdating(null)
    }
  }, [])

  const handleFollowUp = React.useCallback(async (id: string) => {
    setUpdating(id)
    try {
      await fetch("/api/whatsapp/inbox", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, action: "follow_up" }) })
      setData(prev => prev ? { ...prev, messages: prev.messages.map(m => m.id === id ? { ...m, isFollowedUp: true, isRead: true } : m) } : prev)
      toast({ title: "Marked as followed up", variant: "success" })
    } catch { /* ignore */ } finally {
      setUpdating(null)
    }
  }, [])

  const handleToggleExpand = React.useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }, [])

  const stats = data?.stats
  const messages = data?.messages ?? []
  const hasMore = data ? page * 20 < data.total : false
  const creatorHandle = data?.creatorProfile?.handle ?? ""

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">WhatsApp Inbox</h1>
          {data && (
            <p className="text-sm text-white/40 mt-0.5">
              {data.unreadCount > 0 ? `${data.unreadCount} unread · ` : ""}{data.total} total
            </p>
          )}
        </div>
        <button
          onClick={() => fetchInbox(filter, page)}
          className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total",       value: stats.totalConversations, icon: <MessageCircle className="h-3.5 w-3.5" /> },
            { label: "Unread",      value: stats.unread,     icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />, warn: stats.unread > 0 },
            { label: "Followed up", value: stats.followedUp, icon: <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> },
            { label: "This week",   value: stats.last7dCount, icon: <TrendingUp className="h-3.5 w-3.5" /> },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/8 bg-white/3 p-3">
              <div className={cn("flex items-center gap-1.5 mb-1.5 text-white/30", s.warn && "text-amber-400/70")}>
                {s.icon}
                <span className="text-[10px] uppercase tracking-wider">{s.label}</span>
              </div>
              <p className={cn("text-xl font-bold", s.warn && s.value > 0 ? "text-amber-400" : "text-white")}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Repeat senders */}
      {stats && stats.repeatSenders > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-brand-purple/60" />
            <h3 className="text-sm font-semibold text-white">Repeat Customers</h3>
            <span className="ml-auto text-xs text-brand-purple">{stats.repeatSenders} senders</span>
          </div>
          <div className="space-y-1.5">
            {stats.topSenders.filter(s => s.count > 1).slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-white/20" />
                  <span className="text-xs text-white/50">{s.name ?? formatPhone(s.phone)}</span>
                </div>
                <span className="text-xs text-white/30">{s.count}× · {timeAgo(s.lastAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Filter className="h-4 w-4 text-white/20 self-center flex-shrink-0" />
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
              filter === f.value
                ? "bg-brand-purple text-white"
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            {f.label}
            {f.value === "unread" && (data?.unreadCount ?? 0) > 0 && (
              <span className="ml-1.5 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                {data!.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
          ))
        ) : messages.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          messages.map(m => (
            <div key={m.id} className={cn(updating === m.id && "opacity-60 pointer-events-none")}>
              <InboxCard
                message={m}
                onRead={handleRead}
                onFollowUp={handleFollowUp}
                expanded={expandedId === m.id}
                onToggleExpand={handleToggleExpand}
                creatorHandle={creatorHandle}
              />
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {hasMore && (
        <button
          onClick={() => { const next = page + 1; setPage(next); void fetchInbox(filter, next) }}
          className="w-full py-3 rounded-2xl border border-white/8 text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          Load more
        </button>
      )}

      {/* Bottom hint */}
      {!loading && messages.length > 0 && (
        <p className="text-[11px] text-white/20 text-center pb-4">
          Tap "Quick reply" on any message to reply or send links via WhatsApp
        </p>
      )}
    </div>
  )
}
