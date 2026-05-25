import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import type { AutomationEventName } from "./events"
import { recordMilestone } from "@/lib/growth/scoring"
import { sendCreatorWelcome } from "@/lib/automation/sdk"
import { isEnabled } from "@/lib/flags/feature-flags"

interface HandlerContext {
  creatorId:     string
  payload:       Record<string, unknown>
  eventId:       string
  correlationId: string | undefined
  workflowId:    string | undefined
}

async function notify(userId: string, title: string, body: string, actionUrl?: string) {
  const supabase = createAdminClient()
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    body,
    action_url: actionUrl ?? null,
    channel: "in_app",
  })
}

async function resolveUserId(creatorId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("creator_profiles")
    .select("user_id")
    .eq("id", creatorId)
    .maybeSingle()
  return (data as { user_id: string } | null)?.user_id ?? null
}

const HANDLERS: Record<AutomationEventName, (ctx: HandlerContext) => Promise<void>> = {
  onboarding_completed: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (userId) {
      await notify(userId,
        "Welcome to Lummy! 🎉",
        "Your store is set up. Add your first product and go live to start selling.",
        "/dashboard/products"
      )
    }
    await recordMilestone(creatorId, "onboarding_completed")

    // OB-01: welcome email + WhatsApp when flag is enabled
    const welcomeEnabled = await isEnabled("creator_welcome_email", creatorId)
    if (welcomeEnabled) {
      const email      = payload.creatorEmail   as string | undefined
      const phone      = payload.creatorPhone   as string | undefined
      const name       = payload.creatorName    as string | undefined
      const handle     = payload.storeHandle    as string | undefined
      const storeName  = payload.storeName      as string | undefined
      const tenantId   = payload.tenantId       as string | undefined

      if (email && name && handle) {
        const result = await sendCreatorWelcome({
          creatorEmail: email,
          creatorPhone: phone,
          creatorName:  name,
          storeHandle:  handle,
          storeName:    storeName ?? name,
          ctx: { tenantId: tenantId ?? creatorId, creatorId },
        })
        logger.info("[automation] OB-01 welcome sent", {
          creatorId,
          email: result.email.ok,
          whatsapp: result.whatsapp.ok,
        })
      }
    }
  },

  storefront_published: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const handle = (payload.handle as string | undefined) ?? ""
    await notify(userId,
      "Your store is live! 🚀",
      `lummy.co/${handle} is now public. Share it with your audience!`,
      "/dashboard/store"
    )
    await recordMilestone(creatorId, "storefront_published")
  },

  first_sale_completed: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const amount = payload.amountKobo as number | undefined
    const formatted = amount
      ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount / 100)
      : "your first sale"
    await notify(userId,
      "First sale! You did it! 🎊",
      `${formatted} just landed. You're officially a Lummy seller!`,
      "/dashboard/orders"
    )
    await recordMilestone(creatorId, "first_sale_completed")
  },

  product_created: async ({ creatorId }) => {
    await recordMilestone(creatorId, "first_product_created")
  },

  order_created: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const orderNumber = payload.orderNumber as string | undefined
    await notify(userId,
      "New order! 🛍️",
      `Order${orderNumber ? ` #${orderNumber}` : ""} received. Check your orders dashboard.`,
      "/dashboard/orders"
    )
  },

  payment_received: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const amount = payload.amountKobo as number | undefined
    const formatted = amount
      ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount / 100)
      : "Payment"
    await notify(userId,
      `${formatted} received! 💰`,
      "Payment confirmed. Your earnings are queued for the next payout.",
      "/dashboard/payouts"
    )
  },

  creator_inactive_7d: async ({ creatorId }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "Your store misses you 👀",
      "You haven't visited in a week. Add a product or share your store link to drive traffic.",
      "/dashboard"
    )
  },

  creator_inactive_30d: async ({ creatorId }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "Don't let your store go cold ❄️",
      "It's been 30 days. A fresh product post or WhatsApp blast can revive your sales.",
      "/dashboard/products"
    )
  },

  ai_generation_completed: async () => { /* no-op — tracking only */ },
  storefront_unpublished: async () => { /* no-op — state change tracked elsewhere */ },
  store_schema_updated: async () => { /* no-op — triggers live preview refresh if needed */ },
  weekly_digest_requested: async ({ creatorId }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "Your weekly performance digest is ready 📊",
      "Check your store analytics for this week's highlights.",
      "/dashboard/analytics"
    )
  },
  low_product_count: async ({ creatorId }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "Add more products 📦",
      "Stores with 5+ products get 3× more WhatsApp inquiries. Add more today!",
      "/dashboard/products"
    )
  },
  whatsapp_message_received: async () => { /* handled by webhook */ },

  payment_failed: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const orderRef = payload.orderReference as string | undefined
    await notify(userId,
      "Payment failed ⚠️",
      `Payment${orderRef ? ` for order #${orderRef}` : ""} was unsuccessful. The customer may retry.`,
      "/dashboard/orders"
    )
  },

  payment_timeout: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const orderRef = payload.orderReference as string | undefined
    await notify(userId,
      "Payment timed out ⏱",
      `Payment${orderRef ? ` for order #${orderRef}` : ""} expired without completion.`,
      "/dashboard/orders"
    )
  },

  checkout_started: async () => { /* analytics only — no action needed */ },

  checkout_abandoned: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const productName = payload.productName as string | undefined
    await notify(userId,
      "Abandoned checkout 🛒",
      `A customer started checkout${productName ? ` for "${productName}"` : ""} but didn't complete it.`,
      "/dashboard/orders"
    )
  },

  lead_scored: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const score = payload.score as number | undefined
    const phone = payload.phone as string | undefined
    if (score && score >= 80) {
      await notify(userId,
        "High-intent lead detected 🔥",
        `A lead${phone ? ` (${phone})` : ""} scored ${score}/100 — reach out now while they're warm.`,
        "/dashboard/customers"
      )
    }
  },

  // ── Intelligence events ────────────────────────────────────────────────────

  creator_health_degraded: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const drop = payload.dropPct as number | undefined
    await notify(userId,
      "Your store health score dropped",
      `Your store health${drop ? ` dropped ${drop.toFixed(0)}%` : " declined"}. Add products and stay active to recover your score.`,
      "/dashboard"
    )
  },

  creator_revenue_drop: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const dropPct = payload.dropPct as number | undefined
    await notify(userId,
      "Revenue is down this month",
      `Revenue dropped ${dropPct ? `${dropPct.toFixed(0)}%` : "significantly"} compared to last month. Try a WhatsApp promotion to re-engage customers.`,
      "/dashboard/analytics"
    )
  },

  creator_revenue_forecast_updated: async () => { /* forecast surfaced in dashboard — no notification */ },

  creator_growth_detected: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const growthPct = payload.growthPct as number | undefined
    await notify(userId,
      "Your store is growing fast! 🚀",
      `Revenue grew ${growthPct ? `${growthPct.toFixed(0)}%` : "significantly"} this month. Keep the momentum — now is the time to add new products.`,
      "/dashboard/analytics"
    )
  },

  creator_churn_risk: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const action = payload.recommendedAction as string | undefined
    await notify(userId,
      "Your store needs attention",
      action ?? "Your store activity is low. Adding products and engaging customers will help you grow.",
      "/dashboard"
    )
  },

  creator_engagement_drop: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const dropPct = payload.dropPct as number | undefined
    await notify(userId,
      "Store engagement is down",
      `Store traffic dropped ${dropPct ? `${dropPct.toFixed(0)}%` : ""} this week. Try sharing your store link on WhatsApp or Instagram.`,
      "/dashboard/analytics"
    )
  },

  customer_high_value: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const orderCount = payload.orderCount as number | undefined
    await notify(userId,
      "You have a loyal customer! ⭐",
      `A customer has placed ${orderCount ?? "multiple"} orders with you. Consider offering them a VIP discount to keep them coming back.`,
      "/dashboard/customers"
    )
  },

  customer_reengagement_needed: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const days = payload.silentDays as number | undefined
    await notify(userId,
      "A past customer is drifting away",
      `A customer who bought from you hasn't returned in ${days ?? 21}+ days. Send them a WhatsApp message with a new product or offer.`,
      "/dashboard/customers"
    )
  },

  workflow_retry_spike: async () => {
    // Internal ops alert — logged by the intelligence job, no creator notification
    logger.warn("[handler] workflow_retry_spike event received")
  },

  workflow_at_risk: async () => {
    logger.warn("[handler] workflow_at_risk event received")
  },

  ai_cost_spike: async () => {
    logger.warn("[handler] ai_cost_spike event received — review ai_cost_events table")
  },

  ai_budget_risk: async ({ payload }) => {
    const usedPct = payload.usedPct as number | undefined
    const orgId = payload.organizationId as string | undefined
    logger.warn("[handler] ai_budget_risk", { usedPct, orgId })
  },

  recommendation_generated: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const priority = payload.priority as string | undefined
    if (priority === "critical" || priority === "high") {
      await notify(userId,
        "New recommendation for your store",
        (payload.title as string | undefined) ?? "Check your recommendations for actionable tips.",
        "/dashboard"
      )
    }
    // medium/low priority recommendations surface in dashboard only — no push notification
  },
}

export async function processAutomationEvent(
  eventId: string,
  eventName: AutomationEventName,
  creatorId: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const handler = HANDLERS[eventName]
  if (!handler) {
    logger.warn("[automation] no handler for event", { eventName })
    return { ok: true } // not an error — unregistered events are silently skipped
  }

  const correlationId = payload.correlationId as string | undefined
  const workflowId    = payload.workflowId    as string | undefined

  try {
    await handler({ creatorId, payload, eventId, correlationId, workflowId })
    return { ok: true }
  } catch (err) {
    logger.error("[automation] handler failed", {
      eventName,
      creatorId,
      correlationId,
      workflowId,
      error: String(err),
    })
    return { ok: false, error: String(err) }
  }
}
