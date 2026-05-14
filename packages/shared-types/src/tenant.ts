export type TenantId = string
export type UserId = string

export interface TenantContext {
  tenantId: TenantId
  userId: UserId
  role: "creator" | "customer" | "admin" | "system"
  correlationId: string
}
