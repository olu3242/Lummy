import type { DatabaseClient } from "./types"
<<<<<<< HEAD
import type { TenantContext } from "@lummy/shared-types"
=======
import type { TenantContext } from "../../shared-types/src"
>>>>>>> main

export interface TenantDatabaseClient {
  ctx: TenantContext
  db: DatabaseClient
}

export function withTenantDb(ctx: TenantContext, db: DatabaseClient): TenantDatabaseClient {
  return { ctx, db }
}
