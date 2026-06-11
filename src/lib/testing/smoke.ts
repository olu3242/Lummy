import { createAdminClient } from "@/lib/supabase/server"

export interface SmokeResult {
  name: string
  ok: boolean
  latencyMs: number
  detail?: string
}

export async function smokeDatabase(): Promise<SmokeResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("creator_profiles")
      .select("id")
      .limit(1)
    return { name: "database_read", ok: !error, latencyMs: Date.now() - start, detail: error?.message }
  } catch (err) {
    return { name: "database_read", ok: false, latencyMs: Date.now() - start, detail: String(err) }
  }
}

export async function smokeWebhookTable(): Promise<SmokeResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("webhook_events")
      .select("id")
      .limit(1)
    return { name: "webhook_table", ok: !error, latencyMs: Date.now() - start, detail: error?.message }
  } catch (err) {
    return { name: "webhook_table", ok: false, latencyMs: Date.now() - start, detail: String(err) }
  }
}

export async function smokeNotificationTable(): Promise<SmokeResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("notifications")
      .select("id")
      .limit(1)
    return { name: "notification_table", ok: !error, latencyMs: Date.now() - start, detail: error?.message }
  } catch (err) {
    return { name: "notification_table", ok: false, latencyMs: Date.now() - start, detail: String(err) }
  }
}

export async function smokeAIConfig(): Promise<SmokeResult> {
  const start = Date.now()
  const ok = !!process.env.ANTHROPIC_API_KEY
  return { name: "ai_config", ok, latencyMs: Date.now() - start, detail: ok ? "key present" : "ANTHROPIC_API_KEY missing" }
}

export async function smokeStorageConfig(): Promise<SmokeResult> {
  const start = Date.now()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ok = !!(supabaseUrl && serviceKey)
  return {
    name: "storage_config",
    ok,
    latencyMs: Date.now() - start,
    detail: ok ? "Storage credentials present" : "Missing Supabase credentials",
  }
}

export async function runAllSmokeTests(): Promise<{
  allPassed: boolean
  results: SmokeResult[]
  failedCount: number
}> {
  const results = await Promise.all([
    smokeDatabase(),
    smokeWebhookTable(),
    smokeNotificationTable(),
    smokeAIConfig(),
    smokeStorageConfig(),
  ])

  const failedCount = results.filter(r => !r.ok).length
  return { allPassed: failedCount === 0, results, failedCount }
}
