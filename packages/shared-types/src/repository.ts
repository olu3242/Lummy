import type { TenantContext } from "./tenant"

export interface RepositoryInput<T> {
  ctx: TenantContext
  data: T
}

export interface PaginationQuery {
  limit?: number
  offset?: number
}
