import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import type { RetentionSignals } from "@/lib/growth/retention"

export interface ActionRecommendation {
  id: string
  priority: "high" | "medium" | "low"
  category: "product" | "storefront" | "marketing" | "engagement" | "payment"
  title: string
  description: string
  ctaLabel: string
  ctaUrl: string
  estimatedImpact: string
}

export function getCreatorRecommendations(signals: RetentionSignals): ActionRecommendation[] {
  const recs: ActionRecommendation[] = []

  if (!signals.isPublished) {
    recs.push({
      id: "publish_store",
      priority: "high",
      category: "storefront",
      title: "Publish your store",
      description: "Buyers can't find you until your store is live. It takes 30 seconds.",
      ctaLabel: "Publish now",
      ctaUrl: "/dashboard/store",
      estimatedImpact: "3× more visibility",
    })
  }

  if (signals.productCount === 0) {
    recs.push({
      id: "add_first_product",
      priority: "high",
      category: "product",
      title: "Add your first product",
      description: "You need at least one product to start receiving orders.",
      ctaLabel: "Add product",
      ctaUrl: "/dashboard/products/new",
      estimatedImpact: "Required for sales",
    })
  } else if (signals.productCount < 3) {
    recs.push({
      id: "add_more_products",
      priority: "medium",
      category: "product",
      title: "Add more products",
      description: "Stores with 3+ products convert 2× better on average.",
      ctaLabel: "Add products",
      ctaUrl: "/dashboard/products/new",
      estimatedImpact: "2× conversion rate",
    })
  }

  if (!signals.hasWhatsApp) {
    recs.push({
      id: "add_whatsapp",
      priority: "high",
      category: "engagement",
      title: "Connect WhatsApp",
      description: "WhatsApp is the #1 checkout channel for African buyers.",
      ctaLabel: "Connect now",
      ctaUrl: "/dashboard/store",
      estimatedImpact: "Up to 40% more conversions",
    })
  }

  if (signals.isPublished && signals.productCount >= 1 &&
      signals.daysSinceLastOrder !== null && signals.daysSinceLastOrder > 7) {
    recs.push({
      id: "share_store",
      priority: "medium",
      category: "marketing",
      title: "Share your store link",
      description: "Post your store on Instagram Stories or WhatsApp Status to drive traffic.",
      ctaLabel: "Get share link",
      ctaUrl: "/dashboard/store",
      estimatedImpact: "2–5× more visitors",
    })
  }

  if (signals.riskFlags.includes("no_recent_sales") && signals.isPublished) {
    recs.push({
      id: "run_promo",
      priority: "medium",
      category: "marketing",
      title: "Try a limited-time offer",
      description: "A 10–20% discount for 48 hours can restart stalled sales momentum.",
      ctaLabel: "Create promo",
      ctaUrl: "/dashboard/products",
      estimatedImpact: "Restarts purchase intent",
    })
  }

  return recs
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    .slice(0, 4)
}

export async function saveRecommendationEvent(creatorId: string, count: number): Promise<void> {
  const supabase = createAdminClient()
  void Promise.resolve(
    supabase.from("automation_events").insert({
      creator_id: creatorId,
      event_name: "ai_generation_completed",
      processed: false,
      payload: { type: "recommendations", count },
      idempotency_key: `recs:${creatorId}:${new Date().toISOString().slice(0, 10)}`,
    })
  ).catch(() => {})
  logger.info("[ai/recommendations] event logged", { creatorId, count })
}
