import { createAdminClient } from "@/lib/supabase/server"

export interface TransactionAudit {
  id: string
  orderId: string
  creatorId: string
  amount: number
  currency: string
  status: string
  paystackRef: string | null
  idempotencyKey: string | null
  webhookEventId: string | null
  createdAt: string
  flags: string[]
}

export async function auditRecentTransactions(limit = 50): Promise<TransactionAudit[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("transactions")
    .select("id, order_id, creator_id, amount, currency, status, paystack_reference, idempotency_key, webhook_event_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!data) return []

  return (data as Record<string, unknown>[]).map(row => {
    const flags: string[] = []
    if (!row.idempotency_key) flags.push("missing_idempotency_key")
    if (!row.webhook_event_id) flags.push("no_webhook_event_linked")
    if (row.status === "pending" &&
        new Date(row.created_at as string) < new Date(Date.now() - 30 * 60_000)) {
      flags.push("stale_pending")
    }

    return {
      id: row.id as string,
      orderId: row.order_id as string,
      creatorId: row.creator_id as string,
      amount: row.amount as number,
      currency: row.currency as string,
      status: row.status as string,
      paystackRef: row.paystack_reference as string | null,
      idempotencyKey: row.idempotency_key as string | null,
      webhookEventId: row.webhook_event_id as string | null,
      createdAt: row.created_at as string,
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
    .from("transactions")
    .select("status, created_at, idempotency_key")
    .gte("created_at", sinceDate)

  if (!data) return { total: 0, paid: 0, pending: 0, failed: 0, successRate: 0, stalePending: 0, flaggedCount: 0 }

  const rows = data as { status: string; created_at: string; idempotency_key: string | null }[]
  const paid = rows.filter(r => r.status === "paid").length
  const pending = rows.filter(r => r.status === "pending").length
  const failed = rows.filter(r => r.status === "failed").length
  const now = Date.now()
  const stalePending = rows.filter(r =>
    r.status === "pending" && new Date(r.created_at) < new Date(now - 30 * 60_000)
  ).length
  const flaggedCount = rows.filter(r => !r.idempotency_key).length

  return {
    total: rows.length,
    paid,
    pending,
    failed,
    successRate: rows.length > 0 ? Math.round(paid / rows.length * 100) : 0,
    stalePending,
    flaggedCount,
  }
}

export async function detectDuplicateTransactions(): Promise<{ ref: string; count: number }[]> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const { data } = await supabase
    .from("transactions")
    .select("paystack_reference")
    .gte("created_at", since)
    .not("paystack_reference", "is", null)

  if (!data) return []

  const counts = new Map<string, number>()
  for (const row of data as { paystack_reference: string }[]) {
    counts.set(row.paystack_reference, (counts.get(row.paystack_reference) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([ref, count]) => ({ ref, count }))
}
