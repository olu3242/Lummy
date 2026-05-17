import logger from "../logging/logger"
import { validateEnv } from "./env"
import { createAdminClient } from "@/lib/supabase/server"

export interface ReadinessCheck {
  name: string
  ok: boolean
  score: number
  latencyMs?: number
  detail?: string
  critical: boolean
}

export interface ReadinessReport {
  ready: boolean
  score: number
  timestamp: string
  environment: string
  checks: ReadinessCheck[]
  blockers: string[]
  warnings: string[]
}

export function ensurePaymentProvidersConfigured() {
  const hasPaystack = Boolean(process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET)
  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_WEBHOOK_SECRET)

  if (!hasPaystack && !hasStripe) {
    logger.error("No payment providers configured", { hasPaystack, hasStripe })
    throw new Error("No payment provider configured: set PAYSTACK_SECRET_KEY or STRIPE_SECRET_KEY")
  }

  logger.info("Payment providers readiness", { hasPaystack, hasStripe })
}

export function ensureRuntimeReadiness() {
  ensurePaymentProvidersConfigured()
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
    return {
      name: "database",
      ok: false,
      score: 0,
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : String(err),
      critical: true,
    }
  }
}

async function checkWebhookReadiness(): Promise<ReadinessCheck> {
  try {
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from("provider_webhook_events")
      .select("id", { count: "exact", head: true })

    if (error) throw error

    const recorded = count ?? 0
    return {
      name: "webhooks",
      ok: true,
      score: 100,
      detail: `${recorded} webhook events recorded`,
      critical: false,
    }
  } catch (err) {
    return {
      name: "webhooks",
      ok: false,
      score: 0,
      detail: err instanceof Error ? err.message : "Could not query webhook events",
      critical: false,
    }
  }
}

function checkServiceReadiness(name: string, envKeys: string[], critical: boolean): ReadinessCheck {
  const present = envKeys.some((key) => Boolean(process.env[key]))
  return {
    name,
    ok: present,
    score: present ? 100 : 0,
    detail: present ? "Configured" : `${envKeys.join(" or ")} not set`,
    critical,
  }
}

export async function computeReadiness(): Promise<ReadinessReport> {
  const [envCheck, dbCheck, webhookCheck] = await Promise.all([
    checkEnvReadiness(),
    checkDatabaseReadiness(),
    checkWebhookReadiness(),
  ])

  const aiCheck = checkServiceReadiness("ai", ["ANTHROPIC_API_KEY"], true)
  const paymentsCheck = checkServiceReadiness("payments", ["PAYSTACK_SECRET_KEY", "STRIPE_SECRET_KEY"], true)
  const waCheck = checkServiceReadiness("whatsapp", ["WHATSAPP_BUSINESS_TOKEN"], false)

  const checks: ReadinessCheck[] = [envCheck, dbCheck, webhookCheck, aiCheck, paymentsCheck, waCheck]
  const totalWeight = checks.reduce((sum, check) => sum + (check.critical ? 20 : 10), 0)
  const achieved = checks.reduce((sum, check) => sum + (check.score / 100) * (check.critical ? 20 : 10), 0)
  const score = Math.round((achieved / totalWeight) * 100)
  const blockers = checks.filter((check) => check.critical && !check.ok).map((check) => `${check.name}: ${check.detail}`)
  const warnings = checks.filter((check) => !check.critical && !check.ok).map((check) => `${check.name}: ${check.detail}`)

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
