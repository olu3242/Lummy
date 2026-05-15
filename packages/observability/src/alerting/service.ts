import type { DatabaseClient } from "@lummy/db-core"
export class AlertingService { constructor(private readonly db: DatabaseClient) {} async emit(severity: string, summary: string, payload: Record<string, unknown>) { return this.db.insert("operational_alerts", { severity, summary, payload, created_at: new Date().toISOString() }) } }
