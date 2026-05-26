import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ScalingCoordinationRunResult } from "./scaling-events"

export async function runScalingPriorityEngine(): Promise<ScalingCoordinationRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("scaling-priority")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const oneHourAgo      = new Date(Date.now() - 86_400_000 / 24).toISOString()
    const oneDayAgo       = new Date(Date.now() - 86_400_000).toISOString()
    const sevenDaysAgo    = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()
    const thirtyDaysAgo   = new Date(Date.now() - 30 * 86_400_000).toISOString()

    // ── Processing lag: pending/failed events older than 1 hour ──────────────
    const { data: stalledEvents } = await supabase
      .from("automation_events")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "failed"])
      .lt("created_at", oneHourAgo)

    const stalledCount = (stalledEvents as unknown as { count?: number } | null)?.count
      ?? (await supabase
        .from("automation_events")
        .select("id")
        .in("status", ["pending", "failed"])
        .lt("created_at", oneHourAgo)).data?.length
      ?? 0

    if (stalledCount >= 20) {
      const severity =
        stalledCount >= 100 ? "critical" :
        stalledCount >= 50  ? "high" :
        "medium"

      await emitEvent("marketplace_scaling_bottleneck", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        bottleneckType: "processing_lag",
        severity,
        estimatedRevenueLossKobo: 0,
        recommendedAction: "Increase cron frequency and batch size to clear stalled event queue",
        snapshotDate: today,
      }, `scaling_bottleneck:processing_lag:${today}`)
      eventsEmitted++
      signals.push(`processing_lag:count=${stalledCount}:${severity}`)
    }

    // ── Payment failures in last 24h ─────────────────────────────────────────
    const { data: paymentFailedEvents } = await supabase
      .from("automation_events")
      .select("id")
      .eq("event_name", "payment_failed")
      .gte("created_at", oneDayAgo)

    const paymentFailCount = (paymentFailedEvents ?? []).length

    if (paymentFailCount >= 10) {
      const severity =
        paymentFailCount >= 50 ? "critical" :
        paymentFailCount >= 25 ? "high" :
        "medium"

      await emitEvent("marketplace_scaling_bottleneck", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        bottleneckType: "payment_failures",
        severity,
        estimatedRevenueLossKobo: paymentFailCount * 5_000_000, // ₦50k avg per failure in kobo
        recommendedAction: "Audit Paystack integration and retry logic for failed payment events",
        snapshotDate: today,
      }, `scaling_bottleneck:payment_failures:${today}`)
      eventsEmitted++
      signals.push(`payment_failures:count=${paymentFailCount}:${severity}`)
    }

    // ── Onboarding drop: last 7d vs prior 7d ────────────────────────────────
    const { data: recentOnboarding } = await supabase
      .from("automation_events")
      .select("id")
      .eq("event_name", "onboarding_completed")
      .gte("created_at", sevenDaysAgo)

    const { data: priorOnboarding } = await supabase
      .from("automation_events")
      .select("id")
      .eq("event_name", "onboarding_completed")
      .gte("created_at", fourteenDaysAgo)
      .lt("created_at", sevenDaysAgo)

    const recentOnboardingCount = (recentOnboarding ?? []).length
    const priorOnboardingCount  = (priorOnboarding ?? []).length

    if (priorOnboardingCount > 0 && recentOnboardingCount < priorOnboardingCount * 0.7) {
      const dropPct = Math.round((1 - recentOnboardingCount / priorOnboardingCount) * 100)

      await emitEvent("marketplace_scaling_bottleneck", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        bottleneckType: "onboarding_drop",
        severity: dropPct >= 60 ? "high" : "medium",
        estimatedRevenueLossKobo: 0,
        recommendedAction: "Review onboarding funnel for UX friction and drop-off points",
        snapshotDate: today,
      }, `scaling_bottleneck:onboarding_drop:${today}`)
      eventsEmitted++
      signals.push(`onboarding_drop:${dropPct}%`)
    }

    // ── Creator acquisition concern: active creators 7d vs 30d ──────────────
    const { data: active7dOrders } = await supabase
      .from("orders")
      .select("creator_id")
      .gte("created_at", sevenDaysAgo)

    const { data: active30dOrders } = await supabase
      .from("orders")
      .select("creator_id")
      .gte("created_at", thirtyDaysAgo)

    const active7d  = new Set(((active7dOrders  ?? []) as { creator_id: string }[]).map(o => o.creator_id)).size
    const active30d = new Set(((active30dOrders ?? []) as { creator_id: string }[]).map(o => o.creator_id)).size

    if (active30d > 0 && active7d < active30d * 0.5) {
      await emitEvent("marketplace_scaling_bottleneck", {
        tenantId: "platform", creatorId: "platform", correlationId,
      }, {
        bottleneckType: "creator_acquisition",
        severity: "medium",
        affectedCreators: active30d - active7d,
        estimatedRevenueLossKobo: 0,
        recommendedAction: "Launch creator re-engagement campaign and referral incentives",
        snapshotDate: today,
      }, `scaling_bottleneck:creator_acquisition:${today}`)
      eventsEmitted++
      signals.push(`creator_acquisition:active7d=${active7d}:active30d=${active30d}`)
    }

    logger.info("[scaling-priority] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[scaling-priority] engine failed", { error: String(err) })
    return { module: "scaling-priority", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "scaling-priority", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
