"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2, Circle, ChevronRight, X, Sparkles,
  Store, Package, Wallet, Share2, ShoppingBag,
} from "lucide-react"
import { cn } from "@/lib/utils"

const KEY = "lummy_onboarding_v1"

interface OnboardingState {
  dismissed: boolean
  completed: string[]
}

function loadState(): OnboardingState {
  if (typeof window === "undefined") return { dismissed: false, completed: [] }
  try {
    const v = localStorage.getItem(KEY)
    return v ? JSON.parse(v) : { dismissed: false, completed: [] }
  } catch {
    return { dismissed: false, completed: [] }
  }
}

function saveState(s: OnboardingState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {}
}

const STEPS = [
  { id: "profile",  label: "Complete your profile",      sub: "Add bio, location & social links", href: "/dashboard/store",    icon: Store },
  { id: "product",  label: "Add your first product",     sub: "List something for sale",          href: "/dashboard/products", icon: Package },
  { id: "bank",     label: "Link your bank account",     sub: "So you can receive payouts",       href: "/dashboard/payouts",  icon: Wallet },
  { id: "share",    label: "Share your store link",      sub: "Start driving traffic",            href: "/dashboard/store",    icon: Share2 },
  { id: "sale",     label: "Make your first sale",       sub: "The goal 🎯",                      href: "/dashboard/orders",   icon: ShoppingBag },
]

export function OnboardingChecklist() {
  const [state, setState] = React.useState<OnboardingState>(loadState)
  const [expanded, setExpanded] = React.useState(true)

  if (state.dismissed) return null

  const done = state.completed
  const pct = Math.round((done.length / STEPS.length) * 100)
  const allDone = done.length === STEPS.length

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter(x => x !== id) : [...done, id]
    const newState = { ...state, completed: next }
    setState(newState)
    saveState(newState)
  }

  const dismiss = () => {
    const newState = { ...state, dismissed: true }
    setState(newState)
    saveState(newState)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-purple/20 bg-card overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Progress ring */}
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
              animate={{ strokeDashoffset: 100 - pct }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {allDone
              ? <Sparkles className="h-4 w-4 text-brand-purple" />
              : <span className="text-[10px] font-bold text-brand-purple">{pct}%</span>}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">
            {allDone ? "Store setup complete! 🎉" : "Finish setting up your store"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allDone
              ? "You're ready to sell. Share your store link!"
              : `${done.length} of ${STEPS.length} steps done`}
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
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        </div>
      </div>

      {/* Steps */}
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
              {STEPS.map((step) => {
                const isDone = done.includes(step.id)
                return (
                  <div key={step.id} className={cn("flex items-center gap-3 px-5 py-3.5 transition-colors", isDone ? "bg-brand-purple/3" : "hover:bg-muted/30")}>
                    <button onClick={() => toggle(step.id)} className="flex-shrink-0">
                      {isDone
                        ? <CheckCircle2 className="h-5 w-5 text-brand-purple" />
                        : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                    </button>
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0", isDone ? "bg-brand-purple/10" : "bg-muted")}>
                      <step.icon className={cn("h-3.5 w-3.5", isDone ? "text-brand-purple" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold", isDone && "line-through text-muted-foreground")}>{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.sub}</p>
                    </div>
                    {!isDone && (
                      <Link href={step.href}
                        className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-brand-purple hover:underline">
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
