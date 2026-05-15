import type { DatabaseClient } from "@lummy/db-core"
export class EvaluationService { constructor(private readonly db: DatabaseClient) {} async record(runId: string, score: number, notes: string) { return this.db.insert("ai_evaluations", { run_id: runId, score, notes, created_at: new Date().toISOString() }) } }
