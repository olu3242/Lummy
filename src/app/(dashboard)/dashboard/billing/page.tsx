"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Zap, CheckCircle2, Crown, Rocket, Star, ArrowRight,
  Download, Receipt, X, CreditCard, ShieldCheck, Clock,
  Package, Bot, Users, BarChart3, Megaphone, Gift,
  AlertTriangle, ChevronRight, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { formatMoney } from "@/lib/globalization"

type PlanId = "starter" | "growth" | "pro"

interface Plan {
  id: PlanId
  name: string
  icon: React.ElementType
  monthlyPrice: number
  annualPrice: number
  color: string
  bgColor: string
  borderColor: string
  badge?: string
  features: string[]
  limits: {
    products: number | "unlimited"
    orders: number | "unlimited"
    aiCredits: number | "unlimited"
    team: number | "unlimited"
    campaigns: number | "unlimited"
  }
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    monthlyPrice: 0,
    annualPrice: 0,
    color: "text-muted-foreground",
    bgColor: "bg-muted/60",
    borderColor: "border-border",
    features: [
      "Up to 10 products",
      "50 orders/month",
      "Basic storefront",
      "WhatsApp CTA",
      "20 AI credits/month",
      "Community support",
    ],
    limits: { products: 10, orders: 50, aiCredits: 20, team: 1, campaigns: 2 },
  },
  {
    id: "growth",
    name: "Growth",
    icon: Rocket,
    monthlyPrice: 4000,
    annualPrice: 3200,
    color: "text-brand-purple",
    bgColor: "bg-brand-purple/5",
    borderColor: "border-brand-purple/30",
    badge: "Current plan",
    features: [
      "Up to 100 products",
      "500 orders/month",
      "Custom storefront theme",
      "WhatsApp & social CTAs",
      "200 AI credits/month",
      "CRM & customer analytics",
      "5 active campaigns",
      "Priority support",
    ],
    limits: { products: 100, orders: 500, aiCredits: 200, team: 3, campaigns: 5 },
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    monthlyPrice: 12000,
    annualPrice: 9600,
    color: "text-amber-500",
    bgColor: "bg-amber-500/5",
    borderColor: "border-amber-500/30",
    badge: "Best value",
    features: [
      "Unlimited products",
      "Unlimited orders",
      "Advanced storefront builder",
      "All social CTAs + automation",
      "Unlimited AI credits",
      "Full CRM + segmentation",
      "Unlimited campaigns",
      "Custom domain",
      "Team access (5 seats)",
      "Dedicated account manager",
    ],
    limits: { products: "unlimited", orders: "unlimited", aiCredits: "unlimited", team: 5, campaigns: "unlimited" },
  },
]

const FEATURE_ROWS = [
  { label: "Products", icon: Package, starter: "10", growth: "100", pro: "Unlimited" },
  { label: "Orders/month", icon: Receipt, starter: "50", growth: "500", pro: "Unlimited" },
  { label: "AI credits/month", icon: Bot, starter: "20", growth: "200", pro: "Unlimited" },
  { label: "CRM & analytics", icon: BarChart3, starter: false, growth: true, pro: true },
  { label: "Active campaigns", icon: Megaphone, starter: "2", growth: "5", pro: "Unlimited" },
  { label: "Team seats", icon: Users, starter: "1", growth: "3", pro: "5" },
  { label: "Custom domain", icon: Star, starter: false, growth: false, pro: true },
  { label: "Referral program", icon: Gift, starter: false, growth: true, pro: true },
  { label: "Priority support", icon: Sparkles, starter: false, growth: true, pro: true },
  { label: "Account manager", icon: Crown, starter: false, growth: false, pro: true },
]

const mockInvoices = [
  { id: "INV-2026-05", date: "May 1, 2026",  amount: 4000,  status: "paid",    period: "May 2026" },
  { id: "INV-2026-04", date: "Apr 1, 2026",  amount: 4000,  status: "paid",    period: "Apr 2026" },
  { id: "INV-2026-03", date: "Mar 1, 2026",  amount: 4000,  status: "paid",    period: "Mar 2026" },
  { id: "INV-2026-02", date: "Feb 1, 2026",  amount: 4000,  status: "paid",    period: "Feb 2026" },
  { id: "INV-2026-01", date: "Jan 1, 2026",  amount: 4000,  status: "paid",    period: "Jan 2026" },
]

const currentUsage = {
  products: { used: 23, limit: 100 },
  orders: { used: 147, limit: 500 },
  aiCredits: { used: 132, limit: 200 },
  campaigns: { used: 3, limit: 5 },
}

function UsageBar({ used, limit, color = "bg-brand-purple" }: { used: number; limit: number; color?: string }) {
  const pct = Math.min((used / limit) * 100, 100)
  const isWarning = pct >= 80
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn("h-full rounded-full", isWarning ? "bg-brand-coral" : color)}
      />
    </div>
  )
}

function FeatureCheck({ value }: { value: boolean | string }) {
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
  if (value === true) return <CheckCircle2 className="h-4 w-4 text-brand-green mx-auto" />
  return <span className="text-xs font-semibold text-foreground">{value}</span>
}

function UpgradeModal({ plan, annual, onClose }: { plan: Plan; annual: boolean; onClose: () => void }) {
  const [step, setStep] = React.useState<"review" | "processing" | "success">("review")
  const price = annual ? plan.annualPrice : plan.monthlyPrice

  const handlePay = () => {
    setStep("processing")
    setTimeout(() => setStep("success"), 2200)
  }

  const handleDone = () => {
    toast({ title: "Plan upgraded!", description: `You're now on the ${plan.name} plan. Welcome aboard!` })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "review" && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-display font-bold text-base">Upgrade to {plan.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">via Paystack · Secure payment</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Plan summary */}
              <div className={cn("p-4 rounded-2xl border", plan.bgColor, plan.borderColor)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <plan.icon className={cn("h-5 w-5", plan.color)} />
                    <span className="font-semibold text-sm">{plan.name} Plan</span>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-display text-xl font-extrabold", plan.color)}>
                      {formatMoney(price)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">/{annual ? "mo · billed annually" : "month"}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.slice(0, 5).map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-brand-green flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-5">+{plan.features.length - 5} more features</li>
                  )}
                </ul>
              </div>

              {/* Payment method */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment method</p>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-purple/30 bg-brand-purple/5">
                  <CreditCard className="h-4 w-4 text-brand-purple" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">GTBank •••• 4521</p>
                    <p className="text-[10px] text-muted-foreground">Debit card · Expires 09/27</p>
                  </div>
                  <button className="text-[10px] text-brand-purple font-semibold hover:underline">Change</button>
                </div>
              </div>

              {/* Order summary */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>{plan.name} Plan ({annual ? "Annual" : "Monthly"})</span>
                  <span>{formatMoney(price)}</span>
                </div>
                {annual && (
                  <div className="flex justify-between text-brand-green">
                    <span>Annual discount (20%)</span>
                    <span>-{formatMoney((plan.monthlyPrice - plan.annualPrice) * 12)}/yr</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-border pt-1.5 mt-1.5">
                  <span>Total today</span>
                  <span>{formatMoney(price)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-brand-green" />
                256-bit SSL encryption · Cancel anytime · Instant activation
              </div>
            </div>

            <div className="p-5 pt-0">
              <Button className="w-full gap-2" size="lg" onClick={handlePay}>
                Pay {formatMoney(price)} · Activate {plan.name}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="p-12 flex flex-col items-center gap-5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-14 h-14 rounded-full border-4 border-brand-purple/20 border-t-brand-purple"
            />
            <div className="text-center">
              <p className="font-semibold text-sm">Processing payment…</p>
              <p className="text-xs text-muted-foreground mt-1">Connecting to Paystack</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="p-10 flex flex-col items-center gap-5 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 14, stiffness: 260 }}
              className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center"
            >
              <CheckCircle2 className="h-8 w-8 text-brand-green" />
            </motion.div>
            <div>
              <h3 className="font-display font-extrabold text-lg">You're on {plan.name}!</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Your plan has been upgraded. All {plan.name} features are now active.
              </p>
            </div>
            <Button className="gap-2" onClick={handleDone}>
              Continue to dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function BillingPage() {
  const [annual, setAnnual] = React.useState(false)
  const [upgradePlan, setUpgradePlan] = React.useState<Plan | null>(null)
  const currentPlan = PLANS.find(p => p.id === "growth")!
  const nextRenewal = "Jun 1, 2026"

  const handleDownload = (id: string) => {
    toast({ title: "Invoice downloaded", description: `${id}.pdf saved to your downloads.` })
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-extrabold">Billing & Plans</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your subscription, usage, and invoices</p>
      </div>

      {/* Current plan card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-brand-indigo/5 p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="h-4 w-4 text-brand-purple" />
              <span className="font-display font-bold text-base">Growth Plan</span>
              <Badge variant="brand" size="sm">Active</Badge>
            </div>
            <p className="text-2xl font-display font-extrabold text-brand-purple">
              {formatMoney(4000)}<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Next renewal: <span className="font-semibold text-foreground">{nextRenewal}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5"
              onClick={() => toast({ title: "Manage billing", description: "Opening Paystack billing portal…" })}>
              Manage billing
            </Button>
            <Button size="sm" className="h-9 text-xs gap-1.5" onClick={() => setUpgradePlan(PLANS[2])}>
              <Crown className="h-3.5 w-3.5" /> Upgrade to Pro
            </Button>
          </div>
        </div>

        {/* Usage meters */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Products", used: currentUsage.products.used, limit: currentUsage.products.limit, icon: Package },
            { label: "Orders this month", used: currentUsage.orders.used, limit: currentUsage.orders.limit, icon: Receipt },
            { label: "AI credits", used: currentUsage.aiCredits.used, limit: currentUsage.aiCredits.limit, icon: Bot },
            { label: "Active campaigns", used: currentUsage.campaigns.used, limit: currentUsage.campaigns.limit, icon: Megaphone },
          ].map(({ label, used, limit, icon: Icon }) => {
            const pct = Math.round((used / limit) * 100)
            const isWarning = pct >= 80
            return (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span>{label}</span>
                  </div>
                  <span className={cn("font-semibold", isWarning ? "text-brand-coral" : "text-foreground")}>
                    {used}/{limit}
                  </span>
                </div>
                <UsageBar used={used} limit={limit} />
                {isWarning && (
                  <div className="flex items-center gap-1 text-[10px] text-brand-coral">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Running low — upgrade to unlock more
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Plan comparison */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base">Compare plans</h2>
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-all", !annual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1", annual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
            >
              Annual
              <span className="text-[9px] font-bold text-brand-green bg-brand-green/10 px-1 py-0.5 rounded-md">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((plan, i) => {
            const isCurrent = plan.id === "growth"
            const price = annual ? plan.annualPrice : plan.monthlyPrice
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={cn(
                  "relative rounded-2xl border p-5 flex flex-col",
                  isCurrent ? "border-brand-purple/30 bg-brand-purple/5 shadow-brand-sm" : "border-border bg-card"
                )}
              >
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-2.5 left-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                    isCurrent ? "bg-brand-purple text-white" : "bg-amber-500 text-white"
                  )}>
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <plan.icon className={cn("h-4 w-4", plan.color)} />
                  <span className="font-display font-bold text-sm">{plan.name}</span>
                </div>

                <div className="mb-4">
                  {price === 0 ? (
                    <p className="font-display text-2xl font-extrabold">Free</p>
                  ) : (
                    <>
                      <p className={cn("font-display text-2xl font-extrabold", plan.color)}>
                        {formatMoney(price)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        /month{annual ? " · billed annually" : ""}
                      </p>
                    </>
                  )}
                </div>

                <ul className="flex-1 space-y-2 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-green flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="h-9 rounded-xl border border-brand-purple/20 bg-brand-purple/5 flex items-center justify-center text-xs font-semibold text-brand-purple">
                    Current plan
                  </div>
                ) : plan.id === "starter" ? (
                  <div className="h-9 rounded-xl border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    Downgrade
                  </div>
                ) : (
                  <Button className="w-full gap-1.5 text-xs h-9" onClick={() => setUpgradePlan(plan)}>
                    Upgrade <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Feature comparison table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-sm">Feature comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground w-[45%]">Feature</th>
                <th className="text-center px-3 py-3 font-semibold text-muted-foreground">Starter</th>
                <th className="text-center px-3 py-3 font-semibold text-brand-purple">Growth</th>
                <th className="text-center px-3 py-3 font-semibold text-amber-500">Pro</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row, i) => (
                <tr key={row.label} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "bg-muted/20" : "")}>
                  <td className="px-5 py-3 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <row.icon className="h-3.5 w-3.5 flex-shrink-0" />
                      {row.label}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center"><FeatureCheck value={row.starter} /></td>
                  <td className="px-3 py-3 text-center bg-brand-purple/3"><FeatureCheck value={row.growth} /></td>
                  <td className="px-3 py-3 text-center"><FeatureCheck value={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice history */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-sm">Invoice history</h2>
          <button
            className="text-xs text-brand-purple font-semibold hover:underline flex items-center gap-1"
            onClick={() => toast({ title: "Downloading all invoices…" })}
          >
            Download all <Download className="h-3 w-3" />
          </button>
        </div>
        <div>
          {mockInvoices.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-3.5 w-3.5 text-brand-green" />
                </div>
                <div>
                  <p className="font-semibold text-xs">{inv.id}</p>
                  <p className="text-[10px] text-muted-foreground">{inv.period} · {inv.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display font-bold text-sm">{formatMoney(inv.amount)}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green">Paid</span>
                <button
                  onClick={() => handleDownload(inv.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cancel plan danger zone */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Cancel subscription
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              If you cancel, your plan will downgrade to Starter at the end of your current billing period ({nextRenewal}). You'll lose access to Growth features.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 flex-shrink-0"
            onClick={() => toast({ title: "Cancellation request", description: "Please contact support to cancel your subscription." })}
          >
            Cancel plan
          </Button>
        </div>
      </div>

      {/* Upgrade modal */}
      <AnimatePresence>
        {upgradePlan && (
          <UpgradeModal
            plan={upgradePlan}
            annual={annual}
            onClose={() => setUpgradePlan(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
