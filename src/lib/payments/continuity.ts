import { createAdminClient } from "@/lib/supabase/server"
import { getPaymentHealthSummary, detectDuplicateTransactions, runPaymentReconciliation } from "./audit"

export interface PaymentContinuityReport {
  generatedAt: string
  score: number           // 0-100
  paystackConfigured: boolean
  last24h: {
    total: number
    paid: number
    failed: number
    stalePending: number
    successRate: number
    flaggedNoIdempotency: number
  }
  webhookCoverage: number // % of succeeded payments linked to a recorded webhook event
  duplicateRefs: number   // refs appearing >1 in last 7d
  reconciliationAnomalies: number // orders/payments out of sync (see reconciliation_alerts)
  issues: string[]
  recommendations: string[]
}

export async function runPaymentContinuityAudit(): Promise<PaymentContinuityReport> {
  const supabase = createAdminClient()
  const issues: string[] = []
  const recommendations: string[] = []

  const paystackConfigured = (process.env.PAYSTACK_SECRET_KEY ?? "").length > 0

  const [health, duplicates, anomalies] = await Promise.allSettled([
    getPaymentHealthSummary(),
    detectDuplicateTransactions(),
    runPaymentReconciliation(),
  ])

  const h = health.status === "fulfilled" ? health.value : null
  const dups = duplicates.status === "fulfilled" ? duplicates.value : []
  const anomalyList = anomalies.status === "fulfilled" ? anomalies.value : []

  // Webhook coverage: succeeded payments with a provider_event_id that has a
  // matching idempotency record in provider_webhook_events (the table the
  // real webhook handler writes to — see src/app/api/payments/webhook/route.ts).
  const { count: paidTotal } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("status", "succeeded")

  const { data: succeededEventIds } = await supabase
    .from("payments")
    .select("provider_event_id")
    .eq("status", "succeeded")
    .not("provider_event_id", "is", null)

  const eventIds = (succeededEventIds ?? []).map((r) => r.provider_event_id as string)
  const { count: linkedCount } = eventIds.length > 0
    ? await supabase.from("provider_webhook_events").select("id", { count: "exact", head: true }).in("idempotency_key", eventIds)
    : { count: 0 }

  const webhookCoverage = paidTotal && paidTotal > 0
    ? Math.round(((linkedCount ?? 0) / paidTotal) * 100)
    : 100

  if (!paystackConfigured) issues.push("PAYSTACK_SECRET_KEY not configured")
  if (h && h.stalePending > 0) issues.push(`${h.stalePending} payments stuck in pending >30min`)
  if (dups.length > 0) issues.push(`${dups.length} duplicate payment references detected in 7d`)
  if (anomalyList.length > 0) issues.push(`${anomalyList.length} order/payment reconciliation anomalies detected`)
  if (webhookCoverage < 90) recommendations.push(`Webhook coverage at ${webhookCoverage}% — verify PAYSTACK_SECRET_KEY/STRIPE_WEBHOOK_SECRET and webhook URL`)
  if (h && h.successRate < 80) recommendations.push(`Payment success rate ${h.successRate}% — review failure reasons`)
  if (h && h.flaggedCount > 0) recommendations.push(`${h.flaggedCount} payments missing a provider event id — upgrade webhook handler`)

  const score = Math.max(0, 100
    - (issues.length * 15)
    - (anomalyList.length > 0 ? 15 : 0)
    - (webhookCoverage < 90 ? 10 : 0)
  )

  return {
    generatedAt: new Date().toISOString(),
    score: Math.min(100, score),
    paystackConfigured,
    last24h: {
      total: h?.total ?? 0,
      paid: h?.paid ?? 0,
      failed: h?.failed ?? 0,
      stalePending: h?.stalePending ?? 0,
      successRate: h?.successRate ?? 0,
      flaggedNoIdempotency: h?.flaggedCount ?? 0,
    },
    webhookCoverage,
    duplicateRefs: dups.length,
    reconciliationAnomalies: anomalyList.length,
    issues,
    recommendations,
  }
}
