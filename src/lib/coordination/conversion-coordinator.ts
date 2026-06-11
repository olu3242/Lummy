/**
 * Conversion Coordinator — prioritizes high-intent conversion events and
 * accelerates checkout recovery, payment retry, and onboarding completion.
 *
 * Reads from: automation_events, orders, creator_profiles
 * Emits: workflow_priority_elevated (for escalated SLA events)
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { IntelligenceRunResult } from "@/lib/intelligence/intelligence-events"

// ── Checkout Recovery ─────────────────────────────────────────────────────────

export async function accelerateCheckoutRecovery(limit = 100): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("conv")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    // Find checkout_abandoned events that are still pending/retrying after 30 min
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60_000).toISOString()
    const { data: staleCheckouts } = await supabase
      .from("automation_events")
      .select("id, creator_id, payload, priority, attempt_count, created_at")
      .eq("event_name", "checkout_abandoned")
      .in("status", ["pending", "retrying"])
      .lte("created_at", thirtyMinsAgo)
      .order("created_at", { ascending: true })
      .limit(limit)

    for (const ev of (staleCheckouts ?? []) as {
      id: string
      creator_id: string
      payload: Record<string, unknown>
      priority: number
      attempt_count: number | null
      created_at: string
    }[]) {
      // Escalate to priority 1 if recovery window is closing (>45 min old)
      const ageMs = Date.now() - new Date(ev.created_at).getTime()
      const newPriority = ageMs > 45 * 60_000 ? 1 : 2

      if (ev.priority > newPriority) {
        await supabase
          .from("automation_events")
          .update({ priority: newPriority, updated_at: new Date().toISOString() })
          .eq("id", ev.id)

        await emitEvent("workflow_priority_elevated", {
          tenantId:  ev.creator_id,
          creatorId: ev.creator_id,
          correlationId,
        }, {
          originalEventId:   ev.id,
          eventName:         "checkout_abandoned",
          fromPriority:      ev.priority,
          toPriority:        newPriority,
          reason:            ageMs > 45 * 60_000 ? "recovery_window_closing" : "checkout_stale",
          ageMinutes:        Math.round(ageMs / 60_000),
        }, `conv_priority:${ev.id}:${newPriority}`)

        signals.push(`checkout_escalated:${ev.creator_id}:p${newPriority}`)
        eventsEmitted++
      }
    }
  } catch (err) {
    logger.error("[conversion-coordinator] checkout recovery failed", { error: String(err) })
  }

  return { module: "conversion-coordinator/checkout", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── Payment Retry Acceleration ────────────────────────────────────────────────

export async function acceleratePaymentRetry(limit = 50): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("conv")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    // Payment_failed events still pending after 10 min need immediate re-queue
    const tenMinsAgo = new Date(Date.now() - 10 * 60_000).toISOString()
    const { data: failedPayments } = await supabase
      .from("automation_events")
      .select("id, creator_id, payload, priority, created_at")
      .eq("event_name", "payment_failed")
      .in("status", ["pending", "retrying", "failed"])
      .lte("created_at", tenMinsAgo)
      .gt("priority", 1)
      .limit(limit)

    for (const ev of (failedPayments ?? []) as {
      id: string
      creator_id: string
      payload: Record<string, unknown>
      priority: number
      created_at: string
    }[]) {
      await supabase
        .from("automation_events")
        .update({ priority: 1, status: "retrying", updated_at: new Date().toISOString() })
        .eq("id", ev.id)
        .gt("priority", 1)

      signals.push(`payment_escalated:${ev.creator_id}`)
      eventsEmitted++
    }

    if (eventsEmitted > 0) {
      logger.info("[conversion-coordinator] payment retry accelerated", { count: eventsEmitted, correlationId })
    }
  } catch (err) {
    logger.error("[conversion-coordinator] payment retry acceleration failed", { error: String(err) })
  }

  return { module: "conversion-coordinator/payment", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── Onboarding Acceleration ───────────────────────────────────────────────────

export async function accelerateOnboardingRisk(limit = 100): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("conv")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    // Creators who started onboarding (profile exists) but haven't published their store in 48h
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 3_600_000).toISOString()
    const { data: stuckCreators } = await supabase
      .from("creator_profiles")
      .select("id, created_at, is_published, handle")
      .eq("is_published", false)
      .lte("created_at", fortyEightHoursAgo)
      .limit(limit)

    const today = new Date().toISOString().split("T")[0]

    for (const c of (stuckCreators ?? []) as {
      id: string
      created_at: string
      is_published: boolean
      handle: string | null
    }[]) {
      const ageHours = Math.round((Date.now() - new Date(c.created_at).getTime()) / 3_600_000)

      await emitEvent("workflow_priority_elevated", {
        tenantId:  c.id,
        creatorId: c.id,
        correlationId,
      }, {
        reason:      "onboarding_stuck",
        ageHours,
        handle:      c.handle,
        priority:    2,
      }, `onboarding_stuck:${c.id}:${today}`)

      signals.push(`onboarding_stuck:${c.id}:${ageHours}h`)
      eventsEmitted++
    }
  } catch (err) {
    logger.error("[conversion-coordinator] onboarding acceleration failed", { error: String(err) })
  }

  return { module: "conversion-coordinator/onboarding", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}

// ── High-Intent Customer Prioritization ───────────────────────────────────────

export async function prioritizeHighIntentCustomers(limit = 200): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("conv")
  let eventsEmitted = 0
  const signals: string[] = []

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3_600_000).toISOString()

    // Customers who have both viewed a storefront AND clicked WhatsApp today — high intent
    const { data: highIntent } = await supabase
      .from("customer_high_value_signals")
      .select("creator_id, customer_id, signal_type, created_at")
      .gte("created_at", twentyFourHoursAgo)
      .in("signal_type", ["whatsapp_click_after_view", "repeat_wa_click", "high_session_count"])
      .limit(limit)

    for (const s of (highIntent ?? []) as {
      creator_id: string
      customer_id: string
      signal_type: string
      created_at: string
    }[]) {
      // Escalate any pending customer_high_value events for this customer to priority 2
      await supabase
        .from("automation_events")
        .update({ priority: 2, updated_at: new Date().toISOString() })
        .eq("event_name", "customer_high_value")
        .eq("creator_id", s.creator_id)
        .in("status", ["pending"])
        .gt("priority", 2)

      signals.push(`high_intent:${s.creator_id}:${s.signal_type}`)
      eventsEmitted++
    }
  } catch (_err) {
    // Table may not exist yet — silent fail during early rollout
  }

  return { module: "conversion-coordinator/customers", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}

// ── Unified Conversion Coordination Run ──────────────────────────────────────

export async function runConversionCoordination(limit = 100): Promise<IntelligenceRunResult> {
  const start = Date.now()
  const correlationId = generateCorrelationId("conv")
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const [checkoutResult, paymentResult, onboardingResult] = await Promise.allSettled([
      accelerateCheckoutRecovery(limit),
      acceleratePaymentRetry(Math.floor(limit / 2)),
      accelerateOnboardingRisk(limit),
    ])

    for (const r of [checkoutResult, paymentResult, onboardingResult]) {
      if (r.status === "fulfilled") {
        eventsEmitted += r.value.eventsEmitted
        signals.push(...r.value.signals)
      }
    }

    logger.info("[conversion-coordinator] coordination run complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[conversion-coordinator] run failed", { error: String(err) })
  }

  return { module: "conversion-coordinator", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
