import type { TenantContext } from "../../shared-types/src"
import type { TenantDatabaseClient } from "../../db-core/src"

export abstract class BaseRepository {
  constructor(protected readonly tenantDb: TenantDatabaseClient) {}

  protected assertTenant(ctx: TenantContext) {
    if (ctx.tenantId !== this.tenantDb.ctx.tenantId) throw new Error("Tenant mismatch")
  }
}
