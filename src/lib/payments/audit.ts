import { createAdminClient } from "@/lib/supabase/server"

// NOTE: this module previously queried `public.transactions`, a table from the
// original (001) schema that the live payment path (orders + payments,
// migration 040) never writes to — every call here was silently auditing an
// empty/stale table. Rewritten to read the tables the webhook handler
// (src/app/api/payments/webhook/route.ts) and order-repository.ts actually use.

export interface TransactionAudit {
  id: string
  orderId: string
  organizationId: string
  amount: number
  currency: string
  status: string
  providerReference: string | null
  providerEventId: string | null
  webhookEventLinked: boolean
  createdAt: string
  flags: string[]
}

export async function auditRecentTransactions(limit = 50): Promise<TransactionAudit[]> {
  const supabase = createAdminClient()

  const { data: payments } = await supabase
    .from("payments")
    .select("id, order_id, organization_id, amount, currency, status, provider, provider_reference, provider_event_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!payments || payments.length === 0) return []

  const eventIds = payments.map((p) => p.provider_event_id).filter((id): id is string => Boolean(id))
  const { data: webhookEvents } = eventIds.length > 0
    ? await supabase.from("provider_webhook_events").select("idempotency_key").in("idempotency_key", eventIds)
    : { data: [] as { idempotency_key: string }[] }
  const linkedEventIds = new Set((webhookEvents ?? []).map((e) => e.idempotency_key))

  return payments.map((row) => {
    const flags: string[] = []
    const webhookEventLinked = Boolean(row.provider_event_id) && linkedEventIds.has(row.provider_event_id as string)
    if (row.status === "succeeded" && !row.provider_event_id) flags.push("missing_idempotency_key")
    if (row.status === "succeeded" && !webhookEventLinked) flags.push("no_webhook_event_linked")
    if (row.status === "pending" && new Date(row.created_at) < new Date(Date.now() - 30 * 60_000)) {
      flags.push("stale_pending")
    }

    return {
      id: row.id,
      orderId: row.order_id,
      organizationId: row.organization_id,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      providerReference: row.provider_reference,
      providerEventId: row.provider_event_id,
      webhookEventLinked,
      createdAt: row.created_at,
      flags,
    }
  })
}

export interface PaymentHealthSummary {
  total: number
  paid: number
  pending: number
  failed: number
  successRate: number
  stalePending: number
  flaggedCount: number
}

export async function getPaymentHealthSummary(since?: Date): Promise<PaymentHealthSummary> {
  const supabase = createAdminClient()
  const sinceDate = (since ?? new Date(Date.now() - 24 * 60 * 60_000)).toISOString()

  const { data } = await supabase
    .from("payments")
    .select("status, created_at, provider_event_id")
    .gte("created_at", sinceDate)

  if (!data) return { total: 0, paid: 0, pending: 0, failed: 0, successRate: 0, stalePending: 0, flaggedCount: 0 }

  const rows = data as { status: string; created_at: string; provider_event_id: string | null }[]
  const paid = rows.filter((r) => r.status === "succeeded").length
  const pending = rows.filter((r) => r.status === "pending").length
  const failed = rows.filter((r) => r.status === "failed").length
  const now = Date.now()
  const stalePending = rows.filter((r) =>
    r.status === "pending" && new Date(r.created_at) < new Date(now - 30 * 60_000)
  ).length
  const flaggedCount = rows.filter((r) => r.status === "succeeded" && !r.provider_event_id).length

  return {
    total: rows.length,
    paid,
    pending,
    failed,
    successRate: rows.length > 0 ? Math.round((paid / rows.length) * 100) : 0,
    stalePending,
    flaggedCount,
  }
}

export async function detectDuplicateTransactions(): Promise<{ ref: string; count: number }[]> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const { data } = await supabase
    .from("payments")
    .select("provider, provider_reference")
    .gte("created_at", since)
    .not("provider_reference", "is", null)

  if (!data) return []

  const counts = new Map<string, number>()
  for (const row of data as { provider: string; provider_reference: string }[]) {
    const key = `${row.provider}:${row.provider_reference}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([ref, count]) => ({ ref, count }))
}

export interface ReconciliationAnomaly {
  type: "order_paid_without_payment" | "payment_succeeded_without_paid_order"
  orderId: string
  organizationId: string
  paymentId: string | null
  amount: number
  detail: string
}

// Order creation and payment creation are two separate inserts
// (order-repository.ts createPendingOrder / markPaymentCompleted) rather than
// one DB transaction, so they can diverge if either write fails partway
// through. This finds and persists the resulting anomalies so they're visible
// instead of silently leaking revenue.
export async function runPaymentReconciliation(organizationId?: string): Promise<ReconciliationAnomaly[]> {
  const supabase = createAdminClient()

  let ordersQuery = supabase.from("orders").select("id, organization_id, status, amount")
  let paymentsQuery = supabase.from("payments").select("id, order_id, organization_id, status, amount")
  if (organizationId) {
    ordersQuery = ordersQuery.eq("organization_id", organizationId)
    paymentsQuery = paymentsQuery.eq("organization_id", organizationId)
  }

  const [{ data: orders, error: ordersError }, { data: payments, error: paymentsError }] = await Promise.all([ordersQuery, paymentsQuery])
  if (ordersError) throw ordersError
  if (paymentsError) throw paymentsError

  const paymentsByOrder = new Map<string, { id: string; status: string; amount: number }[]>()
  for (const p of payments ?? []) {
    const list = paymentsByOrder.get(p.order_id) ?? []
    list.push({ id: p.id, status: p.status, amount: Number(p.amount) })
    paymentsByOrder.set(p.order_id, list)
  }

  const anomalies: ReconciliationAnomaly[] = []

  for (const order of orders ?? []) {
    const orderPayments = paymentsByOrder.get(order.id) ?? []
    const hasSucceededPayment = orderPayments.some((p) => p.status === "succeeded")
    if (order.status === "paid" && !hasSucceededPayment) {
      anomalies.push({
        type: "order_paid_without_payment",
        orderId: order.id,
        organizationId: order.organization_id,
        paymentId: null,
        amount: Number(order.amount),
        detail: "Order marked paid but no succeeded payment row exists for it.",
      })
    }
    for (const payment of orderPayments) {
      if (payment.status === "succeeded" && order.status !== "paid") {
        anomalies.push({
          type: "payment_succeeded_without_paid_order",
          orderId: order.id,
          organizationId: order.organization_id,
          paymentId: payment.id,
          amount: payment.amount,
          detail: `Payment ${payment.id} succeeded but parent order status is "${order.status}".`,
        })
      }
    }
  }

  if (anomalies.length > 0) {
    // Upsert on (organization_id, order_id, anomaly_type) so re-running
    // reconciliation refreshes existing alerts instead of piling up duplicate
    // rows for the same unresolved issue on every run.
    await supabase.from("reconciliation_alerts").upsert(
      anomalies.map((a) => ({
        organization_id: a.organizationId,
        order_id: a.orderId,
        payment_id: a.paymentId,
        anomaly_type: a.type,
        amount: a.amount,
        detail: a.detail,
        resolved_at: null,
      })),
      { onConflict: "organization_id,order_id,anomaly_type" }
    )
  }

  return anomalies
}
