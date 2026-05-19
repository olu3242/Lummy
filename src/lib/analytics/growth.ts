import { createAdminClient } from "@/lib/supabase/server"

export interface GrowthTrend {
  date: string
  newCreators: number
  newPublished: number
  newSales: number
  funnelEvents: number
}

export async function getGrowthTrend(days = 14): Promise<GrowthTrend[]> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const [creatorsRes, funnelRes] = await Promise.allSettled([
    supabase.from("creator_profiles")
      .select("created_at, storefront_published_at, first_sale_at")
      .gte("created_at", since),
    supabase.from("funnel_events")
      .select("event_name, occurred_at")
      .gte("occurred_at", since),
  ])

  // Build per-day buckets
  const buckets = new Map<string, GrowthTrend>()
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().split("T")[0]
    buckets.set(d, { date: d, newCreators: 0, newPublished: 0, newSales: 0, funnelEvents: 0 })
  }

  if (creatorsRes.status === "fulfilled" && creatorsRes.value.data) {
    for (const row of creatorsRes.value.data as {
      created_at: string; storefront_published_at: string | null; first_sale_at: string | null
    }[]) {
      const day = row.created_at.split("T")[0]
      const b = buckets.get(day)
      if (b) b.newCreators++

      if (row.storefront_published_at) {
        const pd = row.storefront_published_at.split("T")[0]
        const pb = buckets.get(pd)
        if (pb) pb.newPublished++
      }
      if (row.first_sale_at) {
        const sd = row.first_sale_at.split("T")[0]
        const sb = buckets.get(sd)
        if (sb) sb.newSales++
      }
    }
  }

  if (funnelRes.status === "fulfilled" && funnelRes.value.data) {
    for (const row of funnelRes.value.data as { event_name: string; occurred_at: string }[]) {
      const day = row.occurred_at.split("T")[0]
      const b = buckets.get(day)
      if (b) b.funnelEvents++
    }
  }

  return Array.from(buckets.values())
}

export interface CohortStats {
  tag: string
  count: number
  publishedCount: number
  salesCount: number
  publishRate: number
  salesRate: number
}

export async function getCohortStats(): Promise<CohortStats[]> {
  const supabase = createAdminClient()

  const { data: tags } = await supabase
    .from("creator_cohort_tags")
    .select("tag, creator_id")

  if (!tags) return []

  const tagMap = new Map<string, Set<string>>()
  for (const row of tags as { tag: string; creator_id: string }[]) {
    if (!tagMap.has(row.tag)) tagMap.set(row.tag, new Set())
    tagMap.get(row.tag)!.add(row.creator_id)
  }

  const stats: CohortStats[] = []

  const tagEntries = Array.from(tagMap.entries())
  for (const [tag, creatorIdSet] of tagEntries) {
    const ids = Array.from(creatorIdSet).slice(0, 100)
    if (ids.length === 0) continue

    const { data: profiles } = await supabase
      .from("creator_profiles")
      .select("id, is_published, first_sale_at")
      .in("id", ids)

    const rows = (profiles as { id: string; is_published: boolean; first_sale_at: string | null }[] | null) ?? []
    const published = rows.filter(r => r.is_published).length
    const sales = rows.filter(r => r.first_sale_at).length
    const total = creatorIdSet.size

    stats.push({
      tag,
      count: total,
      publishedCount: published,
      salesCount: sales,
      publishRate: total > 0 ? Math.round(published / total * 100) : 0,
      salesRate: total > 0 ? Math.round(sales / total * 100) : 0,
    })
  }

  return stats.sort((a, b) => b.count - a.count)
}

export interface AIAdoptionMetrics {
  totalGenerations: number
  uniqueCreators: number
  adoptionRate: number
  topUseCases: { useCase: string; count: number }[]
}

export async function getAIAdoptionMetrics(since?: Date): Promise<AIAdoptionMetrics> {
  const supabase = createAdminClient()
  const sinceDate = (since ?? new Date(Date.now() - 30 * 86_400_000)).toISOString()

  const [genRes, totalCreatorsRes] = await Promise.allSettled([
    supabase.from("ai_generations")
      .select("creator_id, generation_type")
      .gte("created_at", sinceDate),
    supabase.from("creator_profiles")
      .select("id", { count: "exact", head: true }),
  ])

  if (genRes.status !== "fulfilled" || !genRes.value.data) {
    return { totalGenerations: 0, uniqueCreators: 0, adoptionRate: 0, topUseCases: [] }
  }

  const rows = genRes.value.data as { creator_id: string; generation_type: string }[]
  const uniqueCreators = new Set(rows.map(r => r.creator_id)).size
  const total = totalCreatorsRes.status === "fulfilled" ? (totalCreatorsRes.value.count ?? 0) : 0

  const useCaseCounts = new Map<string, number>()
  for (const row of rows) {
    useCaseCounts.set(row.generation_type, (useCaseCounts.get(row.generation_type) ?? 0) + 1)
  }

  const topUseCases = Array.from(useCaseCounts.entries())
    .map(([useCase, count]) => ({ useCase, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalGenerations: rows.length,
    uniqueCreators,
    adoptionRate: total > 0 ? Math.round(uniqueCreators / total * 100) : 0,
    topUseCases,
  }
}
