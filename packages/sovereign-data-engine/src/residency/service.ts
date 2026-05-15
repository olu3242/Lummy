import type { DatabaseClient } from "@lummy/db-core"
export class DataResidencyService { constructor(private readonly db: DatabaseClient) {} async setRule(country: string, dataset: string, residencyRegion: string) { return this.db.upsert("data_residency_rules", { country, dataset, residency_region: residencyRegion, updated_at: new Date().toISOString() }) } }
