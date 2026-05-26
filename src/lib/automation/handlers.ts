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

  // ── Coordination events ──────────────────────────────────────────────────

  creator_monetization_opportunity: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const title    = payload.title as string | undefined
    const oppType  = payload.opportunityType as string | undefined
    const estKobo  = payload.estimatedRevenueKobo as number | undefined
    const estNGN   = estKobo != null ? `₦${(estKobo / 100).toLocaleString()}` : null
    await notify(userId,
      "💰 Revenue opportunity detected",
      `${title ?? "You have a monetization opportunity"}${estNGN ? ` — estimated ${estNGN}` : ""}`,
      "/dashboard/analytics"
    )
    logger.info("[handler] creator_monetization_opportunity", { creatorId, oppType })
  },

  creator_high_influence_detected: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "🌟 You're a top creator!",
      "Your store is in the top tier of Lummy creators. Keep it up — your influence is growing.",
      "/dashboard"
    )
    logger.info("[handler] creator_high_influence_detected", { creatorId, orderCount: payload.orderCount })
  },

  workflow_priority_elevated: async ({ payload }) => {
    // Internal ops event — logs escalation for SLA monitoring; no creator notification
    logger.info("[handler] workflow_priority_elevated", {
      originalEventId: payload.originalEventId,
      eventName:       payload.eventName,
      reason:          payload.reason,
      toPriority:      payload.toPriority,
    })
  },

  // ── Marketplace events ───────────────────────────────────────────────────

  marketplace_health_updated: async ({ payload }) => {
    // Platform-level health snapshot — ops-only, no creator notification
    const score = payload.overallScore as number | undefined
    logger.info("[handler] marketplace_health_updated", { overallScore: score, riskSignals: payload.riskSignals })
  },

  marketplace_conversion_drop: async ({ payload }) => {
    const dropPct = payload.dropPercent as number | undefined
    logger.warn("[handler] marketplace_conversion_drop", {
      currentRate: payload.currentRate,
      previousRate: payload.previousRate,
      dropPercent: dropPct,
      affectedCreators: payload.affectedCreators,
    })
  },

  storefront_performance_risk: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const riskType = payload.riskType as string | undefined
    const metric   = payload.metric as string | undefined
    const message  = riskType === "low_conversion"
      ? `Your storefront conversion is below average. ${metric ?? "Try improving your WhatsApp CTA button."}`
      : riskType === "inactive"
        ? "Your store has had no recent sales. Add new products or update your storefront to re-engage customers."
        : `Your store may need attention: ${metric ?? "check your dashboard for details."}`
    await notify(userId,
      "Your store needs attention",
      message,
      "/dashboard/store"
    )
    logger.info("[handler] storefront_performance_risk", { creatorId, riskType })
  },

  creator_repeat_customer_growth: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const repeatRate = payload.repeatRate as number | undefined
    await notify(userId,
      "🔄 Repeat customers growing!",
      `${(repeatRate ?? 0).toFixed(0)}% of your recent orders are from returning customers. Keep nurturing those relationships!`,
      "/dashboard/customers"
    )
    logger.info("[handler] creator_repeat_customer_growth", { creatorId, repeatRate })
  },

  // ── Ecosystem events ─────────────────────────────────────────────────────

  ecosystem_revenue_growth: async ({ payload }) => {
    // Platform signal — ops/analytics only, no creator notification
    const growthRate = payload.growthRate as number | undefined
    logger.info("[handler] ecosystem_revenue_growth", {
      growthRate:    growthRate != null ? `${(growthRate * 100).toFixed(1)}%` : "n/a",
      activeCreators: payload.activeCreators,
      newCreators:    payload.newCreators,
    })
  },

  ecosystem_retention_risk: async ({ payload }) => {
    const retentionRate = payload.platformRetentionRate as number | undefined
    const critical      = payload.criticalThreshold as boolean | undefined
    logger.warn("[handler] ecosystem_retention_risk", {
      retentionRate,
      critical,
      churnRiskCount: payload.churnRiskCreatorCount,
    })
  },

  // ── Trust intelligence handlers ──────────────────────────────────────

  creator_trust_improved: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const newScore = payload.newScore as number | undefined
    const tier = newScore != null
      ? newScore >= 80 ? "verified" : newScore >= 60 ? "trusted" : "standard"
      : "standard"
    await notify(userId,
      "Your trust score improved! ⬆️",
      `Your store trust score is now ${newScore ?? "higher"}. ${tier === "verified" ? "You've reached Verified status!" : "Keep it up!"}`,
      "/dashboard"
    )
  },

  creator_trust_degraded: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "Your store trust score dropped",
      `Your trust score fell by ${payload.degradation ?? 0} points. ${(payload.primaryReason as string | undefined)?.replace(/_/g, " ") ?? "Review your recent orders and fulfillment."} `,
      "/dashboard/orders"
    )
    logger.warn("[handler] creator_trust_degraded", { creatorId, degradation: payload.degradation })
  },

  creator_high_reliability: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "🏆 You're a top reliable seller!",
      `Your store has a reputation score of ${payload.reputationScore ?? "excellent"}. Customers trust you — keep delivering great experiences.`,
      "/dashboard"
    )
  },

  creator_dispute_risk: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const level = payload.riskLevel as string | undefined
    if (level === "high" || level === "critical") {
      await notify(userId,
        "⚠️ Dispute rate alert",
        `Your dispute rate is ${((payload.disputeRate as number ?? 0) * 100).toFixed(0)}% over the last 30 days. Review your order fulfillment and consider proactive customer communication.`,
        "/dashboard/orders"
      )
    }
    logger.warn("[handler] creator_dispute_risk", { creatorId, riskLevel: level })
  },

  creator_reputation_drop: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "Your store reputation is declining",
      `Your reputation score has dropped. Consistent fulfillment and quick responses will help rebuild it.`,
      "/dashboard/orders"
    )
    logger.warn("[handler] creator_reputation_drop", { creatorId, score: payload.reputationScore })
  },

  creator_network_growth_detected: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "🌐 Your network is growing!",
      `You've referred ${payload.referralCount ?? "multiple"} new creators to Lummy. Your network influence is building.`,
      "/dashboard"
    )
  },

  creator_collaboration_opportunity: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const niche = payload.niche as string | undefined
    await notify(userId,
      "🤝 Collaboration opportunity",
      `There's a creator in your ${niche ?? "niche"} you could collaborate with for cross-promotion. Reach out to grow both audiences!`,
      "/dashboard"
    )
  },

  creator_fulfillment_risk: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "⚠️ Fulfillment needs attention",
      `Your fulfillment rate is ${((payload.fulfillmentRate as number ?? 0)).toFixed(0)}%. Respond to pending orders promptly to maintain buyer trust.`,
      "/dashboard/orders"
    )
    logger.warn("[handler] creator_fulfillment_risk", { creatorId, fulfillmentRate: payload.fulfillmentRate })
  },

  customer_trust_risk: async ({ payload }) => {
    // Internal ops signal — logged only
    logger.warn("[handler] customer_trust_risk", {
      creatorId: payload.creatorId,
      riskScore: payload.riskScore,
      signals:   payload.riskSignals,
    })
  },

  customer_fraud_risk: async ({ payload }) => {
    logger.warn("[handler] customer_fraud_risk detected", {
      creatorId:         payload.creatorId,
      riskScore:         payload.riskScore,
      fraudSignals:      payload.fraudSignals,
      recommendedAction: payload.recommendedAction,
    })
  },

  suspicious_checkout_detected: async ({ payload }) => {
    logger.warn("[handler] suspicious_checkout_detected", {
      creatorId:   payload.creatorId,
      anomalyType: payload.anomalyType,
      signals:     payload.signals,
    })
  },

  dispute_spike_detected: async ({ payload }) => {
    logger.warn("[handler] dispute_spike_detected — platform-wide", {
      disputeCount7d:      payload.disputeCount7d,
      disputeCountPrior7d: payload.disputeCountPrior7d,
      spikePercent:        payload.spikePercent,
    })
  },

  marketplace_integrity_risk: async ({ payload }) => {
    logger.warn("[handler] marketplace_integrity_risk", {
      overallIntegrityScore: payload.overallIntegrityScore,
      highRiskCreators:      payload.highRiskCreators,
      fraudSignals:          payload.fraudSignals,
    })
  },

  marketplace_trust_degradation: async ({ payload }) => {
    logger.warn("[handler] marketplace_trust_degradation", {
      previousScore: payload.previousScore,
      currentScore:  payload.currentScore,
      degradation:   payload.degradation,
    })
  },

  // ── Discovery intelligence handlers ──────────────────────────────────

  creator_trending: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const driver = (payload.trendDriver as string | undefined)?.replace(/_/g, " ") ?? "traffic spike"
    await notify(userId,
      "🔥 You're trending!",
      `Your store is getting a ${driver} this week! ${payload.views7d ?? ""} visits in 7 days — make sure your WhatsApp is ready.`,
      "/dashboard/analytics"
    )
    logger.info("[handler] creator_trending", { creatorId, trendScore: payload.trendScore })
  },

  creator_discovery_boost: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "📈 Discovery opportunity",
      `Your store converts well but isn't getting enough visitors. Small improvements to your WhatsApp CTA could boost reach by ${payload.estimatedReachBoost ?? 0}%.`,
      "/dashboard/store"
    )
  },

  storefront_discovery_accelerated: async ({ payload }) => {
    // Discovery signal — ops/analytics only
    logger.info("[handler] storefront_discovery_accelerated", {
      creatorId:       payload.creatorId,
      handle:          payload.storefrontHandle,
      visibilityScore: payload.visibilityScore,
    })
  },

  storefront_recommendation_generated: async ({ payload }) => {
    logger.info("[handler] storefront_recommendation_generated", {
      creatorId:          payload.creatorId,
      recommendationType: payload.recommendationType,
      confidence:         payload.confidence,
    })
  },

  customer_match_high_confidence: async ({ payload }) => {
    logger.info("[handler] customer_match_high_confidence", {
      creatorId:  payload.creatorId,
      matchScore: payload.matchScore,
      signals:    payload.matchSignals,
    })
  },

  customer_discovery_accelerated: async ({ payload }) => {
    logger.info("[handler] customer_discovery_accelerated", {
      creatorId:       payload.creatorId,
      discoveryType:   payload.discoveryType,
      customersMatched: payload.customersMatched,
    })
  },

  customer_referral_detected: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "👥 Referral activity detected!",
      `${payload.referralCount ?? 1} customer(s) referred new buyers to your store this week. Your word-of-mouth is working!`,
      "/dashboard/customers"
    )
  },

  customer_loyalty_accelerated: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    await notify(userId,
      "❤️ Loyal customer base growing!",
      `${payload.loyalCustomers ?? 0} loyal customers with ${((payload.avgRepeatRate as number ?? 0) * 100).toFixed(0)}% repeat rate. Consider a loyalty reward program!`,
      "/dashboard/customers"
    )
  },

  conversion_priority_high: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const priority = payload.priority as string | undefined
    if (priority === "high_intent_customer") {
      await notify(userId,
        "🎯 High-intent buyers right now!",
        `Customers are actively starting checkout. Make sure your WhatsApp is on and respond quickly — this window is ${payload.windowMinutes ?? 60} minutes.`,
        "/dashboard"
      )
    }
  },

  // ── Expansion event handlers ──────────────────────────────────────────

  creator_referral_opportunity: async ({ creatorId, payload }) => {
    const userId = await resolveUserId(creatorId)
    if (!userId) return
    const potential = payload.referralPotential as string | undefined
    if (potential === "high" || potential === "medium") {
      await notify(userId,
        "💌 Share your store with your customers",
        (payload.incentiveRecommendation as string | undefined) ?? "Ask your loyal customers to refer friends — it's your fastest growth lever.",
        "/dashboard/customers"
      )
    }
  },

  ecosystem_network_acceleration: async ({ payload }) => {
    logger.info("[handler] ecosystem_network_acceleration", {
      activeNodes:      payload.activeNodes,
      newConnections7d: payload.newConnections7d,
      signal:           payload.accelerationSignal,
    })
  },

  ecosystem_monetization_opportunity: async ({ payload }) => {
    logger.info("[handler] ecosystem_monetization_opportunity", {
      opportunityType:  payload.opportunityType,
      affectedCreators: payload.affectedCreators,
      estimatedRevenue: payload.estimatedRevenueKobo,
    })
  },

  category_high_growth: async ({ payload }) => {
    logger.info("[handler] category_high_growth", {
      category:    payload.category,
      growthRate:  payload.growthRate,
      creators:    payload.totalCreators,
      opportunity: payload.opportunityScore,
    })
  },

  ecosystem_expansion_opportunity: async ({ payload }) => {
    logger.info("[handler] ecosystem_expansion_opportunity", {
      opportunityType: payload.opportunityType,
      title:           payload.title,
      confidence:      payload.confidence,
    })
  },

  geography_expansion_opportunity: async ({ payload }) => {
    logger.info("[handler] geography_expansion_opportunity", {
      region:      payload.region,
      marketSize:  payload.marketSize,
      growthSignal: payload.growthSignal,
    })
  },

  creator_network_scaling: async ({ payload }) => {
    logger.info("[handler] creator_network_scaling", {
      networkSize:  payload.networkSize,
      growthRate7d: payload.growthRate7d,
    })
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
