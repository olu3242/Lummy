import type { DatabaseClient } from "@lummy/db-core"
export class InvestigationService { constructor(private readonly db: DatabaseClient) {} async open(caseKey: string, severity: string) { return this.db.insert("investigation_cases", { case_key: caseKey, severity, status: "open", created_at: new Date().toISOString() }) } }
