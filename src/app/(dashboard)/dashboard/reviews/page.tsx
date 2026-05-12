"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star, MessageSquare, TrendingUp, ThumbsUp, Search,
  ChevronDown, MessageCircle, CheckCheck, RotateCcw,
  Send, Users, Sparkles, X, Filter, BarChart3,
  ArrowUpRight, Bell, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface Review {
  id: string; customer: string; phone: string; product: string
  rating: number; comment: string; date: string; verified: boolean
  helpful: number; replied: boolean; month: string
}

const mockReviews: Review[] = [
  { id: "R1", customer: "Amaka O.",  phone: "+234 803 111 2222", product: "Ankara Peplum Top",   rating: 5, comment: "Absolutely love this! The fabric quality is amazing and it fits perfectly. Will definitely order again.",          date: "May 3, 2026",  verified: true,  helpful: 12, replied: true,  month: "May"   },
  { id: "R2", customer: "Chidi N.",  phone: "+234 806 222 3333", product: "Men's Agbada Set",    rating: 5, comment: "Very professional packaging and the material is top notch. Got so many compliments at the event!",            date: "Apr 29, 2026", verified: true,  helpful: 8,  replied: true,  month: "Apr"   },
  { id: "R3", customer: "Funmi A.",  phone: "+234 810 333 4444", product: "Lace Iro & Buba",     rating: 4, comment: "Beautiful design, delivery was a bit slow but the quality made up for it. Highly recommended.",              date: "Apr 22, 2026", verified: true,  helpful: 5,  replied: false, month: "Apr"   },
  { id: "R4", customer: "Tunde B.",  phone: "+234 817 444 5555", product: "Dashiki Shirt",        rating: 5, comment: "Perfect fit and the colors are vibrant. Customer service was excellent when I had a size question.",         date: "Apr 18, 2026", verified: true,  helpful: 7,  replied: true,  month: "Apr"   },
  { id: "R5", customer: "Ngozi M.",  phone: "+234 808 555 6666", product: "Adire Gown",           rating: 3, comment: "Nice fabric but the stitching on one side wasn't clean. Seller resolved it quickly though.",               date: "Apr 10, 2026", verified: true,  helpful: 2,  replied: false, month: "Apr"   },
  { id: "R6", customer: "Emeka I.",  phone: "+234 816 666 7777", product: "Aso-Oke Fila",         rating: 5, comment: "Excellent quality! This is my third order from this store. Never disappointed.",                          date: "Apr 5, 2026",  verified: true,  helpful: 14, replied: true,  month: "Apr"   },
  { id: "R7", customer: "Blessing E.", phone: "+234 814 234 5678", product: "Perfume Collection Box", rating: 5, comment: "The scents are absolutely divine! Very rich packaging. Perfect as a gift.",                            date: "Mar 28, 2026", verified: true,  helpful: 9,  replied: true,  month: "Mar"   },
  { id: "R8", customer: "Folake A.", phone: "+234 705 123 4567", product: "Beaded Necklace Set",  rating: 4, comment: "Beautiful pieces, very unique. The photos matched exactly what arrived. Shipping took a week though.",      date: "Mar 15, 2026", verified: true,  helpful: 6,  replied: false, month: "Mar"   },
]

const MONTHLY_RATINGS = [
  { month: "Jan", avg: 4.6, count: 8  },
  { month: "Feb", avg: 4.4, count: 11 },
  { month: "Mar", avg: 4.7, count: 14 },
  { month: "Apr", avg: 4.5, count: 19 },
  { month: "May", avg: 5.0, count: 6  },
]

const PRODUCTS = ["All Products", ...Array.from(new Set(mockReviews.map(r => r.product)))]

const UNREVIEWD_CUSTOMERS = [
  { name: "Kemi Adeyemi",     phone: "+234 806 123 4567", product: "Beaded Necklace Set",    deliveredDays: 5  },
  { name: "Chisom Nwachukwu", phone: "+234 802 345 6789", product: "Silk Blouse",            deliveredDays: 14 },
  { name: "Tolani Bakare",    phone: "+234 817 890 1234", product: "Embroidered Set",         deliveredDays: 7  },
  { name: "Amaka Eze",        phone: "+234 903 456 7890", product: "Beaded Bracelet",         deliveredDays: 3  },
]

const DEFAULT_REPLIES: Record<number, string> = {
  5: "Thank you so much {firstName}! 💜 Your kind words mean the world to us. We're so happy you love your {product}! Can't wait to serve you again 🛍️",
  4: "Thank you for your feedback {firstName}! 😊 So glad you enjoyed your {product}. We're always working to improve — your review helps us a lot! 💜",
  3: "Thank you for your honest feedback {firstName}. We're sorry your experience wasn't perfect, but we're glad we could resolve it. Your satisfaction is our top priority 💜",
}

const REVIEW_REQUEST_TEMPLATE = (firstName: string, product: string) =>
  `Hi ${firstName}! 👋 Thanks for ordering ${product} from us. We'd love to know how you're enjoying it! Could you leave us a quick review? Your feedback helps us serve you better 💜 It takes less than 30 seconds!`

function buildReply(rating: number, customer: string, product: string) {
  const firstName = customer.split(" ")[0]
  return (DEFAULT_REPLIES[rating] ?? DEFAULT_REPLIES[3])
    .replace("{firstName}", firstName)
    .replace("{product}", product)
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3 w-3"
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={cn(cls, n <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20")} />
      ))}
    </div>
  )
}

function RatingTrendChart() {
  const max = 5
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rating Trend</p>
      <div className="flex items-end gap-2 h-16">
        {MONTHLY_RATINGS.map((m, i) => {
          const pct = (m.avg / max) * 100
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] font-bold text-brand-purple">{m.avg}</span>
              <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                transition={{ delay: i * 0.08, type: "spring", damping: 20 }}
                className="w-full rounded-t-md bg-amber-400/80 hover:bg-amber-400 transition-colors"
                style={{ minHeight: 4 }} />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2">
        {MONTHLY_RATINGS.map(m => (
          <p key={m.month} className="flex-1 text-center text-[9px] text-muted-foreground">{m.month}</p>
        ))}
      </div>
    </div>
  )
}

function ReviewCard({ review, onMarkReplied }: { review: Review; onMarkReplied: (id: string) => void }) {
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyText, setReplyText] = React.useState(() => buildReply(review.rating, review.customer, review.product))
  const [sent, setSent] = React.useState(review.replied)
  const waUrl = `https://wa.me/${review.phone.replace(/\D/g, "")}?text=${encodeURIComponent(replyText)}`

  const handleSend = () => {
    setSent(true)
    onMarkReplied(review.id)
    toast({ title: "Reply sent via WhatsApp!", description: `Message sent to ${review.customer}.`, variant: "success" })
    setTimeout(() => setReplyOpen(false), 1500)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl border bg-card p-4 transition-colors",
        !review.replied && !sent ? "border-amber-500/20 bg-amber-500/2" : "border-border")}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-xs font-bold text-brand-purple flex-shrink-0">
            {review.customer.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-semibold">{review.customer}</p>
              {review.verified && <span className="text-[9px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded-full font-semibold">Verified</span>}
              {!review.replied && !sent && (
                <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold border border-amber-500/20">Needs reply</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{review.date}</p>
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">&ldquo;{review.comment}&rdquo;</p>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-[10px] text-brand-purple/70 font-medium truncate flex items-center gap-1">
          <Package className="h-3 w-3 flex-shrink-0" />{review.product}
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ThumbsUp className="h-3 w-3" /> {review.helpful}
          </div>
          {sent || review.replied ? (
            <span className="flex items-center gap-1 text-[11px] text-brand-green font-semibold">
              <CheckCheck className="h-3 w-3" /> Replied
            </span>
          ) : (
            <button onClick={() => setReplyOpen(v => !v)}
              className={cn("flex items-center gap-1 text-[11px] font-semibold transition-colors",
                replyOpen ? "text-brand-purple" : "text-muted-foreground hover:text-brand-purple")}>
              <MessageCircle className="h-3 w-3" />
              {replyOpen ? "Hide" : "Reply"}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {replyOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp reply</p>
                <button onClick={() => setReplyText(buildReply(review.rating, review.customer, review.product))}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30 leading-relaxed" />
              <div className="flex gap-2">
                <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={handleSend} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl bg-[#25D366] hover:bg-[#20b958] text-white text-xs font-semibold transition-colors">
                    {sent
                      ? <><CheckCheck className="h-3.5 w-3.5" />Sent!</>
                      : <><MessageCircle className="h-3.5 w-3.5 fill-white" />Send via WhatsApp</>}
                  </button>
                </a>
                <button onClick={() => setReplyOpen(false)}
                  className="h-8 px-3 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function RequestReviewModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [customMsg, setCustomMsg] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(name) ? s.delete(name) : s.add(name)
      return s
    })
  }

  const selectAll = () => setSelected(new Set(UNREVIEWD_CUSTOMERS.map(c => c.name)))
  const clearAll = () => setSelected(new Set())

  const handleSend = () => {
    if (selected.size === 0) { toast({ title: "Select at least one customer" }); return }
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setDone(true)
      toast({ title: `Review requests sent to ${selected.size} customer${selected.size > 1 ? "s" : ""}`, variant: "success" })
      setTimeout(onClose, 1500)
    }, 1500)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-border bg-card overflow-hidden shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-purple/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-brand-purple" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm">Request Reviews</h2>
              <p className="text-[10px] text-muted-foreground">Send review requests via WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {done ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
                <CheckCheck className="h-7 w-7 text-brand-green" />
              </div>
              <p className="text-sm font-bold">Requests sent!</p>
              <p className="text-xs text-muted-foreground">{selected.size} customers will receive a WhatsApp review request.</p>
            </div>
          ) : (
            <>
              {/* Customer list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Customers without reviews ({UNREVIEWD_CUSTOMERS.length})
                  </p>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-[10px] text-brand-purple hover:underline font-semibold">All</button>
                    <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:underline">None</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {UNREVIEWD_CUSTOMERS.map(c => (
                    <label key={c.name}
                      className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        selected.has(c.name) ? "border-brand-purple/30 bg-brand-purple/5" : "border-border hover:border-foreground/10")}>
                      <input type="checkbox" checked={selected.has(c.name)} onChange={() => toggleSelect(c.name)}
                        className="w-3.5 h-3.5 rounded accent-brand-purple flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.product} · delivered {c.deliveredDays}d ago
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message preview</p>
                  <span className="text-[10px] text-brand-purple flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI-generated
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    value={customMsg || REVIEW_REQUEST_TEMPLATE("them", "their order")}
                    onChange={e => setCustomMsg(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 leading-relaxed"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {`{firstName}`} and {`{product}`} will be replaced per customer.
                </p>
              </div>

              <Button
                onClick={handleSend}
                disabled={sending || selected.size === 0}
                variant="whatsapp"
                className="w-full gap-2 h-10">
                {sending
                  ? <><span className="animate-spin">⏳</span> Sending…</>
                  : <><Send className="h-3.5 w-3.5" /> Send to {selected.size || 0} customer{selected.size !== 1 ? "s" : ""}</>}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>(mockReviews)
  const [search, setSearch] = React.useState("")
  const [ratingFilter, setRatingFilter] = React.useState("All")
  const [productFilter, setProductFilter] = React.useState("All Products")
  const [showUnreplied, setShowUnreplied] = React.useState(false)
  const [requestModalOpen, setRequestModalOpen] = React.useState(false)

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
  const repliedCount = reviews.filter(r => r.replied).length
  const unrepliedCount = reviews.filter(r => !r.replied).length

  const ratingDist = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length
    return { stars, count, pct: Math.round((count / reviews.length) * 100) }
  })

  const filtered = reviews.filter(r => {
    const matchSearch = !search || r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
    const matchRating = ratingFilter === "All" || r.rating === Number(ratingFilter)
    const matchProduct = productFilter === "All Products" || r.product === productFilter
    const matchUnreplied = !showUnreplied || !r.replied
    return matchSearch && matchRating && matchProduct && matchUnreplied
  })

  const markReplied = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, replied: true } : r))
  }

  return (
    <>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Reviews</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Customer feedback and product ratings</p>
          </div>
          <Button size="sm" onClick={() => setRequestModalOpen(true)} variant="whatsapp" className="gap-1.5 h-9 text-xs flex-shrink-0">
            <Send className="h-3.5 w-3.5" /> Request Reviews
          </Button>
        </div>

        {/* Unreplied nudge */}
        {unrepliedCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">{unrepliedCount} review{unrepliedCount > 1 ? "s" : ""} awaiting your reply</p>
                <p className="text-xs text-muted-foreground mt-0.5">Replying builds trust and boosts your store&apos;s visibility.</p>
              </div>
            </div>
            <button onClick={() => setShowUnreplied(true)}
              className="flex-shrink-0 text-xs font-semibold text-amber-600 hover:underline whitespace-nowrap">
              View {unrepliedCount} →
            </button>
          </motion.div>
        )}

        {/* Summary card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Score */}
            <div className="flex flex-col items-center justify-center sm:border-r border-border sm:pr-5 sm:min-w-[130px]">
              <p className="font-display text-5xl font-extrabold text-amber-400">{avgRating}</p>
              <StarRow rating={Math.round(Number(avgRating))} size="md" />
              <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
            </div>

            {/* Rating bars */}
            <div className="flex-1 space-y-2">
              {ratingDist.map(d => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3 text-right">{d.stars}</span>
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }}
                      transition={{ delay: 0.2, type: "spring", damping: 20 }}
                      className="h-full bg-amber-400 rounded-full" />
                  </div>
                  <span className="text-xs text-muted-foreground w-5">{d.count}</span>
                </div>
              ))}
            </div>

            {/* Stats + trend */}
            <div className="sm:border-l border-border sm:pl-5 sm:min-w-[200px] space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Satisfied",  value: "94%",              icon: ThumbsUp,  color: "text-brand-green"  },
                  { label: "Response",   value: `${repliedCount}/${reviews.length}`, icon: MessageSquare, color: "text-brand-purple" },
                  { label: "Trend",      value: "+12%",             icon: TrendingUp,color: "text-brand-coral"  },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <m.icon className={cn("h-4 w-4 mx-auto mb-1", m.color)} />
                    <p className="text-sm font-bold">{m.value}</p>
                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
              <RatingTrendChart />
            </div>
          </div>
        </motion.div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Avg Rating",   value: avgRating,                   icon: Star,         color: "text-amber-500",    sub: "All time" },
            { label: "Total Reviews",value: reviews.length.toString(),    icon: MessageSquare,color: "text-brand-purple", sub: `${reviews.length} total` },
            { label: "Replied",      value: `${repliedCount}`,            icon: CheckCheck,   color: "text-brand-green",  sub: "Responded to" },
            { label: "Awaiting",     value: `${unrepliedCount}`,          icon: Bell,         color: unrepliedCount > 0 ? "text-amber-500" : "text-muted-foreground", sub: "Need reply" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{stat.label}</p>
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
              <p className="font-display text-xl font-extrabold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews…"
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>

          {/* Product filter */}
          <div className="relative">
            <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 appearance-none cursor-pointer">
              {PRODUCTS.map(p => <option key={p} value={p}>{p.length > 20 ? p.slice(0, 18) + "…" : p}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Rating filter */}
          <div className="relative">
            <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 appearance-none cursor-pointer">
              <option value="All">All stars</option>
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Unreplied toggle */}
          <button onClick={() => setShowUnreplied(v => !v)}
            className={cn("flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-all",
              showUnreplied ? "border-amber-500/40 bg-amber-500/10 text-amber-600" : "border-border text-muted-foreground hover:border-foreground/20")}>
            <Filter className="h-3.5 w-3.5" />
            {showUnreplied ? "Unreplied only" : "All replies"}
          </button>
        </div>

        {/* Reviews list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground rounded-2xl border border-border bg-card">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No reviews found</p>
              <p className="text-xs mt-1">Try a different filter or search term</p>
            </div>
          ) : filtered.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <ReviewCard review={review} onMarkReplied={markReplied} />
            </motion.div>
          ))}
        </div>

        {/* CTA — request more reviews */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-[#25D366]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Get more reviews automatically</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {UNREVIEWD_CUSTOMERS.length} recent customers haven&apos;t left a review yet. A quick WhatsApp nudge works great.
              </p>
            </div>
          </div>
          <Button size="sm" variant="whatsapp" className="gap-1.5 text-xs h-8 flex-shrink-0"
            onClick={() => setRequestModalOpen(true)}>
            <ArrowUpRight className="h-3.5 w-3.5" /> Request
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {requestModalOpen && <RequestReviewModal onClose={() => setRequestModalOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
