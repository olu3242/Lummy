import { createAdminClient } from "@/lib/supabase/server"

export interface JourneyStageCount {
  stage: string
  count: number
  description: string
}

export interface JourneyTransitionGap {
  from: string
  to: string
  droppedCount: number  // reached `from` but not `to`
  dropRate: number
}

export interface CreatorJourneyReport {
  generatedAt: string
  score: number
  stages: JourneyStageCount[]
  gaps: JourneyTransitionGap[]
  medianDaysOnboarding: number | null
  creatorsStuckOnboarding: number  // signed up >7d ago, no products
  fullyActivated: number           // published + products + WhatsApp
  issues: string[]
  recommendations: string[]
}

export async function runCreatorJourneyAudit(): Promise<CreatorJourneyReport> {
  const supabase = createAdminClient()
  const issues: string[] = []
  const recommendations: string[] = []

  const staleThreshold = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [profilesRes, productsRes, ordersRes] = await Promise.allSettled([
    supabase
      .from("creator_profiles")
      .select("id, is_published, is_active, whatsapp_number, first_product_added_at, first_sale_at, created_at"),
    supabase
      .from("products")
      .select("creator_id", { count: "exact" }),
    supabase
      .from("orders")
      .select("creator_id", { count: "exact", head: true })
      .not("creator_id", "is", null),
  ])

  const profiles = (profilesRes.status === "fulfilled" ? profilesRes.value.data ?? [] : []) as Array<{
    id: string
    is_published: boolean
    is_active: boolean
    whatsapp_number: string | null
    first_product_added_at: string | null
    first_sale_at: string | null
    created_at: string
  }>

  // Compute stage counts
  const total = profiles.length
  const hasWhatsApp = profiles.filter(p => !!p.whatsapp_number).length
  const published = profiles.filter(p => p.is_published).length
  const hasFirstProduct = profiles.filter(p => !!p.first_product_added_at).length
  const hasFirstSale = profiles.filter(p => !!p.first_sale_at).length
  const fullyActivated = profiles.filter(p => p.is_published && !!p.whatsapp_number && !!p.first_product_added_at).length

  const creatorsStuckOnboarding = profiles.filter(p =>
    !p.first_product_added_at && new Date(p.created_at) < new Date(staleThreshold)
  ).length

  const stages: JourneyStageCount[] = [
    { stage: "signed_up", count: total, description: "Creator accounts created" },
    { stage: "whatsapp_added", count: hasWhatsApp, description: "WhatsApp number configured" },
    { stage: "product_added", count: hasFirstProduct, description: "At least one product added" },
    { stage: "storefront_published", count: published, description: "Storefront live" },
    { stage: "first_sale", count: hasFirstSale, description: "First sale completed" },
    { stage: "fully_activated", count: fullyActivated, description: "Published + WhatsApp + Product" },
  ]

  const gaps: JourneyTransitionGap[] = []
  for (let i = 0; i < stages.length - 1; i++) {
    const from = stages[i]
    const to = stages[i + 1]
    if (from.count > 0) {
      const droppedCount = from.count - to.count
      const dropRate = Math.round(droppedCount / from.count * 100)
      if (dropRate > 40) {
        gaps.push({ from: from.stage, to: to.stage, droppedCount, dropRate })
      }
    }
  }

  if (creatorsStuckOnboarding > 0) issues.push(`${creatorsStuckOnboarding} creators signed up >7d ago with no products`)
  if (gaps.length > 0) recommendations.push(`High drop at: ${gaps.map(g => `${g.from}→${g.to} (${g.dropRate}%)`).join(", ")}`)

  const activationRate = total > 0 ? Math.round(fullyActivated / total * 100) : 0
  const score = Math.max(0, activationRate - (creatorsStuckOnboarding > 10 ? 10 : 0))

  return {
    generatedAt: new Date().toISOString(),
    score: Math.min(100, score),
    stages,
    gaps,
    medianDaysOnboarding: null,  // would require percentile query — skip for perf
    creatorsStuckOnboarding,
    fullyActivated,
    issues,
    recommendations,
  }
}
