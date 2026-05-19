import { createAdminClient } from "@/lib/supabase/server"
import { getPaymentHealthSummary, detectDuplicateTransactions } from "./audit"

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
  webhookCoverage: number // % of paid transactions linked to webhook events
  duplicateRefs: number   // refs appearing >1 in last 7d
  deadWebhooks: number
  failedWebhooks: number
  issues: string[]
  recommendations: string[]
}

export async function runPaymentContinuityAudit(): Promise<PaymentContinuityReport> {
  const supabase = createAdminClient()
  const issues: string[] = []
  const recommendations: string[] = []

  const paystackConfigured = (process.env.PAYSTACK_SECRET_KEY ?? "").length > 0

  const [health, duplicates, webhookStats] = await Promise.allSettled([
    getPaymentHealthSummary(),
    detectDuplicateTransactions(),
    supabase
      .from("webhook_events")
      .select("status", { count: "exact" })
      .in("status", ["failed", "dead"])
      .eq("source", "paystack"),
  ])

  const h = health.status === "fulfilled" ? health.value : null
  const dups = duplicates.status === "fulfilled" ? duplicates.value : []

  // Webhook coverage: paid transactions with webhook_event_id
  const { count: paidWithWebhook } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("status", "paid")
    .not("webhook_event_id", "is", null)

  const { count: paidTotal } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("status", "paid")

  const webhookCoverage = paidTotal && paidTotal > 0
    ? Math.round(((paidWithWebhook ?? 0) / paidTotal) * 100)
    : 100

  // Dead / failed webhook count
  const { count: deadWebhooks } = await supabase
    .from("webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "dead")

  const { count: failedWebhooks } = await supabase
    .from("webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")

  if (!paystackConfigured) issues.push("PAYSTACK_SECRET_KEY not configured")
  if (h && h.stalePending > 0) issues.push(`${h.stalePending} transactions stuck in pending >30min`)
  if (dups.length > 0) issues.push(`${dups.length} duplicate payment references detected in 7d`)
  if ((deadWebhooks ?? 0) > 0) issues.push(`${deadWebhooks} dead-lettered Paystack webhooks`)
  if (webhookCoverage < 90) recommendations.push(`Webhook coverage at ${webhookCoverage}% — verify PAYSTACK_SECRET_KEY and webhook URL`)
  if (h && h.successRate < 80) recommendations.push(`Payment success rate ${h.successRate}% — review failure reasons`)
  if (h && h.flaggedCount > 0) recommendations.push(`${h.flaggedCount} transactions missing idempotency keys — upgrade webhook handler`)

  const score = Math.max(0, 100
    - (issues.length * 15)
    - ((deadWebhooks ?? 0) > 0 ? 10 : 0)
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
    deadWebhooks: deadWebhooks ?? 0,
    failedWebhooks: failedWebhooks ?? 0,
    issues,
    recommendations,
  }
}
