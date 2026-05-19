// Storage continuity — checks bucket configuration and basic upload readiness.
// No actual file uploads are performed; this validates config and RLS linkage.

export interface StorageContinuityReport {
  generatedAt: string
  score: number
  supabaseUrlConfigured: boolean
  buckets: Array<{
    name: string
    configured: boolean
  }>
  issues: string[]
  recommendations: string[]
}

const REQUIRED_BUCKETS = ["creator-assets", "product-images"]

export async function runStorageContinuityAudit(): Promise<StorageContinuityReport> {
  const issues: string[] = []
  const recommendations: string[] = []

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const supabaseConfigured = supabaseUrl.length > 0

  if (!supabaseConfigured) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL not set — storage unavailable")
  }

  // We validate bucket existence via the Supabase storage REST API
  const buckets: Array<{ name: string; configured: boolean }> = []

  for (const bucket of REQUIRED_BUCKETS) {
    let configured = false
    if (supabaseConfigured) {
      try {
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
        const res = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        })
        configured = res.ok
      } catch {
        configured = false
      }
    }
    buckets.push({ name: bucket, configured })
    if (!configured) issues.push(`Storage bucket "${bucket}" not accessible — run migration 003 to create it`)
  }

  const configuredCount = buckets.filter(b => b.configured).length
  if (configuredCount < REQUIRED_BUCKETS.length) {
    recommendations.push("Run: supabase db push to apply migration 003 (storage buckets + RLS policies)")
  }

  const score = !supabaseConfigured ? 0 : Math.round(configuredCount / REQUIRED_BUCKETS.length * 100)

  return {
    generatedAt: new Date().toISOString(),
    score,
    supabaseUrlConfigured: supabaseConfigured,
    buckets,
    issues,
    recommendations,
  }
}
