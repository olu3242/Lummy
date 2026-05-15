import type { DatabaseClient } from "@lummy/db-core"
export class ExperimentService { constructor(private readonly db: DatabaseClient) {} async create(tenantId: string, key: string, variantCount: number) { return this.db.insert("growth_experiments", { tenant_id: tenantId, experiment_key: key, variant_count: variantCount, created_at: new Date().toISOString() }) } }
