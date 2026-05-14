import type { TenantContext } from "../../shared-types/src"

export function assertTenantContext(ctx: Partial<TenantContext>): asserts ctx is TenantContext {
  if (!ctx.tenantId || !ctx.userId || !ctx.role || !ctx.correlationId) {
    throw new Error("Invalid tenant context")
  }
}
