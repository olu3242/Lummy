"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle,
  ArrowUpRight, Building2, ChevronRight, Download, RefreshCw,
  X, ArrowLeft, Banknote, ShieldCheck, Plus, Calendar,
  ChevronDown, Info, Copy, CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { formatMoney, formatCompactMoney } from "@/lib/globalization"

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Payout {
  id: string
  amount: number
  date: string
  method: string
  bank: string
  status: "completed" | "pending" | "failed"
  ref: string
  note?: string
}

const mockPayouts: Payout[] = [
  { id: "PAY-001", amount: 125000, date: "May 5, 2026",  method: "GTBank •••• 4521", bank: "GTBank",  status: "completed", ref: "TXN8812993" },
  { id: "PAY-002", amount: 87500,  date: "Apr 29, 2026", method: "GTBank •••• 4521", bank: "GTBank",  status: "pending",   ref: "TXN8811204", note: "Expected May 1" },
  { id: "PAY-003", amount: 210000, date: "Apr 14, 2026", method: "GTBank •••• 4521", bank: "GTBank",  status: "completed", ref: "TXN8809876" },
  { id: "PAY-004", amount: 55000,  date: "Mar 30, 2026", method: "GTBank •••• 4521", bank: "GTBank",  status: "completed", ref: "TXN8807541" },
  { id: "PAY-005", amount: 168000, date: "Mar 15, 2026", method: "GTBank •••• 4521", bank: "GTBank",  status: "completed", ref: "TXN8805322" },
  { id: "PAY-006", amount: 42000,  date: "Feb 28, 2026", method: "GTBank •••• 4521", bank: "GTBank",  status: "failed",    ref: "TXN8803100", note: "Account limit reached" },
  { id: "PAY-007", amount: 98000,  date: "Feb 14, 2026", method: "GTBank •••• 4521", bank: "GTBank",  status: "completed", ref: "TXN8801455" },
]

const MONTHLY_EARNINGS = [
  { month: "Nov", value: 145000 },
  { month: "Dec", value: 198000 },
  { month: "Jan", value: 162000 },
  { month: "Feb", value: 140000 },
  { month: "Mar", value: 223000 },
  { month: "Apr", value: 297500 },
  { month: "May", value: 312500 },
]

const statusConfig = {
  completed: { label: "Paid",    color: "bg-brand-green/10 text-brand-green",   icon: CheckCircle2 },
  pending:   { label: "Pending", color: "bg-amber-500/10 text-amber-500",       icon: Clock },
  failed:    { label: "Failed",  color: "bg-brand-coral/10 text-brand-coral",   icon: AlertCircle },
} as const

const MIN_WITHDRAWAL = 5000
const BALANCE = 312500
const PENDING = 87000
const FEE_RATE = 0.015
const FEE_CAP = 1500

const NEXT_PAYOUT_DATE = "Tuesday, May 14"
const NEXT_PAYOUT_AMOUNT = 87000

function calcFee(amount: number) {
  return Math.min(Math.round(amount * FEE_RATE), FEE_CAP)
}

// ─── Earnings chart ───────────────────────────────────────────────────────────

function EarningsChart({ data }: { data: { month: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value))
  const H = 80
  const barW = 28
  const gap = 10
  const totalW = (barW + gap) * data.length - gap
  const currentIdx = data.length - 1

  return (
    <svg width="100%" viewBox={`0 0 ${totalW + 2} ${H + 24}`} className="overflow-visible">
      {data.map((d, i) => {
        const x = i * (barW + gap)
        const bh = Math.max((d.value / max) * H, 4)
        const isCurrent = i === currentIdx
        return (
          <g key={i}>
            <rect
              x={x} y={H - bh} width={barW} height={bh} rx="5"
              fill={isCurrent ? "#6C4EF3" : "#6C4EF3"}
              opacity={isCurrent ? 1 : 0.2}
            />
            {isCurrent && (
              <text x={x + barW / 2} y={H - bh - 5} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#6C4EF3">
                {formatCompactMoney(Math.round(d.value / 1000))}
              </text>
            )}
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.45">
              {d.month}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Withdraw modal ────────────────────────────────────────────────────────────

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
    setTimeout(() => { setProcessing(false); setStep("success") }, 1800)
  }

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-border bg-card overflow-hidden shadow-2xl"
      >
        {step === "amount" && (
          <div>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="font-display text-lg font-extrabold">Withdraw Funds</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Available: <strong className="text-foreground">{formatMoney(balance)}</strong></p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2">Enter amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-bold text-xl text-muted-foreground">$</span>
                  <input
                    autoFocus inputMode="numeric"
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
                      {formatCompactMoney(v / 1000)}
                    </button>
                  ))}
                  <button onClick={() => setRawAmount(String(balance))}
                    className="flex-1 h-7 rounded-lg border border-border text-[11px] font-semibold hover:bg-accent transition-colors">
                    Max
                  </button>
                </div>
              </div>

              {amount > 0 && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-muted/50 border border-border p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">{formatMoney(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing fee (1.5%)</span>
                    <span className="font-semibold text-brand-coral">−{formatMoney(fee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                    <span>You receive</span>
                    <span className="text-brand-green">{formatMoney(net)}</span>
                  </div>
                </motion.div>
              )}

              {amount > 0 && amount < MIN_WITHDRAWAL && (
                <p className="text-xs text-brand-coral flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Minimum withdrawal is {formatMoney(MIN_WITHDRAWAL)}
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

        {step === "confirm" && (
          <div>
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <button onClick={() => setStep("amount")} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="font-display text-lg font-extrabold">Confirm Withdrawal</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Review before sending</p>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                    <Banknote className="h-5 w-5 text-brand-green" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-extrabold text-brand-green">{formatMoney(net)}</p>
                    <p className="text-[10px] text-muted-foreground">Amount you&apos;ll receive</p>
                  </div>
                </div>
                {[
                  { label: "Withdrawal amount", value: formatMoney(amount) },
                  { label: "Processing fee",     value: `-${formatMoney(fee)}` },
                  { label: "Settlement time",    value: "1–2 business days" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-semibold">{r.value}</span>
                  </div>
                ))}
              </div>
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
                {processing
                  ? <><RefreshCw className="h-4 w-4 animate-spin" />Processing…</>
                  : <><ArrowUpRight className="h-4 w-4" />Confirm withdrawal</>}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                By confirming, you agree to Lummy&apos;s payout terms.
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-green/15 border-2 border-brand-green/30"
            >
              <CheckCircle2 className="h-10 w-10 text-brand-green" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="font-display text-xl font-extrabold">Withdrawal Requested!</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                <strong className="text-foreground">{formatMoney(net)}</strong> will arrive in your GTBank account within 1–2 business days.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="w-full rounded-xl bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
              Reference: <strong className="text-foreground font-mono">TXN{Date.now().toString().slice(-7)}</strong>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="w-full">
              <Button className="w-full h-10" onClick={() => {
                toast({ title: "Withdrawal submitted", description: `${formatMoney(net)} is on its way to your bank.`, variant: "success" })
                onClose()
              }}>Done</Button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Transaction detail drawer ─────────────────────────────────────────────────

function PayoutDetailDrawer({ payout, onClose }: { payout: Payout; onClose: () => void }) {
  const cfg = statusConfig[payout.status]
  const [refCopied, setRefCopied] = React.useState(false)
  const fee = calcFee(payout.amount)
  const net = payout.amount - fee

  const copyRef = () => {
    navigator.clipboard.writeText(payout.ref)
    setRefCopied(true)
    setTimeout(() => setRefCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", cfg.color.includes("green") ? "bg-brand-green/10" : cfg.color.includes("amber") ? "bg-amber-500/10" : "bg-brand-coral/10")}>
              <cfg.icon className={cn("h-4 w-4", cfg.color.split(" ")[1])} />
            </div>
            <div>
              <p className="text-sm font-bold">Payout {payout.id}</p>
              <p className="text-[10px] text-muted-foreground">{payout.date}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Amount */}
          <div className="text-center py-3">
            <p className="font-display text-3xl font-extrabold">{formatMoney(payout.amount)}</p>
            <span className={cn("inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full", cfg.color)}>
              {cfg.label}
            </span>
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden text-xs">
            {[
              { label: "Gross amount",    value: formatMoney(payout.amount) },
              { label: "Processing fee",  value: `-${formatMoney(fee)}`, red: true },
              { label: "Net received",    value: formatMoney(net), green: true },
              { label: "Bank account",    value: payout.method },
              { label: "Settlement",      value: "1–2 business days" },
            ].map(row => (
              <div key={row.label} className="flex justify-between px-3.5 py-2.5">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={cn("font-semibold", row.red && "text-brand-coral", row.green && "text-brand-green")}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Reference */}
          <div className="rounded-xl bg-muted/40 border border-border p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Transaction reference</p>
              <p className="text-xs font-mono font-semibold">{payout.ref}</p>
            </div>
            <button onClick={copyRef} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
              {refCopied ? <CheckCheck className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
              {refCopied ? "Copied" : "Copy"}
            </button>
          </div>

          {payout.note && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
              <Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">{payout.note}</p>
            </div>
          )}

          <Button variant="outline" className="w-full gap-2 h-9" onClick={() => {
            const csv = `ID,Date,Amount,Fee,Net,Bank,Reference,Status\n${payout.id},${payout.date},${payout.amount},${fee},${net},${payout.method},${payout.ref},${payout.status}`
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url; a.download = `${payout.id}.csv`; a.click()
            URL.revokeObjectURL(url)
          }}>
            <Download className="h-3.5 w-3.5" /> Download receipt
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Export helper ─────────────────────────────────────────────────────────────

function exportPayoutsCSV() {
  const header = ["ID", "Date", "Amount ($)", "Method", "Reference", "Status"]
  const rows = mockPayouts.map(p => [p.id, p.date, p.amount, p.method, p.ref, p.status].join(","))
  const csv = [header.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "lummy-payouts.csv"; a.click()
  URL.revokeObjectURL(url)
  toast({ title: "CSV exported", description: "Payout history downloaded.", variant: "success" })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "completed" | "pending" | "failed"

export default function PayoutsPage() {
  const [showWithdraw, setShowWithdraw] = React.useState(false)
  const [selectedPayout, setSelectedPayout] = React.useState<Payout | null>(null)
  const [filterTab, setFilterTab] = React.useState<FilterTab>("all")
  const [showAddBank, setShowAddBank] = React.useState(false)
  const [bankName, setBankName] = React.useState("")
  const [bankAcct, setBankAcct] = React.useState("")

  const balance = BALANCE
  const totalPaid = mockPayouts.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0)

  const filteredPayouts = filterTab === "all"
    ? mockPayouts
    : mockPayouts.filter(p => p.status === filterTab)

  const filterCounts: Record<FilterTab, number> = {
    all: mockPayouts.length,
    completed: mockPayouts.filter(p => p.status === "completed").length,
    pending: mockPayouts.filter(p => p.status === "pending").length,
    failed: mockPayouts.filter(p => p.status === "failed").length,
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your earnings and bank withdrawals</p>
        </div>
        <Button onClick={() => setShowWithdraw(true)} className="gap-2 h-9 self-start sm:self-auto">
          <ArrowUpRight className="h-4 w-4" /> Withdraw funds
        </Button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Available Balance", value: formatMoney(balance),    icon: Wallet,     color: "text-brand-purple", bg: "bg-brand-purple/10" },
          { label: "Pending Clearance", value: formatMoney(PENDING),    icon: Clock,      color: "text-amber-500",    bg: "bg-amber-500/10"   },
          { label: "Total Paid Out",    value: formatMoney(totalPaid),  icon: TrendingUp, color: "text-brand-green",  bg: "bg-brand-green/10" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-border bg-card p-5">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl mb-3", card.bg)}>
              <card.icon className={cn("h-4.5 w-4.5", card.color)} />
            </div>
            <p className="font-display text-2xl font-extrabold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Earnings chart + next payout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="sm:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold">Monthly earnings</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Last 7 months</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-brand-green font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +18.4% vs last month
            </div>
          </div>
          <div className="text-muted-foreground">
            <EarningsChart data={MONTHLY_EARNINGS} />
          </div>
        </motion.div>

        {/* Next payout + projection */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Next scheduled payout</p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-brand-purple" />
              </div>
              <div>
                <p className="font-display text-lg font-extrabold">{formatMoney(NEXT_PAYOUT_AMOUNT)}</p>
                <p className="text-[10px] text-muted-foreground">{NEXT_PAYOUT_DATE}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Projection</p>
            {[
              { label: "This month (est.)", value: "$340", up: true },
              { label: "Next month (est.)", value: "$385", up: true },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold flex items-center gap-0.5 text-brand-green">
                  <ArrowUpRight className="h-3 w-3" />{row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Payouts every <strong className="text-foreground">Tue & Fri</strong>. Settlement in 1–2 business days.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bank account */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Linked Bank Account</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddBank(v => !v)}
              className="flex items-center gap-1 text-xs text-brand-purple hover:underline"
            >
              <Plus className="h-3 w-3" /> Add account
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10">
            <Building2 className="h-5 w-5 text-brand-purple" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">GTBank — 0123456789</p>
            <p className="text-xs text-muted-foreground">Adunola Fashionista · Verified ✓</p>
          </div>
          <ShieldCheck className="h-4 w-4 text-brand-green" />
          <button className="text-xs text-muted-foreground hover:text-brand-purple">Change</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t border-border pt-4">
          <div><p className="font-semibold text-foreground">Tuesday & Friday</p><p>Payout schedule</p></div>
          <div><p className="font-semibold text-foreground">1–2 business days</p><p>Settlement time</p></div>
        </div>

        <AnimatePresence>
          {showAddBank && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <p className="text-xs font-semibold">Add another bank account</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Bank name</label>
                    <input value={bankName} onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. Access Bank"
                      className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Account number</label>
                    <input value={bankAcct} onChange={e => setBankAcct(e.target.value)} inputMode="numeric"
                      placeholder="0123456789"
                      className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8 text-xs" onClick={() => {
                    if (bankName && bankAcct) {
                      toast({ title: "Bank added", description: "Verification in progress (1–2 mins).", variant: "success" })
                      setShowAddBank(false); setBankName(""); setBankAcct("")
                    }
                  }} disabled={!bankName || !bankAcct}>Verify & add</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowAddBank(false)}>Cancel</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Payout history */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="font-semibold text-sm">Payout History</h2>
          <button onClick={exportPayoutsCSV} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2.5 border-b border-border bg-muted/20">
          {(["all", "completed", "pending", "failed"] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all capitalize",
                filterTab === tab ? "bg-background border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              <span className="text-[9px] opacity-60">({filterCounts[tab]})</span>
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          <AnimatePresence>
            {filteredPayouts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">No {filterTab} payouts</div>
            ) : (
              filteredPayouts.map((payout, i) => {
                const cfg = statusConfig[payout.status]
                return (
                  <motion.button
                    key={payout.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedPayout(payout)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0",
                        payout.status === "completed" ? "bg-brand-green/10" :
                        payout.status === "pending" ? "bg-amber-500/10" : "bg-brand-coral/10"
                      )}>
                        <cfg.icon className={cn("h-4 w-4", cfg.color.split(" ")[1])} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{formatMoney(payout.amount)}</p>
                        <p className="text-xs text-muted-foreground">{payout.date} · {payout.method}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </motion.button>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Info box */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
        className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3">
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Minimum withdrawal applies. Payouts are processed every Tuesday and Friday.
          A <strong className="text-foreground">1.5% fee</strong> applies. Bank verification takes 1–2 minutes.
        </p>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} balance={balance} />}
        {selectedPayout && <PayoutDetailDrawer payout={selectedPayout} onClose={() => setSelectedPayout(null)} />}
      </AnimatePresence>
    </div>
  )
}
