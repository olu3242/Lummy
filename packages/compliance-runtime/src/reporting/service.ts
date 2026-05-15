import type { DatabaseClient } from "@lummy/db-core"
export class RegionalComplianceService { constructor(private readonly db: DatabaseClient) {} async report(jurisdiction: string, reportType: string, payload: Record<string, unknown>) { return this.db.insert("regional_compliance_reports", { jurisdiction, report_type: reportType, payload, created_at: new Date().toISOString() }) } }
