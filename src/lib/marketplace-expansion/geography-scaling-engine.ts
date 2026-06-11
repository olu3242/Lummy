/**
 * Geography Scaling Engine — analyzes creator density by region and identifies
 * underserved markets with expansion potential.
 *
 * Reads from: creator_profiles (location field)
 * Emits:      geography_expansion_opportunity
 */

import { createAdminClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/automation/sdk"
import { logger } from "@/lib/observability/logger"
import { generateCorrelationId } from "@/lib/observability/correlation"
import type { ExpansionIntelligenceRunResult } from "./expansion-events"

// Known Nigerian metro regions for density analysis
const METRO_REGIONS = [
  "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan",
  "Enugu", "Calabar", "Benin City", "Warri", "Owerri",
]

function detectRegion(location: string | null): string | null {
  if (!location) return null
  const upper = location.toUpperCase()
  return METRO_REGIONS.find(r => upper.includes(r.toUpperCase())) ?? null
}

export async function runGeographyScalingEngine(): Promise<ExpansionIntelligenceRunResult> {
  const start = Date.now()
  const supabase = createAdminClient()
  const correlationId = generateCorrelationId("geo")
  const today = new Date().toISOString().split("T")[0]
  const signals: string[] = []
  let eventsEmitted = 0

  try {
    const { data: profiles } = await supabase
      .from("creator_profiles")
      .select("id, location, niche, is_published")
      .eq("is_published", true)
      .limit(1000)

    const regionMap = new Map<string, { creators: number; niches: Set<string> }>()
    let unlocated = 0

    for (const p of (profiles ?? []) as { id: string; location: string | null; niche: string | null }[]) {
      const region = detectRegion(p.location)
      if (!region) { unlocated++; continue }

      const c = regionMap.get(region) ?? { creators: 0, niches: new Set() }
      c.creators++
      if (p.niche) c.niches.add(p.niche)
      regionMap.set(region, c)
    }

    // Identify underserved regions: <5 creators = emerging opportunity
    for (const region of METRO_REGIONS) {
      const data  = regionMap.get(region) ?? { creators: 0, niches: new Set() }
      const market: "small" | "medium" | "large" =
        ["Lagos", "Abuja", "Port Harcourt"].includes(region) ? "large" :
        ["Kano", "Ibadan", "Enugu"].includes(region) ? "medium" :
        "small"

      const growthSignal: "emerging" | "growing" | "mature" =
        data.creators < 3  ? "emerging" :
        data.creators < 10 ? "growing" :
        "mature"

      if (growthSignal === "emerging" && market !== "small") {
        await emitEvent("geography_expansion_opportunity", {
          tenantId: "platform", correlationId,
        }, {
          region,
          creatorCount:       data.creators,
          marketSize:         market,
          growthSignal,
          underservedNiches:  METRO_REGIONS.filter(r => !data.niches.has(r)),
          snapshotDate:       today,
        }, `geo_expansion:${region}:${today}`)
        eventsEmitted++
        signals.push(`geo:${region}:${growthSignal}:${data.creators}creators`)
      }
    }

    logger.info("[geography-scaling] engine complete", {
      regions: regionMap.size, eventsEmitted, unlocated, correlationId,
    })
  } catch (err) {
    logger.error("[geography-scaling] engine failed", { error: String(err) })
  }

  return { module: "geography-scaling", eventsEmitted, alertsRaised: 0, durationMs: Date.now() - start, signals }
}
