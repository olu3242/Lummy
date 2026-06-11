"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  Zap,
  ArrowRight,
  Star,
  MessageCircle,
  Shield,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockPricingPlans } from "@/data/mock/index"
import { cn } from "@/lib/utils"

const COMPARISON_ROWS = [
  { feature: "Creator storefronts",        starter: "1",          growth: "3",          pro: "Unlimited" },
  { feature: "Products",                   starter: "Up to 10",   growth: "Unlimited",  pro: "Unlimited" },
  { feature: "WhatsApp order links",       starter: true,         growth: true,         pro: true },
  { feature: "Link-in-bio page",           starter: true,         growth: true,         pro: true },
  { feature: "Basic analytics",            starter: true,         growth: true,         pro: true },
  { feature: "Advanced analytics",         starter: false,        growth: true,         pro: true },
  { feature: "AI growth assistant",        starter: false,        growth: true,         pro: true },
  { feature: "CRM & customer segments",    starter: false,        growth: true,         pro: true },
  { feature: "WhatsApp broadcast",         starter: false,        growth: true,         pro: true },
  { feature: "Custom domain",              starter: false,        growth: true,         pro: true },
  { feature: "Referral programme",         starter: true,         growth: true,         pro: true },
  { feature: "Team seats",                 starter: "1",          growth: "2",          pro: "5" },
  { feature: "White-label option",         starter: false,        growth: false,        pro: true },
  { feature: "API access",                 starter: false,        growth: false,        pro: true },
  { feature: "Dedicated account manager",  starter: false,        growth: false,        pro: true },
  { feature: "SLA guarantee",              starter: false,        growth: false,        pro: true },
  { feature: "Support",                    starter: "Community",  growth: "Priority",   pro: "Dedicated" },
]

const FAQS = [
  { q: "Can I switch plans anytime?",             a: "Yes. You can upgrade or downgrade at any time from your Settings → Payments page. Upgrades take effect immediately; downgrades apply at the end of your billing cycle." },
  { q: "Is there a free trial for paid plans?",   a: "All paid plans start with a 14-day free trial, no credit card required. If you refer another creator, you can earn additional free months on top of the trial." },
  { q: "What's the transaction fee?",             a: "Zero. Lummy charges a flat monthly subscription only. We never take a cut of your revenue — what you earn is yours." },
  { q: "What payment methods do you accept?",     a: "Plan billing and payment methods vary by country and payment provider. We are building for multi-currency creator businesses across global markets." },
  { q: "What happens when I exceed my product limit on Starter?", a: "You'll be prompted to upgrade to Growth. Your existing products stay live — you just won't be able to add new ones until you upgrade or remove some." },
  { q: "Is there a discount for annual billing?", a: "Yes — paying annually saves you 2 months (equivalent to ~17% off). Annual billing is available from the Settings page." },
]

type Cell = boolean | string

function CellValue({ value }: { value: Cell }) {
  if (value === true)  return <Check className="h-4 w-4 text-brand-green mx-auto" />
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
  return <span className="text-xs text-center block">{value as string}</span>
}

function FAQItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <p className="text-sm font-semibold">{item.q}</p>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground leading-relaxed pb-4">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PricingPage() {
  const [annual, setAnnual] = React.useState(false)
  const [showComparison, setShowComparison] = React.useState(false)

  const getPrice = (plan: typeof mockPricingPlans[0]) => {
    if (plan.price === "Free") return { main: "Free", sub: "forever" }
    const monthly = parseInt(plan.price.replace(/[^0-9]/g, ""))
    if (!annual) return { main: plan.price, sub: "/ month" }
    const annualMonthly = Math.floor(monthly * 10 / 12)
    return { main: `$${annualMonthly.toLocaleString()}`, sub: "/ month, billed annually" }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky nav */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 sm:px-8 bg-background/90 backdrop-blur-sm border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-indigo shadow-brand-sm">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-display text-lg font-bold">Lummy</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Sign in</Link>
          <Link href="/signup">
            <Button size="sm" className="h-8 text-xs gap-1.5">
              Get started free <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-20">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-purple/20 bg-brand-purple/5 text-xs font-semibold text-brand-purple">
            <Zap className="h-3 w-3" />
            Zero transaction fees on all plans
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            Simple, creator-first pricing
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Start free, scale as you grow. No setup fees, no hidden charges, no commission on your revenue.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={cn("text-sm font-medium", !annual ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
            <button
              onClick={() => setAnnual(v => !v)}
              className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", annual ? "bg-brand-purple" : "bg-muted-foreground/30")}
            >
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", annual ? "translate-x-6" : "translate-x-1")} />
            </button>
            <span className={cn("text-sm font-medium flex items-center gap-1.5", annual ? "text-foreground" : "text-muted-foreground")}>
              Annual
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/20">Save 17%</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {mockPricingPlans.map((plan, i) => {
            const price = getPrice(plan)
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative rounded-3xl border p-6 flex flex-col",
                  plan.popular
                    ? "border-brand-purple/40 bg-brand-purple/[0.03] shadow-brand"
                    : "border-border bg-card"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-purple text-white text-[11px] font-bold shadow-brand-sm">
                      <Star className="h-3 w-3 fill-white" />
                      Most popular
                    </span>
                  </div>
                )}

                {/* Plan name + desc */}
                <div className="mb-5">
                  <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-gradient-to-r text-white", plan.accent)}>
                    {plan.name}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{plan.description}</p>
                </div>

                {/* Price — animated on billing toggle */}
                <div className="mb-6">
                  <div className="flex items-end gap-1.5 h-10 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.id}-${annual}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                        className="font-display text-3xl font-extrabold"
                      >
                        {price.main}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-xs text-muted-foreground mb-1.5">{price.sub}</span>
                  </div>
                  <AnimatePresence>
                    {annual && plan.price !== "Free" && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] text-brand-green mt-1 overflow-hidden"
                      >
                        Save two months vs monthly
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* CTA */}
                <Link href="/signup" className="mb-6">
                  <Button
                    className="w-full gap-1.5"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-brand-green flex-shrink-0 mt-0.5" />
                      <span className={cn(feature.includes("coming soon") ? "text-muted-foreground" : "")}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
        >
          {[
            { icon: Shield,     label: "No credit card required for free plan" },
            { icon: BadgeCheck, label: "14-day free trial on paid plans" },
            { icon: Zap,        label: "Cancel or switch anytime" },
            { icon: MessageCircle, label: "WhatsApp support on all plans" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-brand-green" />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Feature comparison table */}
        <div>
          <button
            onClick={() => setShowComparison(v => !v)}
            className="flex items-center gap-2 mx-auto text-sm font-semibold text-brand-purple hover:underline mb-6"
          >
            {showComparison ? "Hide" : "Show"} full feature comparison
            {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-border bg-muted/30">
                <div className="text-xs font-semibold text-muted-foreground">Feature</div>
                {mockPricingPlans.map(plan => (
                  <div key={plan.id} className={cn("text-xs font-bold text-center", plan.popular ? "text-brand-purple" : "text-foreground")}>
                    {plan.name}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.feature}
                  className={cn("grid grid-cols-4 gap-4 px-5 py-3 border-b border-border last:border-0 items-center", i % 2 === 0 ? "" : "bg-muted/20")}
                >
                  <p className="text-xs text-muted-foreground">{row.feature}</p>
                  <CellValue value={row.starter} />
                  <CellValue value={row.growth} />
                  <CellValue value={row.pro} />
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-extrabold text-center mb-8">Questions & answers</h2>
          <div className="rounded-2xl border border-border bg-card px-5">
            {FAQS.map((item, i) => <FAQItem key={i} item={item} />)}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-brand-purple to-brand-indigo p-8 sm:p-12 text-center text-white"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-3">
            Start selling in minutes
          </h2>
          <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto mb-6">
            Join creators building storefronts, selling products, and growing online with Lummy. No tech skills needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2 bg-white text-brand-purple hover:bg-white/90 font-bold px-6">
                <Zap className="h-4 w-4 fill-brand-purple" />
                Create your free store
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10 px-6">
                Start setup
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-white/40 text-xs mt-4">Free forever plan available · No credit card required</p>
        </motion.div>
      </div>
    </div>
  )
}
