import type { JobEnvelope, QueueName } from "../contracts/types"

export type FailureDomain = "worker" | "redis" | "provider" | "payment" | "replay" | "queue"
export interface ChaosScenario { id: string; domain: FailureDomain; queue?: QueueName; enabled: boolean; probability: number; metadata?: Record<string, unknown> }
export interface ChaosDecision { inject: boolean; reason?: string; metadata?: Record<string, unknown> }

export class FailureInjectionService {
  private readonly scenarios = new Map<string, ChaosScenario>()
  register(scenario: ChaosScenario) { this.scenarios.set(scenario.id, scenario) }
  disable(id: string) { const existing = this.scenarios.get(id); if (existing) this.scenarios.set(id, { ...existing, enabled: false }) }
  decide(input: { scenarioId: string; queue?: QueueName; job?: JobEnvelope }): ChaosDecision {
    const scenario = this.scenarios.get(input.scenarioId)
    if (!scenario || !scenario.enabled) return { inject: false }
    if (scenario.queue && input.queue && scenario.queue !== input.queue) return { inject: false }
    const deterministicRoll = this.hashToFloat(`${input.job?.jobId ?? "no-job"}:${scenario.id}:${input.job?.attempt ?? 0}`)
    return deterministicRoll <= scenario.probability ? { inject: true, reason: `scenario:${scenario.id}`, metadata: scenario.metadata } : { inject: false }
  }
  list() { return [...this.scenarios.values()] }
  private hashToFloat(value: string): number { let hash = 2166136261; for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619) } return ((hash >>> 0) / 0xffffffff) || 0 }
}
