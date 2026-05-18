import { createAdminClient } from "@/lib/supabase/server"

export interface CreatorAction {
  key: string
  title: string
  description: string
  ctaLabel: string
  ctaUrl: string
  priority: "urgent" | "high" | "medium" | "low"
  category: "setup" | "product" | "marketing" | "growth" | "ecosystem"
  impact: string
}

interface ProfileSignals {
  isPublished: boolean
  hasWhatsApp: boolean
  hasBio: boolean
  hasAvatar: boolean
  productCount: number
  hasFirstSale: boolean
  weeklyViews: number
  weeklyClicks: number
  hasReferral: boolean
  hasCollaboration: boolean
}

async function loadProfileSignals(creatorId: string): Promise<ProfileSignals> {
  const supabase = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0]

  const [profileRes, productsRes, metricsRes, referralRes, collabRes] = await Promise.allSettled([
    supabase.from("creator_profiles")
      .select("is_published, whatsapp_number, bio, avatar_url, first_sale_at")
      .eq("id", creatorId)
      .maybeSingle(),
    supabase.from("products")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("is_published", true),
    supabase.from("creator_metrics_daily")
      .select("storefront_views, whatsapp_clicks")
      .eq("creator_id", creatorId)
      .gte("date", since7d),
    supabase.from("creator_referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", creatorId),
    supabase.from("creator_collaborations")
      .select("id", { count: "exact", head: true })
      .or(`initiator_id.eq.${creatorId},partner_id.eq.${creatorId}`)
      .eq("status", "active"),
  ])

  const profile = profileRes.status === "fulfilled"
    ? (profileRes.value.data as {
        is_published: boolean; whatsapp_number: string | null
        bio: string | null; avatar_url: string | null; first_sale_at: string | null
      } | null)
    : null

  const metrics = metricsRes.status === "fulfilled"
    ? (metricsRes.value.data as { storefront_views: number; whatsapp_clicks: number }[] | null) ?? []
    : []

  return {
    isPublished:     profile?.is_published === true,
    hasWhatsApp:     !!profile?.whatsapp_number,
    hasBio:          !!profile?.bio,
    hasAvatar:       !!profile?.avatar_url,
    productCount:    productsRes.status === "fulfilled" ? (productsRes.value.count ?? 0) : 0,
    hasFirstSale:    !!profile?.first_sale_at,
    weeklyViews:     metrics.reduce((s, m) => s + (m.storefront_views ?? 0), 0),
    weeklyClicks:    metrics.reduce((s, m) => s + (m.whatsapp_clicks ?? 0), 0),
    hasReferral:     referralRes.status === "fulfilled" ? (referralRes.value.count ?? 0) > 0 : false,
    hasCollaboration: collabRes.status === "fulfilled" ? (collabRes.value.count ?? 0) > 0 : false,
  }
}

function generateActions(signals: ProfileSignals): CreatorAction[] {
  const actions: CreatorAction[] = []

  // Setup actions — blockers first
  if (!signals.isPublished) {
    actions.push({
      key: "publish_store",
      title: "Publish your store",
      description: "Buyers can't find you. Your store goes live in one tap.",
      ctaLabel: "Publish now",
      ctaUrl: "/dashboard/store",
      priority: "urgent",
      category: "setup",
      impact: "Required to receive orders",
    })
  }

  if (!signals.hasWhatsApp) {
    actions.push({
      key: "add_whatsapp",
      title: "Connect your WhatsApp",
      description: "Creators with WhatsApp get 3× more orders. Takes 30 seconds.",
      ctaLabel: "Add WhatsApp",
      ctaUrl: "/dashboard/settings",
      priority: "urgent",
      category: "setup",
      impact: "3× more orders",
    })
  }

  if (!signals.hasAvatar || !signals.hasBio) {
    actions.push({
      key: "complete_profile",
      title: "Complete your profile",
      description: "Add a photo and bio — buyers trust sellers with complete profiles.",
      ctaLabel: "Edit profile",
      ctaUrl: "/dashboard/settings",
      priority: "high",
      category: "setup",
      impact: "+20% conversion",
    })
  }

  // Product actions
  if (signals.productCount === 0) {
    actions.push({
      key: "add_first_product",
      title: "Add your first product",
      description: "You need at least one product to start selling.",
      ctaLabel: "Add product",
      ctaUrl: "/dashboard/products/new",
      priority: "urgent",
      category: "product",
      impact: "Required for sales",
    })
  } else if (signals.productCount < 3) {
    actions.push({
      key: "add_more_products",
      title: "Add more products",
      description: `You have ${signals.productCount} product${signals.productCount === 1 ? "" : "s"}. Stores with 3+ convert 2× better.`,
      ctaLabel: "Add products",
      ctaUrl: "/dashboard/products/new",
      priority: "high",
      category: "product",
      impact: "2× conversion",
    })
  }

  // Marketing actions
  if (signals.isPublished && signals.weeklyViews < 100) {
    actions.push({
      key: "share_store_link",
      title: "Share your store link today",
      description: "Post your storefront on Instagram Stories or WhatsApp Status — takes 1 minute.",
      ctaLabel: "Share link",
      ctaUrl: "/dashboard/store",
      priority: signals.hasFirstSale ? "medium" : "high",
      category: "marketing",
      impact: "+50–200 weekly views",
    })
  }

  if (signals.weeklyViews > 50 && signals.weeklyClicks < 3) {
    actions.push({
      key: "optimize_cta",
      title: "Improve your WhatsApp CTA",
      description: "You have views but few WhatsApp clicks. Try 'Order now via WhatsApp ⚡' as your CTA.",
      ctaLabel: "Get AI suggestions",
      ctaUrl: "/dashboard/ai",
      priority: "high",
      category: "marketing",
      impact: "2–5× click rate",
    })
  }

  // Ecosystem actions
  if (!signals.hasReferral && signals.isPublished) {
    actions.push({
      key: "get_referral_code",
      title: "Get your referral code",
      description: "Earn ₦500 for every creator you invite who makes their first sale.",
      ctaLabel: "Get code",
      ctaUrl: "/dashboard/referrals",
      priority: "medium",
      category: "ecosystem",
      impact: "₦500 per referral",
    })
  }

  if (!signals.hasCollaboration && signals.hasFirstSale) {
    actions.push({
      key: "start_collaboration",
      title: "Collaborate with another creator",
      description: "Cross-promote with a complementary creator to reach their audience.",
      ctaLabel: "Find partners",
      ctaUrl: "/dashboard/crm",
      priority: "low",
      category: "ecosystem",
      impact: "2× your reach",
    })
  }

  // Sort by priority
  const RANK = { urgent: 0, high: 1, medium: 2, low: 3 }
  return actions.sort((a, b) => RANK[a.priority] - RANK[b.priority])
}

export async function getCreatorActions(creatorId: string): Promise<{
  actions: CreatorAction[]
  completedKeys: Set<string>
  urgentCount: number
}> {
  const supabase = createAdminClient()

  const [signals, completedRes] = await Promise.all([
    loadProfileSignals(creatorId),
    supabase.from("creator_action_completions")
      .select("action_key")
      .eq("creator_id", creatorId),
  ])

  const completedKeys = new Set(
    (completedRes.data as { action_key: string }[] | null ?? []).map(r => r.action_key)
  )

  // Filter out completed setup/product actions — marketing/ecosystem stay visible
  const allActions = generateActions(signals)
  const actions = allActions.filter(a => {
    if (completedKeys.has(a.key)) return false
    // Re-verify completable actions against live state
    if (a.key === "publish_store" && signals.isPublished) return false
    if (a.key === "add_whatsapp" && signals.hasWhatsApp) return false
    if (a.key === "complete_profile" && signals.hasAvatar && signals.hasBio) return false
    if (a.key === "add_first_product" && signals.productCount > 0) return false
    return true
  })

  return {
    actions: actions.slice(0, 6),
    completedKeys,
    urgentCount: actions.filter(a => a.priority === "urgent").length,
  }
}

export async function completeAction(creatorId: string, actionKey: string): Promise<void> {
  const supabase = createAdminClient()
  void Promise.resolve(
    supabase.from("creator_action_completions")
      .upsert({ creator_id: creatorId, action_key: actionKey, completed_at: new Date().toISOString() })
  ).catch(() => {})
}

export async function getPlatformActionStats(): Promise<{
  totalCompletions: number
  topCompletedAction: string | null
  creatorsWithActions: number
}> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("creator_action_completions")
    .select("creator_id, action_key")

  const rows = (data as { creator_id: string; action_key: string }[] | null) ?? []
  const keyCounts = new Map<string, number>()
  for (const r of rows) keyCounts.set(r.action_key, (keyCounts.get(r.action_key) ?? 0) + 1)

  const topCompletedAction = Array.from(keyCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const creatorsWithActions = new Set(rows.map(r => r.creator_id)).size

  return { totalCompletions: rows.length, topCompletedAction, creatorsWithActions }
}
