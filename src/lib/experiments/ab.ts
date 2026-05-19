import { createAdminClient } from "@/lib/supabase/server"

export type ExperimentKey = "onboarding_cta" | "storefront_hero" | "whatsapp_cta"

export interface ExperimentAssignment {
  experimentKey: ExperimentKey
  variant: string
  isControl: boolean
}

// Deterministic bucket assignment — no DB write needed for reads
function deterministicVariant(creatorId: string, experimentKey: string, variants: string[]): string {
  const hash = (creatorId + experimentKey).split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 0)
  return variants[hash % variants.length]
}

const VARIANT_CACHE = new Map<string, { variants: string[]; active: boolean }>()
let cacheAt = 0
const TTL = 120_000

async function loadExperiments(): Promise<void> {
  const supabase = createAdminClient()
  const { data } = await supabase.from("experiments").select("key, variants, active").eq("active", true)
  VARIANT_CACHE.clear()
  if (data) {
    for (const row of data as { key: string; variants: string[]; active: boolean }[]) {
      VARIANT_CACHE.set(row.key, { variants: row.variants, active: row.active })
    }
  }
  cacheAt = Date.now()
}

async function ensureLoaded(): Promise<void> {
  if (Date.now() - cacheAt > TTL) {
    try { await loadExperiments() } catch {}
  }
}

export async function getVariant(
  creatorId: string,
  experimentKey: ExperimentKey
): Promise<ExperimentAssignment> {
  await ensureLoaded()
  const exp = VARIANT_CACHE.get(experimentKey)
  if (!exp || !exp.active) {
    return { experimentKey, variant: "control", isControl: true }
  }

  const variant = deterministicVariant(creatorId, experimentKey, exp.variants)

  // Upsert assignment (best-effort, non-blocking)
  const supabase = createAdminClient()
  void Promise.resolve(
    supabase.from("experiment_assignments").upsert(
      { experiment_key: experimentKey, creator_id: creatorId, variant },
      { onConflict: "experiment_key,creator_id", ignoreDuplicates: true }
    )
  ).catch(() => {})

  return { experimentKey, variant, isControl: variant === "control" }
}

export async function recordConversion(creatorId: string, experimentKey: ExperimentKey): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from("experiment_assignments")
    .update({ converted: true, converted_at: new Date().toISOString() })
    .eq("experiment_key", experimentKey)
    .eq("creator_id", creatorId)
    .eq("converted", false)
}

export interface ExperimentResults {
  experimentKey: string
  variants: Array<{
    variant: string
    assigned: number
    converted: number
    conversionRate: number
  }>
}

export async function getExperimentResults(experimentKey: ExperimentKey): Promise<ExperimentResults> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("experiment_assignments")
    .select("variant, converted")
    .eq("experiment_key", experimentKey)

  const rows = (data as { variant: string; converted: boolean }[] | null) ?? []
  const byVariant = new Map<string, { assigned: number; converted: number }>()

  for (const row of rows) {
    if (!byVariant.has(row.variant)) byVariant.set(row.variant, { assigned: 0, converted: 0 })
    const v = byVariant.get(row.variant)!
    v.assigned++
    if (row.converted) v.converted++
  }

  const variants = Array.from(byVariant.entries()).map(([variant, stats]) => ({
    variant,
    assigned: stats.assigned,
    converted: stats.converted,
    conversionRate: stats.assigned > 0 ? Math.round(stats.converted / stats.assigned * 1000) / 10 : 0,
  }))

  return { experimentKey, variants }
}
