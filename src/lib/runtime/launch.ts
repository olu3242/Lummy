import { createAdminClient } from "@/lib/supabase/server"

export interface LaunchCheck {
  name: string
  category: "infra" | "payments" | "ai" | "storage" | "security"
  ok: boolean
  detail?: string
  required: boolean
}

export interface LaunchReadinessReport {
  ready: boolean
  score: number
  blockers: string[]
  warnings: string[]
  checks: LaunchCheck[]
}

export async function computeLaunchReadiness(): Promise<LaunchReadinessReport> {
  const checks: LaunchCheck[] = []

  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PAYSTACK_SECRET_KEY",
    "ANTHROPIC_API_KEY",
  ]
  const optionalEnv = ["CRON_SECRET", "NEXT_PUBLIC_APP_URL", "WHATSAPP_BUSINESS_TOKEN"]

  for (const key of requiredEnv) {
    checks.push({
      name: `ENV: ${key}`,
      category: "infra",
      ok: !!process.env[key],
      detail: process.env[key] ? undefined : "Missing required env var",
      required: true,
    })
  }
  for (const key of optionalEnv) {
    checks.push({
      name: `ENV: ${key}`,
      category: "infra",
      ok: !!process.env[key],
      detail: process.env[key] ? undefined : "Optional but recommended",
      required: false,
    })
  }

  // Database
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("creator_profiles").select("id", { count: "exact", head: true })
    checks.push({ name: "Database connectivity", category: "infra", ok: !error, detail: error?.message, required: true })
  } catch (err) {
    checks.push({ name: "Database connectivity", category: "infra", ok: false, detail: String(err), required: true })
  }

  // Paystack
  const paystackKey = process.env.PAYSTACK_SECRET_KEY ?? ""
  checks.push({
    name: "Paystack key configured",
    category: "payments",
    ok: paystackKey.startsWith("sk_live_") || paystackKey.startsWith("sk_test_"),
    required: true,
  })
  checks.push({
    name: "Paystack live mode",
    category: "payments",
    ok: paystackKey.startsWith("sk_live_"),
    detail: paystackKey.startsWith("sk_test_") ? "Switch to live key before launch" : undefined,
    required: false,
  })

  // AI
  checks.push({
    name: "Anthropic API key configured",
    category: "ai",
    ok: !!process.env.ANTHROPIC_API_KEY,
    required: true,
  })

  // Storage
  checks.push({
    name: "Supabase storage configured",
    category: "storage",
    ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    required: true,
  })

  // Security
  checks.push({
    name: "CRON_SECRET set",
    category: "security",
    ok: !!process.env.CRON_SECRET,
    detail: "Protects /api/jobs/run from public abuse",
    required: false,
  })

  const required = checks.filter(c => c.required)
  const passed = required.filter(c => c.ok).length
  const score = required.length > 0 ? Math.round(passed / required.length * 100) : 100
  const blockers = checks.filter(c => c.required && !c.ok).map(c => c.name)
  const warnings = checks
    .filter(c => !c.required && !c.ok)
    .map(c => `${c.name}${c.detail ? `: ${c.detail}` : ""}`)

  return { ready: blockers.length === 0, score, blockers, warnings, checks }
}
