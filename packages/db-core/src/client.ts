import type { DatabaseClient } from "./types"
import type { TenantContext } from "@lummy/shared-types"

export interface TenantDatabaseClient {
  ctx: TenantContext
  db: DatabaseClient
}

export function withTenantDb(ctx: TenantContext, db: DatabaseClient): TenantDatabaseClient {
  return { ctx, db }
}
