"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle,
  ArrowUpRight, Building2, ChevronRight, Download, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const mockPayouts = [
  { id: "PAY-001", amount: 125000, date: "May 5, 2026", method: "GTBank •••• 4521", status: "completed", ref: "TXN8812993" },
  { id: "PAY-002", amount: 87500,  date: "Apr 28, 2026", method: "GTBank •••• 4521", status: "completed", ref: "TXN8811204" },
  { id: "PAY-003", amount: 210000, date: "Apr 14, 2026", method: "GTBank •••• 4521", status: "completed", ref: "TXN8809876" },
  { id: "PAY-004", amount: 55000,  date: "Mar 30, 2026", method: "GTBank •••• 4521", status: "completed", ref: "TXN8807541" },
  { id: "PAY-005", amount: 168000, date: "Mar 15, 2026", method: "GTBank •••• 4521", status: "completed", ref: "TXN8805322" },
]

const statusConfig = {
  completed: { label: "Paid", color: "bg-brand-green/10 text-brand-green", icon: CheckCircle2 },
  pending:   { label: "Pending", color: "bg-amber-500/10 text-amber-500", icon: Clock },
  failed:    { label: "Failed", color: "bg-brand-coral/10 text-brand-coral", icon: AlertCircle },
} as const

export default function PayoutsPage() {
  const [isRequesting, setIsRequesting] = React.useState(false)

  const balance = 312500
  const pending = 87000
  const totalPaid = mockPayouts.reduce((s, p) => s + p.amount, 0)

  const handleRequest = () => {
    setIsRequesting(true)
    setTimeout(() => setIsRequesting(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold">Payouts</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your earnings and bank withdrawals</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Available Balance", value: `₦${balance.toLocaleString()}`, icon: Wallet, color: "text-brand-purple", bg: "bg-brand-purple/10", action: true },
          { label: "Pending Clearance", value: `₦${pending.toLocaleString()}`, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", action: false },
          { label: "Total Paid Out", value: `₦${totalPaid.toLocaleString()}`, icon: TrendingUp, color: "text-brand-green", bg: "bg-brand-green/10", action: false },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", card.bg)}>
                <card.icon className={cn("h-4.5 w-4.5", card.color)} />
              </div>
              {card.action && (
                <Button size="sm" onClick={handleRequest} disabled={isRequesting} className="h-7 text-xs gap-1">
                  {isRequesting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ArrowUpRight className="h-3 w-3" />}
                  {isRequesting ? "Processing…" : "Withdraw"}
                </Button>
              )}
            </div>
            <p className="font-display text-2xl font-extrabold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Bank account */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
        className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Linked Bank Account</h2>
          <button className="text-xs text-brand-purple hover:underline">Change</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10">
            <Building2 className="h-5 w-5 text-brand-purple" />
          </div>
          <div>
            <p className="text-sm font-semibold">GTBank — 0123456789</p>
            <p className="text-xs text-muted-foreground">Adunola Fashionista · Verified ✓</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t border-border pt-4">
          <div><p className="font-semibold text-foreground">Tuesday & Friday</p><p>Payout schedule</p></div>
          <div><p className="font-semibold text-foreground">1-2 business days</p><p>Settlement time</p></div>
        </div>
      </motion.div>

      {/* Payout history */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Payout History</h2>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <div className="divide-y divide-border">
          {mockPayouts.map(payout => {
            const cfg = statusConfig[payout.status as keyof typeof statusConfig]
            return (
              <div key={payout.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-green/10">
                    <cfg.icon className="h-4 w-4 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">₦{payout.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{payout.date} · {payout.method}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Info box */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3">
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Minimum withdrawal is <strong className="text-foreground">₦5,000</strong>. Payouts are processed every Tuesday and Friday.
          A <strong className="text-foreground">1.5% fee</strong> applies to each withdrawal (capped at ₦1,500).
        </p>
      </motion.div>
    </div>
  )
}
