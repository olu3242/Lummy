"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockPricingPlans } from "@/data/mock"
import { cn } from "@/lib/utils"

export function PricingSection() {
  return (
    <section id="pricing" className="section-padding bg-muted/30">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
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
            No hidden fees. No lock-in. Cancel anytime. Your first storefront is always free.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {mockPricingPlans.map((plan, i) => (
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
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-brand-purple via-brand-indigo to-brand-purple" />
              )}

              {/* Plan header */}
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                  {plan.popular && (
                    <Badge variant="brand-glow" size="sm">
                      <Zap className="w-3 h-3" />
                      Most Popular
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span className="font-display text-4xl font-extrabold">{plan.price}</span>
                  {plan.price !== "Free" && (
                    <span className="text-sm text-muted-foreground ml-2">/{plan.priceSubtext}</span>
                  )}
                  {plan.price === "Free" && (
                    <span className="text-sm text-muted-foreground ml-2">· {plan.priceSubtext}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                {/* CTA */}
                <Button
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
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
          ))}
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
            Running a large creator business or agency?{" "}
            <button className="text-primary font-semibold hover:underline">
              Talk to us about Enterprise →
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
