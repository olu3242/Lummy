import { validateEnv } from "./env"
import { createAdminClient } from "@/lib/supabase/server"

export interface ReadinessCheck {
  name: string
  ok: boolean
  score: number    // 0-100
  latencyMs?: number
  detail?: string
  critical: boolean
}

export interface ReadinessReport {
  ready: boolean
  score: number    // weighted 0-100
  timestamp: string
  environment: string
  checks: ReadinessCheck[]
  blockers: string[]
  warnings: string[]
}

async function checkEnvReadiness(): Promise<ReadinessCheck> {
  const result = validateEnv()
  return {
    name: "environment",
    ok: result.valid,
    score: result.score,
    detail: result.valid ? `${result.present.length} vars configured` : `Missing: ${result.missing.join(", ")}`,
    critical: true,
  }
}

async function checkDatabaseReadiness(): Promise<ReadinessCheck> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("creator_profiles").select("id").limit(1)
    const latencyMs = Date.now() - start
    return {
      name: "database",
      ok: !error,
      score: error ? 0 : latencyMs < 500 ? 100 : latencyMs < 1000 ? 70 : 40,
      latencyMs,
      detail: error ? error.message : `${latencyMs}ms`,
      critical: true,
    }
  } catch (err) {
    return { name: "database", ok: false, score: 0, latencyMs: Date.now() - start, detail: String(err), critical: true }
  }
}

async function checkWebhookReadiness(): Promise<ReadinessCheck> {
  try {
    const supabase = createAdminClient()
    const { count } = await supabase
      .from("webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "dead")

    const dead = count ?? 0
    return {
      name: "webhooks",
      ok: dead === 0,
      score: dead === 0 ? 100 : dead < 5 ? 60 : 20,
      detail: `${dead} dead-lettered events`,
      critical: false,
    }
  } catch {
    return { name: "webhooks", ok: false, score: 0, detail: "Could not query webhook_events", critical: false }
  }
}

function checkServiceReadiness(name: string, envKey: string, critical: boolean): ReadinessCheck {
  const present = !!process.env[envKey]
  return {
    name,
    ok: present,
    score: present ? 100 : 0,
    detail: present ? "Configured" : `${envKey} not set`,
    critical,
  }
}

export async function computeReadiness(): Promise<ReadinessReport> {
  const [envCheck, dbCheck, webhookCheck] = await Promise.all([
    checkEnvReadiness(),
    checkDatabaseReadiness(),
    checkWebhookReadiness(),
  ])

  const aiCheck    = checkServiceReadiness("ai",       "ANTHROPIC_API_KEY",   true)
  const paymentsCheck = checkServiceReadiness("payments", "PAYSTACK_SECRET_KEY", true)
  const waCheck    = checkServiceReadiness("whatsapp", "WHATSAPP_BUSINESS_TOKEN", false)

  const checks: ReadinessCheck[] = [envCheck, dbCheck, webhookCheck, aiCheck, paymentsCheck, waCheck]

  // Weighted score: critical checks = 20pts each, non-critical = 10pts
  const totalWeight = checks.reduce((s, c) => s + (c.critical ? 20 : 10), 0)
  const achieved    = checks.reduce((s, c) => s + (c.score / 100) * (c.critical ? 20 : 10), 0)
  const score       = Math.round((achieved / totalWeight) * 100)

  const blockers = checks.filter(c => c.critical && !c.ok).map(c => `${c.name}: ${c.detail}`)
  const warnings = checks.filter(c => !c.critical && !c.ok).map(c => `${c.name}: ${c.detail}`)

  return {
    ready: blockers.length === 0,
    score,
    timestamp: new Date().toISOString(),
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
    checks,
    blockers,
    warnings,
  }
}
