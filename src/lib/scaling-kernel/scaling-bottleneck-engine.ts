import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"

interface ScalingKernelRunResult {
  module: string
  eventsEmitted: number
  alertsRaised: number
  durationMs: number
  signals: string[]
}

export async function runScalingBottleneckEngine(): Promise<ScalingKernelRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("scaling-bottleneck")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const { data: bottleneckEvents } = await supabase
      .from("automation_events")
      .select("id, event_name, payload")
      .in("event_name", ["marketplace_scaling_bottleneck", "scaling_governance_alert", "ecosystem_integrity_risk"])
      .gte("created_at", sevenDaysAgo)

    const rows = (bottleneckEvents ?? []) as { id: string; event_name: string; payload: Record<string, unknown> | null }[]
    const total = rows.length

    const severityDistribution = { critical: 0, high: 0, medium: 0 }
    const bottleneckTypeCounts = new Map<string, number>()

    for (const row of rows) {
      const payload = row.payload ?? {}
      const severity = (payload.severity ?? "") as string
      if (severity === "critical") severityDistribution.critical++
      else if (severity === "high") severityDistribution.high++
      else if (severity === "medium") severityDistribution.medium++

      const typeKey = (payload.bottleneckType ?? payload.governanceArea ?? payload.riskType ?? row.event_name) as string
      bottleneckTypeCounts.set(typeKey, (bottleneckTypeCounts.get(typeKey) ?? 0) + 1)
    }

    if (total > 5) {
      await emitEvent(
        "scaling_coordination_required",
        { tenantId: "platform", creatorId: "platform", correlationId },
        {
          bottleneckCount: total,
          severityDistribution,
          snapshotDate: today,
        },
        `scaling_bottleneck_summary:platform:${today}`,
      )
      eventsEmitted++
      signals.push(`platform_scaling_pressure:total=${total}:critical=${severityDistribution.critical}:high=${severityDistribution.high}`)
    }

    const topTypes = [...bottleneckTypeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    for (const [type, count] of topTypes) {
      signals.push(`bottleneck_type:${type}:count=${count}`)
    }

    logger.info("[scaling-bottleneck] engine complete", { eventsEmitted, total, correlationId })
  } catch (err) {
    logger.error("[scaling-bottleneck] engine failed", { error: String(err) })
    return { module: "scaling-bottleneck", eventsEmitted: 0, alertsRaised: 0, durationMs: Date.now() - start, signals: [String(err)] }
  }

  return { module: "scaling-bottleneck", eventsEmitted, alertsRaised: eventsEmitted, durationMs: Date.now() - start, signals }
}
