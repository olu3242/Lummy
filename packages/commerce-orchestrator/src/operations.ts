import { CANONICAL_COMMERCE_FLOW, type CommerceOrderState } from "./types"

export interface CommerceOperationsSnapshot {
  canonicalFlow: readonly CommerceOrderState[]
  queueLatencyMs: number
  failedWorkflows: number
  replayEvents: number
  retryRate: number
  abandonedConversations: number
}

export function createEmptyCommerceOperationsSnapshot(): CommerceOperationsSnapshot {
  return {
    canonicalFlow: CANONICAL_COMMERCE_FLOW,
    queueLatencyMs: 0,
    failedWorkflows: 0,
    replayEvents: 0,
    retryRate: 0,
    abandonedConversations: 0,
  }
}
