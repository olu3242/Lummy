"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockPricingPlans } from "@/data/mock"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Annual prices per plan (monthly price × 0.8, billed annually)
const annualPrices: Record<string, { display: string; saving: string; subtext: string }> = {
  starter: { display: "Free",   saving: "",            subtext: "Forever"                    },
  growth:  { display: "$8",     saving: "Save $24/yr",  subtext: "per month, billed annually" },
  pro:     { display: "$19",    saving: "Save $60/yr",  subtext: "per month, billed annually" },
}

function AnimatedPrice({ price, subtext }: { price: string; subtext: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={price}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="font-display text-4xl font-extrabold">{price}</span>
          {price !== "Free" && (
            <span className="text-sm text-muted-foreground">/mo</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </motion.div>
    </AnimatePresence>
  )
}

export function PricingSection() {
  const [annual, setAnnual] = React.useState(false)

  return (
    <section id="pricing" className="section-padding bg-muted/30">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Simple pricing
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Start free.
            <br />
            <span className="gradient-text">Scale when you&apos;re ready.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Start with the essentials, then upgrade when you need more support, customization, and growth tools.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3">
            <span className={cn("text-sm font-semibold transition-colors", !annual ? "text-foreground" : "text-muted-foreground")}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(v => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none",
                annual ? "bg-brand-purple" : "bg-muted-foreground/30"
              )}
              aria-label="Toggle annual billing"
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300",
                annual ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
            <span className={cn("text-sm font-semibold transition-colors", annual ? "text-foreground" : "text-muted-foreground")}>
              Annual
            </span>
            <AnimatePresence>
              {annual && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="px-2 py-0.5 rounded-full bg-brand-green/15 border border-brand-green/30 text-brand-green text-xs font-bold"
                >
                  Save 20%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {mockPricingPlans.map((plan, i) => {
            const ann = annualPrices[plan.id]
            const displayPrice = annual && ann ? ann.display : plan.price
            const displaySubtext = annual && ann ? ann.subtext : (plan.price === "Free" ? `· ${plan.priceSubtext}` : plan.priceSubtext)
            const saving = annual && ann?.saving

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "relative rounded-3xl border flex flex-col overflow-hidden",
                  plan.popular
                    ? "border-brand-purple/40 shadow-brand bg-card"
                    : "border-border bg-card"
                )}
              >
                {/* Top accent line for popular */}
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-brand-purple via-brand-indigo to-brand-purple" />
                )}

                {/* Plan header */}
                <div className="p-6 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                    <div className="flex items-center gap-1.5">
                      {plan.popular && (
                        <Badge variant="brand-glow" size="sm">
                          <Zap className="w-3 h-3" />
                          Most Popular
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Animated price */}
                  <div className="h-[72px] flex flex-col justify-start mb-1">
                    <AnimatedPrice price={displayPrice} subtext={displaySubtext} />
                  </div>

                  {/* Annual savings pill */}
                  <div className="h-5 mb-4">
                    <AnimatePresence>
                      {saving && (
                        <motion.span
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                          className="inline-block text-[11px] font-semibold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-full"
                        >
                          {saving}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                  {/* CTA */}
                  <Link href="/signup">
                    <Button
                      size="lg"
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                    >
                      {plan.id === "starter" ? "Start Selling Free" : plan.id === "growth" ? "Start Growing Today" : "Launch at Scale"}
                    </Button>
                  </Link>
                </div>

                {/* Divider */}
                <div className="mx-6 my-6 h-px bg-border" />

                {/* Features */}
                <div className="px-6 pb-6 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    What&apos;s included
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className={cn(
                          "h-4 w-4 mt-0.5 flex-shrink-0",
                          plan.popular ? "text-brand-purple" : "text-brand-green"
                        )} />
                        <span className="text-muted-foreground leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Enterprise callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Running a larger creator business or agency?{" "}
            <button className="text-primary font-semibold hover:underline">
              Get launch support →
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
