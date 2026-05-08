"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle,
  ArrowUpRight, Building2, ChevronRight, Download, RefreshCw,
  X, ArrowLeft, Banknote, ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const mockPayouts = [
  { id: "PAY-001", amount: 125000, date: "May 5, 2026",  method: "GTBank •••• 4521", status: "completed", ref: "TXN8812993" },
  { id: "PAY-002", amount: 87500,  date: "Apr 28, 2026", method: "GTBank •••• 4521", status: "completed", ref: "TXN8811204" },
  { id: "PAY-003", amount: 210000, date: "Apr 14, 2026", method: "GTBank •••• 4521", status: "completed", ref: "TXN8809876" },
  { id: "PAY-004", amount: 55000,  date: "Mar 30, 2026", method: "GTBank •••• 4521", status: "completed", ref: "TXN8807541" },
  { id: "PAY-005", amount: 168000, date: "Mar 15, 2026", method: "GTBank •••• 4521", status: "completed", ref: "TXN8805322" },
]

const statusConfig = {
  completed: { label: "Paid",    color: "bg-brand-green/10 text-brand-green", icon: CheckCircle2 },
  pending:   { label: "Pending", color: "bg-amber-500/10 text-amber-500",     icon: Clock },
  failed:    { label: "Failed",  color: "bg-brand-coral/10 text-brand-coral", icon: AlertCircle },
} as const

const MIN_WITHDRAWAL = 5000
const BALANCE = 312500
const FEE_RATE = 0.015
const FEE_CAP = 1500

function calcFee(amount: number) {
  return Math.min(Math.round(amount * FEE_RATE), FEE_CAP)
}

type WithdrawStep = "amount" | "confirm" | "success"

function WithdrawModal({ onClose, balance }: { onClose: () => void; balance: number }) {
  const [step, setStep] = React.useState<WithdrawStep>("amount")
  const [rawAmount, setRawAmount] = React.useState("")
  const [processing, setProcessing] = React.useState(false)

  const amount = parseInt(rawAmount.replace(/\D/g, "") || "0", 10)
  const fee = calcFee(amount)
  const net = amount - fee

  const amountValid = amount >= MIN_WITHDRAWAL && amount <= balance

  const handleConfirm = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setStep("success")
    }, 1800)
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
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-border bg-card overflow-hidden shadow-2xl">

        {/* Step: amount */}
        {step === "amount" && (
          <div>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="font-display text-lg font-extrabold">Withdraw Funds</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Available: <strong className="text-foreground">₦{balance.toLocaleString()}</strong></p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold mb-2">Enter amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-bold text-xl text-muted-foreground">₦</span>
                  <input
                    autoFocus
                    inputMode="numeric"
                    value={rawAmount ? parseInt(rawAmount.replace(/\D/g, ""), 10).toLocaleString() : ""}
                    onChange={e => setRawAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="w-full h-14 pl-10 pr-4 rounded-2xl border border-border bg-background font-display text-2xl font-bold placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[50000, 100000, 200000].map(v => (
                    <button key={v} onClick={() => setRawAmount(String(v))}
                      className="flex-1 h-7 rounded-lg border border-border text-[11px] font-semibold hover:bg-accent transition-colors">
                      ₦{(v / 1000)}k
                    </button>
                  ))}
                  <button onClick={() => setRawAmount(String(balance))}
                    className="flex-1 h-7 rounded-lg border border-border text-[11px] font-semibold hover:bg-accent transition-colors">
                    Max
                  </button>
                </div>
              </div>

              {/* Fee preview */}
              {amount > 0 && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-muted/50 border border-border p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">₦{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing fee (1.5%)</span>
                    <span className="font-semibold text-brand-coral">−₦{fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                    <span>You receive</span>
                    <span className="text-brand-green">₦{net.toLocaleString()}</span>
                  </div>
                </motion.div>
              )}

              {amount > 0 && amount < MIN_WITHDRAWAL && (
                <p className="text-xs text-brand-coral flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Minimum withdrawal is ₦{MIN_WITHDRAWAL.toLocaleString()}
                </p>
              )}
              {amount > balance && (
                <p className="text-xs text-brand-coral flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Amount exceeds available balance
                </p>
              )}

              <Button className="w-full h-11 gap-2" onClick={() => setStep("confirm")} disabled={!amountValid}>
                <Banknote className="h-4 w-4" /> Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: confirm */}
        {step === "confirm" && (
          <div>
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <button onClick={() => setStep("amount")} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="font-display text-lg font-extrabold">Confirm Withdrawal</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Review before sending</p>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Summary */}
              <div className="rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                    <Banknote className="h-5 w-5 text-brand-green" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-extrabold text-brand-green">₦{net.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Amount you&apos;ll receive</p>
                  </div>
                </div>
                {[
                  { label: "Withdrawal amount", value: `₦${amount.toLocaleString()}` },
                  { label: "Processing fee",     value: `-₦${fee.toLocaleString()}` },
                  { label: "Settlement time",    value: "1–2 business days" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-semibold">{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Bank */}
              <div className="rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple/10">
                  <Building2 className="h-4 w-4 text-brand-purple" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">GTBank — 0123456789</p>
                  <p className="text-xs text-muted-foreground">Adunola Fashionista · Verified ✓</p>
                </div>
                <ShieldCheck className="h-4 w-4 text-brand-green" />
              </div>

              <Button className="w-full h-11 gap-2" onClick={handleConfirm} disabled={processing}>
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4" />
                    Confirm withdrawal
                  </>
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                By confirming, you agree to Lummy&apos;s payout terms.
              </p>
            </div>
          </div>
        )}

        {/* Step: success */}
        {step === "success" && (
          <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-green/15 border-2 border-brand-green/30"
            >
              <CheckCircle2 className="h-10 w-10 text-brand-green" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="font-display text-xl font-extrabold">Withdrawal Requested!</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                <strong className="text-foreground">₦{net.toLocaleString()}</strong> will arrive in your GTBank account within 1–2 business days.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="w-full rounded-xl bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
              Reference: <strong className="text-foreground font-mono">TXN{Date.now().toString().slice(-7)}</strong>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="w-full">
              <Button className="w-full h-10" onClick={() => {
                toast({ title: "Withdrawal submitted", description: `₦${net.toLocaleString()} is on its way to your bank.`, variant: "success" })
                onClose()
              }}>
                Done
              </Button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function PayoutsPage() {
  const [showWithdraw, setShowWithdraw] = React.useState(false)
  const balance = BALANCE
  const pending = 87000
  const totalPaid = mockPayouts.reduce((s, p) => s + p.amount, 0)

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
          { label: "Available Balance", value: `₦${balance.toLocaleString()}`, icon: Wallet,    color: "text-brand-purple", bg: "bg-brand-purple/10", action: true  },
          { label: "Pending Clearance", value: `₦${pending.toLocaleString()}`, icon: Clock,     color: "text-amber-500",    bg: "bg-amber-500/10",   action: false },
          { label: "Total Paid Out",    value: `₦${totalPaid.toLocaleString()}`, icon: TrendingUp, color: "text-brand-green",  bg: "bg-brand-green/10", action: false },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", card.bg)}>
                <card.icon className={cn("h-4.5 w-4.5", card.color)} />
              </div>
              {card.action && (
                <Button size="sm" onClick={() => setShowWithdraw(true)} className="h-7 text-xs gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Withdraw
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
          <div><p className="font-semibold text-foreground">1–2 business days</p><p>Settlement time</p></div>
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

      {/* Withdraw modal */}
      <AnimatePresence>
        {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} balance={balance} />}
      </AnimatePresence>
    </div>
  )
}
