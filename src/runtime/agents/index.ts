/**
 * Canonical AI agent runtime — re-exports the AI gateway.
 * ALL AI inference must route through callAgent(). No direct Anthropic client instantiation.
 */
export {
  callAgent,
  generateText,
  generateWithAgent,
  AGENTS,
  MODELS,
  type AgentName,
  type GenerationType,
  type GatewayRequest,
  type GatewayResult,
} from "@/lib/ai/gateway"
