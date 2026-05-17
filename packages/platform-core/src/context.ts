import type { TenantContext } from "@lummy/shared-types"

export function assertTenantContext(ctx: Partial<TenantContext>): asserts ctx is TenantContext {
  if (!ctx.tenantId || !ctx.userId || !ctx.role || !ctx.correlationId) {
    throw new Error("Invalid tenant context")
  }
}
