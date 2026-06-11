import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RecoveryRunResult } from "./creator-recovery-engine"

export async function runCustomerRecoveryEngine(limit = 200): Promise<RecoveryRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("customer-recovery")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    for (const creator of (creators ?? []) as { id: string }[]) {
      try {
        const creatorId = creator.id

        const [active90dRes, recent30dRes] = await Promise.allSettled([
          supabase
            .from("orders")
            .select("customer_id")
            .eq("creator_id", creatorId)
            .gte("created_at", ninetyDaysAgo),
          supabase
            .from("orders")
            .select("customer_id")
            .eq("creator_id", creatorId)
            .gte("created_at", thirtyDaysAgo),
        ])

        const activeCustomers = active90dRes.status === "fulfilled"
          ? new Set((active90dRes.value.data ?? []).map((r: { customer_id: string }) => r.customer_id)).size
          : 0

        const recentCustomers = recent30dRes.status === "fulfilled"
          ? new Set((recent30dRes.value.data ?? []).map((r: { customer_id: string }) => r.customer_id)).size
          : 0

        if (activeCustomers >= 5 && recentCustomers < activeCustomers * 0.3) {
          const dropoutRate = (activeCustomers - recentCustomers) / activeCustomers
          await emitEvent(
            "customer_recovery_required",
            { tenantId: creatorId, creatorId, correlationId },
            {
              creatorId,
              activeCustomers,
              recentCustomers,
              dropoutRate,
              recoveryType: "customer_dropout",
              recommendedAction: "WhatsApp re-engagement campaign",
              snapshotDate: today,
            },
            `customer_recovery:${creatorId}:${today}`,
          )
          eventsEmitted++
          signals.push(`dropout:${creatorId}:active=${activeCustomers}:recent=${recentCustomers}:rate=${Math.round(dropoutRate * 100)}pct`)
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[customer-recovery] engine complete", { eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[customer-recovery] engine failed", { error: String(err) })
  }

  return {
    module: "customer-recovery",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
  }
}
