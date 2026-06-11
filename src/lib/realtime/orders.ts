import { createClient } from "@/lib/supabase/client"

export interface RealtimeOrder {
  id: string
  status: string
  total_amount: number
  currency: string
  customer_name: string | null
  created_at: string
}

type OrderCallback = (order: RealtimeOrder) => void

export function subscribeToOrders(creatorId: string, onNewOrder: OrderCallback): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel(`orders:creator:${creatorId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: `creator_id=eq.${creatorId}`,
      },
      (payload) => {
        if (payload.new && typeof payload.new === "object") {
          onNewOrder(payload.new as RealtimeOrder)
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `creator_id=eq.${creatorId}`,
      },
      (payload) => {
        if (payload.new && typeof payload.new === "object") {
          onNewOrder(payload.new as RealtimeOrder)
        }
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
