import { createAdminClient } from "@/lib/supabase/server"

interface FeatureFlag {
  key: string
  enabled: boolean
  rolloutPct: number
  description?: string
}

// In-process cache: refresh every 60s
let cache: Map<string, FeatureFlag> = new Map()
let cacheAt = 0
const TTL_MS = 60_000

async function loadFlags(): Promise<Map<string, FeatureFlag>> {
  const supabase = createAdminClient()
  const { data } = await supabase.from("feature_flags").select("key, enabled, rollout_pct, description")
  const map = new Map<string, FeatureFlag>()
  if (data) {
    for (const row of data as { key: string; enabled: boolean; rollout_pct: number; description: string | null }[]) {
      map.set(row.key, {
        key: row.key,
        enabled: row.enabled,
        rolloutPct: row.rollout_pct,
        description: row.description ?? undefined,
      })
    }
  }
  return map
}

async function getFlags(): Promise<Map<string, FeatureFlag>> {
  if (Date.now() - cacheAt < TTL_MS && cache.size > 0) return cache
  try {
    cache = await loadFlags()
    cacheAt = Date.now()
  } catch {
    // Use stale cache on failure
  }
  return cache
}

export async function isEnabled(key: string, creatorId?: string): Promise<boolean> {
  try {
    const flags = await getFlags()
    const flag = flags.get(key)
    if (!flag || !flag.enabled) return false
    if (flag.rolloutPct >= 100) return true
    if (flag.rolloutPct <= 0) return false
    // Deterministic rollout: hash creatorId into bucket 0-99
    if (creatorId) {
      const hash = creatorId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
      return (hash % 100) < flag.rolloutPct
    }
    return false
  } catch {
    return false
  }
}

export async function getAllFlags(): Promise<FeatureFlag[]> {
  try {
    const flags = await getFlags()
    return Array.from(flags.values())
  } catch {
    return []
  }
}

export async function setFlag(key: string, enabled: boolean, rolloutPct?: number): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from("feature_flags").upsert(
    { key, enabled, rollout_pct: rolloutPct ?? (enabled ? 100 : 0), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  )
  cache.clear()
  cacheAt = 0
}
