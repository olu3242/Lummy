export type AgentType =
  | "ARCH"
  | "SECURITY"
  | "ORCHESTRATOR"
  | "EXECUTION"
  | "AUTOMATION"
  | "AI"
  | "TELEMETRY"
  | "GOVERNANCE"
  | "VALIDATION"
  | "RECOVERY"
  | "TRUST"
  | "PAYMENT"
  | "COMMUNICATION"
  | "ANALYTICS"

export interface AgentDefinition {
  agentId: string
  type: AgentType
  name: string
  version: string
  enabled: boolean
  maxRetries: number
  timeoutMs: number
  permissions: string[]
}
