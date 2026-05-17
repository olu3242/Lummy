import type { DatabaseClient } from "@lummy/db-core"
export class RegionCoordinator { constructor(private readonly db: DatabaseClient) {} async register(regionCode: string, status: string) { return this.db.upsert("runtime_regions", { region_code: regionCode, status, updated_at: new Date().toISOString() }) } }
