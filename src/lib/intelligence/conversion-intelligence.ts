/**
 * Conversion Intelligence — abandoned checkout detection, intent scoring,
 * bottleneck detection, repeat customer scoring.
 *
 * Reads from: automation_events (checkout_started/checkout_abandoned),
 *             automation_logs, creator_metrics_daily
 * Emits: customer_high_value, customer_reengagement_needed
 */

import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import { emitEvent } from "@/lib/automation/sdk"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { IntelligenceRunResult } from "./intelligence-events"

const HIGH_VALUE_ORDER_COUNT = 3        // 3+ orders = high value customer
const HIGH_VALUE_LTV_KOBO = 50_000_00   // $500+ lifetime in minor units = high value
const REENGAGEMENT_DAYS = 30            // customer silent 30 days = needs reengagement
const ABANDONED_SPIKE_RATIO = 0.40      // >40% checkout abandonment = bottleneck

// ── Conversion Bottleneck Detection ──────────────────────────────────────────

export interface ConversionBottleneck {
  creatorId: string
  abandonRate: number
  startedCount: number
  abandonedCount: number
  completedCount: number
  recommendation: string
}

export async function detectConversionBottlenecks(
  windowDays = 7,
): Promise<ConversionBottleneck[]> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString()

  const { data: events } = await supabase
    .from("automation_events")
    .select("event_name, creator_id, payload")
    .in("event_name", ["checkout_started", "checkout_abandoned", "order_created"])
    .gte("created_at", since)
    .eq("status", "completed")
    .limit(5000)

  if (!events?.length) return []

  const byCreator = new Map<string, { started: number; abandoned: number; completed: number }>()
  for (const ev of events as { event_name: string; creator_id: string }[]) {
    const c = byCreator.get(ev.creator_id) ?? { started: 0, abandoned: 0, completed: 0 }
    if (ev.event_name === "checkout_started")  c.started++
    if (ev.event_name === "checkout_abandoned") c.abandoned++
    if (ev.event_name === "order_created")      c.completed++
    byCreator.set(ev.creator_id, c)
  }

  const bottlenecks: ConversionBottleneck[] = []
  for (const [creatorId, c] of byCreator.entries()) {
    if (c.started < 5) continue  // not enough volume to be meaningful
    const abandonRate = c.started > 0 ? c.abandoned / c.started : 0
    if (abandonRate >= ABANDONED_SPIKE_RATIO) {
      bottlenecks.push({
        creatorId,
        abandonRate,
        startedCount:   c.started,
        abandonedCount: c.abandoned,
        completedCount: c.completed,
        recommendation: `${(abandonRate * 100).toFixed(0)}% abandon rate — review checkout UX, pricing clarity, and WhatsApp CTA placement`,
      })
    }
  }

  return bottlenecks.sort((a, b) => b.abandonRate - a.abandonRate)
}

// ── High Value Customer Detection ─────────────────────────────────────────────

export async function detectHighValueCustomers(): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("conv")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    // Find customers with multiple completed orders (high LTV)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const today = new Date().toISOString().split("T")[0]

    const { data: orders } = await supabase
      .from("orders")
      .select("creator_id, customer_email, customer_phone, id")
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo)
      .limit(2000)

    if (!orders?.length) {
      return { module: "conversion-intelligence", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [] }
    }

    // Group by creator + customer
    const byCustomer = new Map<string, {
      creatorId: string; email: string; phone: string; orderCount: number
    }>()

    for (const o of orders as { creator_id: string; customer_email?: string; customer_phone?: string; id: string }[]) {
      const key = `${o.creator_id}:${o.customer_email ?? o.customer_phone ?? "unknown"}`
      const c = byCustomer.get(key) ?? { creatorId: o.creator_id, email: o.customer_email ?? "", phone: o.customer_phone ?? "", orderCount: 0 }
      c.orderCount++
      byCustomer.set(key, c)
    }

    for (const [, c] of byCustomer.entries()) {
      if (c.orderCount >= HIGH_VALUE_ORDER_COUNT) {
        await emitEvent("customer_high_value", {
          tenantId: c.creatorId,
          creatorId: c.creatorId,
          correlationId,
        }, {
          customerEmail: c.email,
          customerPhone: c.phone,
          orderCount: c.orderCount,
          detectedAt: today,
        }, `customer_high_value:${c.creatorId}:${c.email ?? c.phone}:${today}`)
        signals.push(`high_value:${c.creatorId}:orders=${c.orderCount}`)
        eventsEmitted++
      }
    }
  } catch (err) {
    logger.error("[conversion-intelligence] high value customer detection failed", { error: String(err) })
  }

  return { module: "conversion-intelligence", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── Customer Intent Scoring ───────────────────────────────────────────────────

export interface CustomerIntentScore {
  customerId: string
  creatorId: string
  score: number       // 0-100
  tier: "cold" | "warm" | "hot" | "buyer"
  signals: string[]
}

export function scoreCustomerIntent(signals: {
  hasViewedProduct: boolean
  hasClickedWhatsApp: boolean
  hasStartedCheckout: boolean
  hasCompletedOrder: boolean
  viewCount: number
  recencyHours: number
}): CustomerIntentScore["tier"] {
  let score = 0
  if (signals.hasCompletedOrder)    score += 40
  if (signals.hasStartedCheckout)   score += 25
  if (signals.hasClickedWhatsApp)   score += 20
  if (signals.hasViewedProduct)     score += 10
  score += Math.min(5, signals.viewCount)
  if (signals.recencyHours < 24)    score += 10
  else if (signals.recencyHours < 72) score += 5

  return score >= 80 ? "buyer" : score >= 50 ? "hot" : score >= 25 ? "warm" : "cold"
}
