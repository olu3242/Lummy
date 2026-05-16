import { TOP_ACTION_HANDLE_PLACEHOLDER, type DashboardTone, type TopAction } from "@/data/mock/dashboard-overview"

export type ResolvedTopAction = Omit<TopAction, "href"> & { href: string }

/** Resolve top actions by replacing handle placeholders with the active creator handle. */
export function resolveTopActions(actions: TopAction[], handle: string): ResolvedTopAction[] {
  return actions.map((action) => ({
    ...action,
    href: action.href === TOP_ACTION_HANDLE_PLACEHOLDER ? `/${handle}` : action.href,
  }))
}

export const toneClassByType: Record<DashboardTone, string> = {
  warning: "bg-amber-500/10 text-amber-500",
  hot: "bg-brand-coral/10 text-brand-coral",
  primary: "bg-brand-purple/10 text-brand-purple",
  good: "text-brand-green bg-brand-green/10",
  warn: "text-amber-500 bg-amber-500/10",
}

function sanitizeNumber(value: number) {
  return Number.isFinite(value) ? value : 0
}

/** Format numeric metrics with optional prefix/suffix and finite-value guards. */
export function formatMetric(value: number, prefix = "", suffix = "") {
  const safeValue = sanitizeNumber(value)
  return `${prefix}${safeValue.toLocaleString()}${suffix}`
}

/** Compute bounded 0-100 progress for a target metric. */
export function targetProgress(current: number, target: number) {
  const safeCurrent = sanitizeNumber(current)
  const safeTarget = sanitizeNumber(target)
  if (safeTarget <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((safeCurrent / safeTarget) * 100)))
}
