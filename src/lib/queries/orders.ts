import { createClient } from "@/lib/supabase/server"

export interface OrderSummary {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  currency: string
  created_at: string
  notes: string | null
}

export async function getCreatorOrders(creatorId: string, limit = 20): Promise<OrderSummary[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total_amount, currency, created_at, notes")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[getCreatorOrders]", error.message)
    return []
  }
  return (data ?? []) as OrderSummary[]
}

export async function getOrderById(orderId: string, creatorId: string): Promise<OrderSummary | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total_amount, currency, created_at, notes, shipping_address")
    .eq("id", orderId)
    .eq("creator_id", creatorId)
    .maybeSingle()

  if (error) {
    console.error("[getOrderById]", error.message)
    return null
  }
  return data as OrderSummary | null
}

export async function updateOrderStatus(
  orderId: string,
  creatorId: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("creator_id", creatorId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
