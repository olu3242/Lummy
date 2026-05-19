import { createAdminClient } from "@/lib/supabase/server"

export interface RetentionSignals {
  daysSinceLastLogin: number | null
  daysSinceLastOrder: number | null
  productCount: number
  isPublished: boolean
  hasWhatsApp: boolean
  hasCompletedOnboarding: boolean
  riskFlags: string[]
}

export async function getCreatorRetentionSignals(creatorId: string): Promise<RetentionSignals> {
  const supabase = createAdminClient()

  const [profileRes, productRes, orderRes] = await Promise.allSettled([
    supabase.from("creator_profiles")
      .select("is_published, whatsapp_number, onboarding_completed, updated_at")
      .eq("id", creatorId)
      .maybeSingle(),
    supabase.from("products")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("is_published", true),
    supabase.from("orders")
      .select("created_at")
      .eq("creator_id", creatorId)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(1),
  ])

  const profile = profileRes.status === "fulfilled"
    ? (profileRes.value.data as {
        is_published: boolean; whatsapp_number: string | null;
        onboarding_completed: boolean; updated_at: string
      } | null)
    : null

  const productCount = productRes.status === "fulfilled" ? (productRes.value.count ?? 0) : 0

  const lastOrder = orderRes.status === "fulfilled"
    ? (orderRes.value.data as { created_at: string }[] | null)?.[0]
    : null

  const now = Date.now()
  const daysSinceLastOrder = lastOrder
    ? Math.floor((now - new Date(lastOrder.created_at).getTime()) / 86_400_000)
    : null

  const daysSinceUpdate = profile?.updated_at
    ? Math.floor((now - new Date(profile.updated_at).getTime()) / 86_400_000)
    : null

  const riskFlags: string[] = []
  if (!profile?.is_published) riskFlags.push("not_published")
  if (productCount === 0) riskFlags.push("no_products")
  if (!profile?.whatsapp_number) riskFlags.push("no_whatsapp")
  if (!profile?.onboarding_completed) riskFlags.push("onboarding_incomplete")
  if (daysSinceLastOrder !== null && daysSinceLastOrder > 30) riskFlags.push("no_recent_sales")
  if (daysSinceUpdate !== null && daysSinceUpdate > 14) riskFlags.push("inactive_14d")

  return {
    daysSinceLastLogin: daysSinceUpdate,
    daysSinceLastOrder,
    productCount,
    isPublished: profile?.is_published ?? false,
    hasWhatsApp: !!profile?.whatsapp_number,
    hasCompletedOnboarding: profile?.onboarding_completed ?? false,
    riskFlags,
  }
}

// Rule-based insight generator for creator dashboard
export function generateInsights(signals: RetentionSignals): string[] {
  const insights: string[] = []

  if (!signals.isPublished) {
    insights.push("Publish your store — buyers can't find you yet.")
  }
  if (signals.productCount === 0) {
    insights.push("Add your first product to start getting orders.")
  } else if (signals.productCount < 5) {
    insights.push(`You have ${signals.productCount} product${signals.productCount > 1 ? "s" : ""}. Stores with 5+ products convert 3× better.`)
  }
  if (!signals.hasWhatsApp) {
    insights.push("Connect your WhatsApp number so customers can reach you instantly.")
  }
  if (signals.daysSinceLastOrder !== null && signals.daysSinceLastOrder > 14) {
    insights.push("No recent sales — try sharing your store link on your Instagram Story.")
  }
  if (signals.isPublished && signals.productCount >= 3) {
    insights.push("Your store looks great! Share it on WhatsApp and Instagram to drive more traffic.")
  }

  return insights.slice(0, 3) // max 3 insights shown at once
}
