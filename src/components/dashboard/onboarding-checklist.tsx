"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2, Circle, ChevronRight, X, Sparkles,
  Store, Package, MessageCircle, Globe, ShoppingBag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivationChecklist } from "@/lib/queries/activation"

const ICON_MAP: Record<string, React.ElementType> = {
  profile:  Store,
  product:  Package,
  whatsapp: MessageCircle,
  publish:  Globe,
  sale:     ShoppingBag,
}

const DISMISS_KEY = "lummy_checklist_dismissed_v2"

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = React.useState(false)
  const [expanded, setExpanded] = React.useState(true)
  const [checklist, setChecklist] = React.useState<ActivationChecklist | null>(null)

  React.useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "true") setDismissed(true)
    } catch {}
  }, [])

  React.useEffect(() => {
    fetch("/api/activation")
      .then(r => r.ok ? r.json() : null)
      .then((data: { checklist?: ActivationChecklist } | null) => {
        if (data?.checklist) setChecklist(data.checklist)
      })
      .catch(() => {})
  }, [])

  const dismiss = () => {
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, "true") } catch {}
  }

  if (dismissed || !checklist) return null

  const { steps, completedCount, totalCount, percentComplete } = checklist
  const allDone = completedCount === totalCount

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-purple/20 bg-card overflow-hidden"
    >
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="relative flex-shrink-0 w-10 h-10">
          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
              strokeWidth="3" className="text-brand-purple/15" />
            <motion.circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="#6C4EF3" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - percentComplete }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {allDone
              ? <Sparkles className="h-4 w-4 text-brand-purple" />
              : <span className="text-[10px] font-bold text-brand-purple">{percentComplete}%</span>}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">
            {allDone ? "Store setup complete! 🎉" : "Finish setting up your store"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allDone
              ? "You're ready to sell. Share your store link!"
              : `${completedCount} of ${totalCount} steps done`}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); dismiss() }}
            className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-90"
          )} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border">
              {steps.map((step) => {
                const Icon = ICON_MAP[step.id] ?? Store
                return (
                  <div key={step.id} className={cn(
                    "flex items-center gap-3 px-5 py-3.5 transition-colors",
                    step.done ? "bg-brand-purple/3" : "hover:bg-muted/30"
                  )}>
                    <div className="flex-shrink-0">
                      {step.done
                        ? <CheckCircle2 className="h-5 w-5 text-brand-purple" />
                        : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                    </div>
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0",
                      step.done ? "bg-brand-purple/10" : "bg-muted"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", step.done ? "text-brand-purple" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold", step.done && "line-through text-muted-foreground")}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{step.sub}</p>
                    </div>
                    {!step.done && (
                      <Link
                        href={step.href}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-brand-purple hover:underline"
                      >
                        Go <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
