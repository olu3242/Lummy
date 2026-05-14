import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Flame, Megaphone, ShieldAlert, Target, TrendingUp, Wand2, type LucideIcon } from "lucide-react"


export type DashboardTone = "warning" | "hot" | "primary" | "good" | "warn"

export type FocusItem = {
  id: string
  label: string
  detail: string
  tone: "warning" | "hot" | "primary"
  icon: LucideIcon
  cta: string
}

export type HealthSignal = {
  label: string
  value: string
  note: string
  tone: "good" | "warn" | "primary"
  icon: LucideIcon
}


export type KpiTarget = {
  label: string
  current: number
  target: number
  prefix?: string
  suffix?: string
}

export type QuickAction = {
  label: string
  href: string
  color: string
}

export type MilestoneCard = {
  label: string
  value: string
  icon: LucideIcon
  iconClass: string
}

export const focusItems: FocusItem[] = [
  { id: "restock", label: "Restock Ankara Print Dress", detail: "Only 4 units left · projected stockout in 2 days", tone: "warning", icon: AlertTriangle, cta: "/dashboard/inventory" },
  { id: "vip", label: "Follow up 7 hot WhatsApp leads", detail: "Lead score > 70 and inactive for 24h", tone: "hot", icon: Flame, cta: "/dashboard/crm" },
  { id: "campaign", label: "Launch Friday flash campaign", detail: "AI drafted 3 message variants for your VIP segment", tone: "primary", icon: Megaphone, cta: "/dashboard/campaigns" },
] as const

export const kpiTargets: KpiTarget[] = [
  { label: "Weekly revenue goal", current: 468000, target: 600000, prefix: "₦" },
  { label: "Orders target", current: 41, target: 60 },
  { label: "WhatsApp conversion", current: 13, target: 18, suffix: "%" },
] as const

export const healthSignals: HealthSignal[] = [
  { label: "Revenue velocity", value: "+18%", note: "vs last 7 days", tone: "good", icon: TrendingUp },
  { label: "Fulfilment risk", value: "2 issues", note: "1 late shipment · 1 low stock", tone: "warn", icon: ShieldAlert },
  { label: "Automation coverage", value: "74%", note: "broadcast + follow-up flows active", tone: "primary", icon: Wand2 },
] as const

export const quickActions: QuickAction[] = [
  { label: "Create new order", href: "/dashboard/orders/new", color: "bg-brand-purple/10 text-brand-purple" },
  { label: "Add product", href: "/dashboard/products/new", color: "bg-brand-green/10 text-brand-green" },
  { label: "Send broadcast", href: "/dashboard/broadcast", color: "bg-[#25D366]/10 text-[#25D366]" },
  { label: "Plan content", href: "/dashboard/calendar", color: "bg-brand-indigo/10 text-brand-indigo" },
  { label: "View reports", href: "/dashboard/reports", color: "bg-amber-500/10 text-amber-500" },
  { label: "Audit inventory", href: "/dashboard/inventory", color: "bg-brand-coral/10 text-brand-coral" },
] as const

export const milestoneCards: MilestoneCard[] = [
  { label: "Orders fulfilled", value: "32 / 40", icon: CheckCircle2, iconClass: "text-brand-green" },
  { label: "Posts scheduled", value: "9 / 12", icon: CalendarDays, iconClass: "text-brand-indigo" },
  { label: "Hot leads converted", value: "6 / 10", icon: Flame, iconClass: "text-brand-coral" },
] as const


export type OverviewEmptyStates = {
  focus: string
  kpi: string
  health: string
  quickActions: string
  milestones: string
}

export const overviewEmptyStates: OverviewEmptyStates = {
  focus: "No focus actions right now. You&apos;re all caught up.",
  kpi: "No KPI targets configured yet.",
  health: "Health signals will appear once activity data is available.",
  quickActions: "No quick actions available.",
  milestones: "Milestones will appear when your store starts generating activity.",
} as const

export type OverviewMeta = {
  handle: string
  focusRefreshLabel: string
  focusRefreshIcon: LucideIcon
  trackerIcon: LucideIcon
}


export type OverviewCopy = {
  focusHeading: string
  focusSubheading: string
  trackerHeading: string
  trackerCta: string
  quickActionsHeading: string
  milestonesHeading: string
  milestonesCta: string
}

export const overviewCopy: OverviewCopy = {
  focusHeading: "Today&apos;s Focus Queue",
  focusSubheading: "High-impact actions ranked by projected revenue lift.",
  trackerHeading: "Target Tracker",
  trackerCta: "Open full goals board",
  quickActionsHeading: "Quick Actions",
  milestonesHeading: "This Week&apos;s Milestones",
  milestonesCta: "View detailed report",
}


export type TopAction = {
  label: string
  href: string
  colorClass: string
  icon: "plus" | "sparkles" | "external"
  external?: boolean
}

export const TOP_ACTION_HANDLE_PLACEHOLDER = "__HANDLE__" as const

export const topActions: TopAction[] = [
  { label: "Add Product", href: "/dashboard/products", colorClass: "bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20", icon: "plus" },
  { label: "AI Caption", href: "/dashboard/ai", colorClass: "bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20", icon: "sparkles" },
  { label: "View Store", href: TOP_ACTION_HANDLE_PLACEHOLDER, colorClass: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20", icon: "external", external: true },
]

export const overviewMeta: OverviewMeta = {
  handle: "sade.styles",
  focusRefreshLabel: "updates hourly",
  focusRefreshIcon: Clock3,
  trackerIcon: Target,
} as const
