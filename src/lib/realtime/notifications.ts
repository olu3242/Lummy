import { createClient } from "@/lib/supabase/client"

export type NotificationType = "new_order" | "order_update" | "new_message" | "payment_received"

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  metadata: Record<string, unknown>
  read: boolean
  created_at: string
}

type NotificationCallback = (notification: AppNotification) => void

// Global singleton to prevent duplicate subscriptions across component tree
let activeChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null
let activeUserId: string | null = null

export function subscribeToNotifications(userId: string, onNotification: NotificationCallback): () => void {
  const supabase = createClient()

  // Reuse channel if same user
  if (activeUserId === userId && activeChannel) {
    return () => { /* caller already subscribed */ }
  }

  if (activeChannel) {
    void supabase.removeChannel(activeChannel)
    activeChannel = null
    activeUserId = null
  }

  const channel = supabase
    .channel(`notifications:user:${userId}`)
    .on("broadcast", { event: "notification" }, (payload) => {
      if (payload.payload && typeof payload.payload === "object") {
        onNotification(payload.payload as AppNotification)
      }
    })
    .subscribe()

  activeChannel = channel
  activeUserId = userId

  return () => {
    void supabase.removeChannel(channel)
    if (activeUserId === userId) {
      activeChannel = null
      activeUserId = null
    }
  }
}

export function unsubscribeAll(): void {
  if (activeChannel) {
    const supabase = createClient()
    void supabase.removeChannel(activeChannel)
    activeChannel = null
    activeUserId = null
  }
}
