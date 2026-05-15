import type { DomainEventName } from "@lummy/shared-types"
import type { AgentType } from "../registry/types"

const routes: Partial<Record<DomainEventName, AgentType[]>> = {
  "order.created": ["AUTOMATION", "ANALYTICS"],
  "order.status_changed": ["AUTOMATION", "TELEMETRY"],
  "campaign.created": ["AUTOMATION", "COMMUNICATION", "ANALYTICS"],
  "review.created": ["TRUST", "ANALYTICS"],
  "telemetry.recorded": ["TELEMETRY"],
}

export function routeAgents(eventName: DomainEventName): AgentType[] {
  return routes[eventName] || ["ORCHESTRATOR"]
}
