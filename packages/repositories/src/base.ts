import type { TenantContext } from "@lummy/shared-types"
import type { TenantDatabaseClient } from "@lummy/db-core"

export abstract class BaseRepository {
  constructor(protected readonly tenantDb: TenantDatabaseClient) {}

  protected assertTenant(ctx: TenantContext) {
    if (ctx.tenantId !== this.tenantDb.ctx.tenantId) throw new Error("Tenant mismatch")
  }
}
