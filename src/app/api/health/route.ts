import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

interface CheckResult {
  ok: boolean
  latencyMs?: number
  detail?: string
}

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ANTHROPIC_API_KEY",
  "PAYSTACK_SECRET_KEY",
] as const

async function checkEnvVars(): Promise<CheckResult> {
  const missing = REQUIRED_ENV.filter(k => !process.env[k])
  return missing.length === 0
    ? { ok: true }
    : { ok: false, detail: `Missing: ${missing.join(", ")}` }
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("creator_profiles").select("id").limit(1)
    const latencyMs = Date.now() - start
    return error
      ? { ok: false, latencyMs, detail: error.message }
      : { ok: true, latencyMs }
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, detail: String(err) }
  }
}

async function checkWebhookQueue(): Promise<CheckResult> {
  try {
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from("webhook_events")
      .select("id", { count: "exact", head: true })
      .in("status", ["failed", "dead"])

    if (error) return { ok: false, detail: error.message }
    const deadCount = count ?? 0
    return {
      ok: deadCount < 10,
      detail: `${deadCount} failed/dead events in queue`,
    }
  } catch (err) {
    return { ok: false, detail: String(err) }
  }
}

async function checkAI(): Promise<CheckResult> {
  return process.env.ANTHROPIC_API_KEY
    ? { ok: true, detail: "API key present" }
    : { ok: false, detail: "ANTHROPIC_API_KEY not set" }
}

async function checkPayments(): Promise<CheckResult> {
  return process.env.PAYSTACK_SECRET_KEY
    ? { ok: true, detail: "Paystack secret present" }
    : { ok: false, detail: "PAYSTACK_SECRET_KEY not set" }
}

export async function GET() {
  const [envResult, dbResult, webhookResult, aiResult, paymentsResult] =
    await Promise.all([
      checkEnvVars(),
      checkSupabase(),
      checkWebhookQueue(),
      checkAI(),
      checkPayments(),
    ])

  const checks = {
    env:      envResult,
    database: dbResult,
    webhooks: webhookResult,
    ai:       aiResult,
    payments: paymentsResult,
  }

  const allOk = Object.values(checks).every(c => c.ok)
  const status = allOk ? 200 : 503

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
      checks,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    }
  )
}
