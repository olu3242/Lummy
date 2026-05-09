"use client"

import { motion } from "framer-motion"
import { Share2, Store, MessageCircle, Wallet, ArrowRight } from "lucide-react"
import { mockWorkflowSteps } from "@/data/mock"

const iconMap: Record<string, React.ElementType> = {
  Share2,
  Store,
  MessageCircle,
  Wallet,
}

const stepColors = [
  { icon: "text-brand-purple", bg: "bg-brand-purple/10", border: "border-brand-purple/20", num: "text-brand-purple", line: "from-brand-purple/40" },
  { icon: "text-brand-coral", bg: "bg-brand-coral/10", border: "border-brand-coral/20", num: "text-brand-coral", line: "from-brand-coral/40" },
  { icon: "text-[#25D366]", bg: "bg-[#25D366]/10", border: "border-[#25D366]/20", num: "text-[#25D366]", line: "from-[#25D366]/40" },
  { icon: "text-brand-green", bg: "bg-brand-green/10", border: "border-brand-green/20", num: "text-brand-green", line: "from-brand-green/40" },
]

export function WorkflowSection() {
  return (
    <section id="workflow" className="section-padding bg-muted/30">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            How it works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            From post to profit
            <br />
            <span className="gradient-text">in four steps.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto">
            No tech skills needed. No complicated setup. Just create, list, share, and collect your money.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {mockWorkflowSteps.map((step, i) => {
              const Icon = iconMap[step.icon]
              const colors = stepColors[i]
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Step icon */}
                  <div className="relative mb-6">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg} border ${colors.border} shadow-sm`}>
                      <Icon className={`h-7 w-7 ${colors.icon}`} />
                    </div>
                    {/* Step number */}
                    <span className={`absolute -top-2 -right-2 font-display text-[10px] font-black ${colors.num} bg-background border border-border rounded-full w-5 h-5 flex items-center justify-center`}>
                      {i + 1}
                    </span>
                  </div>

                  {/* Arrow between steps (mobile/tablet) */}
                  {i < mockWorkflowSteps.length - 1 && (
                    <div className="hidden sm:flex lg:hidden absolute -right-3 top-5 z-10 items-center justify-center">
                      <ArrowRight className="h-5 w-5 text-border" />
                    </div>
                  )}

                  <h3 className="font-display text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                    {step.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-purple/5 border border-brand-purple/15 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            Average time from sign-up to first sale:{" "}
            <span className="font-bold text-foreground ml-1">under 15 minutes</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
