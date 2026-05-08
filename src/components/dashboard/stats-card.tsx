"use client"

import { motion } from "framer-motion"
import {
  Wallet,
  ShoppingBag,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import type { StatCard } from "@/data/mock/dashboard"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ElementType> = {
  Wallet,
  ShoppingBag,
  Eye,
  TrendingUp,
}

export function StatsCard({ stat, index }: { stat: StatCard; index: number }) {
  const Icon = iconMap[stat.icon] ?? TrendingUp
  const isUp = stat.trend === "up"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.bg)}>
          <Icon className={cn("h-5 w-5", stat.color)} />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-1",
            isUp
              ? "bg-brand-green/10 text-brand-green"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {isUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {stat.change}
        </span>
      </div>

      <div>
        <p className="font-display text-2xl font-extrabold tracking-tight">{stat.value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
      </div>

      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", stat.color.replace("text-", "bg-"))}
          style={{ width: `${Math.min(100, Math.abs(parseFloat(stat.change)) * 3)}%` }}
        />
      </div>
    </motion.div>
  )
}
