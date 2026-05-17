import type { DatabaseClient } from "@lummy/db-core"

export function ensureCommerceOrchestratorEnabled(): void {
  const enabled = process.env.COMMERCE_ORCHESTRATOR_ENABLED
  if (enabled === "false") {
    throw new Error("Commerce orchestrator runtime is disabled. Set COMMERCE_ORCHESTRATOR_ENABLED=true to enable it.")
  }
}

export async function validateCommerceOrchestratorDatabase(db: DatabaseClient): Promise<void> {
  try {
    await db.select("orders", { tenant_id: "health-check" })
  } catch (error) {
    throw new Error(`Commerce orchestrator database readiness failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
