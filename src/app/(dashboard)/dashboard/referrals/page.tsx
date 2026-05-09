"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Users,
  Copy,
  CheckCheck,
  Gift,
  TrendingUp,
  Star,
  Share2,
  MessageCircle,
  Twitter,
  Instagram,
  ArrowUpRight,
  Zap,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const REFERRAL_CODE = "SADE2024"
const REFERRAL_URL = `https://lummy.co/join?ref=${REFERRAL_CODE}`

const stats = [
  { label: "Total referrals", value: "14", icon: Users,       color: "text-brand-purple", bg: "bg-brand-purple/10", change: "+3 this month" },
  { label: "Active creators", value: "9",  icon: BadgeCheck,  color: "text-brand-green",  bg: "bg-brand-green/10",  change: "64% conversion" },
  { label: "Your earnings",   value: "₦63,000", icon: Gift,   color: "text-amber-500",   bg: "bg-amber-500/10",   change: "+₦9k this month" },
  { label: "Bonus unlocked",  value: "3×",  icon: Zap,        color: "text-brand-coral",  bg: "bg-brand-coral/10",  change: "3 milestone reached" },
]

interface ReferredCreator {
  id: string
  name: string
  storeName: string
  joinedAt: string
  plan: "free" | "growth" | "pro"
  revenue: number
  status: "active" | "pending"
}

const mockReferrals: ReferredCreator[] = [
  { id: "r1", name: "Temi Adeyemi",    storeName: "Temi's Closet",     joinedAt: "Nov 2024", plan: "growth", revenue: 145000, status: "active" },
  { id: "r2", name: "Ngozi Okeke",     storeName: "Ngozi Fabrics",     joinedAt: "Nov 2024", plan: "pro",    revenue: 289000, status: "active" },
  { id: "r3", name: "Chiamaka Eze",    storeName: "Chichi Beauty",     joinedAt: "Oct 2024", plan: "growth", revenue: 98000,  status: "active" },
  { id: "r4", name: "Amara Osei",      storeName: "Amara Jewels",      joinedAt: "Oct 2024", plan: "pro",    revenue: 312000, status: "active" },
  { id: "r5", name: "Blessing Nwoke",  storeName: "Bless Skincare",    joinedAt: "Dec 2024", plan: "free",   revenue: 0,      status: "pending" },
  { id: "r6", name: "Funmi Lawal",     storeName: "Funmi's Kitchen",   joinedAt: "Dec 2024", plan: "growth", revenue: 54000,  status: "active" },
  { id: "r7", name: "Kemi Okonkwo",    storeName: "Kemi Crafts",       joinedAt: "Sep 2024", plan: "growth", revenue: 76000,  status: "active" },
  { id: "r8", name: "Adaeze Williams", storeName: "Ada Thrift World",  joinedAt: "Dec 2024", plan: "free",   revenue: 0,      status: "pending" },
  { id: "r9", name: "Zara Ibrahim",    storeName: "Zara Couture",      joinedAt: "Aug 2024", plan: "pro",    revenue: 428000, status: "active" },
]

const milestones = [
  { count: 3,  reward: "₦5,000 bonus",        reached: true },
  { count: 5,  reward: "1 month free Growth",  reached: true },
  { count: 10, reward: "₦25,000 bonus",        reached: true },
  { count: 15, reward: "1 month free Pro",     reached: false },
  { count: 25, reward: "₦100,000 bonus",       reached: false },
]

const planConfig = {
  free:   { label: "Free",   className: "bg-muted text-muted-foreground border-border" },
  growth: { label: "Growth", className: "bg-brand-purple/10 text-brand-purple border-brand-purple/20" },
  pro:    { label: "Pro",    className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
}

export default function ReferralsPage() {
  const [copied, setCopied] = React.useState(false)
  const [copiedUrl, setCopiedUrl] = React.useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(REFERRAL_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(REFERRAL_URL)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2500)
  }

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Hey! 👋 You should check out Lummy — it's the easiest way to sell on WhatsApp in Nigeria.\n\nI've been using it for my store and it's 🔥\n\nJoin with my link and get a free month: ${REFERRAL_URL}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`If you're a Nigerian creator selling anything online, you need @LummyHQ 🚀\n\nIt's a full creator commerce OS — WhatsApp orders, analytics, CRM, AI captions.\n\nJoin free with my link: ${REFERRAL_URL}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
  }

  const activeReferrals = mockReferrals.filter(r => r.status === "active").length
  const nextMilestone = milestones.find(m => !m.reached)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold">Refer & Earn</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Share Lummy with fellow creators and earn cash bonuses + free plan upgrades
        </p>
      </div>

      {/* How it works banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-brand-purple/20 bg-gradient-to-r from-brand-purple/5 to-brand-indigo/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-purple mb-3">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", label: "Share your link",        desc: "Send your unique referral link to other creators" },
            { step: "2", label: "They join Lummy",        desc: "When they sign up and go live, you both win" },
            { step: "3", label: "Earn cash & free months",desc: "Get ₦5k–₦100k bonuses based on referral milestones" },
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
            <p className="font-display text-xl font-extrabold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral link card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-display font-bold text-base mb-4">Your referral link</h2>

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

        {/* Share buttons */}
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
                if (navigator.share) navigator.share({ title: "Join Lummy", url: REFERRAL_URL })
                else { navigator.clipboard.writeText(REFERRAL_URL); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2500) }
              }}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
        </div>
      </motion.div>

      {/* Milestones + referral list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Milestone tracker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="font-display font-bold text-base mb-1">Milestones</h2>
          <p className="text-xs text-muted-foreground mb-4">{activeReferrals} of {nextMilestone?.count ?? "∞"} active referrals</p>

          {/* Progress bar to next */}
          {nextMilestone && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress to next milestone</span>
                <span className="font-semibold text-brand-purple">{activeReferrals}/{nextMilestone.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-indigo transition-all duration-700"
                  style={{ width: `${Math.min((activeReferrals / nextMilestone.count) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {nextMilestone.count - activeReferrals} more to unlock <strong>{nextMilestone.reward}</strong>
              </p>
            </div>
          )}

          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m.count} className="flex items-center gap-3">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 text-xs font-bold",
                  m.reached ? "bg-brand-purple text-white" : "bg-muted text-muted-foreground"
                )}>
                  {m.reached ? "✓" : m.count}
                </div>
                <div className="flex-1">
                  <p className={cn("text-xs font-semibold", m.reached ? "text-foreground" : "text-muted-foreground")}>
                    {m.count} referrals
                  </p>
                  <p className="text-[10px] text-muted-foreground">{m.reward}</p>
                </div>
                {m.reached && <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 rounded-full px-2 py-0.5">Claimed</span>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Referred creators list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-bold text-base">Your referrals</h2>
            <span className="text-xs text-muted-foreground">{mockReferrals.length} total</span>
          </div>

          <div className="hidden sm:grid grid-cols-[1fr_100px_90px_100px_80px] gap-4 px-5 py-2.5 bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
            <span>Creator</span>
            <span>Joined</span>
            <span>Plan</span>
            <span>Revenue</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-border max-h-[400px] overflow-y-auto scrollbar-hide">
            {mockReferrals.map((creator, i) => {
              const plan = planConfig[creator.plan]
              return (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_100px_90px_100px_80px] gap-2 sm:gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-purple/10 flex items-center justify-center text-xs font-bold text-brand-purple flex-shrink-0">
                      {creator.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{creator.name}</p>
                      <p className="text-[11px] text-muted-foreground">{creator.storeName}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block self-center">{creator.joinedAt}</p>
                  <div className="hidden sm:flex items-center self-center">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", plan.className)}>
                      {plan.label}
                    </span>
                  </div>
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
        </motion.div>
      </div>

      {/* Earnings summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Gift className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Total earnings from referrals</p>
              <p className="font-display text-2xl font-extrabold text-amber-500 mt-0.5">₦63,000</p>
              <p className="text-xs text-muted-foreground mt-1">
                Next payout: <strong>₦9,000</strong> on January 1st ·
                <span className="text-brand-purple font-medium"> +₦25,000 bonus</span> once you reach 15 referrals
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-9 text-xs flex-shrink-0 gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
            Withdraw
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
