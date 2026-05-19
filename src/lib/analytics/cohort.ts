import { createAdminClient } from "@/lib/supabase/server"

export interface CohortBehavior {
  cohortMonth: string
  signups: number
  onboardingCompleted: number
  publishedStore: number
  addedProduct: number
  madeFirstSale: number
  onboardingRate: number
  publishRate: number
  firstSaleRate: number
  medianDaysToFirstSale: number | null
}

export interface OnboardingHeatSummary {
  totalCreators: number
  completedOnboarding: number
  completionRate: number
  avgDaysToComplete: number | null
  dropOffPoints: Array<{ step: string; dropPct: number }>
}

export interface FrictionTrendReport {
  period: string
  avgDaysToFirstProduct: number | null
  avgDaysToPublish: number | null
  avgDaysToFirstSale: number | null
  publishedWithoutSale: number
  stuckInOnboarding: number
}

export async function getBetaCohortSummary(months = 6): Promise<CohortBehavior[]> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const { data } = await supabase
    .from("creator_profiles")
    .select("id, created_at, onboarding_completed, is_published, first_product_added_at, first_sale_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })

  const creators = (data as {
    id: string; created_at: string; onboarding_completed: boolean
    is_published: boolean; first_product_added_at: string | null; first_sale_at: string | null
  }[] | null) ?? []

  const buckets = new Map<string, typeof creators>()
  for (const c of creators) {
    const month = c.created_at.slice(0, 7)
    if (!buckets.has(month)) buckets.set(month, [])
    buckets.get(month)!.push(c)
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cohortMonth, cohort]) => {
      const onboardingCompleted = cohort.filter(c => c.onboarding_completed).length
      const publishedStore = cohort.filter(c => c.is_published).length
      const addedProduct = cohort.filter(c => c.first_product_added_at).length
      const madeFirstSale = cohort.filter(c => c.first_sale_at).length

      const firstSaleDays = cohort
        .filter(c => c.first_sale_at)
        .map(c => Math.floor((new Date(c.first_sale_at!).getTime() - new Date(c.created_at).getTime()) / 86_400_000))
        .sort((a, b) => a - b)

      const medianDaysToFirstSale = firstSaleDays.length > 0
        ? firstSaleDays[Math.floor(firstSaleDays.length / 2)]
        : null

      const n = cohort.length
      return {
        cohortMonth,
        signups: n,
        onboardingCompleted,
        publishedStore,
        addedProduct,
        madeFirstSale,
        onboardingRate: n > 0 ? Math.round(onboardingCompleted / n * 100) : 0,
        publishRate: n > 0 ? Math.round(publishedStore / n * 100) : 0,
        firstSaleRate: n > 0 ? Math.round(madeFirstSale / n * 100) : 0,
        medianDaysToFirstSale,
      }
    })
}

export async function getOnboardingHeatSummary(): Promise<OnboardingHeatSummary> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("creator_profiles")
    .select("id, onboarding_completed, is_published, first_product_added_at, whatsapp_number, avatar_url, bio, created_at")

  const creators = (data as {
    id: string; onboarding_completed: boolean; is_published: boolean
    first_product_added_at: string | null; whatsapp_number: string | null
    avatar_url: string | null; bio: string | null; created_at: string
  }[] | null) ?? []

  const total = creators.length
  const completed = creators.filter(c => c.onboarding_completed).length

  const completedWithDate = creators
    .filter(c => c.onboarding_completed)
    .map(c => Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000))

  const avgDaysToComplete = completedWithDate.length > 0
    ? Math.round(completedWithDate.reduce((s, d) => s + d, 0) / completedWithDate.length)
    : null

  // Funnel drop-off
  const hasProfile = creators.filter(c => c.avatar_url && c.bio).length
  const hasWhatsApp = creators.filter(c => c.whatsapp_number).length
  const hasProduct = creators.filter(c => c.first_product_added_at).length
  const hasPublished = creators.filter(c => c.is_published).length

  const dropOffPoints = total > 0 ? [
    { step: "Complete profile", dropPct: Math.round((1 - hasProfile / total) * 100) },
    { step: "Add WhatsApp", dropPct: Math.round((1 - hasWhatsApp / total) * 100) },
    { step: "Add first product", dropPct: Math.round((1 - hasProduct / total) * 100) },
    { step: "Publish store", dropPct: Math.round((1 - hasPublished / total) * 100) },
  ].sort((a, b) => b.dropPct - a.dropPct) : []

  return {
    totalCreators: total,
    completedOnboarding: completed,
    completionRate: total > 0 ? Math.round(completed / total * 100) : 0,
    avgDaysToComplete,
    dropOffPoints,
  }
}

export async function getFrictionTrendReport(): Promise<FrictionTrendReport> {
  const supabase = createAdminClient()
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data } = await supabase
    .from("creator_profiles")
    .select("created_at, first_product_added_at, is_published, first_sale_at, onboarding_completed")
    .gte("created_at", since30d)

  const creators = (data as {
    created_at: string; first_product_added_at: string | null
    is_published: boolean; first_sale_at: string | null; onboarding_completed: boolean
  }[] | null) ?? []

  const avg = (vals: number[]): number | null =>
    vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null

  const daysToProduct = creators
    .filter(c => c.first_product_added_at)
    .map(c => Math.max(0, Math.floor((new Date(c.first_product_added_at!).getTime() - new Date(c.created_at).getTime()) / 86_400_000)))

  const daysToFirstSale = creators
    .filter(c => c.first_sale_at)
    .map(c => Math.max(0, Math.floor((new Date(c.first_sale_at!).getTime() - new Date(c.created_at).getTime()) / 86_400_000)))

  return {
    period: "last_30d",
    avgDaysToFirstProduct: avg(daysToProduct),
    avgDaysToPublish: null,
    avgDaysToFirstSale: avg(daysToFirstSale),
    publishedWithoutSale: creators.filter(c => c.is_published && !c.first_sale_at).length,
    stuckInOnboarding: creators.filter(c => !c.onboarding_completed).length,
  }
}
