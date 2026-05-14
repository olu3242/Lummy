import type { DatabaseClient } from "@lummy/db-core"
export class ProductRankingService { constructor(private readonly db: DatabaseClient) {} async save(tenantId: string, productId: string, score: number) { return this.db.upsert("product_rankings", { tenant_id: tenantId, product_id: productId, score, updated_at: new Date().toISOString() }) } }
