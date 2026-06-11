/**
 * Enterprise ops API — DLQ, workflow registry, AI cost summary, human queue
 * Admin-only (same guard as all /api/ops/* routes)
 */

import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("creator_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  const isAdmin =
    (profile as { is_admin?: boolean } | null)?.is_admin === true ||
    user.email?.endsWith("@lummy.co")

  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [dlqResult, workflowResult, aiCostResult, humanQueueResult] = await Promise.allSettled([
    // DLQ: failed automation events with attempt_count >= 3
    admin
      .from("automation_events")
      .select("id, event_name, creator_id, attempt_count, last_error, failed_at, created_at")
      .eq("processed", false)
      .gte("attempt_count", 3)
      .order("failed_at", { ascending: false })
      .limit(20),

    // Workflow registry
    admin
      .from("workflow_registry")
      .select("workflow_id, name, status, queue_name, sla_max_ms, rollout_pct, updated_at")
      .order("workflow_id"),

    // AI cost events last 7 days
    admin
      .from("ai_cost_events")
      .select("agent_name, cost_usd, input_tokens, output_tokens, created_at")
      .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()),

    // Human intervention queue — pending
    admin
      .from("human_intervention_queue")
      .select("id, workflow_id, event_type, severity, title, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  // Aggregate AI costs by agent
  const aiCostRaw = aiCostResult.status === "fulfilled" ? (aiCostResult.value.data ?? []) : []
  type AiCostRow = { agent_name: string; cost_usd: number; input_tokens: number; output_tokens: number }
  const aiByAgent: Record<string, { calls: number; costUsd: number; inputTokens: number; outputTokens: number }> = {}
  for (const row of aiCostRaw as AiCostRow[]) {
    const a = row.agent_name
    if (!aiByAgent[a]) aiByAgent[a] = { calls: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 }
    aiByAgent[a]!.calls++
    aiByAgent[a]!.costUsd      += Number(row.cost_usd)
    aiByAgent[a]!.inputTokens  += row.input_tokens
    aiByAgent[a]!.outputTokens += row.output_tokens
  }

  return NextResponse.json({
    dlq:            dlqResult.status === "fulfilled"        ? (dlqResult.value.data ?? [])       : [],
    workflows:      workflowResult.status === "fulfilled"   ? (workflowResult.value.data ?? [])  : [],
    aiCostByAgent:  aiByAgent,
    aiTotalCostUsd: Object.values(aiByAgent).reduce((s, v) => s + v.costUsd, 0),
    humanQueue:     humanQueueResult.status === "fulfilled" ? (humanQueueResult.value.data ?? []) : [],
  })
}
