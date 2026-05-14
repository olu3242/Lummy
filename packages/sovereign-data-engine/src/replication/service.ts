import type { DatabaseClient } from "@lummy/db-core"
export class CrossRegionReplicationService { constructor(private readonly db: DatabaseClient) {} async log(sourceRegion: string, targetRegion: string, status: string) { return this.db.insert("cross_region_replication_logs", { source_region: sourceRegion, target_region: targetRegion, status, created_at: new Date().toISOString() }) } }
