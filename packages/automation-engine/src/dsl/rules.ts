export type AutomationTrigger =
  | "order.created"
  | "order.abandoned"
  | "review.request_due"
  | "inventory.low_stock"

export type AutomationActionType =
  | "enqueue.messaging"
  | "enqueue.analytics"
  | "enqueue.ai"

export interface AutomationCondition {
  field: string
  operator: "eq" | "neq" | "gt" | "lt" | "contains"
  value: string | number | boolean
}

export interface AutomationAction {
  type: AutomationActionType
  payload: Record<string, unknown>
}

export interface AutomationRule {
  id: string
  tenantId: string
  name: string
  enabled: boolean
  trigger: AutomationTrigger
  conditions: AutomationCondition[]
  actions: AutomationAction[]
}
