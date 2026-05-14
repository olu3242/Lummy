import type { DatabaseClient } from "./types"
import type { TenantContext } from "../../shared-types/src"

export interface TenantDatabaseClient {
  ctx: TenantContext
  db: DatabaseClient
}

export function withTenantDb(ctx: TenantContext, db: DatabaseClient): TenantDatabaseClient {
  return { ctx, db }
}
