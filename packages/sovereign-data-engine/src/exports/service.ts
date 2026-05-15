import type { DatabaseClient } from "@lummy/db-core"
export class SovereignExportService { constructor(private readonly db: DatabaseClient) {} async exportAudit(country: string, exportType: string) { return this.db.insert("sovereign_audit_exports", { country, export_type: exportType, created_at: new Date().toISOString() }) } }
