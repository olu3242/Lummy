/**
 * Creator Lifecycle Engine — tracks creator progression through key milestones
 * from onboarding to repeat monetization. Identifies lifecycle gaps and
 * emits targeted automation events to close them.
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

export type LifecycleStage =
  | "registered"
  | "onboarded"
  | "store_live"
  | "first_product"
  | "first_sale"
  | "repeat_seller"
  | "growth_stage"

export interface CreatorLifecycleStatus {
  creatorId: string
  currentStage: LifecycleStage
  completedMilestones: LifecycleStage[]
  nextMilestone: LifecycleStage | null
  daysInCurrentStage: number
  isStuck: boolean         // true if >7 days in same stage without progression
  gapAction: string | null
}

function nextStage(stage: LifecycleStage): LifecycleStage | null {
  const chain: LifecycleStage[] = ["registered", "onboarded", "store_live", "first_product", "first_sale", "repeat_seller", "growth_stage"]
  const idx = chain.indexOf(stage)
  return idx >= 0 && idx < chain.length - 1 ? chain[idx + 1] : null
}

const STUCK_THRESHOLD_DAYS = 7

export async function computeCreatorLifecycle(creatorId: string): Promise<CreatorLifecycleStatus> {
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("clc")

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("created_at, onboarding_completed, is_published, first_product_added_at, first_sale_at")
    .eq("id", creatorId)
    .maybeSingle()

  if (!profile) {
    return {
      creatorId,
      currentStage: "registered",
      completedMilestones: [],
      nextMilestone: "onboarded",
      daysInCurrentStage: 0,
      isStuck: false,
      gapAction: null,
    }
  }

  const p = profile as {
    created_at: string
    onboarding_completed: boolean
    is_published: boolean
    first_product_added_at: string | null
    first_sale_at: string | null
  }

  const { count: orderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .eq("status", "completed")

  const repeatSales = (orderCount ?? 0) >= 3

  // Determine completed milestones
  const milestones: LifecycleStage[] = ["registered"]
  if (p.onboarding_completed) milestones.push("onboarded")
  if (p.is_published)         milestones.push("store_live")
  if (p.first_product_added_at) milestones.push("first_product")
  if (p.first_sale_at)        milestones.push("first_sale")
  if (repeatSales)            milestones.push("repeat_seller")
  if ((orderCount ?? 0) >= 10) milestones.push("growth_stage")

  const currentStage = milestones[milestones.length - 1]
  const next = nextStage(currentStage)

  // Calculate days in current stage
  const stageStartMap: Partial<Record<LifecycleStage, string | null>> = {
    registered:   p.created_at,
    onboarded:    p.onboarding_completed ? p.created_at : null,
    store_live:   p.is_published ? p.created_at : null,
    first_product: p.first_product_added_at,
    first_sale:   p.first_sale_at,
  }
  const stageStart = stageStartMap[currentStage]
  const daysInStage = stageStart
    ? Math.floor((Date.now() - new Date(stageStart).getTime()) / 86_400_000)
    : 0

  const isStuck = daysInStage > STUCK_THRESHOLD_DAYS && next !== null

  // Gap actions
  const gapActions: Partial<Record<LifecycleStage, string>> = {
    registered:    "Complete your store setup to unlock your storefront",
    onboarded:     "Publish your store to start receiving customers",
    store_live:    "Add your first product to go live",
    first_product: "Share your store link on WhatsApp to get your first sale",
    first_sale:    "Add 2 more products and run a promotion to build repeat buyers",
    repeat_seller: "Set up a weekly WhatsApp broadcast to accelerate growth",
  }

  const gapAction = isStuck ? (gapActions[currentStage] ?? null) : null

  // Emit lifecycle events for stuck creators
  if (isStuck && next) {
    const today = new Date().toISOString().split("T")[0]
    if (currentStage === "first_product" && daysInStage > 14) {
      // Stuck before first sale for 2+ weeks → treat as churn risk
      void emitEvent("creator_churn_risk", { tenantId: creatorId, creatorId, correlationId }, {
        signal: "stuck_in_lifecycle",
        currentStage,
        daysStuck: daysInStage,
        nextMilestone: next,
      }, `creator_lifecycle_stuck:${creatorId}:${today}`).catch(() => {})
    }
  }

  return {
    creatorId,
    currentStage,
    completedMilestones: milestones,
    nextMilestone: next,
    daysInCurrentStage: daysInStage,
    isStuck,
    gapAction,
  }
}

// ── Monetization Health Score ─────────────────────────────────────────────────

export interface MonetizationHealthScore {
  creatorId: string
  score: number           // 0-100
  revenueKobo30d: number
  orderCount30d: number
  avgOrderValueKobo: number
  repeatCustomerRate: number
  profitabilityRisk: "none" | "low" | "medium" | "high"
}

export async function computeMonetizationHealth(creatorId: string): Promise<MonetizationHealthScore> {
  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]

  const { data: metrics } = await supabase
    .from("creator_metrics_daily")
    .select("revenue_ngn, orders_created, new_customers")
    .eq("creator_id", creatorId)
    .gte("date", thirtyDaysAgo)
    .limit(30)

  const rows = (metrics ?? []) as { revenue_ngn: number; orders_created: number; new_customers: number }[]
  const revenueNgn = rows.reduce((s, r) => s + r.revenue_ngn, 0)
  const orders = rows.reduce((s, r) => s + r.orders_created, 0)
  const newCustomers = rows.reduce((s, r) => s + r.new_customers, 0)

  const avgOrderValueKobo = orders > 0 ? Math.round((revenueNgn * 100) / orders) : 0
  const repeatRate = orders > 0 && newCustomers > 0 ? Math.max(0, (orders - newCustomers) / orders) : 0

  const score = Math.min(100, Math.round(
    (Math.min(revenueNgn, 500_000) / 500_000 * 40) +
    (Math.min(orders, 50) / 50 * 30) +
    (repeatRate * 30)
  ))

  const profitabilityRisk: MonetizationHealthScore["profitabilityRisk"] =
    revenueNgn === 0 && orders === 0 ? "high" :
    revenueNgn < 10_000               ? "medium" :
    revenueNgn < 50_000               ? "low" :
    "none"

  return {
    creatorId,
    score,
    revenueKobo30d: revenueNgn * 100,
    orderCount30d: orders,
    avgOrderValueKobo,
    repeatCustomerRate: repeatRate,
    profitabilityRisk,
  }
}
