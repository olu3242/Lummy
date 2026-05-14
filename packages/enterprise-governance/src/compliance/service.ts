import type { DatabaseClient } from "@lummy/db-core"
export class ComplianceExportService { constructor(private readonly db: DatabaseClient) {} async export(caseId: string, format: string) { return this.db.insert("compliance_exports", { case_id: caseId, format, created_at: new Date().toISOString() }) } }
