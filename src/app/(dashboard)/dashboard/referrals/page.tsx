"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Copy, CheckCheck, Gift, TrendingUp, Share2,
  MessageCircle, Twitter, Zap, BadgeCheck, Mail, Send,
  ChevronRight, Star, ArrowUpRight, Instagram, QrCode,
  Trophy, Sparkles, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

// ── Constants ────────────────────────────────────────────────────────────────

const REFERRAL_CODE = "SADE2024"
const REFERRAL_URL = `https://lummy.co/join?ref=${REFERRAL_CODE}`

// ── Mock Data ─────────────────────────────────────────────────────────────────

const monthlyEarnings = [
  { month: "Aug", amount: 0 },
  { month: "Sep", amount: 5000 },
  { month: "Oct", amount: 10000 },
  { month: "Nov", amount: 14000 },
  { month: "Dec", amount: 9000 },
  { month: "Jan", amount: 16000 },
  { month: "Feb", amount: 9000 },
]

const TOTAL_EARNINGS = monthlyEarnings.reduce((s, m) => s + m.amount, 0)

interface ReferredCreator {
  id: string
  name: string
  initials: string
  storeName: string
  joinedAt: string
  plan: "free" | "growth" | "pro"
  revenue: number
  commission: number
  status: "active" | "pending"
  avatarColor: string
}

const mockReferrals: ReferredCreator[] = [
  { id: "r1", name: "Temi Adeyemi",    initials: "TA", storeName: "Temi's Closet",    joinedAt: "Nov 2024", plan: "growth", revenue: 145000, commission: 7250,  status: "active",  avatarColor: "#6C4EF3" },
  { id: "r2", name: "Ngozi Okeke",     initials: "NO", storeName: "Ngozi Fabrics",    joinedAt: "Nov 2024", plan: "pro",    revenue: 289000, commission: 14450, status: "active",  avatarColor: "#10B981" },
  { id: "r3", name: "Chiamaka Eze",    initials: "CE", storeName: "Chichi Beauty",    joinedAt: "Oct 2024", plan: "growth", revenue: 98000,  commission: 4900,  status: "active",  avatarColor: "#F97316" },
  { id: "r4", name: "Amara Osei",      initials: "AO", storeName: "Amara Jewels",     joinedAt: "Oct 2024", plan: "pro",    revenue: 312000, commission: 15600, status: "active",  avatarColor: "#F43F5E" },
  { id: "r5", name: "Blessing Nwoke",  initials: "BN", storeName: "Bless Skincare",   joinedAt: "Dec 2024", plan: "free",   revenue: 0,      commission: 0,     status: "pending", avatarColor: "#8B5CF6" },
  { id: "r6", name: "Funmi Lawal",     initials: "FL", storeName: "Funmi's Kitchen",  joinedAt: "Dec 2024", plan: "growth", revenue: 54000,  commission: 2700,  status: "active",  avatarColor: "#F59E0B" },
  { id: "r7", name: "Kemi Okonkwo",    initials: "KO", storeName: "Kemi Crafts",      joinedAt: "Sep 2024", plan: "growth", revenue: 76000,  commission: 3800,  status: "active",  avatarColor: "#3B82F6" },
  { id: "r8", name: "Adaeze Williams", initials: "AW", storeName: "Ada Thrift World", joinedAt: "Dec 2024", plan: "free",   revenue: 0,      commission: 0,     status: "pending", avatarColor: "#EC4899" },
  { id: "r9", name: "Zara Ibrahim",    initials: "ZI", storeName: "Zara Couture",     joinedAt: "Aug 2024", plan: "pro",    revenue: 428000, commission: 21400, status: "active",  avatarColor: "#10B981" },
]

const milestones = [
  { count: 3,  reward: "₦5,000 bonus",       reached: true  },
  { count: 5,  reward: "1 month free Growth", reached: true  },
  { count: 10, reward: "₦25,000 bonus",       reached: true  },
  { count: 15, reward: "1 month free Pro",    reached: false },
  { count: 25, reward: "₦100,000 bonus",      reached: false },
]

const planConfig = {
  free:   { label: "Free",   className: "bg-muted text-muted-foreground border-border" },
  growth: { label: "Growth", className: "bg-brand-purple/10 text-brand-purple border-brand-purple/20" },
  pro:    { label: "Pro",    className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────

function EarningsChart({ data }: { data: { month: string; amount: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1)
  const barW = 28
  const gap = 10
  const chartH = 80
  const totalW = data.length * (barW + gap) - gap

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${totalW} ${chartH + 20}`} className="w-full overflow-visible">
        {data.map((d, i) => {
          const barH = d.amount > 0 ? Math.max(4, (d.amount / max) * chartH) : 4
          const x = i * (barW + gap)
          const y = chartH - barH
          const isLast = i === data.length - 1
          return (
            <g key={d.month}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={4} ry={4}
                className={isLast ? "fill-brand-purple" : "fill-brand-purple/25"}
              />
              <text
                x={x + barW / 2} y={chartH + 14}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
                fontSize={9}
              >
                {d.month}
              </text>
              {d.amount > 0 && (
                <text
                  x={x + barW / 2} y={y - 4}
                  textAnchor="middle"
                  className={isLast ? "fill-brand-purple font-bold" : "fill-muted-foreground"}
                  fontSize={8}
                  fontWeight={isLast ? "700" : "400"}
                >
                  {d.amount >= 1000 ? `₦${d.amount / 1000}k` : `₦${d.amount}`}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── QR Code Display ───────────────────────────────────────────────────────────

function QRCodeDisplay({ url }: { url: string }) {
  // Simplified visual QR placeholder — actual QR lib would be used in production
  const seed = Array.from(url).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const cells = Array.from({ length: 7 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => {
      const isCorner = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2)
      return isCorner || ((seed + r * 7 + c * 11) % 3 === 0)
    })
  )

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-32 h-32 rounded-2xl border-2 border-border bg-white p-3 grid grid-cols-7 gap-[2px]">
        {cells.flat().map((filled, i) => (
          <div key={i} className={cn("rounded-sm", filled ? "bg-foreground" : "bg-transparent")} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center font-mono">{url.replace("https://", "")}</p>
    </div>
  )
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = React.useState("")
  const [sent, setSent] = React.useState(false)

  const handleSend = () => {
    if (!email.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "error" })
      return
    }
    setSent(true)
    setTimeout(() => {
      toast({ title: "Invite sent!", description: `Referral invite sent to ${email}`, variant: "success" })
      onClose()
    }, 1000)
  }

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-border bg-card overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="font-bold text-lg">Invite a creator</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Send your referral link directly to their inbox</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {sent ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="h-16 w-16 rounded-full bg-brand-green/15 border-2 border-brand-green/30 flex items-center justify-center">
                <CheckCheck className="h-8 w-8 text-brand-green" />
              </div>
              <p className="font-bold">Invite sent!</p>
              <p className="text-sm text-muted-foreground">They'll receive your referral link and a welcome note.</p>
            </motion.div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Email address</label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="creator@example.com"
                    className="flex-1 text-sm bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-brand-purple/5 border border-brand-purple/15 p-3 text-xs text-muted-foreground">
                <p>They&apos;ll receive a personalised email with your referral code <strong className="text-brand-purple font-mono">{REFERRAL_CODE}</strong> and a link to join Lummy for free.</p>
              </div>

              <Button className="w-full h-11 gap-2" onClick={handleSend}>
                <Send className="h-4 w-4" /> Send invite
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReferralsPage() {
  const [copied, setCopied] = React.useState(false)
  const [copiedUrl, setCopiedUrl] = React.useState(false)
  const [showInvite, setShowInvite] = React.useState(false)
  const [showQR, setShowQR] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"referrals" | "earnings">("referrals")
  const [sortBy, setSortBy] = React.useState<"revenue" | "commission" | "joined">("commission")

  const copyCode = () => {
    navigator.clipboard.writeText(REFERRAL_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
    toast({ title: "Code copied!" })
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(REFERRAL_URL)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2500)
    toast({ title: "Link copied!" })
  }

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Hey! 👋 You should check out Lummy — it's the easiest way to sell on WhatsApp in Nigeria.\n\nI've been using it for my store and it's 🔥\n\nJoin free with my link and we both get rewards:\n${REFERRAL_URL}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`If you're a Nigerian creator selling anything online, you need @LummyHQ 🚀\n\nIt's a full creator commerce OS — WhatsApp orders, analytics, CRM, AI captions.\n\nJoin free with my link: ${REFERRAL_URL}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
  }

  const activeReferrals = mockReferrals.filter(r => r.status === "active")
  const nextMilestone = milestones.find(m => !m.reached)
  const totalNetworkRevenue = mockReferrals.reduce((s, r) => s + r.revenue, 0)
  const totalCommission = mockReferrals.reduce((s, r) => s + r.commission, 0)

  const sortedReferrals = [...mockReferrals].sort((a, b) => {
    if (sortBy === "revenue") return b.revenue - a.revenue
    if (sortBy === "commission") return b.commission - a.commission
    return 0
  })

  const stats = [
    { label: "Total referrals",  value: String(mockReferrals.length), icon: Users,      color: "text-brand-purple", bg: "bg-brand-purple/10", change: "+3 this month" },
    { label: "Active creators",  value: String(activeReferrals.length), icon: BadgeCheck, color: "text-brand-green",  bg: "bg-brand-green/10",  change: `${Math.round(activeReferrals.length / mockReferrals.length * 100)}% conversion` },
    { label: "Your earnings",    value: `₦${totalCommission.toLocaleString()}`, icon: Gift, color: "text-amber-500", bg: "bg-amber-500/10", change: "+₦9k this month" },
    { label: "Milestone",        value: "3×",  icon: Zap,        color: "text-brand-coral",  bg: "bg-brand-coral/10", change: "3 milestones reached" },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Refer &amp; Earn</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Share Lummy with fellow creators and earn cash bonuses + free plan upgrades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs" onClick={() => setShowQR(v => !v)}>
            <QrCode className="h-3.5 w-3.5" />
            QR Code
          </Button>
          <Button size="sm" className="gap-1.5 h-9 text-xs" onClick={() => setShowInvite(true)}>
            <Mail className="h-3.5 w-3.5" />
            Invite creators
          </Button>
        </div>
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-brand-purple/20 bg-gradient-to-r from-brand-purple/5 to-brand-indigo/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-purple mb-3">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", label: "Share your link",         desc: "Send your unique referral link to other creators" },
            { step: "2", label: "They join Lummy",         desc: "When they sign up and go live, you both win" },
            { step: "3", label: "Earn cash & free months", desc: "Get ₦5k–₦100k bonuses based on referral milestones" },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-purple text-white text-xs font-bold flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

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
              <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* QR Code panel */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row items-center gap-6">
              <QRCodeDisplay url={REFERRAL_URL} />
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <p className="font-bold text-base">Scan to join Lummy</p>
                  <p className="text-xs text-muted-foreground mt-1">Share this QR code in your Instagram stories, WhatsApp status, or print it on packaging</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={() => toast({ title: "Download coming soon!", description: "QR code download will be available soon." })}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={copyUrl}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors"
                  >
                    {copiedUrl ? <CheckCheck className="h-3 w-3 text-brand-green" /> : <Copy className="h-3 w-3" />}
                    Copy link
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Referral link card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-bold text-base mb-4">Your referral link</h2>

        {/* Code */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
            <Gift className="h-4 w-4 text-brand-purple flex-shrink-0" />
            <span className="font-mono font-bold text-brand-purple tracking-widest text-sm">{REFERRAL_CODE}</span>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 h-11 px-4 rounded-xl border border-border bg-background hover:bg-accent transition-colors text-xs font-semibold flex-shrink-0"
          >
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy code"}
          </button>
        </div>

        {/* URL */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-xs text-muted-foreground truncate font-mono">
            {REFERRAL_URL}
          </div>
          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border bg-background hover:bg-accent transition-colors text-xs font-semibold flex-shrink-0"
          >
            {copiedUrl ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedUrl ? "Copied!" : "Copy link"}
          </button>
        </div>

        {/* Share */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2.5">Share directly</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20b958] text-white text-xs font-semibold transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 fill-white" />
              WhatsApp
            </button>
            <button
              onClick={shareOnTwitter}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-foreground hover:opacity-80 text-background text-xs font-semibold transition-colors"
            >
              <Twitter className="h-3.5 w-3.5" />
              Twitter / X
            </button>
            <button
              onClick={() => {
                const text = encodeURIComponent(`Join me on Lummy 🚀 ${REFERRAL_URL}`)
                window.open(`https://instagram.com/direct/new?text=${text}`, "_blank")
              }}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90 text-white text-xs font-semibold transition-opacity"
            >
              <Instagram className="h-3.5 w-3.5" />
              Instagram
            </button>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              Email invite
            </button>
            <button
              onClick={() => {
                if (navigator.share) navigator.share({ title: "Join Lummy", url: REFERRAL_URL })
                else { copyUrl() }
              }}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              More
            </button>
          </div>
        </div>
      </motion.div>

      {/* Earnings chart + milestone tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Earnings chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base">Earnings history</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Commission earned per month</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-brand-purple">₦{totalCommission.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">All time</p>
            </div>
          </div>
          <EarningsChart data={monthlyEarnings} />

          {/* Mini stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="font-bold text-sm">₦{monthlyEarnings.at(-1)!.amount.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">This month</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="font-bold text-sm">₦{totalNetworkRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Network revenue</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">5%</p>
              <p className="text-[10px] text-muted-foreground">Commission rate</p>
            </div>
          </div>
        </motion.div>

        {/* Milestone tracker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Milestones</h2>
              <p className="text-[10px] text-muted-foreground">{activeReferrals.length} of {nextMilestone?.count ?? "∞"} active</p>
            </div>
          </div>

          {nextMilestone && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Next: <strong className="text-foreground">{nextMilestone.reward}</strong></span>
                <span className="font-semibold text-brand-purple">{activeReferrals.length}/{nextMilestone.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((activeReferrals.length / nextMilestone.count) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-indigo"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {nextMilestone.count - activeReferrals.length} more creators needed
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            {milestones.map((m) => (
              <div key={m.count} className="flex items-center gap-2.5">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 text-[10px] font-bold",
                  m.reached ? "bg-brand-purple text-white" : "bg-muted text-muted-foreground"
                )}>
                  {m.reached ? "✓" : m.count}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-semibold", m.reached ? "text-foreground" : "text-muted-foreground")}>
                    {m.count} referrals
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.reward}</p>
                </div>
                {m.reached && (
                  <span className="text-[9px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 rounded-full px-1.5 py-0.5 flex-shrink-0">
                    Claimed
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Referrals table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-xl border border-border bg-muted/30">
              {(["referrals", "earnings"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all",
                    activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{mockReferrals.length} total</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="h-7 px-2 text-xs rounded-lg border border-border bg-background focus:outline-none"
            >
              <option value="commission">Commission</option>
              <option value="revenue">Revenue</option>
              <option value="joined">Joined date</option>
            </select>
          </div>
        </div>

        {activeTab === "referrals" ? (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_90px_80px_100px_80px] gap-4 px-5 py-2.5 bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <span>Creator</span>
              <span>Plan</span>
              <span>Joined</span>
              <span>Revenue</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-border">
              {sortedReferrals.map((creator, i) => {
                const plan = planConfig[creator.plan]
                return (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_90px_80px_100px_80px] gap-2 sm:gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: creator.avatarColor }}
                      >
                        {creator.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{creator.name}</p>
                        <p className="text-[11px] text-muted-foreground">{creator.storeName}</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center self-center">
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", plan.className)}>
                        {plan.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground hidden sm:block self-center">{creator.joinedAt}</p>
                    <p className="text-sm font-semibold hidden sm:block self-center">
                      {creator.revenue > 0 ? `₦${creator.revenue.toLocaleString()}` : "—"}
                    </p>
                    <div className="hidden sm:flex items-center self-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        creator.status === "active"
                          ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", creator.status === "active" ? "bg-brand-green" : "bg-amber-400")} />
                        {creator.status === "active" ? "Active" : "Pending"}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_100px_110px_110px] gap-4 px-5 py-2.5 bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <span>Creator</span>
              <span>Plan</span>
              <span>Their Revenue</span>
              <span>Your Commission</span>
            </div>
            <div className="divide-y divide-border">
              {sortedReferrals.filter(r => r.status === "active").map((creator, i) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_100px_110px_110px] gap-2 sm:gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: creator.avatarColor }}
                    >
                      {creator.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{creator.name}</p>
                      <p className="text-[11px] text-muted-foreground">{creator.storeName}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center self-center">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", planConfig[creator.plan].className)}>
                      {planConfig[creator.plan].label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold hidden sm:block self-center text-muted-foreground">
                    ₦{creator.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm font-bold hidden sm:block self-center text-brand-green">
                    +₦{creator.commission.toLocaleString()}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">5% commission on active creator revenue</p>
              <p className="text-sm font-bold text-brand-green">Total: ₦{totalCommission.toLocaleString()}</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Earnings summary + AI tip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Gift className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Total earnings from referrals</p>
              <p className="text-2xl font-bold text-amber-500 mt-0.5">₦{totalCommission.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Next payout: <strong>₦9,000</strong> on June 1st ·
                <span className="text-brand-purple font-medium"> +₦25,000 bonus</span> once you reach 15 referrals
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-9 text-xs flex-shrink-0 gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
              Withdraw
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-purple/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-brand-purple" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI tip: grow your referrals</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Creators who share their referral link in WhatsApp status get <strong className="text-foreground">3× more sign-ups</strong> on average.
                Try posting your link today with a before/after story about your store.
              </p>
              <button
                onClick={shareOnWhatsApp}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-purple hover:underline"
              >
                Share to WhatsApp status <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
    </div>
  )
}
