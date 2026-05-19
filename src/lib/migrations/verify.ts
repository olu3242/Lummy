import { createAdminClient } from "@/lib/supabase/server"

export interface TablePresenceCheck {
  table: string
  exists: boolean
  required: boolean
}

export interface MigrationHealthReport {
  generatedAt: string
  score: number
  tablesChecked: number
  tablesPresent: number
  missing: string[]
  checks: TablePresenceCheck[]
}

// Core tables introduced across migrations 001-009
const REQUIRED_TABLES: string[] = [
  "creator_profiles",
  "products",
  "orders",
  "transactions",
  "notifications",
  "webhook_events",
  "whatsapp_events",
  "ai_generations",
  "feature_flags",
  "job_runs",
  "creator_referrals",
  "creator_collaborations",
  "creator_action_completions",
  "creator_monetization_milestones",
]

const OPTIONAL_TABLES: string[] = [
  "campaign_attributions",
  "ecosystem_participation_events",
  "onboarding_steps",
  "support_tickets",
]

export async function verifyMigrationHealth(): Promise<MigrationHealthReport> {
  const supabase = createAdminClient()
  const checks: TablePresenceCheck[] = []

  const allTables = [
    ...REQUIRED_TABLES.map(t => ({ table: t, required: true })),
    ...OPTIONAL_TABLES.map(t => ({ table: t, required: false })),
  ]

  for (const { table, required } of allTables) {
    const { error } = await supabase
      .from(table as never)
      .select("*", { count: "exact", head: true })
      .limit(0)

    // error.code === '42P01' means table doesn't exist; other errors = exists but permission denied (still ok)
    const exists = !error || error.code !== "42P01"
    checks.push({ table, exists, required })
  }

  const required = checks.filter(c => c.required)
  const present  = required.filter(c => c.exists)
  const missing  = required.filter(c => !c.exists).map(c => c.table)
  const score    = required.length > 0 ? Math.round(present.length / required.length * 100) : 100

  return {
    generatedAt: new Date().toISOString(),
    score,
    tablesChecked: checks.length,
    tablesPresent: checks.filter(c => c.exists).length,
    missing,
    checks,
  }
}
