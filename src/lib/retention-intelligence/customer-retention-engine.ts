import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { RetentionIntelligenceRunResult } from "./retention-events"

export async function runCustomerRetentionEngine(limit = 200): Promise<RetentionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("customer-retention")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0
  let creatorsScored = 0

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString()

  try {
    const { data: creators } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("is_published", true)
      .limit(limit)

    for (const creator of (creators ?? []) as { id: string }[]) {
      try {
        const creatorId = creator.id

        const { data: recentOrders } = await supabase
          .from("orders")
          .select("customer_id, created_at, amount_kobo")
          .eq("creator_id", creatorId)
          .gte("created_at", ninetyDaysAgo)
          .order("created_at", { ascending: true })

        const rows = (recentOrders ?? []) as {
          customer_id: string
          created_at: string
          amount_kobo: number
        }[]

        if (rows.length === 0) continue

        const customerMap = new Map<string, { orders: Date[]; totalKobo: number }>()
        for (const row of rows) {
          const cid = row.customer_id
          if (!cid) continue
          const entry = customerMap.get(cid) ?? { orders: [], totalKobo: 0 }
          entry.orders.push(new Date(row.created_at))
          entry.totalKobo += row.amount_kobo ?? 0
          customerMap.set(cid, entry)
        }

        const totalCustomers = customerMap.size
        const now = Date.now()

        type CustomerRisk = {
          customerId: string
          daysSinceLastPurchase: number
          purchaseFrequency: number
          churnProbability: number
          churnRiskScore: number
          avgOrderValueKobo: number
        }

        const atRiskCustomers: CustomerRisk[] = []

        for (const [customerId, data] of customerMap.entries()) {
          const sorted = data.orders.slice().sort((a, b) => a.getTime() - b.getTime())
          const lastOrder = sorted[sorted.length - 1]
          const daysSinceLastPurchase = Math.floor((now - lastOrder.getTime()) / 86_400_000)

          let purchaseFrequency = daysSinceLastPurchase
          if (sorted.length >= 2) {
            const gaps: number[] = []
            for (let i = 1; i < sorted.length; i++) {
              gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / 86_400_000)
            }
            purchaseFrequency = gaps.reduce((s, g) => s + g, 0) / gaps.length
          }

          const churnProbability = Math.min(1, daysSinceLastPurchase / (purchaseFrequency * 2.5))
          const churnRiskScore = Math.round(churnProbability * 100)
          const avgOrderValueKobo = data.totalKobo / data.orders.length

          if (churnRiskScore >= 60) {
            atRiskCustomers.push({
              customerId,
              daysSinceLastPurchase,
              purchaseFrequency,
              churnProbability,
              churnRiskScore,
              avgOrderValueKobo,
            })
          }
        }

        creatorsScored++

        if (atRiskCustomers.length >= 3 && totalCustomers >= 5) {
          const avgDaysSilent = Math.round(
            atRiskCustomers.reduce((s, c) => s + c.daysSinceLastPurchase, 0) / atRiskCustomers.length
          )
          const avgOrderValueKobo =
            atRiskCustomers.reduce((s, c) => s + c.avgOrderValueKobo, 0) / atRiskCustomers.length
          const estimatedRevenueLossKobo = Math.round(atRiskCustomers.length * avgOrderValueKobo)

          const recommendedAction =
            avgDaysSilent > 30 ? "whatsapp_reach_out" :
            avgDaysSilent > 14 ? "discount_offer" :
            "new_product_alert"

          await emitEvent("customer_retention_recovery_needed", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            creatorId,
            customersAtRisk: atRiskCustomers.length,
            avgDaysSilent,
            estimatedRevenueLossKobo,
            recommendedAction,
            snapshotDate: today,
          }, `retention_recovery:${creatorId}:${today}`)
          eventsEmitted++
          signals.push(`recovery_needed:${creatorId}:${atRiskCustomers.length}at_risk`)
        }

        const highRiskCustomers = atRiskCustomers
          .filter(c => c.churnRiskScore >= 70)
          .slice(0, 3)

        for (const customer of highRiskCustomers) {
          await emitEvent("customer_churn_risk", {
            tenantId: creatorId, creatorId, correlationId,
          }, {
            customerId: customer.customerId,
            creatorId,
            churnRiskScore: customer.churnRiskScore,
            daysSinceLastPurchase: customer.daysSinceLastPurchase,
            purchaseFrequency: customer.purchaseFrequency,
            churnProbability: customer.churnProbability,
            snapshotDate: today,
          }, `churn_risk:${creatorId}:${customer.customerId}:${today}`)
          eventsEmitted++
        }
      } catch (_err) {
        // Individual creator failures are non-fatal
      }
    }

    logger.info("[customer-retention] engine complete", { creatorsScored, eventsEmitted, correlationId })
  } catch (err) {
    logger.error("[customer-retention] engine failed", { error: String(err) })
  }

  return {
    module: "customer-retention",
    eventsEmitted,
    alertsRaised: eventsEmitted,
    durationMs: Date.now() - start,
    signals,
    creatorsScored,
  }
}
